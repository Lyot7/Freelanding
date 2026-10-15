import { describe, expect, test } from "bun:test";
import { articlesDuCockpit } from "./blog-cockpit.ts";
import { blogPosts } from "./blog.ts";

/**
 * Les articles validés dans le cockpit deviennent des `BlogPost` complets :
 * visuels empruntés à un article publié, description servie deux fois
 * (extrait de l'index et description de recherche).
 */
const entree = {
  slug: "prix-site-vitrine-caen",
  title: "Prix d’un site vitrine à Caen",
  date: "2026-10-20",
  category: "Méthode",
  description:
    "Ce que coûte un site vitrine à Caen en 2026, poste par poste, et ce qui fait varier le devis.",
  readingTime: "7 min de lecture",
  visuelDe: "refonte-site-internet-pme",
  validationId: "00000000-0000-4000-8000-000000000001",
};

describe("articles du cockpit", () => {
  test("reprennent couverture, héros et image de partage de l'article nommé", () => {
    const [article] = articlesDuCockpit(blogPosts, [entree]);
    const modele = blogPosts.find((p) => p.slug === "refonte-site-internet-pme");
    expect(article.cover).toEqual(modele.cover);
    expect(article.heroImage).toEqual(modele.heroImage);
    expect(article.seo.ogImage).toEqual(modele.seo.ogImage);
    expect(article.excerpt).toBe(entree.description);
    expect(article.seo.description).toBe(entree.description);
    expect(article.listedInIndex).toBe(true);
    expect(article.author.name).toBe("Eliott Bouquerel");
  });

  test("un visuel introuvable casse le build au lieu de laisser un cadre vide", () => {
    expect(() => articlesDuCockpit(blogPosts, [{ ...entree, visuelDe: "inconnu" }])).toThrow(
      "visuel emprunté à inconnu",
    );
  });

  test("le registre publié ne porte chaque slug qu'une fois", () => {
    const slugs = blogPosts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
