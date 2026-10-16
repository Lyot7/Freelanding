import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { frameData, frameSteps } from "motion/react";

import { useScrollParallaxY } from "./ScrollParallax";

/**
 * `scrollY` compte en pixels affichés, la translation en pixels de mise en
 * page, que le `zoom` des grands écrans (`--zoom-ecran`) agrandit : la dérive
 * est donc divisée par le zoom, relu à chaque redimensionnement.
 *
 * La boucle d'images de `motion` est choisie au chargement du module : sans
 * `requestAnimationFrame` à ce moment-là, elle ne tourne jamais seule. Le test
 * la vide donc à la main, étape par étape, comme le ferait une image réelle.
 */
const ETAPES = [
  "setup",
  "read",
  "resolveKeyframes",
  "preUpdate",
  "update",
  "preRender",
  "render",
  "postRender",
];

function viderImages() {
  for (let image = 0; image < 3; image++) {
    for (const etape of ETAPES) frameSteps[etape].process(frameData);
  }
}

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
  };
  const racineDoc = dom.window.document.documentElement;
  const defilement = { y: 0 };
  Object.defineProperty(dom.window.document, "scrollingElement", {
    value: racineDoc,
    configurable: true,
  });
  Object.defineProperty(racineDoc, "scrollTop", {
    get: () => defilement.y,
    configurable: true,
  });
  dom.window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return {
    dom,
    defilement,
    restaurer: () => Object.assign(globalThis, precedent),
  };
}

describe("useScrollParallaxY sous le zoom des grands écrans", () => {
  let contexte;

  afterEach(() => {
    contexte?.restaurer();
    contexte = undefined;
  });

  it("divise la dérive par le zoom et relit le zoom au redimensionnement", async () => {
    contexte = installerDom();
    const { dom, defilement } = contexte;
    const racineDoc = dom.window.document.documentElement;
    racineDoc.style.setProperty("--zoom-ecran", "2");

    const releve = { y: null };
    function Sonde() {
      releve.y = useScrollParallaxY(0.5);
      return null;
    }

    // Chaque écouteur de redimensionnement posé doit être retiré au démontage.
    const ecouteurs = new Set();
    const ajouter = dom.window.addEventListener.bind(dom.window);
    const retirer = dom.window.removeEventListener.bind(dom.window);
    dom.window.addEventListener = (type, rappel, ...reste) => {
      if (type === "resize") ecouteurs.add(rappel);
      return ajouter(type, rappel, ...reste);
    };
    dom.window.removeEventListener = (type, rappel, ...reste) => {
      if (type === "resize") ecouteurs.delete(rappel);
      return retirer(type, rappel, ...reste);
    };

    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    await act(async () => {
      racine.render(createElement(Sonde));
    });
    expect(releve.y).toBeDefined();

    // 400 px affichés × 0,5 / zoom 2.
    defilement.y = 400;
    dom.window.dispatchEvent(new dom.window.Event("scroll"));
    viderImages();
    expect(releve.y.get()).toBe(100);

    // La fenêtre repasse sous 2048 px : le zoom retombe à 1, relu au resize.
    racineDoc.style.setProperty("--zoom-ecran", "1");
    dom.window.dispatchEvent(new dom.window.Event("resize"));
    defilement.y = 600;
    dom.window.dispatchEvent(new dom.window.Event("scroll"));
    viderImages();
    expect(releve.y.get()).toBe(300);

    expect(ecouteurs.size).toBeGreaterThan(0);
    await act(async () => {
      racine.unmount();
    });
    expect(ecouteurs.size).toBe(0);
    await new Promise((resoudre) => setTimeout(resoudre, 20));
  });
});
