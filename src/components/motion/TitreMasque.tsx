"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import { COURBE, DELAI_MAX, DUREE } from "@/components/motion/tempo";

/** Le geste des titres : chaque ligne monte de derrière son masque, une seule fois. */
export function TitreMasque({
  lignes,
  className,
}: {
  lignes: readonly string[];
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const vu = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduit = useReducedMotionAfterMount();
  return (
    <h2 ref={ref} className={`m-0 ${className ?? ""}`}>
      {lignes.map((ligne, index) => (
        <span key={ligne} className="-mt-[0.14em] block overflow-hidden pt-[0.14em] pb-[0.02em] first:mt-0">
          <motion.span
            className="block"
            initial={false}
            animate={{ y: vu || reduit ? "0%" : "105%" }}
            transition={{ duration: reduit ? 0 : DUREE.titre, ease: COURBE.sortie, delay: Math.min(index * 0.07, DELAI_MAX) }}
          >
            {ligne}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}
