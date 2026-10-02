import { describe, expect, test } from "bun:test";
import {
  articleSchema,
  businessSchema,
  datasetSchema,
  personSchema,
  profilePageSchema,
} from "./json-ld.ts";
import { homeContent } from "../content/home.ts";
import { siteConfig } from "../content/site.ts";

/**
 * Champs relevés manquants ou mal typés par le test des résultats enrichis
 * Google le 2026-09-28 (audit SEO, fichier 08).
 */
describe("JSON-LD de l'entité", () => {
  const business = businessSchema(siteConfig, homeContent);

  test("porte une adresse de ville, sans rue, et une gamme de prix", () => {
    expect(business.priceRange).toBe("€€€");
    expect(business.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Caen",
      postalCode: "14000",
      addressRegion: "Normandie",
      addressCountry: "FR",
    });
    expect(business.address).not.toHaveProperty("streetAddress");
  });

  test("déclare son logo en ImageObject dimensionné, en URL absolue", () => {
    expect(business.logo["@type"]).toBe("ImageObject");
    expect(business.logo.url).toMatch(/^https?:\/\/[^/]+\//);
    expect(business.logo.width).toBeGreaterThanOrEqual(112);
    expect(business.logo.height).toBeGreaterThanOrEqual(112);
  });
});

describe("JSON-LD d'un article", () => {
  test("décrit son éditeur avec un nom et un logo ImageObject", () => {
    const [article] = articleSchema(
      {
        slug: "exemple",
        title: "Exemple",
        date: "2026-09-01",
        excerpt: "Résumé",
        cover: { src: "/images/exemple.jpg" },
      },
      siteConfig,
    );
    expect(article.publisher.name).toBe(siteConfig.contact.person.name);
    expect(article.publisher.logo["@type"]).toBe("ImageObject");
    expect(article.publisher.logo.url).toMatch(/^https?:\/\/.+\/apple-icon\.png$/);
  });
});

describe("JSON-LD de la page à propos", () => {
  test("désigne la personne du site, profils externes compris", () => {
    const person = personSchema(siteConfig);
    expect(profilePageSchema().mainEntity).toEqual({ "@id": person["@id"] });
    expect(person.sameAs).toContain("https://www.linkedin.com/in/eliott-bouquerel");
    expect(person.sameAs).toContain("https://github.com/Lyot7");
  });
});

describe("JSON-LD d'une étude chiffrée", () => {
  const dataset = {
    name: "Jeu d'exemple",
    description: "Indicateurs agrégés",
    license: "https://creativecommons.org/licenses/by/4.0/deed.fr",
    temporalCoverage: "2026-07-19/2026-09-01",
    spatialCoverage: "Normandie",
    variableMeasured: ["Part des fiches sans site"],
  };
  const auteur = { name: siteConfig.contact.person.name };

  test("un article sans jeu de données n'ajoute aucun nœud", () => {
    expect(datasetSchema({ slug: "exemple", author: auteur })).toEqual([]);
  });

  test("le jeu de données est relié à l'article et à la personne du site", () => {
    const [noeud] = datasetSchema({ slug: "exemple", author: auteur, dataset });
    const [article] = articleSchema(
      {
        slug: "exemple",
        title: "Exemple",
        date: "2026-10-02",
        excerpt: "Résumé",
        cover: { src: "/images/exemple.jpg" },
      },
      siteConfig,
    );
    expect(noeud["@type"]).toBe("Dataset");
    expect(noeud.subjectOf).toEqual({ "@id": article["@id"] });
    expect(noeud.creator["@id"]).toBe(personSchema(siteConfig)["@id"]);
    expect(noeud.license).toBe(dataset.license);
    expect(noeud.isAccessibleForFree).toBe(true);
    expect(noeud.spatialCoverage).toEqual({ "@type": "Place", name: "Normandie" });
  });
});
