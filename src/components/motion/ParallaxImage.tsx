"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import {
  pourcentage,
  useReducedMotionAfterMount,
} from "@/components/motion/reducedMotion";
import { useReveal } from "@/components/motion/Reveal";
import {
  MEDIA_REVEAL_FROM,
  MEDIA_REVEAL_TRANSITION,
} from "@/components/motion/mediaReveal";

/**
 * ParallaxImage — reproduit le composant Framer « Parallax image »
 * (`Parallax image > Variant 1 > .framer-18sjbba-container`). L'image dérive
 * verticalement pendant que son cadre traverse le viewport.
 *
 * Loi MESURÉE sur le live (Chrome réel, rAF actif, pas de 3 à 10 px près des
 * bornes, 3 instances de hauteurs différentes) :
 *
 *   fenêtre = [containerAbsTop - vh , containerAbsTop + H]   longueur = vh + H
 *   p       = clamp01((scrollY - (containerAbsTop - vh)) / (vh + H))
 *   ty      = (-0.07 + 0.14 × p) × H
 *
 * soit une dérive de `-7 %` à `+7 %` de la hauteur H du cadre, STRICTEMENT
 * linéaire entre les bornes (R² = 1 sur les 3 instances) et CLAMPÉE dur aux deux
 * extrémités. La porteuse du transform est le div interne (l'original utilise un
 * `background-image` en `cover`, pas de balise `img`), habillé en
 * `position: absolute; inset: -7% 0; height: 114%`.
 *
 * Vérification chiffrée des 3 instances du live :
 *   H=435 → wrapper 496 (435 × 1.14 = 495.9), top -30.47 (= -0.07 × 435), Δty 60.90
 *   H=512 → wrapper 583, top -35.80, Δty 71.68
 *   H=299 → wrapper 341, top -20.92, Δty 41.86
 *
 * `p` est fourni tel quel par `useScroll({ offset: ["start end", "end start"] })`,
 * dont la définition coïncide exactement avec la fenêtre mesurée : progression de
 * 0 quand le haut du cadre atteint le bas du viewport, à 1 quand son bas quitte
 * le haut du viewport. Aucune constante magique, aucune mesure de H au runtime.
 *
 * Couverture garantie sans sur-échelle : le wrapper fait 114 % de H et démarre à
 * `top: -7 %`. À `p = 0` il s'étend de `-14 %` à `+100 %` de H, à `p = 1` de `0 %`
 * à `+114 %` : le cadre (0 → 100 %) est donc TOUJOURS couvert, aux deux extrêmes
 * comme entre. C'est pourquoi aucun `scale` compensatoire n'est nécessaire.
 *
 * Perf : `transform` seul (composité GPU), aucun handler de scroll propre.
 * REPOS (SSR, no-JS, `prefers-reduced-motion`) : `ty = 0`, wrapper centré, cadre
 * couvert — le contenu n'est jamais masqué ni rogné si l'animation ne tourne pas.
 */

/** Débord relatif du wrapper de part et d'autre du cadre (live : 7 %). */
const OVERSHOOT = 0.07;

/*
 * La course se calcule au point d'appel, à partir du débord effectif : elle
 * s'exprime en pourcentage de la hauteur du WRAPPER (et non du cadre), car un
 * transform en `%` se rapporte à la taille propre de l'élément, or le wrapper
 * mesure `1 + 2 × débord` fois le cadre.
 */

/**
 * Même calcul, exposé pour les calques de parallaxe qui ne passent pas par
 * `<Image>` : plusieurs sections posent leur visuel en `background-image` sur un
 * div déjà surdimensionné, avec la bonne géométrie mais aucun mouvement.
 *
 * `overshoot` est le débord relatif du calque de chaque côté du cadre, tel qu'il
 * est écrit dans le style de la source : 0.07 pour `top:-7%; height:114%`, 0.06
 * pour `top:-6%; height:112%`. Renvoie `null` si l'utilisateur a demandé moins
 * d'animation — l'appelant n'applique alors aucun transform et le calque reste
 * centré, donc le cadre reste couvert.
 */
export function useParallaxLayerY(
  ref: RefObject<HTMLElement | null>,
  overshoot: number = OVERSHOOT,
) {
  const reduced = useReducedMotionAfterMount();
  const { scrollY } = useScroll();
  const travel = (overshoot / (1 + 2 * overshoot)) * 100;
  // La valeur est PILOTÉE, pas dérivée. `useTransform(scrollY, …)` ne recalcule
  // que lorsque le scroll bouge : au premier rendu le calque restait donc à 0 %
  // au lieu de son décalage de départ, et une page ouverte sans être défilée
  // affichait un cadrage faux. Ici, la mesure et la position sont mises à jour
  // par les mêmes événements, y compris au montage.
  const y = useMotionValue(pourcentage(-travel));
  useEffect(() => {
    // Géométrie du cadre en coordonnées DOCUMENT. On ne peut pas s'en remettre à
    // `useScroll({ target })` : sur la section Services, le cadre vit sous un
    // panneau à hauteur animée dans un sous-arbre qui se re-rend à chaque
    // ouverture d'accordéon, et la progression y restait bloquée à 1 — le calque
    // se figeait en butée haute au lieu de parcourir sa course.
    let box = { top: 0, height: 0 };

    /*
     * LE NOEUD EST RELU À CHAQUE MESURE, ET JAMAIS CAPTURÉ.
     *
     * Le défaut corrigé ici gelait 40 calques sur 212. L'effet lisait
     * `ref.current` UNE fois et gardait le noeud pour toute sa durée de vie.
     * Or `Reveal` REMONTAIT alors son sous-arbre en changeant sa `key` au
     * basculement repos → entrée : les noeuds observés étaient détachés et
     * remplacés. Un `useEffect` n'en sait rien — le composant qui
     * appelle ce hook, lui, n'est pas remonté, ses dépendances ne changent pas,
     * et l'effet n'est donc jamais rejoué. Le noeud gardé renvoyait une boîte
     * de hauteur nulle, `place` sortait en tête à chaque défilement, et le
     * calque restait figé à `-travel%`, c'est-à-dire en butée haute.
     *
     * Mesuré sur les cinq calques des lignes de `ServicesSection` : `translateY`
     * valait -27,96 px du scroll 0 au scroll 6052 sur `/about` à 1440, quand la
     * source parcourt bien ses 55,9 px. Rien ne le signalait : un calque immobile
     * garde une géométrie correcte, il passe donc tous les contrôles statiques.
     *
     * `Reveal` ne remonte plus (l'état masqué vient du serveur), mais un
     * remontage se reproduira ailleurs — navigation, changement de variante,
     * `AnimatePresence` : on ne corrige donc pas le symptôme au cas par cas.
     * `mesurer` relit `ref.current`, et raccroche l'observateur de taille dès
     * que le noeud a changé d'identité. `place` déclenche une remesure sur ce
     * même changement d'identité — une simple comparaison de pointeur, faite au
     * plus une fois par image de défilement — et tant que la boîte est vide, ce
     * qui rattrape aussi le cas d'un cadre pas encore mis en page.
     */
    let suivi: HTMLElement | null = null;

    const mesurer = () => {
      const el = ref.current;
      if (!el) return;
      if (el !== suivi) {
        if (suivi) ro.unobserve(suivi);
        ro.observe(el);
        suivi = el;
      }
      const r = el.getBoundingClientRect();
      // Un noeud détaché mesure zéro : on garde la dernière boîte connue plutôt
      // que d'écraser une mesure juste par une mesure vide.
      if (r.height <= 0) return;
      box = { top: r.top + window.scrollY, height: r.height };
    };

    const place = (v: number) => {
      if (ref.current !== suivi || box.height <= 0) mesurer();
      if (box.height <= 0) return;
      // Fenêtre identique à `offset: ["start end", "end start"]` : 0 quand le
      // haut du cadre atteint le bas du viewport, 1 quand son bas quitte le
      // haut du viewport.
      const p = Math.min(
        1,
        Math.max(0, (v - (box.top - window.innerHeight)) / (window.innerHeight + box.height)),
      );
      y.set(pourcentage(-travel + 2 * travel * p));
    };

    const replacer = () => {
      mesurer();
      place(window.scrollY);
    };

    const ro = new ResizeObserver(replacer);
    replacer();
    // Deuxième passe après la première peinture : sur la section Services, la
    // mesure du montage renvoie une hauteur nulle et l'observateur ne reprenait
    // jamais la main, donc la course restait à zéro. C'est aussi cette passe qui
    // rattrape le remontage de `Reveal`, décidé en `useLayoutEffect` donc juste
    // après le premier effet.
    const raf = requestAnimationFrame(replacer);
    window.addEventListener("resize", replacer);
    const stop = scrollY.on("change", place);
    return () => {
      cancelAnimationFrame(raf);
      stop();
      ro.disconnect();
      window.removeEventListener("resize", replacer);
    };
  }, [ref, scrollY, travel, y]);

  return reduced ? null : y;
}

export function ParallaxImage({
  src,
  alt,
  width,
  height,
  className = "",
  imgClassName = "",
  sizes = "100vw",
  overshoot = OVERSHOOT,
  reveal = false,
}: {
  src: string;
  alt: string;
  /**
   * Débord vertical du calque, en fraction de la hauteur du cadre. Il n'est PAS
   * uniforme sur le site : la source pose 6, 7 ou 10 % selon l'emplacement, et
   * ces valeurs se lisent dans le SSR du miroir. `scripts/parallax-audit.mjs`
   * compare l'inventaire des deux côtés.
   */
  overshoot?: number;
  /**
   * Dimensions de l'image. Si l'une manque, le cadre ne peut pas tenir sa hauteur
   * d'un `aspect-ratio` et l'image est alors rendue EN FLUX sans parallaxe (repli
   * sûr) : mieux vaut un cadre sans dérive qu'un cadre effondré.
   */
  width?: number;
  height?: number;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  /**
   * Joue l'apparition fondu + dézoom de la source (loi commune de
   * `@/components/motion/mediaReveal`). OPT-IN : tous les cadres dérivants
   * n'apparaissent pas, seuls ceux dont la source pose le conteneur masqué
   * `.framer-1ambeg8-container` le font. L'inventaire se lit sur la source AU
   * CHARGEMENT, sans défiler : un calque qui apparaîtra y est déjà à
   * `opacity: 0` et `scale(1.1)`.
   */
  reveal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionAfterMount();
  const { reveal: revealProps } = useReveal();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // -7 % → +7 % de la hauteur du cadre, exprimés en % du wrapper.
  const travel = (overshoot / (1 + 2 * overshoot)) * 100;
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [pourcentage(-travel), pourcentage(travel)],
  );
  /*
   * Repli sûr sans dimensions : image en flux, hauteur naturelle, pas de dérive.
   *
   * `ref` EST ATTACHÉ ICI AUSSI, et ce n'est pas décoratif alors que ce repli
   * n'anime rien. `useScroll({ target: ref })` est appelé plus haut, avant ce
   * retour anticipé, parce qu'un hook ne peut pas être conditionnel. Sans ce
   * `ref`, le target restait défini mais jamais monté, et `motion` levait
   * « Target ref is defined but not hydrated » dans la console du visiteur.
   * MESURÉ le 2026-09-01 sur `/work/kpsull` et `/work/nslysium`, dont une image
   * de récit n'a pas de dimensions : erreur au chargement sur les deux pages,
   * aucune sur les autres. Le ref rend le target hydraté ; la progression qu'il
   * calcule reste inutilisée dans cette branche, ce qui ne coûte rien.
   */
  if (!width || !height) {
    return (
      <div ref={ref} className={"relative overflow-clip " + className}>
        {/* `width/height = 0` + `sizes` : forme supportée par next/image pour une
            image de dimensions intrinsèques inconnues, dimensionnée en CSS. */}
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes={sizes}
          data-part="cover-image"
          className={"block h-auto w-full object-cover object-center " + imgClassName}
        />
      </div>
    );
  }

  const appear = reveal
    ? revealProps(MEDIA_REVEAL_FROM, MEDIA_REVEAL_TRANSITION)
    : null;

  const calque = (
    <motion.div
      data-part="parallax-layer"
      className="absolute inset-x-0"
      style={{
        top: pourcentage(-overshoot * 100),
        height: pourcentage((1 + 2 * overshoot) * 100),
        ...(reduced ? null : { y }),
      }}
    >
      {/* Zoom au survol de la CARTE : `scale 1 → 1.1` sur ~400 ms (mesuré sur
          le live, courbe en S penchée tard — 50 % de la course à 57 % du temps).
          Porté par l'image et non par le wrapper : celui-ci porte déjà le
          `translateY` de la parallaxe via framer-motion, qui écrit le
          `transform` en inline et écraserait une classe utilitaire. Deux
          éléments distincts, donc aucun conflit. */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        data-part="cover-image"
        className={
          "object-cover object-center transition-transform duration-[400ms] " +
          "ease-[cubic-bezier(0.5,0,0.5,1)] group-hover:scale-110 " +
          "motion-reduce:transition-none motion-reduce:group-hover:scale-100 " +
          imgClassName
        }
      />
    </motion.div>
  );

  return (
    <div
      ref={ref}
      // `overflow-clip` (et non `hidden`) : pas de conteneur de défilement créé,
      // aucun impact sur un `position: sticky` ancêtre.
      className={"relative overflow-clip " + className}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/*
       * L'apparition enveloppe le calque de parallaxe SANS être le cadre :
       *   - le cadre sert de repère à `useScroll`, qui lit sa boîte transformée ;
       *     un cadre agrandi de 10 % pendant la mesure fausserait la course ;
       *   - son `overflow-clip` rogne le débord du `scale` avant le calcul
       *     d'`IntersectionObserver`, ce qui aligne le déclenchement sur la
       *     position de MISE EN PAGE, comme le fait le conteneur `overflow: clip`
       *     de la source (relevé dans `mediaReveal`).
       * Le fondu et la dérive vivent ainsi sur deux éléments distincts, chacun
       * écrivant son propre `transform` : ils se composent sans se marcher dessus.
       */}
      {appear ? (
        <motion.div
          {...appear}
          className="absolute inset-0"
        >
          {calque}
        </motion.div>
      ) : (
        calque
      )}
    </div>
  );
}
