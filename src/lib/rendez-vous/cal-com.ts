/**
 * Client de l'API publique Cal.com v2.
 *
 * L'EMBED N'EST PAS OBLIGATOIRE, et c'est tout l'objet de ce fichier. Les deux
 * points de terminaison employés ici répondent SANS clef d'API, ce qui a été
 * vérifié à la main avant d'écrire une ligne :
 *
 *   GET  /v2/slots     → 200 sans en-tête d'autorisation ;
 *   POST /v2/bookings  → 400 sur la validation du corps, puis 404 sur un
 *                        `eventTypeId` inconnu. Jamais 401.
 *
 * Le second point compte plus que le premier : un 401 aurait signifié « il faut
 * une clef », un 400 signifie « l'endpoint est ouvert, ton corps est faux ».
 * C'est ce qui autorise une interface entièrement dessinée à la main plutôt
 * qu'une iframe.
 *
 * L'EN-TÊTE DE VERSION EST OBLIGATOIRE, et il DIFFÈRE d'un point de
 * terminaison à l'autre. Sans lui, Cal.com sert une version antérieure au
 * contrat écrit ici : mesuré, un POST sans en-tête réclame `metadata`,
 * `language` et un `timeZone` qu'il refuse ensuite. Les deux constantes
 * ci-dessous ne sont donc pas décoratives.
 *
 * AUCUNE EXCEPTION NE SORT D'ICI. Les deux fonctions rendent un résultat
 * discriminé : une panne réseau chez Cal.com doit produire un message lisible
 * dans le navigateur du prospect, pas une page 500.
 */
import type { CibleEvenement } from "./config";
import { FUSEAU } from "./creneaux";

const BASE = "https://api.cal.com/v2";

/** Version d'en-tête de `GET /v2/slots`. Vérifiée le 2026-08-31. */
export const VERSION_CRENEAUX = "2024-09-04";
/** Version d'en-tête de `POST /v2/bookings`. Vérifiée le 2026-08-31. */
export const VERSION_RESERVATIONS = "2024-08-13";

/**
 * Délais maximaux.
 *
 * Sans eux, une panne chez Cal.com tiendrait la requête ouverte jusqu'au délai
 * de la plateforme d'hébergement et le prospect regarderait un bouton qui
 * tourne. Même raisonnement que le vérificateur Turnstile.
 */
const DELAI_LECTURE_MS = 8_000;
const DELAI_ECRITURE_MS = 12_000;

export type EchecCalCom =
  /** Cal.com a répondu, mais en refusant (404 sur un type inconnu, 400, 409…). */
  | { readonly raison: "refuse"; readonly statut: number; readonly detail: string }
  /** Aucune réponse exploitable : réseau, délai dépassé, corps illisible. */
  | { readonly raison: "indisponible"; readonly detail: string };

export type ResultatCalCom<T> =
  | { readonly ok: true; readonly donnees: T }
  | ({ readonly ok: false } & EchecCalCom);

/** Ajoute à une requête les paramètres qui désignent le type d'événement. */
function poserCible(parametres: URLSearchParams, cible: CibleEvenement): void {
  if (cible.par === "id") {
    parametres.set("eventTypeId", String(cible.eventTypeId));
    return;
  }
  parametres.set("eventTypeSlug", cible.eventTypeSlug);
  parametres.set("username", cible.username);
}

/** Même chose, pour un corps JSON. */
function corpsCible(cible: CibleEvenement): Record<string, string | number> {
  return cible.par === "id"
    ? { eventTypeId: cible.eventTypeId }
    : { eventTypeSlug: cible.eventTypeSlug, username: cible.username };
}

/**
 * Extrait un message d'erreur exploitable d'une réponse Cal.com.
 *
 * Le format est `{ error: { message } }`, mais il ne faut jamais en dépendre :
 * un mandataire en travers renvoie du HTML. Le retour est donc borné en
 * longueur et destiné au JOURNAL SERVEUR, jamais au navigateur du prospect.
 */
function detailErreur(charge: unknown): string {
  if (typeof charge !== "object" || charge === null) return "";
  const erreur = (charge as Record<string, unknown>).error;
  if (typeof erreur !== "object" || erreur === null) return "";
  const message = (erreur as Record<string, unknown>).message;
  return typeof message === "string" ? message.slice(0, 300) : "";
}

async function lireJson(reponse: Response): Promise<unknown> {
  try {
    return await reponse.json();
  } catch {
    return undefined;
  }
}

/**
 * Créneaux libres d'un type d'événement, sur une fenêtre de jours civils.
 *
 * @param debut Jour `AAAA-MM-JJ` inclus, déjà borné par `fenetreSemaine`.
 * @param fin Jour `AAAA-MM-JJ` inclus.
 */
export async function recupererCreneaux(
  cible: CibleEvenement,
  debut: string,
  fin: string,
): Promise<ResultatCalCom<unknown>> {
  const parametres = new URLSearchParams();
  poserCible(parametres, cible);
  parametres.set("start", debut);
  parametres.set("end", fin);
  // Sans ce paramètre, Cal.com répond en UTC : l'affichage serait juste à une
  // ou deux heures près, ce qui est exactement le genre d'erreur qui ne se voit
  // qu'après un rendez-vous manqué.
  parametres.set("timeZone", FUSEAU);

  try {
    const reponse = await fetch(`${BASE}/slots?${parametres.toString()}`, {
      headers: { "cal-api-version": VERSION_CRENEAUX },
      // La route qui appelle est déjà `force-dynamic` ; on le redit ici pour
      // que le cache de `fetch` de Next ne serve pas des créneaux périmés.
      cache: "no-store",
      signal: AbortSignal.timeout(DELAI_LECTURE_MS),
    });
    const charge = await lireJson(reponse);
    if (!reponse.ok) {
      return {
        ok: false,
        raison: "refuse",
        statut: reponse.status,
        detail: detailErreur(charge),
      };
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

export interface DemandeReservation {
  readonly cible: CibleEvenement;
  /** Instant de début en ISO 8601 UTC. */
  readonly debutUtc: string;
  readonly nom: string;
  readonly email: string;
  readonly message?: string;
}

export interface ReservationCreee {
  /** Identifiant public de la réservation, utile au journal et au suivi. */
  readonly uid: string;
}

function lireUid(charge: unknown): string {
  if (typeof charge !== "object" || charge === null) return "";
  const data = (charge as Record<string, unknown>).data;
  if (typeof data !== "object" || data === null) return "";
  const uid = (data as Record<string, unknown>).uid;
  return typeof uid === "string" ? uid : "";
}

export async function creerReservation(
  demande: DemandeReservation,
): Promise<ResultatCalCom<ReservationCreee>> {
  const corps: Record<string, unknown> = {
    ...corpsCible(demande.cible),
    start: demande.debutUtc,
    attendee: {
      name: demande.nom,
      email: demande.email,
      timeZone: FUSEAU,
      // Confirmation et rappels envoyés par Cal.com en français.
      language: "fr",
    },
  };
  if (demande.message) {
    // `notes` est le champ de réservation natif « Notes supplémentaires ».
    // Il doit rester ACTIF sur chaque type d'événement, sinon Cal.com refuse la
    // réponse : c'est écrit noir sur blanc dans `docs/CAL-COM.md`.
    corps.bookingFieldsResponses = { notes: demande.message };
  }

  try {
    const reponse = await fetch(`${BASE}/bookings`, {
      method: "POST",
      headers: {
        "cal-api-version": VERSION_RESERVATIONS,
        "content-type": "application/json",
      },
      body: JSON.stringify(corps),
      cache: "no-store",
      signal: AbortSignal.timeout(DELAI_ECRITURE_MS),
    });
    const charge = await lireJson(reponse);
    if (!reponse.ok) {
      return {
        ok: false,
        raison: "refuse",
        statut: reponse.status,
        detail: detailErreur(charge),
      };
    }
    return { ok: true, donnees: { uid: lireUid(charge) } };
  } catch (erreur) {
    return {
      ok: false,
      raison: "indisponible",
      detail: erreur instanceof Error ? erreur.name : "inconnue",
    };
  }
}
