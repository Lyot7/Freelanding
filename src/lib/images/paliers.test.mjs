import { describe, expect, test } from "bun:test";
import { PALIERS, attenteAvantPalier, paliersPour } from "./paliers.ts";

describe("paliersPour", () => {
  test("image large : les trois paliers, du plus pixelisé au plus fin", () => {
    expect(paliersPour(1600)).toEqual([...PALIERS]);
  });

  test("écarte un palier qui ne serait pas au moins deux fois plus petit que l'image", () => {
    expect(paliersPour(700)).toEqual([32, 96]);
    expect(paliersPour(768)).toEqual([32, 96, 384]);
  });

  test("vignette : aucun palier, l'image finale arrive aussi vite qu'eux", () => {
    expect(paliersPour(50)).toEqual([]);
  });

  test("largeur inconnue, nulle ou invalide : aucun palier", () => {
    expect(paliersPour(0)).toEqual([]);
    expect(paliersPour(Number.NaN)).toEqual([]);
    expect(paliersPour(-10)).toEqual([]);
  });
});

describe("attenteAvantPalier", () => {
  test("palier chargé trop tôt : attend le reste de la durée minimale", () => {
    expect(attenteAvantPalier(30, 110)).toBe(80);
  });

  test("palier chargé après la durée minimale : s'affiche aussitôt", () => {
    expect(attenteAvantPalier(500, 110)).toBe(0);
    expect(attenteAvantPalier(110, 110)).toBe(0);
  });
});
