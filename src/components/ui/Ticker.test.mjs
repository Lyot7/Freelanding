import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { Ticker } from "./Ticker";

/**
 * Au-delà de 2048 px, `body` porte un `zoom` (`--zoom-ecran`) : les boîtes
 * mesurées par `getBoundingClientRect` sont en pixels AFFICHÉS, alors que le
 * décalage `--ticker-shift` est réécrit en pixels de mise en page, que le zoom
 * agrandit une seconde fois. `Ticker` divise donc ses mesures par le zoom.
 *
 * jsdom ne met rien en page : la bande mesure 1000 px affichés, une copie du
 * texte 500 px, quel que soit le zoom.
 */
const LARGEUR_BANDE = 1000;
const LARGEUR_COPIE = 500;

function installerDom(zoom) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
    ResizeObserver: globalThis.ResizeObserver,
    IntersectionObserver: globalThis.IntersectionObserver,
  };
  dom.window.document.documentElement.style.setProperty("--zoom-ecran", String(zoom));
  dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
    return { width: this.tagName === "LI" ? LARGEUR_COPIE : LARGEUR_BANDE, height: 82 };
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class {
    constructor(rappel) {
      this.rappel = rappel;
    }
    observe() {
      this.rappel([{ isIntersecting: true }]);
    }
    disconnect() {}
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return () => Object.assign(globalThis, precedent);
}

async function monter(zoom) {
  const restaurer = installerDom(zoom);
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(createElement(Ticker, { text: "Würth" }));
  });
  const piste = conteneur.querySelector("ul");
  const releve = {
    decalage: piste.style.getPropertyValue("--ticker-shift"),
    duree: piste.style.animationDuration,
    copies: piste.querySelectorAll("li").length,
    etat: piste.style.animationPlayState,
  };
  await act(async () => {
    racine.unmount();
  });
  await new Promise((resoudre) => setTimeout(resoudre, 20));
  return { releve, restaurer };
}

describe("Ticker sous le zoom des grands écrans", () => {
  let restaurer;

  afterEach(() => {
    restaurer?.();
    restaurer = undefined;
  });

  it("garde la période mesurée telle quelle à zoom 1", async () => {
    const monte = await monter(1);
    restaurer = monte.restaurer;
    // 500 px de copie + 14 px de gouttière.
    expect(monte.releve.decalage).toBe("514px");
    expect(monte.releve.copies).toBe(Math.ceil((LARGEUR_BANDE + LARGEUR_COPIE) / 514));
    expect(monte.releve.etat).toBe("running");
  });

  it("divise les mesures par le zoom avant de les réécrire en pixels", async () => {
    const monte = await monter(2);
    restaurer = monte.restaurer;
    // 500 px affichés = 250 px de mise en page, + 14 px de gouttière.
    expect(monte.releve.decalage).toBe("264px");
    // Vitesse constante de 110 px/s sur la période en pixels de mise en page.
    expect(monte.releve.duree).toBe(`${264 / 110}s`);
    expect(monte.releve.copies).toBe(Math.ceil((500 + 250) / 264));
  });
});
