import { describe, expect, it } from "bun:test";

import { content } from "@/lib/content";
import { LegalPageView } from "./LegalPageView";

/**
 * `LegalPageView` est un composant SERVEUR sans hook : l'appeler directement
 * suffit à exécuter son JSX, sans DOM ni `@testing-library/react`.
 *
 * Le sommaire (`sommaireDesBlocs`) n'est non vide QUE si le document porte des
 * titres — les trois documents réels en portent tous, donc ce test exerce la
 * colonne de sommaire (`<div>`, ex-`<aside>`) sans avoir à fabriquer un
 * document factice.
 */
describe("LegalPageView", () => {
  it("rend la colonne de sommaire en <div>, pas en <aside>", async () => {
    const [document, site] = await Promise.all([
      content.getLegalDocument("mentions-legales"),
      content.getSiteConfig(),
    ]);
    expect(document).not.toBeNull();

    const element = LegalPageView({ document, site });
    const html = JSON.stringify(element, (_key, value) =>
      typeof value === "function" ? undefined : value,
    );
    // Un <aside> réapparaîtrait comme `"type":"aside"` dans l'arbre sérialisé.
    expect(html).not.toContain('"aside"');
  });

  it("n'affiche aucune colonne de sommaire pour un document sans titre", async () => {
    const site = await content.getSiteConfig();
    const document = {
      slug: "test-sans-titre",
      title: "Document de test",
      lastUpdated: "2026-09-21",
      body: [{ type: "paragraph", text: "Rien à sommer." }],
    };

    const element = LegalPageView({ document, site });
    const html = JSON.stringify(element, (_key, value) =>
      typeof value === "function" ? undefined : value,
    );
    expect(html).not.toContain('"aside"');
    // Classe propre à la colonne de sommaire : absente quand `sommaire` est vide.
    expect(html).not.toContain("desktop:col-start-1");
  });
});
