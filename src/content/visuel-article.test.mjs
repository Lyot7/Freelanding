import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { refusVisuel } from "../../scripts/visuel-article.mjs";

/**
 * Le visuel conçu par le rédacteur part du cockpit, qui l'a contrôlé. Le site
 * redit l'essentiel avant de le rendre : sharp ne charge rien d'extérieur.
 */
const svg = (corps) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1350"><path d="M0 0L2400 1350" stroke="#c8f24a" stroke-width="40"/>${corps}</svg>`;

describe("visuel d'un article du cockpit", () => {
  test("accepte un SVG de traits et de renvois internes", () => {
    expect(refusVisuel(svg('<use href="#a"/><circle fill="url(#b)"/>'))).toBeNull();
  });

  test.each([
    ['<image href="https://exemple.fr/a.png"/>'],
    ['<script>alert(1)</script>'],
    ['<text>Prix</text>'],
    ['<use href="https://exemple.fr/a.svg#x"/>'],
    ['<circle fill="url(file:///etc/passwd)"/>'],
    ['<circle onload="alert(1)"/>'],
  ])("refuse %s", (corps) => {
    expect(refusVisuel(svg(corps))).not.toBeNull();
  });

  test("exige le cadre du héros", () => {
    expect(refusVisuel(svg("").replace("0 0 2400 1350", "0 0 1200 630"))).toContain("viewBox");
  });

  test("rend héros, vignette et partage aux tailles du site", async () => {
    const { rendreVisuel } = await import("../../scripts/visuel-article.mjs");
    const racine = mkdtempSync(join(tmpdir(), "visuel-"));
    for (const d of ["public/images/heros", "public/images/blog"]) {
      await Bun.write(join(racine, d, ".garde"), "");
    }
    const chemins = await rendreVisuel("essai", svg(""), racine);
    const tailles = await Promise.all(chemins.map(async (c) => {
      const { width, height } = await sharp(c).metadata();
      return [width, height];
    }));
    expect(tailles).toEqual([[2400, 1350], [1200, 1114], [1200, 630]]);
  });
});
