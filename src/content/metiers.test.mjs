import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blogPosts } from "./blog.ts";
import {
  ARTICLES_MAX,
  CHEMIN_HUB_METIERS,
  articlesDe,
  entreesMetier,
  motifsDeRefus,
  pageMetier,
  pagesHub,
  pagesMetier,
  ressemblance,
  textesCourants,
  visuelMetier,
  voisinsDe,
} from "./metiers.ts";
import { pagesSecteur } from "./pages-secteur.ts";
import { pagesTheme } from "./pages-theme.ts";
import { contentRoutes } from "./routes.ts";
import { siteConfig } from "./site.ts";

/**
 * LES PAGES PAR MÉTIER, et ce que l'œil ne vérifie pas. Ce test est le garde du
 * circuit de publication : `bun run test` rouge, rien n'est poussé
 * (`scripts/publication.ts`). Une entrée de `metiers.json` qui ne serait pas
 * propre à son métier ne disparaît pas en silence : elle arrête la publication
 * et son motif s'affiche sur la carte du cockpit.
 */
describe("une page n'est publiée que si elle est propre à son métier", () => {
  for (const page of entreesMetier) {
    test(`${page.slug} n'a aucun motif de refus`, () => {
      expect(motifsDeRefus(page, entreesMetier)).toEqual([]);
    });
  }

  test("toutes les entrées du fichier sont publiées", () => {
    expect(pagesMetier.map((p) => p.slug)).toEqual(entreesMetier.map((p) => p.slug));
  });

  const base = entreesMetier[0];

  test("une page à moins de quatre blocs est refusée", () => {
    const motifs = motifsDeRefus({ ...base, blocs: base.blocs.slice(0, 2) }, entreesMetier);
    expect(motifs.join()).toContain("moins de 4 blocs");
  });

  test("une page au même enchaînement qu'une autre est refusée", () => {
    const copie = { ...entreesMetier[1], slug: "autre", blocs: base.blocs };
    expect(motifsDeRefus(copie, entreesMetier).join()).toContain("même enchaînement");
  });

  test("une page tirée d'une autre à quelques mots près est refusée", () => {
    const copie = { ...base, slug: "plombier", blocs: base.blocs };
    expect(ressemblance(copie, base)).toBe(1);
    expect(motifsDeRefus(copie, entreesMetier).join()).toContain("trop proche");
  });

  test("un mot du métier absent du texte est refusé", () => {
    const copie = { ...base, lexique: [...base.lexique, "hydrocureuse"] };
    expect(motifsDeRefus(copie, entreesMetier).join()).toContain("hydrocureuse");
  });

  test("une entrée malformée est écartée par le refus, jamais servie vide", () => {
    expect(motifsDeRefus({ ...base, lexique: [] }, entreesMetier).length).toBeGreaterThan(0);
  });
});

describe("chaque page est cherchable et honnête", () => {
  for (const page of pagesMetier) {
    describe(page.slug, () => {
      test("le titre tient en 60 caractères et porte la marque", () => {
        expect(page.seo.titre.length).toBeLessThanOrEqual(60);
        expect(page.seo.titre).toContain(siteConfig.contact.person.name);
      });

      test("la description fait 150 à 160 caractères", () => {
        expect(page.seo.description.length).toBeGreaterThanOrEqual(150);
        expect(page.seo.description.length).toBeLessThanOrEqual(160);
      });

      test("la page, son visuel et son image de partage existent", () => {
        expect(contentRoutes.some((r) => r.pathname === page.chemin && r.kind === "metier")).toBe(true);
        const { heros, partage } = visuelMetier(page.slug);
        expect(existsSync(join("public", heros))).toBe(true);
        expect(existsSync(join("public", partage))).toBe(true);
      });

      test("aucun montant, aucun tiret cadratin, aucun tutoiement", () => {
        const brut = JSON.stringify(page);
        expect(brut).not.toMatch(/—/u);
        expect(brut).not.toMatch(/\d\s?€/u);
        expect(brut).not.toMatch(/(?<!\p{L})(tu|toi|ta|tes)(?!\p{L})/u);
      });

      test("aucun client, aucune réalisation présentée comme livrée", () => {
        expect(textesCourants(page).join(" ")).not.toMatch(/mes clients|mon client|j’ai livré|déjà livré/iu);
      });

      test("aucune application mobile promise", () => {
        expect(JSON.stringify(page)).not.toMatch(/App Store|Play Store|application mobile/iu);
      });

      test("ne reprend aucun paragraphe des pages thématiques et secteur", () => {
        const autres = new Set(
          [...pagesSecteur, ...pagesTheme].flatMap((p) => [p.resume, ...p.faq.items.map((i) => i.answer)]),
        );
        for (const phrase of textesCourants(page)) expect(autres.has(phrase)).toBe(false);
      });
    });
  }
});

describe("le maillage se génère depuis les données", () => {
  test("le hub est au sitemap et liste chaque page publiée et chaque page secteur", () => {
    expect(contentRoutes.some((r) => r.pathname === CHEMIN_HUB_METIERS)).toBe(true);
    const chemins = pagesHub.map((p) => p.chemin);
    for (const page of [...pagesMetier, ...pagesSecteur]) expect(chemins).toContain(page.chemin);
    expect(new Set(chemins).size).toBe(chemins.length);
  });

  for (const page of pagesMetier) {
    test(`${page.slug} lie 2 ou 3 métiers voisins, jamais elle-même`, () => {
      const voisins = voisinsDe(page);
      expect(voisins.length).toBeGreaterThanOrEqual(2);
      expect(voisins.length).toBeLessThanOrEqual(3);
      expect(voisins.map((v) => v.chemin)).not.toContain(page.chemin);
    });

    test(`${page.slug} lie des articles publiés`, () => {
      const articles = articlesDe(page);
      expect(articles.length).toBeGreaterThan(0);
      expect(articles.length).toBeLessThanOrEqual(ARTICLES_MAX);
      for (const article of articles) expect(blogPosts).toContain(article);
    });
  }

  test("une page inconnue n'existe pas", () => {
    expect(pageMetier("plombier")).toBeUndefined();
  });

  test("le menu mène au hub", () => {
    expect(siteConfig.nav.map((l) => l.href)).toContain(CHEMIN_HUB_METIERS);
  });

  test("le prix n'est écrit nulle part dans le fichier de données", () => {
    expect(readFileSync(join("src", "content", "metiers.json"), "utf8")).not.toMatch(/\d\s?€/u);
  });
});
