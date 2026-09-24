import { afterEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act, createElement } from "react";

import { vueAgentContent } from "@/content/vue-agent";
import { accueilVueAgent } from "@/content/vue-agent-accueil";
import { DemanderAssistant } from "./DemanderAssistant";
import { installerDom } from "./__tests__/dom.mjs";

const t = vueAgentContent.accueil;
const PROMPT = "Tu vas jouer le rôle de conseiller.";

/** `ClipboardItem` minimal : garde ses données pour que le test les relise. */
class FauxClipboardItem {
  constructor(donnees) {
    this.donnees = donnees;
  }
}

describe("DemanderAssistant", () => {
  let dom;
  let navigations;
  let appels;
  const precedent = { fetch: globalThis.fetch, ClipboardItem: globalThis.ClipboardItem };

  afterEach(async () => {
    await dom?.demonter();
    dom?.restaurer();
    dom = undefined;
    globalThis.fetch = precedent.fetch;
    globalThis.ClipboardItem = precedent.ClipboardItem;
  });

  function servir(reponse = new Response(PROMPT, { status: 200 })) {
    appels = [];
    globalThis.fetch = async (url) => {
      appels.push(url);
      return reponse;
    };
  }

  async function monter(props = {}) {
    navigations = [];
    const routeur = {
      push: (href) => navigations.push(href),
      replace() {},
      refresh() {},
      prefetch() {},
      back() {},
      forward() {},
    };
    await dom.monter(DemanderAssistant, props, (enfant) =>
      createElement(AppRouterContext.Provider, { value: routeur }, enfant),
    );
  }

  const bouton = () => dom.conteneur.querySelector("button");
  const statut = () => dom.conteneur.querySelector('[role="status"]');
  /** Les deux états empilés du libellé : [repos, copié]. */
  const etats = () => [...bouton().querySelectorAll(":scope > span.grid > span")];
  /** Texte de l'état visible (l'autre porte `invisible`). */
  const visible = () => etats().find((etat) => !etat.classList.contains("invisible")).textContent;

  it("écrit le prompt chargé par ClipboardItem, dans le geste, puis revient au repos", async () => {
    dom = installerDom();
    servir();
    globalThis.ClipboardItem = FauxClipboardItem;
    const ecrits = [];
    dom.pressePapiers({ write: async (items) => ecrits.push(...items) });
    await monter({ className: "tablet:absolute" });

    expect(bouton().className).toContain("tablet:absolute");
    expect(bouton().getAttribute("title")).toBe(t.titre);
    expect(statut().textContent).toBe("");
    expect(visible()).toContain(t.libelle);

    await dom.cliquer(bouton());
    expect(appels).toEqual(["/agent/prompt.txt"]);
    expect(ecrits).toHaveLength(1);
    const blob = await ecrits[0].donnees["text/plain"];
    expect(blob.type).toMatch(/^text\/plain/u);
    expect(await blob.text()).toBe(PROMPT);
    expect(statut().textContent).toBe(t.fait);
    expect(visible()).toBe(`${t.fait}${t.faitCourt}`);
    expect(navigations).toEqual([]);
    expect(dom.minuteries.at(-1).delai).toBe(4000);

    await dom.declencherMinuterie();
    expect(statut().textContent).toBe("");
    expect(visible()).toContain(t.court);
  });

  it("rend toujours les deux états, empilés, pour que la copie ne change pas la largeur", async () => {
    dom = installerDom();
    servir();
    globalThis.ClipboardItem = undefined;
    dom.pressePapiers({ writeText: async () => undefined });
    await monter();

    const invisibles = () => etats().map((etat) => etat.classList.contains("invisible"));
    expect(etats()).toHaveLength(2);
    for (const etat of etats()) {
      expect(etat.className).toContain("col-start-1 row-start-1");
      // Chaque état porte son curseur, collé à son propre texte.
      expect(etat.lastElementChild.getAttribute("aria-hidden")).toBe("true");
      expect(etat.lastElementChild.className).toContain("bg-accent");
    }
    expect(invisibles()).toEqual([false, true]);

    await dom.cliquer(bouton());
    expect(etats()).toHaveLength(2);
    expect(invisibles()).toEqual([true, false]);
  });

  it("sans ClipboardItem, copie le texte chargé avec writeText", async () => {
    dom = installerDom();
    servir();
    globalThis.ClipboardItem = undefined;
    const copies = [];
    dom.pressePapiers({ writeText: async (texte) => copies.push(texte) });
    await monter();

    expect(bouton().className).not.toContain("undefined");
    await dom.cliquer(bouton());
    expect(copies).toEqual([PROMPT]);
    expect(statut().textContent).toBe(t.fait);
  });

  it("avec ClipboardItem mais sans clipboard.write, passe par writeText", async () => {
    dom = installerDom();
    servir();
    globalThis.ClipboardItem = FauxClipboardItem;
    const copies = [];
    dom.pressePapiers({ writeText: async (texte) => copies.push(texte) });
    await monter();

    await dom.cliquer(bouton());
    expect(copies).toEqual([PROMPT]);
  });

  it("mène à la vue agent quand le prompt ne se charge pas", async () => {
    dom = installerDom();
    servir(new Response("introuvable", { status: 404 }));
    globalThis.ClipboardItem = undefined;
    const copies = [];
    dom.pressePapiers({ writeText: async (texte) => copies.push(texte) });
    await monter();

    await dom.cliquer(bouton());
    expect(copies).toEqual([]);
    expect(navigations).toEqual(["/agent"]);
    expect(statut().textContent).toBe("");
  });

  it("mène à la vue agent quand le navigateur n'a pas de presse-papiers", async () => {
    dom = installerDom();
    servir();
    globalThis.ClipboardItem = FauxClipboardItem;
    dom.pressePapiers(undefined);
    await monter();

    await dom.cliquer(bouton());
    expect(navigations).toEqual(["/agent"]);
  });

  it("ignore un second clic pendant le chargement", async () => {
    dom = installerDom();
    globalThis.ClipboardItem = undefined;
    appels = [];
    let livrer;
    globalThis.fetch = (url) => {
      appels.push(url);
      return new Promise((resoudre) => {
        livrer = () => resoudre(new Response(PROMPT, { status: 200 }));
      });
    };
    const copies = [];
    dom.pressePapiers({ writeText: async (texte) => copies.push(texte) });
    await monter();

    const clic = () => new dom.dom.window.MouseEvent("click", { bubbles: true });
    await act(async () => {
      bouton().dispatchEvent(clic());
      bouton().dispatchEvent(clic());
      livrer();
    });
    expect(appels).toHaveLength(1);
    expect(copies).toEqual([PROMPT]);

    // Le verrou est levé : un nouveau clic relance une copie.
    servir();
    await dom.cliquer(bouton());
    expect(appels).toHaveLength(1);
    expect(copies).toEqual([PROMPT, PROMPT]);
  });

  it("annule la minuterie en cours au démontage", async () => {
    dom = installerDom();
    servir();
    globalThis.ClipboardItem = undefined;
    dom.pressePapiers({ writeText: async () => undefined });
    await monter();
    await dom.cliquer(bouton());
    const id = dom.minuteries.length;

    await dom.demonter();
    expect(dom.annulees.at(-1)).toBe(id);
    dom.restaurer();
    dom = undefined;
  });

  it("n'embarque pas les textes de la vue Agent dans le JavaScript de l'accueil", () => {
    const source = readFileSync(new URL("./DemanderAssistant.tsx", import.meta.url), "utf8");
    const imports = [...source.matchAll(/from "([^"]+)"/gu)].map((m) => m[1]);
    expect(imports).toContain("@/content/vue-agent-accueil");
    expect(imports).not.toContain("@/content/vue-agent");
    // Le module léger ne porte ni les consignes du prompt ni le profil.
    const leger = readFileSync(new URL("../../../content/vue-agent-accueil.ts", import.meta.url), "utf8");
    expect(leger).not.toContain(vueAgentContent.prompt.consignes[0]);
    expect(leger).not.toMatch(/from "/u);
    expect(vueAgentContent.accueil).toBe(accueilVueAgent);
  });
});
