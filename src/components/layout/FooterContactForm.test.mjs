import { describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteConfig } from "@/content/site";
import { FooterContactForm } from "./FooterContactForm";

/**
 * Le contour d'un champ doit tenir 3:1 sur le fond du pied de page (WCAG
 * 1.4.11). À 25 % de blanc sur `#0b0b0b`, il plafonnait à 2,1:1 ; 40 % donne
 * environ 3,8:1, et le survol monte d'un cran au-dessus.
 */
const proprietes = {
  footerForm: siteConfig.footerForm,
  emailContact: siteConfig.contact.email,
  inlineLinkCls: "",
};

const GLOBAUX_DOM = [
  "self",
  "Node",
  "Element",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "SVGElement",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
];

/** DOM réel et widget Turnstile factice, comme `useEnvoiFormulaire.test.mjs`. */
function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const noms = ["window", "document", "fetch", "Event", "CustomEvent", "FormData", "navigator", ...GLOBAUX_DOM];
  const precedent = Object.fromEntries(noms.map((nom) => [nom, globalThis[nom]]));
  for (const nom of GLOBAUX_DOM) globalThis[nom] = dom.window[nom];
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
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
  dom.window.turnstile = {
    render(_conteneur, options) {
      options.callback("jeton-de-test");
      return "widget-de-test";
    },
    reset() {},
    remove() {},
  };
  return {
    restaurer() {
      for (const nom of noms) {
        Object.defineProperty(globalThis, nom, {
          value: precedent[nom],
          configurable: true,
          writable: true,
        });
      }
    },
  };
}

describe("FooterContactForm", () => {
  it("dessine chaque champ avec un contour lisible au repos et au survol", () => {
    const html = renderToStaticMarkup(
      createElement(FooterContactForm, proprietes),
    );
    const champs = [...html.matchAll(/<(input|textarea)\b[^>]*class="([^"]*)"/g)]
      .map(([, , classes]) => classes)
      .filter((classes) => classes.includes("bg-white/[0.04]"));
    expect(champs.length).toBeGreaterThan(1);
    for (const classes of champs) {
      expect(classes).toContain("border-white/40");
      expect(classes).toContain("hover:border-white/60");
      expect(classes).not.toContain("border-white/25");
    }
  });

  for (const [champ, balise] of [
    ["email", "input"],
    ["message", "textarea"],
  ]) {
    it(`passe le contour de « ${champ} » à l'accent quand le serveur le refuse`, async () => {
      const contexte = installerDom();
      globalThis.fetch = async () => ({
        ok: false,
        status: 422,
        json: async () => ({ message: "Champ à corriger.", champ }),
      });
      // Chargé après le DOM : react-dom/client choisit à l'import entre
      // l'événement `input` et l'ancien `attachEvent` d'Internet Explorer.
      const { createRoot } = await import("react-dom/client");
      const conteneur = document.createElement("div");
      document.body.appendChild(conteneur);
      const racine = createRoot(conteneur);
      try {
        await act(async () => {
          racine.render(createElement(FooterContactForm, proprietes));
        });
        const champRefuse = () => conteneur.querySelector(`${balise}[name="${champ}"]`);
        expect(champRefuse().className).toContain("border-white/40");
        await act(async () => {
          conteneur
            .querySelector("form")
            .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
          // Le sondage du jeton (150 ms) puis la réponse factice.
          await new Promise((resoudre) => setTimeout(resoudre, 400));
        });
        expect(champRefuse().className).toContain("border-accent");
        expect(champRefuse().className).not.toContain("border-white/40");
      } finally {
        await act(async () => racine.unmount());
        contexte.restaurer();
      }
    });
  }
});
