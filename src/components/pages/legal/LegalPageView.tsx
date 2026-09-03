import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { RichText } from "@/components/pages/RichText";
import type { LegalDocument, SiteConfig } from "@/lib/content/types";
import { Grain } from "@/components/effects/Grain";
import { formatLongDate } from "@/components/format-date";
import { uiLabels } from "@/content/ui";

export function LegalPageView({
  document,
  site,
}: {
  document: LegalDocument;
  site: SiteConfig;
}) {
  return (
    <>
      <SvgSprite />
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        {/* Rembourrage BAS remesuré sur les deux documents et aux quatre
            largeurs : le bloc de contenu du héros se termine à 750 pour une
            section de 810 à 390 (donc 60), et à 720 à 810, 1200 et 1440 (donc
            90). Nous étions à 64 et 30, ce qui posait tout le héros 60 px trop
            bas en tablette et au-delà. */}
        <section className="relative flex h-[90svh] items-end overflow-hidden bg-background px-[20px] pb-[60px] pt-[140px] text-foreground tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px]">
          <GradientWaveBackdrop seed={34} />
          {/* RELEVÉ sur `/legal/privacy-policy` : hôte 1440 × 810, z-1,
              opacité 0,05. La page n'a que trois calques : ce héros, le grain
              plein footer et celui de la carte témoignage du footer. */}
          <Grain opacity={0.05} className="z-[1]" />
          <span className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/10" />
          {/* DEUX RANGÉES, PAS DEUX COLONNES SUR LA MÊME LIGNE.
              Relevé sur la source (`/live-proxy`, quatre largeurs, les deux
              documents) : le bloc de contenu contient une rangée « titre » puis
              une rangée « résumé », séparées de 20 px à 390 et de 30 px au-delà.
              Le titre occupe la MOITIÉ DROITE (cellule 690 à 1440, 570 à 1200,
              381 à 810) et le résumé la moitié GAUCHE, calé à droite de sa
              cellule. La gouttière horizontale est NULLE : le titre commence
              exactement sur la ligne médiane (x = 720 à 1440) et le résumé s'y
              termine.

              Nous posions les deux sur une SEULE rangée alignée en bas, avec une
              gouttière de 42 px et une marge basse de 64 px sur le titre. Trois
              conséquences mesurées : le titre commençait 21 px trop à droite
              (741 au lieu de 720), il finissait 69 px trop bas (716 au lieu de
              647), et à 810 sa colonne amputée de 21 px le faisait passer de
              deux à TROIS lignes (192 px de haut au lieu de 128). */}
          <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] gap-[20px] tablet:grid-cols-2 tablet:gap-x-0 tablet:gap-y-[30px]">
            <Reveal
              initialOpacity={0.001}
              initialY={80}
              duration={1.2}
              className="accent-room clip-room [--accent-room:26px] [--clip-room:4px] tablet:col-start-2 tablet:row-start-1"
            >
              {/* 510px de large sur la source à 1200 comme à 1440 (nous étions à
                  560, sans effet sur la coupure mais faux au repère). */}
              <h1 className="max-w-[510px] text-[63px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[78px] desktop:text-[98px]">
                {document.title}
              </h1>
            </Reveal>
            {/* 12px sur 280px de large : MESURÉ sur le live (nous étions à 11px
                sur 330px, d'où une coupure de lignes différente). */}
            <p className="max-w-[280px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/60 tablet:col-start-1 tablet:row-start-2 tablet:justify-self-end tablet:text-right">
              {document.summary}
            </p>
          </div>
        </section>

        {/* Rembourrage 30 en haut / 60 en bas sur la source (pas 70/70), et la
            grille n'a AUCUNE gouttière : la colonne de texte occupe exactement
            la moitié droite, plafonnée à 600px et calée à gauche de cette
            moitié. Un `pl-40` l'amputait de 40px supplémentaires, ce qui
            rallongeait le document de plus de 500px en tablette. */}
        <article className="relative bg-muted p-[20px] text-background tablet:px-[24px] tablet:pb-[60px] tablet:pt-[30px] desktop:px-[30px]">
          <span className="absolute inset-y-0 left-1/2 hidden w-px bg-background/10 tablet:block" />
          {/* AUCUN plafond de 1440 ici, contrairement à la page ARTICLE du
                blog qui, elle, en pose un sur la source (temps de lecture à
                x 240 des deux côtés à 1920). Le gabarit légal étale sa grille
                sur toute la largeur : relevé à 1920, conteneur [x 30, largeur
                1860], colonnes de 930. Notre plafond posait « Dernière mise à
                jour » à x 240 au lieu de x 30, soit 210 px d'écart. La colonne
                de texte, elle, ne bouge pas : son propre `max-w-[600px]` la cale
                au même endroit des deux côtés. */}
          <div className="relative grid gap-y-[28px] tablet:grid-cols-2 tablet:gap-0">
            {/* Le libellé et les noms de mois viennent de `uiLabels.dates` : ce
                bloc portait « Last updated: » et son propre tableau de mois
                anglais en capitales. `lastUpdatedLabel` inclut déjà l'espace
                final, d'où la disparition du `{" "}` qui le séparait de la
                date. Les mois sont stockés en casse de titre et passés en
                capitales par la classe `uppercase` du paragraphe, comme le
                faisait le tableau écrit en dur. */}
            {/* 12 px, interligne 1,2, chasse -0,01em : relevé sur la source
                aux 5 largeurs. Nous rendions 10 px, interligne 15, sans
                chasse. */}
            <p className="text-right text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60 tablet:text-left">
              {uiLabels.dates.lastUpdatedLabel}
              <time dateTime={document.lastUpdated} className="text-background">
                {formatLongDate(document.lastUpdated)}
              </time>
            </p>
            {/* La colonne de texte démarre 44px sous le haut du bloc sur la
                source, alors que « Last updated » reste calé en haut. */}
            <RichText
              blocks={document.body}
              className="max-w-[600px] tablet:mt-[44px]"
            />
          </div>
        </article>

        {/* LA FAQ A ÉTÉ RETIRÉE D'ICI. Les mêmes dix questions commerciales,
            « combien ça coûte », « en combien de temps », étaient collées
            sous les mentions légales, la politique de confidentialité et les
            conditions générales, en tutoyant un lecteur que ces documents
            vouvoient. Un document de droit ne se termine pas par un argumentaire
            de vente : elles restent sur l'accueil, le contact et les trois pages
            de prestation. */}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
