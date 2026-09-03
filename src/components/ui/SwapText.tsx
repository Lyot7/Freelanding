import type { ReactNode } from "react";
import { SwapCopies, type SwapTravel } from "./SwapCopies";

/**
 * SwapText — cadre clippant autour de la permutation. Le mouvement lui-même vit
 * dans {@link SwapCopies}, qui porte la spec relevée sur la source ; ici on ne
 * pose que la boîte `relative inline-block overflow-hidden` que la primitive
 * exige, pour les appelants qui n'en ont pas déjà une.
 *
 * Le parent DOIT porter la classe `group`.
 *
 * `travel` remplace l'ancien couple `direction` + `translate-y-[140%]`. Deux
 * défauts corrigés d'un coup, tous deux mesurés image par image sur
 * `/live-proxy` :
 *   - 140 % de la ligne donnait 20,15 px sur un libellé de 14,4 px et 21,83 px
 *     sur un libellé de 15,59 px, là où la source parcourt 22 px, 12 px ou
 *     18 px selon le composant, indépendamment de la taille du texte ;
 *   - `300 ms ease-out` partait beaucoup trop vite : la source tient
 *     `cubic-bezier(0.68,0,0,1)` sur 320 ms ou 430 ms selon le motif.
 *
 * Correspondance relevée entre nos appelants et les composants de la source :
 *   - `travel={22}` — « Live project » de la page projet (`.framer-1sk0ilg`) ;
 *   - `travel={12}` — envoi du formulaire de contact et « Subscribe » du blog
 *     (`.framer-yuvr8`), qui descendent au lieu de monter ;
 *   - `travel={18}` — « Built in Framer » du pied (`.framer-xh8ae`), qui descend
 *     et ne fait AUCUN fondu.
 */
export function SwapText({
  children,
  className = "",
  travel,
}: {
  children: ReactNode;
  className?: string;
  /** Motif de permutation relevé sur la source pour ce bouton précis. */
  travel: SwapTravel;
}) {
  return (
    <span className={"relative inline-block overflow-hidden align-top " + className}>
      <SwapCopies travel={travel}>{children}</SwapCopies>
    </span>
  );
}
