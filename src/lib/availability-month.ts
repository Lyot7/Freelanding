/**
 * Mois affiché par la jauge de créneaux.
 *
 * POURQUOI CE FICHIER EXISTE. Le libellé était écrit en dur dans
 * `siteConfig.availability` (« CRÉNEAUX EN AOÛT »). Un mois écrit à la main ne
 * se périme pas bruyamment : il reste juste faux, sur toutes les pages, jusqu'à
 * ce que quelqu'un le remarque. Et sur une page qui annonce une disponibilité
 * commerciale, un mois périmé dit exactement le contraire de ce qu'il veut dire.
 *
 * LA RÈGLE DU 20. À partir du 20, on affiche le mois SUIVANT. Un créneau
 * annoncé le 27 août ne se prend plus en août : le temps de l'échange, du devis
 * et de l'acompte, on démarre en septembre. Annoncer le mois courant en fin de
 * mois promet une disponibilité qui n'existe déjà plus.
 *
 * FUSEAU. Le mois est celui d'Eliott, pas celui du visiteur — même choix que
 * `LocalClock` pour l'heure locale. Un visiteur à Nouméa ne doit pas voir
 * « SEPTEMBRE » douze heures avant tout le monde.
 */

/** Fuseau de repli, identique à celui de `LocalClock`. */
export const FUSEAU_PAR_DEFAUT = "Europe/Paris";

/** Jour du mois à partir duquel on bascule sur le mois suivant. */
export const JOUR_DE_BASCULE = 20;

/**
 * Nom du mois à afficher, en capitales, pour l'instant donné.
 *
 * Passer `maintenant` en argument plutôt que d'appeler `new Date()` ici n'est
 * pas une coquetterie de testabilité : c'est ce qui permet au serveur et au
 * client de calculer la MÊME valeur au premier rendu, et donc d'éviter un écart
 * d'hydratation (voir `MoisCreneaux`).
 */
export function moisDesCreneaux(
  maintenant: Date,
  fuseau: string = FUSEAU_PAR_DEFAUT,
): string {
  // Le jour et le mois se lisent DANS LE FUSEAU visé, jamais via les accesseurs
  // locaux de `Date` : à 23 h à Paris, un serveur en UTC est encore la veille.
  const parties = new Intl.DateTimeFormat("fr-FR", {
    timeZone: fuseau,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(maintenant);

  const lire = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parties.find((p) => p.type === type)?.value);

  const jour = lire("day");
  const mois = lire("month");
  const annee = lire("year");

  // `Date.UTC` avec un mois qui déborde (12 → janvier de l'année suivante) est
  // géré par la spécification : pas de cas particulier à écrire pour décembre.
  const moisAffiche = jour >= JOUR_DE_BASCULE ? mois : mois - 1;
  const cible = new Date(Date.UTC(annee, moisAffiche, 1));

  const nom = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    month: "long",
  }).format(cible);

  // Capitales : le libellé est stocké en capitales dans la donnée, et c'est la
  // CHAÎNE qui sert de repère à l'emphase, pas le rendu. Un `text-transform`
  // CSS ne changerait pas la chaîne.
  return nom.toLocaleUpperCase("fr-FR");
}

/** Marque substituée par le mois dans le libellé de la donnée. */
export const MARQUE_MOIS = "{mois}";
