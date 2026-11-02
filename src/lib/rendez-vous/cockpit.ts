/**
 * Client du moteur de réservation du cockpit (`admin.eliottbouquerel.fr`).
 *
 * SERVEUR À SERVEUR UNIQUEMENT. Les routes `/api/rdv/*` du cockpit exigent
 * `Authorization: Bearer RDV_TOKEN` : ce module n'est importé que par les
 * routes et les pages serveur du site, jamais par un composant client. Le
 * navigateur parle à NOS routes, qui gardent origine, débit et captcha.
 *
 * MÊME INTERFACE QUE L'ANCIEN CLIENT CAL.COM (`recupererCreneaux`,
 * `obtenirDurees`, `creerReservation`), plus la gestion d'un rendez-vous par
 * son jeton (lire, annuler, déplacer) pour la page `/rdv/gerer/[jeton]`.
 *
 * AUCUNE EXCEPTION NE SORT D'ICI. Chaque fonction rend un résultat discriminé :
 * une panne du cockpit doit produire un message lisible chez le prospect, pas
 * une page 500.
 */
import { resoudreAcces } from "./config";
import type { Environnement } from "./config";
import { ajouterJours, FUSEAU } from "./creneaux";
import { lireDurees } from "./durees";
import type { Durees } from "./durees";

/**
 * Délais maximaux. L'écriture est plus longue : le cockpit crée l'événement
 * Google et son lien Meet avant de répondre.
 */
const DELAI_LECTURE_MS = 8_000;
const DELAI_ECRITURE_MS = 15_000;

export type EchecCockpit =
  /** Le cockpit a répondu en refusant ; `detail` porte son code (`creneau_pris`…). */
  | { readonly raison: "refuse"; readonly statut: number; readonly detail: string }
  /** Aucune réponse exploitable : réseau, délai, corps illisible, pas configuré. */
  | { readonly raison: "indisponible"; readonly detail: string };

export type ResultatCockpit<T> =
  | { readonly ok: true; readonly donnees: T }
  | ({ readonly ok: false } & EchecCockpit);

/** Code d'erreur du cockpit (`{ erreur: "creneau_pris" }`), borné, pour le journal. */
function codeErreur(charge: unknown): string {
  if (typeof charge !== "object" || charge === null) return "";
  const erreur = (charge as Record<string, unknown>).erreur;
  return typeof erreur === "string" ? erreur.slice(0, 100) : "";
}

async function lireJson(reponse: Response): Promise<unknown> {
  try {
    return await reponse.json();
  } catch {
    return undefined;
  }
}

interface Appel {
  readonly methode?: "GET" | "POST";
  readonly corps?: unknown;
  readonly delaiMs: number;
}

async function appeler(
  chemin: string,
  appel: Appel,
  env: Environnement,
): Promise<ResultatCockpit<unknown>> {
  const acces = resoudreAcces(env);
  if (!acces) return { ok: false, raison: "indisponible", detail: "non_configure" };
  const enTetes: Record<string, string> = {
    authorization: `Bearer ${acces.jeton}`,
    accept: "application/json",
  };
  if (appel.corps !== undefined) enTetes["content-type"] = "application/json";
  try {
    const reponse = await fetch(`${acces.url}${chemin}`, {
      method: appel.methode ?? "GET",
      headers: enTetes,
      ...(appel.corps !== undefined ? { body: JSON.stringify(appel.corps) } : {}),
      cache: "no-store",
      // Une redirection (page de connexion du cockpit, mandataire) n'est jamais
      // une réponse de l'API, et suivre l'emmènerait avec le jeton.
      redirect: "error",
      signal: AbortSignal.timeout(appel.delaiMs),
    });
    const charge = await lireJson(reponse);
    if (!reponse.ok) {
      return { ok: false, raison: "refuse", statut: reponse.status, detail: codeErreur(charge) };
    }
    return { ok: true, donnees: charge };
  } catch (erreur) {
    return {
      ok: false,
      raison: "indisponible",
      detail: erreur instanceof Error ? erreur.name : "inconnue",
    };
  }
}

/**
 * Créneaux libres d'un type, sur une fenêtre de jours civils parisiens.
 *
 * @param cible Clé du type côté cockpit (`logiciel`, `decouverte`…).
 * @param debut Jour `AAAA-MM-JJ` inclus, déjà borné par `fenetreMois`.
 * @param fin Jour `AAAA-MM-JJ` inclus. Le cockpit lit `au` comme minuit à
 *   Paris, donc une borne EXCLUE : on lui passe le lendemain.
 * @param duree Minutes ; absente = durée par défaut du type.
 * @returns La charge du cockpit (`{ jours: [{ jour, creneaux }] }`), lue par
 *   `lireCreneaux`.
 */
export async function recupererCreneaux(
  cible: string,
  debut: string,
  fin: string,
  duree?: number,
  env: Environnement = process.env,
): Promise<ResultatCockpit<unknown>> {
  const parametres = new URLSearchParams({
    type: cible,
    du: debut,
    au: ajouterJours(fin, 1),
    fuseau: FUSEAU,
  });
  if (duree !== undefined) parametres.set("duree", String(duree));
  return appeler(`/api/rdv/creneaux?${parametres.toString()}`, { delaiMs: DELAI_LECTURE_MS }, env);
}

/**
 * Types du cockpit, gardés cinq minutes en mémoire : chaque page de calendrier
 * comme chaque réservation consulte les durées, qui changent rarement.
 */
const CACHE_TYPES_MS = 5 * 60 * 1000;
const cacheTypes = new Map<string, { readonly expire: number; readonly durees: ReadonlyMap<string, Durees> }>();

function lireTypes(charge: unknown): ReadonlyMap<string, Durees> | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const types = (charge as Record<string, unknown>).types;
  if (!Array.isArray(types)) return undefined;
  const parCle = new Map<string, Durees>();
  for (const brut of types) {
    if (typeof brut !== "object" || brut === null) continue;
    const type = brut as Record<string, unknown>;
    if (typeof type.cle !== "string") continue;
    const durees = lireDurees({ options: type.durees, defaut: type.defaut });
    if (durees) parCle.set(type.cle, durees);
  }
  return parCle;
}

/**
 * Durées proposées par un type, `undefined` quand on ne les a pas.
 *
 * UN ÉCHEC N'EST PAS UNE PANNE : le sélecteur disparaît et la réservation part
 * à la durée par défaut. Il n'est pas mis en cache, pour que la requête
 * suivante retente.
 */
export async function obtenirDurees(
  cible: string,
  maintenantMs: number = Date.now(),
  env: Environnement = process.env,
): Promise<Durees | undefined> {
  const acces = resoudreAcces(env);
  if (!acces) return undefined;
  const enCache = cacheTypes.get(acces.url);
  if (enCache && enCache.expire > maintenantMs) return enCache.durees.get(cible);

  const resultat = await appeler("/api/rdv/types", { delaiMs: DELAI_LECTURE_MS }, env);
  if (!resultat.ok) return undefined;
  const durees = lireTypes(resultat.donnees);
  if (!durees) return undefined;
  cacheTypes.set(acces.url, { expire: maintenantMs + CACHE_TYPES_MS, durees });
  return durees.get(cible);
}

export interface DemandeReservation {
  /** Clé du type côté cockpit. */
  readonly cible: string;
  /** Instant de début en ISO 8601 UTC. */
  readonly debutUtc: string;
  /** Minutes, déjà vérifiées parmi les options du type ; absente = défaut. */
  readonly duree?: number;
  readonly nom: string;
  readonly email: string;
  readonly telephone?: string;
  /** Texte composé par `composerNotes` : téléphone en tête, réponses, message. */
  readonly notes?: string;
  /** Réponses brutes du questionnaire (identifiants), pour le cockpit. */
  readonly reponses?: Readonly<Record<string, string>>;
}

export interface ReservationCreee {
  /** Identifiant du rendez-vous au cockpit, utile au journal. */
  readonly uid: string;
}

function lireTexte(charge: unknown, champ: string): string {
  if (typeof charge !== "object" || charge === null) return "";
  const valeur = (charge as Record<string, unknown>)[champ];
  return typeof valeur === "string" ? valeur : "";
}

export async function creerReservation(
  demande: DemandeReservation,
  env: Environnement = process.env,
): Promise<ResultatCockpit<ReservationCreee>> {
  // Le cockpit exige une durée. Sans durée choisie, celle par défaut du type.
  const duree = demande.duree ?? (await obtenirDurees(demande.cible, Date.now(), env))?.defaut;
  if (duree === undefined) {
    return { ok: false, raison: "indisponible", detail: "durees_inconnues" };
  }
  const corps: Record<string, unknown> = {
    type: demande.cible,
    duree,
    debut: demande.debutUtc,
    nom: demande.nom,
    email: demande.email,
    fuseau: FUSEAU,
  };
  if (demande.telephone) corps.telephone = demande.telephone;
  if (demande.notes) corps.notes = demande.notes;
  if (demande.reponses && Object.keys(demande.reponses).length > 0) {
    corps.reponses = demande.reponses;
  }

  const resultat = await appeler(
    "/api/rdv",
    { methode: "POST", corps, delaiMs: DELAI_ECRITURE_MS },
    env,
  );
  if (!resultat.ok) return resultat;
  return { ok: true, donnees: { uid: lireTexte(resultat.donnees, "id") } };
}

/* ───────────────────────── Gestion par jeton ───────────────────────── */

/** Jeton de gestion : 32 octets en base64url, comme le cockpit le fabrique. */
const MOTIF_JETON = /^[\w-]{43}$/;

export function estJetonGestion(valeur: unknown): valeur is string {
  return typeof valeur === "string" && MOTIF_JETON.test(valeur);
}

export type StatutRendezVous = "CONFIRME" | "ANNULE" | "DEPLACE";

const STATUTS: readonly string[] = ["CONFIRME", "ANNULE", "DEPLACE"];

/** Ce que la page de gestion sait d'un rendez-vous. Ni nom ni e-mail. */
export interface RendezVousGere {
  /** Clé du type côté cockpit. */
  readonly type: string;
  readonly titre: string;
  readonly duree: number;
  /** Durées admises par le type, pour un déplacement. */
  readonly durees: Durees;
  /** Instants ISO 8601. */
  readonly debut: string;
  readonly fin: string;
  readonly statut: StatutRendezVous;
}

function estStatut(valeur: unknown): valeur is StatutRendezVous {
  return typeof valeur === "string" && STATUTS.includes(valeur);
}

function estInstant(valeur: unknown): valeur is string {
  return typeof valeur === "string" && !Number.isNaN(new Date(valeur).getTime());
}

/** Relit la réponse de `GET /api/rdv/gestion/[jeton]`, `undefined` si elle ne tient pas. */
export function lireRendezVousGere(charge: unknown): RendezVousGere | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const o = charge as Record<string, unknown>;
  // `lireDurees` ne rend rien quand la durée du rendez-vous n'est pas plausible.
  const durees = lireDurees({
    options: Array.isArray(o.durees) ? o.durees : [],
    defaut: o.duree,
  });
  if (
    typeof o.type !== "string" ||
    typeof o.titre !== "string" ||
    !durees ||
    !estInstant(o.debut) ||
    !estInstant(o.fin) ||
    !estStatut(o.statut)
  ) {
    return undefined;
  }
  return {
    type: o.type,
    titre: o.titre,
    duree: durees.defaut,
    durees,
    debut: new Date(o.debut).toISOString(),
    fin: new Date(o.fin).toISOString(),
    statut: o.statut,
  };
}

const cheminGestion = (jeton: string) => `/api/rdv/gestion/${encodeURIComponent(jeton)}`;

/** Le rendez-vous d'un lien de gestion. Jeton inconnu = refus 404. */
export async function lireGestion(
  jeton: string,
  env: Environnement = process.env,
): Promise<ResultatCockpit<RendezVousGere>> {
  if (!estJetonGestion(jeton)) return { ok: false, raison: "refuse", statut: 404, detail: "introuvable" };
  const resultat = await appeler(cheminGestion(jeton), { delaiMs: DELAI_LECTURE_MS }, env);
  if (!resultat.ok) return resultat;
  const rdv = lireRendezVousGere(resultat.donnees);
  return rdv
    ? { ok: true, donnees: rdv }
    : { ok: false, raison: "indisponible", detail: "charge_illisible" };
}

/** Annule ; rejouée sur un rendez-vous déjà annulé, elle ne refait rien. */
export async function annulerRendezVous(
  jeton: string,
  motif: string | undefined,
  env: Environnement = process.env,
): Promise<ResultatCockpit<{ readonly deja: boolean }>> {
  if (!estJetonGestion(jeton)) return { ok: false, raison: "refuse", statut: 404, detail: "introuvable" };
  const resultat = await appeler(
    `${cheminGestion(jeton)}/annuler`,
    { methode: "POST", corps: motif ? { motif } : {}, delaiMs: DELAI_ECRITURE_MS },
    env,
  );
  if (!resultat.ok) return resultat;
  const deja =
    typeof resultat.donnees === "object" &&
    resultat.donnees !== null &&
    (resultat.donnees as Record<string, unknown>).deja === true;
  return { ok: true, donnees: { deja } };
}

export interface Deplacement {
  readonly debut: string;
  readonly fin: string;
  /** Nouveau jeton : l'ancien lien ne gère plus rien après un déplacement. */
  readonly jetonGestion: string;
}

/** Déplace sur un nouveau créneau ; 409 `creneau_pris` s'il vient d'être pris. */
export async function deplacerRendezVous(
  jeton: string,
  demande: { readonly debutUtc: string; readonly duree?: number },
  env: Environnement = process.env,
): Promise<ResultatCockpit<Deplacement>> {
  if (!estJetonGestion(jeton)) return { ok: false, raison: "refuse", statut: 404, detail: "introuvable" };
  const resultat = await appeler(
    `${cheminGestion(jeton)}/deplacer`,
    {
      methode: "POST",
      corps: {
        debut: demande.debutUtc,
        ...(demande.duree !== undefined ? { duree: demande.duree } : {}),
      },
      delaiMs: DELAI_ECRITURE_MS,
    },
    env,
  );
  if (!resultat.ok) return resultat;
  const jetonGestion = lireTexte(resultat.donnees, "jetonGestion");
  const debut = lireTexte(resultat.donnees, "debut");
  const fin = lireTexte(resultat.donnees, "fin");
  if (!estJetonGestion(jetonGestion) || !estInstant(debut)) {
    return { ok: false, raison: "indisponible", detail: "charge_illisible" };
  }
  return { ok: true, donnees: { debut, fin, jetonGestion } };
}
