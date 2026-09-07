import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { RichText } from "@/components/pages/RichText";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { sommaireDesBlocs } from "@/lib/blog/sommaire";
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
  const sommaire = sommaireDesBlocs(document.body);

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
              {/* LE TITRE NE PEUT PLUS SE FAIRE COUPER, et il l'était.
                  « POLITIQUE DE CONFIDENTIALITÉ » mesurait 774px de contenu pour
                  510px de boîte à 98px de corps : le dernier caractère passait
                  sous l'`overflow-hidden` de la section, et la page s'affichait
                  « CONFIDENTIALIT ». Un mot de quinze lettres ne se coupe pas,
                  donc c'est le corps qui cède : la taille suit désormais la
                  largeur disponible, et la boîte occupe sa colonne entière.
                  Repère de la source conservé pour les titres courts, qui
                  gardent leur présence. */}
              <h1 className="max-w-[680px] text-[clamp(38px,9vw,63px)] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[clamp(44px,6.2vw,78px)] desktop:text-[clamp(52px,5.4vw,98px)]">
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
          {/* AUCUN plafond de 1440 ici, contrairement à la page ARTICLE du
                blog qui, elle, en pose un sur la source (temps de lecture à
                x 240 des deux côtés à 1920). Le gabarit légal étale sa grille
                sur toute la largeur : relevé à 1920, conteneur [x 30, largeur
                1860], colonnes de 930. Notre plafond posait « Dernière mise à
                jour » à x 240 au lieu de x 30, soit 210 px d'écart. La colonne
                de texte, elle, ne bouge pas : son propre `max-w-[600px]` la cale
                au même endroit des deux côtés. */}
          {/* DEUX COLONNES SEULEMENT À PARTIR DE 1200px, et non dès 810.
              Entre les deux, chaque colonne tombait sous 400px : à 15px de
              corps, le texte y descendait à environ 25 caractères par ligne,
              soit deux ou trois mots. C'est le défaut que voyait le lecteur, et
              il ne se voyait ni en mobile (une seule colonne) ni en grand
              écran (colonnes larges). Le trait de séparation suit la même
              règle, sans quoi il partagerait une grille qui n'existe plus. */}
          <div className="relative grid gap-y-[28px] desktop:grid-cols-[minmax(0,260px)_minmax(0,1fr)] desktop:gap-x-[40px] desktop:gap-y-[44px]">
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
            <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60 desktop:text-left">
              {uiLabels.dates.lastUpdatedLabel}
              <time dateTime={document.lastUpdated} className="text-background">
                {formatLongDate(document.lastUpdated)}
              </time>
            </p>
            {/* SOMMAIRE, comme sur un article, et pour la même raison inversée.
                Un document de droit se consulte : on y cherche une section
                précise, on ne le lit pas d'un bout à l'autre. Sans sommaire, la
                seule façon de trouver « combien de temps sont conservées mes
                données » était de faire défiler deux mille mots. Le donner en
                colonne, c'est aussi cesser de faire comme si ces pages étaient
                un passage obligé qu'on préfère voir ignoré.

                `self-stretch` est indispensable : une cellule de grille se
                réduit à son contenu, et un enfant `sticky` n'aurait alors
                aucune course. Même remarque que sur la page article. */}
            {sommaire.length > 0 ? (
              <aside className="hidden desktop:col-start-1 desktop:row-start-2 desktop:block desktop:self-stretch desktop:pr-[40px]">
                <TableOfContents
                  entrees={sommaire}
                  titre={uiLabels.filters.blogTableOfContentsLabel}
                />
              </aside>
            ) : null}
            {/* 620px donne environ 72 caractères à 15px de corps, dans la
                fourchette de confort admise de 45 à 75. La mesure de référence
                pour un texte suivi est le nombre de caractères, pas la largeur
                en pixels. */}
            <div className="desktop:col-start-2 desktop:row-start-2">
              <RichText blocks={document.body} className="max-w-[620px]" />
            </div>
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
