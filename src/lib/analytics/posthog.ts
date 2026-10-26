/**
 * PILOTAGE DU SDK PostHog — le seul endroit qui le charge, l'initialise et
 * l'arrête.
 *
 * DEUX RÉGIMES, ET C'EST EUX QU'IL FAUT VÉRIFIER À CHAQUE RELECTURE.
 *
 * 1. SANS CONSENTEMENT (visiteur qui refuse, ou qui n'a pas encore répondu) :
 *    comptage sans cookie exempté de consentement. Le SDK tourne en
 *    `cookieless_mode: "on_reject"` : aucun cookie `ph_…`, aucune entrée
 *    `localStorage`, l'identité de visite est un hachage calculé par PostHog
 *    sur ses serveurs et renouvelé chaque jour. `filtreSansConsentement` ne
 *    laisse partir que les vues de page et la trace du choix : ni clics, ni
 *    défilement, ni carte de chaleur, ni rejeu. Ce périmètre (pages vues,
 *    provenance) est celui que la CNIL dispense de consentement.
 *
 * 2. AVEC CONSENTEMENT : mesure complète, cookies et rejeu selon les cases.
 *
 * Pourquoi ce comptage existe (2026-10-26) : un prospect arrivé par une IA
 * n'avait laissé aucune trace, parce que la mesure ne voyait que les visiteurs
 * qui acceptaient, soit quelques-uns par semaine. La provenance de chaque
 * visite est ce qu'on cherche ; elle ne demande aucun identifiant durable.
 *
 * `posthog-js` reste chargé par un `import()` DYNAMIQUE : un import statique
 * s'exécuterait au rendu serveur et avant que le choix soit lu.
 */
import type { PostHog } from "posthog-js";

import {
  POSTHOG_KEY,
  POSTHOG_PROXY_PATH,
  POSTHOG_UI_HOST,
  isAnalyticsConfigured,
} from "./config";
import { CONSENT_TTL_DAYS, type ConsentChoices } from "./consent";

type Properties = Record<string, unknown>;

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
/** Vrai seulement quand le visiteur a accepté la mesure d'audience. */
let consentGranted = false;

/**
 * Ce qui part SANS consentement, énuméré. Tout le reste est jeté avant l'envoi.
 * `consent_updated` y figure pour connaître la part de refus, sans identifiant.
 */
const EVENEMENTS_SANS_CONSENTEMENT = new Set([
  "$pageview",
  "$pageleave",
  "consent_updated",
]);

/**
 * Droit d'opposition au comptage sans cookie : le signal « Ne pas suivre » ou
 * Global Privacy Control du navigateur. Le SDK, lui, le traite comme un refus
 * et compterait encore sans cookie ; c'est ici qu'il devient « rien du tout ».
 */
function oppositionSignalee(): boolean {
  const nav = window.navigator as Navigator & { globalPrivacyControl?: unknown };
  const win = window as Window & { doNotTrack?: unknown };
  return (
    nav.doNotTrack === "1" ||
    win.doNotTrack === "1" ||
    nav.globalPrivacyControl === true
  );
}

function filtreSansConsentement<T extends { event: string }>(
  event: T | null,
): T | null {
  if (!event || consentGranted) return event;
  if (oppositionSignalee()) return null;
  return EVENEMENTS_SANS_CONSENTEMENT.has(event.event) ? event : null;
}

/*
 * ÉTAT « la mesure tourne », exposé comme un MAGASIN EXTERNE.
 *
 * Le démarrage est asynchrone (import dynamique), donc React ne peut pas le
 * déduire de ses propres props. Le passer par `useSyncExternalStore` plutôt que
 * par un `setState` dans un effet est ce qui permet à `AnalyticsRuntime` de ne
 * faire, dans son effet, que ce qu'un effet doit faire : synchroniser un
 * système externe. Voir `react-hooks/set-state-in-effect`.
 */
let running = false;
const listeners = new Set<() => void>();

function notify(next: boolean): void {
  if (running === next) return;
  running = next;
  for (const listener of listeners) listener();
}

export function subscribeAnalytics(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAnalyticsSnapshot(): boolean {
  return running;
}

/** Rien ne tourne au rendu serveur, par construction. */
export function getAnalyticsServerSnapshot(): boolean {
  return false;
}

/**
 * Sélecteur des textes MASQUÉS dans les rejeux de session.
 *
 * `maskAllInputs` couvre les champs de saisie. Il ne couvre PAS le texte déjà
 * présent dans la page, or c'est là que se trouve le reste : une confirmation
 * d'envoi qui répète le message, une adresse e-mail affichée après soumission,
 * un récapitulatif. Tout élément portant `data-ph-mask` ou la classe `ph-mask`
 * est remplacé par des astérisques dans le rejeu, et `ph-no-capture` retire
 * carrément l'élément de l'enregistrement.
 */
const MASK_TEXT_SELECTOR =
  "[data-ph-mask], .ph-mask, [data-sensitive], input, textarea, select";

function sessionRecordingOptions() {
  return {
    // Toutes les saisies masquées, sans exception ni liste d'autorisation.
    maskAllInputs: true,
    maskInputOptions: {
      color: true,
      date: true,
      "datetime-local": true,
      email: true,
      month: true,
      number: true,
      range: true,
      search: true,
      tel: true,
      text: true,
      time: true,
      url: true,
      week: true,
      textarea: true,
      select: true,
      password: true,
    },
    maskTextSelector: MASK_TEXT_SELECTOR,
    blockClass: "ph-no-capture",
    // Les polices sont déjà servies par le site : les embarquer dans chaque
    // rejeu alourdit sans rien apporter.
    collectFonts: false,
  } as const;
}

/**
 * Démarre la mesure dans le régime qui correspond au choix, ou y bascule si
 * elle tourne déjà. Idempotent. Retourne `null` si aucune clé n'est configurée
 * — cas normal, pas une erreur.
 */
export async function startAnalytics(
  choices: ConsentChoices,
): Promise<PostHog | null> {
  if (typeof window === "undefined") return null;
  if (!isAnalyticsConfigured()) return null;

  if (!choices.analytics) {
    /* Refus ou révocation alors que la mesure complète tournait : on efface
       ce qu'elle avait posé avant de repasser en comptage sans cookie. */
    if (consentGranted) revokeConsent();
    else purgePostHogStorage();
  }
  consentGranted = choices.analytics;

  if (!consentGranted && oppositionSignalee()) return client;

  if (client) {
    if (choices.analytics) grantConsent(client);
    setReplayEnabled(choices.replay);
    return client;
  }
  if (loading) return loading;

  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        /* Ingestion via le proxy same-origin (cf. `config.ts` et le rewrite de
           `next.config.ts`). L'hôte PostHog réel n'apparaît nulle part dans le
           navigateur. */
        api_host: POSTHOG_PROXY_PATH,
        /* Cible des liens du toolbar et des heatmaps : l'INTERFACE, pas
           l'ingestion. Sans elle, « ouvrir dans PostHog » pointe sur l'origine
           du site et ne mène nulle part. */
        ui_host: POSTHOG_UI_HOST,
        /* Jeu de défauts ÉPINGLÉ. Sans épinglage, une mise à jour de
           `posthog-js` peut changer un comportement par défaut — les versions
           récentes activent par exemple la capture des corps de requêtes
           réseau dans le rejeu. Sur un site qui recevra des messages de
           prospects, ce genre de bascule silencieuse est exactement ce qu'il
           ne faut pas. Toute montée de version se fait donc en relisant le
           journal des défauts. */
        defaults: "2025-05-24",

        /* Les vues sont émises À LA MAIN (voir PageViewTracker) : l'App Router
           ne recharge pas le document, la capture automatique manquerait toutes
           les navigations internes ou les compterait de travers. */
        capture_pageview: false,
        capture_pageleave: false,

        /* Autocapture : tous les clics, changements et soumissions, sans avoir
           rien à instrumenter. C'est le filet — les événements nommés du
           registre sont la mesure, l'autocapture est ce qui rattrape ce qu'on
           n'avait pas prévu de mesurer. */
        autocapture: true,
        rageclick: true,
        enable_heatmaps: true,
        capture_performance: { web_vitals: true },

        /* Rejeu de session : monté ou non selon la SECONDE case, et jamais
           sans la première. */
        disable_session_recording: !(consentGranted && choices.replay),
        session_recording: sessionRecordingOptions(),

        /* Aucun profil de personne tant que rien n'identifie le visiteur. Le
           site reste donc en mesure ANONYME de bout en bout ; le point
           d'accroche `identifyVisitor()` plus bas est le seul moment où cela
           peut changer, et il n'est pas branché aujourd'hui. */
        person_profiles: "identified_only",

        persistence: "localStorage+cookie",
        /* Même durée que le consentement : ni le choix ni ce qu'il autorise ne
           survit au-delà de six mois. */
        cookie_expiration: CONSENT_TTL_DAYS,
        secure_cookie: window.location.protocol === "https:",
        /* Les sondages et l'analyse d'erreurs distante ne sont pas demandés :
           moins de code téléchargé, moins de surface. */
        disable_surveys: true,
        /* Signal « Do Not Track » du navigateur respecté : il ne remplace pas
           le consentement, il s'y ajoute. Sans consentement, il coupe aussi
           le comptage sans cookie (voir `oppositionSignalee`). */
        respect_dnt: true,
        /* Sans réponse du visiteur, le SDK démarre « refusé », donc en
           comptage sans cookie sans cookie. Il ne passe aux cookies qu'au
           consentement (`grantConsent`). Le réglage « cookieless server hash
           mode » du projet PostHog doit être actif, sinon ces visites sont
           jetées à la réception. */
        opt_out_capturing_by_default: true,
        cookieless_mode: "on_reject",
        before_send: filtreSansConsentement,
      });

      if (consentGranted) grantConsent(posthog);
      client = posthog;
      notify(true);
      return posthog;
    })
    .catch(() => {
      // Un échec de chargement (réseau coupé, bloqueur agressif) ne doit RIEN
      // casser : le site continue, la mesure est simplement absente.
      loading = null;
      return null;
    });

  return loading;
}

/** Passe en mesure complète : cookies, identifiant de visite, rejeu permis. */
function grantConsent(posthog: PostHog): void {
  posthog.set_config({ disable_persistence: false, disable_cookie: false });
  // `captureEventName: false` : un `$opt_in` automatique polluerait les
  // entonnoirs avec un événement qui ne veut rien dire côté visiteur.
  posthog.opt_in_capturing({ captureEventName: false });
}

/**
 * Révocation : retour au comptage sans cookie, et effacement de ce que la mesure
 * complète avait posé.
 *
 * `opt_out_capturing()` fait repasser le SDK sans cookie, `reset(true)` jette
 * l'identifiant et les propriétés persistées. Les entrées `localStorage`/cookies
 * de PostHog qui subsisteraient sont retirées juste après, parce qu'une
 * révocation qui laisse le cookie en place n'est pas une révocation.
 */
function revokeConsent(): void {
  consentGranted = false;
  if (client) {
    try {
      client.stopSessionRecording();
      client.opt_out_capturing();
      /* COUPER LA PERSISTANCE AVANT DE PURGER, ET PAS APRÈS.
         MESURÉ : avec l'ordre inverse, l'entrée `ph_…` et son cookie étaient
         effacés puis RÉÉCRITS dans la foulée — le SDK reste vivant en mémoire
         et resauvegarde son état après un `reset()`. Une révocation laissait
         donc le cookie en place, ce qui est exactement ce qu'elle est censée
         empêcher. */
      client.set_config({ disable_persistence: true, disable_cookie: true });
      client.reset(true);
    } catch {
      /* SDK à moitié initialisé : le nettoyage ci-dessous suffit. */
    }
  }
  purgePostHogStorage();
}

/** Retire toute trace de stockage laissée par PostHog sur cette origine. */
export function purgePostHogStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith("ph_") || key.startsWith("__ph_")))
        keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* stockage indisponible */
  }
  try {
    for (const entry of document.cookie.split(";")) {
      const name = entry.split("=")[0]?.trim();
      if (!name || !(name.startsWith("ph_") || name.startsWith("__ph_")))
        continue;
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
    }
  } catch {
    /* cookies indisponibles */
  }
}

/** Bascule le rejeu sans redémarrer le SDK (cas : décochage dans le panneau). */
export function setReplayEnabled(enabled: boolean): void {
  if (!client) return;
  try {
    if (enabled && consentGranted) client.startSessionRecording();
    else client.stopSessionRecording();
  } catch {
    /* rien à faire : le rejeu n'est pas critique */
  }
}

export function getAnalyticsClient(): PostHog | null {
  return client;
}

/**
 * Émission d'un événement. Silencieuse et sans effet si la mesure n'est pas
 * démarrée — c'est ce qui permet d'appeler `capture()` depuis n'importe où sans
 * jamais tester le consentement sur place.
 */
export function capture(event: string, properties?: Properties): void {
  if (!client) return;
  try {
    client.capture(event, properties);
  } catch {
    /* une mesure qui échoue ne casse jamais une interaction */
  }
}

/**
 * POINT D'ACCROCHE D'IDENTIFICATION — délibérément NON BRANCHÉ.
 *
 * Le site reste anonyme tant qu'aucun formulaire n'est soumis. Le jour où le
 * formulaire de contact existe et aboutit, c'est cette fonction qu'il faut
 * appeler avec l'adresse saisie, et à ce moment-là SEULEMENT : appeler
 * `identify` plus tôt créerait un profil pour chaque visiteur de passage, ce
 * que `person_profiles: "identified_only"` sert justement à éviter.
 *
 * L'adresse e-mail est un identifiant stable et déjà connu d'Eliott (le
 * prospect vient de la lui donner) ; elle est passée telle quelle en
 * `distinct_id`, ce qui raccorde la session anonyme au prospect nommé. Voir la
 * section « Identification » de `docs/ANALYTICS.md`.
 */
export function identifyVisitor(
  email: string,
  properties?: Properties,
): void {
  if (!client || !consentGranted) return;
  const normalised = email.trim().toLowerCase();
  if (normalised === "") return;
  try {
    client.identify(normalised, { email: normalised, ...properties });
  } catch {
    /* voir capture */
  }
}
