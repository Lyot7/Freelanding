import { Fragment } from "react";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import type { BlogContent, SiteConfig } from "@/lib/content/types";
import { Highlighted } from "@/components/ui";
import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { BlogFilterGrid } from "./BlogFilterGrid";
import { Grain } from "@/components/effects/Grain";

export function BlogIndexPage({
  blog,
  site,
}: {
  blog: BlogContent;
  site: SiteConfig;
}) {
  const heroSubtitle = blog.hero.subtitleParagraphs?.[0];

  return (
    <>
      <SvgSprite />
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <section className="relative flex h-[90svh] items-end overflow-hidden bg-background px-[20px] pb-[20px] pt-[140px] text-foreground tablet:px-[24px] tablet:pb-[30px] desktop:px-[30px]">
          <GradientWaveBackdrop seed={74} />
          {/* RELEVÉ sur `/blog` : hôte 1440 × 810, z-1, opacité 0,05. Nous
              étions à 0,08, plus le calque global inventé de 0,05. */}
          <Grain opacity={0.05} className="z-[1]" />
          <span className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/10" />
          {/* DEUX RANGÉES séparées de 30 px, et non une seule rangée calée en
              bas avec une marge sous le titre. Preuve sur la source :
              `sous-titre.top = h1.bottom + 30` EXACTEMENT à 810, 1200, 1440 et
              1920 (611,19 → 641,19), et +20,4 à 390. Avec une rangée unique en
              `items-end`, la position du sous-titre dépendait de sa propre
              hauteur : à 1440 son bas tombait à 667 au lieu de 670.
              C'est la structure que `LegalPageView` implémente déjà. */}
          <div className="relative z-[2] mx-auto mb-[170px] grid w-full max-w-[1440px] gap-[20px] tablet:mb-[113px] tablet:grid-cols-2 tablet:gap-x-0 tablet:gap-y-[30px]">
            <Reveal
              initialOpacity={0.001}
              initialY={80}
              duration={1.2}
              className="overflow-hidden tablet:col-start-2 tablet:row-start-1"
            >
              {/* Découpage en deux lignes porté par la donnée
                  (`blogContent.hero.titleLines`), plus une copie en dur du
                  titre anglais : le saut de ligne forcé reste celui de la
                  source, seul le texte vient désormais du contenu. */}
              <h1 className="text-[63px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[78px] desktop:text-[98px]">
                {(blog.hero.titleLines ?? [blog.hero.title]).map((line, index) => (
                  <Fragment key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </Fragment>
                ))}
              </h1>
            </Reveal>
            {/* MESURÉ sur le live : 12 px (et non 11), largeur imposée par le
                parent à 280 px (et non 300), et DEUX fragments en blanc plein sur
                un texte à 60 %. Les deux fragments étaient recopiés en dur en
                anglais (« We write » / « that convert. ») : ils ne sont plus des
                sous-chaînes du sous-titre traduit, l'emphase disparaissait donc
                en silence. Ils viennent maintenant de
                `blogContent.hero.subtitleParagraphs[0].emphasis`. */}
            <p className="max-w-[280px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/60 tablet:col-start-1 tablet:row-start-2 tablet:justify-self-end tablet:text-right">
              <Highlighted
                text={heroSubtitle?.text ?? blog.hero.subtitle ?? ""}
                highlights={[...(heroSubtitle?.emphasis ?? [])]}
              />
            </p>
          </div>
        </section>
        {/* Les HUIT articles sont listés. Un plafond à 6 avait été posé ici sur
            la foi d'un relevé fait en iframe à rAF gelé : la source n'affiche
            effectivement que 6 cartes au chargement, mais monte à 8 au
            défilement (chargement différé qui ne se déclenchait jamais dans
            l'instrument de mesure). Vérifié en navigateur réel. */}
        <BlogFilterGrid
          categories={blog.categories}
          posts={blog.posts}
          vintage={site.copyright}
        />
        {/* LA FAQ A ÉTÉ RETIRÉE D'ICI, et ce n'est pas une régression du stub
            corrigé en son temps. Les mêmes dix questions, environ 900 mots,
            étaient rendues à l'identique sur dix adresses : l'accueil, le
            contact, les trois pages de prestation, `/work`, `/blog` et les
            trois pages légales. Sur `/blog`, elles répondaient à « combien ça
            coûte » sous une liste d'articles, sans rapport avec ce que le
            visiteur est venu lire, et elles pesaient plus lourd que l'index
            lui-même. Elles restent là où la question se pose vraiment :
            l'accueil, le contact et les trois pages qui vendent. */}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
