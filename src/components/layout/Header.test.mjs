import { describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { vueAgentContent } from "@/content/vue-agent";
import { content } from "@/lib/content";
import { Header } from "./Header";

/**
 * Sélecteur « Humain / Agent » de l'en-tête (`ToggleVue`), rendu au serveur
 * comme sur le site : la vue courante n'est jamais un lien, l'autre l'est.
 */
const site = await content.getSiteConfig();
const t = vueAgentContent.toggle;

function rendre(props) {
  const html = renderToStaticMarkup(createElement(Header, { site, ...props }));
  return new JSDOM(html).window.document;
}

function selecteur(doc) {
  return doc.querySelector(`nav[aria-label="${t.libelle}"]`);
}

/** Le bouton unique des petits écrans : le lien qui porte le préfixe masqué. */
function bascule(doc) {
  return [...doc.querySelectorAll("a")].find((a) =>
    [...a.querySelectorAll(".sr-only")].some((span) => span.textContent === t.prefixe),
  );
}

describe("Header : sélecteur de vue", () => {
  it("par défaut, marque « Humain » comme courant et lie « Agent » à /agent", () => {
    const doc = rendre({});
    const nav = selecteur(doc);
    const courant = nav.querySelector('[aria-current="true"]');
    expect(courant.tagName).toBe("SPAN");
    expect(courant.textContent).toBe(t.humain);
    const lien = nav.querySelector("a");
    expect(lien.getAttribute("href")).toBe("/agent");
    expect(lien.textContent).toBe(t.agent);

    const petit = bascule(doc);
    expect(petit.getAttribute("href")).toBe("/agent");
    expect(petit.textContent).toBe(`${t.prefixe}${t.agent}`);
  });

  it("en vue agent, marque « Agent » comme courant et ramène à l'accueil", () => {
    const doc = rendre({ vue: "agent" });
    const nav = selecteur(doc);
    expect(nav.querySelector('[aria-current="true"]').textContent).toBe(t.agent);
    const lien = nav.querySelector("a");
    expect(lien.getAttribute("href")).toBe("/");
    expect(lien.textContent).toBe(t.humain);

    const petit = bascule(doc);
    expect(petit.getAttribute("href")).toBe("/");
    expect(petit.textContent).toBe(`${t.prefixe}${t.humain}`);
  });

  it("n'expose qu'un seul segment courant", () => {
    for (const vue of ["humain", "agent"]) {
      expect(selecteur(rendre({ vue })).querySelectorAll('[aria-current="true"]')).toHaveLength(1);
    }
  });
});
