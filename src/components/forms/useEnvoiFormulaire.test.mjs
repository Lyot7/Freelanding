import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

// La clef Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) est posée par
// `scripts/test-turnstile-env.mjs`, préchargé avant tout fichier de test
// (`bunfig.toml` pour `bun test`, `test.setupFiles` pour vitest) : voir son
// en-tête pour pourquoi elle ne peut pas être posée ici.
import { useEnvoiFormulaire } from "./useEnvoiFormulaire.ts";

/**
 * `corps.nom` et `corps.typeProjet` sont passés SANS CONDITION depuis le
 * 2026-09-21 (l'intention `newsletter`, seule à les omettre, a été retirée) :
 * ce test le vérifie sur un envoi réel de l'intention `footer`, plutôt que de
 * relire la source.
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
    fetch: globalThis.fetch,
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    FormData: globalThis.FormData,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  // `emettre()` construit un `CustomEvent` depuis le global, pas depuis
  // `window` : sans cet alignement, c'est la classe native de Bun qui est
  // construite, que jsdom refuse ensuite (« is not of type 'Event' »).
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  // Même alignement pour `FormData` : `useEnvoiFormulaire` lit le formulaire
  // avec `new FormData(formulaire)` depuis le global, pas depuis `window`.
  globalThis.FormData = dom.window.FormData;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  // Widget Turnstile factice : délivre un jeton dès que son conteneur existe.
  dom.window.turnstile = {
    render(_conteneur, options) {
      options.callback("jeton-de-test");
      return "widget-de-test";
    },
    reset() {},
    remove() {},
  };
  return {
    dom,
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      globalThis.fetch = precedent.fetch;
      globalThis.Event = precedent.Event;
      globalThis.CustomEvent = precedent.CustomEvent;
      globalThis.FormData = precedent.FormData;
      Object.defineProperty(globalThis, "navigator", {
        value: precedent.navigator,
        configurable: true,
        writable: true,
      });
    },
  };
}

describe("useEnvoiFormulaire", () => {
  let contexte;

  afterEach(async () => {
    if (contexte) {
      await new Promise((resoudre) => setTimeout(resoudre, 20));
      contexte.restaurer();
      contexte = undefined;
    }
  });

  it("envoie le nom et le type de projet même pour le pied de page (plus de branche newsletter)", async () => {
    contexte = installerDom();
    const requetes = [];
    globalThis.fetch = async (_url, options) => {
      requetes.push(JSON.parse(options.body));
      return { ok: true, status: 200, json: async () => ({}) };
    };

    let protectionExposee;
    function Harnais() {
      const resultat = useEnvoiFormulaire("footer", "contact@example.com");
      protectionExposee = resultat.protection;
      return createElement(
        "form",
        { onSubmit: resultat.gererSoumission },
        createElement("div", { ref: resultat.protection.refConteneur }),
        createElement("input", { name: "nom", defaultValue: "Jean Dupont", readOnly: true }),
        createElement("input", { name: "email", defaultValue: "jean@example.com", readOnly: true }),
        createElement("input", { name: "typeProjet", defaultValue: "Site vitrine", readOnly: true }),
        createElement("input", { name: "referenceInterne", defaultValue: "", readOnly: true }),
        createElement("button", { type: "submit" }, "Envoyer"),
      );
    }

    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    await act(async () => {
      racine.render(createElement(Harnais));
    });
    expect(protectionExposee.configure).toBe(true);

    const formulaire = conteneur.querySelector("form");
    await act(async () => {
      formulaire.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
      // Laisse le sondage de `obtenirJeton` (toutes les 150 ms) voir le jeton
      // livré par le widget factice, puis la requête `fetch` factice répondre.
      await new Promise((resoudre) => setTimeout(resoudre, 400));
    });

    expect(requetes).toHaveLength(1);
    expect(requetes[0].nom).toBe("Jean Dupont");
    expect(requetes[0].typeProjet).toBe("Site vitrine");
    expect(requetes[0].jetonCaptcha).toBe("jeton-de-test");

    await act(async () => {
      racine.unmount();
    });
  });
});
