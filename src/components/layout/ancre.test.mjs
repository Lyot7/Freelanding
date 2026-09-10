import { afterEach, describe, expect, test } from "bun:test";
import { idDepuisHash, maintenirAncre, PLAFOND_ANCRE_MS } from "./ancre";

describe("idDepuisHash", () => {
  test("retire le dièse", () => {
    expect(idDepuisHash("#rendez-vous")).toBe("rendez-vous");
  });

  test("rend null sans ancre", () => {
    expect(idDepuisHash("")).toBeNull();
    expect(idDepuisHash("#")).toBeNull();
  });

  test("décode un identifiant encodé", () => {
    expect(idDepuisHash("#caf%C3%A9")).toBe("café");
  });

  test("garde tel quel un encodage invalide", () => {
    expect(idDepuisHash("#%E0%A4%A")).toBe("%E0%A4%A");
  });
});

/**
 * Faux DOM minimal : le test n'a besoin que de ce que `maintenirAncre` touche,
 * c'est-à-dire la cible, l'observateur de taille, les écouteurs et le minuteur.
 */
function fauxDom({ avecCible = true } = {}) {
  const etat = {
    alignements: 0,
    observateurs: [],
    ecouteurs: new Map(),
    minuteurs: new Map(),
  };
  const cible = {
    scrollIntoView(options) {
      expect(options).toEqual({ block: "start" });
      etat.alignements += 1;
    },
  };
  globalThis.document = {
    body: {},
    getElementById: (id) => (avecCible && id === "rendez-vous" ? cible : null),
  };
  globalThis.ResizeObserver = class {
    constructor(rappel) {
      this.rappel = rappel;
      this.connecte = false;
      etat.observateurs.push(this);
    }
    observe() {
      this.connecte = true;
      this.rappel();
    }
    disconnect() {
      this.connecte = false;
    }
  };
  let prochainMinuteur = 1;
  globalThis.window = {
    addEventListener: (type, rappel) => etat.ecouteurs.set(type, rappel),
    removeEventListener: (type) => etat.ecouteurs.delete(type),
    setTimeout: (rappel, delai) => {
      const id = prochainMinuteur++;
      etat.minuteurs.set(id, { rappel, delai });
      return id;
    },
    clearTimeout: (id) => etat.minuteurs.delete(id),
  };
  const redimensionner = () => {
    for (const o of etat.observateurs) if (o.connecte) o.rappel();
  };
  return { etat, redimensionner };
}

describe("maintenirAncre", () => {
  const origine = {
    document: globalThis.document,
    window: globalThis.window,
    ResizeObserver: globalThis.ResizeObserver,
  };
  afterEach(() => Object.assign(globalThis, origine));

  test("aligne la cible tout de suite puis à chaque changement de taille", () => {
    const { etat, redimensionner } = fauxDom();
    maintenirAncre("#rendez-vous");
    expect(etat.alignements).toBe(1);
    redimensionner();
    redimensionner();
    expect(etat.alignements).toBe(3);
  });

  test("rend la main au premier geste du visiteur", () => {
    const { etat, redimensionner } = fauxDom();
    maintenirAncre("#rendez-vous");
    expect([...etat.ecouteurs.keys()].sort()).toEqual(
      ["keydown", "pointerdown", "touchstart", "wheel"],
    );
    etat.ecouteurs.get("wheel")();
    redimensionner();
    expect(etat.alignements).toBe(1);
    expect(etat.ecouteurs.size).toBe(0);
    expect(etat.minuteurs.size).toBe(0);
  });

  test("s'arrête seul au plafond", () => {
    const { etat, redimensionner } = fauxDom();
    maintenirAncre("#rendez-vous");
    const [minuteur] = etat.minuteurs.values();
    expect(minuteur.delai).toBe(PLAFOND_ANCRE_MS);
    minuteur.rappel();
    redimensionner();
    expect(etat.alignements).toBe(1);
    expect(etat.ecouteurs.size).toBe(0);
  });

  test("rend une fonction d'arrêt", () => {
    const { etat, redimensionner } = fauxDom();
    const arreter = maintenirAncre("#rendez-vous");
    arreter();
    redimensionner();
    expect(etat.alignements).toBe(1);
  });

  test("ne fait rien sans ancre ni cible", () => {
    const { etat } = fauxDom({ avecCible: false });
    maintenirAncre("");
    maintenirAncre("#absente");
    expect(etat.alignements).toBe(0);
    expect(etat.observateurs).toHaveLength(0);
    expect(etat.ecouteurs.size).toBe(0);
  });
});
