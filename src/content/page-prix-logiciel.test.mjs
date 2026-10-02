import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  euros,
  fourchette,
  plancherSuivi,
  prestation,
  prixPack,
  suiviMensuelHT,
  tauxSuivi,
} from "./offre.ts";
import { pageCaen } from "./page-caen.ts";
import { pageLogicielCaen } from "./page-logiciel-caen.ts";
import { pagePrixLogiciel } from "./page-prix-logiciel.ts";
import { CHEMIN_PRIX_LOGICIEL, pagesSecteur } from "./pages-secteur.ts";
import { contentRoutes } from "./routes.ts";
import { lienLocalParPrestation } from "./service-pages.ts";
import { siteConfig } from "./site.ts";

/**
 * LA PAGE DE PRIX DE LA SOLUTION MÉTIER, et ce que l'œil ne vérifie pas.
 *
 * Une page qui répond « combien ça coûte » ne tient que si ses chiffres sont
 * justes : les forfaits et le suivi viennent de `offre.ts`, et la comparaison
 * avec un abonnement est recalculée ici depuis ses hypothèses.
 *
 * En fin de fichier, l'unicité des 7 pages déclinées (4 secteurs, 2 pages de
 * Caen, la page de prix) : des pages qui se recopient passent pour du contenu
 * produit en série.
 */

const LOGICIEL = prestation("logiciel");
const LE_LOGICIEL = LOGICIEL.packs[1];
const page = pagePrixLogiciel;

/** Toutes les chaînes affichées ou déclarées par la page, à plat. */
function textes() {
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

describe("les prix de la page sont ceux d'offre.ts", () => {
  test("la réponse directe donne la fourchette et les 3 forfaits", () => {
    expect(page.resume).toContain(fourchette("logiciel", " HT"));
    for (const pack of LOGICIEL.packs) expect(page.resume).toContain(prixPack(pack));
  });

  test("le suivi mensuel est celui d'offre.ts", () => {
    const tout = textes().join("\n");
    expect(tout).toContain(tauxSuivi());
    expect(tout).toContain(plancherSuivi());
    expect(page.comparaison.suiviMensuel).toBe(suiviMensuelHT(LE_LOGICIEL.prix));
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
    expect(c.prixProjet).toBe(LE_LOGICIEL.prix);
    expect(c.coutAbonnement).toBe(c.utilisateurs * c.prixParUtilisateur * c.mois);
    expect(c.coutSurMesure).toBe(c.prixProjet + c.suiviMensuel * c.mois);
  });

  test("le seuil est le premier nombre d'utilisateurs où l'abonnement coûte plus", () => {
    const abonnement = (n) => n * c.prixParUtilisateur * c.mois;
    expect(abonnement(c.seuilUtilisateurs)).toBeGreaterThan(c.coutSurMesure);
    expect(abonnement(c.seuilUtilisateurs - 1)).toBeLessThanOrEqual(c.coutSurMesure);
  });

  test("le texte affiche les chiffres calculés et les dit hypothèses", () => {
    expect(section).toBeDefined();
    expect(corps).toContain(euros(c.coutAbonnement));
    expect(corps).toContain(euros(c.coutSurMesure));
    expect(corps).toContain(euros(c.suiviMensuel));
    expect(corps).toContain(`${c.seuilUtilisateurs} utilisateurs`);
    expect(corps).toContain("hypothèses");
    expect(section.points.every((p) => p.titre.startsWith("Hypothèse"))).toBe(true);
  });
});

describe("la page de prix ne promet que ce qui est vrai", () => {
  test("aucune promesse de rendez-vous sur place ni de déplacement", () => {
    const interdit = /sur place|en personne|présentiel|déplac|autour d.un café|chez toi, devant/iu;
    for (const texte of textes()) {
      expect(interdit.test(texte), `promesse de présentiel : ${texte}`).toBe(false);
    }
  });

  test("aucun tiret cadratin ni demi-cadratin", () => {
    for (const texte of textes()) {
      expect(/[–—]/u.test(texte), `tiret long : ${texte}`).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------------ */
/* LES 7 PAGES DÉCLINÉES NE SE RECOPIENT PAS                                 */
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
    titrePacks: p.titrePacks ?? nom,
    questions: p.faq.items.map((i) => i.question),
    blocs: [
      p.resume,
      ...(contexte ? [contexte.intro, ...contexte.points.map((pt) => pt.corps)] : []),
      ...sections.flatMap((s) => [...s.paragraphes, ...s.points.map((pt) => pt.corps)]),
      ...p.faq.items.map((i) => i.answer),
    ],
  };
}

const SEPT = [
  ...pagesSecteur.map((p) => fiche(p, p.slug)),
  fiche(pageCaen, "caen"),
  fiche(pageLogicielCaen, "logiciel-caen"),
  fiche(page, "prix"),
];

describe("les 7 pages déclinées ne se recopient pas", () => {
  test("il y a bien 7 pages", () => {
    expect(SEPT.length).toBe(7);
  });

  for (const champ of ["titre", "description", "h1", "titrePacks"]) {
    test(`aucun ${champ} n'est partagé`, () => {
      const valeurs = SEPT.map((f) => f[champ]);
      expect(new Set(valeurs).size).toBe(valeurs.length);
    });
  }

  test("aucune question de FAQ n'est partagée", () => {
    const questions = SEPT.flatMap((f) => f.questions);
    expect(new Set(questions).size).toBe(questions.length);
  });

  test("aucun bloc de texte n'est partagé entre 2 pages", () => {
    const vus = new Map();
    for (const f of SEPT) {
      for (const bloc of f.blocs) {
        const autre = vus.get(bloc);
        expect(autre === undefined || autre === f.nom, `bloc partagé (${autre}, ${f.nom}) : ${bloc}`).toBe(true);
        vus.set(bloc, f.nom);
      }
    }
  });
});
