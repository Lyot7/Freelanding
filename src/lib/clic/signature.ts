/**
 * Clic sur le lien « Prendre contact » des e-mails de prospection.
 *
 * Chaque e-mail porte un lien unique `/r/<id>`. La route redirige toujours
 * vers `/contact` et, pour un vrai clic, prévient Eliott par e-mail : il sait
 * QUI a cliqué sans pixel d'ouverture et sans cookie.
 *
 * CONTRAT PARTAGÉ avec le pipeline d'envoi (autre dépôt) : il génère les
 * identifiants au format `ID_CLIC` et parse le corps de la notification ligne
 * par ligne. Le sujet, les quatre libellés et la destination ne bougent pas
 * sans lui.
 *
 * Tout est ici, dépendances injectées, pour que la route soit testable sans
 * serveur Next : `route.ts` ne fait que brancher `after()` et le vrai mailer.
 */
import { creerJournal } from "../api/reponse";
import type { MessageCompose } from "../contact/emails";
import type { ResolutionExpediteur } from "../contact/mailer";
import { creerLimiteur } from "../contact/rate-limit";
import { echapperHtml } from "../contact/sanitize";

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

const ROBOT =
  /bot|crawl|spider|preview|scanner|safelinks|proofpoint|mimecast|barracuda|headless|python|curl|wget|go-http|java\//i;

const LONGUEUR_NAVIGATEUR = 300;

const journaliser = creerJournal("clic");

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
 * Unicode, 300 caractères au plus : le pipeline parse le corps ligne par ligne.
 */
export function nettoyerNavigateur(userAgent: string | null): string {
  if (!userAgent) return "";
  return userAgent
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g, " ")
    .trim()
    .slice(0, LONGUEUR_NAVIGATEUR);
}

export interface ClicARapporter {
  readonly id: string;
  readonly maintenantMs: number;
  readonly userAgent: string | null;
}

export function composerNotificationClic(clic: ClicARapporter): MessageCompose {
  const lignes = [
    `Identifiant : ${clic.id}`,
    `Date : ${new Date(clic.maintenantMs).toISOString()}`,
    `Navigateur : ${nettoyerNavigateur(clic.userAgent)}`,
    `Robot probable : ${estRobotProbable(clic.userAgent) ? "oui" : "non"}`,
  ];
  return {
    sujet: `Clic signature : ${clic.id}`,
    texte: lignes.join("\n"),
    html: lignes.map((ligne) => `<p>${echapperHtml(ligne)}</p>`).join(""),
  };
}

export interface ThrottleClic {
  autoriser(id: string, maintenantMs: number, robot: boolean): boolean;
}

/**
 * 1 notification par id toutes les 10 minutes, 30 par heure au total.
 * Les deux limites sont consultées d'abord, et consommées seulement si la
 * notification part : un refus de l'une ne mange pas le quota de l'autre.
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
 * Anti-inondation : quelqu'un qui martèle `/r/xxx` ne doit pas remplir la
 * boîte d'Eliott.
 *
 * Deux plafonds identiques et étanches, un pour les robots probables, un pour
 * les humains. Une passerelle de sécurité (SafeLinks, Proofpoint…) suit le
 * lien à la livraison, quelques secondes avant le destinataire : avec un
 * plafond commun, elle verrouillerait l'identifiant et le vrai clic ne serait
 * jamais notifié. Les robots restent notifiés, le pipeline s'en sert.
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

export interface DependancesClic {
  /** `after()` de Next en production : le travail part après la réponse. */
  readonly planifier: (tache: () => Promise<void>) => void;
  readonly resoudreExpediteur: () => ResolutionExpediteur;
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
 * Ne lève jamais : un échec d'envoi se journalise avec l'identifiant seul,
 * sans adresse ni détail du transport qui pourrait en contenir une.
 */
async function notifier(
  clic: ClicARapporter,
  resoudre: () => ResolutionExpediteur,
): Promise<void> {
  try {
    const resolution = resoudre();
    if (!resolution.ok) {
      journaliser("expediteur_non_configure", {
        id: clic.id,
        variableManquante: resolution.variableManquante,
      });
      return;
    }
    const { expediteur } = resolution;
    const envoi = await expediteur.envoyer({
      destinataire: expediteur.versEliott,
      message: composerNotificationClic(clic),
    });
    if (!envoi.ok) {
      journaliser("notification_echouee", {
        id: clic.id,
        transport: expediteur.nom,
        raison: envoi.raison,
      });
    }
  } catch (erreur) {
    journaliser("notification_echouee", {
      id: clic.id,
      raison: erreur instanceof Error ? erreur.name : "inconnue",
    });
  }
}

/**
 * Toujours la même redirection. Une notification n'est planifiée que pour un
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
      deps.planifier(() => notifier(clic, deps.resoudreExpediteur));
    }
  }
  return redirection();
}
