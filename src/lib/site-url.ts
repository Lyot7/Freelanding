/**
 * URL publique du site, source unique.
 *
 * Elle sert à trois endroits qui la déclaraient chacun de leur côté : les URL
 * canoniques et Open Graph (`SiteDocument`), le sitemap et le robots.txt.
 *
 * La valeur de secours est volontairement `http://localhost:3000`. La version
 * précédente retombait sur l'adresse du site Framer d'origine : sans variable
 * d'environnement, le site publiait donc des canoniques et un sitemap pointant
 * vers le template. Une adresse locale est fausse de façon évidente et se
 * détecte au premier contrôle, là où une adresse plausible passe inaperçue.
 *
 * En production, `NEXT_PUBLIC_SITE_URL` doit être renseignée avec
 * `https://www.eliottbouquerel.fr` (domaine arrêté : eliottbouquerel.fr, servi
 * sur le sous-domaine www).
 *
 * LA CHAÎNE VIDE COMPTE COMME ABSENTE. La garde était écrite avec `??`, qui ne
 * retient que `undefined` et `null` : une variable DÉCLARÉE mais vide passait
 * donc telle quelle, et `new URL(chemin, "")` lève `TypeError: Invalid URL`.
 * Toute la page tombait alors en 500, dès `buildSiteMeta`. Ce n'est pas un cas
 * théorique : `.env.example` livre précisément la ligne `NEXT_PUBLIC_SITE_URL=`
 * sans valeur, donc quiconque le copie en `.env.local` cassait le site. Un
 * espace seul suffisait aussi, d'où le `trim()`.
 */
const SITE_URL_ENV = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL =
  SITE_URL_ENV && SITE_URL_ENV.length > 0
    ? SITE_URL_ENV
    : "http://localhost:3000";

/** Construit une URL absolue à partir d'un chemin du site. */
export function absoluteUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).href;
}
