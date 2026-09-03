import type { WorkItem } from "@/lib/content";

/**
 * Filtre actif de l'archive des projets.
 *
 * `null` = « tout afficher », aucune contrainte de catégorie.
 *
 * ATTENTION, c'est le point important : le filtre « tout afficher » n'est PAS
 * identifié par son LIBELLÉ. La comparaison précédente portait sur la chaîne
 * littérale « All », ce qui interdisait de traduire le premier onglet : le
 * renommer en « Tous » aurait vidé la page `/work` au chargement, sans aucune
 * erreur TypeScript. Le libellé est éditorial (il vit dans `work.ts`), il doit
 * pouvoir changer de langue sans casser le filtrage.
 */
export type WorkCategoryFilter = string | null;

/** Valeur du filtre qui désactive le filtrage par catégorie. */
export const ALL_WORKS: WorkCategoryFilter = null;

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function filterWorks(
  works: readonly WorkItem[],
  activeFilter: WorkCategoryFilter,
  query: string,
): readonly WorkItem[] {
  const normalizedFilter =
    activeFilter === null ? null : normalize(activeFilter);
  const normalizedQuery = normalize(query);

  return works.filter((work) => {
    const normalizedCategories = work.categories.map(normalize);
    const matchesCategory =
      normalizedFilter === null ||
      normalizedFilter.length === 0 ||
      normalizedCategories.includes(normalizedFilter);
    const searchableText = normalize(
      [work.title, work.client, ...work.categories]
        .filter((value): value is string => Boolean(value))
        .join(" "),
    );
    const matchesQuery =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
