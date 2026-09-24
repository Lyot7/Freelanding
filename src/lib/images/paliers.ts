/**
 * Paliers de l'apparition pixelisée (voir `ImageProgressive`).
 *
 * Largeurs prises dans les `imageSizes` par défaut de l'optimiseur de Next 16
 * (32, 48, 64, 96, 128, 256, 384) : une largeur hors de cette liste est refusée
 * par `/_next/image`. Un facteur 3 à 4 entre deux paliers se lit comme une
 * mise au point ; plus serré, l'œil ne voit pas la différence.
 * Poids relevés en AVIF : environ 0,3 Ko, 1,5 Ko et 12 Ko.
 */
export const PALIERS = [32, 96, 384] as const;

/**
 * Temps d'affichage minimal d'un palier, en millisecondes. Sur une bonne
 * connexion les trois paliers arrivent dans la même trame : sans ce plancher
 * ils s'écraseraient et l'on ne verrait qu'un saut.
 */
export const DUREE_MIN_PALIER = 110;

/**
 * Paliers utiles pour une image rendue sur `largeurPhysique` pixels d'écran.
 * Un palier doit rester au moins deux fois plus petit que l'image finale :
 * au-delà, il ne se distingue plus d'elle et coûte une requête pour rien.
 * Une vignette ne reçoit donc aucun palier.
 */
export function paliersPour(largeurPhysique: number): number[] {
  if (!Number.isFinite(largeurPhysique) || largeurPhysique <= 0) return [];
  return PALIERS.filter((largeur) => largeur * 2 <= largeurPhysique);
}

/** Attente à observer avant d'afficher un palier déjà chargé. */
export function attenteAvantPalier(
  ecouleDepuisPrecedent: number,
  dureeMin: number,
): number {
  return Math.max(0, dureeMin - ecouleDepuisPrecedent);
}
