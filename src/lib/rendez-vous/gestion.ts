/**
 * Gestion d'un rendez-vous par son jeton : validation des demandes du
 * navigateur et traduction des refus du cockpit, pour les routes
 * `/api/rendez-vous/gestion/[jeton]/*` et la page `/rdv/gerer/[jeton]`.
 *
 * MODULE PUR : aucune requête, l'instant courant est injecté.
 */
import type { EchecCockpit, RendezVousGere } from "./cockpit";
import { HORIZON_JOURS } from "./creneaux";
import { estDureePlausible } from "./durees";
import { PREAVIS_MINIMAL_MS } from "./validation";

/** Longueur maximale du motif d'annulation (le cockpit en accepte 1 000). */
export const LONGUEUR_MOTIF_MAX = 1_000;

/** Ce que la page affiche, selon le rendez-vous et l'heure qu'il est. */
export type EtatRendezVous = "confirme" | "annule" | "deplace" | "passe";

export function etatRendezVous(rdv: RendezVousGere, maintenant: Date): EtatRendezVous {
  if (rdv.statut === "ANNULE") return "annule";
  if (rdv.statut === "DEPLACE") return "deplace";
  // Commencé = passé : on ne déplace pas un appel en cours.
  return new Date(rdv.debut).getTime() <= maintenant.getTime() ? "passe" : "confirme";
}

export type DemandeAnnulation = { readonly ok: true; readonly motif?: string } | { readonly ok: false };

/** `{ motif? }` ; un motif vide vaut pas de motif, un motif trop long est refusé. */
export function validerAnnulation(corps: unknown): DemandeAnnulation {
  if (typeof corps !== "object" || corps === null || Array.isArray(corps)) return { ok: false };
  const motif = (corps as Record<string, unknown>).motif;
  if (motif === undefined || motif === null) return { ok: true };
  if (typeof motif !== "string") return { ok: false };
  const propre = motif.trim();
  if (propre.length > LONGUEUR_MOTIF_MAX) return { ok: false };
  return propre.length > 0 ? { ok: true, motif: propre } : { ok: true };
}

export type DemandeDeplacement =
  | { readonly ok: true; readonly debutUtc: string; readonly duree?: number }
  | { readonly ok: false; readonly champ: "creneau" | "duree" };

/**
 * `{ debut, duree? }` : un instant ISO dans le futur (préavis compris) et sous
 * l'horizon, une durée plausible. Le cockpit revérifie tout ; ce filtre lui
 * épargne l'absurde.
 */
export function validerDeplacement(corps: unknown, maintenantMs: number): DemandeDeplacement {
  if (typeof corps !== "object" || corps === null || Array.isArray(corps)) {
    return { ok: false, champ: "creneau" };
  }
  const { debut, duree } = corps as Record<string, unknown>;
  if (typeof debut !== "string" || debut.length > 40) return { ok: false, champ: "creneau" };
  const instant = new Date(debut);
  if (Number.isNaN(instant.getTime())) return { ok: false, champ: "creneau" };
  const avance = instant.getTime() - maintenantMs;
  if (avance < PREAVIS_MINIMAL_MS || avance > (HORIZON_JOURS + 1) * 24 * 60 * 60 * 1000) {
    return { ok: false, champ: "creneau" };
  }
  if (duree !== undefined && !estDureePlausible(duree)) return { ok: false, champ: "duree" };
  return {
    ok: true,
    debutUtc: instant.toISOString(),
    ...(duree !== undefined ? { duree } : {}),
  };
}

/** Réponse au navigateur pour un refus du cockpit : statut et message. */
export interface ReponseRefus {
  readonly statut: number;
  readonly message: string;
  readonly champ?: string;
}

/**
 * Traduit un échec du cockpit. Les codes connus disent quelque chose
 * d'actionnable au visiteur ; le reste devient « réessayez, ou écrivez-moi ».
 *
 * @param repli Phrase de repli, avec l'adresse de contact publiée.
 */
export function traduireRefus(echec: EchecCockpit, repli: string): ReponseRefus {
  if (echec.raison === "refuse") {
    if (echec.statut === 404) {
      return { statut: 404, message: "Ce lien ne correspond à aucun rendez-vous." };
    }
    if (echec.statut === 409 && echec.detail === "creneau_pris") {
      return {
        statut: 409,
        message: "Ce créneau vient d’être pris. Choisissez-en un autre dans la liste.",
        champ: "creneau",
      };
    }
    if (echec.statut === 409) {
      return { statut: 409, message: "Ce rendez-vous est déjà annulé ou déplacé. Rechargez la page." };
    }
    if (echec.statut === 400 && echec.detail === "duree_invalide") {
      return { statut: 400, message: "Cette durée n’est plus proposée.", champ: "duree" };
    }
    return { statut: 502, message: `L’opération n’a pas pu aboutir. ${repli}` };
  }
  if (echec.detail === "non_configure") {
    return { statut: 503, message: `La gestion en ligne est momentanément indisponible. ${repli}` };
  }
  return { statut: 504, message: `L’opération n’a pas pu aboutir. ${repli}` };
}
