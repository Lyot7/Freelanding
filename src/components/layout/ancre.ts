/**
 * Arrivée sur une ancre (`/contact#rendez-vous`) : garder la cible en haut de
 * l'écran tant que la page se construit sous les yeux du visiteur.
 *
 * MESURÉ le 2026-09-10 sur la production : le saut natif vers l'ancre est juste
 * (~80 ms après le chargement), puis le bloc de réservation grandit de 547 à
 * 799 px quand les créneaux arrivent, et le scroll anchoring de Chromium
 * « compense » en remontant la page de 200 à 540 px. Le visiteur atterrissait
 * au-dessus de la section qu'il était venu voir.
 *
 * On réaligne donc à chaque changement de taille du document, jusqu'au premier
 * geste du visiteur ou au plafond : passé ce geste, le scroll lui appartient.
 * Le réalignement est instantané, comme le saut natif, ce qui respecte
 * `prefers-reduced-motion` sans cas particulier.
 */

/** Les créneaux arrivent en une à deux secondes ; large marge pour un réseau lent. */
export const PLAFOND_ANCRE_MS = 10_000;

const GESTES = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export function idDepuisHash(hash: string): string | null {
  const brut = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!brut) return null;
  try {
    return decodeURIComponent(brut);
  } catch {
    return brut;
  }
}

/** Rend la fonction d'arrêt. Sans cible dans la page, ne fait rien. */
export function maintenirAncre(hash: string): () => void {
  const id = idDepuisHash(hash);
  const cible = id ? document.getElementById(id) : null;
  if (!cible) return () => {};

  const observateur = new ResizeObserver(() =>
    cible.scrollIntoView({ block: "start" }),
  );
  const plafond = window.setTimeout(arreter, PLAFOND_ANCRE_MS);

  function arreter() {
    observateur.disconnect();
    window.clearTimeout(plafond);
    for (const geste of GESTES) window.removeEventListener(geste, arreter, true);
  }

  for (const geste of GESTES) {
    window.addEventListener(geste, arreter, { capture: true, passive: true });
  }
  // `observe` rappelle une première fois tout de suite : premier alignement.
  observateur.observe(document.body);
  return arreter;
}
