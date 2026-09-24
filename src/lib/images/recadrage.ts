/**
 * Zone source à copier d'une vidéo `largeur × hauteur` pour remplir une toile
 * `toileL × toileH` comme le ferait `object-fit: cover`, centrée.
 */
export function recadrageCover(
  largeur: number,
  hauteur: number,
  toileL: number,
  toileH: number,
): { x: number; y: number; l: number; h: number } | null {
  if (largeur <= 0 || hauteur <= 0 || toileL <= 0 || toileH <= 0) return null;
  const echelle = Math.max(toileL / largeur, toileH / hauteur);
  const l = toileL / echelle;
  const h = toileH / echelle;
  return { x: (largeur - l) / 2, y: (hauteur - h) / 2, l, h };
}
