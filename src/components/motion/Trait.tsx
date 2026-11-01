"use client";

import { motion } from "motion/react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import { COURBE, DUREE } from "@/components/motion/tempo";

/** Le geste des filets : le trait se tire depuis la gauche, une seule fois. */
export function Trait({ className, delai = 0 }: { className?: string; delai?: number }) {
  const reduit = useReducedMotionAfterMount();
  return (
    <motion.span
      aria-hidden
      className={`block h-px origin-left ${className ?? "bg-current/15"}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: reduit ? 0 : DUREE.image, ease: COURBE.sortie, delay: reduit ? 0 : delai }}
    />
  );
}
