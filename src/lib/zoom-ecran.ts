/**
 * Facteur de `zoom` appliqué à `body` sur les grands écrans (`--zoom-ecran`
 * dans `globals.css`), 1 en dessous de 2048 px.
 *
 * À diviser par lui toute mesure en pixels affichés (`getBoundingClientRect`,
 * `scrollY`) qu'on réinjecte dans un style en pixels de mise en page, que le
 * zoom multiplierait une seconde fois.
 */
export function lireZoomEcran(): number {
  if (typeof document === "undefined") return 1;
  const valeur = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--zoom-ecran"),
  );
  return Number.isFinite(valeur) && valeur > 0 ? valeur : 1;
}
