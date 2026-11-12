/**
 * Envoi d'une estimation au cockpit, serveur à serveur, pour qu'il en fasse une
 * fiche ENTRANTE (société, contact, affaire, interaction) et prépare une
 * réponse rangée dans la revue « Venus d'eux-mêmes ». Rien ne part au visiteur
 * sans qu'Eliott ait validé.
 *
 * Même accès que la prise de rendez-vous (`RDV_TOKEN`, `COCKPIT_URL`, voir
 * `src/lib/rendez-vous/config.ts`) : la route du cockpit vit sous `/api/rdv/`,
 * dont c'est le jeton. Aucune exception ne sort d'ici.
 */
import { resoudreAcces } from "@/lib/rendez-vous/config";
import type { Environnement } from "@/lib/rendez-vous/config";
import type { Composants, Estimation } from "./grille";
import type { DemandeEstimation } from "./validation";

const DELAI_MS = 10_000;

export type SourceComposants = "ia" | "boutons";

export interface EnvoiEstimation {
  readonly demande: DemandeEstimation;
  readonly estimation: Estimation;
  readonly composants: Composants;
  readonly source: SourceComposants;
}

export type ResultatEnvoi =
  | { readonly ok: true }
  | { readonly ok: false; readonly detail: string };

/** Corps attendu par `POST /api/rdv/estimation` du cockpit. */
export function corpsCockpit(envoi: EnvoiEstimation): Record<string, unknown> {
  const { demande, estimation, composants, source } = envoi;
  return {
    contact: demande.contact,
    reponses: demande.reponses,
    description: demande.description,
    estimation,
    composants,
    sourceComposants: source,
  };
}

export async function envoyerAuCockpit(
  envoi: EnvoiEstimation,
  env: Environnement = process.env,
): Promise<ResultatEnvoi> {
  const acces = resoudreAcces(env);
  if (!acces) return { ok: false, detail: "non_configure" };
  try {
    const reponse = await fetch(`${acces.url}/api/rdv/estimation`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${acces.jeton}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(corpsCockpit(envoi)),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(DELAI_MS),
    });
    if (!reponse.ok) return { ok: false, detail: `statut_${reponse.status}` };
    return { ok: true };
  } catch (erreur) {
    return { ok: false, detail: erreur instanceof Error ? erreur.name : "inconnue" };
  }
}
