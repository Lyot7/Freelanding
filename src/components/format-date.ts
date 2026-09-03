import { uiLabels } from "@/content/ui";

/**
 * Formatage des dates affichées — SOURCE UNIQUE.
 *
 * Quatre composants (`BlogIndexPage`, `BlogArticlePage`, `ArticleCard`,
 * `LegalPageView`) portaient chacun leur propre `formatDate()`, avec un tableau
 * de noms de mois ANGLAIS recopié à l'identique. Les noms de mois viennent
 * désormais de `uiLabels.dates` (`src/content/ui.ts`), qui les stocke en casse
 * de titre : les emplacements qui les affichent en capitales le font au RENDU
 * (`uppercase` Tailwind, déjà en place), la donnée n'est jamais transformée
 * ici. Les accents survivent à `text-transform: uppercase` (« FÉVRIER »).
 *
 * DEUX formats, comme sur la source :
 *   - blog (listing, cartes, articles liés) : mois ABRÉGÉ (« 1 Janv 2026 ») ;
 *   - pages légales : mois EN TOUTES LETTRES (« 1 Janvier 2026 »).
 * L'ordre est celui du français (jour, mois, année), là où le template
 * anglophone écrivait « JAN 1, 2026 ».
 *
 * Parse manuel de la chaîne ISO, jamais `new Date` : rendu SSR déterministe,
 * zéro dérive de fuseau horaire.
 */
function formatWithMonths(iso: string, months: readonly string[]): string {
  const [year, month, day] = iso.split("-");
  const monthName = months[Number(month) - 1] ?? months[0];
  return `${Number(day)} ${monthName} ${year}`;
}

/** « 1 Janv 2026 » — mois abrégé. Format du blog. */
export function formatShortDate(iso: string): string {
  return formatWithMonths(iso, uiLabels.dates.monthsAbbreviated);
}

/** « 1 Janvier 2026 » — mois en toutes lettres. Format des pages légales. */
export function formatLongDate(iso: string): string {
  return formatWithMonths(iso, uiLabels.dates.monthsFull);
}
