"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DUREE_CADRAN, RETARD_CADRAN, formatHeure, pointSurCadran } from "@/components/sections/cadran";
import { COURBE } from "@/components/motion/tempo";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import type { CadranContent } from "@/lib/content/types";

const CENTRE = 500;
const RAYON = 470;
const GRADUATIONS = Array.from({ length: 60 }, (_, index) => index);

/**
 * LE CADRAN DU HÉROS : UNE SEMAINE DE BUREAU QUI RECULE.
 *
 * Une aiguille part de 11 h et recule jusqu'à 2 h 12, à l'échelle vraie d'un
 * cadran de douze heures. Le chiffre et la tâche suivent l'aiguille, écrits par
 * `ref` : l'animation ne rejoue aucun rendu React. Une fois arrivée, seule une
 * trotteuse continue. Les chiffres viennent du même exemple que la démonstration
 * et le mot « exemple » reste à l'écran.
 */
export function HeroCadran({ cadran }: { cadran: CadranContent }) {
  const { depart, arrivee, taches } = cadran;
  const minutes = useMotionValue(depart);
  const reduit = useReducedMotionAfterMount();
  const [fini, setFini] = useState(false);
  const compteur = useRef<HTMLSpanElement>(null);
  const tache = useRef<HTMLSpanElement>(null);

  const rotate = useTransform(minutes, (m) => m / 2);
  const parcouru = useTransform(minutes, (m) => (depart - m) / (depart - arrivee));

  useMotionValueEvent(minutes, "change", (m) => {
    if (compteur.current) compteur.current.textContent = formatHeure(m);
    if (tache.current) {
      const rang = Math.min(taches.length - 1, Math.floor(parcouru.get() * taches.length));
      tache.current.textContent = taches[rang];
    }
  });

  useEffect(() => {
    if (reduit) {
      minutes.set(arrivee);
      return;
    }
    const controles = animate(minutes, arrivee, {
      duration: DUREE_CADRAN,
      delay: RETARD_CADRAN,
      ease: COURBE.sortie,
      onComplete: () => setFini(true),
    });
    return () => controles.stop();
  }, [reduit, minutes, arrivee]);

  const debut = pointSurCadran(depart, RAYON, CENTRE);
  const fin = pointSurCadran(arrivee, RAYON, CENTRE);
  const arretes = reduit || fini;

  return (
    <div className="hero-cadran pointer-events-none relative aspect-square w-full">
      <svg aria-hidden viewBox="0 0 1000 1000" className="absolute inset-0 size-full overflow-visible">
        {GRADUATIONS.map((rang) => {
          const forte = rang % 5 === 0;
          const a = pointSurCadran(rang * 12, forte ? 440 : 456, CENTRE);
          const b = pointSurCadran(rang * 12, 480, CENTRE);
          return (
            <line
              key={rang}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="white"
              strokeOpacity={forte ? 0.5 : 0.22}
              strokeWidth={forte ? 2 : 1}
            />
          );
        })}
        <motion.path
          d={`M ${debut.x} ${debut.y} A ${RAYON} ${RAYON} 0 1 0 ${fin.x} ${fin.y}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          style={{ pathLength: parcouru }}
        />
      </svg>

      <motion.div aria-hidden className="absolute inset-0" style={{ rotate }}>
        <span className="absolute bottom-1/2 left-1/2 h-[42%] w-px -translate-x-1/2 bg-white" />
        <span className="absolute bottom-[calc(50%-4px)] left-1/2 size-[8px] -translate-x-1/2 rounded-full bg-accent" />
      </motion.div>

      {arretes ? (
        <div aria-hidden className="hero-trotteuse absolute inset-0">
          <span className="absolute bottom-1/2 left-1/2 h-[47%] w-px -translate-x-1/2 bg-accent/60" />
        </div>
      ) : null}

      <p className="absolute inset-x-0 top-[62%] m-0 hidden flex-col tablet:flex items-center gap-[6px] text-center">
        <span className="sr-only">{cadran.phrase}</span>
        <span
          aria-hidden
          ref={compteur}
          className="font-mono text-[clamp(28px,4.4vw,64px)] font-medium leading-none tabular-nums tracking-[-0.04em]"
        >
          {formatHeure(depart)}
        </span>
        <span
          aria-hidden
          ref={tache}
          className={`micro text-white/60 transition-opacity duration-200 ${arretes ? "opacity-0" : "opacity-100"}`}
        >
          {taches[0]}
        </span>
      </p>
      <a
        href={cadran.exemple.href}
        className={`pointer-events-auto absolute inset-x-0 top-[calc(62%+clamp(36px,5.4vw,80px))] mx-auto hidden w-fit tablet:flex flex-col items-center gap-[4px] text-center no-underline transition-opacity duration-300 ${
          arretes ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-[16px] font-semibold leading-[1.1] tracking-[-0.01em]">
          <span className="text-accent">{cadran.gain.valeur}</span> {cadran.gain.libelle}
        </span>
        <span className="micro text-white/60 underline underline-offset-[3px]">{cadran.exemple.label}</span>
      </a>
    </div>
  );
}
