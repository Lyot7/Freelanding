import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createElement } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "../../mdx-components.tsx";
import { BlocMarkdown, CorpsSur, rendreEnLigne } from "./CorpsSur.tsx";

const ARTICLES = fileURLToPath(new URL("../../content/articles", import.meta.url));
/** Les blancs entre balises ne s'affichent pas : seuls les éléments et le texte comptent. */
const html = (n) => renderToStaticMarkup(n).replaceAll(/>\s+</g, "><").trim();

/**
 * LA PREUVE QUE L'APERÇU EST LA PAGE PUBLIÉE : chaque article du site, compilé
 * par MDX comme au build, et le même texte rendu par `CorpsSur` sans rien
 * compiler, donnent le même HTML, à l'octet près.
 */
describe("CorpsSur rend chaque article comme la page publiée", () => {
  for (const fichier of readdirSync(ARTICLES).filter((f) => f.endsWith(".mdx"))) {
    it(fichier, async () => {
      const source = readFileSync(join(ARTICLES, fichier), "utf8");
      const { default: Mdx } = await evaluate(source, {
        ...runtime,
        remarkPlugins: [[remarkGfm, { singleTilde: false }]],
        useMDXComponents,
      });
      expect(html(createElement(CorpsSur, { source }))).toBe(html(createElement(Mdx)));
    });
  }
});

describe("CorpsSur : un texte qui n'a pas été relu reste du texte", () => {
  const rendu = (source) => html(createElement(CorpsSur, { source }));

  it("échappe le HTML et les scripts, bloc ou phrase", () => {
    const sortie = rendu('<script>alert(1)</script>\n\nUn <img src=x onerror="alert(1)"> dans la phrase.');
    expect(sortie).not.toContain("<script");
    expect(sortie).not.toContain("<img");
    expect(sortie).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(sortie).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("garde le texte d'un lien ou d'une image dont l'adresse n'est pas sûre", () => {
    const sortie = rendu("[clic](javascript:alert(1)) et ![logo](javascript:x)");
    expect(sortie).not.toContain("javascript:");
    expect(sortie).toContain("clic");
    expect(sortie).toContain("logo");
  });

  it("rend « sur devis » pour une offre connue, et laisse une offre inconnue en clair", () => {
    expect(rendu('Comptez <Prix offre="logiciel" />.')).toContain("sur devis");
    expect(rendu('Comptez <Prix offre="logiciel" suivi />.')).toContain("sur devis");
    expect(rendu('Comptez <Prix offre="logiciel" />.')).not.toContain("€");
    expect(rendu('Comptez <Prix offre="inconnue" />.')).toContain("&lt;Prix offre=&quot;inconnue&quot; /&gt;");
  });

  it("laisse en clair le prix d'une offre retirée le 2026-10-31", () => {
    // Le site vitrine, l'intégration IA et le CTO n'ont plus de prix : la
    // balise reste visible (et un test d'article la repère) au lieu de lever
    // une erreur au rendu de la page.
    for (const offre of ["vitrine", "ia", "cto"]) {
      const sortie = rendu(`Comptez <Prix offre="${offre}" />.`);
      expect(sortie).toContain(`&lt;Prix offre=&quot;${offre}&quot; /&gt;`);
      expect(sortie).not.toContain("€");
    }
  });

  it("rend les formes plus rares comme MDX", async () => {
    const source = [
      "~~barré~~ ligne  ",
      "suite [ref][r] ![img][r] ![vrai](/images/a.jpg) et [^1]",
      "",
      "[r]: /blog",
      "[^1]: note",
      "",
      "3. trois",
      "4. quatre",
      "",
      "- a",
      "",
      "- b",
      "",
      "- [x] fait",
      "",
      "#### Petit titre",
      "",
      "> cité",
      "",
      "```js",
      "code()",
      "```",
      "",
      "---",
      "",
      "| seul |",
      "|---|",
    ].join("\n");
    const sortie = rendu(source);
    expect(sortie).toContain("<del>barré</del>");
    expect(sortie).toContain("<br/>");
    expect(sortie).toContain("<ol");
    expect(sortie).toContain('type="checkbox"');
    expect(sortie).toContain("<h4>Petit titre</h4>");
    expect(sortie).toContain("<blockquote");
    expect(sortie).toContain("code()");
    expect(sortie).toContain("<hr");
    expect(sortie).toContain("<th");
    expect(sortie).not.toContain("<tbody");
    expect(sortie).toContain("ref");
  });

  it("rend les six blocs de la palette", () => {
    const sortie = rendu(
      [
        '<Figure src="/images/a.jpg" alt="Un schéma" caption="Légende" />',
        '<Video src="/videos/v.mp4" poster="/images/p.jpg" caption="Démo" />',
        '<Callout title="Seuil">\nTexte.\n</Callout>',
        '<Quote author="Un client">\nPhrase.\n</Quote>',
        '<Stat value="2,5 s" label="LCP" />',
        '<Steps items={["Un", "Deux"]} />',
      ].join("\n"),
    );
    for (const attendu of ["Légende", "<video", "Seuil", "Un client", "2,5 s", "Deux"]) {
      expect(sortie).toContain(attendu);
    }
  });
});

describe("CorpsSur : nœuds sans attribut facultatif", () => {
  it("une image sans texte de remplacement, une liste sans départ, un nœud inconnu", () => {
    expect(html(rendreEnLigne({ type: "image", url: "/images/a.jpg" }))).toContain('alt=""');
    expect(rendreEnLigne({ type: "image", url: "javascript:x" })).toBe("");
    expect(rendreEnLigne({ type: "imageReference", identifier: "x", referenceType: "full" })).toBe("");
    expect(rendreEnLigne({ type: "footnoteReference", identifier: "1" })).toBeNull();
    expect(html(createElement(BlocMarkdown, { n: { type: "list", ordered: true, children: [] } }))).toContain("<ol");
    expect(html(createElement(BlocMarkdown, { n: { type: "definition", identifier: "x", url: "/" } }))).toBe("");
  });
});
