import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LogoBandSection } from "@/components/sections/LogoBandSection";
import { aboutContent } from "@/content/about";
import { AboutPage, AboutStory } from "./AboutPage";

/**
 * LE RÉCIT DE `/a-propos` EN UNE COLONNE (2026-10-16) : la phrase d'ouverture,
 * puis chaque paragraphe l'un après l'autre, emphases comprises. Le bloc
 * « Qui je suis », ses portraits et la bande de logos sont partis.
 */
const rendre = (about) => renderToStaticMarkup(createElement(AboutStory, { about }));

/** Le texte d'un HTML, balises retirées. */
const texte = (html) => html.replace(/<[^>]+>/g, "");

describe("récit de la page À propos", () => {
  const [lead, ...suite] = aboutContent.body;

  it("rend la phrase d'ouverture puis chaque paragraphe, dans l'ordre", () => {
    const rendu = texte(rendre(aboutContent));
    expect(suite.length).toBeGreaterThan(0);
    let position = rendu.indexOf(lead);
    expect(position).toBeGreaterThanOrEqual(0);
    for (const paragraphe of suite) {
      const suivante = rendu.indexOf(paragraphe);
      expect(suivante).toBeGreaterThan(position);
      position = suivante;
    }
  });

  it("met en avant chaque emphase déclarée", () => {
    const html = rendre(aboutContent);
    expect(aboutContent.bodyHighlights?.length).toBeGreaterThan(0);
    for (const emphase of aboutContent.bodyHighlights ?? []) {
      expect(html).toContain(`<span class="text-background">${emphase}</span>`);
    }
  });

  it("rend le texte sans emphase quand aucune n'est déclarée", () => {
    const html = rendre({ ...aboutContent, bodyHighlights: undefined });
    expect(html).not.toContain('<span class="text-background">');
    for (const paragraphe of suite) expect(texte(html)).toContain(paragraphe);
  });

  it("n'écrit plus le titre « Qui je suis »", () => {
    expect(texte(rendre(aboutContent))).not.toMatch(/qui je suis/iu);
  });
});

describe("page À propos", () => {
  it("compose le récit sans bande de logos", async () => {
    const arbre = await AboutPage();
    const types = [];
    const parcourir = (noeud) => {
      if (!noeud || typeof noeud !== "object") return;
      if (Array.isArray(noeud)) return noeud.forEach(parcourir);
      types.push(noeud.type);
      parcourir(noeud.props?.children);
    };
    parcourir(arbre);
    expect(types).toContain(AboutStory);
    expect(types).not.toContain(LogoBandSection);
  });
});
