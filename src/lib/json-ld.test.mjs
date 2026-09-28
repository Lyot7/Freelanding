import { describe, expect, test } from "bun:test";
import { articleSchema, businessSchema } from "./json-ld.ts";
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
