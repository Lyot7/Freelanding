import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { integrationIA, prestation, prestations, prixPlancher } from "../../content/offre.ts";
import { pagePrixLogiciel } from "../../content/page-prix-logiciel.ts";
import { pagePrixSite } from "../../content/page-prix-site.ts";
import { CHEMIN_SIMULATEUR } from "../../content/pages-secteur.ts";
import { contentRoutes } from "../../content/routes.ts";
import { siteConfig } from "../../content/site.ts";
import {
  libellesSimulateur,
  plancherEstime,
  suiviEstime,
  typeProjet,
  typesProjet,
} from "../../content/simulateur.ts";
import { pageSimulateur } from "../../content/simulateur-prix.ts";
import { estimer } from "./estimation.ts";
import { pageTypeFromPathname, viewEventForPageType } from "../analytics/events.ts";

/**
 * LE SIMULATEUR DE PRIX, OUTIL DE CADRAGE DEPUIS LE 2026-10-05 : le plancher
 * de l'offre, « prix au devis », et ce qui fera monter le prix selon les
 * réponses.
 *
 * Ce qui est gardé : l'offre lue est celle d'`offre.ts` (jamais une copie), le
 * résultat ne rend ni fourchette, ni délai, ni nom de forfait, et chaque
 * réponse ne peut qu'ajouter un facteur, jamais en retirer un.
 */

const premiere = (q) => q.options.find((o) => !o.facteur && !o.horsForfait);
const avecFacteur = (q) => q.options.filter((o) => o.facteur);

const reponsesMin = (type) =>
  Object.fromEntries(type.questions.map((q) => [q.id, premiere(q).id]));

describe("les offres sont lues dans offre.ts", () => {
  test("site vitrine, logiciel et outil interne reprennent les offres publiées", () => {
    expect(typeProjet("vitrine").offre).toBe(prestation("vitrine"));
    expect(typeProjet("logiciel").offre).toBe(prestation("logiciel"));
    expect(typeProjet("outil-interne").offre).toBe(prestation("logiciel"));
  });

  test("l'intégration IA lit son offre, hors des prestations à page dédiée", () => {
    expect(typeProjet("integration-ia").offre).toBe(integrationIA);
    expect(prestations.some((p) => p === integrationIA)).toBe(false);
  });

  test("le plancher IA arrêté par Eliott le 2026-10-05", () => {
    expect(integrationIA.plancher).toBe(2500);
  });

  test("plus aucun délai ni palier dans les offres lues", () => {
    for (const type of typesProjet) {
      for (const champ of ["packs", "delai"]) {
        expect(champ in type.offre, `${type.id} : ${champ}`).toBe(false);
      }
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
        expect(premiere(q), `${q.id} n'a pas de réponse qui reste au plancher`).toBeDefined();
      }
      // Chaque type a au moins une réponse qui fait monter le prix.
      expect(type.questions.some((q) => avecFacteur(q).length > 0)).toBe(true);
    });
  }
});

describe("le cadrage", () => {
  for (const type of typesProjet) {
    describe(type.libelle, () => {
      test("sans réponse, aucun facteur, toutes les questions restantes", () => {
        const e = estimer(type, {});
        expect(e.facteurs).toEqual([]);
        expect(e.restantes).toBe(type.questions.length);
        expect(e.horsForfait).toEqual([type.offre.horsOffre]);
      });

      test("les réponses les plus simples restent au plancher, sans facteur", () => {
        const e = estimer(type, reponsesMin(type));
        expect(e.facteurs).toEqual([]);
        expect(e.restantes).toBe(0);
      });

      test("chaque réponse à facteur l'ajoute, et seulement lui", () => {
        for (const q of type.questions) {
          for (const o of avecFacteur(q)) {
            const e = estimer(type, { ...reponsesMin(type), [q.id]: o.id });
            expect(e.facteurs, `${q.id}/${o.id}`).toEqual([o.facteur]);
          }
        }
      });

      test("une réponse ne peut qu'ajouter un facteur, jamais en retirer", () => {
        const vide = estimer(type, {});
        for (const q of type.questions) {
          for (const o of q.options) {
            const e = estimer(type, { [q.id]: o.id });
            expect(e.facteurs.length >= vide.facteurs.length, `${q.id}/${o.id}`).toBe(true);
            expect(e.restantes, `${q.id}/${o.id}`).toBe(vide.restantes - 1);
          }
        }
      });

      test("une réponse inconnue compte comme une question sans réponse", () => {
        const q = type.questions[0];
        expect(estimer(type, { [q.id]: "n-existe-pas" })).toEqual(estimer(type, {}));
      });
    });
  }

  test("le lien de la page de prix du site annonce le bon nombre de questions", () => {
    const lien = pagePrixSite.sections
      .flatMap((s) => s.liens?.items ?? [])
      .find((l) => l.href === CHEMIN_SIMULATEUR);
    expect(lien.description).toContain(`${typeProjet("vitrine").questions.length} questions`);
  });

  test("un besoin hors offre est signalé, sinon le hors-offre de l'offre", () => {
    const logiciel = typeProjet("logiciel");
    expect(estimer(logiciel, reponsesMin(logiciel)).horsForfait).toEqual([
      logiciel.offre.horsOffre,
    ]);
    const e = estimer(logiciel, { ...reponsesMin(logiciel), depart: "reprise" });
    expect(e.horsForfait).toHaveLength(1);
    expect(e.horsForfait[0]).toMatch(/audit/u);
    expect(e.facteurs).toEqual([]);
  });

  test("l'incertitude se dit comme un facteur à arrêter ensemble", () => {
    const logiciel = typeProjet("logiciel");
    const e = estimer(logiciel, { ...reponsesMin(logiciel), modules: "inconnu" });
    expect(e.facteurs).toHaveLength(1);
    expect(e.facteurs[0]).toMatch(/ensemble/u);
  });
});

describe("le résultat : un plancher, au devis, ni fourchette ni délai", () => {
  test("le plancher est celui de l'offre, HT", () => {
    for (const type of typesProjet) {
      expect(plancherEstime(type.offre)).toBe(`${prixPlancher(type.offre)} HT`);
    }
  });

  test("le suivi part du plancher", () => {
    expect(suiviEstime(integrationIA)).toMatch(/^à partir de .+ HT par mois$/u);
  });

  test("aucun libellé du résultat ne parle de forfait, de fourchette ou de délai", () => {
    // Les VALEURS seulement : `horsForfait` reste un nom de champ.
    const valeurs = [];
    const relever = (v) => {
      if (typeof v === "string") valeurs.push(v);
      else if (typeof v === "function") valeurs.push(String(v(2)));
      else if (v && typeof v === "object") Object.values(v).forEach(relever);
    };
    relever({ libellesSimulateur, typesProjet });
    for (const texte of valeurs) {
      expect(/forfait|fourchette|palier|mise en ligne\s*:|semaines?\b/iu.test(texte), texte).toBe(false);
    }
    expect(libellesSimulateur.prixAuDevis).toMatch(/devis/u);
    for (const champ of ["libelleForfait", "libelleDelai", "toutLePrecedent"]) {
      expect(champ in libellesSimulateur, champ).toBe(false);
    }
  });

  test("le composant n'affiche ni délai ni forfait", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../../components/pages/simulateur/SimulateurPrix.tsx", import.meta.url)),
      "utf8",
    );
    expect(source).not.toMatch(/delaiEstime|forfaitEstime|prixEstime|palier_/u);
    expect(source).toContain("plancherEstime(type.offre)");
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
    expect(/\d\s*(?:jours?|semaines?)\b/iu.test(textes)).toBe(false);
    expect(/de \d[\d\u00A0\u202F ]*\u20AC à \d/u.test(textes)).toBe(false);
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

