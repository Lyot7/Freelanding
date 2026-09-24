/**
 * Événement émis sur `window` quand la page est finie et au repos : les
 * calques à image de fond (`ParallaxBackdrop`), que le navigateur ne sait pas
 * différer seul, chargent alors leur image d'avance.
 */
export const EVENEMENT_PRECHARGEMENT = "prechargement:images";

/**
 * Préfixes jamais préchargés : ce ne sont pas des pages. `/r/` compte un clic
 * puis redirige, `/ingest/` relaie la mesure d'audience.
 */
const PREFIXES_EXCLUS = ["/api/", "/r/", "/ingest/"];

/** Un dernier segment avec extension désigne un fichier (`/cv.pdf`), pas une page. */
const FICHIER = /\/[^/]*\.[a-z0-9]+$/i;

/**
 * Routes internes à précharger parmi les `href` d'une page : sans ancre, sans
 * doublon, sans la page courante ni les liens qui ne mènent pas à une page.
 */
export function routesAPrecharger(
  hrefs: ReadonlyArray<string | null>,
  cheminActuel: string,
): string[] {
  const routes = new Set<string>();
  for (const href of hrefs) {
    if (!href?.startsWith("/") || href.startsWith("//")) continue;
    const route = href.split("#")[0];
    const chemin = route.split("?")[0];
    if (chemin === cheminActuel && route === chemin) continue;
    if (PREFIXES_EXCLUS.some((prefixe) => chemin.startsWith(prefixe))) continue;
    if (FICHIER.test(chemin)) continue;
    routes.add(route);
  }
  return [...routes];
}

/** Sous-ensemble de `navigator.connection` (API absente de Safari et Firefox). */
export type Connexion = { saveData?: boolean; effectiveType?: string };

/**
 * Réseau sur lequel on ne précharge rien d'avance : mode économie de données,
 * ou débit mesuré en 3G ou moins. Ce qui n'a pas été vu n'a pas à être payé.
 * Faute d'API, on précharge.
 */
export function reseauEconome(connexion: Connexion | undefined): boolean {
  if (!connexion) return false;
  return (
    connexion.saveData === true ||
    /^(slow-2g|2g|3g)$/.test(connexion.effectiveType ?? "")
  );
}
