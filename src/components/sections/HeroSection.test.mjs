import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { HeroVideo } from "./HeroSection";

/**
 * `HeroVideo` ne pose la vidéo qu'APRÈS le montage (`useEffect`, jamais au
 * premier rendu) : un DOM réel est nécessaire pour observer `aria-hidden` et
 * `tabIndex={-1}`, posés le 2026-09-21 pour sortir ce décor muet de l'arbre
 * d'accessibilité et du parcours clavier.
 *
 * Un `JSDOM` local (et non l'environnement global d'un test runner) : ce
 * fichier tourne aussi bien sous `bun test` (le runtime réel du dépôt) que
 * sous `bunx vitest` (rejoué par le gate pre-pr-gate), sans dépendre d'une
 * configuration propre à l'un des deux.
 */
function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  // `navigator` est un accesseur en lecture seule sur `globalThis` depuis
  // Node 21 : une simple affectation lève `TypeError`, `defineProperty` la
  // remplace proprement, et reste sans effet quand l'accesseur n'existe pas.
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom n'implémente pas matchMedia : la vidéo n'est montée qu'à partir de
  // 810 px (voir l'en-tête de `HeroVideo`), donc `matches: true` ici.
  dom.window.matchMedia = (query) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    },
  });
  return {
    dom,
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      Object.defineProperty(globalThis, "navigator", {
        value: precedent.navigator,
        configurable: true,
        writable: true,
      });
    },
  };
}

describe("HeroVideo", () => {
  let contexte;

  afterEach(() => {
    contexte?.restaurer();
    contexte = undefined;
  });

  it("sort la vidéo décorative de l'arbre d'accessibilité une fois montée", async () => {
    contexte = installerDom();
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);

    await act(async () => {
      racine.render(createElement(HeroVideo, { src: "/videos/hero-loop.mp4", poster: "/hero.jpg" }));
    });

    // `document.readyState` de jsdom vaut déjà "complete" : `HeroVideo` a donc
    // programmé `window.setTimeout(lancer, 0)` (voir son `useEffect`). On le
    // laisse s'exécuter réellement, à l'intérieur d'un `act()` qui attend son
    // propre écoulement.
    await act(async () => {
      await new Promise((resoudre) => setTimeout(resoudre, 20));
    });

    const video = conteneur.querySelector("video");
    expect(video).not.toBeNull();
    expect(video.getAttribute("aria-hidden")).toBe("true");
    expect(video.getAttribute("tabindex")).toBe("-1");

    await act(async () => {
      racine.unmount();
    });
    // Laisse le scheduler de React vider sa file avant de restaurer les
    // globals : une continuation en retard référencerait sinon un `window`
    // déjà remplacé.
    await new Promise((resoudre) => setTimeout(resoudre, 20));
  });
});
