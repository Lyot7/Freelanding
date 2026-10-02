import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fourchette, prestation, prixPack } from "./offre.ts";
import { CHEMIN_PAGE_LOGICIEL_CAEN, pageCaen } from "./page-caen.ts";
import { lienVersPageLogicielCaen, pageLogicielCaen } from "./page-logiciel-caen.ts";
import { pagesSecteur } from "./pages-secteur.ts";
import { contentRoutes } from "./routes.ts";
import { lienLocalParPrestation } from "./service-pages.ts";
import { siteConfig } from "./site.ts";

/**
 * LA PAGE DU LOGICIEL SUR MESURE À CAEN, et ce que l'œil ne vérifie pas.
 *
 * Même exigences que la page de Caen du site vitrine : un titre et une
 * description à la bonne longueur, une place au sitemap, des liens qui
 * mènent quelque part, aucune promesse de présentiel ni de client caennais
 * inventé, et des prix lus dans `offre.ts`.
 */

const LOGICIEL = prestation("logiciel");
const page = pageLogicielCaen;

/** Toutes les chaînes affichées ou déclarées par la page, à plat. */
function textes() {
  const { contexte, faq } = page;
  return [
    page.seo.titre,
    page.seo.description,
    page.h1,
    page.resume,
    contexte.titre,
    page.titrePacks ?? "",
    contexte.intro,
    ...contexte.liens.flatMap((l) => [l.libelle, l.description]),
    ...contexte.points.flatMap((p) => [p.titre, p.corps]),
    ...(page.sections ?? []).flatMap((s) => [
      s.titre,
      ...s.paragraphes,
      ...(s.liens ? [s.liens.titre, ...s.liens.items.flatMap((l) => [l.libelle, l.description])] : []),
      ...s.points.flatMap((p) => [p.titre, p.corps]),
    ]),
    ...faq.titleLines,
    ...faq.items.flatMap((i) => [i.question, i.answer]),
  ];
}

/** Tous les liens internes de la page : contexte et sections. */
function hrefs() {
  return [
    ...page.contexte.liens.map((l) => l.href),
    ...(page.sections ?? []).flatMap((s) => s.liens?.items.map((l) => l.href) ?? []),
  ];
}

describe("la page du logiciel à Caen est cherchable", () => {
  test("le titre tient en 60 caractères, porte la requête et la marque", () => {
    const { titre } = page.seo;
    expect(titre.length).toBeLessThanOrEqual(60);
    expect(titre).toContain("Logiciel sur mesure à Caen");
    expect(titre).toContain(siteConfig.contact.person.name);
  });

  test("la description fait 150 à 160 caractères, au vouvoiement", () => {
    const { description } = page.seo;
    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(/\b(tu|ton|ta|tes|toi)\b/iu.test(description)).toBe(false);
  });

  test("le H1 porte la requête", () => {
    expect(page.h1.toLowerCase()).toContain("logiciel sur mesure");
    expect(page.h1).toContain("Caen");
  });

  test("la page est annoncée au sitemap comme page locale", () => {
    expect(page.chemin).toBe(CHEMIN_PAGE_LOGICIEL_CAEN);
    expect(CHEMIN_PAGE_LOGICIEL_CAEN).toBe("/logiciel-sur-mesure-caen");
    const route = contentRoutes.find((r) => r.pathname === CHEMIN_PAGE_LOGICIEL_CAEN);
    expect(route?.kind).toBe("local");
  });

  test("la page pilier et la page de Caen du site vitrine la lient", () => {
    const pilier = (lienLocalParPrestation.logiciel ?? []).flatMap((l) => l.liens);
    expect(pilier.map((l) => l.href)).toContain(CHEMIN_PAGE_LOGICIEL_CAEN);
    expect(lienVersPageLogicielCaen.href).toBe(CHEMIN_PAGE_LOGICIEL_CAEN);
    expect(pageCaen.contexte.liens.map((l) => l.href)).toContain(CHEMIN_PAGE_LOGICIEL_CAEN);
  });

  test("ses liens internes visent des pages servies ou le rendez-vous", () => {
    const chemins = contentRoutes.map((r) => r.pathname);
    for (const href of hrefs()) {
      if (href.startsWith("#")) {
        expect(href).toBe("#rendez-vous");
        continue;
      }
      expect(chemins, `${href} n'est pas au sitemap`).toContain(href);
    }
  });

  test("elle lie chaque page secteur, la page de prix et le pilier", () => {
    const liens = hrefs();
    for (const secteur of pagesSecteur) expect(liens).toContain(secteur.chemin);
    expect(liens).toContain(`/services/${LOGICIEL.slug}`);
    expect(liens).toContain(`/services/${LOGICIEL.slug}/prix`);
    expect(liens).toContain("#rendez-vous");
  });

  test("la FAQ compte 5 à 7 questions", () => {
    expect(page.faq.items.length).toBeGreaterThanOrEqual(5);
    expect(page.faq.items.length).toBeLessThanOrEqual(7);
  });
});

describe("la page du logiciel à Caen ne promet que ce qui est vrai", () => {
  test("aucune promesse de rendez-vous sur place ni de déplacement", () => {
    const interdit = /sur place|en personne|présentiel|déplac|autour d.un café|chez toi, devant/iu;
    for (const texte of textes()) {
      expect(interdit.test(texte), `promesse de présentiel : ${texte}`).toBe(false);
    }
  });

  test("les rendez-vous sont annoncés en visio", () => {
    expect(page.resume).toContain("visio");
    expect(textes().join("\n")).toContain("Tous les rendez-vous en visio");
  });

  test("aucun client caennais n'est revendiqué", () => {
    const reponse = page.faq.items.find((i) => /déjà développé/u.test(i.question));
    expect(reponse?.answer.startsWith("Pas encore.")).toBe(true);
  });

  test("aucun tiret cadratin ni demi-cadratin", () => {
    for (const texte of textes()) {
      expect(/[–—]/u.test(texte), `tiret long : ${texte}`).toBe(false);
    }
  });

  test("la réponse directe et la FAQ donnent les prix lus dans offre.ts", () => {
    expect(page.resume).toContain(fourchette("logiciel", " HT"));
    const tout = textes().join("\n");
    for (const pack of LOGICIEL.packs) expect(tout).toContain(prixPack(pack));
  });

  test("aucun montant en euros n'est écrit à la main dans page-logiciel-caen.ts", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./page-logiciel-caen.ts", import.meta.url)),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    expect(source.match(/\d[\d   ]*€/gu) ?? []).toEqual([]);
  });
});
