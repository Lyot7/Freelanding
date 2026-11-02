import { afterAll, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";

/**
 * Compteurs et progression liés au défilement (2026-11-02). Comme pour la
 * semaine de bureau, le DOM est posé avant d'importer React.
 */
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const NOMS = ["window", "document"];
const precedent = Object.fromEntries(NOMS.map((nom) => [nom, globalThis[nom]]));
let reduit = false;
const ecouteurs = new Set();
dom.window.matchMedia = () => ({
  get matches() {
    return reduit;
  },
  addEventListener: (_type, rappel) => ecouteurs.add(rappel),
  removeEventListener: (_type, rappel) => ecouteurs.delete(rappel),
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(dom.window, "innerHeight", { value: 1000, configurable: true });

const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { renderToStaticMarkup } = await import("react-dom/server");
const { CompteurDefilement } = await import("./CompteurDefilement");
const { tranche, useProgressionDefilement } = await import("./useProgressionDefilement");
const { useRef } = await import("react");

afterAll(() => {
  for (const nom of NOMS) globalThis[nom] = precedent[nom];
});

async function monter(proprietes) {
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(createElement(CompteurDefilement, proprietes));
  });
  const compteur = conteneur.querySelector("[data-compteur]");
  const visible = () => compteur.querySelector("[aria-hidden]").textContent;
  const placer = async (haut) => {
    compteur.getBoundingClientRect = () => ({ top: haut, height: 60 });
    await act(async () => {
      window.dispatchEvent(new window.Event("scroll"));
      await new Promise((resoudre) => window.requestAnimationFrame(resoudre));
    });
  };
  return { conteneur, visible, placer, demonter: () => act(async () => racine.unmount()) };
}

describe("tranche", () => {
  it("ramène une portion de la progression à 0 → 1", () => {
    expect(tranche(0.1, 0.2, 0.6)).toBe(0);
    expect(tranche(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
    expect(tranche(0.9, 0.2, 0.6)).toBe(1);
    expect(tranche(0.5, 0.5, 0.5)).toBe(1);
    expect(tranche(0.4, 0.5, 0.5)).toBe(0);
  });
});

describe("CompteurDefilement", () => {
  it("rend la valeur finale côté serveur, lisible sans script", () => {
    const html = renderToStaticMarkup(
      createElement(CompteurDefilement, { cible: 92, libelle: "92" }),
    );
    expect(html).toContain('<span class="sr-only">92</span>');
    expect(html).toContain('<span aria-hidden="true" class="tabular-nums">92</span>');
  });

  it("monte et redescend avec le défilement", async () => {
    reduit = false;
    const vue = await monter({ cible: 100, libelle: "100" });
    // Haut à 950 (début) : zéro. Bas à 600 (fin) : la valeur pleine.
    await vue.placer(950);
    expect(vue.visible()).toBe("0");
    await vue.placer(745);
    expect(vue.visible()).toBe("50");
    await vue.placer(200);
    expect(vue.visible()).toBe("100");
    await vue.placer(950);
    expect(vue.visible()).toBe("0");
    await vue.demonter();
  });

  it("garde les décimales demandées", async () => {
    reduit = false;
    const vue = await monter({ cible: 4.9, decimales: 1, libelle: "4.9" });
    await vue.placer(745);
    expect(vue.visible()).toBe("2.5");
    await vue.demonter();
  });

  it("ne compte pas une valeur sous 2", async () => {
    reduit = false;
    const vue = await monter({ cible: 1, libelle: "1" });
    await vue.placer(950);
    expect(vue.visible()).toBe("1");
    await vue.demonter();
  });

  it("reste à la valeur finale en mouvement réduit, même si la préférence arrive en route", async () => {
    reduit = true;
    const fige = await monter({ cible: 24, libelle: "24" });
    await fige.placer(950);
    expect(fige.visible()).toBe("24");
    await fige.demonter();

    reduit = false;
    const vue = await monter({ cible: 24, libelle: "24" });
    await vue.placer(950);
    expect(vue.visible()).toBe("0");
    reduit = true;
    await act(async () => {
      for (const rappel of ecouteurs) rappel();
    });
    expect(vue.visible()).toBe("24");
    await vue.placer(950);
    expect(vue.visible()).toBe("24");
    await vue.demonter();
  });

  it("vaut 1 pour un élément sans hauteur de parcours", async () => {
    reduit = false;
    const vue = await monter({ cible: 10, libelle: "10", debut: 0.2, fin: 0.9 });
    await vue.placer(-5000);
    expect(vue.visible()).toBe("10");
    await vue.demonter();
  });
});

describe("useProgressionDefilement", () => {
  /** Sonde : expose la progression d'une cible qu'on attache ou non. */
  async function sonder({ attacher }) {
    const lues = [];
    function Sonde() {
      const cible = useRef(null);
      const { progression } = useProgressionDefilement(cible, 0.85, 0.55);
      lues.push(progression);
      return createElement("div", attacher ? { ref: cible } : null);
    }
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    await act(async () => {
      racine.render(createElement(Sonde));
    });
    return { progression: () => lues.at(-1).get(), conteneur, racine };
  }

  it("ne mesure rien tant que la cible n'est pas attachée", async () => {
    reduit = false;
    const sonde = await sonder({ attacher: false });
    await act(async () => {
      window.dispatchEvent(new window.Event("scroll"));
      await new Promise((resoudre) => window.requestAnimationFrame(resoudre));
    });
    expect(sonde.progression()).toBe(1);
    await act(async () => sonde.racine.unmount());
  });

  it("regroupe les défilements d'une même image et l'annule au démontage", async () => {
    reduit = false;
    const sonde = await sonder({ attacher: true });
    const cible = sonde.conteneur.firstElementChild;
    let mesures = 0;
    cible.getBoundingClientRect = () => {
      mesures += 1;
      return { top: 850, height: 100 };
    };
    await act(async () => {
      window.dispatchEvent(new window.Event("scroll"));
      window.dispatchEvent(new window.Event("scroll"));
      await new Promise((resoudre) => window.requestAnimationFrame(resoudre));
    });
    expect(mesures).toBe(1);
    expect(sonde.progression()).toBe(0);

    // Un défilement encore en attente au démontage n'est jamais mesuré.
    window.dispatchEvent(new window.Event("scroll"));
    await act(async () => sonde.racine.unmount());
    await new Promise((resoudre) => window.requestAnimationFrame(resoudre));
    expect(mesures).toBe(1);
  });
});

