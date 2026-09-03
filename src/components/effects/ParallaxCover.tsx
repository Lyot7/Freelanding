"use client";

import { useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { getImageProps } from "next/image";
import { useParallaxLayerY } from "@/components/motion/ParallaxImage";
import { pourcentage } from "@/components/motion/reducedMotion";
import { useReveal } from "@/components/motion/Reveal";
import {
  MEDIA_REVEAL_FROM,
  MEDIA_REVEAL_TRANSITION,
} from "@/components/motion/mediaReveal";

/*
 * Apparition des visuels : la loi (état de départ, courbe, durée, seuil) est
 * commune à tout le site et vit dans `@/components/motion/mediaReveal`. Elle y a
 * été REMESURÉE sur deux emplacements indépendants — la carte 688 × 688 de
 * `/blog` et le portrait 110 × 135 de `/about` — ce qui a ramené la durée de
 * 1,25 s à 1,17 s : à 1,25 s l'image accusait jusqu'à 15 % d'opacité de retard
 * sur la source au moment le plus raide de la courbe.
 *
 * Seuil de déclenchement : NE PAS le redécrire ici. L'encadrement de référence
 * vit dans `mediaReveal.ts` (masqué à 910, révélé à 900, protocole de saut puis
 * attente), et `scripts/reveal-threshold.mjs` le contrôle. Ce fichier portait un
 * encadrement 881/894 issu du protocole de défilement CONTINU, abandonné parce
 * qu'il repliait le délai de l'animation dans le seuil et le sous-estimait.
 *
 * OPTIONNEL, et non activé par défaut : tous les cadres qui passent par ce
 * composant n'apparaissent pas. L'état de départ se lit directement sur la
 * source, sans avoir à défiler — un calque qui apparaîtra est à `opacity: 0` et
 * `scale(1.1)` dès le chargement. Inventaire ainsi relevé aux trois largeurs, et
 * c'est lui qui décide de la présence de `reveal` sur chaque appel.
 */

/**
 * Visuel de couverture sur-cadré qui dérive au scroll, pour les cadres déjà
 * posés par leur composant parent.
 *
 * `ParallaxImage` crée son propre cadre à partir de `width`/`height` ; ici le
 * cadre existe déjà (aspect-ratio du composant appelant) et on ne fournit que la
 * couche interne. C'est aussi ce qui permet de l'utiliser depuis un composant
 * SERVEUR : le Footer, par exemple, n'est pas client et ne peut donc pas appeler
 * le hook lui-même.
 *
 * `overshoot` est le débord relatif lu dans le style de la source : 0.07 pour
 * `top:-7%; height:114%`, 0.06 pour `top:-6%; height:112%`.
 *
 * `children` sert au grain, qui se pose au-dessus de l'image dans le même cadre
 * clippé.
 */
/*
 * Largeur d'affichage par défaut du cadre, exprimée en unités de fenêtre : les
 * emplacements historiques (photo du pied de page, photo de studio d'`/about`)
 * rendent 345 px pour 1440 et occupent la colonne entière en mobile. Chaque
 * appelant dont le cadre s'écarte de ce gabarit passe son propre `sizes` — c'est
 * la SEULE chose qui décide de la variante servie par l'optimiseur.
 */
const DEFAULT_SIZES = "(min-width: 810px) 25vw, 100vw";

export function ParallaxCover({
  src,
  alt = "",
  overshoot = 0.07,
  className = "",
  imgClassName = "",
  sizes = DEFAULT_SIZES,
  reveal = false,
  children,
}: {
  src: string;
  alt?: string;
  overshoot?: number;
  className?: string;
  imgClassName?: string;
  /** Largeur d'affichage du cadre, au format de l'attribut HTML `sizes`. */
  sizes?: string;
  /** Joue l'apparition zoom arrière + fondu de la source (voir ci-dessus). */
  reveal?: boolean;
  children?: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const y = useParallaxLayerY(frame, overshoot);
  const { reveal: revealProps } = useReveal();
  const appear = reveal
    ? revealProps(MEDIA_REVEAL_FROM, MEDIA_REVEAL_TRANSITION)
    : null;
  /*
   * L'image passe par l'optimiseur SANS changer de balise : `getImageProps` ne
   * rend que `src` et `srcSet`, que l'on repose sur le `motion.img` existant. Un
   * `next/image` à la place imposerait ses propres `position` / `inset` / boîte,
   * alors que tout ce calque tient dans son sur-cadrage `top:-N% / height:100%+2N%`
   * et dans la valeur de mouvement `y`. Géométrie donc strictement inchangée.
   *
   * `width`/`height` sont exigés par l'API mais NE COMMANDENT RIEN ici : dès que
   * `sizes` est fourni, Next construit un `srcSet` en descripteurs de largeur et
   * c'est le navigateur qui choisit. On ne pose d'ailleurs pas ces attributs sur
   * la balise — ils y fixeraient un `aspect-ratio` que le cadre contredit.
   */
  const { src: optimizedSrc, srcSet } = getImageProps({
    src,
    alt,
    width: 1,
    height: 1,
    sizes,
  }).props;
  const image = (
    <motion.img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      decoding="async"
      loading="lazy"
      className={"absolute inset-x-0 w-full object-cover object-center " + imgClassName}
      style={{
        top: pourcentage(-overshoot * 100),
        height: pourcentage((1 + 2 * overshoot) * 100),
        ...(y ? { y } : null),
      }}
    />
  );
  return (
    <div ref={frame} className={"absolute inset-0 overflow-hidden " + className}>
      {/*
       * L'apparition est portée par un calque INTERNE, jamais par le cadre
       * lui-même — même règle que `ParallaxBackdrop`, et pour les mêmes raisons
       * mesurées. Elle était posée sur le cadre, ce qui coûtait deux choses :
       *
       *   - LE SEUIL. `IntersectionObserver` découpe la boîte de sa cible par
       *     les zones de clip de ses ANCÊTRES, pas par le sien propre : un cadre
       *     qui porte lui-même le `scale(1.1)` déborde donc de la moitié de son
       *     agrandissement et se déclenche d'autant trop tôt. Relevé des cadres
       *     concernés : 229 px de haut au pied de page et 436 px sur la photo de
       *     studio d'`/about`, soit 11 et 22 px d'avance là où la source
       *     déclenche au bord bas exact. À l'intérieur du cadre, l'`overflow`
       *     de celui-ci rogne le débord avant le calcul, exactement comme le
       *     conteneur `overflow: clip` de la source (voir `mediaReveal`).
       *
       *   - LE GRAIN. `children` porte le calque de grain, qui se retrouvait
       *     DANS l'élément qui s'efface et fondait donc avec l'image. Sur la
       *     source, son conteneur (`.framer-30jb7g-container`) est le FRÈRE du
       *     calque animé à l'intérieur du cadre, et reste à opacité pleine du
       *     début à la fin. Il est désormais hors de l'apparition.
       *
       * La marge d'observation n'est plus forcée ici : `useReveal` pose
       * `24px 0px 0px 0px` pour un état de départ sans translation, c'est-à-dire
       * exactement la marge basse nulle voulue.
       */}
      {appear ? (
        <motion.div
          {...appear}
          className="absolute inset-0"
        >
          {image}
        </motion.div>
      ) : (
        image
      )}
      {children}
    </div>
  );
}
