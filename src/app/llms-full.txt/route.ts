import { construireProfil, profilEnMarkdown } from "@/lib/profil/profil";

/**
 * `/llms-full.txt` — le profil complet, en Markdown brut.
 *
 * Pendant long de `/llms.txt`, selon la même convention : le court dit où
 * chercher, celui-ci dit tout. C'est le texte que la page `/agent` met en forme
 * et que son bouton place dans le prompt copié ; les trois sortent de
 * `construireProfil()`, donc d'une seule source.
 *
 * À LA RACINE de `src/app`, hors des groupes de routes, comme `llms.txt`.
 */
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  return new Response(profilEnMarkdown(await construireProfil()), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
