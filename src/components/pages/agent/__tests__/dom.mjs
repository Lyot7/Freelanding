import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

/**
 * DOM local pour les tests des boutons de copie de la vue Agent, sur le modèle
 * de `HeroSection.test.mjs` : un `JSDOM` installé à la main tourne aussi bien
 * sous `bun test` que sous `bunx vitest` (rejoué par le gate pre-pr-gate).
 *
 * Les minuteries de `window` sont capturées : un test déclenche à la main le
 * retour à l'état de repos au lieu d'attendre quatre secondes.
 */
export function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    HTMLElement: globalThis.HTMLElement,
  };
  const minuteries = [];
  const annulees = [];
  dom.window.setTimeout = (rappel, delai) => {
    minuteries.push({ rappel, delai });
    return minuteries.length;
  };
  dom.window.clearTimeout = (id) => {
    annulees.push(id);
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  const conteneur = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);

  return {
    dom,
    conteneur,
    minuteries,
    annulees,
    /** Remplace `navigator.clipboard` (absent : `undefined`). */
    pressePapiers(valeur) {
      Object.defineProperty(dom.window.navigator, "clipboard", {
        value: valeur,
        configurable: true,
      });
    },
    async monter(composant, props, enveloppe = (enfant) => enfant) {
      await act(async () => {
        racine.render(enveloppe(createElement(composant, props)));
      });
    },
    async cliquer(element) {
      await act(async () => {
        element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      });
    },
    async declencherMinuterie() {
      const derniere = minuteries.at(-1);
      await act(async () => {
        derniere.rappel();
      });
    },
    async demonter() {
      await act(async () => {
        racine.unmount();
      });
    },
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      globalThis.HTMLElement = precedent.HTMLElement;
      Object.defineProperty(globalThis, "navigator", {
        value: precedent.navigator,
        configurable: true,
        writable: true,
      });
    },
  };
}
