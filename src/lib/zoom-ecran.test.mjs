import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";

import { lireZoomEcran } from "./zoom-ecran";

/**
 * `lireZoomEcran` lit `--zoom-ecran` sur la racine, posé par `globals.css` au-delà
 * de 2048 px. Un `JSDOM` local fournit `document` et `getComputedStyle`, que la
 * fonction lit comme des globales du navigateur.
 */
function installerDom(valeur) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  if (valeur !== undefined) {
    dom.window.document.documentElement.style.setProperty("--zoom-ecran", valeur);
  }
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
}

describe("lireZoomEcran", () => {
  const precedent = {
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
  };

  afterEach(() => {
    globalThis.document = precedent.document;
    globalThis.getComputedStyle = precedent.getComputedStyle;
  });

  it("vaut 1 sans document (rendu serveur)", () => {
    globalThis.document = undefined;
    expect(lireZoomEcran()).toBe(1);
  });

  it("renvoie le facteur posé dans --zoom-ecran", () => {
    installerDom("1.75");
    expect(lireZoomEcran()).toBe(1.75);
  });

  it("vaut 1 quand la variable est absente", () => {
    installerDom();
    expect(lireZoomEcran()).toBe(1);
  });

  it("vaut 1 quand la variable n'est pas un nombre", () => {
    installerDom("auto");
    expect(lireZoomEcran()).toBe(1);
  });

  it("vaut 1 quand le facteur est nul ou négatif", () => {
    installerDom("0");
    expect(lireZoomEcran()).toBe(1);
    installerDom("-2");
    expect(lireZoomEcran()).toBe(1);
  });
});
