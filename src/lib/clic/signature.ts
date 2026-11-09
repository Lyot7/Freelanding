/**
 * Clic sur le bouton « Réserver un appel » des e-mails de prospection (le lien
 * « Prendre contact » avant le 2026-11-02).
 *
 * Chaque e-mail porte un lien unique `/r/<id>`. La route redirige toujours
 * vers la prise de rendez-vous de l'accueil et, pour un vrai clic, l'enregistre dans le cockpit
 * d'Eliott : il sait QUI a cliqué, sans cookie.
 *
 * Le portrait de la signature porte le même identifiant, `/o/<id>` : son
 * affichage est relayé au cockpit comme une ouverture (décision d'Eliott du
 * 2026-10-15), puis redirigé vers l'image fixe.
 *
 * CONTRATS PARTAGÉS avec deux autres dépôts. Le pipeline d'envoi génère les
 * identifiants au format `ID_CLIC`. Le cockpit (`admin.eliottbouquerel.fr`)
 * reçoit `POST /api/clics` avec un jeton Bearer et le corps
 * `{ id, cliqueLe, navigateur, robotProbable }`, plus `nature: "ouverture"`
 * pour un affichage du portrait, et deux champs facultatifs : `ip` (visiteur)
 * et `eliott: true` (cookie `suivi-eliott=1`), qui lui font ignorer le clic. Il répond 201 (créé), 200
 * (déjà enregistré), 404 (identifiant qui ne correspond à aucun envoi,
 * attendu) ; 400, 401 et 503 signalent un défaut de notre côté ou du sien.
 * L'URL, les en-têtes et les quatre champs ne bougent pas sans lui.
 *
 * Tout est ici, dépendances injectées, pour que la route soit testable sans
 * serveur Next : `route.ts` ne fait que brancher `after()`, `fetch` et
 * `CLIC_TOKEN`.
 */
import { adresseAppelante, creerLimiteur } from "../contact/rate-limit";

const ID_CLIC = /^[a-z0-9-]{3,80}$/;

/**
 * Destination FIXE et LITTÉRALE. Rien de la requête n'y entre : une
 * redirection dont la cible viendrait d'un paramètre serait une open redirect
 * sur notre domaine. Rien de l'environnement non plus : dérivée de
 * `NEXT_PUBLIC_SITE_URL`, une variable absente au build enverrait les
 * prospects sur `localhost`. Hôte canonique mesuré le 2026-09-11 : l'apex
 * répond 200 et porte la balise canonical, `www` redirige en 307 vers lui.
 */
export const DESTINATION_CLIC =
  "https://eliottbouquerel.fr/?sujet=decouverte&utm_source=email&utm_medium=signature&utm_campaign=prospection#rendez-vous";

/**
 * Même destination pour un mail qui porte l'offre logiciel (boîte logiciel, ou
 * lien `/rdv/logiciel` dans son corps) : le formulaire « logiciel ». Littérale
 * aussi : la requête ne la choisit jamais, seule la réponse du cockpit
 * (`logiciel` ou `decouverte`) départage les deux destinations.
 */
export const DESTINATION_CLIC_LOGICIEL =
  "https://eliottbouquerel.fr/?sujet=logiciel&utm_source=email&utm_medium=signature&utm_campaign=prospection#rendez-vous";

/**
 * Littérale pour la même raison que la destination : le jeton ne doit partir
 * que vers le cockpit, quel que soit l'environnement.
 */
export const URL_COCKPIT_CLICS = "https://admin.eliottbouquerel.fr/api/clics";

/** L'offre d'un lien suivi : `GET` avec le même jeton porteur que le relais des clics. */
export const urlCockpitOffre = (id: string): string => `${URL_COCKPIT_CLICS}/${id}/offre`;

/**
 * Au-delà, la redirection part sans attendre l'offre : un cockpit lent ne doit
 * jamais retarder le prospect, qui tombe alors sur la découverte.
 */
const DELAI_OFFRE_MS = 1_500;
const MEMOIRE_OFFRES_MAX = 2_000;

/**
 * La photo de profil d'Eliott, carrée sur fond volt : les mails partis avant la
 * carte de visite l'affichent dans un cadre carré ou rond.
 */
export const DESTINATION_OUVERTURE = "https://eliottbouquerel.fr/images/eliott-bouquerel-avatar.jpg";

/**
 * Le buste de la carte de visite (depuis le 2026-11-02), détouré en PNG transparent depuis
 * `eliott-nature-bloc.jpg`, pour `/o/<id>?forme=buste`. Deux cibles
 * littérales choisies par un drapeau : rien de la requête n'entre dans l'URL.
 */
export const DESTINATION_BUSTE = "https://eliottbouquerel.fr/images/eliott-carte.png";

/** Au-delà, le cockpit est jugé injoignable. La redirection, elle, est déjà partie. */
const DELAI_COCKPIT_MS = 5_000;

/** Issues attendues du cockpit : journalisées en info, pas en erreur. */
const STATUTS_NORMAUX: ReadonlySet<number> = new Set([200, 201, 404]);

const ROBOT =
  /bot|crawl|spider|preview|scanner|safelinks|proofpoint|mimecast|barracuda|headless|python|curl|wget|go-http|java\//i;

const LONGUEUR_NAVIGATEUR = 300;

export function idClicValide(id: string): boolean {
  return ID_CLIC.test(id);
}

/**
 * Les passerelles de sécurité des messageries (SafeLinks, Proofpoint…)
 * suivent les liens avant le destinataire : sans ce drapeau, chaque e-mail
 * filtré ressemblerait à un clic.
 */
export function estRobotProbable(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim() === "") return true;
  return ROBOT.test(userAgent);
}

/**
 * Une ligne, sans caractère de contrôle (C0, DEL, C1) ni séparateur de ligne
 * Unicode, 300 caractères au plus : le cockpit l'affiche tel quel.
 */
export function nettoyerNavigateur(userAgent: string | null): string {
  if (!userAgent) return "";
  return userAgent
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g, " ")
    .trim()
    .slice(0, LONGUEUR_NAVIGATEUR);
}

/**
 * Apple Mail (protection de la confidentialité) télécharge toutes les images
 * à la réception, par un relais dont le navigateur se résume à « Mozilla/5.0 » :
 * ce chargement ne dit pas que le destinataire a lu.
 */
export function ouvertureRobotProbable(userAgent: string | null): boolean {
  return estRobotProbable(userAgent) || userAgent?.trim() === "Mozilla/5.0";
}

type Nature = "clic" | "ouverture";

interface ClicARapporter {
  readonly nature: Nature;
  readonly id: string;
  readonly maintenantMs: number;
  readonly userAgent: string | null;
  readonly robot: boolean;
  /** Premier élément de `x-forwarded-for`, absent si l'en-tête est vide. */
  readonly ip?: string;
  /** Cookie `suivi-eliott=1` : c'est Eliott qui clique ou affiche. */
  readonly eliott: boolean;
}

export interface ThrottleClic {
  autoriser(id: string, maintenantMs: number, robot: boolean): boolean;
}

/**
 * 1 enregistrement par id toutes les 10 minutes, 30 par heure au total.
 * Les deux limites sont consultées d'abord, et consommées seulement si
 * l'appel part : un refus de l'une ne mange pas le quota de l'autre.
 */
function creerPlafond(): (id: string, maintenantMs: number) => boolean {
  const parId = creerLimiteur({
    fenetreMs: 10 * 60_000,
    maxParFenetre: 1,
    maxCles: 5_000,
  });
  const global = creerLimiteur({
    fenetreMs: 60 * 60_000,
    maxParFenetre: 30,
    maxCles: 1,
  });
  return (id, maintenantMs) => {
    if (!parId.consulter(id, maintenantMs)) return false;
    if (!global.consulter("tous", maintenantMs)) return false;
    parId.verifier(id, maintenantMs);
    global.verifier("tous", maintenantMs);
    return true;
  };
}

/**
 * Anti-inondation : quelqu'un qui martèle `/r/xxx` ne doit pas transformer
 * le site en relais d'appels vers le cockpit.
 *
 * Deux plafonds identiques et étanches, un pour les robots probables, un pour
 * les humains. Une passerelle de sécurité (SafeLinks, Proofpoint…) suit le
 * lien à la livraison, quelques secondes avant le destinataire : avec un
 * plafond commun, elle verrouillerait l'identifiant et le vrai clic ne serait
 * jamais enregistré. Les robots restent enregistrés, le cockpit s'en sert.
 *
 * ponytail: plafonds en mémoire du processus. Ils repartent de zéro à chaque
 * redéploiement et ne se partagent pas entre instances (voir `rate-limit.ts`).
 */
export function creerThrottleClic(): ThrottleClic {
  const humains = creerPlafond();
  const robots = creerPlafond();
  return {
    autoriser(id, maintenantMs, robot) {
      return (robot ? robots : humains)(id, maintenantMs);
    },
  };
}

/** Le sous-ensemble de `fetch` dont on a besoin, pour l'injecter en test. */
export type EnvoyerRequete = (url: string, init: RequestInit) => Promise<Response>;

export interface DependancesClic {
  /** `after()` de Next en production : le travail part après la réponse. */
  readonly planifier: (tache: () => Promise<void>) => void;
  /** `CLIC_TOKEN` en production. Absent ou vide : aucun appel. */
  readonly jeton: () => string | undefined;
  readonly envoyer: EnvoyerRequete;
  readonly throttle: ThrottleClic;
  readonly maintenantMs: () => number;
  /**
   * Offres déjà lues, par identifiant : un scanner de messagerie ouvre le lien
   * avant le destinataire, la seconde ouverture ne rappelle pas le cockpit.
   * Absente : chaque clic interroge le cockpit.
   */
  readonly memoireOffres?: Map<string, "logiciel" | "decouverte">;
}

function redirection(destination: string = DESTINATION_CLIC): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: destination,
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}

/**
 * Une ligne par clic, `[clic] <id> <issue>`. Ni jeton, ni navigateur, ni
 * corps de réponse : l'identifiant suffit à recouper avec le cockpit.
 */
function journaliser(nature: Nature, id: string, issue: string | number, normale: boolean): void {
  const ligne = `[${nature}] ${id} ${issue}`;
  if (normale) console.info(ligne);
  else console.error(ligne);
}

function estTimeout(erreur: unknown): boolean {
  return (
    typeof erreur === "object" &&
    erreur !== null &&
    "name" in erreur &&
    erreur.name === "TimeoutError"
  );
}

/** Ne lève jamais : toute issue se résume à une ligne de journal. */
async function enregistrer(clic: ClicARapporter, deps: DependancesClic): Promise<void> {
  const jeton = deps.jeton()?.trim();
  if (!jeton) {
    journaliser(clic.nature, clic.id, "non_configure", false);
    return;
  }
  try {
    const reponse = await deps.envoyer(URL_COCKPIT_CLICS, {
      method: "POST",
      headers: {
        authorization: `Bearer ${jeton}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: clic.id,
        cliqueLe: new Date(clic.maintenantMs).toISOString(),
        navigateur: nettoyerNavigateur(clic.userAgent),
        robotProbable: clic.robot,
        ...(clic.nature === "ouverture" ? { nature: "ouverture" } : {}),
        ...(clic.ip ? { ip: clic.ip } : {}),
        ...(clic.eliott ? { eliott: true } : {}),
      }),
      signal: AbortSignal.timeout(DELAI_COCKPIT_MS),
    });
    journaliser(clic.nature, clic.id, reponse.status, STATUTS_NORMAUX.has(reponse.status));
    // Corps inutile : le libérer rend la connexion au pool.
    await reponse.body?.cancel().catch(() => undefined);
  } catch (erreur) {
    journaliser(clic.nature, clic.id, estTimeout(erreur) ? "timeout" : "reseau", false);
  }
}

/** Le cookie posé sur eliottbouquerel.fr par le suivi des démos. */
function porteCookieEliott(requete: Request): boolean {
  const cookies = requete.headers.get("cookie") ?? "";
  return cookies.split(";").some((c) => c.trim() === "suivi-eliott=1");
}

function ipDuVisiteur(requete: Request): string | undefined {
  if (!requete.headers.get("x-forwarded-for")) return undefined;
  const ip = adresseAppelante(requete.headers);
  return ip === "sans-adresse" ? undefined : ip;
}

function planifierEnregistrement(
  requete: Request,
  nature: Nature,
  id: string,
  deps: DependancesClic,
): void {
  if (requete.method !== "GET" || !idClicValide(id)) return;
  const maintenantMs = deps.maintenantMs();
  const userAgent = requete.headers.get("user-agent");
  const robot = nature === "ouverture" ? ouvertureRobotProbable(userAgent) : estRobotProbable(userAgent);
  if (deps.throttle.autoriser(id, maintenantMs, robot)) {
    const clic: ClicARapporter = {
      nature,
      id,
      maintenantMs,
      userAgent,
      robot,
      ip: ipDuVisiteur(requete),
      eliott: porteCookieEliott(requete),
    };
    deps.planifier(() => enregistrer(clic, deps));
  }
}

/**
 * Toujours la même redirection. Un enregistrement n'est planifié que pour un
 * GET à l'identifiant valide et sous le plafond : HEAD sert aux sondes et aux
 * vérificateurs de liens, qui ne sont pas des clics.
 */
export function traiterClic(
  requete: Request,
  id: string,
  deps: DependancesClic,
  destination: string = DESTINATION_CLIC,
): Response {
  planifierEnregistrement(requete, "clic", id, deps);
  return redirection(destination);
}

/** Ne lève jamais : toute issue qui n'est pas « logiciel » rend la découverte. */
async function offreDuCockpit(id: string, deps: DependancesClic): Promise<"logiciel" | "decouverte"> {
  const memoire = deps.memoireOffres?.get(id);
  if (memoire) return memoire;
  const jeton = deps.jeton()?.trim();
  if (!jeton) return "decouverte";
  try {
    const reponse = await deps.envoyer(urlCockpitOffre(id), {
      method: "GET",
      headers: { authorization: `Bearer ${jeton}` },
      signal: AbortSignal.timeout(DELAI_OFFRE_MS),
    });
    if (reponse.status !== 200) {
      await reponse.body?.cancel().catch(() => undefined);
      return "decouverte";
    }
    const corps: unknown = await reponse.json();
    const offre =
      typeof corps === "object" && corps !== null && "offre" in corps && corps.offre === "logiciel"
        ? "logiciel"
        : "decouverte";
    if (deps.memoireOffres) {
      if (deps.memoireOffres.size >= MEMOIRE_OFFRES_MAX) deps.memoireOffres.clear();
      deps.memoireOffres.set(id, offre);
    }
    return offre;
  } catch {
    return "decouverte";
  }
}

/**
 * Le clic de la route : la destination suit l'offre du mail (formulaire
 * logiciel pour un mail logiciel, découverte pour tout le reste), les liens
 * déjà envoyés compris. Seuls les vrais clics (GET, identifiant valide)
 * interrogent le cockpit ; le reste, et toute panne, rend la découverte.
 */
export async function traiterClicSuivi(
  requete: Request,
  id: string,
  deps: DependancesClic,
): Promise<Response> {
  const offre =
    requete.method === "GET" && idClicValide(id) ? await offreDuCockpit(id, deps) : "decouverte";
  return traiterClic(
    requete,
    id,
    deps,
    offre === "logiciel" ? DESTINATION_CLIC_LOGICIEL : DESTINATION_CLIC,
  );
}

/**
 * Affichage du portrait de la signature : toujours redirigé vers l'image fixe,
 * relayé au cockpit comme une ouverture. Mêmes règles que le clic, avec son
 * propre plafond (`deps.throttle` distinct dans la route).
 */
export function traiterOuverture(
  requete: Request,
  id: string,
  deps: DependancesClic,
): Response {
  planifierEnregistrement(requete, "ouverture", id, deps);
  const buste = new URL(requete.url).searchParams.get("forme") === "buste";
  return redirection(buste ? DESTINATION_BUSTE : DESTINATION_OUVERTURE);
}
