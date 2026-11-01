export const DUREE_CADRAN = 2.4;
export const RETARD_CADRAN = 0.6;

/** « 11 h 00 », deux chiffres aux minutes : le chiffre ne change pas de largeur. */
export function formatHeure(minutes: number): string {
  const entier = Math.round(minutes);
  const heures = Math.floor(entier / 60);
  const reste = String(entier % 60).padStart(2, "0");
  return `${heures} h ${reste}`;
}

/** Le point du cadran à une heure donnée, sur un cadran de douze heures. */
export function pointSurCadran(minutes: number, rayon: number, centre: number) {
  const angle = (minutes / 720) * 2 * Math.PI;
  return {
    x: Math.round((centre + rayon * Math.sin(angle)) * 100) / 100,
    y: Math.round((centre - rayon * Math.cos(angle)) * 100) / 100,
  };
}
