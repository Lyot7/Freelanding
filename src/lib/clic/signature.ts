/**
 * Clic sur le lien « Prendre contact » des e-mails de prospection.
 *
 * Chaque e-mail porte un lien unique `/r/<id>`. La route redirige toujours
 * vers `/contact` et, pour un vrai clic, l'enregistre dans le cockpit
 * d'Eliott : il sait QUI a cliqué sans pixel d'ouverture et sans cookie.
 *
 * CONTRATS PARTAGÉS avec deux autres dépôts. Le pipeline d'envoi génère les
 * identifiants au format `ID_CLIC`. Le cockpit (`admin.eliottbouquerel.fr`)
 * reçoit `POST /api/clics` avec un jeton Bearer et le corps
 * `{ id, cliqueLe, navigateur, robotProbable }`. Il répond 201 (créé), 200
 * (déjà enregistré), 404 (identifiant qui ne correspond à aucun envoi,
 * attendu) ; 400, 401 et 503 signalent un défaut de notre côté ou du sien.
 * L'URL, les en-têtes et les quatre champs ne bougent pas sans lui.
 *
 * Tout est ici, dépendances injectées, pour que la route soit testable sans
 * serveur Next : `route.ts` ne fait que brancher `after()`, `fetch` et
 * `CLIC_TOKEN`.
 */
import { creerLimiteur } from "../contact/rate-limit";

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
  "https://eliottbouquerel.fr/contact?utm_source=email&utm_medium=signature&utm_campaign=prospection";

/**
 * Littérale pour la même raison que la destination : le jeton ne doit partir
 * que vers le cockpit, quel que soit l'environnement.
 */
export const URL_COCKPIT_CLICS = "https://admin.eliottbouquerel.fr/api/clics";

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

interface ClicARapporter {
  readonly id: string;
  readonly maintenantMs: number;
  readonly userAgent: string | null;
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
}

function redirection(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: DESTINATION_CLIC,
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
function journaliser(id: string, issue: string | number, normale: boolean): void {
  const ligne = `[clic] ${id} ${issue}`;
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
    journaliser(clic.id, "non_configure", false);
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
        robotProbable: estRobotProbable(clic.userAgent),
      }),
      signal: AbortSignal.timeout(DELAI_COCKPIT_MS),
    });
    journaliser(clic.id, reponse.status, STATUTS_NORMAUX.has(reponse.status));
    // Corps inutile : le libérer rend la connexion au pool.
    await reponse.body?.cancel().catch(() => undefined);
  } catch (erreur) {
    journaliser(clic.id, estTimeout(erreur) ? "timeout" : "reseau", false);
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
): Response {
  if (requete.method === "GET" && idClicValide(id)) {
    const maintenantMs = deps.maintenantMs();
    const userAgent = requete.headers.get("user-agent");
    const robot = estRobotProbable(userAgent);
    if (deps.throttle.autoriser(id, maintenantMs, robot)) {
      const clic: ClicARapporter = { id, maintenantMs, userAgent };
      deps.planifier(() => enregistrer(clic, deps));
    }
  }
  return redirection();
}
