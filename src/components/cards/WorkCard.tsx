"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { Grain } from "@/components/effects/Grain";
import { Ticker } from "@/components/ui/Ticker";
import { uiLabels } from "@/content/ui";
import type { WorkItem } from "@/lib/content/types";
import {
  getWorkCardMedia,
  type ResolvedWorkCardMedia,
} from "./work-card-media";

/**
 * WorkCard — carte projet du portfolio (section "Works" de la home + page /work).
 *
 * Reproduction fidèle (état final, sans scroll-animation) de la carte Framer
 * (markup: content/framer-html/works.ts, CSS: framer-home.css / framer-global.css
 * scopes `.framer-deuDo` / `.framer-40F7T`).
 *
 * Périmètre RÉEL de la carte source :
 *   - Fond plein-cadre = la cover, assombrie (`filter:brightness(0.6)`) et floutée
 *     (`backdrop-filter:blur(9px)` via un overlay). `.framer-1cogzvi` + `.framer-15xox3v`.
 *   - Grain de bruit tuilé 10% par-dessus (`.framer-q8jnk9-container`, texture
 *     rR6HYXBrMmX4cRpXfXUOvpvpB0.png, 256×256, repeat).
 *   - Contenu (`.framer-hbvb8z`, grille 12 colonnes max-w 1440) : index "(0N)"
 *     span 2 | colonne centrale span 8 | "Portfolio" span 2, + filet vertical
 *     central (`.framer-17jsry5`, blanc 18%).
 *   - Colonne centrale (`.framer-yfgcmn`) : vignette NETTE (aspect 1.73678,
 *     `.framer-1d2pg7v`) au-dessus d'une ligne titre + (catégories / année).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base   = mobile   (≤809.98)   → variant `.framer-v-1q2zv7r` : colonne,
 *            catégories déplacées en haut à droite, carte hauteur auto.
 *   tablet = 810-1199 (≥810)      → layout desktop (grille), carte 100vh.
 *   desktop= ≥1200    (≥1200)     → identique tablette (grille), carte 100vh.
 *
 * Notes fidélité / incertitudes :
 *   - Le gros titre "Box mode" 100px est le ticker `.framer-mou1lw`, RENDU via
 *     `<Ticker>` (voir ui/Ticker.tsx). Il avait été écarté à tort au motif d'un
 *     `opacity:0` relevé sur snapshot statique : ce n'était que son état
 *     d'apparition non déclenché, Framer ne le révélant qu'à la première entrée
 *     dans le viewport. Mesuré actif sur le live à -110 px/s.
 *     Le titre 12px du preset `wwtw0z` (`.framer-xi3cbs`) reste affiché en plus.
 *   - Catégories = texte 12px uppercase borderless dans Framer (pas de pilule) →
 *     le composant Badge (pilule bordée) casserait la fidélité, donc texte simple.
 *   - `index` est POSITIONNEL (pas un champ de WorkItem) → prop optionnelle,
 *     fournie par WorksSection. Absente → label "(0N)" masqué (colonne conservée).
 *   - Nomad Stays utilise le MP4 exact de l'archive. La cover reste son poster
 *     statique et le fallback lorsque l'utilisateur réduit les animations.
 */

// Stack de police littérale Framer (résolue à l'identique, nom de famille hashé).
const FONT = "[font-family:var(--font-sans)]";

// Preset `framer-styles-preset-wwtw0z` : Geist 12px / weight 500 / uppercase /
// line-height 120% / letter-spacing -0.01em / couleur #fff.
// `whitespace-pre` : le live est en `white-space: pre` sur ces libellés. Sans lui,
// « Web design » se cassait en deux lignes (mesuré 44×29 px au lieu de 72×14).
const TXT =
  "whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground";

function padIndex(n: number): string {
  return `(${String(n).padStart(2, "0")})`;
}

function WorkCardVideo({
  src,
  poster,
  reducedMotion,
}: {
  src: string;
  poster: string;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const pause = () => video.pause();
    if (reducedMotion) {
      pause();
      video.currentTime = 0;
      return;
    }

    const play = () => {
      const playback = video.play();
      playback?.catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          (error.name === "AbortError" || error.name === "NotAllowedError")
        ) {
          return;
        }
        console.warn("Nomad project video could not start.", error);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      play();
      return pause;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) play();
      else pause();
    });
    observer.observe(video);

    return () => {
      observer.disconnect();
      pause();
    };
  }, [reducedMotion]);

  return (
    <video
      ref={ref}
      aria-hidden
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      /* `absolute inset-0`, et c'est le CŒUR du réglage, pas une préférence.
         Le cadre parent déclare `aspect-[1.73678]` et son enfant direct prend
         `h-full`. Une hauteur en pourcentage contre une hauteur DÉDUITE d'un
         `aspect-ratio` retombe sur `auto`, et le `min-height: auto` de
         l'élément flex plancher alors à la hauteur du CONTENU. Une vidéo dans
         le flux apporte sa hauteur intrinsèque : nos rushes font 1152 × 748,
         soit un rapport de 1,54011, et c'est LUI qui sortait — mesuré
         932 × 605,1 à 1440 là où la source rend 932 × 536,6, et de même aux
         cinq largeurs (+25,8 px à 390 jusqu'à +70,5 à 1920).
         Le chemin IMAGE n'avait pas le défaut parce que `next/image fill` pose
         `position: absolute` : il n'apporte aucune hauteur intrinsèque, donc le
         rapport déclaré tient. On aligne donc la vidéo sur l'image. */
      className="absolute inset-0 block h-full w-full object-cover object-center"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

function WorkCardMedia({
  media,
  reducedMotion,
  alt,
  sizes,
}: {
  media: ResolvedWorkCardMedia;
  reducedMotion: boolean;
  alt: string;
  sizes: string;
}) {
  if (media.kind === "video") {
    return (
      <WorkCardVideo
        src={media.src}
        poster={media.poster.src}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <Image
      src={media.image.src}
      alt={alt}
      fill
      sizes={sizes}
      className="block h-full w-full object-cover object-center"
    />
  );
}

/** Liste de catégories : stack vertical de libellés 12px (`.framer-psk9` / `.framer-3gm1li`). */
function CategoryList({
  categories,
  align,
}: {
  categories: string[];
  align: "start" | "end";
}) {
  return (
    // framer-psk9 (start) / framer-3gm1li (end) : colonne, gap 3px, largeur min
    <div
      className={
        "flex w-min flex-col gap-[3px] " +
        (align === "end" ? "items-end" : "items-start")
      }
    >
      {categories.map((category) => (
        // framer-19bq1ad / framer-9uwocc : rangée gap 10px, largeur min
        <div key={category} className="flex w-min flex-row items-center gap-[10px]">
          {/* framer-11ux14u / framer-qtzsgm : libellé (preset wwtw0z) */}
          <p className={TXT}>{category}</p>
        </div>
      ))}
    </div>
  );
}

export function WorkCard({ work, index }: { work: WorkItem; index?: number }) {
  const label = index != null ? padIndex(index) : null;
  const { cover } = work;
  const media = getWorkCardMedia(work);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;

  return (
    // framer-1l83zgi (contenu) : détails du projet, ÉPINGLÉS. Le fond plein cadre
    // n'est PAS ici : il vit au niveau du hublot (voir WorkCardBackground).
    <div
      data-part="work-card"
      className={
        FONT +
        " relative flex h-[100vh] w-full flex-col items-center justify-center overflow-hidden"
      }
    >
      {/* framer-1i699rn : bandeau titre défilant (Ticker Framer, -110 px/s).
          Empilement MESURÉ sur le live : z-1 comme le fond mais APRÈS lui dans le
          DOM (donc devant), et AVANT le wrapper de contenu (donc derrière l'image
          du projet et les libellés). La bande est centrée à 50 % de la carte. */}
      <Ticker text={work.title} />

      {/* framer-q8jnk9-container : grain de la carte. RELEVÉ sur `/` et `/work` :
          hôte 1440 × 900, z-2, opacité 0,1. */}
      <Grain opacity={0.1} className="z-[2]" />

      {/* framer-17jsry5 : filet vertical central (blanc 18%).
          Placé AVANT le contenu : à `z-index` égal, l'ordre du DOM décide, donc le
          filet passe DERRIÈRE l'image du projet, comme sur le live. Quand il était
          déclaré après, un hit-test au centre de la carte renvoyait le filet et non
          l'image : une ligne pâle traversait visiblement le visuel. */}
      <div className="absolute left-[calc(50%-0.5px)] top-0 z-[1] h-full w-px bg-foreground opacity-[0.18]" />

      {/* framer-7nnyja + framer-1l83zgi : wrapper de contenu (sticky aplati) */}
      <div className="relative z-[1] flex w-full flex-1 flex-col items-center justify-center px-[20px]">
        {/* framer-hbvb8z : Project Details — grille 12 colonnes, max 1440 */}
        {/* `flex-1 justify-center` dès le mobile : MESURÉ sur le live, ce bloc
            REMPLIT la hauteur de la carte (844 px à 390) et centre son contenu,
            ce qui plaque « (0N) » en haut et « Portfolio » en bas. Avec un
            `flex-1` limité à `tablet:`, le bloc ne mesurait que 364 px et flottait
            au centre : « Portfolio » remontait de 240 px et « (0N) » descendait
            d'autant. Le seul écart VISIBLE relevé sur cette carte en mobile. */}
        <div className="flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center tablet:grid tablet:auto-rows-[minmax(0,1fr)] tablet:grid-cols-[repeat(12,minmax(50px,1fr))] tablet:grid-rows-[repeat(1,minmax(0,1fr))] tablet:justify-center tablet:gap-x-[4px] tablet:gap-y-0">
          {/* framer-1re7eic : index "(0N)" — span 2, ancré haut */}
          <div className="flex w-full flex-col items-start gap-[10px] pt-[20px] tablet:col-span-2 tablet:h-full tablet:self-start tablet:pt-[30px]">
            {label ? <p className={TXT}>{label}</p> : null}
          </div>

          {/* framer-xobkg3 : colonne centrale — span 8 */}
          <div className="flex w-full flex-1 flex-row items-center justify-center tablet:col-span-8 tablet:h-full tablet:self-start">
            {/* framer-yfgcmn : vignette + détails, colonne centrée */}
            <div className="relative flex w-full flex-1 flex-col items-center gap-[18px] tablet:gap-[20px]">
              {/* framer-17rc84i : catégories (mobile uniquement, haut/droite) */}
              <div className="flex w-full flex-row items-start justify-end tablet:hidden">
                <CategoryList categories={work.categories} align="end" />
              </div>

              {/* framer-1d2pg7v : vignette NETTE (aspect 1.73678). */}
              <div className="relative flex aspect-[1.73678] w-full items-center justify-center overflow-visible">
                {/* framer-1j5jail : image de la vignette. Le plateau 3D est
                    DANS le média (voir `scripts/mockup-projets.mjs`), pas
                    autour : un châssis dessiné en CSS par-dessus une scène qui
                    en porte déjà un montrait deux ordinateurs emboîtés. */}
                <div className="relative h-full w-full overflow-hidden">
                  <WorkCardMedia
                    media={media}
                    reducedMotion={reducedMotion}
                    alt={cover.alt}
                    sizes="(min-width: 810px) 66vw, 100vw"
                  />
                </div>
              </div>

              {/* framer-bch4bh : titre + (catégories / année) — grille 8 colonnes en desktop */}
              <div className="flex w-full flex-col items-center gap-[6px] tablet:grid tablet:auto-rows-[minmax(0,1fr)] tablet:grid-cols-[repeat(8,minmax(50px,1fr))] tablet:grid-rows-[repeat(1,minmax(0,1fr))] tablet:items-start tablet:justify-center tablet:gap-0">
                {/* framer-vrdzs4 : titre (span 4) */}
                <div className="flex w-full flex-col items-start gap-[10px] tablet:col-span-4 tablet:self-start">
                  {/* framer-xi3cbs : titre du projet (preset wwtw0z, 12px) */}
                  <p className={TXT}>{work.title}</p>
                </div>

                {/* framer-1a0srkf : catégories (desktop) + année (span 4, espacés) */}
                <div className="flex w-full flex-row items-start justify-between tablet:col-span-4 tablet:self-start">
                  {/* framer-psk9 : catégories inline desktop (masquées en mobile) */}
                  <div className="hidden tablet:flex">
                    <CategoryList categories={work.categories} align="start" />
                  </div>
                  {/* framer-1xit64b : année (opacity 0.6) */}
                  {work.year ? (
                    <p className={TXT + " opacity-60"}>{work.year}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* framer-18p7ay4 : libellé de section — span 2, ancré haut/droite */}
          <div className="flex w-full flex-col items-end gap-[10px] pb-[20px] tablet:col-span-2 tablet:h-full tablet:self-start tablet:pt-[30px] tablet:pb-0">
            {/* framer-1j960ao : libellé section (preset wwtw0z).
                IL DISAIT « PORTFOLIO » SUR LES TROIS CARTES. Le mot ne dit rien
                que la page ne dise déjà, et il occupait la seule place où le
                CONTEXTE du projet pouvait se lire : `client` porte « Projet
                monté en propre », « Würth France, en stage », « Workshop
                d'école ». Trois projets dont deux d'école et un stage étaient
                présentés sans que rien ne le signale, alors que la donnée le
                disait déjà — elle n'était simplement affichée nulle part.
                Le repli garde le libellé générique pour une carte sans
                `client` : cette colonne ne doit jamais rendre du vide. */}
            <p className={TXT}>{work.client ?? uiLabels.work.portfolioLabel}</p>
          </div>
        </div>
      </div>

    </div>
  );
}

/**
 * WorkCardBackground — framer-1cogzvi « Image / Video Wrapper ».
 *
 * Placement CRITIQUE, mesuré sur le live : ce fond est un enfant direct du HUBLOT
 * (le lien de la carte), et NON du conteneur épinglé. Il défile donc avec la
 * carte pendant que les détails restent épinglés au viewport — c'est précisément
 * ce qui produit l'effet « l'image reste figée tandis que l'arrière-plan bouge ».
 *
 * Relevé : sur le live `fondTop - hublotTop = 0` sur tout le passage de la carte
 * (le fond suit le hublot). Quand ce fond était placé DANS le sticky, la même
 * mesure donnait une pente de +1,000 px/px, soit jusqu'à 300 px d'écart de
 * cadrage à mi-parcours, et l'effet disparaissait puisque tout était épinglé.
 */
export function WorkCardBackground({ work }: { work: WorkItem }) {
  /* LE FOND IGNORE LE PLATEAU 3D, volontairement. Il est agrandi plein cadre,
     assombri et flouté : y envoyer la scène donnerait un ordinateur géant et
     flou derrière l'ordinateur net de la vignette, soit le même objet deux
     fois à deux échelles. La capture brute donne une texture, ce qu'on lui
     demande. */
  const media = getWorkCardMedia({ ...work, cardMockup: undefined });
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden [filter:brightness(0.6)]">
      <WorkCardMedia
        media={media}
        reducedMotion={reducedMotion}
        alt=""
        sizes="100vw"
      />
      {/* framer-15xox3v : overlay flou (backdrop-filter blur 9px) */}
      <div className="absolute inset-0 backdrop-blur-[9px]" />
    </div>
  );
}
