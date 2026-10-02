import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { prestation, prixPack } from "./offre.ts";
import { pageCaen } from "./page-caen.ts";
import { CHEMIN_PRIX_SITE, pagePrixSite } from "./page-prix-site.ts";
import { pagesSecteur } from "./pages-secteur.ts";
import { contentRoutes } from "./routes.ts";
import { lienLocalParPrestation } from "./service-pages.ts";
import { siteConfig } from "./site.ts";

/**
 * LA PAGE DE PRIX DU SITE VITRINE (lot 4 SEO, 2026-10-02).
 *
 * Elle répond à « prix site internet sur mesure » et « combien coûte un site
 * internet professionnel ». Ce que l'œil ne vérifie pas : la longueur du titre
 * et de la description, la présence au sitemap et sur la page pilier, des prix
 * qui viennent tous de `offre.ts`, et aucun paragraphe recopié d'une autre page.
 */

const page = pagePrixSite;
const VITRINE = prestation("vitrine");
const mots = (texte) => texte.split(/\s+/u).filter((m) => /[\p{L}\d]/u.test(m)).length;

/** Chaînes affichées d'une page rendue par le gabarit de prestation. */
function textesDe(p) {
  return [
    p.h1,
    p.resume,
    ...(p.sections ?? []).flatMap((s) => [
      s.titre,
      ...s.paragraphes,
      ...s.points.flatMap((x) => [x.titre, x.corps]),
    ]),
    ...p.faq.items.flatMap((i) => [i.question, i.answer]),
  ];
}

describe("la page de prix est cherchable", () => {
  test("le titre tient en 60 caractères, porte la requête et la marque", () => {
    expect(page.seo.titre.length).toBeLessThanOrEqual(60);
    expect(page.seo.titre).toContain("Prix d’un site internet sur mesure");
    expect(page.seo.titre).toContain(siteConfig.contact.person.name);
  });

  test("la description fait 150 à 160 caractères, au vouvoiement", () => {
    const { description } = page.seo;
    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(/\b(tu|ton|ta|tes|toi)\b/iu.test(description)).toBe(false);
  });

  test("le H1 porte la requête", () => {
    expect(page.h1).toBe("Prix d’un site internet sur mesure");
  });

  test("la page vit sous le site vitrine et est annoncée au sitemap", () => {
    expect(CHEMIN_PRIX_SITE).toBe(`/services/${VITRINE.slug}/prix`);
    expect(contentRoutes.map((r) => r.pathname)).toContain(CHEMIN_PRIX_SITE);
  });

  test("la page pilier et la page de Caen la lient", () => {
    const pilier = (lienLocalParPrestation.vitrine ?? []).flatMap((ligne) => ligne.liens.map((l) => l.href));
    expect(pilier).toContain(CHEMIN_PRIX_SITE);
    expect(pageCaen.contexte.liens.map((l) => l.href)).toContain(CHEMIN_PRIX_SITE);
  });

  test("ses liens internes visent des pages servies ou le rendez-vous", () => {
    const chemins = contentRoutes.map((r) => r.pathname);
    for (const lien of page.sections.flatMap((s) => s.liens?.items ?? [])) {
      if (lien.href.startsWith("#")) {
        expect(lien.href).toBe("#rendez-vous");
        continue;
      }
      expect(chemins, `${lien.href} n'est pas au sitemap`).toContain(lien.href);
    }
  });

  test("le contenu principal fait 1 100 à 1 500 mots", () => {
    const total = textesDe(page).reduce((n, t) => n + mots(t), 0);
    expect(total).toBeGreaterThanOrEqual(1100);
    expect(total).toBeLessThanOrEqual(1500);
  });

  test("la FAQ compte 5 à 7 questions", () => {
    expect(page.faq.items.length).toBeGreaterThanOrEqual(5);
    expect(page.faq.items.length).toBeLessThanOrEqual(7);
  });
});

describe("la page de prix ne dit que ce qui est vrai", () => {
  test("la réponse directe donne les 3 forfaits avec leur prix calculé", () => {
    for (const pack of VITRINE.packs) {
      expect(page.resume).toContain(prixPack(pack));
    }
  });

  test("aucun montant en euros n'est écrit à la main dans page-prix-site.ts", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./page-prix-site.ts", import.meta.url)),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    expect(source.match(/\d[\d   ]*€/gu) ?? []).toEqual([]);
  });

  test("aucune promesse de rendez-vous sur place ni de déplacement", () => {
    const interdit = /sur place|en personne|présentiel|déplac|autour d.un café/iu;
    for (const texte of textesDe(page)) {
      expect(interdit.test(texte), `promesse de présentiel : ${texte}`).toBe(false);
    }
  });

  test("aucun tiret cadratin ni demi-cadratin", () => {
    for (const texte of textesDe(page)) {
      expect(/[–—]/u.test(texte), `tiret long : ${texte}`).toBe(false);
    }
  });

  test("aucun paragraphe repris de la page de Caen ou d'une page secteur", () => {
    const ailleurs = new Set(
      [pageCaen, ...pagesSecteur].flatMap(textesDe).filter((t) => mots(t) >= 8),
    );
    for (const texte of textesDe(page).filter((t) => mots(t) >= 8)) {
      expect(ailleurs.has(texte), `paragraphe partagé : ${texte}`).toBe(false);
    }
  });
});
