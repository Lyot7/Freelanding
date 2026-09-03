/**
 * Réglages de débit de la prise de rendez-vous.
 *
 * Deux réglages et non un seul, parce que les deux routes n'ont ni le même coût
 * ni le même risque :
 *
 *   - LIRE des créneaux est une opération de navigation. Un prospect qui
 *     compare quatre types de rendez-vous et fait défiler trois semaines émet
 *     déjà une douzaine de requêtes en deux minutes, sans rien avoir de
 *     suspect. Un plafond serré ici casserait un usage normal ;
 *   - ÉCRIRE une réservation pose un événement dans l'agenda d'Eliott et envoie
 *     deux e-mails. Trois par quart d'heure et par adresse est déjà large :
 *     personne ne réserve trois rendez-vous de suite, sinon par erreur.
 *
 * La même mécanique de fenêtre glissante que le formulaire de contact est
 * réutilisée telle quelle, LIMITES ASSUMÉES COMPRISES (portée au processus, pas
 * de partage entre instances) : voir l'en-tête de `src/lib/contact/rate-limit.ts`.
 */
import type { OptionsLimiteur } from "@/lib/contact/rate-limit";

/** Lecture des créneaux : 40 requêtes par quart d'heure et par adresse. */
export const LIMITE_CRENEAUX: OptionsLimiteur = {
  fenetreMs: 15 * 60 * 1000,
  maxParFenetre: 40,
  maxCles: 5_000,
};

/** Création d'une réservation : 3 par quart d'heure et par adresse. */
export const LIMITE_RESERVATION: OptionsLimiteur = {
  fenetreMs: 15 * 60 * 1000,
  maxParFenetre: 3,
  maxCles: 5_000,
};
