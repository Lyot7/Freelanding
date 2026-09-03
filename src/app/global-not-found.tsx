/**
 * 404 des URL qui ne correspondent à AUCUNE route.
 *
 * Pourquoi ce fichier existe : le layout du site vit dans le groupe `(site)`,
 * `src/app/` n'a donc pas de `layout.tsx` à la racine. Next n'a plus de
 * layout unique dans lequel composer un 404 global et retombe sur sa page
 * intégrée. `global-not-found` est la sortie prévue par cette version : elle
 * court-circuite le rendu normal, doit donc rendre le document COMPLET et
 * importer elle-même les feuilles globales. Activée par
 * `experimental.globalNotFound` dans `next.config.ts`.
 *
 * Le contenu et le document sont ceux du site, à l'identique : `SiteDocument` et
 * `NotFoundView` sont les mêmes modules que ceux du layout et du 404 de `(site)`.
 */
import { NotFoundView } from "./(site)/NotFoundView";
import { SITE_METADATA, SiteDocument } from "./(site)/SiteDocument";
import "./globals.css";
import "./focus.css";

export const metadata = SITE_METADATA;

export default function GlobalNotFound() {
  return (
    <SiteDocument>
      <NotFoundView />
    </SiteDocument>
  );
}
