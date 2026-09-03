"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * ToggleIcon — icône plus/moins des accordéons (FAQ, prestations).
 * Reproduction du composant Framer `framer-craoB` : un cadre de 16 px, un
 * calque interne de 12 px (`framer-1ht0g3k`) et deux barres de 12 × 2
 * (`framer-v2a2ti` horizontale, `framer-1u6l8q` couchée à -90°).
 *
 * CE QUE FAIT VRAIMENT LA SOURCE, relevé image par image sur `/live-proxy`
 * (clic sur une question fermée de la FAQ de la home, 1440 px, styles calculés
 * échantillonnés à chaque image — voir le tableau de valeurs ci-dessous).
 * Ce n'est NI une simple rotation de l'icône, NI une disparition sèche :
 *
 *   1. le calque interne pivote de 0° à 90° ;
 *   2. la barre horizontale pivote ELLE AUSSI de 0° à 90°, dans le même temps :
 *      composée à la rotation de son parent, elle décrit donc un DEMI-TOUR
 *      complet (0° → 180°) et retombe exactement à l'horizontale. C'est ce qui
 *      distingue la source d'une rotation naïve du cadre : faire pivoter le
 *      cadre seul coucherait la barre restante à la verticale, ce qui est faux ;
 *   3. la barre verticale ne disparaît pas d'un coup : sa longueur passe de
 *      12 px à 2 px et son fond de `rgba(·,·,·,0.6)` à `rgba(255,255,255,0)`.
 *      La source y arrive en changeant `width` (12 px → 2 px) et en compensant
 *      par un `scaleX` ; on obtient le même tracé en gardant la barre à 12 px et
 *      en jouant `scaleX` de 1 à 1/6, sans toucher à la mise en page.
 *
 * Les TROIS grandeurs suivent la MÊME courbe. Progression relevée à
 * l'ouverture, angle du calque interne divisé par 90 (t = 0 au clic) :
 *   49 ms → 0,015 | 69 → 0,158 | 89 → 0,344 | 110 → 0,536 | 130 → 0,690
 *   151 ms → 0,819 | 173 → 0,905 | 195 → 0,961 | 216 → 0,992 | 238 → 1,009
 *   259 ms → 1,014 | 278 → 1,015 (crête) | 320 → 1,010 | 385 → 1,003 | 443 → 1,000
 * L'alpha de la barre verticale au même instant : 0,592 | 0,506 | 0,392 | 0,280 |
 * 0,184 | 0,110 | 0,060 | 0,024 | 0,004 | 0 — soit la même progression.
 * La fermeture est symétrique (90° → 0°, creux à -1,34° vers 269 ms, repos à
 * 444 ms) et la barre verticale y remonte de 0 à 0,6 d'alpha sur la même courbe.
 *
 * Le DÉPASSEMENT de 1,5 % au-delà de la cible interdit une courbe de Bézier :
 * une `cubic-bezier` dont les ordonnées valent 0 et 1 ne sort jamais de
 * l'intervalle. C'est un ressort. Amortissement déduit du dépassement
 * (exp(-πζ/√(1-ζ²)) = 0,015 → ζ ≈ 0,80) et pulsation déduite de la crête
 * (t_crête ≈ 235 ms → ω_d ≈ 13,4 rad/s, ω_n ≈ 22,3 rad/s), soit une raideur de
 * ω_n² ≈ 490 et un amortissement de 2ζω_n ≈ 35,5 pour une masse de 1.
 *
 * CONTRÔLE, 5 ouvertures de chaque côté, sur trois grandeurs indépendantes de
 * l'instant du clic (la source n'affiche que 22 ms par image, la comparaison ne
 * peut donc pas reposer sur un instant absolu) :
 *                          source    ici
 *   dépassement             1,51 %   1,48 %
 *   crête moins 45°        169,6 ms 169,2 ms
 *   crête moins 81°        103,2 ms 102,0 ms
 *   81° moins 9°           112,0 ms 112,6 ms
 */
const RESSORT = { type: "spring", stiffness: 490, damping: 35.5, mass: 1 } as const;

/** Couleur d'arrivée de la barre qui s'efface, relevée telle quelle sur la source. */
const EFFACE = "rgba(255, 255, 255, 0)";

export interface ToggleIconProps {
  open: boolean;
  /**
   * Couleur des barres. Défaut `--foreground-60`, la valeur du thème sombre
   * (section prestations) ; la FAQ, en section claire, passe son encre à 60 %.
   */
  color?: string;
  className?: string;
}

export function ToggleIcon({
  open,
  color = "rgba(255, 255, 255, 0.6)",
  className,
}: ToggleIconProps) {
  const reduit = useReducedMotion();
  // `duration: 0` et non « pas de transition » : l'état d'arrivée doit rester
  // exact, seule la mise en mouvement disparaît.
  const transition = reduit ? { duration: 0 } : RESSORT;

  return (
    // framer-17dk37e-container / framer-ocj2uh-container : cadre 16 × 16.
    <span
      aria-hidden
      className={"relative block h-[16px] w-[16px] flex-none " + (className ?? "")}
    >
      {/* framer-1ht0g3k : calque 12 × 12 centré, 0° → 90°. */}
      <motion.span
        className="absolute left-1/2 top-1/2 block h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2"
        initial={false}
        animate={{ rotate: open ? 90 : 0 }}
        transition={transition}
      >
        {/* framer-v2a2ti : barre 12 × 2, 0° → 90° — donc 180° avec le parent. */}
        <motion.span
          className="absolute left-1/2 top-1/2 block h-[2px] w-[12px] -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundColor: color }}
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={transition}
        />
        {/* framer-1u6l8q : barre couchée à -90°, longueur 12 px → 2 px et fond
            effacé. Le `-rotate-90` de Tailwind 4 écrit la propriété `rotate`,
            distincte de `transform` où `motion` pose le `scaleX` : les deux se
            composent dans l'ordre `rotate` puis `transform`, exactement comme la
            matrice relevée sur la source. */}
        <motion.span
          className="absolute left-1/2 top-1/2 block h-[2px] w-[12px] -translate-x-1/2 -translate-y-1/2 -rotate-90"
          initial={false}
          animate={{
            scaleX: open ? 1 / 6 : 1,
            backgroundColor: open ? EFFACE : color,
          }}
          transition={transition}
        />
      </motion.span>
    </span>
  );
}
