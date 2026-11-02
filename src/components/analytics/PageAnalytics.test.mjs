import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { PageAnalytics } from "@/components/analytics/PageAnalytics";
import { getAnalyticsClient, startAnalytics } from "@/lib/analytics/posthog";

/**
 * LA MESURE D'UNE PAGE DE GESTION DE RENDEZ-VOUS. Le jeton du lien est un
 * secret : ni la vue, ni la sortie, ni l'URL rapportée ne doivent le porter.
 * Une page ordinaire, elle, garde son chemin tel quel.
 *
 * Faux SDK démarré par le test, comme `AnalyticsRuntime.test.mjs`.
 */
const JETON = "Zx9_".repeat(10) + "abc";

function installerDom(chemin) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: `https://eliottbouquerel.fr${chemin}`,
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  return () => {
    globalThis.window = precedent.window;
    globalThis.document = precedent.document;
    globalThis.IntersectionObserver = precedent.IntersectionObserver;
  };
}

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

describe("PageAnalytics", () => {
  let restaurer;
  let envoyes;

  /** DOM d'abord : la mesure ne démarre que dans un navigateur. */
  async function demarrer(chemin) {
    restaurer = installerDom(chemin);
    await startAnalytics({ analytics: true, replay: false }, async () => ({ default: fauxSdk() }), "phc_test");
    envoyes = [];
    getAnalyticsClient().capture = (event, proprietes) => envoyes.push([event, proprietes]);
  }

  afterEach(async () => {
    await startAnalytics({ analytics: false, replay: false }, undefined, "phc_test");
    restaurer?.();
  });

  async function visiter(chemin, enabled = true) {
    await demarrer(chemin);
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    await act(async () => {
      racine.render(
        createElement(
          PathnameContext.Provider,
          { value: new URL(chemin, "https://eliottbouquerel.fr").pathname },
          createElement(
            SearchParamsContext.Provider,
            { value: new URLSearchParams() },
            createElement(PageAnalytics, { enabled }),
          ),
        ),
      );
    });
    await act(async () => racine.unmount());
  }

  const evenement = (nom) => envoyes.find(([event]) => event === nom)?.[1];

  it("rapporte une page de gestion sous son chemin masqué, de la vue à la sortie", async () => {
    await visiter(`/rdv/gerer/${JETON}?source=email`);
    expect(JSON.stringify(envoyes)).not.toContain(JETON);
    const vue = evenement("$pageview");
    expect(vue.page_path).toBe("/rdv/gerer/[jeton]");
    expect(vue.content_slug).toBe("[jeton]");
    expect(vue.$current_url).toBe("https://eliottbouquerel.fr/rdv/gerer/[jeton]?source=email");
    const sortie = evenement("$pageleave");
    expect(sortie.page_path).toBe("/rdv/gerer/[jeton]");
    expect(sortie.$current_url).toBe("https://eliottbouquerel.fr/rdv/gerer/[jeton]?source=email");
    expect(sortie.leave_reason).toBe("navigation");
  });

  it("garde le chemin d’une page ordinaire", async () => {
    await visiter("/contact");
    expect(evenement("$pageview").page_path).toBe("/contact");
    expect(evenement("$pageview").$current_url).toBe("https://eliottbouquerel.fr/contact");
  });

  it("ne mesure rien sans accord", async () => {
    await visiter(`/rdv/gerer/${JETON}`, false);
    expect(envoyes).toEqual([]);
  });
});
