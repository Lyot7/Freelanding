/**
 * Dépixelisation d'une image à sa première apparition (voir `ImageProgressive`).
 *
 * Motif relevé sur locomotive.ca (`data-depixelate`) : l'image, une fois
 * chargée, est redessinée en 8, 16, 32, 48, 96 puis 128 colonnes, 100 ms par
 * étape, avant d'apparaître nette. L'effet se joue APRÈS le chargement : c'est
 * le préchargement qui fait qu'il démarre sans attente à l'entrée dans l'écran.
 */
export const COLONNES = [8, 16, 32, 48, 96, 128] as const;

/** Durée d'affichage de chaque étape, en millisecondes. */
export const DUREE_ETAPE = 100;

/**
 * Largeur servie par l'optimiseur pour l'attente, quand l'image n'est pas
 * encore arrivée à l'entrée dans l'écran. Prise dans les `imageSizes` par
 * défaut de Next 16 : une autre largeur serait refusée par `/_next/image`.
 */
export const LARGEUR_ATTENTE = 32;

/**
 * Étapes à jouer. Si l'attente a déjà montré l'image en `LARGEUR_ATTENTE`
 * colonnes, on repart au-dessus : revenir à 8 colonnes serait un recul.
 */
export function etapesAJouer(dejaAffichee: number | null): number[] {
  return COLONNES.filter((colonnes) => dejaAffichee === null || colonnes > dejaAffichee);
}

/**
 * Taille de la miniature pour `colonnes` colonnes, au rapport de l'image.
 * Jamais sous un pixel ; rapport inconnu (image vide) : carré.
 */
export function tailleMiniature(
  colonnes: number,
  largeur: number,
  hauteur: number,
): { largeur: number; hauteur: number } {
  const rapport = largeur > 0 && hauteur > 0 ? hauteur / largeur : 1;
  return { largeur: colonnes, hauteur: Math.max(1, Math.round(colonnes * rapport)) };
}

/**
 * Largeur affichée sous laquelle on ne dépixelise pas : avatars, logos,
 * vignettes. À cette taille, 8 colonnes ne se lisent pas comme une image.
 */
export const LARGEUR_MIN_EFFET = 80;
