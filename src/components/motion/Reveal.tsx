"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { motion } from "motion/react";
import type { HTMLMotionProps, Transition } from "motion/react";
import { appearAttributes, type AppearAttributes } from "./appearAnimations";

/**
 * Reveal — primitive d'animation d'apparition, extraite de HeroSection pour être
 * réutilisée (Hero, Header, …).
 *
 * INVARIANT : l'état MASQUÉ (`initial`) est rendu DÈS LE RENDU SERVEUR, et
 * l'animation ne se joue QU'UNE FOIS, sans reprise. Le rendu est identique côté
 * serveur et côté client : aucun état React ne bascule après l'hydratation,
 * aucune `key` ne change, donc aucun sous-arbre n'est remonté.
 *
 * POURQUOI CE CHANGEMENT — la version précédente rendait l'état FINAL au repos
 * et ne basculait vers l'état masqué qu'après montage, via un remount par `key`.
 * MESURÉ image par image sur la home à 1440, serveur de dev :
 *
 *     t =   73 ms  « design » à 636, « Marketing » à 636
 *     t =  203 ms  les deux à 630          <- état FINAL déjà atteint
 *     t = 1021 ms  « design » à 732, « Marketing » à 746   <- RETOUR à l'état
 *                                                            initial, tout rejoue
 *     t = 1616 ms  713 / 723               <- la même entrée se rejoue
 *
 * La page peignait donc son état d'arrivée, le tenait une seconde, puis
 * rebasculait à son état de départ pour tout rejouer : c'est le « la landing
 * charge deux fois » signalé, et c'est visible à l'œil. La SOURCE, elle, part de
 * l'état initial dès la première peinture (« design » à 741 à t = 45 ms) et
 * descend d'un seul mouvement (711 à 660 ms).
 *
 * Et ce rejeu tardif LAISSAIT DES ÉLÉMENTS EN RADE : au remontage, les
 * apparitions repartent de zéro, et celles dont l'observateur d'intersection ne
 * voit rien (cf. {@link RevealTrigger}) ne repartent jamais. C'est ce qui figeait
 * « Marketing » 20 px sous sa ligne.
 *
 * ROBUSTESSE. Rendre l'état masqué côté serveur expose au cas « JavaScript
 * absent » : sans lui, un `opacity: 0.001` resterait posé pour toujours. Le
 * filet est CSS, pas JavaScript — chaque élément animé porte `data-reveal`, et
 * `src/app/layout.tsx` pose une feuille `<noscript>` qui le remet à l'état
 * visible. C'est exactement le compromis de la source, qui sérialise elle aussi
 * ses états initiaux dans le HTML (`style="opacity:1;transform:translateY(20px)"`
 * sur les cinq mots de la ligne services).
 *
 * REDUCED-MOTION est délégué à `<MotionConfig reducedMotion="user">` (posé dans
 * `src/app/layout.tsx`) : framer-motion résout alors les transforms
 * instantanément au lieu de les animer, sans qu'aucun état React ne change entre
 * serveur et client.
 *
 * Deux API :
 *  - {@link Reveal} — composant clé-en-main.
 *  - {@link useReveal} — factory de props framer-motion, pour les cas où le
 *    caller garde la main sur l'élément `motion.*` (svg, boucles multi-reveal,
 *    états `to` custom).
 */

/** Courbe d'easing Framer d'origine (cubic-bezier(0.68, 0, 0, 1)). */
export const EASE_FRAMER = [0.68, 0, 0, 1] as const;

/** Sous-ensemble des valeurs animables utilisées par les reveals. */
export type MotionValues = {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
};

/** État final VISIBLE = état de repos par défaut (jamais masqué). */
export const REVEAL_FINAL: Required<MotionValues> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
};

/** Transition tween Framer (ease cubic 0.68,0,0,1 par défaut). */
export const framerTween = (duration: number, delay = 0): Transition => ({
  type: "tween",
  duration,
  delay,
  ease: EASE_FRAMER,
});

/** Transition spring Framer (damping/mass alignés sur le hero d'origine). */
export const framerSpring = (
  stiffness: number,
  delay = 0,
  damping = 17,
  mass = 0.3,
): Transition => ({
  type: "spring",
  stiffness,
  damping,
  mass,
  delay,
});

/**
 * Déclencheur de l'entrée.
 *
 * `"appear"` — l'animation part À LA PREMIÈRE PEINTURE, sans observateur et
 * sans attendre l'hydratation. C'est la traduction des `appear effects` de la
 * source : son HTML embarque un bloc
 * `<script type="framer/appear" id="__framer__appearAnimationsContent">` de 22
 * entrées, et un script inline les démarre TOUTES au premier
 * `requestAnimationFrame`, sans la moindre condition de visibilité. Ces 22
 * entrées sont exactement le header et le hero de la home, c'est-à-dire ce qui
 * est déjà à l'écran au chargement.
 *
 * Le départ avant hydratation passe par {@link appearReveal} (ou la prop
 * `appearId` du composant {@link Reveal}) : voir l'entête de
 * `@/components/motion/appearAnimations` pour la mécanique de reprise. Sans
 * identifiant, l'entrée reste correcte mais ne part qu'au montage React.
 *
 * `"viewport"` — l'animation part à l'ENTRÉE DANS LE VIEWPORT, une seule fois.
 * C'est le déclencheur du RESTE du site, mesuré sur la source (cf.
 * {@link REVEAL_VIEWPORT_AMOUNT} et {@link REVEAL_VIEWPORT_MARGIN}).
 *
 * POURQUOI LA DISTINCTION EST STRUCTURELLE, ET PAS UN CONFORT.
 * `IntersectionObserver` découpe la boîte de sa cible par les zones de clip de
 * ses ancêtres. Un élément que son PROPRE état initial déplace hors du parent
 * qui le clippe est donc rapporté NON visible, donc jamais révélé : blocage
 * circulaire, il reste masqué à vie. MESURÉ sur la ligne
 * « design / development / Marketing » du hero, fenêtre 1440 x 900, à l'instant
 * où l'observateur rend son verdict — hauteur de la boîte d'INTERSECTION, de
 * gauche à droite :
 *
 *     design 12 px · / 8 px · development 6 px · / 0 px · Marketing 0 px
 *
 * Les cinq mots vivent dans un conteneur `overflow-hidden` haut d'une ligne, et
 * leur `y: 20` de départ les en fait sortir par le bas ; le `rotate: 2` du bloc
 * hero incline la rangée, si bien que le rognage augmente de gauche à droite et
 * finit par tout emporter. Les deux derniers ne recevaient donc JAMAIS
 * `isIntersecting: true` — un seul événement chacun, à `false`, et plus rien
 * ensuite. Le déclencheur `"appear"` supprime l'observateur, donc le piège.
 *
 * La même classe de blocage se traite ailleurs en portant l'observateur sur le
 * CONTENEUR non déplacé et en échelonnant les enfants par variantes (voir
 * `LineReveal`), ce qui est aussi la façon de faire de la source.
 */
export type RevealTrigger = "appear" | "viewport";

/**
 * Seuil de visibilité déclenchant l'entrée (fraction de l'élément visible).
 *
 * MESURÉ sur le live : les appear-effects Framer sont déclenchés à l'ENTRÉE DANS
 * LE VIEWPORT, pas au montage (au chargement, 278 éléments sont encore à
 * `opacity: 0.001`, y compris en bas de page, et 26 reveals voient leur transform
 * changer en fonction de la position de scroll). La valeur exacte du seuil Framer
 * n'a PAS été mesurée.
 *
 * `"some"` (le moindre pixel visible) est retenu plutôt qu'une fraction chiffrée
 * pour deux raisons : c'est la traduction littérale de « entre dans le viewport »,
 * et surtout un seuil numérique est un PIÈGE sur les éléments plus hauts que le
 * viewport — un bloc de 6000px dans une fenêtre de 900px ne peut jamais atteindre
 * 20 % de visibilité, il resterait donc masqué à vie.
 */
export const REVEAL_VIEWPORT_AMOUNT: "some" | "all" | number = "some";

/**
 * Retrait du bord BAS de la zone d'observation, en px. NUL : la source déclenche
 * exactement au bord bas de la fenêtre.
 *
 * La valeur précédente, -100, venait d'une mesure prise en DÉFILEMENT CONTINU
 * (« médiane 799 sur 89 éléments au pas de 50 px »). Ce protocole est biaisé
 * dans un seul sens : il replie le DÉLAI de l'animation dans le seuil. Un
 * élément déclenché à 900 mais dont l'opacité ne bouge qu'après quelques dizaines
 * de millisecondes n'est vu « animé » qu'une ou deux foulées de défilement plus
 * bas, et le seuil relevé est donc systématiquement trop petit.
 *
 * REMESURÉ par saut direct puis attente de 1,7 s, protocole où le délai n'entre
 * plus en compte (`scripts/reveal-threshold.mjs`), sur la source, en fenêtre
 * 1440x900, ordonnées rapportées à la MISE EN PAGE et non à la boîte transformée :
 * chacun des 30 éléments encadrés sur les 8 routes est encore MASQUÉ quand le
 * haut de son déclencheur est à 905, et déjà RÉVÉLÉ à 895. Aucune exception,
 * aucune dispersion, et aucune dépendance au type : titres, paragraphes, images,
 * cartes et blocs échelonnés donnent tous le même encadrement [895, 905).
 * Le seuil est donc le bord bas de la fenêtre, à moins de 10 px près.
 */
const REVEAL_BOTTOM_MARGIN = 0;

/**
 * Marge d'observation compensant le DÉPLACEMENT de l'état initial.
 *
 * Piège corrigé ici : `IntersectionObserver` raisonne sur la boîte TRANSFORMÉE.
 * Un reveal dont l'état initial translate l'élément hors de l'écran ne peut donc
 * jamais se déclencher — l'observateur ne le voit pas, précisément parce qu'il
 * est masqué en attendant d'être vu. Blocage circulaire, l'élément reste
 * invisible à vie. Cas réel : le header (`initialY: -100`, `initialScale: 1.3`)
 * se retrouvait à `top: -107` pour 65 px de haut, donc entièrement au-dessus du
 * viewport, et ne s'affichait plus jamais.
 *
 * On étend donc la zone d'observation de la valeur exacte du déplacement, plus
 * une petite garde pour l'agrandissement dû au `scale`. Étendre la zone vers le
 * HAUT est sans effet sur la fidélité : le déclenchement se fait à l'entrée par
 * le bord BAS, et un élément déjà au-dessus de la fenêtre a de toute façon
 * franchi son seuil.
 *
 * LE MÊME PIÈGE, VERS LE BAS, ET IL FAUSSAIT TOUT LE SITE. Un reveal qui MONTE
 * depuis 40 px plus bas est observé 40 px plus bas : il ne franchit le bord bas
 * de la zone que lorsque sa position de MISE EN PAGE est déjà 40 px au-dessus.
 * Chaque apparition partait donc en retard de son propre `initialY`, un retard
 * invisible parce qu'il variait d'un appel à l'autre. MESURÉ sur le titre de la
 * FAQ (`initialY: 40`), même repère des deux côtés, fenêtre 1440x900 : la source
 * le révèle quand le haut du bloc est à 870 et pas encore à 930 ; chez nous il
 * restait masqué aux DEUX positions. La source, elle, porte son déclencheur sur
 * le conteneur non translaté — c'est bien la position de mise en page qui
 * commande. On agrandit donc la zone vers le bas d'exactement `initialY`, ce qui
 * ramène le déclenchement sur cette position.
 *
 * PERFORMANCE — framer-motion mutualise ses `IntersectionObserver` par
 * `JSON.stringify` des options (racine, seuil, marge). La marge ne dépend que
 * du seul `initialY`, jamais de l'élément : tous les reveals de même
 * déplacement partagent donc un observateur, et le nombre d'observateurs suit le
 * nombre de VALEURS de déplacement du site, pas le nombre d'éléments. Relevé sur
 * la home, constructeurs interceptés (`scripts/motion-perf.mjs`) : 17
 * observateurs, dont 8 de reveals, pour 94 éléments animés.
 *
 * Compenser exactement coûte donc quelques observateurs de plus qu'une marge
 * unique, et c'est le bon échange : le déclenchement est la chose mesurée, le
 * nombre d'observateurs ne l'est pas — le coût d'`IntersectionObserver` se paie
 * par élément OBSERVÉ, identique dans les deux cas.
 */
export const REVEAL_VIEWPORT_MARGIN = `24px 0px ${REVEAL_BOTTOM_MARGIN}px 0px`;

function viewportMargin(initialY?: number): string {
  const y = initialY ?? 0;
  // Vers le HAUT (y négatif) : garde de 24 px en plus, pour l'agrandissement dû
  // à un éventuel `scale`. Vers le BAS (y positif) : compensation EXACTE, c'est
  // elle qui fixe l'instant du déclenchement.
  const haut = Math.ceil(Math.abs(Math.min(0, y))) + 24;
  const bas = REVEAL_BOTTOM_MARGIN + Math.ceil(Math.max(0, y));
  return `${haut}px 0px ${bas}px 0px`;
}

/**
 * `will-change` posé au déclenchement, RETIRÉ à la fin de l'animation.
 *
 * framer-motion ne le pose jamais de lui-même : `MotionGlobalConfig.WillChange`
 * n'est renseigné nulle part dans la version installée, et son `useWillChange`
 * — qu'il faut brancher à la main — ne redescend JAMAIS à `auto`, son drapeau
 * interne étant à sens unique. Un site qui compte plusieurs dizaines
 * d'apparitions se retrouverait donc avec autant de couches de composition
 * réservées à vie, pour des animations qui ne jouent qu'une fois.
 *
 * La couche est posée à l'entrée dans la zone d'observation, donc au moment même où
 * l'animation démarre. La poser PLUS TÔT supposerait un second observateur, de
 * marge basse plus généreuse ; il serait mutualisé comme le premier, mais la
 * mesure ne montre aucun gain à l'échelle de ce site (cf. `motion-perf.mjs`),
 * et une couche réservée trop tôt est précisément ce qu'on cherche à éviter.
 */
export function useRevealWillChange(actifDesLeMontage = false): {
  style: { willChange: string } | undefined;
  onViewportEnter: () => void;
  onAnimationComplete: () => void;
} {
  // `actifDesLeMontage` sert au déclencheur `"appear"`, qui n'a pas
  // d'observateur pour poser la couche : l'animation démarre au montage, la
  // couche doit y être posée aussi. Le filet ci-dessous la rend dans les deux
  // cas.
  const [actif, setActif] = useState(actifDesLeMontage);

  /*
   * Un ÉTAT React, et non une `MotionValue`.
   *
   * La `MotionValue` était le choix naturel — poser et retirer la couche sans
   * aucun rendu. Elle est FAUSSE ici : une même `MotionValue` posée sur
   * plusieurs éléments frères n'a qu'un propriétaire de rendu chez
   * framer-motion. Mesuré sur la home après un parcours complet, les lignes
   * d'un même titre partageaient la valeur, la plupart repassaient bien à
   * `auto`, et une gardait indéfiniment son `will-change` en ligne alors que la
   * valeur, elle, valait bien `auto` — son nœud n'était simplement plus celui
   * que la valeur repeignait. Le rendu React, lui, met tous les frères à jour.
   * Le coût est de deux rendus par bloc révélé, sur quelques nœuds de texte.
   *
   * Le minuteur est un FILET, pas le mécanisme : `onAnimationComplete` rend la
   * couche dans le cas normal, mais s'est avéré ne PAS être garanti — mesuré
   * sur `/about`, deux reveals la gardaient alors que leur animation était
   * terminée depuis longtemps (opacité 1, transform nul). Un `will-change`
   * oublié réserve une couche de composition à vie : il faut une garantie, pas
   * une promesse. 2,5 s couvre la plus longue entrée du site (1,4 s) et la
   * cascade la plus longue (4 lignes à 70 ms d'écart, soit 0,7 s).
   */
  const FILET_MS = 2500;

  useEffect(() => {
    if (!actif) return;
    const filet = setTimeout(() => setActif(false), FILET_MS);
    return () => clearTimeout(filet);
  }, [actif]);

  return {
    style: actif ? { willChange: "transform, opacity" } : undefined,
    onViewportEnter: () => setActif(true),
    onAnimationComplete: () => setActif(false),
  };
}

/** Props framer-motion prêtes à être étalées sur un élément `motion.*`. */
export type RevealMotionProps = {
  initial: MotionValues;
  animate?: MotionValues;
  whileInView?: MotionValues;
  viewport?: {
    once?: boolean;
    amount?: "some" | "all" | number;
    margin?: string;
  };
  transition?: Transition;
  /** Cible du filet `<noscript>` (cf. l'entête de ce fichier). */
  "data-reveal": "";
};

/**
 * Factory de reveals AU VIEWPORT pour un rendu manuel. Un seul appel de hook par
 * composant ; `reveal(...)` est une fonction pure → appelable en boucle
 * (rules-of-hooks OK).
 *
 * Les props renvoyées sont les MÊMES au rendu serveur et au rendu client :
 * `initial=from` est donc sérialisé dans le HTML, et il n'y a ni bascule d'état
 * ni `key` à poser côté appelant.
 *
 * Pour le déclencheur `"appear"`, voir {@link appearReveal} : ce n'est pas une
 * variante de celui-ci mais un autre mécanisme (départ avant hydratation, aucun
 * observateur), et les deux sont volontairement séparés.
 */
export function useReveal(): {
  reveal: (
    from: MotionValues,
    transition: Transition,
    to?: MotionValues,
    amount?: "some" | "all" | number,
  ) => RevealMotionProps;
} {
  const reveal = (
    from: MotionValues,
    transition: Transition,
    to: MotionValues = REVEAL_FINAL,
    amount: "some" | "all" | number = REVEAL_VIEWPORT_AMOUNT,
  ): RevealMotionProps => ({
    initial: from,
    // `whileInView` et NON `animate` : sinon les titres des sections basses
    // joueraient leur apparition pendant que l'utilisateur est encore en haut de
    // page, et il ne resterait plus rien à voir en arrivant dessus. La source
    // déclenche bien à l'entrée dans le viewport pour tout ce qui n'est pas un
    // `appear effect`.
    whileInView: to,
    viewport: { once: true, amount, margin: viewportMargin(from.y) },
    transition,
    "data-reveal": "",
  });
  return { reveal };
}

/** Props framer-motion d'une apparition `"appear"`, prêtes à être étalées. */
export type AppearRevealProps = {
  initial: MotionValues;
  animate: MotionValues;
  transition: Transition;
  /** Cible du filet `<noscript>` (cf. l'entête de ce fichier). */
  "data-reveal": "";
} & AppearAttributes;

/**
 * Props d'une apparition `"appear"` : état masqué sérialisé dans le HTML,
 * entrée démarrée dès la PREMIÈRE PEINTURE par le script inline du layout, puis
 * REPRISE en cours de route par framer-motion au montage.
 *
 * Fonction pure, pas un hook : rien à mémoriser, rien qui bascule.
 *
 * @param appearId identifiant de reprise. Les identifiants du hero et du header
 *   sont ceux de la SOURCE (`__framer__appearAnimationsContent`), ce qui rend
 *   chaque appel vérifiable ligne à ligne contre son original.
 */
export function appearReveal(
  appearId: string,
  from: MotionValues,
  transition: Transition,
  to: MotionValues = REVEAL_FINAL,
): AppearRevealProps {
  return {
    initial: from,
    animate: to,
    transition,
    "data-reveal": "",
    ...appearAttributes(appearId, from, to, transition),
  };
}

/** Balises HTML supportées par le composant {@link Reveal} (`as`). */
type RevealTag = "div" | "span" | "p" | "header" | "footer" | "nav" | "section";

const MOTION_TAGS = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  header: motion.header,
  footer: motion.footer,
  nav: motion.nav,
  section: motion.section,
  // Toutes les balises ci-dessus sont des éléments HTML : leurs props motion
  // sont structurellement compatibles avec `HTMLMotionProps<"div">`.
} as unknown as Record<
  RevealTag,
  ComponentType<HTMLMotionProps<"div">>
>;

/** Props du composant {@link Reveal}. */
export type RevealProps = HTMLMotionProps<"div"> & {
  /** Balise rendue (défaut `div`). */
  as?: RevealTag;
  className?: string;
  children?: ReactNode;
  /** Délai avant l'entrée, en secondes. */
  delay?: number;
  /** Durée de l'entrée tween, en secondes (défaut 0.8). Ignoré si `transition`. */
  duration?: number;
  /** Easing du tween (défaut {@link EASE_FRAMER}). Ignoré si `transition`. */
  easing?: Transition["ease"];
  /** État MASQUÉ de départ (joué uniquement à l'entrée). */
  initialOpacity?: number;
  initialX?: number;
  initialY?: number;
  initialScale?: number;
  initialRotate?: number;
  /** État final VISIBLE (= repos). Défaut {@link REVEAL_FINAL}. */
  to?: MotionValues;
  /** Transition explicite (spring/tween custom). Prioritaire sur duration/easing. */
  transition?: Transition;
  /** Seuil de visibilité déclenchant l'entrée. Défaut {@link REVEAL_VIEWPORT_AMOUNT}. */
  viewportAmount?: "some" | "all" | number;
  /** Déclencheur de l'entrée, cf. {@link RevealTrigger}. Défaut `"viewport"`. */
  trigger?: RevealTrigger;
  /**
   * Identifiant de reprise, pour le seul déclencheur `"appear"` : sans lui
   * l'entrée ne part qu'au montage React (cf. {@link appearReveal}).
   */
  appearId?: string;
};

/**
 * Composant d'apparition clé-en-main. Rend l'état masqué (`initial*`) dès le
 * rendu serveur, puis joue l'entrée UNE fois vers `to`.
 *
 * @example
 * <Reveal as="header" trigger="appear" initialOpacity={0.001} initialY={-100}
 *         initialScale={1.3} duration={1.4} delay={0.3} className="…">…</Reveal>
 */
export function Reveal({
  as = "div",
  className,
  children,
  delay = 0,
  duration = 0.8,
  easing = EASE_FRAMER,
  initialOpacity,
  initialX,
  initialY,
  initialScale,
  initialRotate,
  to = REVEAL_FINAL,
  transition,
  viewportAmount = REVEAL_VIEWPORT_AMOUNT,
  trigger = "viewport",
  appearId,
  ...rest
}: RevealProps) {
  const wc = useRevealWillChange(trigger === "appear");

  const from: MotionValues = {};
  if (initialOpacity !== undefined) from.opacity = initialOpacity;
  if (initialX !== undefined) from.x = initialX;
  if (initialY !== undefined) from.y = initialY;
  if (initialScale !== undefined) from.scale = initialScale;
  if (initialRotate !== undefined) from.rotate = initialRotate;

  const entranceTransition: Transition =
    transition ?? { type: "tween", duration, delay, ease: easing };

  const MotionTag = MOTION_TAGS[as];

  return (
    <MotionTag
      className={className}
      // Cible du filet `<noscript>` : sans JavaScript, l'état masqué rendu par
      // le serveur resterait posé pour toujours.
      data-reveal=""
      initial={from}
      transition={entranceTransition}
      // Couche de composition réservée le temps de l'entrée seulement.
      // Le `style` du caller reste prioritaire : il est étalé après.
      style={wc.style}
      onAnimationComplete={wc.onAnimationComplete}
      {...(trigger === "appear"
        ? // Départ à la PREMIÈRE PEINTURE, sans observateur, puis reprise par
          // framer-motion au montage — cf. {@link RevealTrigger}.
          {
            animate: to,
            ...(appearId
              ? appearAttributes(appearId, from, to, entranceTransition)
              : {}),
          }
        : {
            whileInView: to,
            viewport: {
              once: true,
              amount: viewportAmount,
              margin: viewportMargin(initialY),
            },
            onViewportEnter: wc.onViewportEnter,
          })}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
