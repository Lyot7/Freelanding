import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { Grain } from "@/components/effects/Grain";
import { Highlighted } from "@/components/ui";
import type { HeroContent, HeroSubtitleParagraph } from "@/lib/content";

/**
 * LE HÉROS DE `/realisations` MONTRE UN PROJET : la boucle de Kpsull, muette, sous
 * un voile qui garde le titre lisible. L'affiche reste dessous, à toutes les
 * largeurs : en mouvement réduit ou en profil léger, la boucle ne se monte pas.
 */
const SECTION_CLS =
  "relative flex h-[calc(90svh/var(--zoom-ecran,1))] min-h-[560px] w-full items-end overflow-hidden bg-background " +
  "px-[20px] pb-[30px] pt-0 text-foreground " +
  "tablet:px-[24px] tablet:pb-[50px] tablet:pt-[60px] " +
  "desktop:px-[30px]";

/** Une moitié du rail : idiome Framer `flex: 1 0 0` sur une base de 1px. */
const HALF = "w-full tablet:w-px tablet:flex-[1_0_0]";

const PARAGRAPH_CLS =
  "whitespace-pre-wrap text-[14px] font-medium leading-[1.35] tracking-[-0.01em]";

function SubtitleParagraph({ part }: { part: HeroSubtitleParagraph }) {
  // Polarité inversée : le paragraphe passe en blanc plein et ce sont ses
  // fragments qui redescendent à 60 %.
  return (
    <p
      className={`${PARAGRAPH_CLS} ${part.inverted ? "text-foreground" : "text-foreground-60"}`}
    >
      <Highlighted
        text={part.text}
        highlights={part.emphasis ? [...part.emphasis] : []}
        highlightClassName={
          part.inverted ? "text-foreground-60" : "text-foreground"
        }
      />
    </p>
  );
}

export function WorkHero({ hero }: { hero: HeroContent }) {
  const paragraphs: readonly HeroSubtitleParagraph[] =
    hero.subtitleParagraphs ?? (hero.subtitle ? [{ text: hero.subtitle }] : []);

  return (
    <section className={SECTION_CLS}>
      {hero.media ? (
        <ScrollParallax
          factor={0.15}
          decorative
          className="pointer-events-none absolute inset-0 z-0 overflow-clip"
        >
          {hero.media.poster ? (
            <Image src={hero.media.poster} alt="" fill preload sizes="100vw" className="object-cover" />
          ) : null}
          <HeroVideo src={hero.media.src} />
        </ScrollParallax>
      ) : null}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(11,11,11,0.45)_0%,rgba(11,11,11,0.6)_45%,rgba(11,11,11,0.92)_100%)]"
      />
      {/* MANQUANT jusqu'ici : `/work` n'avait aucun grain de section, le calque
          global inventé le masquait. RELEVÉ sur le live : hôte 1440 × 810 à
          1440 de fenêtre, z-1, opacité 0,05, motif 256 × 256. */}
      <Grain className="z-[1]" />
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/[0.08]"
      />

      <div className="relative z-[2] [text-shadow:0_0_18px_rgba(0,0,0,.45)] mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[20px] tablet:gap-[30px]">
        {/* Rangée titre : moitié gauche vide, titre dans la moitié droite. */}
        <div className="flex w-full flex-col tablet:flex-row tablet:items-start tablet:justify-center">
          <div aria-hidden className="hidden tablet:block tablet:w-px tablet:flex-[1_0_0]" />
          <div className={HALF}>
            <Reveal
              trigger="appear"
              appearId="realisations-hero-titre"
              initialOpacity={0.001}
              initialY={36}
              duration={0.8}
            >
              {/* Corps calé sur le mot le plus long de la demi-colonne. */}
              <h1 className="m-0 text-[clamp(38px,calc(11.6vw/var(--zoom-ecran,1)),63px)] titre-marque tablet:text-[clamp(44px,calc(5.6vw/var(--zoom-ecran,1)),84px)]">
                {hero.title}
              </h1>
            </Reveal>
          </div>
        </div>

        {/* Rangée chapô : bloc de 330px calé à droite de la moitié GAUCHE,
            donc contre l'axe central. */}
        {paragraphs.length > 0 ? (
          <div className="flex w-full flex-col tablet:flex-row tablet:items-start tablet:justify-center">
            <div className={`flex ${HALF} tablet:justify-end`}>
              <Reveal
                trigger="appear"
                appearId="realisations-hero-chapo"
                className="flex w-full max-w-[330px] flex-col text-left tablet:text-right"
                initialOpacity={0.001}
                initialY={16}
                delay={0.12}
                duration={0.7}
              >
                {paragraphs.map((part) => (
                  <SubtitleParagraph key={part.text} part={part} />
                ))}
              </Reveal>
            </div>
            <div aria-hidden className="hidden tablet:block tablet:w-px tablet:flex-[1_0_0]" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
