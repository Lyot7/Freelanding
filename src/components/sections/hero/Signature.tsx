"use client";

import { motion } from "motion/react";
import { appearAttributes } from "@/components/motion/appearAnimations";
import { useScrollParallaxY } from "@/components/motion/ScrollParallax";
import { siteFeatures } from "@/content/features";
import { SignatureMark } from "@/components/sections/SignatureMark";

/**
 * Signature — vecteur décoratif orange manuscrit du fondateur.
 * Source Framer : SVG symbole #svg-1731655350_11847 (data-framer-name="Vector"),
 * viewBox 0 0 452.12 132.867, fill rgb(255,69,0) (accent). Reproduit tel quel.
 *
 * Positionnement (container absolu dans la colonne interne framer-1cdgr7m),
 * calé sur le rendu live :8080 pour NE PAS chevaucher le texte :
 *   desktop (>=1200) : bottom 37px, right -180px, cadre 452x133
 *   tablet  (810-1199): bottom 31px, left 370px, cadre 452x133
 *   base    (<=809)  : bottom 18px, left 84px, cadre réduit 316x93
 *     -> bord gauche ~x124 sur 390px (à droite du fondateur), déborde à droite,
 *        comme le live (mesuré x=124..440 sur :8080 à 390px).
 *
 * APPARITION : `appear effect` de la source (`data-framer-appear-id="126i1qf"`),
 * opacity .001 + translateX(60px) + scale(1.2) → état final, spring stiffness
 * 110, damping 17, mass 0.3, delay .5. Comme tous les `appear effects`, elle part
 * dès la PREMIÈRE PEINTURE (script inline du layout, cf.
 * `@/components/motion/appearAnimations`) et son état masqué est rendu dès le
 * HTML serveur : ni bascule d'état après hydratation, ni `key` de remontage.
 * Voir aussi l'entête de `@/components/motion/Reveal`.
 */

/**
 * Identifiant de reprise. La source ne pose l'`appear effect` sur ce vecteur
 * QUE sur la home ; `/about` et `/contact` montent le même composant, donc la
 * même entrée, mais il n'y a jamais deux signatures sur une page : un seul
 * identifiant suffit.
 */
const SIGNATURE_APPEAR_ID = "126i1qf";

const SIGNATURE_FROM = { opacity: 0.001, x: 60, scale: 1.2 };
const SIGNATURE_TO = { opacity: 1, x: 0, scale: 1 };
const SIGNATURE_TRANSITION = {
  type: "spring",
  stiffness: 110,
  damping: 17,
  mass: 0.3,
  delay: 0.5,
} as const;

export function Signature({
  variant = "default",
}: {
  variant?: "default" | "contact" | "about";
}) {

  /*
   * DÉRIVE AU SCROLL du conteneur, absente jusqu'ici. `anim-inventory` la
   * signalait sur les TROIS pages qui montent ce vecteur, aux trois largeurs :
   * la source y expose un élément dont le seul transform varie, sans équivalent
   * chez nous. Aucun outil apparié par texte ne pouvait la voir, ce conteneur
   * n'ayant aucun contenu textuel.
   *
   * PENTE MESURÉE sur `/live-proxy`, par sauts de scroll puis relevé du
   * `transform` calculé, fenêtre 1440 x 900 :
   *   home    `.framer-126i1qf-container` : -31,89 px à 1063 · -63,78 à 2126 ·
   *                                         -95,67 à 3189 · -127,56 à 4252
   *   /about  `.framer-ghxs1o-container`  : -15,03 px à 501 · -30,06 à 1002 ·
   *                                         -45,09 à 1503 · -60,12 à 2004
   *   /contact `.framer-1gw94nk-container`: -8,19 px à 273 · -16,38 à 546 ·
   *                                         -24,57 à 819 · -32,76 à 1092
   * Soit `translateY = -0,030 x scrollY` exactement, à la troisième décimale,
   * sur les trois emplacements et sans borne : c'est la pente déjà relevée et
   * consignée dans `ScrollParallax`, elle n'avait simplement jamais été posée.
   *
   * Le `scale` de repos du conteneur diffère d'une page à l'autre sur la source
   * (1,3 · 0,7 · 0,6). Sur l'accueil et sur `/about`, il est bien absorbé par
   * les tailles du cadre posées ci-dessous. Sur `/contact`, il ne l'était PAS :
   * le cadre y était resté à 452 px alors que la source rend 271, et le paraphe
   * sortait de l'écran. Voir le calage du variant `contact`, plus bas.
   *
   * framer-motion compose `y`, `x` et `scale` dans un seul `transform` : la
   * dérive se pose donc sur le MÊME élément que l'apparition, sans enveloppe
   * supplémentaire qui modifierait la mise en page et l'arbre d'accessibilité.
   */
  const y = useScrollParallaxY(-0.03);

  // Le tracé ci-dessous épelle le nom de la marque du template : il ne peut pas
  // être rendu tel quel sur le site d'Eliott. Voir `src/content/features.ts`.
  // La garde est posée APRÈS le hook de dérive, jamais avant : un hook appelé
  // conditionnellement casserait l'ordre d'appel entre deux rendus.
  // Le vecteur est positionné en absolu, son absence ne déplace rien.
  if (!siteFeatures.signature) return null;

  /* `/about` ancre la signature DANS la photo, et non à côté.
     Le calage hérité du template la projetait à `left: 370px` hors du cadre de
     l'image, ce qui, sur cette page, tombe en plein dans la grille de chiffres
     (« 1 interlocuteur unique », « 2h de réponse »…) : mesuré à 810, le tracé
     traversait quatre libellés. La photo, elle, est un support naturel pour une
     signature et laisse le tracé respirer à toutes les largeurs. */
  const position =
    variant === "about"
      ? /* Taille RELATIVE à la photo, et non en pixels : à 810 le cadre de
           l'image ne fait que 191 px de large, donc un gabarit fixe de 200
           faisait ressortir le tracé par la gauche. Le rapport du tracé
           (1250x324) tient la hauteur, sans jamais la déformer. */
        "z-[1] bottom-[10px] right-[8px] left-auto top-auto aspect-[1250/324] h-auto w-[86%]"
      : variant === "contact"
      ? /* CALAGE REPRIS SUR LA SOURCE, mesuré sur `/live-proxy/contact` aux
           cinq largeurs. L'ancien reprenait le débord voulu du hero de
           l'accueil (`right-[-180px]`, un cadre de 452 px qui sort par la
           droite) : sur cette page, ce même débord tombe HORS DE L'ÉCRAN. Bord
           droit du paraphe relevé chez nous à 1227 px pour 1200 de fenêtre,
           1350 pour 1440 et 1590 pour 1920 — un ancêtre clippé, donc pas de
           barre de défilement, juste un tracé coupé net au bord.

           La source ne déborde jamais. Son conteneur porte un cadre de
           452 × 133 mis à l'échelle 0,6, ce qui donne une boîte RENDUE de
           271 × 80 px, identique aux cinq largeurs, ancrée à +91 px du bord
           gauche de la carte (elle mord donc sur le portrait, puis passe
           au-dessus du nom). Bords droits relevés : 383 pour 390 de fenêtre,
           768 pour 810, 963 pour 1200, 1083 pour 1440, 1323 pour 1920.

           Le commentaire de dérive ci-dessus tenait ce 0,6 pour « un artefact
           de dimensionnement Framer […] absorbé chez nous par les tailles du
           cadre ». C'est vrai de l'accueil et d'`/about`, faux ici : le facteur
           n'a jamais été absorbé, le cadre est resté à 452 px.

           La LARGEUR est reprise (271 px), pas la hauteur : le paraphe
           d'Eliott a son propre rapport (1250/324 contre 452/133 pour celui du
           template). La caler sur la largeur reproduit exactement l'empreinte
           horizontale de la source — donc les mêmes bords droits, donc les
           mêmes gardes au bord de l'écran — et laisse la hauteur suivre le
           dessin au lieu de l'écraser.

           `z-[2]` : le paraphe mord sur les 45 derniers pixels du portrait, et
           il passait DERRIÈRE lui. Le cadre de la photo est posé à `z-[2]` ;
           avec `z-[1]`, cette portion d'encre était masquée et le tracé
           semblait commencer pile au bord droit de l'image. Le même `z-[2]`,
           sur un élément qui vient APRÈS la photo dans le document, le fait
           peindre par-dessus. Volontairement pas `z-[3]` ni plus : le bloc
           nom + rôle est à `z-[3]`, il doit rester au-dessus du tracé si un
           libellé plus long venait un jour à remonter dans sa boîte. */
        "z-[2] left-[91px] top-[27px] right-auto bottom-auto h-auto w-[271px] aspect-[1250/324] tablet:top-[32px] desktop:top-[25px]"
      : /* MESURÉ à 810 px : posé à `left-[370px]` sur 452 de large, le cadre
         atteint 822 px alors que la section n'en fait que 810 et COUPE. La fin
         du paraphe disparaissait donc, sur la largeur tablette uniquement.
         Le parent décale déjà de 66 px : à 288, le bord droit tombe à 806, sous les 810, avec 4 px de garde. Le débordement
         VOULU reste celui du desktop (`right-[-180px]`), qui sort par la droite
         d'un cadre bien plus large. */
        "z-[1] bottom-[57px] left-auto right-0 h-[43px] w-[165px] tablet:bottom-[31px] tablet:left-[288px] tablet:right-auto tablet:h-[133px] tablet:w-[452px] desktop:bottom-[37px] desktop:left-auto desktop:right-[-180px]";
  return (
    <motion.div
      aria-hidden
      data-reveal=""
      /* Le PLAN DE SUPERPOSITION fait partie du calage, pas du gabarit : il
         vaut `z-[1]` sur l'accueil et sur `/about`, où le paraphe n'a rien
         devant lui, et `z-[2]` sur `/contact`, où il en a. Il est donc porté par
         `position` et n'est plus écrit en dur ici — deux utilitaires `z-…` dans
         la même liste de classes déclarent la même propriété, et ce n'est pas
         l'ordre des classes qui départage, mais l'ordre dans la feuille
         générée. */
      className={`pointer-events-none absolute flex-none ${position}`}
      style={y ? { willChange: "transform", y } : { willChange: "transform" }}
      initial={SIGNATURE_FROM}
      animate={SIGNATURE_TO}
      transition={SIGNATURE_TRANSITION}
      {...appearAttributes(
        SIGNATURE_APPEAR_ID,
        SIGNATURE_FROM,
        SIGNATURE_TO,
        SIGNATURE_TRANSITION,
      )}
    >
      <SignatureMark />
    </motion.div>
  );
}
