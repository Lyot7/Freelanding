import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { FaqSection } from "@/components/sections/FaqSection";
import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Grain } from "@/components/effects/Grain";
import { FilAriane, SectionDeuxMoities } from "@/components/pages/services/ServicePage";
import { SimulateurPrix } from "@/components/pages/simulateur/SimulateurPrix";
import { pageSimulateur } from "@/content/simulateur-prix";
import { marchesSimulateur } from "@/content/service-pages";
import type { SiteConfig } from "@/lib/content/types";

/**
 * `/simulateur-prix` : le héros, l'outil, pourquoi ces prix, la FAQ.
 *
 * MÊME GRAMMAIRE QUE LES PAGES DE PRIX : filet médian, deux moitiés, tons
 * alternés. Le héros est plus bas que celui d'une prestation : ici, c'est
 * l'outil qu'on vient chercher, il doit commencer au premier écran.
 *
 * LE H1 SUIT LA LARGEUR DE SA COLONNE. « SIMULATEUR » en capitales mesure
 * 5,94 fois le corps : à 78 px il dépasse la colonne de 381 px à 810, à 98 px
 * celle de 570 px à 1200, et `overflow-hidden` du `Reveal` le coupe. Le corps
 * vaut donc la colonne divisée par 12,5 (marge comprise), plafonné aux tailles
 * des autres héros. 48 px sous 810 : 285 px sur les 335 utiles à 375.
 */
export function SimulateurPage({ site }: { site: SiteConfig }) {
  const page = pageSimulateur;
  return (
    <>
      <SvgSprite />
      <Header site={site} />
      <main id="main-content" tabIndex={-1}>
        <section className="relative flex min-h-[48svh] items-end overflow-hidden bg-background px-[20px] pb-[50px] pt-[130px] text-foreground tablet:px-[24px] tablet:pb-[70px] desktop:px-[30px]">
          <GradientWaveBackdrop seed={63} />
          <Grain opacity={0.05} className="z-[1]" />
          <span className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/10" />
          <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] gap-[20px] tablet:grid-cols-2 tablet:items-end tablet:gap-x-0 tablet:gap-y-[30px]">
            <div className="tablet:col-start-1 tablet:row-start-1">
              <FilAriane marches={marchesSimulateur(page)} />
            </div>
            <Reveal
              trigger="appear"
              appearId="simulateur-hero-titre"
              initialOpacity={0.001}
              initialY={80}
              duration={1.2}
              className="accent-room overflow-hidden [--accent-room:26px] tablet:col-start-2 tablet:row-start-2"
            >
              <h1 className="max-w-[510px] text-[48px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[min(78px,calc((100vw-48px)/12.5))] desktop:text-[min(98px,calc((100vw-60px)/12.5))]">
                {page.h1}
              </h1>
            </Reveal>
            <p className="max-w-[340px] text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-white/60 tablet:col-start-1 tablet:row-start-2 tablet:mr-[30px] tablet:justify-self-end tablet:text-right desktop:mr-[40px]">
              {page.resume}
            </p>
          </div>
        </section>

        <SimulateurPrix />

        <SectionDeuxMoities
          dataSection={`simulateur-${page.pourquoi.id}`}
          titre={page.pourquoi.titre}
          paragraphes={page.pourquoi.paragraphes}
          liens={page.pourquoi.liens}
          points={page.pourquoi.points}
        />

        <FaqSection
          faq={[...page.faq.items]}
          eyebrow={page.faq.eyebrow}
          titleLines={page.faq.titleLines}
        />
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
