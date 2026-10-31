import { describe, expect, test } from "bun:test";
import { calculAutomatisation } from "./page-automatisation.ts";
import { calculGmao } from "./page-gmao.ts";
import { euros, prestation, repereAgenceLogiciel } from "./offre.ts";
import { pageErp } from "./page-erp.ts";
import { pagesSecteur } from "./pages-secteur.ts";
import { pagesTheme } from "./pages-theme.ts";
import { contentRoutes } from "./routes.ts";
import { siteConfig } from "./site.ts";

/**
 * LES PAGES THÉMATIQUES, et ce que l'œil ne vérifie pas : longueur du titre et
 * de la description, présence au sitemap, absence du pied de page, et surtout
 * l'unicité. Google laisse hors de l'index les pages secteur qui se
 * ressemblent : aucun paragraphe ne se retrouve sur deux pages.
 */

/** Les blocs de texte courant d'une page thématique. */
function blocsTheme(page) {
  return [
    page.resume,
    ...page.blocs.flatMap((b) => [
      ...b.paragraphes,
      ...(b.type === "section" ? b.points.map((p) => p.corps) : []),
      ...(b.type === "etapes" ? b.etapes.map((e) => e.corps) : []),
      ...(b.type === "tableau" ? b.lignes.flat().filter((c) => c.length > 40) : []),
    ]),
    ...page.faq.items.map((i) => i.answer),
  ];
}

/** Toutes les chaînes affichées par une page, à plat. */
function textes(page) {
  return [
    page.seo.titre,
    page.seo.description,
    page.h1,
    page.titreOffre,
    ...blocsTheme(page),
    ...page.blocs.flatMap((b) => [
      b.titre,
      ...(b.type === "tableau" ? [...b.colonnes, ...b.lignes.flat(), b.note ?? ""] : []),
      ...(b.type === "etapes" ? b.etapes.flatMap((e) => [e.titre, e.passe ?? ""]) : []),
      ...(b.type === "chiffres" ? b.chiffres.flatMap((c) => [c.valeur, c.libelle]) : []),
      ...(b.type === "section" ? b.points.map((p) => p.titre) : []),
    ]),
    ...page.faq.items.map((i) => i.question),
  ];
}

/** Les blocs des pages secteur, pour vérifier qu'aucun n'est repris. */
const blocsSecteur = pagesSecteur.flatMap((p) => [
  p.resume,
  ...p.sections.flatMap((s) => [...s.paragraphes, ...s.points.map((pt) => pt.corps)]),
  ...p.faq.items.map((i) => i.answer),
]);

describe("chaque page thématique est cherchable", () => {
  for (const page of pagesTheme) {
    describe(page.id, () => {
      test("le titre tient en 60 caractères et porte la marque", () => {
        expect(page.seo.titre.length).toBeLessThanOrEqual(60);
        expect(page.seo.titre).toContain(siteConfig.contact.person.name);
      });

      test("la description fait 150 à 160 caractères", () => {
        expect(page.seo.description.length).toBeGreaterThanOrEqual(150);
        expect(page.seo.description.length).toBeLessThanOrEqual(160);
      });

      test("la page est au sitemap", () => {
        expect(contentRoutes.some((r) => r.pathname === page.chemin)).toBe(true);
      });

      test("la page n'est pas listée dans le pied de page", () => {
        expect((siteConfig.contact.localLinks ?? []).some((l) => l.href === page.chemin)).toBe(false);
      });

      test("au moins un bloc qui n'est pas une section en deux moitiés", () => {
        expect(page.blocs.some((b) => b.type !== "section")).toBe(true);
      });

      test("ni tiret cadratin, ni TJM, ni tutoiement", () => {
        for (const texte of textes(page)) {
          expect(texte).not.toMatch(/—/u);
          expect(texte).not.toMatch(/\bTJM\b|taux journalier/iu);
          expect(texte).not.toMatch(/(?<!\p{L})(tu|toi|ta|tes)(?!\p{L})/u);
        }
      });
    });
  }
});

describe("aucune page ne reprend le texte d'une autre", () => {
  test("pas de paragraphe commun entre deux pages thématiques", () => {
    const vus = new Map();
    for (const page of pagesTheme) {
      for (const bloc of blocsTheme(page)) {
        expect(vus.get(bloc) ?? page.id).toBe(page.id);
        vus.set(bloc, page.id);
      }
    }
  });

  test("pas de paragraphe repris d'une page secteur", () => {
    for (const page of pagesTheme) {
      for (const bloc of blocsTheme(page)) {
        expect(blocsSecteur).not.toContain(bloc);
      }
    }
  });

  test("deux pages ne composent pas leurs blocs dans le même ordre", () => {
    const suites = pagesTheme.map((p) => p.blocs.map((b) => b.type).join(","));
    expect(new Set(suites).size).toBe(suites.length);
  });
});

describe("les calculs suivent leurs hypothèses", () => {
  test("GMAO : l'encours est le chiffre mensuel au prorata du délai", () => {
    expect(calculGmao.factureMois).toBe(120 * 280);
    expect(calculGmao.encours).toBe(Math.round((120 * 280 * 15) / 30));
    expect(calculGmao.heuresRessaisieMois).toBe(12);
  });

  test("automatisation : le total est la somme des six tâches", () => {
    expect(calculAutomatisation.minutesSemaine).toBe(150 + 180 + 60 + 90 + 120 + 60);
    expect(calculAutomatisation.coutAn).toBe(calculAutomatisation.heuresAn * 40);
  });
});

describe("accès par identifiant", () => {
  test("une page inconnue lève une erreur au lieu de rendre une page vide", async () => {
    const { pageTheme } = await import("./pages-theme.ts");
    expect(() => pageTheme("inconnue")).toThrow("Page thématique inconnue");
    expect(pageTheme("erp-sur-mesure").chemin).toBe("/services/logiciel-metier/erp-sur-mesure");
  });

  test("les pages retirées le 2026-10-31 (artisans, CTO) ne sont plus des pages thématiques", async () => {
    const { pageTheme } = await import("./pages-theme.ts");
    expect(pagesTheme.map((p) => p.id)).toEqual([
      "erp-sur-mesure",
      "maintenance-sav",
      "automatisation",
      "automatisation-ia-caen",
    ]);
    expect(() => pageTheme("artisans")).toThrow("Page thématique inconnue");
    expect(() => pageTheme("cto-referent-ia")).toThrow("Page thématique inconnue");
    const chemins = pagesTheme.map((p) => p.chemin);
    expect(chemins).not.toContain("/services/site-vitrine/artisans");
    expect(chemins).not.toContain("/services/cto-referent-ia");
  });
});

describe("toutes les pages thématiques présentent l'offre unique", () => {
  test("elles se rattachent au logiciel, sans sujet de rendez-vous à part ni offre mensuelle", () => {
    const logiciel = prestation("logiciel");
    for (const page of pagesTheme) {
      expect(page.prestation, page.id).toBe("logiciel");
      expect(page.offre, page.id).toBe(logiciel);
      // Plus d'intégration IA ni de CTO à réserver sous un sujet propre.
      expect(page.rendezVous, page.id).toBeUndefined();
      expect(page.reassurance, page.id).toBeUndefined();
    }
  });
});

describe("la comparaison aux agences se fait à livrable égal", () => {
  test("ERP : le plancher face au premier outil d'agence, jamais face à leur médiane", () => {
    const prix = pageErp.faq.items.find((i) => /Combien coûte/u.test(i.question)).answer;
    const note = pageErp.blocs.find((b) => b.type === "tableau" && b.note?.includes(repereAgenceLogiciel.source.nom)).note;
    for (const texte of [prix, note]) {
      expect(texte).toContain(euros(repereAgenceLogiciel.premierOutilMin));
      expect(texte).not.toMatch(/médiane/u);
    }
  });
});
