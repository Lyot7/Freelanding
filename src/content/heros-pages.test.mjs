import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { blogPosts } from "./blog.ts";
import { herosPages } from "./heros-pages.ts";
import { legalDocuments } from "./legal.ts";
import { prestations } from "./offre.ts";
import { pageCaen } from "./page-caen.ts";

/**
 * AUCUNE PAGE SANS PHOTO EN HÉROS.
 *
 * Une prestation ou un document légal ajouté sans sa photo s'afficherait sur
 * un héros vide : ce test casse avant. Il vérifie aussi que chaque fichier
 * existe, qu'aucune photo ne sert deux fois et qu'aucune ne reprend l'image
 * d'une réalisation client (`/work/`).
 */
const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

const tous = [
  herosPages.blog,
  herosPages.realisations,
  herosPages.introuvable,
  ...Object.values(herosPages.prestations),
  ...Object.values(herosPages.legal),
  pageCaen.heroImage,
  ...blogPosts.map((p) => p.heroImage),
];

describe("héros des pages", () => {
  test("chaque prestation a sa photo", () => {
    for (const p of prestations) expect(herosPages.prestations[p.slug]).toBeDefined();
  });

  test("chaque document légal a sa photo", () => {
    for (const d of legalDocuments) expect(herosPages.legal[d.slug]).toBeDefined();
  });

  test("chaque article a sa photo", () => {
    for (const p of blogPosts) expect(p.heroImage).toBeDefined();
  });

  test("les fichiers existent", () => {
    for (const h of tous) {
      expect(existsSync(publicDir + h.src)).toBe(true);
      expect(existsSync(publicDir + h.og.src)).toBe(true);
    }
  });

  test("aucune photo ne sert deux fois, aucune ne vient d'une réalisation", () => {
    const srcs = tous.map((h) => h.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const s of srcs) expect(s.startsWith("/work/")).toBe(false);
  });
});
