import { afterAll, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";

/**
 * La semaine de bureau PILOTÉE PAR LE DÉFILEMENT (2026-11-02) : chaque jour se
 * convertit sur sa tranche de la traversée de l'écran, la fenêtre passe sur
 * l'outil quand vendredi est rempli, et tout revient si l'on remonte.
 *
 * Fichier à part : le DOM, `requestAnimationFrame` et la préférence de
 * mouvement sont posés AVANT d'importer React et le composant.
 */
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const NOMS = ["window", "document", "requestAnimationFrame", "cancelAnimationFrame"];
const precedent = Object.fromEntries(NOMS.map((nom) => [nom, globalThis[nom]]));
dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
dom.window.IntersectionObserver = class {
  observe() {}
  disconnect() {}
};
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IntersectionObserver = dom.window.IntersectionObserver;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(dom.window, "innerHeight", { value: 1000, configurable: true });

const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { homeContent } = await import("@/content/home");
const { LogicielDemo } = await import("./LogicielDemo");

const demo = homeContent.logiciel.demo;

afterAll(() => {
  for (const nom of NOMS) globalThis[nom] = precedent[nom];
});

async function monter() {
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(createElement(LogicielDemo, { demo }));
  });
  const selectionne = () =>
    conteneur.querySelector('[role="tab"][aria-selected="true"]').textContent;
  const rendus = () =>
    [...conteneur.querySelectorAll(".logiciel-rendu")].map((r) => r.style.transform);
  /** Chiffres affichés : heures de saisie, puis heures rendues. */
  const chiffres = () =>
    [...conteneur.querySelectorAll('[role="tabpanel"] > div > p > span[aria-hidden]')].map(
      (span) => span.textContent,
    );
  const pastille = () => conteneur.querySelector(".logiciel-pastille").style.transform;
  /** Place le haut de la fenêtre à `haut` px d'un écran de 1000 px, puis défile. */
  const placer = async (haut) => {
    conteneur.firstElementChild.getBoundingClientRect = () => ({ top: haut, height: 700 });
    await act(async () => {
      window.dispatchEvent(new window.Event("scroll"));
      await new Promise((resoudre) => window.requestAnimationFrame(resoudre));
    });
  };
  const onglet = (cle) => conteneur.querySelector(`[role="tab"][id$="-onglet-${cle}"]`);
  const demonter = () => act(async () => racine.unmount());
  return { selectionne, rendus, chiffres, pastille, placer, onglet, demonter };
}

describe("LogicielDemo piloté par le défilement", () => {
  it("convertit la semaine jour après jour, puis revient si l'on remonte", async () => {
    const vue = await monter();

    // Fenêtre qui paraît en bas de l'écran : rien n'est converti.
    await vue.placer(1000);
    expect(vue.selectionne()).toBe(demo.onglets.main);
    expect(vue.rendus().every((t) => t === "scaleY(0)")).toBe(true);
    expect(vue.chiffres()).toEqual([demo.compteur.main.valeur, demo.gain.avant]);
    expect(vue.pastille()).toBe("translateX(0%)");

    // Remontée d'un quart de l'écran : lundi bien entamé, vendredi pas encore,
    // et les heures bougent déjà, minute par minute.
    await vue.placer(750);
    const [lundi, , , , vendredi] = vue.rendus();
    expect(lundi).not.toBe("scaleY(0)");
    expect(vendredi).toBe("scaleY(0)");
    expect(vue.selectionne()).toBe(demo.onglets.main);
    const [saisie, rendues] = vue.chiffres();
    expect(saisie).not.toBe(demo.compteur.main.valeur);
    expect(saisie).not.toBe(demo.compteur.outil.valeur);
    expect(rendues).not.toBe(demo.gain.avant);
    expect(rendues).not.toBe(demo.gain.valeur);

    // Remontée des deux tiers : tout est converti, la fenêtre passe sur l'outil.
    await vue.placer(330);
    expect(vue.rendus().every((t) => t === "scaleY(1)")).toBe(true);
    expect(vue.selectionne()).toBe(demo.onglets.outil);
    expect(vue.chiffres()).toEqual([demo.compteur.outil.valeur, demo.gain.valeur]);
    expect(vue.pastille()).toBe("translateX(100%)");

    await vue.placer(1000);
    expect(vue.selectionne()).toBe(demo.onglets.main);
    await vue.demonter();
  });

  it("rend la main au visiteur dès qu'il touche un onglet", async () => {
    const vue = await monter();
    await vue.placer(1000);
    await act(async () => {
      vue.onglet("outil").click();
    });
    await vue.placer(1000);
    expect(vue.selectionne()).toBe(demo.onglets.outil);
    expect(vue.rendus()[0]).toBe("scaleY(1)");
    expect(vue.chiffres()).toEqual([demo.compteur.outil.valeur, demo.gain.valeur]);
    expect(vue.pastille()).toBe("translateX(100%)");
    await vue.demonter();
  });
});
