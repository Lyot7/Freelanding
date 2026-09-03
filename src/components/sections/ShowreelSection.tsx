"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "motion/react";
import { getImageProps } from "next/image";
import type { ShowreelContent } from "@/lib/content/types";
import { Highlighted } from "@/components/ui";
import { Reveal, framerTween } from "@/components/motion/Reveal";
import { useParallaxLayerY } from "@/components/motion/ParallaxImage";

/**
 * ShowreelSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de
 * la section "Showreel" de la page d'accueil d'origine.
 *
 * Source : markup content/framer-html/showreel.ts, CSS framer-home.css
 * (`.framer-pK5Ni …`) + framer-global.css (preset wwtw0z, composant bouton
 * `.framer-1IPfM`, carte image `.framer-o4tPc`).
 *
 * Section CLAIRE (fond #e9e9e9 = --muted) à texte SOMBRE (#0b0b0b = --background,
 * utilisé comme couleur de texte ici). Les fragments atténués sont à
 * rgba(11,11,11,0.6). Arbre DOM exact (profondeur mesurée sur le markup) :
 *
 *   section.framer-eevidw «Showreel»
 *   ├─ div.framer-zwr6wa «Container»
 *   │  ├─ div.framer-qg566l            → titre (h2 code-component) + millésime
 *   │  │  ├─ div.framer-1meikvu › .framer-1dj4y9g-container › h2 «We build websites.»
 *   │  │  └─ div.framer-cgi2xw › .framer-10avnw0 «2019-26©»
 *   │  ├─ div.framer-2ep735 › .framer-10zgv6y › .framer-1rwf4d9 (statement)
 *   │  ├─ div.framer-1aqbja5 › .framer-jk323i › .framer-1fvka9i-container
 *   │  │     › .framer-milu93 (Variant 1) › [.framer-1ambeg8-container (média) + .framer-30jb7g-container (grain)]
 *   │  └─ div.framer-1o61kva › .framer-p9gdz0 › [«↓ SEE THE WORK» + bouton «Showreel» (Vector)]
 *   └─ div.framer-ok755s «Line»       → filet vertical central (noir 8 %)
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base = MOBILE (≤809.98) · tablet: 810-1199 · desktop: ≥1200.
 *   Règle : quand Framer n'a PAS de variante tablette, `tablet:` porte la valeur
 *   DESKTOP (car ≥810 hérite du desktop) ; `desktop:` n'est ajouté que si desktop
 *   diffère de tablette.
 *
 * Consolidation des variantes SSR (hidden-3h40ll = masqué mobile, hidden-ujbit7 =
 * masqué tablette, hidden-72rtr7 = masqué desktop) : le markup duplique le
 * «↓ SEE THE WORK» et le bouton «Showreel» en une variante desktop/tablette
 * (text-left) et une variante phone (text-right). Les boutons Desktop (v-1b551yo)
 * et Phone (v-17gwhp5) sont VISUELLEMENT IDENTIQUES (aucune règle propre à
 * v-17gwhp5). → chaque paire est fusionnée en UN élément responsive (règle du
 * guide « 3 variants SSR → UN composant »). D'où « Showreel ×3 » et « Vector ×2 »
 * de l'inventaire source qui deviennent 2 et 1 après fusion : aucun élément
 * UNIQUE n'est retiré, seuls des doublons de breakpoint sont dédupliqués.
 *
 * Reveals d'apparition (primitive @/components/motion/Reveal, repos = état final
 * VISIBLE) reproduits depuis les états initiaux inline de la source :
 *   - lignes du titre : opacity 0 + translateY(40px) → visible (stagger) ;
 *   - statement (.framer-1rwf4d9) : opacity 0 → visible ;
 *   - média (.framer-1ambeg8-container) : opacity 0 + scale(1.1) → visible.
 * Les timings/delays exacts (JSON __framer__appearAnimations absent pour cette
 * section) seront affinés dans le lot animation ; la robustesse repos=visible
 * garantit un SSR/statique correct quelle que soit l'approximation.
 */

// Police exacte du preset wwtw0z ("Geist","Geist Placeholder").
const FONT = "[font-family:var(--font-sans)]";

// Largeur RENDUE du cadre, relevée : 378 px à 1440 (soit 26 vw), colonne pleine
// en mobile. Sert à choisir la variante servie par l'optimiseur.
const POSTER_SIZES = "(min-width: 810px) 30vw, 100vw";

/*
 * Le poster passe par l'optimiseur SANS changer de balise : `getImageProps` rend
 * `src`/`srcSet`/`sizes` que l'on pose sur le `motion.img` existant. Un
 * `next/image` à la place aurait imposé ses propres `position`/`inset`, et ce
 * calque tient précisément par son sur-cadrage `top:-6% / height:112%` plus la
 * valeur de mouvement `y` — deux choses qu'un composant tiers ne doit pas
 * toucher. Géométrie donc strictement inchangée, seuls les octets bougent.
 */
/**
 * L'AFFICHE VIENT DE LA DONNÉE, `showreel.poster`.
 *
 * Elle était écrite en dur ici, sur l'image du template, alors que le champ
 * existait déjà dans le modèle de contenu et portait la même adresse. Le
 * remplacement du visuel dans la donnée n'aurait donc rien changé à l'écran :
 * c'est la constante qui gagnait. Le calcul se fait au rendu et non plus au
 * chargement du module, puisqu'il dépend maintenant d'une prop.
 */
function posterDe(poster: ShowreelContent["poster"]) {
  const alt = poster?.alt ?? "";
  if (!poster?.src) return { src: undefined, srcSet: undefined, alt };
  const { src, srcSet } = getImageProps({
    src: poster.src,
    alt,
    width: poster.width ?? 756,
    height: poster.height ?? 480,
    sizes: POSTER_SIZES,
  }).props;
  // `alt` EST RENVOYÉE, et elle l'était déjà : c'est le JSX qui l'ignorait en
  // écrivant `alt=""` et `aria-hidden` en dur. Une affiche réellement
  // décorative laisse simplement `alt` vide dans la donnée.
  return { src, srcSet, alt };
}

// Preset wwtw0z : Geist 12px / 500 / -0.01em / 120% / uppercase.
const PRESET_WWTW0Z =
  "m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]";

/**
 * Titre du showreel : des lignes empilées, révélées en cascade.
 *
 * LES LIGNES VIENNENT DE LA DONNÉE (`showreel.marqueeLines`). Elles étaient
 * déduites du texte en coupant à chaque espace, ce qui donnait un mot par ligne.
 * La phrase anglaise de la source en compte trois et tombait juste ; la
 * française en compte sept, et le bloc affichait « JE / CONSTRUIS / DES /
 * SITES / ET / DES / OUTILS. », dont quatre lignes réduites à un ou deux
 * caractères dans un corps de 92 px.
 *
 * Le repli mot à mot est conservé pour une donnée qui ne déclare pas ses
 * lignes : le composant reste utilisable sans configuration.
 */
function Headline({
  marquee,
  marqueeLines,
}: {
  marquee: string;
  marqueeLines?: readonly string[];
}) {
  const lines = marqueeLines?.length ? [...marqueeLines] : marquee.split(" ");
  return (
    // framer-1dj4y9g-container : conteneur du code-component (flex:none;width:100%)
    <div data-part="headline" className="relative w-full flex-none">
      {/* h2 : 52px text-left (mobile) → 68px text-right (tablette) → 92px (desktop) */}
      <h2 className="relative m-0 flex w-full flex-col justify-center p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-background tablet:text-right tablet:text-[68px] desktop:text-[92px]">
        {lines.map((word, i) => (
          // span externe = masque du slide-up (overflow-hidden), l'alignement
          // du texte est hérité du h2.
          <span
            key={`${word}-${i}`}
            className="accent-room descender-room block w-full overflow-hidden leading-[0.82]"
          >
            <Reveal
              as="span"
              className="inline-block whitespace-pre-wrap"
              initialOpacity={0.001}
              initialY={40}
              transition={framerTween(0.8, 0.1 + i * 0.1)}
            >
              {word}
            </Reveal>
          </span>
        ))}
      </h2>
    </div>
  );
}

export function ShowreelSection({ showreel }: { showreel: ShowreelContent }) {
  const {
    src: posterSrc,
    srcSet: posterSrcSet,
    alt: posterAlt,
  } = posterDe(showreel.poster);
  const posterFrame = useRef<HTMLDivElement>(null);
  // 0.06 : la source pose ce calque en `top:-6%; height:calc(100% + 12%)`.
  const posterY = useParallaxLayerY(posterFrame, 0.06);
  const { marquee, vintage, cta, statement } = showreel;
  const statementEmphasis = showreel.statementEmphasis
    ? [...showreel.statementEmphasis]
    : [];
  return (
    // framer-eevidw : section claire (fond --muted), colonne centrée.
    <section
      data-section="showreel"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-[10px] overflow-hidden bg-muted " +
        "p-[20px] tablet:px-[24px] tablet:py-[30px] desktop:p-[30px]"
      }
    >
      {/* framer-zwr6wa : Container (max 1440, colonne alignée à gauche) */}
      <div className="relative flex w-full max-w-[1440px] flex-col items-start justify-center gap-[20px] overflow-visible tablet:gap-[30px]">
        {/* framer-qg566l : titre + millésime (colonne mobile, rangée dès 810) */}
        <div className="relative flex w-full flex-col items-start justify-start gap-[8px] overflow-visible tablet:flex-row tablet:justify-center tablet:gap-0">
          {/* framer-1meikvu : colonne titre (order 1 mobile) */}
          <div className="relative order-1 flex w-full flex-none flex-col items-start justify-end gap-[8px] overflow-visible tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:flex-row tablet:gap-[10px]">
            <Headline marquee={marquee} marqueeLines={showreel.marqueeLines} />
          </div>

          {/* framer-cgi2xw : colonne millésime (order 0 mobile) */}
          <div className="relative order-0 flex w-full flex-none flex-row items-start justify-end gap-0 overflow-hidden tablet:order-none tablet:w-px tablet:flex-[1_0_0]">
            {/* framer-10avnw0 : « 2019-26© » (preset wwtw0z, noir 60 %) */}
            <div
              data-part="vintage"
              className="relative h-auto w-auto flex-none whitespace-pre"
            >
              <p className={`${PRESET_WWTW0Z} text-[rgba(11,11,11,0.6)]`}>
                {vintage}
              </p>
            </div>
          </div>
        </div>

        {/* framer-2ep735 : rangée du statement (justify-end).

            `accent-room` sur les DEUX boîtes imbriquées : elles portent chacune
            un `overflow-hidden`, et rogner une seule des deux ne montre rien de
            plus. Le débord relevé est de 0,7 px sur le « É » d'« ÉVIDENT »
            (encre 10,9 px pour 10,2 px de place à 12 px de corps) : assez peu
            pour passer inaperçu à la lecture, assez pour aplatir l'accent. */}
        <div className="accent-room relative flex w-full flex-none flex-row items-center justify-end gap-0 overflow-hidden">
          {/* framer-10zgv6y : demi-colonne (100 % mobile, 50 % dès 810) */}
          <div className="accent-room relative flex w-full flex-none flex-row items-center justify-start gap-[10px] overflow-hidden tablet:w-1/2">
            {/* framer-1rwf4d9 : phrase manifeste (max 220px), reveal opacity */}
            <Reveal
              className="relative h-auto w-px max-w-[220px] flex-[1_0_0] whitespace-pre-wrap break-words"
              initialOpacity={0.001}
              transition={framerTween(0.8, 0)}
            >
              {/* Texte = `showreel.statement`, emphase = `statementEmphasis`.
                  La phrase et ses deux fragments étaient recopiés EN DUR et EN
                  ANGLAIS dans ce JSX : traduire la donnée ne changeait rien à
                  l'écran. Les DEUX couleurs de la source sont conservées à
                  l'identique, seul l'élément qui les porte change : la phrase
                  passe en noir 60 % et les fragments en noir plein (auparavant
                  l'inverse, exprimé par des `<span>` sur le texte courant). Le
                  rendu est strictement le même. */}
              <p className={`${PRESET_WWTW0Z} text-[rgba(11,11,11,0.6)]`}>
                <Highlighted
                  text={statement}
                  highlights={statementEmphasis}
                  highlightClassName="text-background"
                />
              </p>
            </Reveal>
          </div>
        </div>

        {/* framer-1aqbja5 : rangée de la carte média (justify-end) */}
        <div className="relative flex w-full flex-none flex-row items-center justify-end gap-0 overflow-hidden">
          {/* framer-jk323i : demi-colonne (100 % mobile, 50 % dès 810) */}
          <div className="relative flex w-full flex-none flex-row items-center justify-start gap-[10px] overflow-hidden tablet:w-1/2">
            {/* framer-1fvka9i-container : carte vidéo — aspect 1.575 à toutes
                tailles (≈222px mobile, ≈266px tablette), fixée 378×240 desktop. */}
            <div
              ref={posterFrame}
              className="relative z-[1] aspect-[1.575] w-px flex-[1_0_0] desktop:h-[240px] desktop:w-[378px] desktop:flex-none"
            >
              {/* framer-milu93 (Variant 1) : rempli à 100 % (styles inline) */}
              <div className="relative flex h-full w-full flex-col items-start gap-[10px] overflow-hidden">
                {/* framer-1ambeg8-container : média, reveal opacity + scale(1.1) */}
                <Reveal
                  className="relative h-px w-full flex-[1_0_0]"
                  initialOpacity={0.001}
                  initialScale={1.1}
                  transition={framerTween(1, 0)}
                >
                  <div className="relative h-full w-full overflow-hidden">
                    {/* overlay z-1000 (vide dans la source) */}
                    <div className="absolute inset-0 z-[1000]" />
                    {/* Média = POSTER statique (background-image de l'archive) : la
                        source n'autoplay pas de vidéo ici, elle affiche l'image
                        `ROGfhegD` ; la vidéo (VIDEO_SRC) est ouverte au clic sur ▶.
                        Sur-cadrée top/bottom -6 % comme la source, et DÉRIVANT
                        au scroll : le sur-cadrage était là, le mouvement non. */}
                    <motion.img
                      src={posterSrc}
                      srcSet={posterSrcSet}
                      sizes={POSTER_SIZES}
                      /* L'ALTERNATIVE VIENT DE LA DONNÉE, et elle était ignorée :
                         `posterDe` la renvoyait déjà, le JSX écrivait `alt=""` et
                         `aria-hidden` en dur par-dessus. L'image portait donc le
                         seul argument visuel de la section sans que personne
                         d'autre que les voyants ne puisse le recevoir. Une
                         affiche décorative garde le comportement d'origine en
                         laissant simplement `alt` vide dans la donnée. */
                      alt={posterAlt}
                      aria-hidden={posterAlt ? undefined : true}
                      decoding="async"
                      className="pointer-events-none absolute inset-x-0 top-[-6%] h-[calc(100%+12%)] w-full select-none object-cover object-center"
                      style={posterY ? { y: posterY } : undefined}
                    />
                  </div>
                </Reveal>

                {/* AUCUN GRAIN ICI. L'inventaire structurel de `/` sur le live
                    (17 calques à 1440, 17 à 810, 17 à 390) n'en compte aucun
                    entre le calque de la section « About » (y1186) et la
                    première carte « Works » (y1545) : la section « Showreel »
                    (y1757, hauteur 688) n'en a pas. Le nôtre, à 0,1, était en
                    plus posé sur un hôte de 378 × 240 et non sur le cadre
                    vidéo. Retiré : on ne pose pas un calque absent de la
                    source. */}
              </div>
            </div>
          </div>
        </div>

        {/* framer-1o61kva : rangée basse.
            ELLE PORTAIT DEUX CONTRÔLES, ET AUCUN DES DEUX NE MARCHAIT.

            Le bouton « Showreel ▶ » a été SUPPRIMÉ le 2026-08-27. C'était un
            `<button type="button">` sans `onClick`, sans état et sans modale :
            zéro gestionnaire dans tout le fichier. Il venait du template, où le
            studio d'origine avait une bande démo à ouvrir au clic. Eliott n'en a
            pas. Un triangle de lecture est la première chose sur laquelle un
            visiteur curieux appuie, et un lecteur d'écran l'annonçait « Showreel,
            bouton », donc il promettait une action à quelqu'un qui ne pouvait
            même pas constater qu'il ne se passait rien.

            Le libellé « ↓ VOIR LES RÉALISATIONS » était rendu en `<p>`, alors que
            la donnée porte son `href` depuis le début (`showreel.cta`). Il n'était
            donc pas cliquable non plus : retirer le bouton seul aurait laissé une
            section qui annonce une destination et n'y mène pas. Il est devenu le
            lien qu'il prétendait être. */}
        <div className="relative flex w-full flex-none flex-row items-center justify-start gap-0 overflow-visible">
          <div className="relative flex w-px flex-[1_0_0] flex-col items-start justify-start gap-[6px] overflow-visible tablet:w-1/2 tablet:flex-none tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-0">
            <div className="relative h-auto w-full flex-none whitespace-pre-wrap break-words tablet:w-auto tablet:whitespace-pre">
              {cta?.href ? (
                <Link
                  href={cta.href}
                  className={`${PRESET_WWTW0Z} block text-right text-[rgba(11,11,11,0.6)] no-underline transition-colors duration-200 hover:text-background tablet:text-left`}
                >
                  {showreel.ctaPrefix}
                  {cta.label}
                </Link>
              ) : (
                <p
                  className={`${PRESET_WWTW0Z} text-right text-[rgba(11,11,11,0.6)] tablet:text-left`}
                >
                  {showreel.ctaPrefix}
                  {cta?.label}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* framer-ok755s : filet vertical central (noir 8 %) */}
      <div className="absolute left-[calc(50%-0.5px)] top-0 z-[1] h-full w-px overflow-hidden bg-background opacity-[0.08]" />
    </section>
  );
}
