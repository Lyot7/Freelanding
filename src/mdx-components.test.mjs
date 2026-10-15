import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CodeEnLigne, Gras, Italique, Lien } from "./components/blog/en-ligne";
import { useMDXComponents } from "./mdx-components";

// Le corps MDX et les blocs comme <Steps> partagent les mêmes éléments en
// ligne : un lien du corps et un lien d'étape ont le même rendu.
describe("useMDXComponents, markdown en ligne", () => {
  const composants = useMDXComponents();

  it("habille lien, gras, italique et code avec les éléments partagés", () => {
    expect(composants.a).toBe(Lien);
    expect(composants.strong).toBe(Gras);
    expect(composants.em).toBe(Italique);
    expect(composants.code).toBe(CodeEnLigne);
  });

  it("ouvre un lien externe du corps dans un nouvel onglet", () => {
    const html = renderToStaticMarkup(
      createElement(composants.a, { href: "https://example.com" }, "source"),
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
