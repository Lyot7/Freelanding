import { describe, expect, it } from "bun:test";

import { homeContent } from "@/content/home";
import { siteConfig } from "@/content/site";
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

  it("porte l'ancre du lien « Comment » de l'en-tête", () => {
    const hrefs = siteConfig.nav.map((lien) => lien.href);
    expect(hrefs).toContain(`/#${MoyensSection({ moyens }).props.id}`);
  });

  it("rend chaque moyen avec son lien", () => {
    for (const ligne of moyens.lignes) {
      expect(rendu).toContain(ligne.titre);
      expect(rendu).toContain(ligne.lien.href);
    }
  });
});
