/**
 * Adresse du bouton « source préférée » de Google.
 *
 * Ce que la fonctionnalité fait réellement : un visiteur connecté qui clique
 * déclare à Google vouloir voir ce site plus souvent. SES résultats le mettent
 * alors en avant, badge compris, jusque dans AI Mode et les AI Overviews. Ça ne
 * change rien pour les autres : c'est un abonnement, pas un signal de classement.
 *
 * Deux règles de Google encadrent le paramètre :
 * - seuls les domaines et sous-domaines sont éligibles, jamais un
 *   sous-répertoire (`example.com/blog` est refusé) ;
 * - le paramètre attend le domaine NU, sans protocole ni `www.`.
 *
 * La valeur est dérivée de l'adresse du site plutôt que saisie à la main : une
 * adresse recopiée est une occasion de plus de publier un lien mort.
 */
export function preferredSourceUrl(siteUrl: string): string | null {
  let host: string;
  try {
    host = new URL(siteUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  // En local, `SITE_URL` retombe sur localhost : un bouton vers `?q=localhost`
  // n'aurait aucun sens, et le rendre visible en développement ferait croire
  // qu'il est configuré.
  if (host === "localhost" || host.endsWith(".local") || !host.includes(".")) {
    return null;
  }

  return `https://www.google.com/preferences/source?q=${host}`;
}
