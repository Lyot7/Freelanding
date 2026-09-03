/**
 * 404 des pages du site : rendu quand une page appelle `notFound()` (slug de
 * projet, d'article ou de mention légale inconnu). Il s'affiche DANS le layout
 * `(site)`, donc avec le document, les styles et la navigation du site.
 *
 * Les URL qui ne correspondent à aucune route, elles, sont servies par
 * `src/app/global-not-found.tsx` : voir l'entête de `NotFoundView`.
 */
import { NotFoundView } from "./NotFoundView";

export default function NotFound() {
  return <NotFoundView />;
}
