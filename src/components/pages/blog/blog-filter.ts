import type { BlogPost } from "@/lib/content/types";

/**
 * Sentinelle « tout afficher ».
 *
 * Le filtre comparait auparavant la catégorie active à la chaîne littérale
 * « All ». Le libellé de l'onglet vit dans la donnée (`blogContent.categories[0]`,
 * aujourd'hui « Tous ») : dès qu'il est traduit, la comparaison échoue, la
 * catégorie « Tous » ne correspond à aucun article et la grille se vide.
 * L'état « tout afficher » n'est donc plus identifié par un LIBELLÉ mais par
 * cette valeur dédiée, ce qui rend l'onglet librement traduisible.
 * C'est le premier onglet de `blogContent.categories` qui la porte.
 */
export const ALL_BLOG_CATEGORIES = null;

/** Catégorie active : un libellé de `blogContent.categories`, ou la sentinelle. */
export type BlogCategoryFilter = string | typeof ALL_BLOG_CATEGORIES;

export function filterBlogPosts(
  posts: readonly BlogPost[],
  category: BlogCategoryFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("en");

  return posts.filter((post) => {
    const matchesCategory =
      category === ALL_BLOG_CATEGORIES ||
      post.category.toLocaleLowerCase("en") === category.toLocaleLowerCase("en");
    const matchesQuery =
      normalizedQuery.length === 0 ||
      post.title.toLocaleLowerCase("en").includes(normalizedQuery) ||
      post.author.name.toLocaleLowerCase("en").includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
