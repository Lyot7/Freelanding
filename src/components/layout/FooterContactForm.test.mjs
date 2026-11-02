import { describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteConfig } from "@/content/site";
import {
  OPTIONS_ECHEANCE,
  optionsObjectif,
  rendezVousDuTypeProjet,
  tranchesBudget,
} from "@/lib/rendez-vous/questionnaire";
import { FooterContactForm, etatAdresse } from "./FooterContactForm";

/**
 * Le contour d'un champ doit tenir 3:1 sur la carte du pied de page (WCAG
 * 1.4.11). À 25 % de blanc, il plafonnait à 2,1:1 ; 40 % donne environ 3,8:1
 * sur la matière `#131313`, et le survol monte d'un cran au-dessus.
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
      .filter((classes) => classes.includes("neo-champ"));
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
    it(`marque « ${champ} » refusé quand le serveur le refuse`, async () => {
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
        expect(champRefuse().getAttribute("aria-invalid")).toBeNull();
        await act(async () => {
          conteneur
            .querySelector("form")
            .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
          // Le sondage du jeton (150 ms) puis la réponse factice.
          await new Promise((resoudre) => setTimeout(resoudre, 400));
        });
        // `.neo-champ[aria-invalid="true"]` passe le contour au rouge d'erreur.
        expect(champRefuse().getAttribute("aria-invalid")).toBe("true");
      } finally {
        await act(async () => racine.unmount());
        contexte.restaurer();
      }
    });
  }

  /** Valeurs des boutons radio d'un groupe, dans l'ordre affiché. */
  function valeurs(racine, nom) {
    return [...racine.querySelectorAll(`input[type="radio"][name="${nom}"]`)].map((radio) => radio.value);
  }

  async function monter() {
    const contexte = installerDom();
    const { createRoot } = await import("react-dom/client");
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    await act(async () => {
      racine.render(createElement(FooterContactForm, proprietes));
    });
    return {
      conteneur,
      async demonter() {
        await act(async () => racine.unmount());
        contexte.restaurer();
      },
    };
  }

  it("envoie les mêmes réponses qu'avec les listes, en pastilles radio", async () => {
    const { conteneur, demonter } = await monter();
    try {
      expect(conteneur.querySelector("select")).toBeNull();
      const { selectOptions } = siteConfig.footerForm;
      expect(valeurs(conteneur, "typeProjet")).toEqual(selectOptions);
      expect(conteneur.querySelector('input[name="typeProjet"]:checked').value).toBe(selectOptions[0]);
      expect(valeurs(conteneur, "objectif")).toEqual(
        optionsObjectif(rendezVousDuTypeProjet(selectOptions[0])).map((option) => option.id),
      );
      expect(valeurs(conteneur, "budget")).toEqual(tranchesBudget().map((option) => option.id));
      expect(valeurs(conteneur, "echeance")).toEqual(OPTIONS_ECHEANCE.map((option) => option.id));
      // Requis comme l'étaient les listes, sauf l'échéance.
      expect(conteneur.querySelector('input[name="objectif"]').required).toBe(true);
      expect(conteneur.querySelector('input[name="budget"]').required).toBe(true);
      expect(conteneur.querySelector('input[name="echeance"]').required).toBe(false);
    } finally {
      await demonter();
    }
  });

  it("change les objectifs proposés avec le type de projet", async () => {
    const { conteneur, demonter } = await monter();
    try {
      const autre = siteConfig.footerForm.selectOptions.find(
        (type) => rendezVousDuTypeProjet(type) !== rendezVousDuTypeProjet(siteConfig.footerForm.selectOptions[0]),
      );
      expect(autre).toBeDefined();
      await act(async () => {
        conteneur.querySelector(`input[name="typeProjet"][value="${autre}"]`).click();
      });
      expect(valeurs(conteneur, "objectif")).toEqual(
        optionsObjectif(rendezVousDuTypeProjet(autre)).map((option) => option.id),
      );
    } finally {
      await demonter();
    }
  });

  it("vérifie l'adresse e-mail à la sortie du champ", () => {
    // Le branchement sur `onBlur` est vérifié au navigateur : sous la suite
    // complète, `react-dom/client` est chargé avant le DOM par d'autres tests
    // et n'écoute plus `focusout`.
    expect(etatAdresse("", true)).toBe("repos");
    expect(etatAdresse("   ", true)).toBe("repos");
    expect(etatAdresse("claire.martin@", false)).toBe("refuse");
    // `type="email"` accepte une adresse sans point dans le domaine.
    expect(etatAdresse("claire@atelier", true)).toBe("refuse");
    expect(etatAdresse(" claire.martin@atelier.fr ", true)).toBe("valide");
    expect(siteConfig.footerForm.emailInvalide).toContain("exemple@email.com");
  });
});
