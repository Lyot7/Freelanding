import { describe, expect, it } from "bun:test";

import { homeContent } from "@/content/home";
import { MoyensSection } from "./MoyensSection";

/** Tout l'arbre en texte, pour y lire libellés et liens. */
function aplat(noeud) {
  if (noeud === null || typeof noeud !== "object") return String(noeud);
  if (Array.isArray(noeud)) return noeud.map(aplat).join(" ");
  const { children, href } = noeud.props ?? {};
  return [href ?? "", aplat(children ?? null)].join(" ");
}

describe("MoyensSection", () => {
  const { moyens } = homeContent;
  const rendu = aplat(MoyensSection({ moyens }));

  it("porte l'ancre du bouton de la démonstration", () => {
    expect(homeContent.logiciel.cta.href).toBe(`#${MoyensSection({ moyens }).props.id}`);
  });

  it("rend chaque moyen avec son lien, et chaque étape", () => {
    for (const ligne of moyens.lignes) {
      expect(rendu).toContain(ligne.titre);
      expect(rendu).toContain(ligne.lien.href);
    }
    for (const etape of moyens.etapes) expect(rendu).toContain(etape.corps);
  });
});
