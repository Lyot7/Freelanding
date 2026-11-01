/**
 * LE TEMPO DU SITE : deux courbes, cinq durées, mêmes valeurs en variables CSS
 * (`--courbe-sortie`, `--courbe-vive`). Trois gestes seulement, tirés de
 * l'horlogerie : le masque pour les titres, le trait pour les filets, le cran
 * pour les chiffres.
 */
export const COURBE = {
  sortie: [0.16, 1, 0.3, 1],
  vive: [0.23, 1, 0.32, 1],
} as const;

export const DUREE = {
  tap: 0.16,
  survol: 0.28,
  texte: 0.42,
  titre: 0.8,
  image: 1.1,
} as const;
