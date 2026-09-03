import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Grain } from "@/components/effects/Grain";
import { Highlighted } from "@/components/ui";
import type { HeroContent, HeroSubtitleParagraph } from "@/lib/content";

/**
 * Géométrie MESURÉE sur le live (rechargement complet à chaque largeur : Framer
 * bascule ses variantes responsive en JS, un simple redimensionnement ne
 * reflète donc pas la vraie mise en page).
 *
 * | | < 810 | 810 | ≥ 1200 |
 * |---|---|---|---|
 * | section  | 90svh, `0 20 20`    | 90svh, `60 24 30` | 90svh, `60 30 30` |
 * | titre    | 63px, pleine largeur | 78px, moitié droite | 98px, moitié droite |
 * | chapô    | 330px à gauche, aligné à gauche | 330px calé sur l'axe central, aligné à droite | idem |
 * | interligne | 20 | 30 | 30 |
 *
 * Le `padding-bottom` déclaré ici vaut le padding réel du live PLUS la rangée
 * de filtres et son interligne, parce que cette rangée vit chez nous dans
 * {@link WorkExplorer} (positionnée par rapport au haut de cette section) alors
 * que le live la garde dans le hero : 20+115+50 = 185, 30+70+70 = 170,
 * 30+30+80 = 140.
 *
 * S'y ajoutent 7px dès 810 : la rangée du chapô mesure 36px sur le live alors
 * que le chapô n'en fait que 29, sa hauteur étant imposée par la demi-colonne
 * jumelle (vide et invisible). Ces 7px de vide sont sous le texte, donc caler
 * le bas de NOTRE bloc sur le bas de la rangée du live descendait l'encre
 * d'autant. On cale sur le bas de l'encre : 170+7 et 140+7.
 */
const SECTION_CLS =
  "relative flex h-[90svh] w-full items-end overflow-hidden bg-background " +
  "px-[20px] pb-[185px] pt-0 text-foreground " +
  "tablet:px-[24px] tablet:pb-[177px] tablet:pt-[60px] " +
  "desktop:px-[30px] desktop:pb-[147px]";

/** Une moitié du rail : idiome Framer `flex: 1 0 0` sur une base de 1px. */
const HALF = "w-full tablet:w-px tablet:flex-[1_0_0]";

const PARAGRAPH_CLS =
  "whitespace-pre-wrap text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]";

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
      <GradientWaveBackdrop seed={34} />
      {/* MANQUANT jusqu'ici : `/work` n'avait aucun grain de section, le calque
          global inventé le masquait. RELEVÉ sur le live : hôte 1440 × 810 à
          1440 de fenêtre, z-1, opacité 0,05, motif 256 × 256. */}
      <Grain opacity={0.05} className="z-[1]" />
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/[0.08]"
      />

      <div className="relative z-[2] mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[20px] tablet:gap-[30px]">
        {/* Rangée titre : moitié gauche vide, titre dans la moitié droite. */}
        <div className="flex w-full flex-col tablet:flex-row tablet:items-start tablet:justify-center">
          <div aria-hidden className="hidden tablet:block tablet:w-px tablet:flex-[1_0_0]" />
          <div className={HALF}>
            <Reveal initialOpacity={0.001} initialY={36} duration={0.8}>
              <h1 className="m-0 text-[63px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[78px] desktop:text-[98px]">
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
