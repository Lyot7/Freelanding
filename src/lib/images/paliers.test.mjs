import { describe, expect, test } from "bun:test";
import { COLONNES, etapesAJouer, tailleMiniature } from "./paliers.ts";

describe("etapesAJouer", () => {
  test("image déjà chargée : toutes les étapes, de la plus grossière à la plus fine", () => {
    expect(etapesAJouer(null)).toEqual([...COLONNES]);
  });

  test("après l'attente en 32 colonnes : on repart au-dessus, jamais en arrière", () => {
    expect(etapesAJouer(32)).toEqual([48, 96, 128]);
  });

  test("attente plus fine que toutes les étapes : rien à jouer", () => {
    expect(etapesAJouer(256)).toEqual([]);
  });
});

describe("tailleMiniature", () => {
  test("garde le rapport de l'image", () => {
    expect(tailleMiniature(16, 1600, 900)).toEqual({ largeur: 16, hauteur: 9 });
  });

  test("jamais sous un pixel de haut", () => {
    expect(tailleMiniature(8, 4000, 100)).toEqual({ largeur: 8, hauteur: 1 });
  });

  test("dimensions inconnues : carré", () => {
    expect(tailleMiniature(8, 0, 0)).toEqual({ largeur: 8, hauteur: 8 });
  });
});
