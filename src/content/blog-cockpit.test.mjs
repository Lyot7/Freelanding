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
  alt: "Une spirale de traits blancs sur fond noir, le tour de l’année en cours surligné en vert",
  validationId: "00000000-0000-4000-8000-000000000001",
};

describe("articles du cockpit", () => {
  test("ont leur propre visuel, nommé d'après leur slug, jamais celui d'un autre article", () => {
    const [article] = articlesDuCockpit(blogPosts, [entree]);
    expect(article.cover.src).toBe("/images/blog/prix-site-vitrine-caen.jpg");
    expect(article.heroImage.src).toBe("/images/heros/blog-prix-site-vitrine-caen.jpg");
    expect(article.seo.ogImage.src).toBe("/images/og-blog-prix-site-vitrine-caen.jpg");
    expect(article.heroImage.og).toEqual(article.seo.ogImage);
    expect(article.cover.alt).toBe(entree.alt);
    expect(article.heroImage.alt).toBe(entree.alt);
    const autres = blogPosts.flatMap((p) => [p.cover.src, p.heroImage?.src]);
    expect(autres).not.toContain(article.heroImage.src);
    expect(autres).not.toContain(article.cover.src);
    expect(article.excerpt).toBe(entree.description);
    expect(article.seo.description).toBe(entree.description);
    expect(article.listedInIndex).toBe(true);
    expect(article.author.name).toBe("Eliott Bouquerel");
  });

  test("la date de réécriture passe au BlogPost, et son absence n'ajoute aucune clé", () => {
    const [avec] = articlesDuCockpit(blogPosts, [{ ...entree, updated: "2026-10-21" }]);
    expect(avec.updated).toBe("2026-10-21");
    const [sans] = articlesDuCockpit(blogPosts, [entree]);
    expect("updated" in sans).toBe(false);
  });

  test("un visuel sans texte de remplacement casse le build au lieu de laisser une image muette", () => {
    expect(() => articlesDuCockpit(blogPosts, [{ ...entree, alt: " " }])).toThrow("visuel sans texte de remplacement");
  });

  test("sans article publié pour en reprendre l'auteur, le registre le dit", () => {
    expect(() => articlesDuCockpit([], [entree])).toThrow("Registre du blog vide");
  });

  test("le registre publié ne porte chaque slug qu'une fois", () => {
    const slugs = blogPosts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
