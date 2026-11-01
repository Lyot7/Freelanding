"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";

const CHIFFRES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const DECALAGE_RANG = 0.06;

/**
 * UN CHIFFRE QUI PASSE SES CRANS, à la place des compteurs. Chaque chiffre est
 * une colonne de 0 à 9 qui glisse jusqu'à sa valeur, unités d'abord, en
 * `transform` seul. Le lecteur d'écran lit le texte complet, jamais la colonne.
 */
export function Rouleaux({ valeur, className }: { valeur: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const vu = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduit = useReducedMotionAfterMount();
  const caracteres = [...valeur];

  return (
    <span ref={ref} className={`relative inline-block whitespace-nowrap ${className ?? ""}`}>
      <span className="sr-only">{valeur}</span>
      <span aria-hidden className="inline-flex">
        {caracteres.map((caractere, index) => {
          const chiffre = CHIFFRES.indexOf(caractere);
          if (chiffre < 0) {
            return <span key={index}>{caractere}</span>;
          }
          const rang = caracteres.length - 1 - index;
          return (
            <span key={index} className="inline-block h-[1lh] overflow-hidden tabular-nums">
              <motion.span
                className="flex flex-col"
                initial={false}
                animate={{ y: vu || reduit ? `-${chiffre * 10}%` : "0%" }}
                transition={
                  reduit
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 110, damping: 20, delay: rang * DECALAGE_RANG }
                }
              >
                {CHIFFRES.map((c) => (
                  <span key={c} className="h-[1lh]">
                    {c}
                  </span>
                ))}
              </motion.span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
