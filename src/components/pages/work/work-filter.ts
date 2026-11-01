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
): readonly WorkItem[] {
  const normalizedFilter =
    activeFilter === null ? null : normalize(activeFilter);

  return works.filter(
    (work) =>
      normalizedFilter === null ||
      normalizedFilter.length === 0 ||
      work.categories.map(normalize).includes(normalizedFilter),
  );
}
