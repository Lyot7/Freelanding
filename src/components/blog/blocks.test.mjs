import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Callout, Steps, Video } from "./blocks";

/**
 * Ces deux blocs sont composés directement (sans rendu DOM) : ce sont de
 * simples fonctions qui renvoient un arbre d'éléments React, ce que Bun peut
 * inspecter sans navigateur ni `@testing-library/react`.
 */
describe("Video", () => {
  it("porte un aria-label quand une légende existe, pour la rattacher à la vidéo", () => {
    const element = Video({ src: "/x.mp4", poster: "/x.jpg", caption: "Une capture d'écran" });
    const video = element.props.children[0];
    expect(video.props["aria-label"]).toBe("Une capture d'écran");
  });

  it("n'a pas d'aria-label sans légende", () => {
    const element = Video({ src: "/x.mp4", poster: "/x.jpg" });
    const video = element.props.children[0];
    expect(video.props["aria-label"]).toBeUndefined();
  });
});

describe("Callout", () => {
  it("rend un <div>, pas un <aside> (repère ARIA porté par le sommaire, pas ce bloc)", () => {
    const element = Callout({ title: "Attention", children: "corps" });
    expect(element.type).toBe("div");
  });
});

describe("Steps", () => {
  const rendu = (items) => renderToStaticMarkup(createElement(Steps, { items }));

  it("rend un lien markdown externe en vrai lien, ouvert dans un nouvel onglet", () => {
    const html = rendu(["Voir [la Search Central](https://developers.google.com/search) ici."]);
    expect(html).toContain('href="https://developers.google.com/search"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain(">la Search Central</a> ici.");
    expect(html).not.toContain("](");
  });

  it("garde un lien interne dans l'onglet courant", () => {
    const html = rendu(["Lire [la méthode](/blog/methode)."]);
    expect(html).toContain('<a href="/blog/methode"');
    expect(html).not.toContain("_blank");
  });

  it("rend le gras et l'italique", () => {
    const html = rendu(["Un **chiffre** et un *mot*."]);
    expect(html).toMatch(/<strong[^>]*>chiffre<\/strong>/);
    expect(html).toMatch(/<em[^>]*>mot<\/em>/);
  });

  it("laisse un texte sans markdown intact", () => {
    expect(rendu(["Une étape, 3 000 €."])).toContain(">Une étape, 3 000 €.</span>");
  });

  // Tous les usages réels : aucune étape d'article publiée ne doit montrer sa
  // syntaxe markdown à l'écran.
  const DOSSIER = join(import.meta.dir, "../../content/articles");
  for (const fichier of readdirSync(DOSSIER).filter((f) => f.endsWith(".mdx"))) {
    const source = readFileSync(join(DOSSIER, fichier), "utf8");
    for (const [, tableau] of source.matchAll(/<Steps items=\{(\[[\s\S]*?\])\}\s*\/>/g)) {
      it(`${fichier} : aucune syntaxe markdown visible dans les étapes`, () => {
        const html = rendu(JSON.parse(tableau));
        expect(html).not.toMatch(/\]\(|\*\*/);
      });
    }
  }
});
