import { describe, expect, test } from "bun:test";
import {
  articleSchema,
  businessSchema,
  collectionSchema,
  datasetSchema,
  personSchema,
  profilePageSchema,
} from "./json-ld.ts";
import { homeContent } from "../content/home.ts";
import { prestation } from "../content/offre.ts";
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

  test("déclare le plancher du logiciel, un prix de projet, sans unité mensuelle", () => {
    // Le CTO à temps partagé, seule offre mensuelle, a quitté le site le
    // 2026-10-31 : plus aucune offre ne déclare `unitCode`.
    const offres = business.hasOfferCatalog.itemListElement;
    expect(offres).toHaveLength(homeContent.services.items.length);
    expect(offres.map((offre) => offre.name)).toEqual([prestation("logiciel").nom]);
    for (const offre of offres) {
      expect(offre.priceSpecification["@type"]).toBe("PriceSpecification");
      expect(offre.priceSpecification.minPrice).toBe(prestation("logiciel").plancher);
      expect(offre.priceSpecification).not.toHaveProperty("unitCode");
    }
  });

  test("déclare son logo en ImageObject dimensionné, en URL absolue", () => {
    expect(business.logo["@type"]).toBe("ImageObject");
    expect(business.logo.url).toMatch(/^https?:\/\/[^/]+\//);
    expect(business.logo.width).toBeGreaterThanOrEqual(112);
    expect(business.logo.height).toBeGreaterThanOrEqual(112);
  });
});

describe("JSON-LD du hub des métiers", () => {
  test("liste les pages dans l'ordre affiché, en URL absolues", () => {
    const hub = collectionSchema("Logiciels par métier", "Description", "/logiciel-metier", [
      { libelle: "Échafaudage", chemin: "/logiciel-metier/echafaudage" },
      { libelle: "Centre de pneus", chemin: "/logiciel-metier/centre-de-pneus" },
    ]);
    expect(hub["@type"]).toBe("CollectionPage");
    expect(hub.url).toMatch(/^https?:\/\/[^/]+\/logiciel-metier$/u);
    expect(hub.mainEntity["@type"]).toBe("ItemList");
    expect(hub.mainEntity.itemListElement.map((e) => [e.position, e.name])).toEqual([
      [1, "Échafaudage"],
      [2, "Centre de pneus"],
    ]);
    for (const element of hub.mainEntity.itemListElement) {
      expect(element.url).toMatch(/^https?:\/\/[^/]+\/logiciel-metier\/[a-z-]+$/u);
    }
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
  const base = {
    slug: "exemple",
    title: "Exemple",
    date: "2026-09-01",
    excerpt: "Résumé",
    cover: { src: "/images/exemple.jpg" },
  };

  test("dateModified vaut la date de réécriture quand elle existe", () => {
    const [article] = articleSchema({ ...base, updated: "2026-10-16" }, siteConfig);
    expect(article.datePublished).toBe("2026-09-01");
    expect(article.dateModified).toBe("2026-10-16");
  });

  test("dateModified retombe sur la date de publication sans réécriture", () => {
    const [article] = articleSchema(base, siteConfig);
    expect(article.dateModified).toBe("2026-09-01");
  });
});

describe("JSON-LD de la personne, portrait", () => {
  test("pose le portrait quand il existe, et rien sinon", () => {
    expect(personSchema(siteConfig).image).toContain(siteConfig.contact.person.avatar?.src ?? "absent");
    const sansPortrait = {
      ...siteConfig,
      contact: { ...siteConfig.contact, person: { ...siteConfig.contact.person, avatar: undefined } },
    };
    expect(personSchema(sansPortrait).image).toBeUndefined();
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
