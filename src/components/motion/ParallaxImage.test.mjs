import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { ParallaxImage } from "./ParallaxImage";

/**
 * `ParallaxImage` passe par `useParallaxLayerY` depuis le 2026-10-16 : le calque
 * porte une dérive verticale tant que le mouvement est permis, et aucune sous
 * `prefers-reduced-motion`, où il reste centré sur son cadre.
 */
const PROPS = {
  src: "/images/heros/page-site-vitrine.jpg",
  alt: "",
  width: 1200,
  height: 800,
  overshoot: 0.07,
};

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    ResizeObserver: globalThis.ResizeObserver,
    IntersectionObserver: globalThis.IntersectionObserver,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  dom.window.matchMedia = (query) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return () => {
    const { navigator, ...reste } = precedent;
    Object.assign(globalThis, reste);
    Object.defineProperty(globalThis, "navigator", {
      value: navigator,
      configurable: true,
      writable: true,
    });
  };
}

describe("ParallaxImage", () => {
  let restaurer;

  afterEach(() => {
    restaurer?.();
    restaurer = undefined;
  });

  it("pose la dérive verticale sur le calque quand le mouvement est permis", () => {
    const html = renderToStaticMarkup(createElement(ParallaxImage, PROPS));
    const calque = html.match(/<div[^>]*data-part="parallax-layer"[^>]*>/)?.[0] ?? "";
    expect(calque).not.toBe("");
    // Départ en butée haute : -7 / 1,14 = -6,14 % du calque.
    expect(calque).toMatch(/transform:\s*translateY\(-6\.14\d*%\)/);
  });

  it("ne pose aucune dérive sous prefers-reduced-motion", async () => {
    restaurer = installerDom();
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    await act(async () => {
      racine.render(createElement(ParallaxImage, PROPS));
    });

    const calque = conteneur.querySelector('[data-part="parallax-layer"]');
    expect(calque).not.toBeNull();
    expect(calque.style.transform).toBe("");
    // La géométrie du calque reste celle du cadre surdimensionné.
    expect(calque.style.top).toBe("-7%");

    await act(async () => {
      racine.unmount();
    });
    await new Promise((resoudre) => setTimeout(resoudre, 20));
  });
});
