/**
 * Validation du corps envoyé par l'outil de chiffrage à `POST /api/estimation`.
 *
 * Le corps arrive en `unknown` et n'en sort que par narrowing : rien n'est typé
 * d'office. Mêmes règles d'e-mail et de téléphone que le contact et la prise de
 * rendez-vous (`src/lib/contact/validation.ts`), pour qu'un visiteur accepté
 * ici le soit partout.
 */
import {
  DELAI_MAXIMAL_MS,
  DELAI_MINIMAL_MS,
  lireTelephone,
  MOTIF_EMAIL,
  normaliserTexte,
} from "@/lib/contact/validation";
import { LONGUEUR_DESCRIPTION_MAX } from "./extraction";
import { OUTILS_ACTUELS, TAILLES_EQUIPE, TYPES_PROJET, URGENCES } from "./grille";
import type { Reponses } from "./grille";

export const LONGUEUR_DESCRIPTION_MIN = 20;

export const LIMITES_CONTACT = {
  prenom: 60,
  nom: 80,
  societe: 120,
  email: 254,
} as const;

/** Nom du champ piège, identique aux autres formulaires du site. */
export const CHAMP_PIEGE = "referenceInterne";

export interface Contact {
  readonly prenom: string;
  readonly nom: string;
  readonly societe: string;
  readonly email: string;
  readonly telephone: string;
}

export interface DemandeEstimation {
  readonly reponses: Reponses;
  readonly description: string;
  readonly contact: Contact;
  readonly jetonCaptcha: string | undefined;
}

export type ChampEstimation =
  | "type"
  | "equipe"
  | "outils"
  | "urgence"
  | "description"
  | "prenom"
  | "nom"
  | "societe"
  | "email"
  | "telephone"
  | "consentement";

export type ResultatValidationEstimation =
  | { readonly ok: true; readonly demande: DemandeEstimation }
  | { readonly ok: false; readonly champ?: ChampEstimation };

function objet(valeur: unknown): Record<string, unknown> | undefined {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur)
    ? (valeur as Record<string, unknown>)
    : undefined;
}

function choix<T extends string>(liste: readonly T[], valeur: unknown): T | undefined {
  return (liste as readonly unknown[]).includes(valeur) ? (valeur as T) : undefined;
}

function ligne(valeur: unknown, max: number): string | undefined {
  if (typeof valeur !== "string") return undefined;
  const texte = normaliserTexte(valeur).replace(/\s+/g, " ");
  return texte.length >= 1 && texte.length <= max ? texte : undefined;
}

export function validerDemande(
  corps: unknown,
  maintenantMs: number,
): ResultatValidationEstimation {
  const racine = objet(corps);
  if (!racine) return { ok: false };

  // Piège et temps de remplissage : même réponse muette qu'un corps illisible.
  const piege = racine[CHAMP_PIEGE];
  if (typeof piege === "string" && piege.trim().length > 0) return { ok: false };
  const debut = racine.debutMs;
  if (typeof debut !== "number" || !Number.isFinite(debut)) return { ok: false };
  const ecoule = maintenantMs - debut;
  if (ecoule < DELAI_MINIMAL_MS || ecoule > DELAI_MAXIMAL_MS) return { ok: false };

  const r = objet(racine.reponses);
  if (!r) return { ok: false };
  const type = choix(TYPES_PROJET, r.type);
  if (!type) return { ok: false, champ: "type" };
  const equipe = choix(TAILLES_EQUIPE, r.equipe);
  if (!equipe) return { ok: false, champ: "equipe" };
  const outils = choix(OUTILS_ACTUELS, r.outils);
  if (!outils) return { ok: false, champ: "outils" };
  const urgence = choix(URGENCES, r.urgence);
  if (!urgence) return { ok: false, champ: "urgence" };

  if (typeof racine.description !== "string") return { ok: false, champ: "description" };
  const description = normaliserTexte(racine.description);
  if (description.length < LONGUEUR_DESCRIPTION_MIN || description.length > LONGUEUR_DESCRIPTION_MAX) {
    return { ok: false, champ: "description" };
  }

  const c = objet(racine.contact);
  if (!c) return { ok: false, champ: "prenom" };
  const prenom = ligne(c.prenom, LIMITES_CONTACT.prenom);
  if (!prenom) return { ok: false, champ: "prenom" };
  const nom = ligne(c.nom, LIMITES_CONTACT.nom);
  if (!nom) return { ok: false, champ: "nom" };
  const societe = ligne(c.societe, LIMITES_CONTACT.societe);
  if (!societe) return { ok: false, champ: "societe" };
  const email = ligne(c.email, LIMITES_CONTACT.email)?.toLowerCase();
  if (!email || !MOTIF_EMAIL.test(email)) return { ok: false, champ: "email" };
  const telephone = lireTelephone(c.telephone);
  if (!telephone.ok || !telephone.valeur) return { ok: false, champ: "telephone" };

  if (racine.consentement !== true) return { ok: false, champ: "consentement" };

  const jeton = typeof racine.jetonCaptcha === "string" ? racine.jetonCaptcha : undefined;

  return {
    ok: true,
    demande: {
      reponses: { type, equipe, outils, urgence },
      description,
      contact: { prenom, nom, societe, email, telephone: telephone.valeur },
      jetonCaptcha: jeton,
    },
  };
}
