import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { blogPosts } from "./blog.ts";
import {
  ANCRE_BESOINS,
  versPageTheme,
  ARTICLES_MAX,
  CHEMIN_HUB_METIERS,
  articlesDe,
  entreesMetier,
  lirePage,
  motifsDeRefus,
  pageDuCorps,
  pageMetier,
  pagesBesoin,
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

  test("un paragraphe repris d'une autre page est refusé", () => {
    const phrase = entreesMetier[1].resume;
    const copie = { ...base, resume: phrase };
    expect(motifsDeRefus(copie, entreesMetier).join()).toContain("repris d’une autre page");
  });

  test("une seule nature de bloc est refusée", () => {
    const sections = base.blocs.filter((b) => b.type === "section");
    const copie = { ...base, blocs: [...sections, ...sections] };
    expect(motifsDeRefus(copie, entreesMetier).join()).toContain("une seule nature");
  });

  test("un lexique trop court est refusé", () => {
    const copie = { ...base, lexique: base.lexique.slice(0, 2) };
    expect(motifsDeRefus(copie, entreesMetier).join()).toContain("mots du métier");
  });

  test("une entrée malformée est écartée par le refus, jamais servie vide", () => {
    expect(motifsDeRefus({ ...base, lexique: [] }, entreesMetier).length).toBeGreaterThan(0);
  });
});

describe("le fichier de données se relit avant de servir", () => {
  const page = entreesMetier[0];
  const TABLEAU = page.blocs.find((b) => b.type === "tableau");
  const ETAPES = page.blocs.find((b) => b.type === "etapes");
  const CAS = [
    ["entrée", null],
    ["slug", { ...page, slug: "Pas Un Slug" }],
    ["date", { ...page, date: "hier" }],
    ["h1", { ...page, h1: "" }],
    ["resume", { ...page, resume: 3 }],
    ["seo", { ...page, seo: { titre: "t" } }],
    ["themes", { ...page, themes: ["inconnu"] }],
    ["lexique", { ...page, lexique: [] }],
    ["image", { ...page, image: {} }],
    ["titreOffre", { ...page, titreOffre: "" }],
    ["blocs", { ...page, blocs: [{ ...page.blocs[0], type: "inconnu" }] }],
    ["blocs", { ...page, blocs: [{ id: "a" }] }],
    ["blocs", { ...page, blocs: [{ ...page.blocs[0], paragraphes: [] }] }],
    ["blocs", { ...page, blocs: [{ ...page.blocs[0], liens: { titre: "t", items: [] } }] }],
    ["blocs", { ...page, blocs: [{ ...page.blocs[0], liens: "pas un objet" }] }],
    ["blocs", { ...page, blocs: [{ ...TABLEAU, total: "pas une liste" }] }],
    ["blocs", { ...page, blocs: [{ ...TABLEAU, note: { texte: "un objet" } }] }],
    ["blocs", { ...page, blocs: [{ ...ETAPES, etapes: [{ ...ETAPES.etapes[0], passe: 3 }] }] }],
    ["validationId", { ...page, validationId: 3 }],
    ["faq", { ...page, faq: null }],
    ["faq", { ...page, faq: { ...page.faq, items: [] } }],
  ];

  for (const [champ, entree] of CAS) {
    test(`une entrée au champ ${champ} invalide casse le build en le nommant`, () => {
      expect(() => lirePage(entree, 7)).toThrow(`metiers.json, entrée 7 : ${champ} invalide`);
    });
  }

  test("une entrée valide revient telle quelle, pour chaque nature de bloc", () => {
    for (const entree of entreesMetier) expect(lirePage(entree, 0)).toBe(entree);
  });

  test("les champs optionnels bien formés passent", () => {
    const liens = { titre: "Voir", items: [{ href: "/a", libelle: "A", description: "Le lien A" }] };
    const entree = {
      ...page,
      validationId: "une-validation",
      blocs: [
        { ...TABLEAU, liens, total: ["Total"], note: "Une note" },
        { ...ETAPES, etapes: [{ ...ETAPES.etapes[0], passe: "La suite" }] },
      ],
    };
    expect(lirePage(entree, 0)).toBe(entree);
  });
});

describe("le corps d'une validation du cockpit", () => {
  const sansDate = { ...entreesMetier[0], date: undefined };
  const corps = JSON.stringify(sansDate);

  test("se relit et prend la date du jour", () => {
    const page = pageDuCorps(corps, sansDate.slug, "2026-11-02", 3);
    expect(page.date).toBe("2026-11-02");
    expect(page.h1).toBe(sansDate.h1);
  });

  test("n'impose ni sa date, ni sa validation, ni un champ inconnu", () => {
    const brut = JSON.stringify({ ...sansDate, date: "1999-01-01", validationId: "x", reassurance: { a: 1 } });
    const page = pageDuCorps(brut, sansDate.slug, "2026-11-02", 3);
    expect(page.date).toBe("2026-11-02");
    expect(page).not.toHaveProperty("validationId");
    expect(page).not.toHaveProperty("reassurance");
  });

  test("illisible, il le dit", () => {
    expect(() => pageDuCorps("<mdx/>", "a", "2026-11-02", 3)).toThrow("n’est pas un JSON lisible");
  });

  test("autre chose qu'un objet est refusé par la relecture", () => {
    expect(() => pageDuCorps("[1]", "a", "2026-11-02", 3)).toThrow("metiers.json, entrée 3 : entrée invalide");
  });

  test("un champ manquant se nomme", () => {
    const brut = JSON.stringify({ ...sansDate, faq: null });
    expect(() => pageDuCorps(brut, sansDate.slug, "2026-11-02", 3)).toThrow("faq invalide");
  });

  test("le slug doit être celui de la validation", () => {
    expect(() => pageDuCorps(corps, "autre", "2026-11-02", 3)).toThrow("différent de la validation");
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

  test("une page sans thème commun n'a aucun voisin", () => {
    expect(voisinsDe({ chemin: "/x", themes: [] })).toEqual([]);
  });

  test("une page inconnue n'existe pas", () => {
    expect(pageMetier("plombier")).toBeUndefined();
  });

  test("aucun menu ne mène au hub, seul un lien discret du pied de page l'y envoie", () => {
    for (const menu of [siteConfig.nav, siteConfig.menuNav, siteConfig.footerNav]) {
      expect(menu.map((l) => l.href)).not.toContain(CHEMIN_HUB_METIERS);
    }
    expect(siteConfig.legalLinks.map((l) => l.href)).toContain(CHEMIN_HUB_METIERS);
  });

  test("le prix n'est écrit nulle part dans le fichier de données", () => {
    expect(readFileSync(join("src", "content", "metiers.json"), "utf8")).not.toMatch(/\d\s?€/u);
  });
});

describe("une page de fonction garde sa place", () => {
  const entree = entreesMetier[0];

  test("seule la nature « fonction » se relit", () => {
    expect(lirePage({ ...entree, nature: "fonction" }, 0).nature).toBe("fonction");
    expect(() => lirePage({ ...entree, nature: "ville" }, 0)).toThrow("nature invalide");
  });

  test("elle survit au corps d'une validation", () => {
    const corps = JSON.stringify({ ...entree, nature: "fonction" });
    expect(pageDuCorps(corps, entree.slug, entree.date, 0).nature).toBe("fonction");
  });

  test("son fil d'Ariane mène à la liste des besoins, celui d'un métier au hub", () => {
    const page = { ...pagesMetier[0], nature: "fonction" };
    expect(versPageTheme(page).filAriane[1].href).toBe(`${CHEMIN_HUB_METIERS}#${ANCRE_BESOINS}`);
    expect(versPageTheme(pagesMetier[0]).filAriane[1].href).toBe(CHEMIN_HUB_METIERS);
  });
});

describe("une requête, une adresse", () => {
  test("un besoin déjà tenu garde son adresse et reçoit le lien du hub", () => {
    const chemins = pagesBesoin.map((p) => p.chemin);
    expect(new Set(chemins).size).toBe(chemins.length);
    expect(chemins).toContain("/services/logiciel-metier/maintenance-sav");
    expect(chemins).toContain("/blog/logiciel-gestion-de-stock");
  });

  test("aucun lien vers un article qui n'est pas publié", () => {
    for (const { chemin } of pagesBesoin.filter((p) => p.chemin.startsWith("/blog/"))) {
      expect(blogPosts.map((p) => `/blog/${p.slug}`)).toContain(chemin);
    }
  });

  test("aucune page n'est à la fois métier et besoin", () => {
    const metiers = pagesHub.map((p) => p.chemin);
    for (const { chemin } of pagesBesoin) expect(metiers).not.toContain(chemin);
  });
});
