import { describe, expect, test } from "bun:test";
import { calculArtisans } from "./page-artisans.ts";
import { calculAutomatisation } from "./page-automatisation.ts";
import { calculGmao } from "./page-gmao.ts";
import { prestation } from "./offre.ts";
import { pagesSecteur } from "./pages-secteur.ts";
import { pagesTheme } from "./pages-theme.ts";
import { contentRoutes } from "./routes.ts";
import { siteConfig } from "./site.ts";

/**
 * LES PAGES THÉMATIQUES, et ce que l'œil ne vérifie pas : longueur du titre et
 * de la description, présence au sitemap et au pied de page, et surtout
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

      test("la page est reliée depuis le pied de page", () => {
        expect(siteConfig.contact.localLinks.some((l) => l.href === page.chemin)).toBe(true);
      });

      test("au moins un bloc qui n'est pas une section en deux moitiés", () => {
        expect(page.blocs.some((b) => b.type !== "section")).toBe(true);
      });

      test("ni tiret cadratin, ni TJM, ni tutoiement", () => {
        for (const texte of textes(page)) {
          expect(texte).not.toMatch(/—/u);
          expect(texte).not.toMatch(/\bTJM\b|taux journalier/iu);
          expect(texte).not.toMatch(/\b(tu|toi|ta|tes)\b/u);
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

  test("artisans : assez de chantiers pour couvrir le plancher", () => {
    expect(calculArtisans.chantiersPourPayer * calculArtisans.margeChantier).toBeGreaterThanOrEqual(prestation("vitrine").plancher);
    expect((calculArtisans.chantiersPourPayer - 1) * calculArtisans.margeChantier).toBeLessThan(prestation("vitrine").plancher);
  });
});
