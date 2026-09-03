"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import type { ReactNode } from "react";

/**
 * ScrollParallax — dérive verticale proportionnelle au scroll DOCUMENT, sans
 * borne. Reproduit le composant Framer `BG` du hero (`framer-60s0ze`).
 *
 * Loi MESURÉE sur le live (Chrome réel, rAF actif à 60 fps, 129 points de 0 à
 * 12743) : `translateY = 0.15 × scrollY`, `translateX = 0`, `scale = 1`.
 * Régression : R² = 1.000000, pente identique sur les trois tiers du document
 * (0.150000 / 0.150000 / 0.150000). AUCUN clamp : l'effet reste actif sur toute
 * la hauteur du document. Amplitude totale relevée : 0 → 1911.45 px.
 *
 * Pourquoi aucun vide n'apparaît malgré une dérive non bornée : à un scroll S,
 * le haut du parent est à `-S` dans le viewport et le haut de la couche à
 * `-S + 0.15S = -0.85S`. L'écart de `0.15S` se situe donc toujours AU-DESSUS du
 * viewport (les deux valeurs sont négatives dès que S > 0), et le débord
 * symétrique du bas est absorbé par l'`overflow: clip` du parent. Le parent doit
 * donc impérativement clipper.
 *
 * Perf : `transform` uniquement (composité GPU), une seule souscription au
 * scroll partagée par framer-motion, aucun handler de scroll propre. L'état de
 * REPOS (SSR, no-JS, `prefers-reduced-motion`) est `translateY: 0`, c'est-à-dire
 * la couche exactement alignée sur son parent : rien n'est jamais masqué ni
 * décalé si l'animation ne tourne pas.
 */
/**
 * Variante HOOK, pour un élément qui porte DÉJÀ un transform (une apparition avec
 * `scale`/`rotate`, par exemple). framer-motion compose `y`, `scale` et `rotate`
 * dans un seul `transform` : on peut donc étaler `style={{ y }}` sur le même
 * élément que `animate`, sans wrapper supplémentaire. C'est préférable à
 * l'enrobage, qui modifierait le layout et l'arbre d'accessibilité.
 *
 * Renvoie `undefined` sous `prefers-reduced-motion`, pour laisser l'élément à sa
 * position de repos.
 *
 * Pentes MESURÉES sur le live (linéaires, R² = 1) :
 *   `BG < Hero` (framer-60s0ze)        +0.150
 *   `Container < Hero` (framer-h0duhu) +0.070
 *   `framer-126i1qf-container`         -0.030
 */
export function useScrollParallaxY(factor: number) {
  const reduced = useReducedMotionAfterMount();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * factor);
  return reduced ? undefined : y;
}

export function ScrollParallax({
  /** Pente `translateY / scrollY`. Live mesuré pour le BG du hero : 0.15. */
  factor,
  className = "",
  children,
  /** Couche purement décorative à masquer aux lecteurs d'écran. */
  decorative = false,
}: {
  factor: number;
  className?: string;
  children?: ReactNode;
  decorative?: boolean;
}) {
  const y = useScrollParallaxY(factor);

  return (
    <motion.div
      aria-hidden={decorative || undefined}
      data-part="scroll-parallax"
      className={className}
      style={y ? { y } : undefined}
    >
      {children}
    </motion.div>
  );
}
