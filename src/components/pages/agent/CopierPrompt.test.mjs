import { afterEach, describe, expect, it } from "bun:test";

import { vueAgentContent } from "@/content/vue-agent";
import { CopierPrompt } from "./CopierPrompt";
import { installerDom } from "./__tests__/dom.mjs";

const libelles = vueAgentContent.copier;
const PROMPT = "Tu vas jouer le rôle de conseiller.\n\n--- Profil ---";

describe("CopierPrompt", () => {
  let dom;

  afterEach(async () => {
    await dom?.demonter();
    dom?.restaurer();
    dom = undefined;
  });

  function bouton() {
    return dom.conteneur.querySelector("button");
  }
  function statut() {
    return dom.conteneur.querySelector('[role="status"]');
  }

  it("copie le prompt par l'API Clipboard, l'annonce, puis revient au repos", async () => {
    dom = installerDom();
    const copies = [];
    dom.pressePapiers({ writeText: async (texte) => copies.push(texte) });
    await dom.monter(CopierPrompt, { prompt: PROMPT, libelles, conteneur: "items-center" });

    expect(bouton().textContent).toBe(libelles.action);
    expect(statut().textContent).toBe("");
    expect(dom.conteneur.firstElementChild.className).toContain("items-center");

    await dom.cliquer(bouton());
    expect(copies).toEqual([PROMPT]);
    expect(bouton().textContent).toBe(libelles.fait);
    expect(statut().textContent).toBe(libelles.suite);
    expect(statut().className).toContain("text-white/75");
    expect(dom.minuteries.at(-1).delai).toBe(4000);

    await dom.declencherMinuterie();
    expect(bouton().textContent).toBe(libelles.action);
    expect(statut().textContent).toBe("");
  });

  it("se replie sur une zone de texte copiée, retirée ensuite, et rend le focus", async () => {
    dom = installerDom();
    dom.pressePapiers({
      writeText: async () => {
        throw new Error("refusé");
      },
    });
    const copies = [];
    dom.dom.window.document.execCommand = (commande) => {
      const zone = dom.dom.window.document.querySelector("body > textarea");
      copies.push({ commande, valeur: zone?.value, lectureSeule: zone?.hasAttribute("readonly") });
      return true;
    };
    await dom.monter(CopierPrompt, { prompt: PROMPT, libelles, className: "bg-accent" });
    bouton().focus();

    await dom.cliquer(bouton());
    expect(copies).toEqual([{ commande: "copy", valeur: PROMPT, lectureSeule: true }]);
    expect(dom.dom.window.document.querySelector("body > textarea")).toBeNull();
    expect(dom.dom.window.document.activeElement).toBe(bouton());
    expect(bouton().className).toContain("bg-accent");
    expect(statut().textContent).toBe(libelles.suite);
  });

  it("sans presse-papiers ni copie de repli, montre le prompt déjà sélectionné", async () => {
    dom = installerDom();
    dom.pressePapiers(undefined);
    dom.dom.window.document.execCommand = () => false;
    await dom.monter(CopierPrompt, { prompt: PROMPT, libelles, ton: "clair" });

    await dom.cliquer(bouton());
    const zone = dom.conteneur.querySelector("textarea");
    expect(statut().textContent).toBe(libelles.echec);
    expect(statut().className).toContain("text-background/75");
    expect(bouton().textContent).toBe(libelles.action);
    expect(zone.value).toBe(PROMPT);
    expect(zone.getAttribute("aria-label")).toBe(libelles.zone);
    expect(zone.selectionStart).toBe(0);
    expect(zone.selectionEnd).toBe(PROMPT.length);
    // Échec : aucune minuterie de retour au repos, le cadre reste affiché.
    expect(dom.minuteries).toHaveLength(0);
  });

  it("traite une copie de repli qui lève comme un échec, sans focus à rendre", async () => {
    dom = installerDom();
    dom.pressePapiers(undefined);
    dom.dom.window.document.execCommand = () => {
      throw new Error("non pris en charge");
    };
    Object.defineProperty(dom.dom.window.document, "activeElement", {
      get: () => null,
      configurable: true,
    });
    await dom.monter(CopierPrompt, { prompt: PROMPT, libelles });

    await dom.cliquer(bouton());
    expect(statut().textContent).toBe(libelles.echec);
    expect(dom.conteneur.querySelector("textarea")).not.toBeNull();
  });

  it("annule la minuterie en cours au démontage", async () => {
    dom = installerDom();
    dom.pressePapiers({ writeText: async () => undefined });
    await dom.monter(CopierPrompt, { prompt: PROMPT, libelles });
    await dom.cliquer(bouton());
    const id = dom.minuteries.length;

    await dom.demonter();
    expect(dom.annulees.at(-1)).toBe(id);
    dom.restaurer();
    dom = undefined;
  });
});
