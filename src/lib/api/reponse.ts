/**
 * Briques communes aux routes d'API du site.
 *
 * POURQUOI CE FICHIER EXISTE. Ces quatre fonctions vivaient en privé dans
 * `src/app/api/contact/route.ts`. À la deuxième route qui en avait besoin
 * (`/api/rendez-vous`), la question n'était plus « faut-il factoriser » mais
 * « combien de copies de la politique d'en-têtes veut-on maintenir ». Une
 * copie qui dérive est une garantie qui ment : le jour où l'on ajoute un
 * en-tête de sécurité, il doit atterrir sur TOUTES les routes.
 *
 * Le raisonnement derrière chaque règle est conservé au plus près de la règle.
 */
import { createHash } from "node:crypto";

/**
 * Empreinte tronquée d'une valeur, pour le journal serveur.
 *
 * Ni l'adresse IP ni l'adresse e-mail n'ont à figurer en clair dans un journal
 * d'application : il est lu par des outils tiers, archivé et rarement purgé.
 * Dix caractères suffisent à recouper deux lignes entre elles.
 */
export function empreinte(valeur: string): string {
  return createHash("sha256").update(valeur).digest("hex").slice(0, 10);
}

/**
 * Journal d'une route, préfixé par son nom.
 *
 * `console.error` et non `console.log` : ces lignes doivent sortir sur le flux
 * d'erreur pour être ramassées par l'hébergeur.
 */
export function creerJournal(
  prefixe: string,
): (evenement: string, details: Record<string, string | number>) => void {
  return (evenement, details) => {
    console.error(`[${prefixe}] ${evenement}`, JSON.stringify(details));
  };
}

/**
 * Réponse JSON, toujours avec les mêmes en-têtes.
 *
 * `no-store` interdit à un mandataire de garder la réponse ; `nosniff` empêche
 * un navigateur de réinterpréter le JSON en HTML. Le site ne pose aucun en-tête
 * de sécurité global (`next.config.ts` n'a pas de `headers()`) : au minimum,
 * ces routes posent les leurs.
 */
export function json(
  charge: Record<string, unknown>,
  statut: number,
  entetes: Readonly<Record<string, string>> = {},
): Response {
  return new Response(JSON.stringify(charge), {
    status: statut,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...entetes,
    },
  });
}

/**
 * Refuse une requête dont l'origine n'est pas notre propre site.
 *
 * Complément du `content-type: application/json` exigé par les routes qui
 * écrivent : un formulaire HTML d'un site tiers ne peut poster qu'en
 * `urlencoded`, `multipart` ou `text/plain`, et une requête `fetch`
 * cross-origine en JSON est soumise au contrôle préalable CORS, qu'aucune de
 * ces routes n'autorise. Les deux ensemble couvrent le besoin sans jeton
 * anti-CSRF, inutile ici : elles n'exposent aucune session et n'agissent sur
 * aucun compte.
 *
 * Une requête SANS en-tête `origin` (curl, robot) n'est pas refusée à ce
 * stade : c'est le captcha qui tranche sur les routes qui écrivent.
 */
export function origineEtrangere(requete: Request): boolean {
  const origine = requete.headers.get("origin");
  if (!origine) return false;
  try {
    return new URL(origine).host !== new URL(requete.url).host;
  } catch {
    return true;
  }
}
