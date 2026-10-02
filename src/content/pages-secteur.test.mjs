import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { euros, fourchette, prestation, prixPack } from "./offre.ts";
import { cheminSecteur, pagesSecteur } from "./pages-secteur.ts";
import { contentRoutes } from "./routes.ts";
import { lienLocalParPrestation } from "./service-pages.ts";
import { siteConfig } from "./site.ts";

/**
 * LES PAGES SECTEUR DE LA SOLUTION MÉTIER, et ce que l'œil ne vérifie pas.
 *
 * La longueur du titre et de la description décide de ce qu'un résultat de
 * recherche affiche ; la présence au sitemap décide de leur découverte ; et
 * l'unicité entre secteurs les tient hors des pages produites en série, que
 * Google sanctionne. Les prix viennent de `offre.ts`, jamais d'une saisie.
 */

const LOGICIEL = prestation("logiciel");

/** Toutes les chaînes affichées ou déclarées par une page, à plat. */
function textes(page) {
  return [
    page.seo.titre,
    page.seo.description,
    page.h1,
    page.resume,
    page.titrePacks,
    ...page.sections.flatMap((s) => [
      s.titre,
      ...s.paragraphes,
      ...(s.liens ? [s.liens.titre, ...s.liens.items.flatMap((l) => [l.libelle, l.description])] : []),
      ...s.points.flatMap((p) => [p.titre, p.corps]),
    ]),
    ...page.faq.titleLines,
    ...page.faq.items.flatMap((i) => [i.question, i.answer]),
  ];
}

/** Les blocs de texte courant d'une page : paragraphes, points, réponses. */
function blocs(page) {
  return [
    page.resume,
    ...page.sections.flatMap((s) => [...s.paragraphes, ...s.points.map((p) => p.corps)]),
    ...page.faq.items.map((i) => i.answer),
  ];
}

const mots = (texte) => texte.split(/\s+/u).filter((m) => /[\p{L}\d]/u.test(m)).length;

describe("chaque page secteur est cherchable", () => {
  for (const page of pagesSecteur) {
    describe(page.slug, () => {
      test("le titre tient en 60 caractères et porte la marque", () => {
        expect(page.seo.titre.length).toBeLessThanOrEqual(60);
        expect(page.seo.titre).toContain(siteConfig.contact.person.name);
        expect(page.seo.titre.startsWith("Logiciel de gestion")).toBe(true);
      });

      test("la description fait 150 à 160 caractères, au vouvoiement", () => {
        const { description } = page.seo;
        expect(description.length).toBeGreaterThanOrEqual(150);
        expect(description.length).toBeLessThanOrEqual(160);
        expect(/\b(tu|ton|ta|tes|toi)\b/iu.test(description)).toBe(false);
      });

      test("le H1 porte la requête", () => {
        expect(page.h1.toLowerCase()).toContain("logiciel de gestion");
      });

      test("la page est annoncée au sitemap, sous la solution métier", () => {
        expect(page.chemin).toBe(cheminSecteur(page.slug));
        expect(page.chemin.startsWith(`/services/${LOGICIEL.slug}/`)).toBe(true);
        expect(contentRoutes.map((r) => r.pathname)).toContain(page.chemin);
      });

      test("la page pilier la lie", () => {
        const liens = lienLocalParPrestation.logiciel?.liens ?? [];
        expect(liens.map((l) => l.href)).toContain(page.chemin);
      });

      test("ses liens internes visent des pages servies ou le rendez-vous", () => {
        const chemins = contentRoutes.map((r) => r.pathname);
        const hrefs = page.sections.flatMap((s) => s.liens?.items.map((l) => l.href) ?? []);
        for (const href of hrefs) {
          if (href.startsWith("#")) {
            expect(href).toBe("#rendez-vous");
            continue;
          }
          expect(chemins, `${href} n'est pas au sitemap`).toContain(href);
        }
        // Les 4 liens du plan : pilier, cas Würth, article, rendez-vous.
        for (const attendu of [
          `/services/${LOGICIEL.slug}`,
          "/realisations/wurth-creation-de-compte",
          "/blog/outil-sur-mesure-ou-abonnements-saas",
          "#rendez-vous",
        ]) {
          expect(hrefs).toContain(attendu);
        }
      });

      test("la FAQ compte 5 à 7 questions", () => {
        expect(page.faq.items.length).toBeGreaterThanOrEqual(5);
        expect(page.faq.items.length).toBeLessThanOrEqual(7);
      });

      test("le contenu principal fait 1 000 à 1 400 mots", () => {
        const total = mots(textes(page).slice(2).join(" "));
        expect(total).toBeGreaterThanOrEqual(1000);
        expect(total).toBeLessThanOrEqual(1400);
      });
    });
  }
});

describe("le sitemap et les pages secteur disent la même chose", () => {
  test("une route par page secteur, et aucune autre", () => {
    const routes = contentRoutes
      .filter((r) => r.kind === "secteur")
      .map((r) => r.pathname)
      .sort();
    expect(routes).toEqual(pagesSecteur.map((p) => p.chemin).sort());
  });
});

describe("les pages secteur ne promettent que ce qui est vrai", () => {
  test("aucune promesse de rendez-vous sur place ni de déplacement", () => {
    const interdit = /sur place|en personne|présentiel|déplac|autour d.un café|chez toi, devant/iu;
    for (const page of pagesSecteur) {
      for (const texte of textes(page)) {
        expect(interdit.test(texte), `promesse de présentiel : ${texte}`).toBe(false);
      }
    }
  });

  test("aucun tiret cadratin ni demi-cadratin", () => {
    for (const page of pagesSecteur) {
      for (const texte of textes(page)) {
        expect(/[–—]/u.test(texte), `tiret long : ${texte}`).toBe(false);
      }
    }
  });

  test("la réponse directe en tête donne le prix lu dans offre.ts", () => {
    for (const page of pagesSecteur) {
      expect(page.resume).toContain(fourchette("logiciel", " HT"));
    }
  });

  test("les 3 forfaits sont cités avec leur prix lu dans offre.ts", () => {
    for (const page of pagesSecteur) {
      const tout = textes(page).join("\n");
      for (const pack of LOGICIEL.packs) {
        expect(tout).toContain(prixPack(pack));
      }
    }
  });

  test("aucun montant en euros n'est écrit à la main dans pages-secteur.ts", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./pages-secteur.ts", import.meta.url)),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    expect(source.match(/\d[\d   ]*€/gu) ?? []).toEqual([]);
  });

  test("le calcul annoncé est le produit de ses hypothèses, affichées comme telles", () => {
    for (const page of pagesSecteur) {
      const { heuresParAn, coutHoraire, coutAnnuel } = page.calcul;
      expect(coutAnnuel).toBe(heuresParAn * coutHoraire);
      const section = page.sections.find((s) => s.id === "calcul");
      expect(section).toBeDefined();
      const corps = section.paragraphes.join(" ");
      expect(corps).toContain(`${heuresParAn} heures`);
      expect(corps).toContain(euros(coutAnnuel));
      expect(corps).toContain("hypothèses");
      expect(section.points.every((p) => p.titre.startsWith("Hypothèse"))).toBe(true);
    }
  });

  test("le cas Würth est présenté comme un autre secteur", () => {
    for (const page of pagesSecteur) {
      const tout = textes(page).join("\n");
      expect(tout).toContain("Würth");
      expect(tout).toContain("distribution");
    }
  });
});

describe("les secteurs ne se recopient pas", () => {
  test("aucun bloc de texte n'est partagé entre 2 secteurs", () => {
    const vus = new Map();
    for (const page of pagesSecteur) {
      for (const bloc of blocs(page)) {
        const autre = vus.get(bloc);
        expect(autre === undefined || autre === page.slug, `bloc partagé : ${bloc}`).toBe(true);
        vus.set(bloc, page.slug);
      }
    }
  });

  test("titres, H1, descriptions, questions et calculs diffèrent", () => {
    const champs = [
      (p) => p.seo.titre,
      (p) => p.seo.description,
      (p) => p.h1,
      (p) => p.titrePacks,
      (p) => p.calcul.coutAnnuel,
    ];
    for (const champ of champs) {
      const valeurs = pagesSecteur.map(champ);
      expect(new Set(valeurs).size).toBe(valeurs.length);
    }
    const questions = pagesSecteur.flatMap((p) => p.faq.items.map((i) => i.question));
    expect(new Set(questions).size).toBe(questions.length);
  });
});
