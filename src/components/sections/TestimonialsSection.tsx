import { Grain } from "@/components/effects/Grain";
import { ParallaxBackdrop } from "@/components/motion/ParallaxBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { Highlighted } from "@/components/ui";
import { homeContent } from "@/content/home";
import { uiLabels } from "@/content/ui";
import type { Testimonial } from "@/lib/content/types";

/**
 * TestimonialsSection — reproduction fidèle (CSS Framer → Tailwind) de la
 * section "What our clients say." / "Client stories" de la page d'accueil d'origine.
 *
 * Source markup : content/framer-html/section10.ts (composant partagé Framer
 * `framer-KMr8P` / `framer-zqInx` / `framer-WFebg` — sert home ET /about).
 * CSS : framer-global.css (le composant est mutualisé → règles hors framer-home).
 *
 * Périmètre RÉEL de la section : un carrousel de témoignages (une slide visible
 * à la fois) sur fond gris clair (--muted #e9e9e9). Colonne titre (h2 "What our
 * clients say." aligné à droite + label "Client stories"), puis un bloc :
 * phrase d'intro + flèches de navigation, et la carte de la slide active
 * (icône guillemets + citation + auteur + portrait carré encadré, flou de sa
 * propre image en fond). Filet vertical central (noir 8%).
 *
 * Le carrousel est rendu dans son ÉTAT FINAL STATIQUE : la slide active =
 * `testimonials[0]`. Les flèches sont décoratives (défilement GSAP câblé plus
 * tard, la liste complète reste disponible via les props).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, logique INVERSÉE) :
 *   base    = mobile   (≤809.98)  — variant Framer "Phone" (v-1fawy6i / v-qpykgh / v-1pxlf1s)
 *   tablet: = 810-1199 (≥810)     — variant "Tablet" (réutilise le layout "Desktop 1")
 *   desktop:= ≥1200               — variant "Desktop" (v-1uampfi / v-183ijgj / v-14ujtdl)
 *
 * Note fidélité :
 * - Le portrait source est une grande image CARRÉE en `object-cover` (pas un
 *   avatar rond) → rendu avec <img> comme le pilote StatsSection, pas le
 *   composant Avatar (rond, 32/48px) qui trahirait la maquette.
 * - L'intro `--extracted` est `opacity:0` sur le live (révélée au scroll) →
 *   rendue visible (état final).
 */

// Stack de police littérale Framer (résolue à l'identique via `geist`).
const FONT = "[font-family:var(--font-sans)]";

/** Chevron gauche exact du bouton de navigation (mask SVG Framer `framer-IGEtI`). */
function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M 11.67 1.77 L 9.89 0 L 0 9.9 L 9.9 19.8 L 11.67 18.03 L 3.54 9.9 Z"
        transform="translate(6.165 2.1)"
        fill="currentColor"
      />
    </svg>
  );
}

function NavArrows() {
  // framer-1ydicx1 : flèches prev/next (décoratives — carrousel non câblé).
  return (
    <div
      aria-hidden="true"
      className="relative flex w-min flex-row items-center gap-[7px] tablet:gap-[5px]"
    >
      {/* framer-vpndq7 (Stroke) : bouton "précédent" contour noir 12%.
          Le fond S'ASSOMBRIT au survol sur la source : relevé à 1440,
          `rgba(0,0,0,0)` → 0,008 à 40 ms → 0,027 à 80 ms → `rgba(0,0,0,0.04)`
          à 120 ms, puis stable. Nos flèches étaient totalement inertes, et le
          pointeur ne changeait même pas de forme (la source pose
          `cursor: pointer` sur les deux pastilles). */}
      <div className="relative flex aspect-square h-[30px] w-[30px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[rgba(0,0,0,0.12)] bg-[rgba(0,0,0,0)] transition-colors duration-150 ease-out hover:bg-[rgba(0,0,0,0.04)] motion-reduce:transition-none tablet:h-[21px] tablet:w-[21px]">
        <Chevron className="h-[10px] w-[10px] text-background tablet:h-[8px] tablet:w-[8px]" />
      </div>
      {/* framer-177goyz (Filled) : bouton "suivant" plein noir, flèche blanche.
          Relevé sur la source : le fond passe de `rgb(11,11,11)` (le token
          --background) au NOIR PUR `rgb(0,0,0)` — 10 à 40 ms, 6 à 80 ms, 3 à
          120 ms, 0 à 180 ms. */}
      <div className="relative flex aspect-square h-[30px] w-[30px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-background transition-colors duration-150 ease-out hover:bg-black motion-reduce:transition-none tablet:h-[21px] tablet:w-[21px]">
        <Chevron className="h-[10px] w-[10px] rotate-180 text-foreground tablet:h-[8px] tablet:w-[8px]" />
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { quote, author } = testimonial;
  const avatar = author.avatar;
  return (
    // framer-14ujtdl : carte (grille 2 colonnes dès 810 ; empilée en mobile)
    <div className="relative flex w-full flex-col items-start gap-[20px] tablet:grid tablet:auto-rows-[minmax(0,1fr)] tablet:grid-cols-[repeat(2,minmax(50px,1fr))] tablet:grid-rows-[repeat(1,minmax(0,1fr))] tablet:justify-center tablet:gap-0">
      {/*
        framer-1tz3rxu : colonne citation (alignée à droite dès 810).

        Le retrait droit de 40px est FIXE, pas un palier : la règle Framer de
        base pose `padding: 0 40px 0 0` et la variante téléphone ne remet
        JAMAIS le rembourrage à zéro. Relevé sur `/live-proxy/about` aux 18
        largeurs de contrôle : `padding: 0px 40px 0px 0px` de 320 à 1920 sans
        exception. Le `pr-0` mobile posé ici rendait la colonne 40px trop
        large, donc la citation se repliait sur une ligne de moins : la page
        sortait 24px trop courte à 320, 360 et 430 (une ligne de 24px), et
        juste par hasard à 390 et 600, largeurs où le repli tombe pareil.
      */}
      <div className="relative flex w-full flex-col items-start justify-start gap-[20px] pr-[40px] tablet:h-full tablet:items-end tablet:justify-end tablet:gap-[50px] tablet:[place-self:end_start]">
        {/* framer-bop934 : icône guillemets (noir 7%) */}
        <svg
          viewBox="0 0 93 70"
          aria-hidden="true"
          className="h-[47px] w-[63px] flex-none tablet:h-[70px] tablet:w-[93px]"
        >
          <path
            d="M 37.007 0 L 25.016 32.941 L 40.521 32.941 L 40.521 70 L 0 70 L 0 36.647 L 15.712 0 Z M 88.486 0 L 76.494 32.941 L 92 32.941 L 92 70 L 51.479 70 L 51.479 36.647 L 67.191 0 Z"
            fill="#0b0b0b"
            opacity="0.07"
          />
        </svg>

        {/* framer-17ap54t : citation + auteur */}
        <div className="flex w-full flex-col items-start gap-[14px] tablet:items-end tablet:gap-[20px]">
          {/* framer-1xqnj9j : citation (32px desktop / 22px mobile) */}
          <p className="w-full max-w-[560px] text-left text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-background tablet:text-right tablet:text-[32px]">
            {/* La citation monte LIGNE PAR LIGNE, en décalé, comme la source.
                Le découpage est mesuré sur le rendu du navigateur, jamais écrit
                en dur : les retours à la ligne dépendent de la largeur. */}
            <LineReveal
              text={`${uiLabels.testimonials.quoteOpen}${quote}${uiLabels.testimonials.quoteClose}`}
              className="block w-full"
              lineClassName="w-full overflow-hidden"
              delay={0.1}
            />
          </p>
          {/* framer-ahx0ye : bloc auteur */}
          <div className="flex w-full flex-col items-start gap-[2px] tablet:items-end">
            {/* framer-c5k4iq : nom (preset 2okhk1, 14px, noir plein) */}
            <p className="w-full whitespace-pre-wrap break-words text-left text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-background tablet:text-right">
              {author.name}
            </p>
            {/* framer-zd6atp : rôle (preset 1epsd85, 12px, noir 60%) */}
            {author.role ? (
              <p className="w-full whitespace-pre-wrap break-words text-left text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-[rgba(11,11,11,0.6)] tablet:text-right">
                {author.role}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* framer-kjtsce : colonne portrait (carré encadré, flou de sa propre image) */}
      <div className="relative flex w-full max-w-[570px] flex-col items-center tablet:[place-self:start]">
        {/* framer-l6zna5 : portrait net au premier plan (inset 40px) */}
        {avatar ? (
          <div className="absolute inset-[40px] z-[2] overflow-hidden">
            {/* Le portrait net est un calque de parallaxe sur la source
                (`framer-l6zna5-container`, débord 6 %), pas une image posée à
                plat : il dérivait donc de zéro pendant que le reste bougeait. */}
            <ParallaxBackdrop src={avatar.src} overshoot={0.06} label={avatar.alt} />
          </div>
        ) : null}
        {/* framer-1kgy2te : fond (même image en cover, assombrie + floutée) */}
        <div className="relative flex w-full flex-col">
          <div className="relative z-[1] aspect-square w-full overflow-hidden">
            {avatar ? (
              <img
                src={avatar.src}
                alt=""
                aria-hidden="true"
                decoding="async"
                loading="lazy"
                width={987}
                height={987}
                className="block h-full w-full object-cover object-center [filter:brightness(0.82)]"
              />
            ) : null}
            {/* framer-nzzveg : voile flou (backdrop-filter 7px) */}
            <div className="absolute inset-0 z-[1] [backdrop-filter:blur(7px)]" />
            {/* framer-1a28i9x « BG » : grain du portrait. RELEVÉ sur `/` et
                `/about` : hôte carré 570 × 570 à 1440 (381 à 810, 350 à 390),
                z-1, opacité 0,08, et DÉRIVANT — il était figé en `inset-0`,
                donc absent de l'inventaire de grain des deux pages. */}
            <Grain opacity={0.08} className="z-[1]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Habillage de la section (surtitre, titre en deux lignes, phrase d'intro et ses
 * fragments en emphase). Il était recopié EN DUR et EN ANGLAIS dans le JSX alors
 * que `homeContent.testimonials` le porte traduit : la home et `/about`
 * montent la MÊME section Framer, seul le témoignage affiché change. Les props
 * restent ouvertes ; le défaut vient de la donnée, faute d'appelant modifiable
 * dans ce lot.
 */
export function TestimonialsSection({
  testimonials,
  eyebrow = homeContent.testimonials.eyebrow ?? "",
  titleLines = homeContent.testimonials.titleLines ?? [],
  intro = homeContent.testimonials.intro ?? "",
  introEmphasis = homeContent.testimonials.introEmphasis ?? [],
}: {
  testimonials: Testimonial[];
  eyebrow?: string;
  /** Deux lignes exactement : leur concaténation redonne le titre. */
  titleLines?: readonly string[];
  intro?: string;
  /** Fragments de l'intro rendus en noir plein. */
  introEmphasis?: readonly string[];
}) {
  const active = testimonials[0];
  if (!active) return null;

  return (
    // framer-1uampfi : section (fond gris clair, flex col centrée)
    <section
      data-section="testimonials"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-[10px] overflow-hidden bg-muted " +
        "px-[20px] pt-[20px] pb-[40px] " +
        "tablet:px-[24px] tablet:pt-0 tablet:pb-[100px] " +
        "desktop:px-[30px] desktop:pb-[130px]"
      }
    >
      {/* framer-7whvzl : Container (max 1440, aligné à gauche) */}
      <div className="relative flex w-full max-w-[1440px] flex-col items-start gap-[30px]">
        {/* framer-c5lc8k : ligne titre (empilée en mobile, côte à côte dès 810) */}
        <div className="relative flex w-full flex-col items-start tablet:flex-row">
          {/* framer-1ml5ma5 : Title Column (order 1 en mobile, aligné à droite dès 810) */}
          <div className="relative order-1 flex w-full flex-none flex-row items-start justify-start gap-[10px] pt-[12px] tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:justify-end tablet:pt-[30px]">
            {/* framer-n2j28m-container : conteneur titre */}
            <div className="relative h-auto w-px max-w-[360px] flex-[1_0_0] tablet:max-w-[570px]">
              {/* framer-n2j28m h2 (52 / 68 / 92px, ls -0.05em, lh 0.82)
                  Deux lignes EXPLICITES, chacune un bloc `overflow: hidden`
                  (le masque de révélation du live) contenant un inline-block.
                  La coupure n'est pas cosmétique : les lignes viennent de
                  `testimonials.titleLines` et la PREMIÈRE porte son espace
                  finale (« Ce que disent  », comme « What our  » sur la
                  source), conservée par `white-space: pre-wrap`. Alignée à
                  droite, cette espace décale l'encre vers la gauche ; un retour
                  à la ligne naturel l'aurait mangée et collé la première ligne
                  au bord droit. */}
              {/* Les deux lignes montent derrière leur masque, décalées de
                  100 ms, depuis un déclencheur UNIQUE porté par le `h2`.
                  L'observateur était posé sur chaque ligne : raisonnant sur la
                  boîte translatée de 40 px et clippée par le masque, il partait
                  trop tard et chacune pour son compte. Mesuré par saut direct
                  puis attente de 1,7 s à 1440x900 : « What our » restait masqué
                  à 803 et se révélait à 753, quand la source le révèle dès 895
                  (masqué à 944) ; « clients say. » accusait 215 px de retard.
                  La marge basse nulle est désormais celle de TOUT le site, et
                  n'a plus à être demandée ici : cf. `REVEAL_BOTTOM_MARGIN`. */}
              <LineReveal
                as="h2"
                lines={[...titleLines]}
                className="relative m-0 flex w-full max-w-full flex-col justify-center p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-background tablet:text-right tablet:text-[68px] desktop:text-[92px]"
                lineClassName="w-full overflow-hidden"
              />
            </div>
          </div>

          {/* framer-102a0qa : Label (order 0 en mobile, aligné à droite dès 810) */}
          <div className="relative order-0 flex w-full flex-row items-start justify-start overflow-hidden tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:justify-end">
            {/* framer-101sjeo : surtitre (preset wwtw0z, uppercase 12px, noir 60%) */}
            <p className="h-auto w-auto whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-[rgba(11,11,11,0.6)]">
              {eyebrow}
            </p>
          </div>
        </div>

        {/* framer-18gctyq-container : bloc carrousel */}
        <div className="relative w-full">
          {/* framer-183ijgj : colonne (intro+flèches, puis carte), alignée à droite */}
          <div className="relative flex w-full flex-col items-end gap-[24px] tablet:gap-[20px]">
            {/* framer-14xjsfk : ligne intro (pleine largeur en mobile, 50% dès 810) */}
            <div className="relative flex w-full flex-row items-center justify-start tablet:w-[50%]">
              {/* framer-14d87yu : intro + flèches (justifiées aux extrémités) */}
              <div className="relative flex w-px max-w-[570px] flex-[1_0_0] flex-row items-end justify-between overflow-hidden">
                {/* framer-1oceisj : phrase d'intro (preset wwtw0z, noir 60% + mots noir plein) */}
                {/* Cette phrase apparaît en FONDU sur la source, sans
                    translation. Elle était rendue immobile. */}
                <Reveal
                  as="p"
                  initialOpacity={0.001}
                  duration={0.8}
                  delay={0.15}
                  className="relative w-px max-w-[240px] flex-[1_0_0] whitespace-pre-wrap break-words text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-[rgba(11,11,11,0.6)]">
                  {/* Texte = `testimonials.intro`, emphase = `introEmphasis`.
                      Les deux fragments en noir plein étaient des `<span>`
                      écrits en anglais : la traduction de la donnée ne les
                      atteignait pas. Polarité et couleurs inchangées. */}
                  <Highlighted
                    text={intro}
                    highlights={[...introEmphasis]}
                    highlightClassName="text-background"
                  />
                </Reveal>
                <NavArrows />
              </div>
            </div>

            {/* framer-13dslov-container : carte de la slide active */}
            <div className="relative w-full">
              <TestimonialCard testimonial={active} />
            </div>
          </div>
        </div>
      </div>

      {/* framer-1goovjr : filet vertical central (noir 8%) */}
      <div className="absolute bottom-0 left-[calc(50%-0.5px)] top-0 z-[1] w-px bg-background opacity-[0.08]" />
    </section>
  );
}
