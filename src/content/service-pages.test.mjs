import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { prestations } from "./offre.ts";
import { servicePageLabels, servicePageSeo } from "./service-pages.ts";
import { siteConfig } from "./site.ts";
import { contentRoutes } from "./routes.ts";

/**
 * LES TROIS PAGES QUI VENDENT, ET LEUR TITRE.
 *
 * CE QUI ÉTAIT SERVI. La balise `<title>` de `/services/*` valait
 * `prestation.nom` : « Site vitrine », « L'Outil », « Le Logiciel ». Deux de
 * ces trois titres sont des noms internes de catalogue, aucun ne portait la
 * marque, et rien ne le signalait — une page se rend parfaitement avec un
 * mauvais titre, et personne ne relit le `<head>`.
 *
 * Ces tests tiennent les deux contraintes que l'œil ne voit pas : la longueur,
 * qui décide de ce qu'un résultat de recherche affiche, et l'accord entre le
 * fil d'Ariane affiché et celui qui est déclaré aux moteurs.
 */

/**
 * PLAFOND DE LONGUEUR DU TITRE.
 *
 * Un résultat de recherche est tronqué autour de 60 caractères, et il l'est PAR
 * LA FIN : c'est donc la marque, écrite en suffixe, qui disparaît la première.
 * Le plafond n'est pas une règle de style, c'est la limite d'affichage du seul
 * endroit où ce texte est lu.
 */
const LONGUEUR_MAX_TITRE = 60;

describe("les titres des pages de prestation sont cherchables", () => {
  test("chaque prestation a son titre et son titre de page", () => {
    for (const p of prestations) {
      const seo = servicePageSeo[p.id];
      expect(seo, `« ${p.nom} » n'a pas d'entrée dans servicePageSeo`).toBeDefined();
      expect(seo.titre.length).toBeGreaterThan(10);
      expect(seo.h1.length).toBeGreaterThan(5);
    }
    // Pas d'entrée orpheline : une prestation retirée doit emporter son titre.
    expect(Object.keys(servicePageSeo).sort()).toEqual(
      prestations.map((p) => p.id).sort(),
    );
  });

  test("aucun titre ne dépasse la longueur affichée par un moteur", () => {
    for (const p of prestations) {
      const { titre } = servicePageSeo[p.id];
      expect(
        titre.length,
        `« ${titre} » fait ${titre.length} caractères : la marque sera coupée`,
      ).toBeLessThanOrEqual(LONGUEUR_MAX_TITRE);
    }
  });

  test("chaque titre porte la marque, comme toutes les autres pages", () => {
    // Ces titres sont posés en `absolute` : le gabarit de `site.ts` ne
    // s'applique pas, la marque doit donc être écrite ici. C'est exactement
    // pour ça qu'elle manquait.
    for (const p of prestations) {
      expect(servicePageSeo[p.id].titre).toContain(siteConfig.contact.person.name);
    }
  });

  test("un titre ne se réduit pas au nom de catalogue de sa prestation", () => {
    // « L'Outil » et « Le Logiciel » rangent l'offre en interne ; personne ne
    // les tape. Un titre qui redevient le nom de catalogue est la régression
    // que ce fichier existe pour empêcher.
    for (const p of prestations) {
      const { titre, h1 } = servicePageSeo[p.id];
      expect(titre, `le titre de « ${p.nom} » est retombé sur son nom`).not.toBe(
        p.nom,
      );
      expect(h1, `le titre de page de « ${p.nom} » est retombé sur son nom`).not.toBe(
        p.nom,
      );
    }
  });

  test("les trois titres et les trois titres de page sont distincts", () => {
    // Trois pages qui portent le même titre se cannibalisent : un moteur en
    // choisit une et enterre les deux autres. C'est le seul intérêt d'avoir
    // gardé trois pages plutôt qu'une.
    const titres = prestations.map((p) => servicePageSeo[p.id].titre);
    const h1 = prestations.map((p) => servicePageSeo[p.id].h1);
    expect(new Set(titres).size).toBe(titres.length);
    expect(new Set(h1).size).toBe(h1.length);
  });
});

describe("le fil d'Ariane mène quelque part", () => {
  test("ses deux marches cliquables sont des adresses servies", () => {
    // La marche « Prestations » pointe sur l'accordéon de l'accueil : il
    // n'existe pas de page `/services` nue. Déclarer à un moteur une marche
    // vers une adresse qui répond 404 est pire que ne rien déclarer.
    const chemins = contentRoutes.map((r) => r.pathname);
    expect(chemins).toContain("/");
    for (const p of prestations) {
      expect(chemins).toContain(`/services/${p.slug}`);
    }
  });

  test("ses libellés existent, et le nom accessible n'est pas vide", () => {
    const { filAriane } = servicePageLabels;
    for (const valeur of Object.values(filAriane)) {
      expect(typeof valeur).toBe("string");
      expect(valeur.length).toBeGreaterThan(0);
    }
  });
});

describe("aucun prix n'entre dans les libellés de ces pages", () => {
  test("aucun montant en euros n'est écrit à la main dans service-pages.ts", () => {
    // MÊME GARDE QUE POUR `faq.ts` ET `tarifs.ts`, et pour la même raison : un
    // montant juste le jour où on l'écrit ne se déclare faux que le jour où le
    // taux journalier bouge, c'est-à-dire en production. Ce fichier porte
    // maintenant les titres de recherche : c'est exactement le genre d'endroit
    // où « site vitrine à 3 000 € » finit par apparaître.
    //
    // LES COMMENTAIRES SONT RETIRÉS AVANT LA RECHERCHE, et c'est une différence
    // assumée avec la garde de `faq.ts`. Ce fichier documente la règle du
    // montant (« toujours séparé du chiffre : jamais "5 000 €HT" »), donc son
    // propre exemple déclenchait le test. Un exemple dans un commentaire n'est
    // rendu nulle part ; ce qui est traqué, ce sont les chaînes.
    const source = readFileSync(
      fileURLToPath(new URL("./service-pages.ts", import.meta.url)),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    const montants = source.match(/\d[\d\u00A0\u202F ]*\u20AC/gu) ?? [];
    expect(
      montants,
      `un montant en euros est écrit à la main dans service-pages.ts : ${montants.join(", ")}`,
    ).toEqual([]);
  });

  test("aucun titre ne présente un prix comme un tarif à la journée", () => {
    const vocabulaire = /taux journalier|\bTJM\b|par jour|\/\s*jour|à la journée/iu;
    const textes = prestations.flatMap((p) => [
      servicePageSeo[p.id].titre,
      servicePageSeo[p.id].h1,
    ]);
    for (const texte of textes) {
      expect(vocabulaire.test(texte), `tarif à la journée : ${texte}`).toBe(false);
      expect(/\u20AC/u.test(texte), `un montant apparaît : ${texte}`).toBe(false);
    }
  });
});
