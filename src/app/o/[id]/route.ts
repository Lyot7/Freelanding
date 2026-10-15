/**
 * `GET /o/<id>` : logo de la signature des e-mails de prospection.
 *
 * Redirige toujours en 302 vers le logo et relaie l'ouverture au cockpit. La
 * logique, le contrat avec le cockpit et le plafond anti-inondation vivent
 * dans `src/lib/clic/signature.ts` ; ce fichier ne fait que les brancher.
 */
import { after } from "next/server";
import { creerThrottleClic, traiterOuverture } from "@/lib/clic/signature";
import type { DependancesClic } from "@/lib/clic/signature";

/** Node et non Edge : le plafond en mémoire n'a de sens que sur un processus qui dure. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dependances: DependancesClic = {
  planifier: (tache) => after(tache),
  // Lu à l'exécution, jamais figé au build : variable serveur, pas NEXT_PUBLIC.
  jeton: () => process.env.CLIC_TOKEN,
  envoyer: (url, init) => fetch(url, init),
  throttle: creerThrottleClic(),
  maintenantMs: () => Date.now(),
};

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return traiterOuverture(requete, id, dependances);
}

/** Même réponse, jamais d'enregistrement : `traiterOuverture` n'enregistre que les GET. */
export const HEAD = GET;
