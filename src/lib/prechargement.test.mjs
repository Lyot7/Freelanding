import { describe, expect, test } from "bun:test";
import { reseauEconome, routesAPrecharger } from "./prechargement.ts";

describe("routesAPrecharger", () => {
  test("garde les pages internes, sans doublon ni ancre", () => {
    expect(
      routesAPrecharger(["/blog", "/blog#haut", "/contact", "/blog"], "/"),
    ).toEqual(["/blog", "/contact"]);
  });

  test("écarte la page courante, même avec une ancre", () => {
    expect(routesAPrecharger(["/", "/#tarifs", "/contact"], "/")).toEqual([
      "/contact",
    ]);
  });

  test("écarte l'externe, le protocole relatif, les ancres seules et les liens vides", () => {
    expect(
      routesAPrecharger(
        ["https://x.fr/", "//x.fr/a", "#faq", "mailto:a@b.fr", "", null],
        "/",
      ),
    ).toEqual([]);
  });

  test("écarte les routes techniques et les fichiers", () => {
    expect(
      routesAPrecharger(
        ["/api/contact", "/r/abc", "/ingest/e", "/cv.pdf", "/images/a.jpg", "/a-propos"],
        "/",
      ),
    ).toEqual(["/a-propos"]);
  });

  test("garde la requête, qui peut changer le contenu de la page", () => {
    expect(routesAPrecharger(["/blog?tag=seo"], "/")).toEqual(["/blog?tag=seo"]);
  });
});

describe("reseauEconome", () => {
  test("API absente : on précharge", () => {
    expect(reseauEconome(undefined)).toBe(false);
    expect(reseauEconome({})).toBe(false);
  });

  test("économie de données ou réseau lent : rien d'avance", () => {
    expect(reseauEconome({ saveData: true, effectiveType: "4g" })).toBe(true);
    expect(reseauEconome({ effectiveType: "3g" })).toBe(true);
    expect(reseauEconome({ effectiveType: "slow-2g" })).toBe(true);
  });

  test("4G : on précharge", () => {
    expect(reseauEconome({ effectiveType: "4g", saveData: false })).toBe(false);
  });
});
