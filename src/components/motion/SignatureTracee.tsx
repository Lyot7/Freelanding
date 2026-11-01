"use client";

import { motion } from "motion/react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import { SignatureMark } from "@/components/sections/SignatureMark";

/** Le paraphe se découvre de gauche à droite, comme un stylo qui passe, une seule fois. */
export function SignatureTracee({ className }: { className?: string }) {
  const reduit = useReducedMotionAfterMount();
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
      viewport={{ once: true, margin: "-20% 0px" }}
      transition={{ duration: reduit ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <SignatureMark />
    </motion.div>
  );
}
