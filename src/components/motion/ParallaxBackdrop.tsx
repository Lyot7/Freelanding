"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useParallaxLayerY } from "@/components/motion/ParallaxImage";
import { useReveal } from "@/components/motion/Reveal";
import {
  MEDIA_REVEAL_FROM,
  MEDIA_REVEAL_TRANSITION,
} from "@/components/motion/mediaReveal";
import { useDepixelisation } from "@/components/motion/useDepixelisation";
import { urlImageFond } from "@/lib/image-fond";
import { EVENEMENT_PRECHARGEMENT } from "@/lib/prechargement";

/**
 * Calque dérivant à IMAGE DE FOND, tel que la source le pose.
 *
 * Tous les visuels dérivants du site passent par un seul composant Framer
 * (`framer-1ambeg8-container`), dont la couche porteuse n'est jamais une balise
 * `img` mais un `div` en `background-size: cover`, sur-cadré symétriquement :
 *
 *     position:absolute; top:-N%; bottom:-N%; height:calc(100% + 2N%)
 *
 * Le débord `N` vaut 6, 7 ou 10 % selon l'emplacement — il se lit dans le SSR du
 * miroir, il ne se devine pas. `scripts/parallax-audit.mjs` compare l'inventaire
 * de la source à celui du clone, route par route.
 *
 * Le cadre parent doit être positionné et clippé ; ce composant ne fournit que
 * la couche interne, pour rester utilisable depuis un composant serveur.
 *
 * Les bords sont posés un par un et JAMAIS via un raccourci `inset` : `inset-0`
 * et `[inset:-7%_0]` déclarent la même propriété, la seconde se faisait écraser,
 * et le calque se retrouvait à la taille exacte de son cadre — donc sans course
 * à parcourir, ce qui a longtemps fait passer la parallaxe pour inopérante.
 *
 * CHARGEMENT DIFFÉRÉ ET DÉPIXELISATION. Une image de fond CSS part dès le
 * rendu, où qu'elle soit dans la page : le navigateur ne sait pas la différer.
 * Le calque ne pose donc son image qu'une fois chargée, à l'approche de
 * l'écran ou quand la page est au repos (`EVENEMENT_PRECHARGEMENT`), et se
 * dépixelise à sa première apparition comme les `<img>` (`useDepixelisation`).
 * `prioritaire` rétablit l'image dans le HTML serveur, pour un calque visible
 * au chargement.
 */
export function ParallaxBackdrop({
  src,
  overshoot,
  label,
  className = "",
  reveal = false,
  prioritaire = false,
  children,
}: {
  src: string;
  overshoot: number;
  /** Rend le calque annonçable ; sans lui il reste décoratif. */
  label?: string;
  className?: string;
  /**
   * Joue l'apparition fondu + dézoom de la source (voir
   * `@/components/motion/mediaReveal`). OPT-IN : tous les calques dérivants du
   * site n'apparaissent pas, seuls ceux dont la source pose le conteneur
   * `.framer-1ambeg8-container` le font.
   */
  reveal?: boolean;
  /** Image posée dès le HTML serveur, sans différé ni dépixelisation. */
  prioritaire?: boolean;
  children?: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const y = useParallaxLayerY(frame, overshoot);
  const { reveal: revealProps } = useReveal();
  const appear = reveal
    ? revealProps(MEDIA_REVEAL_FROM, MEDIA_REVEAL_TRANSITION)
    : null;
  const edge = `${-overshoot * 100}%`;
  const finale = urlImageFond(src, 1080);
  const [pret, setPret] = useState(prioritaire);
  const pretRef = useRef(prioritaire);
  const chargement = useRef<Promise<HTMLImageElement | null> | null>(null);
  const charger = useCallback(() => {
    chargement.current ??= new Promise<HTMLImageElement | null>((fin) => {
      const img = new window.Image();
      img.onload = () => fin(img);
      img.onerror = () => fin(null);
      img.src = finale;
    }).then((img) => {
      pretRef.current = true;
      setPret(true);
      return img;
    });
    return chargement.current;
  }, [finale]);

  useEffect(() => {
    const cadre = frame.current;
    if (!cadre || prioritaire) return;
    const approche = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        approche.disconnect();
        void charger();
      },
      { rootMargin: "100% 0px" },
    );
    approche.observe(cadre);
    const auRepos = () => void charger();
    window.addEventListener(EVENEMENT_PRECHARGEMENT, auRepos);
    return () => {
      approche.disconnect();
      window.removeEventListener(EVENEMENT_PRECHARGEMENT, auRepos);
    };
  }, [charger, prioritaire]);

  const etape = useDepixelisation({
    cible: frame,
    src,
    actif: !prioritaire,
    estChargee: () => pretRef.current,
    charger,
  });
  const fond = etape ?? (pret ? finale : null);
  const layer = (
    <motion.div
      role={label ? "img" : undefined}
      aria-label={label}
      className="absolute left-0 right-0 bg-cover bg-center"
      style={{
        top: edge,
        bottom: edge,
        backgroundImage: fond ? `url("${fond}")` : undefined,
        imageRendering: etape ? "pixelated" : undefined,
        ...(y ? { y } : null),
      }}
    />
  );
  return (
    <div ref={frame} className={"absolute inset-0 overflow-hidden " + className}>
      {/*
       * L'apparition est portée par un calque INTERNE et jamais par le cadre
       * lui-même, pour deux raisons mesurées :
       *   - le cadre sert de repère à `useParallaxLayerY`, qui lit sa boîte via
       *     `getBoundingClientRect` — donc la boîte TRANSFORMÉE : un cadre agrandi
       *     de 10 % au moment de la mesure fausse la course de parallaxe ;
       *   - `overflow-hidden` du cadre rogne le débord du `scale` avant le calcul
       *     d'`IntersectionObserver`, ce qui aligne le déclenchement sur la
       *     position de MISE EN PAGE, exactement comme la source le fait avec son
       *     conteneur `overflow: clip` (relevé dans `mediaReveal`).
       * Le grain (`children`) reste HORS de l'apparition : sur la source, son
       * conteneur est le FRÈRE du calque animé, pas son enfant, et il ne fond
       * donc pas avec l'image.
       */}
      {appear ? (
        <motion.div
          {...appear}
          className="absolute inset-0"
        >
          {layer}
        </motion.div>
      ) : (
        layer
      )}
      {children}
    </div>
  );
}
