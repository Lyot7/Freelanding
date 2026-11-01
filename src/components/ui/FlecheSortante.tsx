function Trace() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12 12 4M5.5 4H12v6.5" />
    </svg>
  );
}

/**
 * LA FLÈCHE QUI QUITTE LE CADRE. Deux copies dans un carré d'un em : au survol du
 * lien, la première sort en haut à droite et la seconde arrive d'en bas à gauche
 * (`.fleche-sortante`, `globals.css`). Décorative, le libellé porte le sens.
 */
export function FlecheSortante() {
  return (
    <span aria-hidden className="fleche-sortante">
      <Trace />
      <Trace />
    </span>
  );
}
