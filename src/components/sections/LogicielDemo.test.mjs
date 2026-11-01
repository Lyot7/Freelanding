import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { homeContent } from "@/content/home";
import { LogicielDemo } from "./LogicielDemo";

/**
 * La démonstration du logiciel métier : deux onglets ARIA (« À la main »,
 * « Avec l'outil »), une bascule automatique UNE fois la fenêtre à moitié
 * visible, jamais après un geste du visiteur, et le compte des étapes qui
 * restent à faire à la main.
 *
 * L'observateur de visibilité et le délai de 0,9 s sont pilotés à la main :
 * le test déclenche l'entrée dans l'écran et l'échéance du délai quand il le
 * décide, sans attendre en temps réel.
 */
const demo = homeContent.logiciel.demo;
const DELAI_BASCULE = 900;

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    IntersectionObserver: globalThis.IntersectionObserver,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  const observateurs = [];
  globalThis.IntersectionObserver = class {
    constructor(rappel, options) {
      this.rappel = rappel;
      this.options = options;
      this.observe = (cible) => {
        this.cible = cible;
      };
      this.deconnecte = false;
      observateurs.push(this);
    }
    disconnect() {
      this.deconnecte = true;
    }
  };
  // Seul le délai de bascule est intercepté : React garde ses propres minuteurs.
  const delais = [];
  const annules = [];
  const poser = precedent.setTimeout;
  const annuler = precedent.clearTimeout;
  globalThis.setTimeout = (rappel, ms, ...reste) => {
    if (ms !== DELAI_BASCULE) return poser(rappel, ms, ...reste);
    delais.push(rappel);
    return { delai: delais.length };
  };
  globalThis.clearTimeout = (id) => {
    if (id && typeof id === "object" && "delai" in id) {
      annules.push(id.delai);
      return undefined;
    }
    return annuler(id);
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return {
    dom,
    observateurs,
    delais,
    annules,
    restaurer: () => Object.assign(globalThis, precedent),
  };
}

async function monter() {
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(createElement(LogicielDemo, { demo }));
  });
  const onglet = (cle) => conteneur.querySelector(`[role="tab"][id$="-onglet-${cle}"]`);
  const selectionne = () =>
    conteneur.querySelector('[role="tab"][aria-selected="true"]').textContent;
  const compte = () =>
    conteneur.querySelector('[role="tabpanel"] > div > p > span').textContent;
  const etapes = () =>
    [...conteneur.querySelectorAll('[role="tabpanel"] li')].map((li) => li.textContent);
  const demonter = async () => {
    await act(async () => {
      racine.unmount();
    });
  };
  return { conteneur, onglet, selectionne, compte, etapes, demonter };
}

describe("LogicielDemo", () => {
  let contexte;

  afterEach(() => {
    contexte?.restaurer();
    contexte = undefined;
  });

  it("expose deux onglets ARIA reliés au panneau, « À la main » d'abord", async () => {
    contexte = installerDom();
    const vue = await monter();
    const liste = vue.conteneur.querySelector('[role="tablist"]');
    expect(liste.getAttribute("aria-label")).toBe(demo.titre);

    const main = vue.onglet("main");
    const outil = vue.onglet("outil");
    expect(main.textContent).toBe(demo.onglets.main);
    expect(outil.textContent).toBe(demo.onglets.outil);
    expect(main.getAttribute("aria-selected")).toBe("true");
    expect(outil.getAttribute("aria-selected")).toBe("false");
    // Un seul arrêt de tabulation : l'onglet actif.
    expect(main.getAttribute("tabindex")).toBe("0");
    expect(outil.getAttribute("tabindex")).toBe("-1");

    const panneau = vue.conteneur.querySelector('[role="tabpanel"]');
    expect(main.getAttribute("aria-controls")).toBe(panneau.id);
    expect(panneau.getAttribute("aria-labelledby")).toBe(main.id);

    expect(vue.etapes()).toHaveLength(demo.jours.length);
    expect(vue.etapes()[0]).toContain(demo.jours[0].tache);
    expect(vue.etapes()[0]).toContain(demo.jours[0].main);
    // Cinq étapes à la main, toutes pour le visiteur.
    expect(vue.compte()).toBe(demo.compteur.main.valeur);
    expect(vue.conteneur.textContent).not.toContain(demo.gain.valeur);
    await vue.demonter();
  });

  it("passe d'un onglet à l'autre aux flèches et y déplace le focus", async () => {
    contexte = installerDom();
    const { dom } = contexte;
    const vue = await monter();
    const presser = async (key) => {
      const evenement = new dom.window.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      await act(async () => {
        vue.onglet("main").dispatchEvent(evenement);
      });
      return evenement;
    };

    const droite = await presser("ArrowRight");
    expect(droite.defaultPrevented).toBe(true);
    expect(vue.selectionne()).toBe(demo.onglets.outil);
    expect(document.activeElement).toBe(vue.onglet("outil"));
    expect(vue.onglet("outil").getAttribute("tabindex")).toBe("0");
    expect(vue.conteneur.querySelector('[role="tabpanel"]').getAttribute("aria-labelledby")).toBe(
      vue.onglet("outil").id,
    );
    // Le gain et la preuve n'apparaissent qu'avec moi.
    expect(vue.conteneur.textContent).toContain(demo.preuve);
    expect(vue.compte()).toBe(demo.compteur.outil.valeur);
    expect(vue.etapes()[0]).toContain(demo.jours[0].rendu);
    expect(vue.compte()).toBe(demo.compteur.outil.valeur);
    expect(vue.conteneur.textContent).toContain(demo.gain.valeur);

    await presser("ArrowLeft");
    expect(vue.selectionne()).toBe(demo.onglets.main);
    expect(document.activeElement).toBe(vue.onglet("main"));

    // Une autre touche ne change rien et n'est pas retenue.
    const entree = await presser("Enter");
    expect(entree.defaultPrevented).toBe(false);
    expect(vue.selectionne()).toBe(demo.onglets.main);
    await vue.demonter();
  });

  it("change d'onglet au clic", async () => {
    contexte = installerDom();
    const vue = await monter();
    await act(async () => {
      vue.onglet("outil").click();
    });
    expect(vue.selectionne()).toBe(demo.onglets.outil);
    expect(vue.compte()).toBe(demo.compteur.outil.valeur);
    await vue.demonter();
  });

  it("bascule seule sur l'outil une fois la semaine sous les yeux", async () => {
    contexte = installerDom();
    const { observateurs, delais } = contexte;
    const vue = await monter();
    const [observateur] = observateurs;
    expect(observateur.options).toEqual({ threshold: 0.6 });
    expect(observateur.cible).toBe(vue.conteneur.querySelector('[role="tabpanel"] ul'));

    // Hors écran (ou entrée vide) : rien n'est programmé.
    observateur.rappel([]);
    observateur.rappel([{ isIntersecting: false }]);
    expect(delais).toHaveLength(0);
    expect(observateur.deconnecte).toBe(false);

    // Visible : l'observateur se retire, la bascule attend 0,9 s.
    observateur.rappel([{ isIntersecting: true }]);
    expect(observateur.deconnecte).toBe(true);
    expect(delais).toHaveLength(1);
    expect(vue.selectionne()).toBe(demo.onglets.main);

    await act(async () => {
      delais[0]();
    });
    expect(vue.selectionne()).toBe(demo.onglets.outil);
    expect(vue.compte()).toBe(demo.compteur.outil.valeur);
    await vue.demonter();
  });

  it("n'écrase jamais le texte : le volt monte en translation, sans annonce en boucle", async () => {
    contexte = installerDom();
    const vue = await monter();
    const rendu = vue.conteneur.querySelector(".logiciel-rendu");
    expect(rendu.style.transform).toBe("translateY(100%)");
    await act(async () => {
      vue.onglet("outil").click();
    });
    expect(rendu.style.transform).toBe("none");
    expect(vue.conteneur.querySelector('[role="tabpanel"]').hasAttribute("aria-live")).toBe(false);
    await vue.demonter();
  });

  it("ne bascule plus seule après un clic du visiteur", async () => {
    contexte = installerDom();
    const { observateurs, delais } = contexte;
    const vue = await monter();
    await act(async () => {
      vue.onglet("main").click();
    });
    observateurs[0].rappel([{ isIntersecting: true }]);
    expect(delais).toHaveLength(0);
    expect(vue.selectionne()).toBe(demo.onglets.main);
    await vue.demonter();
  });

  it("annule la bascule programmée si le visiteur clique pendant le délai", async () => {
    contexte = installerDom();
    const { observateurs, delais } = contexte;
    const vue = await monter();
    observateurs[0].rappel([{ isIntersecting: true }]);
    expect(delais).toHaveLength(1);
    await act(async () => {
      vue.onglet("main").click();
    });
    await act(async () => {
      delais[0]();
    });
    expect(vue.selectionne()).toBe(demo.onglets.main);
    await vue.demonter();
  });

  it("retire le délai encore en attente au démontage, et seulement lui", async () => {
    contexte = installerDom();
    const { observateurs, annules } = contexte;
    const sansDelai = await monter();
    await sansDelai.demonter();
    expect(annules).toHaveLength(0);
    expect(observateurs[0].deconnecte).toBe(true);

    const avecDelai = await monter();
    observateurs[1].rappel([{ isIntersecting: true }]);
    await avecDelai.demonter();
    expect(annules).toEqual([1]);
  });
});
