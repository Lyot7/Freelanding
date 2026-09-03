"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { HomeContent, Link as LinkData, Stat } from "@/lib/content/types";
import { BrandB } from "@/components/brand/BrandB";
import { siteConfig } from "@/content/site";
import { Icon } from "@/components/ui";
import {
  EASE_FRAMER,
  Reveal,
} from "@/components/motion/Reveal";
import { inViewOnce } from "@/components/motion/inViewOnce";

/**
 * WhyUsSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de la
 * section « Why us? » / « Built on reputation » de la page d'accueil d'origine.
 *
 * Source : markup content/framer-html/number.ts (section `.framer-5mbkz6`),
 * CSS framer-home.css + framer-global.css (presets `wwtw0z`, `1hgnchr`, classes
 * de lien `.framer-19qt3v8`). Valeurs lues, jamais devinées.
 *
 * Périmètre RÉEL de la section (inventaire reproduit à l'identique) :
 *   - Label « Why us? »  (preset wwtw0z, rgba(11,11,11,0.6))   — data-framer-name « 2019-26© »
 *   - Titre h2 « Built on reputation » (2 lignes masquées, 92/68/52px, noir)
 *   - Card container 1 (fond noir #0b0b0b) : description + compteur BLANC « /4.9+ »
 *       + lien « Our Reviews » → trustpilot (2 copies Text pour le swap au hover)
 *   - Card container 2 (fond blanc #fff) : description + compteur NOIR « /80% »
 *       + lien « Start a Project » → /contact (2 copies Text)
 *   - Logo (mark `#svg-2098037606_341` absent de l'archive → wordmark de repli)
 *       superposé à la Trust Image (zEI0hdyA7XwBgF3OgjoRGPVMk.jpg, brightness .74)
 *   - Line : filet vertical central (noir 8%)
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base = mobile (≤809.98) · tablet: ≥810 · desktop: ≥1200.
 *
 * Robustesse (cf. StatsSection / HeroSection) : l'état de REPOS (SSR, no-JS,
 * onglet caché, prefers-reduced-motion) est TOUJOURS l'état final VISIBLE. Les
 * compteurs affichent leur valeur finale (« 4.9 », « 80 ») et montent de 0 en
 * BONUS au reveal ; jamais bloqués sur « 0 » si l'animation ne tourne pas. Les
 * cartes / logo / lignes du titre ne sont jamais masqués au repos.
 */

// Stack de police littérale Framer (identique dans les deux environnements :
// `geist` enregistre un nom de famille hashé résolu à l'identique).
const FONT = "[font-family:var(--font-sans)]";

/** Couleur de repli des libellés/nombres « sombres » sur fond clair (token d26d0a6a). */
const DARK_60 = "text-[rgba(11,11,11,0.6)]";

// useLayoutEffect côté client (avant paint), useEffect en SSR (no-op).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Décompose la valeur d'un Stat en cible numérique + nombre de décimales. */
function parseStat(stat: Stat): { target: number; decimals: number } {
  const suffix = stat.suffix ?? "";
  let base = stat.value;
  if (suffix && base.endsWith(suffix)) {
    base = base.slice(0, base.length - suffix.length);
  }
  const target = Number.parseFloat(base) || 0;
  const dot = base.indexOf(".");
  const decimals =
    stat.format === "decimal" ? (dot >= 0 ? base.length - dot - 1 : 1) : 0;
  return { target, decimals };
}

/**
 * Compteur count-up ROBUSTE. Repos = valeur finale visible ; au reveal (entrée
 * dans le viewport, hors reduced-motion) il descend à 0 puis remonte — la mise à
 * 0 est faite en useLayoutEffect (avant paint) → aucun flash de la valeur finale
 * avant l'animation.
 *
 * CE COMPTEUR RESTE AU REPOS VISIBLE, contrairement aux apparitions de style qui
 * rendent désormais leur état masqué dès le HTML serveur. La raison est qu'il
 * n'y a rien à masquer : un chiffre rendu à zéro puis animé serait FAUX pour un
 * lecteur sans script, là où un `opacity: 0.001` n'est qu'invisible. Et il n'y a
 * pas de rejeu possible : aucune `key` ne bascule ici, la valeur ne descend à
 * zéro qu'au franchissement du seuil, jamais après coup.
 */
function CountUp({ target, decimals }: { target: number; decimals: number }) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  useIsoLayoutEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    // Le décompte doit partir à l'ENTRÉE DANS LE VIEWPORT, pas au montage.
    // Un simple drapeau « monté côté client » le lançait au chargement : les
    // chiffres montaient pendant que le visiteur était encore en haut, et se
    // trouvaient déjà figés à leur valeur finale quand il arrivait devant.
    // C'est ce qui donnait l'impression qu'ils s'affichent d'un coup.
    let controls: { stop: () => void } | null = null;
    // Observateur PARTAGÉ, à la marge commune du site. Un observateur propre à
    // chaque compteur était instancié ici, avec un retrait de 100 px au bord
    // bas : la source, elle, déclenche au bord bas même. Encadré sur la home,
    // fenêtre 1440x900 : les cinq compteurs sont encore à zéro quand leur haut
    // est à 930 et ont atteint leur valeur (4.9, 89, 60, 3.2, 89) à 870.
    const stop = inViewOnce(el, () => {
      setValue(0);
      controls = animate(0, target, {
        duration: 1.4,
        ease: EASE_FRAMER,
        onUpdate: (v) => setValue(v),
        onComplete: () => setValue(target),
      });
    });
    return () => {
      stop();
      controls?.stop();
    };
  }, [reduce, target]);
  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

/**
 * Compteur encadré « / <nombre> <glyphe> » (spans décoratifs `/` + suffixe),
 * reproduit le composant Framer « Number » (flex, gap 0, ls -0.07em, weight 500).
 * `colorClass` = couleur du nombre (blanc sur carte noire / noir sur carte blanche).
 */
function NumberCounter({
  stat,
  prefix,
  suffix,
  colorClass,
}: {
  stat: Stat;
  prefix: string;
  suffix: string;
  colorClass: string;
}) {
  const { target, decimals } = parseStat(stat);
  return (
    // framer-bi5vwq-container / framer-1201c1c-container : hauteur réservée
    <div className="relative h-[50px] w-auto tablet:h-[60px] desktop:h-[74px]">
      <div
        className={
          "flex items-center gap-0 text-[44px] font-medium tracking-[-0.07em] leading-[normal] tablet:text-[52px] desktop:text-[64px] " +
          colorClass
        }
      >
        <span>{prefix}</span>
        <CountUp target={target} decimals={decimals} />
        <span>{suffix}</span>
      </div>
    </div>
  );
}

/**
 * Lien à swap (2 copies Text + flèche), reproduit `.framer-19qt3v8`
 * (preset 1hgnchr 13px, gap 4px, w-min). Repos : copie 1 en place, copie 2
 * masquée au-dessus (opacity 0) ; le hover fait glisser l'une hors du clip et
 * l'autre en place (bonus pur CSS, sans JS). `colorClass` colore texte + flèche.
 */
function SwapLink({ cta, colorClass }: { cta: LinkData; colorClass: string }) {
  const cls =
    "group relative inline-flex w-min cursor-pointer flex-row items-center justify-end gap-[4px] overflow-hidden whitespace-pre text-[13px] font-medium leading-[1.2] tracking-[-0.01em] no-underline " +
    colorClass;
  // Course de 14px et durée de 105ms : valeurs MESURÉES sur le live. C'est le
  // survol le plus rapide du site — nous étions à 300ms, presque trois fois
  // trop lent. La course est exprimée en pixels absolus (et non en 140%) parce
  // que c'est ainsi qu'elle a été relevée : elle ne dépend pas de la hauteur de
  // la copie. La flèche, elle, ne bouge pas : elle descend à 50 % d'opacité.
  const swapCls =
    "transition-all duration-[105ms] ease-out motion-reduce:transition-none";
  const inner = (
    <>
      {/* framer-1headui : copie visible au repos */}
      <span className={`relative block whitespace-pre group-hover:translate-y-[14px] ${swapCls}`}>
        {cta.label}
      </span>
      {/* framer-1et5oru : copie masquée au-dessus (rentre au hover) */}
      <span className={`pointer-events-none absolute left-0 top-0 z-[1] block -translate-y-[14px] whitespace-pre opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${swapCls}`}>
        {cta.label}
      </span>
      {/* framer-1ijauur : flèche 15px (sprite #2430009286 = arrow-up-right) */}
      <Icon
        name="arrow-up-right"
        size={15}
        className={`shrink-0 transition-opacity duration-[105ms] ease-out group-hover:opacity-50 motion-reduce:transition-none ${colorClass}`}
      />
    </>
  );
  return cta.external ? (
    <a
      href={cta.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
    >
      {inner}
    </a>
  ) : (
    <Link href={cta.href} className={cls}>
      {inner}
    </Link>
  );
}

/** Description d'une carte (preset 1hgnchr, max-w 160, text-wrap balance). */
function CardDescription({
  text,
  colorClass,
}: {
  text: string;
  colorClass?: string;
}) {
  return (
    // framer-1tf3anj / framer-pf6mob : rangée du haut
    <div className="relative flex w-full flex-row items-start justify-start gap-[10px] overflow-hidden">
      {/* framer-89gcrg / framer-12dm1do : texte (flex 1 0 0, max 160, balance) */}
      <p
        className={
          "relative m-0 h-auto w-px max-w-[160px] flex-[1_0_0] whitespace-pre-wrap break-words text-[13px] font-medium leading-[1.2] tracking-[-0.01em] [text-wrap:balance] " +
          (colorClass ?? "text-foreground")
        }
      >
        {text}
      </p>
    </div>
  );
}

/**
 * Titre « Built on reputation » : h2 flex-colonne, 2 lignes masquées (chaque
 * ligne clip son overflow, le texte monte de y40 + fade au reveal). La source
 * encode exactement 2 lignes (« Built on » / « reputation ») à TOUS les
 * breakpoints : le dernier mot passe seul à la ligne (hypothèse documentée).
 */
function Title({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  const lines =
    words.length <= 1
      ? [title]
      : [words.slice(0, -1).join(" "), words[words.length - 1]];
  return (
    // framer-vlbdp8 : wrapper du titre
    <div className="accent-clip-titre relative order-1 flex w-full flex-row items-start justify-start gap-0 overflow-clip tablet:order-none tablet:w-px tablet:flex-[1_0_0]">
      {/* framer-1kk4nz3-container : conteneur du code-component */}
      <div className="relative h-auto w-px flex-[1_0_0]">
        <h2 className="relative m-0 flex w-full max-w-full flex-col justify-center p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-background tablet:text-[68px] desktop:text-[92px]">
          {lines.map((line, i) => (
            <span
              key={line}
              className="accent-room descender-room mb-0 block w-full overflow-hidden text-left leading-[0.82]"
            >
              <Reveal
                as="span"
                /* `clip-path` OUVERT PAR LE HAUT.
                   Il valait `inset(0 0 0 0)`, c'est-à-dire la boîte exacte de
                   l'élément. Or l'encre d'une capitale accentuée MONTE
                   au-dessus de cette boîte : 84,3 px au-dessus de la ligne de
                   base à 92 px de corps, quand la boîte de ligne n'en fait que
                   75,4. Le titre affichait donc « BATI SUR LA PREUVE ».

                   C'est la seule occurrence de `clip-path` du site, et elle
                   trompait tous les diagnostics : `overflow-clip-margin`,
                   `padding`, hauteur de masque — rien n'a d'effet sur un
                   `clip-path`, qui découpe le rendu final sans rien demander à
                   la mise en page. La zone de coupe des ancêtres était large,
                   le fond de section était sous l'accent, et l'accent
                   n'apparaissait pas.

                   Les valeurs négatives suivent les trois paliers du titre
                   (52/68/92 px), comme `accent-clip-titre`. Rien n'est révélé
                   au-delà : la zone gagnée est au-dessus du texte. */
                className="inline-block whitespace-pre-wrap [clip-path:inset(-12px_0_0_0)] tablet:[clip-path:inset(-16px_0_0_0)] desktop:[clip-path:inset(-22px_0_0_0)]"
                initialOpacity={0.001}
                initialY={40}
                duration={0.8}
                delay={0.1 * i}
              >
                {line}
              </Reveal>
            </span>
          ))}
        </h2>
      </div>
    </div>
  );
}

export function WhyUsSection({ whyUs }: { whyUs: HomeContent["whyUs"] }) {
  const eyebrow = whyUs.eyebrow ?? "";
  const ratingStat = whyUs.stats[0];
  const referralStat = whyUs.stats[1];
  const reviewsCta = whyUs.ctas?.[0];
  const projectCta = whyUs.ctas?.[1];

  return (
    // framer-5mbkz6 : section (fond #e9e9e9, flex col centrée)
    <section
      data-section="whyus"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-[10px] overflow-hidden bg-muted " +
        "pt-[20px] pr-[20px] pb-0 pl-[20px] " +
        "tablet:pt-[30px] tablet:pr-[24px] tablet:pl-[24px] " +
        "desktop:pr-[30px] desktop:pl-[30px]"
      }
    >
      {/* framer-147k902 : Container (max 1440, aligné à gauche) */}
      <div className="relative flex w-full max-w-[1440px] flex-col items-start justify-center gap-[20px] overflow-visible tablet:gap-0">
        {/* framer-11045uf : rangée [label | titre] (empilée en mobile) */}
        <div className="relative flex w-full flex-col gap-[12px] overflow-visible tablet:flex-row tablet:items-start tablet:justify-center tablet:gap-0">
          {/* framer-fdv2eb : Label (colonne mobile, order 0) */}
          <div className="relative order-0 flex w-full flex-col items-start gap-[8px] overflow-visible tablet:w-px tablet:flex-[1_0_0] tablet:flex-row tablet:gap-[10px]">
            {/* framer-1q56wxs : « Why us? » (preset wwtw0z, noir 60%) */}
            <p className={"m-0 h-auto w-auto whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] " + DARK_60}>
              {eyebrow}
            </p>
          </div>

          <Title title={whyUs.title ?? ""} />
        </div>

        {/* framer-x6vmjd : colonne des cartes + logo */}
        <div className="relative z-[1] flex w-full flex-col items-center justify-center gap-[10px] overflow-hidden tablet:gap-0">
          {/* framer-1oosgvg : Card container 1 (carte noire alignée vers le centre) */}
          <div className="relative flex w-full flex-row items-center justify-start gap-0 overflow-hidden">
            {/* framer-rwwyaz : moitié gauche, carte collée à droite */}
            <div className="relative flex w-px flex-[1_0_0] flex-col items-end justify-end gap-[10px] overflow-hidden tablet:w-1/2 tablet:flex-none">
              {/* framer-1mfsxcd : carte noire (fade au reveal) */}
              <Reveal
                as="div"
                className="relative flex h-[220px] w-full flex-col items-center justify-between bg-background p-[20px] tablet:aspect-[1.34643] tablet:h-[280px] tablet:w-[377px]"
                initialOpacity={0.001}
                duration={0.8}
              >
                <CardDescription text={ratingStat.label} />
                {/* framer-aazft : rangée [nombre | lien] */}
                <div className="relative flex w-full flex-row items-end justify-between overflow-hidden">
                  <NumberCounter
                    stat={ratingStat}
                    prefix="/"
                    suffix="+"
                    colorClass="text-foreground"
                  />
                  {reviewsCta && (
                    <SwapLink cta={reviewsCta} colorClass="text-foreground" />
                  )}
                </div>
              </Reveal>
            </div>
          </div>

          {/* framer-10jctn5 : Card container 2 (carte blanche alignée vers le centre) */}
          <div className="relative z-[2] flex w-full flex-row items-center justify-end gap-0 overflow-hidden">
            {/* framer-1qz9ze0 : moitié droite, carte collée à gauche */}
            <div className="relative flex w-px flex-[1_0_0] flex-col items-start justify-start gap-[10px] overflow-hidden tablet:w-1/2 tablet:flex-none">
              {/* framer-uo2ku2 : carte blanche (fade au reveal) */}
              <Reveal
                as="div"
                className="relative flex h-[220px] w-full flex-col items-center justify-between bg-foreground p-[20px] tablet:aspect-[1.34643] tablet:h-[280px] tablet:w-[377px]"
                initialOpacity={0.001}
                duration={0.8}
              >
                <CardDescription text={referralStat.label} colorClass={DARK_60} />
                {/* framer-7fg37k : rangée [nombre | lien] */}
                <div className="relative flex w-full flex-row items-end justify-between overflow-hidden">
                  <NumberCounter
                    stat={referralStat}
                    prefix="/"
                    suffix="%"
                    colorClass="text-background"
                  />
                  {projectCta && (
                    <SwapLink cta={projectCta} colorClass="text-background" />
                  )}
                </div>
              </Reveal>
            </div>
          </div>

          {/* framer-1tkzsc8 : Logo container */}
          <div className="relative flex w-full flex-row items-center justify-start gap-0 overflow-visible">
            {/* framer-5ua4mr : moitié gauche, logo collé vers le centre */}
            <div className="relative flex w-[350px] flex-col items-start justify-start gap-[10px] overflow-visible tablet:w-1/2 tablet:flex-row tablet:items-center tablet:justify-end">
              {/* framer-10jafgd : bloc 100×100 (logo + trust image), fade au reveal */}
              <Reveal
                as="div"
                /* `bg-background` : la plaque n'avait AUCUN fond, elle
                   comptait entièrement sur son image pour exister. Tant que
                   celle-ci n'était pas arrivée, le carré de 100 px était un trou
                   transparent sur le gris clair de la section — avec dessus un
                   monogramme blanc, donc illisible. Un aplat sombre au ton de
                   l'image (luminance moyenne relevée à 19,5/255, le jeton
                   `--background` vaut #0b0b0b) rend la plaque correcte dès la
                   première peinture, que l'image soit là ou non. */
                className="relative flex h-[100px] w-[100px] flex-row items-center justify-center gap-[10px] overflow-hidden bg-background tablet:aspect-square"
                initialOpacity={0.001}
                duration={0.8}
              >
                {/* framer-tp2f93 : la marque, superposée au visuel.
                    C'ÉTAIT LE LOGO FRAMER (`#svg-2098037606_341`, trois
                    parallélogrammes), et il portait pourtant un libellé
                    accessible disant « Bouquerel® » : le lecteur d'écran
                    annonçait donc une marque que le dessin ne montrait pas.
                    Remplacé par le monogramme d'Eliott. Le B et non le
                    logotype : dans une pastille de 100 px de côté,
                    « BOUQUEREL » (rapport 10,9) tiendrait sur 5 px de hauteur
                    de capitale. La boîte passe de 52 × 25 à un carré de 42, le
                    monogramme étant à peu près carré (rapport 1,029) là où le
                    dessin d'origine était deux fois plus large que haut. */}
                <div className="relative z-[2] flex h-[42px] w-[43px] items-center justify-center tablet:h-[45px] tablet:w-[46px]">
                  <BrandB
                    cadrage="tight"
                    title={`${siteConfig.brand.name}${siteConfig.brand.mark}`}
                    className="h-full w-full text-foreground"
                  />
                </div>
                {/* framer-1r7f32 : le visuel de fond, qui remplit le bloc.
                    C'ÉTAIT LA PHOTO D'UNE INCONNUE, tirée du template et posée
                    sous la marque : un visage sans licence traçable, présenté
                    comme un élément de l'identité du site. Remplacé par une
                    image du mécanisme d'horlogerie du hero, extraite de notre
                    propre boucle (`public/videos/hero-loop.mp4`), ce qui
                    raccorde la pastille au reste de la page.
                    L'ASSOMBRISSEMENT DE 0,74 EST RETIRÉ : il servait à faire
                    ressortir un logo blanc sur une photo claire. Cette image-ci
                    est déjà dans le registre sombre du site (luminance moyenne
                    mesurée à 19,5 sur 255), et le filtre l'aurait noyée.
                    `width`/`height` = la boîte d'AFFICHAGE, c'est elle qui
                    décide de la largeur demandée à l'optimiseur. */}
                <div className="absolute inset-0 z-[1] overflow-visible">
                  {/* `loading="eager"` : le gabarit par défaut de `next/image`
                      est `lazy`, et attendre l'observateur d'intersection n'a
                      aucun sens ici — la variante servie pèse 2 Ko pour un cadre
                      de 100 px. On paie une latence visible pour une économie
                      qui n'existe pas. Pas de `preload` pour autant : ce bloc est
                      à plus de 5 000 px du haut de l'accueil, un indice de
                      préchargement dans l'en-tête serait du gaspillage. */}
                  <Image
                    src="/images/mecanisme-carre.jpg"
                    alt=""
                    width={100}
                    height={100}
                    loading="eager"
                    className="block h-full w-full object-cover object-center"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* framer-1uiizu3 : filet vertical central (noir 8%) */}
      <div className="absolute left-[calc(50%-0.5px)] top-0 z-0 h-full w-px bg-background opacity-[0.08]" />
    </section>
  );
}
