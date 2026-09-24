import { construireProfil, construirePrompt } from "@/lib/profil/profil";

/**
 * `/agent/prompt.txt` — le prompt complet, consignes et profil, tel que le
 * copie le bouton de la page `/agent`.
 *
 * Il existe pour le raccourci du héros de l'accueil : embarquer 25 ko de texte
 * dans la page la plus surveillée du site (LCP, TBT) pour un clic que peu de
 * visiteurs feront n'a pas de sens. Le bouton va le chercher au clic.
 */
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  return new Response(construirePrompt(await construireProfil()), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
