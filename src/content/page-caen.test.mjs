import { describe, expect, test } from "bun:test";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CHEMIN_PAGE_CAEN, pageCaen } from "./page-caen.ts";
import { contentRoutes } from "./routes.ts";
import { siteConfig } from "./site.ts";

/**
 * LA PAGE LOCALE DE CAEN, et ce que l'œil ne vérifie pas.
 *
 * La longueur du titre et de la description décide de ce qu'un résultat de
 * recherche affiche ; la présence au sitemap décide de sa découverte ; et la
 * promesse d'un rendez-vous sur place, que l'ancienne page portait, ne doit
 * pas revenir : tous les rendez-vous se font en visio.
 */

/** Toutes les chaînes affichées ou déclarées par la page, à plat. */
function textes() {
  const { contexte, faq } = pageCaen;
  return [
    pageCaen.seo.titre,
    pageCaen.seo.description,
    pageCaen.h1,
    pageCaen.resume,
    contexte.titre,
    contexte.intro,
    ...contexte.liens.flatMap((l) => [l.libelle, l.description]),
    ...contexte.points.flatMap((p) => [p.titre, p.corps]),
    ...faq.titleLines,
    ...faq.items.flatMap((i) => [i.question, i.answer]),
    pageCaen.heroImage?.alt ?? "",
  ];
}

/** Chemin disque d'un fichier servi depuis `public/`. */
function fichierPublic(src) {
  return fileURLToPath(new URL(`../../public${src}`, import.meta.url));
}

describe("la page de Caen est cherchable", () => {
  test("le titre tient en 60 caractères, porte la requête et la marque", () => {
    const { titre } = pageCaen.seo;
    expect(titre.length).toBeLessThanOrEqual(60);
    expect(titre).toContain("Création de site internet à Caen");
    expect(titre).toContain(siteConfig.contact.person.name);
  });

  test("la description fait 150 à 160 caractères", () => {
    const { length } = pageCaen.seo.description;
    expect(length).toBeGreaterThanOrEqual(150);
    expect(length).toBeLessThanOrEqual(160);
  });

  test("la page est annoncée au sitemap, à l'adresse de l'ancien site", () => {
    expect(CHEMIN_PAGE_CAEN).toBe("/creation-site-internet-caen");
    expect(contentRoutes.map((r) => r.pathname)).toContain(CHEMIN_PAGE_CAEN);
  });

  test("ses liens internes visent des pages servies", () => {
    const chemins = contentRoutes.map((r) => r.pathname);
    for (const lien of pageCaen.contexte.liens) {
      expect(chemins, `${lien.href} n'est pas au sitemap`).toContain(lien.href);
    }
  });
});

describe("la page de Caen ne promet que ce qui est vrai", () => {
  test("aucune promesse de rendez-vous sur place ni de déplacement", () => {
    const interdit = /sur place|en personne|présentiel|déplac|autour d.un café|chez toi, devant/iu;
    for (const texte of textes()) {
      expect(interdit.test(texte), `promesse de présentiel : ${texte}`).toBe(false);
    }
  });

  test("aucun tiret cadratin ni demi-cadratin", () => {
    for (const texte of textes()) {
      expect(/[\u2013\u2014]/u.test(texte), `tiret long : ${texte}`).toBe(false);
    }
  });

  test("aucun montant en euros n'est écrit à la main dans page-caen.ts", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./page-caen.ts", import.meta.url)),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    expect(source.match(/\d[\d   ]*€/gu) ?? []).toEqual([]);
  });
});

describe("la photo du héros de Caen", () => {
  const image = pageCaen.heroImage;

  test("existe sur le disque et reste légère", () => {
    expect(image).toBeDefined();
    // Source de l'optimiseur de Next, pas le fichier servi : au-delà, c'est
    // un JPEG réencodé trop haut ou une image trop grande.
    expect(statSync(fichierPublic(image.src)).size).toBeLessThanOrEqual(420_000);
    expect(image.alt.length).toBeGreaterThan(20);
  });

  test("porte le crédit exigé par CC BY-SA 4.0", () => {
    const { credit } = image;
    expect(credit.auteur.libelle).toBe("Florian Pépellin");
    expect(credit.auteur.href).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(credit.licence.libelle).toBe("CC BY-SA 4.0");
    expect(credit.licence.href).toBe("https://creativecommons.org/licenses/by-sa/4.0/deed.fr");
    // La licence exige de dire que l'image a été modifiée.
    expect(credit.modification).toBeTruthy();
  });

  test("fournit une vignette de partage 1200 × 630 présente sur le disque", () => {
    expect(image.og.width).toBe(1200);
    expect(image.og.height).toBe(630);
    expect(statSync(fichierPublic(image.og.src)).size).toBeGreaterThan(0);
  });
});
