/**
 * Configuration de la prise de rendez-vous : accès au cockpit, depuis
 * l'environnement.
 *
 * LE COCKPIT EST LE MOTEUR DE RÉSERVATION depuis le 2026-11-02 (Cal.com est
 * retiré : un tiers voyait les données d'Eliott et de ses prospects). Le site
 * garde son interface et appelle, depuis son SERVEUR, les routes `/api/rdv/*`
 * du cockpit (`admin.eliottbouquerel.fr`), protégées par `RDV_TOKEN`.
 *
 * CE MODULE EST PUR : `process.env` n'est lu que par le paramètre par défaut,
 * jamais au chargement. Il est importé par un composant CLIENT
 * (`ReservationAvecSujet`, pour `resoudreSujet`) : rien ici ne doit lire un
 * secret à l'import, sinon il partirait dans le paquet du navigateur.
 *
 * ABSENCE DE CONFIGURATION = BLOC MASQUÉ, JAMAIS DE PANNE. Sans `RDV_TOKEN`,
 * `typesDisponibles` est vide, la section ne se rend pas et les routes
 * répondent 503 avec un message honnête. C'est l'état par défaut du dépôt.
 */
import { IDS_RENDEZ_VOUS } from "@/content/rendez-vous";
import type { IdRendezVous } from "@/content/rendez-vous";

/** Adresse du cockpit quand `COCKPIT_URL` n'est pas posée. */
export const URL_COCKPIT_PAR_DEFAUT = "https://admin.eliottbouquerel.fr";

/**
 * Clé du type de rendez-vous côté cockpit (`src/lib/rdv/types.ts` du cockpit),
 * pour chaque entrée du sélecteur du site. Les deux vocabulaires coïncident
 * aujourd'hui ; la table existe pour qu'un renommage d'un côté ne casse pas
 * l'autre en silence.
 */
export const CLES_COCKPIT: Readonly<Record<IdRendezVous, string>> = {
  logiciel: "logiciel",
  decouverte: "decouverte",
};

/** Où et comment joindre le cockpit. Le jeton ne quitte jamais le serveur. */
export interface AccesCockpit {
  /** Origine, sans barre finale (`https://admin.eliottbouquerel.fr`). */
  readonly url: string;
  readonly jeton: string;
}

export interface ConfigurationRendezVous {
  /** Clé cockpit de chaque type réservable. Une entrée absente = type fermé. */
  readonly cibles: Readonly<Partial<Record<IdRendezVous, string>>>;
  /** Types réellement réservables, dans l'ordre d'affichage du contenu. */
  readonly typesDisponibles: readonly IdRendezVous[];
}

/** Table d'environnement, réduite à ce qui nous intéresse. */
export type Environnement = Readonly<Record<string, string | undefined>>;

function lire(env: Environnement, clef: string): string {
  return (env[clef] ?? "").trim();
}

const HOTES_LOCAUX = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Accès au cockpit, `undefined` sans `RDV_TOKEN` ou avec une `COCKPIT_URL`
 * inutilisable. Le jeton part dans un en-tête : il n'est accepté en clair
 * (`http:`) que vers la machine locale.
 */
export function resoudreAcces(env: Environnement = process.env): AccesCockpit | undefined {
  const jeton = lire(env, "RDV_TOKEN");
  if (jeton.length === 0) return undefined;
  let url: URL;
  try {
    url = new URL(lire(env, "COCKPIT_URL") || URL_COCKPIT_PAR_DEFAUT);
  } catch {
    return undefined;
  }
  const local = HOTES_LOCAUX.has(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return undefined;
  return { url: url.origin, jeton };
}

export function resoudreConfiguration(
  env: Environnement = process.env,
): ConfigurationRendezVous {
  if (!resoudreAcces(env)) return { cibles: {}, typesDisponibles: [] };
  const cibles: Partial<Record<IdRendezVous, string>> = {};
  for (const id of IDS_RENDEZ_VOUS) cibles[id] = CLES_COCKPIT[id];
  return { cibles, typesDisponibles: [...IDS_RENDEZ_VOUS] };
}

/** Vrai quand la chaîne reçue du client désigne un type connu du contenu. */
export function estIdRendezVous(valeur: unknown): valeur is IdRendezVous {
  return (
    typeof valeur === "string" &&
    (IDS_RENDEZ_VOUS as readonly string[]).includes(valeur)
  );
}

/**
 * Anciens sujets encore présents dans des liens publiés, et leur successeur.
 *
 * « outil » a été fusionné dans « logiciel » le 2026-09-23. Un lien
 * `?sujet=outil` envoyé par e-mail ou indexé avant cette date doit encore
 * présélectionner quelque chose : le visiteur n'a rien demandé de faux.
 */
const SUJETS_RENOMMES: Readonly<Record<string, IdRendezVous>> = {
  outil: "logiciel",
  ia: "logiciel",
  site: "decouverte",
  cto: "decouverte",
};

/**
 * Sujet lu dans l'URL → type de rendez-vous, ancien nom compris.
 *
 * `undefined` pour tout ce qui n'est ni un type connu ni un ancien nom : le
 * paramètre est alors ignoré en silence, comme avant.
 */
export function resoudreSujet(valeur: unknown): IdRendezVous | undefined {
  if (estIdRendezVous(valeur)) return valeur;
  if (typeof valeur !== "string" || !Object.hasOwn(SUJETS_RENOMMES, valeur)) {
    return undefined;
  }
  return SUJETS_RENOMMES[valeur];
}
