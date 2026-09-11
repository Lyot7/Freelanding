/**
 * `GET /r/<id>` : lien « Prendre contact » des e-mails de prospection.
 *
 * Redirige toujours en 302 vers `/contact`. La logique, le contrat de
 * notification et le plafond anti-inondation vivent dans
 * `src/lib/clic/signature.ts` ; ce fichier ne fait que les brancher.
 */
import { after } from "next/server";
import { creerThrottleClic, traiterClic } from "@/lib/clic/signature";
import type { DependancesClic } from "@/lib/clic/signature";
import { resoudreExpediteur } from "@/lib/contact/mailer";

/** Node et non Edge : le plafond en mémoire n'a de sens que sur un processus qui dure. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dependances: DependancesClic = {
  planifier: (tache) => after(tache),
  resoudreExpediteur,
  throttle: creerThrottleClic(),
  maintenantMs: () => Date.now(),
};

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return traiterClic(requete, id, dependances);
}

/** Même réponse, jamais de notification : `traiterClic` ne notifie que les GET. */
export const HEAD = GET;
