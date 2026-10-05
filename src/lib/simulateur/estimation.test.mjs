import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { integrationIA, prestation, prestations, prixPack } from "../../content/offre.ts";
import { pagePrixLogiciel } from "../../content/page-prix-logiciel.ts";
import { pagePrixSite } from "../../content/page-prix-site.ts";
import { CHEMIN_SIMULATEUR } from "../../content/pages-secteur.ts";
import { contentRoutes } from "../../content/routes.ts";
import { siteConfig } from "../../content/site.ts";
import {
  delaiEstime,
  libellesSimulateur,
  prixEstime,
  typeProjet,
  typesProjet,
} from "../../content/simulateur.ts";
import { pageSimulateur } from "../../content/simulateur-prix.ts";
import { estimer } from "./estimation.ts";
import { pageTypeFromPathname, viewEventForPageType } from "../analytics/events.ts";

/**
 * LE SIMULATEUR DE PRIX : un calcul fixe sur les grilles d'`offre.ts`.
 *
 * Ce qui est gardé : la grille lue est celle de l'offre (jamais une copie),
 * chaque réponse ne peut que resserrer la fourchette, les bornes sont atteintes,
 * et les montants et délais arrêtés par Eliott le 2026-10-05 sont ceux publiés.
 */

const premiere = (q) => q.options.find((o) => o.palier === 0 && o.palierMax === undefined);
const plusHaute = (q) =>
  q.options.reduce((a, b) => ((b.palierMax ?? b.palier) > (a.palierMax ?? a.palier) ? b : a));

const reponsesMin = (type) =>
  Object.fromEntries(type.questions.map((q) => [q.id, premiere(q).id]));
const reponsesMax = (type) =>
  Object.fromEntries(type.questions.map((q) => [q.id, plusHaute(q).id]));
const palierMaxType = (type) =>
  Math.max(...type.questions.flatMap((q) => q.options.map((o) => o.palierMax ?? o.palier)));

describe("les grilles sont lues dans offre.ts", () => {
  test("site vitrine, logiciel et outil interne reprennent les forfaits publiés", () => {
    expect(typeProjet("vitrine").packs).toBe(prestation("vitrine").packs);
    expect(typeProjet("logiciel").packs).toBe(prestation("logiciel").packs);
    expect(typeProjet("outil-interne").packs).toBe(prestation("logiciel").packs);
  });

  test("l'intégration IA lit sa grille, hors des prestations à page dédiée", () => {
    expect(typeProjet("integration-ia").packs).toBe(integrationIA.packs);
    expect(prestations.some((p) => p.packs === integrationIA.packs)).toBe(false);
  });

  test("la grille IA arrêtée par Eliott le 2026-10-05", () => {
    expect(integrationIA.packs.map((p) => p.prix)).toEqual([2500, 5000, 8000]);
    expect(integrationIA.packs.map((p) => p.surMesure === true)).toEqual([false, false, true]);
  });

  test("les délais arrêtés le 2026-10-05, en semaines", () => {
    const delais = Object.fromEntries(
      [...prestations.flatMap((p) => p.packs), ...integrationIA.packs].map((p) => [p.id, p.delai]),
    );
    expect(delais).toEqual({
      landing: { min: 3, max: 4 },
      site: { min: 4, max: 6 },
      signature: { min: 6, max: 8 },
      outil: { min: 4, max: 6 },
      logiciel: { min: 10, max: 16 },
      plateforme: undefined,
      assistant: { min: 1, max: 2 },
      integration: { min: 3, max: 4 },
      automatisation: undefined,
    });
  });

  test("un palier sur mesure n'a pas de délai, les autres en ont un", () => {
    for (const pack of [...prestations.flatMap((p) => p.packs), ...integrationIA.packs]) {
      expect(pack.delai === undefined, pack.nom).toBe(pack.surMesure === true);
      if (pack.delai) expect(pack.delai.min < pack.delai.max, pack.nom).toBe(true);
    }
  });

  for (const fichier of ["simulateur.ts", "simulateur-prix.ts"]) {
    test(`aucun montant en euros n'est écrit à la main dans ${fichier}`, () => {
      const source = readFileSync(
        fileURLToPath(new URL(`../../content/${fichier}`, import.meta.url)),
        "utf8",
      )
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
      expect(source.match(/\d[\d   ]*€/gu) ?? []).toEqual([]);
      expect(source.match(/\b\d{1,2}[   ]?\d{3}\b/gu) ?? []).toEqual([]);
    });
  }

  test("le composant client n'importe que le module mince du simulateur", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../../components/pages/simulateur/SimulateurPrix.tsx", import.meta.url)),
      "utf8",
    );
    expect(source).not.toMatch(/content\/(simulateur-prix|service-pages|pages-secteur|page-prix)/u);
    const mince = readFileSync(fileURLToPath(new URL("../../content/simulateur.ts", import.meta.url)), "utf8");
    expect(mince.match(/from "\.\/[^"]+"/gu)).toEqual(['from "./offre"', 'from "./rendez-vous"']);
  });
});

describe("4 à 6 questions par type, toutes répondables", () => {
  test("les 4 types demandés sont là", () => {
    expect(typesProjet.map((t) => t.id)).toEqual([
      "vitrine",
      "logiciel",
      "outil-interne",
      "integration-ia",
    ]);
  });

  for (const type of typesProjet) {
    test(`${type.libelle} : 4 à 6 questions, identifiants uniques`, () => {
      expect(type.questions.length).toBeGreaterThanOrEqual(4);
      expect(type.questions.length).toBeLessThanOrEqual(6);
      expect(new Set(type.questions.map((q) => q.id)).size).toBe(type.questions.length);
      for (const q of type.questions) {
        expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options.map((o) => o.id)).size, q.id).toBe(q.options.length);
        expect(premiere(q), `${q.id} n'a pas de réponse au premier palier`).toBeDefined();
        for (const o of q.options) {
          expect((o.palierMax ?? o.palier) >= o.palier, `${q.id}/${o.id}`).toBe(true);
        }
      }
    });
  }
});

describe("le calcul", () => {
  for (const type of typesProjet) {
    describe(type.libelle, () => {
      test("sans réponse, la fourchette couvre tout ce que les questions permettent", () => {
        const e = estimer(type, {});
        expect(e.palierBas).toBe(0);
        expect(e.palierHaut).toBe(palierMaxType(type));
        expect(e.restantes).toBe(type.questions.length);
        expect(e.bas).toBe(type.packs[0]);
      });

      test("les réponses les plus simples donnent le premier forfait, prix ferme", () => {
        const e = estimer(type, reponsesMin(type));
        expect(e.bas).toBe(type.packs[0]);
        expect(e.haut).toBe(type.packs[0]);
        expect(e.restantes).toBe(0);
        expect(prixEstime(e.bas, e.haut)).toBe(`${prixPack(type.packs[0])} HT`);
      });

      test("les réponses les plus lourdes atteignent le haut de la grille", () => {
        const e = estimer(type, reponsesMax(type));
        expect(e.palierHaut).toBe(palierMaxType(type));
        expect(e.haut).toBe(type.packs[palierMaxType(type)]);
      });

      test("une réponse ne fait que resserrer la fourchette", () => {
        const vide = estimer(type, {});
        for (const q of type.questions) {
          for (const o of q.options) {
            const e = estimer(type, { [q.id]: o.id });
            expect(e.palierBas >= vide.palierBas, `${q.id}/${o.id}`).toBe(true);
            expect(e.palierHaut <= vide.palierHaut, `${q.id}/${o.id}`).toBe(true);
            expect(e.palierBas <= e.palierHaut, `${q.id}/${o.id}`).toBe(true);
            expect(e.bas.prix <= e.haut.prix, `${q.id}/${o.id}`).toBe(true);
          }
        }
      });

      test("une réponse inconnue compte comme une question sans réponse", () => {
        const q = type.questions[0];
        expect(estimer(type, { [q.id]: "n-existe-pas" })).toEqual(estimer(type, {}));
      });
    });
  }

  test("ce qui est inclus : le forfait atteint, en plus du précédent", () => {
    const vitrine = typeProjet("vitrine");
    const premier = estimer(vitrine, reponsesMin(vitrine));
    expect(premier.inclus).toBe(vitrine.packs[0].ajoute);
    expect(premier.precedent).toBeUndefined();
    const e = estimer(vitrine, { ...reponsesMin(vitrine), pages: "plusieurs" });
    expect(e.bas).toBe(vitrine.packs[1]);
    expect(e.inclus).toBe(vitrine.packs[1].ajoute);
    expect(e.precedent).toBe(vitrine.packs[0]);
  });

  test("le lien de la page de prix du site annonce le bon nombre de questions", () => {
    const lien = pagePrixSite.sections
      .flatMap((s) => s.liens?.items ?? [])
      .find((l) => l.href === CHEMIN_SIMULATEUR);
    expect(lien.description).toContain(`${typeProjet("vitrine").questions.length} questions`);
  });

  test("un besoin hors forfait est signalé, sinon le hors-forfait de la grille", () => {
    const logiciel = typeProjet("logiciel");
    expect(estimer(logiciel, reponsesMin(logiciel)).horsForfait).toEqual([logiciel.horsPack]);
    const e = estimer(logiciel, { ...reponsesMin(logiciel), depart: "reprise" });
    expect(e.horsForfait).toHaveLength(1);
    expect(e.horsForfait[0]).toMatch(/audit/u);
    expect(e.palierBas).toBe(0);
  });

  test("l'incertitude sur une question élargit jusqu'à son plafond", () => {
    const logiciel = typeProjet("logiciel");
    const e = estimer(logiciel, { ...reponsesMin(logiciel), modules: "inconnu" });
    expect([e.palierBas, e.palierHaut]).toEqual([0, 2]);
  });
});

describe("le résultat s'écrit comme les pages de prix", () => {
  const [outil, leLogiciel, plateforme] = prestation("logiciel").packs;

  test("une fourchette, et « et plus » derrière un palier sur mesure", () => {
    expect(prixEstime(outil, leLogiciel)).toBe(`de ${prixPack(outil)} à ${prixPack(leLogiciel)} HT`);
    expect(prixEstime(outil, plateforme)).toBe(
      `de ${prixPack(outil)} à ${prixPack(plateforme)} HT et plus`,
    );
    expect(prixEstime(plateforme, plateforme)).toBe(`à partir de ${prixPack(plateforme)} HT`);
  });

  test("le délai va du plus court du palier bas au plus long du palier haut", () => {
    expect(delaiEstime(outil, outil)).toBe("4 à 6 semaines");
    expect(delaiEstime(outil, leLogiciel)).toBe("4 à 16 semaines");
    expect(delaiEstime(leLogiciel, plateforme)).toBe("10 semaines au moins, date exacte au devis");
    expect(delaiEstime(plateforme, plateforme)).toBe("fixé au devis");
    const [assistant, , automatisation] = integrationIA.packs;
    expect(delaiEstime(assistant, automatisation)).toBe("1 semaine au moins, date exacte au devis");
  });
});

describe("la page", () => {
  test("le titre tient en 60 caractères, la description en 150 à 160", () => {
    expect(pageSimulateur.seo.titre.length).toBeLessThanOrEqual(60);
    expect(pageSimulateur.seo.description.length).toBeGreaterThanOrEqual(150);
    expect(pageSimulateur.seo.description.length).toBeLessThanOrEqual(160);
  });

  test("la mention indicative tient en une phrase et renvoie au devis", () => {
    const { mention } = libellesSimulateur;
    expect(mention).toMatch(/indicatif/u);
    expect(mention).toMatch(/devis/u);
    expect(mention.match(/[.!?]/gu)).toHaveLength(1);
  });

  test("la page est au sitemap, au pied de page, et liée par les 2 pages de prix", () => {
    expect(pageSimulateur.chemin).toBe(CHEMIN_SIMULATEUR);
    expect(contentRoutes.some((r) => r.pathname === CHEMIN_SIMULATEUR)).toBe(true);
    expect(siteConfig.footerNav.some((l) => l.href === CHEMIN_SIMULATEUR)).toBe(true);
    for (const page of [pagePrixSite, pagePrixLogiciel]) {
      const liens = page.sections.flatMap((s) => s.liens?.items ?? []);
      expect(liens.some((l) => l.href === CHEMIN_SIMULATEUR), page.chemin).toBe(true);
    }
  });

  test("aucun tiret long, aucune promesse de présentiel", () => {
    const textes = JSON.stringify({ pageSimulateur, libellesSimulateur, typesProjet, ia: integrationIA });
    expect(/[–—]/u.test(textes)).toBe(false);
    expect(/sur place|en personne|présentiel|déplac/iu.test(textes)).toBe(false);
  });
});

describe("la mesure", () => {
  test("une visite du simulateur a son type de page et sa vue nommée", () => {
    expect(pageTypeFromPathname(CHEMIN_SIMULATEUR)).toBe("simulator");
    expect(viewEventForPageType("simulator")).toBe("simulator_viewed");
  });

  test("les événements du simulateur sont documentés", () => {
    const doc = readFileSync(fileURLToPath(new URL("../../../docs/ANALYTICS.md", import.meta.url)), "utf8");
    expect(doc).toContain("`simulator_viewed`");
    expect(doc).toContain("`simulator_completed`");
  });
});

