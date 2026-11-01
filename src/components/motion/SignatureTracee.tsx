"use client";

import { motion } from "motion/react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import { COURBE, DUREE } from "@/components/motion/tempo";
import { SignatureMark } from "@/components/sections/SignatureMark";
import { siteFeatures } from "@/content/features";

/** Le paraphe se découvre de gauche à droite, comme un stylo qui passe, une seule fois. */
export function SignatureTracee({ className }: { className?: string }) {
  const reduit = useReducedMotionAfterMount();
  if (!siteFeatures.signature) return null;
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
      viewport={{ once: true, margin: "-20% 0px" }}
      transition={{ duration: reduit ? 0 : DUREE.image, ease: COURBE.sortie }}
    >
      <SignatureMark />
    </motion.div>
  );
}
