import { describe, expect, test } from "bun:test";
import { recadrageCover } from "./recadrage.ts";

describe("recadrageCover", () => {
  test("vidéo paysage dans une toile portrait : rogne les côtés, garde toute la hauteur", () => {
    expect(recadrageCover(1920, 1080, 750, 1420)).toEqual({
      x: (1920 - 750 / (1420 / 1080)) / 2,
      y: 0,
      l: 750 / (1420 / 1080),
      h: 1080,
    });
  });

  test("même rapport : toute l'image", () => {
    expect(recadrageCover(1600, 900, 800, 450)).toEqual({ x: 0, y: 0, l: 1600, h: 900 });
  });

  test("dimensions pas encore connues : rien à dessiner", () => {
    expect(recadrageCover(0, 0, 375, 710)).toBeNull();
    expect(recadrageCover(1920, 1080, 0, 710)).toBeNull();
  });
});
