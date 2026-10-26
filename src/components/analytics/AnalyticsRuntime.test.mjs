import "./cle-posthog-de-test.mjs";

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { AnalyticsRuntime } from "@/components/analytics/AnalyticsRuntime";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import {
  CONSENT_OPEN_EVENT,
  ConsentProvider,
} from "@/components/consent/ConsentProvider";
import { consentCopy } from "@/content/consent";
import { getAnalyticsClient, startAnalytics } from "@/lib/analytics/posthog";

/*
 * Le bandeau et la courroie consentement → mesure, montés ensemble dans un DOM
 * réel. Un `JSDOM` local, comme `HeroSection.test.mjs` : le fichier tourne sous
 * `bun test` comme sous `bunx vitest` (rejoué par le gate pre-pr-gate).
 *
 * La mesure est démarrée par le test avec un faux SDK : la clé de `config.ts`
 * est vide en test, le composant ne démarrerait donc rien de lui-même.
 */
const GLOBAUX_DOM = [
  "self",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
];

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    localStorage: globalThis.localStorage,
    IntersectionObserver: globalThis.IntersectionObserver,
    globaux: Object.fromEntries(GLOBAUX_DOM.map((nom) => [nom, globalThis[nom]])),
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: dom.window.localStorage,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = (query) => ({
    matches: false,
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
  dom.window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = dom.window.IntersectionObserver;
  /* framer-motion lit ces noms sur l'objet global, pas sur `window`. */
  for (const nom of GLOBAUX_DOM) globalThis[nom] = dom.window[nom];
  return {
    dom,
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      globalThis.IntersectionObserver = precedent.IntersectionObserver;
      for (const nom of GLOBAUX_DOM) {
        if (precedent.globaux[nom] === undefined) delete globalThis[nom];
        else globalThis[nom] = precedent.globaux[nom];
      }
      for (const nom of ["navigator", "localStorage"]) {
        Object.defineProperty(globalThis, nom, {
          value: precedent[nom],
          configurable: true,
          writable: true,
        });
      }
    },
  };
}

/** Faux SDK : seuls les appels utiles au test sont enregistrés. */
function fauxSdk() {
  const rien = () => {};
  return {
    init: rien,
    set_config: rien,
    opt_in_capturing: rien,
    opt_out_capturing: rien,
    reset: rien,
    startSessionRecording: rien,
    stopSessionRecording: rien,
    identify: rien,
    capture: rien,
  };
}

function bouton(texte) {
  return [...document.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === texte,
  );
}

describe("AnalyticsRuntime et ConsentBanner", () => {
  let contexte;
  let racine;
  let envoyes;

  beforeEach(async () => {
    contexte = installerDom();
    /* Démarrage avec accord : quel que soit l'état laissé par un autre fichier
       de test, la mesure tourne en régime complet et tout passe le filtre. */
    const sdk = fauxSdk();
    await startAnalytics(
      { analytics: true, replay: false },
      async () => ({ default: sdk }),
      "phc_test",
    );
    envoyes = [];
    getAnalyticsClient().capture = (event, proprietes) => {
      envoyes.push([event, proprietes]);
    };
  });

  afterEach(async () => {
    if (racine) await act(async () => racine.unmount());
    racine = null;
    /* Rendre la mesure partagée dans l'état d'une visite sans réponse. */
    await startAnalytics({ analytics: false, replay: false }, undefined, "phc_test");
    contexte.restaurer();
  });

  async function monter() {
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    racine = createRoot(conteneur);
    await act(async () => {
      racine.render(
        createElement(
          PathnameContext.Provider,
          { value: "/" },
          createElement(
            SearchParamsContext.Provider,
            { value: new URLSearchParams() },
            createElement(
              ConsentProvider,
              null,
              createElement(AnalyticsRuntime),
              createElement(ConsentBanner),
            ),
          ),
        ),
      );
    });
  }

  const evenements = () => envoyes.map(([event]) => event);

  it("ne renvoie pas une décision prise sur une page précédente", async () => {
    localStorage.setItem(
      "eb-consent",
      JSON.stringify({
        version: 1,
        decidedAt: Date.now() - 24 * 60 * 60 * 1000,
        choices: { analytics: true, replay: false },
      }),
    );
    await monter();
    expect(evenements()).toContain("$pageview");
    expect(evenements()).not.toContain("consent_updated");
  });

  it("premier écran : une phrase, « Détails » et « Personnaliser », titre réservé aux lecteurs d'écran", async () => {
    await monter();
    const titre = document.querySelector("h2");
    expect(titre.className).toBe("sr-only");
    expect(document.body.textContent).toContain(consentCopy.body);
    const liens = [...document.querySelectorAll("a")].map((a) =>
      a.textContent.trim(),
    );
    expect(liens).toContain(consentCopy.policyShort);
    expect(bouton(consentCopy.customise)).toBeDefined();
    expect(bouton(consentCopy.rejectAll).className).toBe(
      bouton(consentCopy.acceptAll).className.replace(
        "bg-accent text-accent-ink",
        "bg-foreground text-background",
      ),
    );
  });

  it("panneau déplié : titre visible, puis l'accord part une seule fois", async () => {
    await monter();
    await act(async () => {
      bouton(consentCopy.customise).click();
    });
    expect(document.querySelector("h2").className).not.toBe("sr-only");
    expect(document.body.textContent).toContain(consentCopy.policyLabel);

    await act(async () => {
      bouton(consentCopy.acceptAll).click();
    });
    expect(
      evenements().filter((event) => event === "consent_updated"),
    ).toHaveLength(1);
  });

  it("rouvert après un choix, propose de retirer le consentement", async () => {
    localStorage.setItem(
      "eb-consent",
      JSON.stringify({
        version: 1,
        decidedAt: Date.now() - 1000,
        choices: { analytics: true, replay: false },
      }),
    );
    await monter();
    await act(async () => {
      window.dispatchEvent(new window.Event(CONSENT_OPEN_EVENT));
    });
    expect(bouton(consentCopy.revoke)).toBeDefined();
  });
});
