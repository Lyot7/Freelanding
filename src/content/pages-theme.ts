/**
 * LES PAGES THÉMATIQUES, en une liste : la route de chacune, le sitemap,
 * `llms.txt`, le pied de page et les liens des piliers en sont dérivés. Règles
 * et types dans `page-theme.ts`.
 */
import { pageArtisans } from "./page-artisans";
import { pageAutomatisation } from "./page-automatisation";
import { pageCto } from "./page-cto";
import { pageErp } from "./page-erp";
import { pageGmao } from "./page-gmao";
import { pageIaCaen } from "./page-ia-caen";
import type { IdPageTheme, PageTheme } from "./page-theme";

export const pagesTheme: readonly PageTheme[] = [
  pageErp,
  pageGmao,
  pageAutomatisation,
  pageArtisans,
  pageIaCaen,
  pageCto,
];

/** Une page par identifiant, pour que les routes ne dépendent pas de l'ordre. */
export const pageTheme = (id: IdPageTheme): PageTheme => {
  const trouvee = pagesTheme.find((p) => p.id === id);
  if (!trouvee) throw new Error(`Page thématique inconnue : ${id}`);
  return trouvee;
};
