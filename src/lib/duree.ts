/** « 2 h 30 », « 36 min », « 11 h » : la durée telle qu'elle s'écrit. */
export function duree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reliquat = minutes % 60;
  if (heures === 0) return `${reliquat} min`;
  if (reliquat === 0) return `${heures} h`;
  return `${heures} h ${String(reliquat).padStart(2, "0")}`;
}
