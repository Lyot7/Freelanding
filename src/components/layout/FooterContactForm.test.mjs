import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { installerDom, monter } from "@/components/motion/__tests__/dom.mjs";
import { siteConfig } from "@/content/site";
import { FooterContactForm } from "./FooterContactForm";

const { footerForm } = siteConfig;
const props = { footerForm, emailContact: "contact@eliottbouquerel.fr", inlineLinkCls: "lien" };

describe("FooterContactForm, un seul écran", () => {
  const html = renderToStaticMarkup(createElement(FooterContactForm, props)).replaceAll("&#x27;", "’");

  it("demande la tâche, une adresse et un nom, dans cet ordre", () => {
    const ordre = ['name="message"', 'name="email"', 'name="nom"', 'type="submit"'].map((motif) =>
      html.indexOf(motif),
    );
    expect(ordre.every((position) => position >= 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    expect(html).toContain(footerForm.messageLabel);
    expect(html).toContain('rows="4"');
    expect(html).toContain("Envoyer à Eliott");
    expect(html).toContain(footerForm.delaiReponse);
  });

  it("ne demande plus de type de projet ni d'objectif", () => {
    expect(html).not.toContain('name="typeProjet"');
    expect(html).not.toContain('name="objectif"');
  });

  it("replie le budget et l'échéance, sans jamais les exiger", () => {
    const replis = html.slice(html.indexOf("<details"), html.indexOf("</details>"));
    expect(replis).toContain(footerForm.precisions.ouvrir);
    expect(replis).toContain('name="budget"');
    expect(replis).toContain('name="echeance"');
    expect(replis).not.toContain("required");
    expect(html).not.toMatch(/<details[^>]* open/);
  });

  it("aligne les libellés à gauche", () => {
    expect(html).not.toContain("text-right");
    expect(html).not.toContain("items-end");
  });

  it("donne les deux liens de la mention légale", () => {
    for (const lien of footerForm.disclaimerLinks) expect(html).toContain(`href="${lien.href}"`);
  });
});

describe("FooterContactForm, données optionnelles", () => {
  it("laisse les champs sans exemple et la mention sans lien quand la donnée n'en a pas", () => {
    const html = renderToStaticMarkup(
      createElement(FooterContactForm, {
        ...props,
        footerForm: {
          ...footerForm,
          emailPlaceholder: undefined,
          namePlaceholder: undefined,
          disclaimerLinks: undefined,
        },
      }),
    );
    const doc = new JSDOM(html).window.document;
    expect(doc.querySelector('[name="email"]').getAttribute("placeholder")).toBe("");
    expect(doc.querySelector('[name="nom"]').getAttribute("placeholder")).toBe("");
    for (const lien of footerForm.disclaimerLinks) {
      expect(doc.querySelector(`a[href="${lien.href}"]`)).toBeNull();
    }
    expect(doc.body.textContent).toContain(footerForm.disclaimerJoiner);
  });
});

describe("FooterContactForm, à l'envoi", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  const envoyer = async (reponse) => {
    contexte = installerDom();
    const corps = [];
    globalThis.fetch = async (_url, options) => {
      corps.push(JSON.parse(options.body));
      return reponse;
    };
    // Widget factice : délivre un jeton dès que son conteneur existe.
    window.turnstile = {
      render(_conteneur, options) {
        options.callback("jeton-de-test");
        return "widget-de-test";
      },
      reset() {},
      remove() {},
    };
    montage = await monter(createElement(FooterContactForm, props));
    const formulaire = montage.conteneur.querySelector("form");
    await act(async () => {
      formulaire.dispatchEvent(new window.Event("focusin", { bubbles: true }));
    });
    formulaire.querySelector("[name=message]").value = "Je recopie les commandes chaque lundi.";
    formulaire.querySelector("[name=email]").value = "test@example.com";
    formulaire.querySelector("[name=nom]").value = "Test";
    await act(async () => {
      formulaire.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resoudre) => setTimeout(resoudre, 400));
    });
    return { formulaire, corps };
  };

  it("envoie la tâche sans type de projet, et signe la réponse", async () => {
    const { formulaire, corps } = await envoyer({ ok: true, status: 200, json: async () => ({}) });
    expect(corps).toHaveLength(1);
    expect(corps[0].message).toBe("Je recopie les commandes chaque lundi.");
    expect(corps[0].typeProjet).toBe("");
    const statut = formulaire.querySelector("[role=status]");
    expect(statut.dataset.etat).toBe("succes");
    expect(statut.textContent).toBe("C’est parti. Je vous réponds sous 24 h ouvrées.");
    expect(formulaire.querySelector("svg")).not.toBeNull();
  });

  it("rouvre les précisions quand le serveur refuse l'une d'elles", async () => {
    const { formulaire } = await envoyer({
      ok: false,
      status: 400,
      json: async () => ({ message: "Choisissez une tranche.", champ: "budget" }),
    });
    expect(formulaire.querySelector("details").open).toBe(true);
    expect(formulaire.querySelector("[role=status]").dataset.etat).toBe("erreur");
    expect(formulaire.querySelector("svg")).toBeNull();
    expect(formulaire.querySelector("[name=budget]").getAttribute("aria-invalid")).toBe("true");
  });

  it("surligne le message refusé", async () => {
    const { formulaire } = await envoyer({
      ok: false,
      status: 400,
      json: async () => ({ message: "Trop court.", champ: "message" }),
    });
    expect(formulaire.querySelector("textarea").className).toContain("border-accent");
    expect(formulaire.querySelector("details").open).toBe(false);
  });
});
