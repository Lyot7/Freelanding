import { JSDOM } from "jsdom";
import { frameData, frameSteps } from "motion/react";
import { act } from "react";
import { createRoot } from "react-dom/client";

/** Le temps déjà joué par `avancerImages`, propre à chaque DOM installé. */
let tempsJoue = 0;

/**
 * DOM local des tests de mouvement, sur le modèle de `HeroSection.test.mjs` : un
 * `JSDOM` installé à la main tourne sous `bun test` comme sous `bunx vitest`.
 *
 * jsdom n'a ni `IntersectionObserver` ni `ResizeObserver` : l'un est simulé pour
 * que le test décide quand un élément entre à l'écran, l'autre est muet.
 * `mouvementReduit` répond à `prefers-reduced-motion`, seul média interrogé ici
 * dont la réponse change le rendu ; `largeur` répond aux `min-width`.
 */
export function installerDom({ mouvementReduit = false, largeur = 1440 } = {}) {
  tempsJoue = 0;
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const noms = [
    "window",
    "self",
    "document",
    "navigator",
    "HTMLElement",
    "SVGElement",
    "Element",
    "Node",
    "Event",
    "EventTarget",
    "CustomEvent",
    "FormData",
    "fetch",
    "IntersectionObserver",
    "ResizeObserver",
    "getComputedStyle",
    "matchMedia",
  ];
  const precedent = Object.fromEntries(noms.map((nom) => [nom, globalThis[nom]]));
  const observes = new Map();

  class ObservateurSimule {
    constructor(rappel, options) {
      this.rappel = rappel;
      this.options = options;
      this.cibles = new Set();
    }
    observe(cible) {
      this.cibles.add(cible);
      observes.set(cible, this);
    }
    unobserve(cible) {
      this.cibles.delete(cible);
      observes.delete(cible);
    }
    disconnect() {
      for (const cible of this.cibles) observes.delete(cible);
      this.cibles.clear();
    }
    takeRecords() {
      return [];
    }
  }
  class TailleMuette {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  dom.window.IntersectionObserver = ObservateurSimule;
  dom.window.ResizeObserver = TailleMuette;
  dom.window.matchMedia = (query) => {
    const minimum = query.match(/min-width:\s*(\d+)px/)?.[1];
    return {
      matches: query.includes("reduced-motion")
        ? mouvementReduit
        : minimum
          ? largeur >= Number(minimum)
          : false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
    };
  };

  globalThis.window = dom.window;
  // Lu par `next/link` : le navigateur l'a, Node ne l'a pas.
  globalThis.self = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  // `EventTarget` aussi : motion reconnaît un élément par `instanceof EventTarget`.
  for (const nom of ["HTMLElement", "SVGElement", "Element", "Node", "Event", "EventTarget", "CustomEvent", "FormData"]) {
    globalThis[nom] = dom.window[nom];
  }
  globalThis.IntersectionObserver = ObservateurSimule;
  globalThis.ResizeObserver = TailleMuette;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.matchMedia = dom.window.matchMedia;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  return {
    dom,
    /** Fait entrer `cible` à l'écran, ou l'en fait sortir. */
    async entrer(cible, visible = true) {
      await act(async () => {
        const observateur = observes.get(cible);
        observateur?.rappel(
          [{ target: cible, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }],
          observateur,
        );
      });
    },
    /** Tous les éléments observés à cet instant. */
    observes: () => [...observes.keys()],
    restaurer() {
      for (const nom of noms) {
        if (nom === "navigator") continue;
        globalThis[nom] = precedent[nom];
      }
      Object.defineProperty(globalThis, "navigator", {
        value: precedent.navigator,
        configurable: true,
        writable: true,
      });
    },
  };
}

/** Monte `element` dans le document. Rend le conteneur et de quoi démonter. */
export async function monter(element) {
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(element);
  });
  return {
    conteneur,
    racine,
    async demonter() {
      await act(async () => {
        racine.unmount();
      });
      // Laisse le scheduler de React vider sa file avant de restaurer les globals.
      await new Promise((resoudre) => setTimeout(resoudre, 5));
    },
  };
}

/**
 * Joue une image de motion, `ms` plus tard. Hors navigateur, motion capte un
 * `requestAnimationFrame` absent à son chargement : ses images ne partent jamais
 * seules, et chaque étape se joue ici à la main.
 */
export async function avancerImages(ms = 16) {
  tempsJoue += ms;
  await act(async () => {
    frameData.isProcessing = true;
    frameData.delta = ms;
    frameData.timestamp = performance.now() + tempsJoue;
    for (const etape of Object.values(frameSteps)) etape.process(frameData);
    frameData.isProcessing = false;
  });
}

/** Attend que le temps passe, sous `act`, pour les rappels différés. */
export async function patienter(ms) {
  await act(async () => {
    await new Promise((resoudre) => setTimeout(resoudre, ms));
  });
}
