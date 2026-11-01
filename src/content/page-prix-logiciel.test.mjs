import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { euros, prestation, repereAgenceLogiciel } from "./offre.ts";
import { pageLogicielCaen } from "./page-logiciel-caen.ts";
import { pagePrixLogiciel } from "./page-prix-logiciel.ts";
import { CHEMIN_PRIX_LOGICIEL, pagesSecteur } from "./pages-secteur.ts";
import { contentRoutes } from "./routes.ts";
import { lienLocalParPrestation } from "./service-pages.ts";
import { siteConfig } from "./site.ts";

/**
 * LA PAGE DE PRIX DE LA SOLUTION MÉTIER, et ce que l'œil ne vérifie pas.
 *
 * Elle répond « combien ça coûte » sans aucun chiffre d'Eliott depuis le
 * 2026-11-01 : ce qui fait varier le prix, le repère d'agence d'`offre.ts`, et la
 * comparaison avec un abonnement, recalculée ici depuis ses hypothèses.
 *
 * En fin de fichier, l'unicité des pages déclinées (les pages secteur, la page
 * locale de Caen, la page de prix) : des pages qui se recopient passent pour du
 * contenu produit en série.
 */

const LOGICIEL = prestation("logiciel");
const page = pagePrixLogiciel;

/** Toutes les chaînes affichées ou déclarées par la page, à plat. */
function textes() {
  return [
    page.seo.titre,
    page.seo.description,
    page.h1,
    page.resume,
    page.titreOffre,
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

const mots = (texte) => texte.split(/\s+/u).filter((m) => /[\p{L}\d]/u.test(m)).length;

describe("la page de prix est cherchable", () => {
  test("le titre tient en 60 caractères, porte la requête et la marque", () => {
    const { titre } = page.seo;
    expect(titre.length).toBeLessThanOrEqual(60);
    expect(titre.toLowerCase()).toContain("prix d’un logiciel sur mesure");
    expect(titre).toContain(siteConfig.contact.person.name);
  });

  test("la description fait 150 à 160 caractères, au vouvoiement", () => {
    const { description } = page.seo;
    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(/\b(tu|ton|ta|tes|toi)\b/iu.test(description)).toBe(false);
  });

  test("la page est annoncée au sitemap, sous la solution métier", () => {
    expect(page.chemin).toBe(CHEMIN_PRIX_LOGICIEL);
    expect(CHEMIN_PRIX_LOGICIEL).toBe(`/services/${LOGICIEL.slug}/prix`);
    expect(contentRoutes.map((r) => r.pathname)).toContain(CHEMIN_PRIX_LOGICIEL);
  });

  test("la page pilier et chaque page secteur la lient", () => {
    const pilier = (lienLocalParPrestation.logiciel ?? []).flatMap((l) => l.liens);
    expect(pilier.map((l) => l.href)).toContain(CHEMIN_PRIX_LOGICIEL);
    for (const secteur of pagesSecteur) {
      const hrefs = secteur.sections.flatMap((s) => s.liens?.items.map((l) => l.href) ?? []);
      expect(hrefs, `${secteur.slug} ne lie pas la page de prix`).toContain(CHEMIN_PRIX_LOGICIEL);
    }
  });

  test("ses liens internes visent des pages servies ou le rendez-vous", () => {
    const chemins = contentRoutes.map((r) => r.pathname);
    const hrefs = page.sections.flatMap((s) => s.liens?.items.map((l) => l.href) ?? []);
    for (const href of hrefs) {
      // Seul lien externe permis : la source du repère d'agence.
      if (/^https?:/u.test(href)) {
        expect(href).toBe(repereAgenceLogiciel.source.href);
        continue;
      }
      if (href.startsWith("#")) {
        expect(href).toBe("#rendez-vous");
        continue;
      }
      expect(chemins, `${href} n'est pas au sitemap`).toContain(href);
    }
    for (const secteur of pagesSecteur) expect(hrefs).toContain(secteur.chemin);
    expect(hrefs).toContain("#rendez-vous");
  });

  test("la FAQ compte 5 à 7 questions", () => {
    expect(page.faq.items.length).toBeGreaterThanOrEqual(5);
    expect(page.faq.items.length).toBeLessThanOrEqual(7);
  });

  test("le contenu principal fait 1 000 à 1 400 mots", () => {
    const total = mots(textes().slice(2).join(" "));
    expect(total).toBeGreaterThanOrEqual(1000);
    expect(total).toBeLessThanOrEqual(1400);
  });
});

describe("la page ne porte aucun prix d'Eliott", () => {
  test("la réponse directe renvoie au devis et cite le repère d'agence", () => {
    expect(page.resume).toMatch(/au devis/u);
    expect(page.resume).toContain(euros(repereAgenceLogiciel.premierOutilMin));
    expect(page.seo.description).not.toMatch(/\d\s*\u20AC|à partir de/u);
  });

  test("aucun forfait, aucune fourchette, aucun délai chiffré", () => {
    for (const texte of textes()) {
      expect(/\bforfaits?\b|\bpaliers?\b/iu.test(texte), texte).toBe(false);
      expect(/de \d[\d\u00A0\u202F ]*\u20AC à \d/u.test(texte), texte).toBe(false);
      expect(/\d\s*(?:jours?|semaines?)\b/iu.test(texte), texte).toBe(false);
    }
  });

  test("le suivi se chiffre au devis, sans taux ni minimum", () => {
    const reponse = page.faq.items.find((i) => /maintenance/u.test(i.question))?.answer;
    expect(reponse).toMatch(/au devis/u);
    expect(reponse).not.toMatch(/\d/u);
    expect(textes().join("\n")).not.toMatch(/\d\s*%/u);
  });

  test("aucun montant en euros n'est écrit à la main dans page-prix-logiciel.ts", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./page-prix-logiciel.ts", import.meta.url)),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    expect(source.match(/\d[\d   ]*€/gu) ?? []).toEqual([]);
  });
});

describe("la comparaison avec un abonnement tombe juste", () => {
  const c = page.comparaison;
  const section = page.sections.find((s) => s.id === "comparaison");
  const corps = section?.paragraphes.join(" ") ?? "";

  test("les coûts sont le produit de leurs hypothèses", () => {
    expect(c.coutParUtilisateur).toBe(c.prixParUtilisateur * c.mois);
    expect(c.coutAbonnement).toBe(c.utilisateurs * c.coutParUtilisateur);
  });

  test("le texte affiche les chiffres calculés et les dit hypothèses", () => {
    expect(section).toBeDefined();
    expect(corps).toContain(euros(c.coutAbonnement));
    expect(corps).toContain(euros(c.coutParUtilisateur));
    expect(corps).toContain("hypothèses");
    expect(section.points.every((p) => p.titre.startsWith("Hypothèse"))).toBe(true);
  });
});

describe("la page de prix ne promet que ce qui est vrai", () => {
  test("aucune promesse de rendez-vous sur place ni de déplacement", () => {
    const interdit = /sur place|en personne|présentiel|déplac|autour d.un café|chez (?:toi|vous), devant/iu;
    for (const texte of textes()) {
      expect(interdit.test(texte), `promesse de présentiel : ${texte}`).toBe(false);
    }
  });

  test("aucun tiret cadratin ni demi-cadratin", () => {
    for (const texte of textes()) {
      expect(/[–—]/u.test(texte), `tiret long : ${texte}`).toBe(false);
    }
  });

  test("le visiteur est vouvoyé partout (décision d'Eliott du 2026-10-15)", () => {
    const tutoiement = /(?<![\p{L}’'])(?:tu|toi|ton|ta|tes|te)(?!\p{L})|(?<!\p{L})t’/iu;
    for (const texte of textes()) {
      expect(tutoiement.test(texte), `tutoiement : ${texte}`).toBe(false);
    }
  });

  test("la comparaison avec les agences est sourcée et liée", () => {
    const section = page.sections.find((s) => s.id === "variation");
    const paragraphe = section.paragraphes.find((p) => p.includes(repereAgenceLogiciel.source.nom));
    expect(paragraphe).toBeDefined();
    expect(paragraphe).toContain(euros(repereAgenceLogiciel.mediane));
    expect(paragraphe).toContain(euros(repereAgenceLogiciel.premierOutilMin));
    expect(paragraphe).toContain(repereAgenceLogiciel.source.releve);
    expect(section.liens.items.map((l) => l.href)).toContain(repereAgenceLogiciel.source.href);
  });
});

/* ------------------------------------------------------------------------ */
/* LES PAGES DÉCLINÉES NE SE RECOPIENT PAS                                   */
/* ------------------------------------------------------------------------ */

/** Une page déclinée ramenée à ses champs comparables. */
function fiche(p, nom) {
  const sections = p.sections ?? [];
  const contexte = p.contexte;
  return {
    nom,
    titre: p.seo.titre,
    description: p.seo.description,
    h1: p.h1,
    titreOffre: p.titreOffre ?? nom,
    questions: p.faq.items.map((i) => i.question),
    blocs: [
      p.resume,
      ...(contexte ? [contexte.intro, ...contexte.points.map((pt) => pt.corps)] : []),
      ...sections.flatMap((s) => [...s.paragraphes, ...s.points.map((pt) => pt.corps)]),
      ...p.faq.items.map((i) => i.answer),
    ],
  };
}

const DECLINEES = [
  ...pagesSecteur.map((p) => fiche(p, p.slug)),
  fiche(pageLogicielCaen, "logiciel-caen"),
  fiche(page, "prix"),
];

describe("les pages déclinées ne se recopient pas", () => {
  test("il y a les pages secteur, la page de Caen du logiciel et la page de prix", () => {
    // La page de Caen du site vitrine a été supprimée le 2026-10-31.
    expect(DECLINEES.length).toBe(pagesSecteur.length + 2);
    expect(DECLINEES.length).toBeGreaterThan(2);
  });

  for (const champ of ["titre", "description", "h1", "titreOffre"]) {
    test(`aucun ${champ} n'est partagé`, () => {
      const valeurs = DECLINEES.map((f) => f[champ]);
      expect(new Set(valeurs).size).toBe(valeurs.length);
    });
  }

  test("aucune question de FAQ n'est partagée", () => {
    const questions = DECLINEES.flatMap((f) => f.questions);
    expect(new Set(questions).size).toBe(questions.length);
  });

  test("aucun bloc de texte n'est partagé entre 2 pages", () => {
    const vus = new Map();
    for (const f of DECLINEES) {
      for (const bloc of f.blocs) {
        const autre = vus.get(bloc);
        expect(autre === undefined || autre === f.nom, `bloc partagé (${autre}, ${f.nom}) : ${bloc}`).toBe(true);
        vus.set(bloc, f.nom);
      }
    }
  });
});
