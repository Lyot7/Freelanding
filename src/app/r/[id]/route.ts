/**
 * `GET /r/<id>` : bouton « Réserver un appel » des e-mails de prospection.
 *
 * Redirige toujours en 302 vers la prise de rendez-vous de l'accueil (formulaire logiciel pour
 * un mail qui porte l'offre logiciel, découverte sinon). La logique, le contrat avec le
 * cockpit et le plafond anti-inondation vivent dans
 * `src/lib/clic/signature.ts` ; ce fichier ne fait que les brancher.
 */
import { after } from "next/server";
import { creerThrottleClic, traiterClicSuivi } from "@/lib/clic/signature";
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
  memoireOffres: new Map(),
  maintenantMs: () => Date.now(),
};

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return traiterClicSuivi(requete, id, dependances);
}

/** Même réponse, jamais d'enregistrement : `traiterClic` n'enregistre que les GET. */
export const HEAD = GET;
