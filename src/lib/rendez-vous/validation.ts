/**
 * Validation SERVEUR d'une demande de réservation.
 *
 * MÊME DOCTRINE que `src/lib/contact/validation.ts`, dont ce module reprend les
 * briques (`normaliserTexte`, `LIMITES`, `MOTIF_EMAIL`, les deux délais de
 * remplissage) plutôt que d'en écrire des jumelles qui divergeraient. Ce qui
 * s'ajoute ici est propre au rendez-vous : un type pris dans une liste blanche,
 * et un instant de début qui doit être à la fois lisible, futur et à l'intérieur
 * de l'horizon de réservation.
 *
 * POURQUOI VÉRIFIER L'INSTANT ALORS QUE CAL.COM LE FERA AUSSI. Parce qu'une
 * requête refusée par Cal.com est un aller-retour payé à un tiers pour rien, et
 * surtout parce que rien n'oblige le client à renvoyer un créneau que nous lui
 * avons proposé : le champ arrive tel quel du navigateur. Cal.com reste
 * l'autorité sur la disponibilité réelle, ce module écarte l'absurde.
 *
 * MODULE PUR. Ni réseau, ni `Date.now()`, ni `process.env`.
 */
import {
  DELAI_MAXIMAL_MS,
  DELAI_MINIMAL_MS,
  LIMITES,
  MOTIF_EMAIL,
  normaliserTexte,
} from "@/lib/contact/validation";
import { estIdRendezVous } from "./config";
import { HORIZON_JOURS } from "./creneaux";
import type { IdRendezVous } from "@/content/rendez-vous";

/** Longueur maximale du message libre joint à la réservation. */
export const LONGUEUR_MESSAGE_MAX = 1_500;

/**
 * Délai minimal entre maintenant et le créneau demandé.
 *
 * Cal.com porte le même garde-fou (`minimumBookingNotice`), réglable par
 * événement. Celui-ci est volontairement PLUS PERMISSIF (une heure) : c'est un
 * filtre à l'absurde, pas la politique d'agenda d'Eliott. La politique reste
 * chez Cal.com, seul endroit où elle peut être changée sans déployer.
 */
export const PREAVIS_MINIMAL_MS = 60 * 60 * 1000;

export interface ReservationValide {
  readonly type: IdRendezVous;
  /** Instant de début, normalisé en ISO 8601 UTC (ce qu'attend Cal.com). */
  readonly debutUtc: string;
  readonly nom: string;
  readonly email: string;
  /** Absent quand le prospect n'a rien écrit. */
  readonly message?: string;
}

export type MotifRejetReservation =
  | { readonly type: "corps_illisible" }
  | { readonly type: "piege_rempli" }
  | { readonly type: "trop_rapide" }
  | { readonly type: "horodatage_invalide" }
  | {
      readonly type: "champ_invalide";
      readonly champ: "type" | "creneau" | "nom" | "email" | "message";
      readonly raison: string;
    };

export type ResultatValidationReservation =
  | { readonly ok: true; readonly reservation: ReservationValide }
  | { readonly ok: false; readonly motif: MotifRejetReservation };

export interface OptionsValidationReservation {
  /** Types RÉELLEMENT configurés, tels que résolus depuis l'environnement. */
  readonly typesAutorises: readonly IdRendezVous[];
  readonly maintenantMs: number;
}

function lireChaine(corps: Record<string, unknown>, clef: string): string {
  const brut = corps[clef];
  return typeof brut === "string" ? brut : "";
}

function surUneLigne(valeur: string): string {
  return normaliserTexte(valeur).replace(/\s+/g, " ");
}

export function validerReservation(
  corps: unknown,
  options: OptionsValidationReservation,
): ResultatValidationReservation {
  if (typeof corps !== "object" || corps === null || Array.isArray(corps)) {
    return { ok: false, motif: { type: "corps_illisible" } };
  }
  const champs = corps as Record<string, unknown>;

  // PIÈGE D'ABORD, comme sur le formulaire de contact : inutile de valider quoi
  // que ce soit quand le champ que seul un robot remplit porte une valeur.
  if (lireChaine(champs, "referenceInterne").trim().length > 0) {
    return { ok: false, motif: { type: "piege_rempli" } };
  }

  const debutMs = champs.debutMs;
  if (typeof debutMs !== "number" || !Number.isFinite(debutMs)) {
    return { ok: false, motif: { type: "horodatage_invalide" } };
  }
  const delaiMs = options.maintenantMs - debutMs;
  if (delaiMs < 0 || delaiMs > DELAI_MAXIMAL_MS) {
    return { ok: false, motif: { type: "horodatage_invalide" } };
  }
  if (delaiMs < DELAI_MINIMAL_MS) {
    return { ok: false, motif: { type: "trop_rapide" } };
  }

  const type = champs.type;
  if (!estIdRendezVous(type) || !options.typesAutorises.includes(type)) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "type", raison: "hors_liste" },
    };
  }

  const debutBrut = surUneLigne(lireChaine(champs, "debut"));
  const instant = new Date(debutBrut);
  if (debutBrut.length === 0 || Number.isNaN(instant.getTime())) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "creneau", raison: "format" },
    };
  }
  const avance = instant.getTime() - options.maintenantMs;
  if (avance < PREAVIS_MINIMAL_MS) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "creneau", raison: "passe" },
    };
  }
  if (avance > (HORIZON_JOURS + 1) * 24 * 60 * 60 * 1000) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "creneau", raison: "hors_horizon" },
    };
  }

  const nom = surUneLigne(lireChaine(champs, "nom"));
  if (nom.length < LIMITES.nom.min || nom.length > LIMITES.nom.max) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "nom", raison: "longueur" },
    };
  }

  const email = surUneLigne(lireChaine(champs, "email"));
  if (email.length < LIMITES.email.min || email.length > LIMITES.email.max) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "email", raison: "longueur" },
    };
  }
  if (!MOTIF_EMAIL.test(email)) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "email", raison: "format" },
    };
  }

  const message = normaliserTexte(lireChaine(champs, "message"));
  if (message.length > LONGUEUR_MESSAGE_MAX) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "message", raison: "longueur" },
    };
  }

  return {
    ok: true,
    reservation: {
      type,
      // Cal.com exige l'instant en UTC. `toISOString` le garantit quel que soit
      // le décalage écrit par le client (`+02:00` comme `Z`).
      debutUtc: instant.toISOString(),
      nom,
      email,
      ...(message.length > 0 ? { message } : {}),
    },
  };
}
