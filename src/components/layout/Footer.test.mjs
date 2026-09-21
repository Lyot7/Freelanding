import { describe, expect, it } from "bun:test";

import { Footer } from "./Footer";

/**
 * Composant SERVEUR asynchrone sans hook : l'appeler directement exécute son
 * JSX (il lit lui-même `content.getSiteConfig()`). Couvre le commentaire mis à
 * jour après le retrait du bloc newsletter — `SocialGlyph` reste monté dans le
 * pied de page, seul endroit qui le consomme désormais.
 */
/** Cherche un élément dont les props portent `social`, sans boucler sur les cycles React. */
function trouveIconeSociale(noeud, vus = new WeakSet()) {
  if (noeud === null || typeof noeud !== "object") return false;
  if (vus.has(noeud)) return false;
  vus.add(noeud);
  if (noeud.props && typeof noeud.props === "object" && "social" in noeud.props) return true;
  const enfants = noeud.props?.children;
  if (Array.isArray(enfants)) return enfants.some((enfant) => trouveIconeSociale(enfant, vus));
  return trouveIconeSociale(enfants, vus);
}

describe("Footer", () => {
  it("monte toujours les glyphes sociaux exposés", async () => {
    const element = await Footer();
    expect(trouveIconeSociale(element)).toBe(true);
  });
});
