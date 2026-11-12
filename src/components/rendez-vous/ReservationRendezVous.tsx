"use client";

/**
 * Prise de rendez-vous, entièrement dessinée ici — composant CLIENT.
 *
 * LE MOTEUR EST LE COCKPIT depuis le 2026-11-02 (avant : Cal.com). Ce composant
 * ne parle qu'aux routes du site (`/api/rendez-vous/*`), qui relaient au
 * cockpit côté serveur (`src/lib/rendez-vous/cockpit.ts`). `Calendrier` et
 * `Heures` sont exportés : la page `/rdv/gerer/[jeton]` les réutilise.
 *
 * UN SEUL ÉCRAN DEPUIS LE 2026-11-12. Le stepper de six écrans et ses dix
 * questions de cadrage (2026-11-10) découragent la prise de rendez-vous, et
 * Eliott veut un seul lien pour tout sujet : le visiteur choisit son sujet
 * (Logiciel, Site, IA, Autre), voit les créneaux libres, dépose nom, e-mail et
 * téléphone, et peut écrire son projet en une ligne. Le sujet part au cockpit
 * comme type de rendez-vous : titre de l'agenda, fiche et mail de
 * confirmation le suivent. Les clients en cours (`/rdv/client` : point rapide,
 * démonstration, proposition, point d'étape) voient le même écran, avec leurs
 * quatre sujets : seuls le nom et l'e-mail sont exigés.
 *
 * LA DURÉE EST CELLE DU TYPE AU COCKPIT, par défaut : le visiteur n'a plus à la
 * choisir.
 *
 * AUCUNE ANIMATION D'APPARITION ICI, contrairement au reste du site. `Reveal`
 * rend l'état MASQUÉ dès le serveur et compte sur une animation pour le lever :
 * dans un onglet d'arrière-plan, le bloc resterait invisible. Sur le
 * formulaire par lequel passe un rendez-vous, c'est une conversion perdue.
 *
 * ACCESSIBILITÉ — les points qui comptent :
 *   - le sujet est un vrai groupe de `radio` dans un `fieldset`, avec une
 *     pastille visible que l'anneau de focus global peut entourer ;
 *   - chaque jour du calendrier porte son libellé complet, les jours sans
 *     créneau sont désactivés, et l'état d'envoi passe par la région live de
 *     `MessageEtat`.
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import {
  ChampsProtection,
  MessageEtat,
} from "@/components/forms/ProtectionFormulaire";
import { useProtectionTurnstile } from "@/components/forms/turnstile";
import { NOM_CHAMP_PIEGE } from "@/components/forms/useEnvoiFormulaire";
import type { EtatEnvoi } from "@/components/forms/useEnvoiFormulaire";
import {
  MESSAGE_RESEAU,
  messageEchecInconnu,
  messageProtectionAbsente,
} from "@/components/rendez-vous/messages";
import { Icon, Spinner } from "@/components/ui";
import { rendezVousContent } from "@/content/rendez-vous";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { capture } from "@/lib/analytics/posthog";
import { lireTelephone } from "@/lib/contact/validation";
import type { IdRendezVous, TypeRendezVous } from "@/content/rendez-vous";
import {
  ajouterMois,
  formaterJour,
  grilleMois,
  JOURS_SEMAINE,
  lireReponseCreneaux,
  numeroDuJour,
} from "@/lib/rendez-vous/creneaux";
import type {
  Creneau,
  JourDeCreneaux,
  ReponseCreneaux,
} from "@/lib/rendez-vous/creneaux";
import { estTypeClient } from "@/lib/rendez-vous/config";
import { LONGUEUR_LIGNE_MAX } from "@/lib/rendez-vous/questionnaire";

const contenu = rendezVousContent;

/** Ce qui empêche d'afficher des créneaux, du plus bénin au plus définitif. */
type EtatCreneaux = "aucune" | "reseau" | "indisponible";

/**
 * Dernier résultat reçu, avec la QUESTION à laquelle il répond.
 *
 * Garder la clef à côté de la réponse est ce qui permet de déduire le
 * chargement au lieu de le stocker, et d'écarter au rendu une réponse arrivée
 * après que le prospect a changé d'avis.
 */
interface ResultatCreneaux {
  readonly cle: string;
  readonly type: IdRendezVous | undefined;
  readonly etat: EtatCreneaux;
  readonly donnees?: ReponseCreneaux;
}

function estMessage(charge: unknown): charge is { message: string; champ?: string } {
  return (
    typeof charge === "object" &&
    charge !== null &&
    typeof (charge as Record<string, unknown>).message === "string"
  );
}


export const CLASSE_LIBELLE =
  "text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground/80";

export const CLASSE_CHAMP =
  "h-[52px] w-full border border-white/45 bg-white/[0.04] px-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/45 hover:border-white/60 focus:border-accent tablet:text-[15px]";

export const CLASSE_TEXTE =
  "text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60";

export const CLASSE_BOUTON_SECONDAIRE =
  "flex min-h-[44px] items-center gap-[8px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 transition-colors hover:text-accent motion-reduce:transition-none";

export const CLASSE_BOUTON_PRINCIPAL =
  "flex h-[52px] w-full items-center justify-center bg-accent px-[28px] text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none tablet:w-fit";


/** Vrai quand le visiteur a demandé moins de mouvement ; faux là où la requête n'existe pas. */
function mouvementReduit(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Une réponse libre : libellé, champ (une ligne ou plusieurs), erreur dessous.
 *
 * L'erreur est reliée au champ par `aria-describedby`, comme celle d'un groupe
 * de `ChoixUnique` : le lecteur d'écran la lit en arrivant sur le champ.
 */
function ChampTexte({
  id,
  nom,
  legende,
  valeur,
  onChanger,
  placeholder,
  erreur,
  aide,
  refChamp,
  multiligne = false,
  maxLength,
  type = "text",
  autoComplete,
  inputMode,
  requis = false,
  invalide = false,
}: {
  id: string;
  nom: string;
  legende: string;
  valeur: string;
  onChanger: (valeur: string) => void;
  placeholder?: string;
  erreur?: string;
  aide?: string;
  refChamp?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  multiligne?: boolean;
  maxLength?: number;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  requis?: boolean;
  /** Bordure d'erreur sans texte : le message du serveur s'affiche sous le formulaire. */
  invalide?: boolean;
}) {
  const idErreur = `${id}-erreur`;
  const idAide = `${id}-aide`;
  const decrit = [aide ? idAide : undefined, erreur ? idErreur : undefined]
    .filter(Boolean)
    .join(" ");
  const commun = {
    id,
    name: nom,
    value: valeur,
    maxLength,
    placeholder,
    required: requis || undefined,
    "aria-invalid": erreur || invalide ? true : undefined,
    "aria-describedby": decrit || undefined,
  } as const;
  return (
    // Le libellé ne porte que la légende : l'aide et l'erreur passent par
    // `aria-describedby`, sans être lues deux fois.
    <div className="flex w-full flex-col gap-[10px]">
      <label htmlFor={id} className={CLASSE_LIBELLE}>
        {legende}
      </label>
      {multiligne ? (
        <textarea
          {...commun}
          ref={refChamp as RefObject<HTMLTextAreaElement | null> | undefined}
          onChange={(evenement) => onChanger(evenement.target.value)}
          className={`min-h-[110px] w-full resize-y border border-white/45 bg-white/[0.04] p-[16px] text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/45 hover:border-white/60 focus:border-accent tablet:text-[15px] ${erreur || invalide ? "border-accent" : ""}`}
        />
      ) : (
        <input
          {...commun}
          ref={refChamp as RefObject<HTMLInputElement | null> | undefined}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onChange={(evenement) => onChanger(evenement.target.value)}
          className={`${CLASSE_CHAMP} ${erreur || invalide ? "border-accent" : ""}`}
        />
      )}
      {aide ? (
        <span id={idAide} className="-mt-[2px] mb-[8px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
          {aide}
        </span>
      ) : null}
      {erreur ? (
        <span
          id={idErreur}
          className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-accent"
        >
          {erreur}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Calendrier d'un mois : les jours qui ont au moins un créneau sont des
 * cases bordées cliquables, les autres restent lisibles mais grisés et sans
 * cadre.
 *
 * UN MOIS ENTIER ET NON UNE BANDE DE JOURS : le prospect voit d'un coup d'œil
 * quand il y a de la place, et un jour sans créneau se lit comme tel au lieu
 * de disparaître de la bande.
 */
export function Calendrier({
  donnees,
  jourActif,
  chargement,
  onChoisirJour,
  onDecaler,
}: {
  donnees: ReponseCreneaux;
  jourActif: JourDeCreneaux | undefined;
  chargement: boolean;
  onChoisirJour: (jour: string) => void;
  onDecaler: (mois: number) => void;
}) {
  const disponibles = new Map(donnees.jours.map((jour) => [jour.jour, jour]));
  const cases = grilleMois(donnees.fenetre.mois);
  // `aria-disabled` et non `disabled` : un bouton désactivé perd le focus, et
  // il le perdrait au moment précis où le clavier vient de l'actionner (le
  // chargement du mois suivant, ou l'arrivée au bout de la fenêtre).
  const classeNavigation =
    "flex size-[36px] items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:hover:border-border aria-disabled:hover:text-foreground motion-reduce:transition-none";
  const precedentBloque = donnees.fenetre.premiere || chargement;
  const suivantBloque = donnees.fenetre.derniere || chargement;

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center justify-between gap-[16px]">
        <p className="m-0 text-[14px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
          {donnees.fenetre.libelle}
        </p>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            className={classeNavigation}
            aria-disabled={precedentBloque}
            onClick={() => {
              if (!precedentBloque) onDecaler(-1);
            }}
          >
            <Icon
              name="arrow"
              size={16}
              className="rotate-180"
              label={contenu.actions.moisPrecedent}
            />
          </button>
          <button
            type="button"
            className={classeNavigation}
            aria-disabled={suivantBloque}
            onClick={() => {
              if (!suivantBloque) onDecaler(1);
            }}
          >
            <Icon name="arrow" size={16} label={contenu.actions.moisSuivant} />
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label={contenu.creneaux.libelleCalendrier}
        aria-busy={chargement}
        className={`grid grid-cols-7 gap-[4px] transition-opacity motion-reduce:transition-none ${
          chargement ? "opacity-40" : ""
        }`}
      >
        {JOURS_SEMAINE.map((jour) => (
          <span
            key={jour}
            aria-hidden
            className="pb-[4px] text-center text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60"
          >
            {jour}
          </span>
        ))}
        {cases.map((jour, index) => {
          if (jour === null) return <span key={`vide-${index}`} aria-hidden />;
          const disponible = disponibles.get(jour);
          const actif = disponible !== undefined && jour === jourActif?.jour;
          return (
            <button
              key={jour}
              type="button"
              disabled={!disponible || chargement}
              aria-pressed={disponible ? actif : undefined}
              aria-label={disponible ? disponible.libelle : formaterJour(jour)}
              onClick={() => onChoisirJour(jour)}
              className={`flex h-[44px] items-center justify-center border text-[14px] font-medium leading-none tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : disponible
                    ? "border-border text-foreground hover:border-accent hover:text-accent"
                    : "cursor-default border-transparent text-white/40"
              }`}
            >
              {numeroDuJour(jour)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Heures libres du jour retenu, en grille serrée. */
export function Heures({
  jour,
  choisi,
  onChoisir,
}: {
  jour: JourDeCreneaux;
  choisi: Creneau | undefined;
  onChoisir: (creneau: Creneau) => void;
}) {
  return (
    <div className="relative flex flex-col gap-[14px] desktop:h-full">
      {/* Pas de capitales ici : « 1er » deviendrait « 1ER ». */}
      <p className="m-0 flex min-h-[36px] items-center text-[14px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
        {jour.libelle}
      </p>
      {/* À PARTIR DE 1200, LA COLONNE DÉFILE à la hauteur du calendrier, qu'elle
          épouse en position absolue sous le libellé du jour (36 + 14 px) : une
          journée ouverte au quart d'heure compte près de trente heures, soit
          deux fois la hauteur du mois d'à côté. `data-lenis-prevent` rend la
          molette à cette colonne, Lenis gardant la page. En dessous, la grille
          passe sous le calendrier sur quatre colonnes et tient sans défiler. */}
      <div
        role="group"
        aria-label={`${contenu.creneaux.libelleGrille} ${jour.libelle}`}
        data-lenis-prevent
        className="grid grid-cols-4 content-start gap-[6px] desktop:absolute desktop:inset-x-0 desktop:bottom-0 desktop:top-[50px] desktop:grid-cols-3 desktop:overflow-y-auto desktop:overscroll-contain desktop:pb-[28px] desktop:pr-[6px] desktop:[mask-image:linear-gradient(to_bottom,black_calc(100%-40px),transparent)] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]"
      >
        {jour.creneaux.map((creneau) => {
          const actif = creneau.debut === choisi?.debut;
          return (
            <button
              key={creneau.debut}
              type="button"
              aria-pressed={actif}
              // Anneau INTÉRIEUR : la colonne défile, et un anneau extérieur y
              // serait rogné par le bord du conteneur.
              data-focus-ring="inset"
              onClick={() => onChoisir(creneau)}
              className={`h-[44px] border text-[13px] font-medium leading-[1.2] tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              {creneau.heure}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Les boutons de sujet : un seul actif, un clic le retient et charge les créneaux. */
function BoutonsSujet({
  prefixe,
  types,
  choisi,
  onChoisir,
}: {
  prefixe: string;
  types: readonly TypeRendezVous[];
  choisi: IdRendezVous | undefined;
  onChoisir: (id: IdRendezVous) => void;
}) {
  const description = types.find((type) => type.id === choisi)?.description;
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-[12px] border-0 p-0">
      <legend className={`${CLASSE_LIBELLE} mb-[12px] p-0`}>{contenu.blocs.sujet}</legend>
      {/* Des `radio` : flèches au clavier, « 2 sur 4 » au lecteur d'écran, et
          une pastille visible que l'anneau de focus global peut entourer. */}
      <div className="grid grid-cols-2 gap-[10px] tablet:grid-cols-4">
        {types.map((type) => {
          const actif = type.id === choisi;
          const id = `${prefixe}-sujet-${type.id}`;
          return (
            <label
              key={type.id}
              htmlFor={id}
              className={`flex h-[52px] cursor-pointer items-center justify-center border px-[12px] text-center text-[16px] font-medium leading-[1.2] tracking-[-0.01em] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-white/45 text-foreground hover:border-white/70"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={`${prefixe}-sujet`}
                value={type.id}
                checked={actif}
                onChange={() => onChoisir(type.id)}
                className="sr-only"
              />
              {type.nom}
            </label>
          );
        })}
      </div>
      {description ? <p className={`${CLASSE_TEXTE} m-0`}>{description}</p> : null}
    </fieldset>
  );
}

export function ReservationRendezVous({
  types,
  emailContact,
  typeInitial,
}: {
  /** Types RÉELLEMENT configurés, résolus côté serveur. Jamais vide ici. */
  types: readonly TypeRendezVous[];
  /** Adresse publiée, affichée en repli quand la réservation ne peut aboutir. */
  emailContact: string;
  /**
   * Sujet déjà choisi à l'arrivée, lu dans `?sujet` par l'appelant.
   *
   * VALEUR INITIALE, PAS VALEUR CONTRÔLÉE : le prospect reste libre d'en
   * changer. Un sujet réservé aux clients (démonstration, point d'étape) est
   * le seul proposé : le bloc des sujets disparaît et le sujet s'affiche en
   * titre.
   */
  typeInitial?: IdRendezVous;
}) {
  // Préfixe des identifiants et des groupes de boutons radio : la page de
  // contact et le pied de page peuvent monter deux réservations à la fois.
  const instance = `rdv${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [type, setType] = useState<IdRendezVous | undefined>(typeInitial);
  const [creneau, setCreneau] = useState<Creneau | undefined>(undefined);
  const [mois, setMois] = useState("");
  const [jourChoisi, setJourChoisi] = useState("");
  /** Incrémenté par « Réessayer » : c'est ce qui relance l'effet à l'identique. */
  const [tentative, setTentative] = useState(0);
  const [resultat, setResultat] = useState<ResultatCreneaux>({
    cle: "",
    type: undefined,
    etat: "aucune",
  });

  /**
   * Clef de la requête EN COURS DE VALIDITÉ.
   *
   * `chargement` n'est PAS un état : c'est le simple constat que le dernier
   * résultat reçu ne répond pas à la question posée. Le tenir en état
   * obligerait à un `setChargement(true)` en tête d'effet, donc à une cascade
   * de rendus dont `react-hooks/set-state-in-effect` ne veut pas.
   */
  const cle = type ? `${type}|${mois}|${tentative}` : "";
  const chargement = type !== undefined && resultat.cle !== cle;
  // Les créneaux du type PRÉCÉDENT ne survivent pas à un changement de sujet ;
  // ceux du mois précédent, si, le temps que la suite arrive.
  const donnees = resultat.type === type ? resultat.donnees : undefined;
  const etatCreneaux: EtatCreneaux =
    resultat.type === type && resultat.cle === cle ? resultat.etat : "aucune";
  /**
   * Jour affiché — DÉDUIT, jamais synchronisé : le jour retenu s'il existe
   * encore dans la donnée, sinon le premier jour disponible du mois.
   */
  const jourActif =
    donnees?.jours.find((jour) => jour.jour === jourChoisi) ?? donnees?.jours[0];

  const [etatEnvoi, setEtatEnvoi] = useState<EtatEnvoi>("repos");
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [champEnErreur, setChampEnErreur] = useState<string | undefined>(undefined);
  const protection = useProtectionTurnstile();

  /** Le créneau réservé, gardé pour l'écran de confirmation (le formulaire disparaît). */
  const [resumeSucces, setResumeSucces] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  /** Un client en cours (`/rdv/client`) ne donne que nom et e-mail : le reste est facultatif. */
  const client = estTypeClient(type);
  const sujetsProposes = types.length > 1 || !typeInitial;
  const typeChoisi = types.find((entree) => entree.id === type);

  /**
   * Horodatage d'affichage, posé APRÈS le montage.
   *
   * Il n'est pas initialisé pendant le rendu : la valeur serait calculée côté
   * serveur, et une page servie il y a deux heures ferait rejeter la
   * réservation par le contrôle de délai maximal.
   */
  const refDebut = useRef(0);
  useEffect(() => {
    refDebut.current = Date.now();
  }, []);

  const racine = useRef<HTMLDivElement | null>(null);
  const refSujet = useRef<HTMLDivElement | null>(null);
  const refCreneaux = useRef<HTMLDivElement | null>(null);
  const refSucces = useRef<HTMLParagraphElement | null>(null);
  /** Le focus va au succès : le formulaire disparaît, le clavier ne doit pas retomber sur le document. */
  useEffect(() => {
    if (etatEnvoi === "succes") refSucces.current?.focus();
  }, [etatEnvoi]);

  /*
   * UN SUJET PRÉSÉLECTIONNÉ FRANCHIT LA MÊME MARCHE QU'UN SUJET CHOISI.
   *
   * Sur `/rdv?sujet=…` et les liens des pages, le prospect n'appuie sur rien :
   * la page décide pour lui. Sans cet envoi, l'entonnoir ne verrait jamais
   * l'étape « sujet » pour ces visites-là. `preselected` distingue les deux
   * populations.
   *
   * IL NE PART PAS AU MONTAGE MAIS À LA PREMIÈRE VISIBILITÉ DU BLOC : un
   * entonnoir PostHog ordonné n'accepte une étape que si la précédente
   * (`section_viewed`) l'a précédée dans le temps. Le délai de 500 ms rend
   * l'ordre certain entre deux observateurs déclenchés par le même défilement.
   * IL NE PART QU'UNE FOIS : `disconnect` sur la première intersection, et la
   * garde par `ref` couvre le double montage du mode strict.
   */
  const sujetInitialAnnonce = useRef(false);
  useEffect(() => {
    if (!typeInitial || sujetInitialAnnonce.current) return;

    const annoncer = () => {
      if (sujetInitialAnnonce.current) return;
      sujetInitialAnnonce.current = true;
      capture(ANALYTICS_EVENTS.rdvTypeSelected, {
        rdv_type: typeInitial,
        preselected: true,
      });
    };

    const noeud = racine.current;
    if (!noeud || typeof IntersectionObserver === "undefined") {
      annoncer();
      return;
    }

    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        observateur.disconnect();
        minuterie = setTimeout(annoncer, 500);
      },
      { threshold: 0, rootMargin: "-20% 0px -20% 0px" },
    );
    observateur.observe(noeud);
    return () => {
      observateur.disconnect();
      if (minuterie !== undefined) clearTimeout(minuterie);
    };
  }, [typeInitial]);

  useEffect(() => {
    const typeDemande = type;
    if (!typeDemande) return;
    const controleur = new AbortController();

    const parametres = new URLSearchParams({ type: typeDemande });
    if (mois) parametres.set("mois", mois);

    fetch(`/api/rendez-vous/creneaux?${parametres.toString()}`, {
      signal: controleur.signal,
    })
      .then(async (reponse) => {
        // 503 = la prise de rendez-vous n'est pas configurée. Ce n'est pas une
        // panne passagère : proposer « Réessayer » y serait mensonger.
        if (reponse.status === 503) {
          setResultat({ cle, type: typeDemande, etat: "indisponible" });
          capture(ANALYTICS_EVENTS.rdvSlotsFailed, {
            rdv_type: typeDemande,
            reason: "non_configure",
          });
          return;
        }
        if (!reponse.ok) throw new Error(String(reponse.status));
        const charge = lireReponseCreneaux(await reponse.json());
        if (!charge) throw new Error("charge_illisible");
        setResultat({ cle, type: typeDemande, etat: "aucune", donnees: charge });
        /*
         * ZÉRO CRÉNEAU N'EST PAS UN CHARGEMENT RÉUSSI, du point de vue du
         * prospect. L'événement part quand même, avec le compte à zéro, pour que
         * l'entonnoir distingue « agenda vide » de « appel échoué ».
         */
        const creneauxOfferts = charge.jours.reduce(
          (total, jour) => total + jour.creneaux.length,
          0,
        );
        capture(ANALYTICS_EVENTS.rdvSlotsLoaded, {
          rdv_type: typeDemande,
          slots_count: creneauxOfferts,
          days_count: charge.jours.length,
          duration_min: charge.duree,
        });
      })
      .catch(() => {
        // Une requête annulée n'est pas une panne : c'est nous qui l'avons
        // interrompue parce que la question a changé.
        if (controleur.signal.aborted) return;
        setResultat({ cle, type: typeDemande, etat: "reseau" });
        capture(ANALYTICS_EVENTS.rdvSlotsFailed, {
          rdv_type: typeDemande,
          reason: "reseau",
        });
      });

    return () => controleur.abort();
  }, [type, mois, cle]);

  const choisirType = useCallback(
    (id: IdRendezVous) => {
      capture(ANALYTICS_EVENTS.rdvTypeSelected, {
        rdv_type: id,
        preselected: false,
      });
      // Même sujet : rien à remettre à zéro, on reprend où on en était.
      if (id !== type) {
        setType(id);
        // Chaque type a sa propre disponibilité : un créneau ne passe pas de l'un à l'autre.
        setCreneau(undefined);
        setMois("");
        setJourChoisi("");
      }
      setEtatEnvoi("repos");
      setMessageEnvoi("");
    },
    [type],
  );

  /*
   * LE CRÉNEAU RETENU, avec le DÉLAI qu'il représente et non son horaire.
   *
   * `days_ahead` dit si le prospect prend le premier créneau venu ou repousse.
   * L'HEURE PRÉCISE N'EST PAS ENVOYÉE : elle identifierait la réservation, donc
   * la personne, dès qu'on la croise avec l'agenda.
   */
  const choisirCreneau = useCallback(
    (choix: Creneau) => {
      const delai = Math.max(
        0,
        Math.round(
          (new Date(choix.debut).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        ),
      );
      capture(ANALYTICS_EVENTS.rdvSlotSelected, {
        rdv_type: type,
        days_ahead: delai,
        duration_min: donnees?.duree,
      });
      setCreneau(choix);
      setEtatEnvoi("repos");
      setMessageEnvoi("");
    },
    [type, donnees],
  );

  const decalerMois = useCallback(
    (decalage: number) => {
      if (!donnees) return;
      setMois(ajouterMois(donnees.fenetre.mois, decalage));
      setJourChoisi("");
    },
    [donnees],
  );

  const recommencer = useCallback(() => {
    setType(typeInitial);
    setCreneau(undefined);
    setMois("");
    setJourChoisi("");
    setEtatEnvoi("repos");
    setMessageEnvoi("");
    setChampEnErreur(undefined);
    setMessage("");
    refDebut.current = Date.now();
  }, [typeInitial]);

  /** Refus avant envoi : le message s'annonce, et le bloc concerné revient en vue. */
  const refuser = (texte: string, champ: string) => {
    setEtatEnvoi("erreur");
    setMessageEnvoi(texte);
    setChampEnErreur(champ);
  };

  const gererSoumission = async (evenement: FormEvent<HTMLFormElement>) => {
    // Interdit la soumission native, donc toute donnée en chaîne de requête.
    evenement.preventDefault();
    if (etatEnvoi === "envoi") return;
    if (!type) {
      refuser(contenu.formulaire.choisirSujet, "type");
      refSujet.current?.scrollIntoView({ block: "center", behavior: mouvementReduit() ? "auto" : "smooth" });
      return;
    }
    if (!creneau) {
      refuser(contenu.formulaire.choisirHeure, "creneau");
      refCreneaux.current?.scrollIntoView({ block: "start", behavior: mouvementReduit() ? "auto" : "smooth" });
      return;
    }

    // Même lecture que le serveur : numéro requis, format plausible.
    const lecture = lireTelephone(telephone);
    if (!lecture.ok || (!lecture.valeur && !client)) {
      refuser(
        lecture.ok
          ? contenu.formulaire.telephoneErreur
          : "Ce numéro de téléphone ne semble pas valide.",
        "telephone",
      );
      return;
    }

    // Le piège à robots : un champ que seul un robot remplit, relu tel quel.
    const piege = new FormData(evenement.currentTarget).get(NOM_CHAMP_PIEGE);

    setEtatEnvoi("envoi");
    setMessageEnvoi("");
    setChampEnErreur(undefined);

    if (!protection.configure) {
      refuser(messageProtectionAbsente(emailContact), "protection");
      /*
       * ÉCHEC LE PLUS COÛTEUX DE TOUS, et le plus silencieux : Turnstile mal
       * configuré a tenu le formulaire de contact hors service pendant des
       * semaines sans qu'aucune mesure ne le dise (relevé le 2026-09-08).
       */
      capture(ANALYTICS_EVENTS.rdvFailed, {
        rdv_type: type,
        reason: "protection_absente",
      });
      return;
    }

    const jetonCaptcha = await protection.obtenirJeton();

    try {
      const reponse = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          debut: creneau.debut,
          nom,
          email,
          telephone,
          message,
          debutMs: refDebut.current,
          [NOM_CHAMP_PIEGE]: piege,
          jetonCaptcha,
        }),
      });
      const charge: unknown = await reponse.json().catch(() => null);

      if (reponse.ok) {
        setResumeSucces(creneau.resume);
        setEtatEnvoi("succes");
        setMessageEnvoi("");
        protection.reinitialiser();
        // LA SEULE CONVERSION QUI COMPTE, mesurée sur la réponse du serveur.
        capture(ANALYTICS_EVENTS.rdvConfirmed, {
          rdv_type: type,
          duration_min: donnees?.duree,
        });
        return;
      }

      const champ = estMessage(charge) ? charge.champ : undefined;
      refuser(
        estMessage(charge) ? charge.message : messageEchecInconnu(emailContact),
        champ ?? "",
      );
      /*
       * `field` EST LE NOM DU CHAMP FAUTIF, jamais ce que le prospect y a
       * écrit : `creneau` = course entre deux réservations, `jetonCaptcha` =
       * protection mal réglée, le reste = validation trop stricte.
       */
      capture(ANALYTICS_EVENTS.rdvFailed, {
        rdv_type: type,
        reason: "refus_serveur",
        status: reponse.status,
        field: champ ?? "inconnu",
      });
      // Créneau pris entre l'affichage et la confirmation : le calendrier se
      // recharge plutôt qu'un bouton qui échouera à l'identique.
      if (champ === "creneau") {
        setCreneau(undefined);
        setTentative((valeur) => valeur + 1);
      }
      // Le jeton est à usage unique : sans réinitialisation, la deuxième
      // tentative échouerait en boucle sur un jeton déjà consommé.
      protection.reinitialiser();
    } catch {
      refuser(MESSAGE_RESEAU, "");
      protection.reinitialiser();
      capture(ANALYTICS_EVENTS.rdvFailed, {
        rdv_type: type,
        reason: "reseau",
      });
    }
  };

  if (etatEnvoi === "succes") {
    return (
      <div className="flex flex-col gap-[16px] border border-accent bg-accent/[0.07] p-[20px]">
        <p
          ref={refSucces}
          tabIndex={-1}
          className="m-0 text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground outline-none"
        >
          {contenu.succes.titre}
        </p>
        <p className="m-0 text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
          {resumeSucces}
        </p>
        <p className={`${CLASSE_TEXTE} m-0`}>{contenu.succes.texte}</p>
        <button
          type="button"
          onClick={recommencer}
          className="mt-[4px] flex h-[50px] w-full items-center justify-center border border-border px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none tablet:w-fit"
        >
          {contenu.succes.autre}
        </button>
      </div>
    );
  }

  const enCours = etatEnvoi === "envoi";

  return (
    // `scroll-mt` : le haut du bloc ne doit pas finir sous l'en-tête fixe.
    <div ref={racine} className="flex scroll-mt-[100px] flex-col gap-[28px]">
      <form
        /* SANS CE NOM, la mesure appelle ce formulaire « form » et les
           formulaires de contact du site se confondent dans un même seau. */
        data-analytics-form="rendez-vous"
        className="relative flex flex-col gap-[32px]"
        /* `method="post"` et `action` : sans script, le navigateur soumet
           lui-même, en POST et dans un CORPS. Aucune donnée personnelle ne
           peut partir dans une chaîne de requête. */
        method="post"
        action="/api/rendez-vous"
        onSubmit={gererSoumission}
        /* Première interaction = chargement du script Turnstile. */
        onFocusCapture={protection.activer}
      >
        {sujetsProposes ? (
          <div ref={refSujet}>
            <BoutonsSujet
              prefixe={instance}
              types={types}
              choisi={type}
              onChoisir={choisirType}
            />
          </div>
        ) : (
          <h3 className="m-0 text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground tablet:text-[26px]">
            {typeChoisi?.nom}
          </h3>
        )}

        <div ref={refCreneaux} className="flex scroll-mt-[100px] flex-col gap-[16px]">
          <h3 className={`${CLASSE_LIBELLE} m-0`}>{contenu.blocs.creneau}</h3>

          {!type ? <p className={`${CLASSE_TEXTE} m-0`}>{contenu.formulaire.choisirSujet}</p> : null}

          {etatCreneaux === "indisponible" ? (
            <p className={`${CLASSE_TEXTE} m-0`}>{contenu.creneaux.indisponible}</p>
          ) : null}

          {etatCreneaux === "reseau" ? (
            <div className="flex flex-col items-start gap-[12px]">
              <p className={`${CLASSE_TEXTE} m-0`}>{contenu.creneaux.erreur}</p>
              <button
                type="button"
                onClick={() => setTentative((valeur) => valeur + 1)}
                className="min-h-[44px] border border-border px-[16px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
              >
                {contenu.actions.reessayer}
              </button>
            </div>
          ) : null}

          {chargement && !donnees ? (
            <div className="flex min-h-[120px] items-center gap-[10px]">
              <Spinner size="sm" label={contenu.creneaux.chargement} />
              <span aria-hidden className={CLASSE_LIBELLE}>
                {contenu.creneaux.chargement}
              </span>
            </div>
          ) : null}

          {/* Calendrier et heures restent POSÉS pendant un rechargement (mois),
              simplement estompés : les faire disparaître déplacerait la grille
              sous le curseur du prospect. */}
          {donnees ? (
            <div className="grid grid-cols-1 gap-[28px] desktop:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
              <Calendrier
                donnees={donnees}
                jourActif={jourActif}
                chargement={chargement}
                onChoisirJour={setJourChoisi}
                onDecaler={decalerMois}
              />
              {jourActif ? (
                <div
                  className={`transition-opacity motion-reduce:transition-none desktop:min-h-[300px] ${
                    chargement ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <Heures jour={jourActif} choisi={creneau} onChoisir={choisirCreneau} />
                </div>
              ) : (
                <p className={`${CLASSE_TEXTE} m-0 desktop:pt-[50px]`}>{contenu.creneaux.vide}</p>
              )}
            </div>
          ) : null}

          {type ? <p className={`${CLASSE_LIBELLE} m-0`}>{contenu.noteFuseau}</p> : null}

          {/* La région existe avant son contenu : le choix d'une heure s'annonce. */}
          <div aria-live="polite">
            {creneau ? (
              <div className="flex flex-col gap-[6px] border border-accent bg-accent/[0.07] px-[16px] py-[12px]">
                <p className={`${CLASSE_LIBELLE} m-0`}>{contenu.recapitulatif}</p>
                <span className="sr-only">{contenu.formulaire.confirmerCiDessous}</span>
                <p className="m-0 text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
                  {creneau.resume}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-[14px]">
          <h3 className={`${CLASSE_LIBELLE} m-0`}>{contenu.blocs.coordonnees}</h3>
          <ChampTexte
            id={`${instance}-nom`}
            nom="nom"
            legende={contenu.formulaire.nomLabel}
            valeur={nom}
            onChanger={setNom}
            placeholder={contenu.formulaire.nomPlaceholder}
            invalide={champEnErreur === "nom"}
            autoComplete="name"
            requis
          />
          <ChampTexte
            id={`${instance}-email`}
            nom="email"
            type="email"
            legende={contenu.formulaire.emailLabel}
            valeur={email}
            onChanger={setEmail}
            placeholder={contenu.formulaire.emailPlaceholder}
            invalide={champEnErreur === "email"}
            autoComplete="email"
            inputMode="email"
            requis
          />
          <ChampTexte
            id={`${instance}-telephone`}
            nom="telephone"
            type="tel"
            legende={client ? contenu.formulaire.telephoneLabelClient : contenu.formulaire.telephoneLabel}
            aide={client ? undefined : contenu.formulaire.telephoneAide}
            valeur={telephone}
            onChanger={setTelephone}
            placeholder={contenu.formulaire.telephonePlaceholder}
            invalide={champEnErreur === "telephone"}
            autoComplete="tel"
            inputMode="tel"
            requis={!client}
          />
          <ChampTexte
            id={`${instance}-message`}
            nom="message"
            legende={client ? contenu.formulaire.messageLabelClient : contenu.formulaire.messageLabel}
            valeur={message}
            onChanger={setMessage}
            placeholder={client ? contenu.formulaire.messagePlaceholderClient : contenu.formulaire.messagePlaceholder}
            invalide={champEnErreur === "message"}
            maxLength={LONGUEUR_LIGNE_MAX}
          />
        </div>

        <div className="flex flex-col gap-[16px]">
          {/* Au-dessus du bouton qui vient d'être touché : un refus (sujet ou
              heure oubliés, numéro faux, créneau pris) s'y lit sans chercher.
              Toujours monté, pour que l'annonce au lecteur d'écran parte. */}
          <MessageEtat etat={etatEnvoi} message={messageEnvoi} ton="clair" className="max-w-[420px]" />
          <button type="submit" disabled={enCours} className={CLASSE_BOUTON_PRINCIPAL}>
            {enCours ? contenu.formulaire.envoiEnCours : contenu.formulaire.envoyer}
          </button>
          <p className="m-0 text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
            {contenu.formulaire.mention}{" "}
            <Link
              href={contenu.formulaire.mentionHref}
              className="text-foreground no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none"
            >
              {contenu.formulaire.mentionLien}
            </Link>
            .
          </p>
        </div>

        {/* Toujours monté : le widget Turnstile ne survit pas à un démontage. */}
        <ChampsProtection refConteneur={protection.refConteneur} />
      </form>

      {/* Ce que montre la colonne des heures, dit au lecteur d'écran. Région
          montée en permanence : une région qui apparaît déjà remplie n'est
          pas annoncée. */}
      <p aria-live="polite" className="sr-only">
        {!type
          ? ""
          : chargement
            ? contenu.creneaux.chargement
            : etatCreneaux === "reseau"
              ? contenu.creneaux.erreur
              : jourActif
                ? contenu.creneaux.annonce(jourActif.libelle, jourActif.creneaux.length)
                : donnees
                  ? contenu.creneaux.vide
                  : ""}
      </p>
    </div>
  );
}
