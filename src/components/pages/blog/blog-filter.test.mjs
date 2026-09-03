import { describe, expect, test } from "bun:test";
import { ALL_BLOG_CATEGORIES, filterBlogPosts } from "./blog-filter.ts";

const posts = [
  { title: "Notes de conversion", category: "Stratégie", author: { name: "Anna" } },
  { title: "Systèmes de mise en page", category: "Design", author: { name: "Liam" } },
];

describe("filterBlogPosts", () => {
  test("combines the source category tabs with title search", () => {
    expect(filterBlogPosts(posts, "Design", "")).toHaveLength(1);
    expect(filterBlogPosts(posts, ALL_BLOG_CATEGORIES, "anna")).toHaveLength(1);
    expect(filterBlogPosts(posts, "Stratégie", "layout")).toHaveLength(0);
  });

  test("the reset tab is the sentinel, never a display label", () => {
    // L'onglet « tout afficher » ne doit JAMAIS être reconnu à son libellé :
    // celui-ci vit dans `blogContent.categories[0]` et il est traduit (« Tous »,
    // « All »…). Seule la sentinelle réinitialise le filtre ; un libellé, quel
    // qu'il soit, reste une catégorie à comparer aux articles.
    expect(filterBlogPosts(posts, ALL_BLOG_CATEGORIES, "")).toHaveLength(2);
    expect(filterBlogPosts(posts, "Tous", "")).toHaveLength(0);
    expect(filterBlogPosts(posts, "All", "")).toHaveLength(0);
  });
});
