import { describe, expect, it } from "bun:test";

import RootLayout, { generateMetadata } from "./layout";

/**
 * Le layout racine délègue tout à `SiteDocument` (voir son propre test) : ce
 * test couvre juste la mise à jour du commentaire sur l'emplacement des
 * feuilles CSS (`fonts.css` retiré le 2026-09-21) en s'assurant que le module
 * s'importe et s'exécute toujours normalement.
 */
describe("RootLayout", () => {
  it("enveloppe ses enfants dans SiteDocument", () => {
    const element = RootLayout({ children: "contenu" });
    expect(element.props.children).toBe("contenu");
  });

  it("construit des métadonnées depuis la configuration du site", async () => {
    const metadata = await generateMetadata();
    expect(typeof metadata.title).not.toBe("undefined");
  });
});
