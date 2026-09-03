import { Fragment, type ReactNode } from "react";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { AboutSection } from "@/components/sections/AboutSection";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { LogoBandSection } from "@/components/sections/LogoBandSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ShowreelSection } from "@/components/sections/ShowreelSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { WorksSection } from "@/components/sections/WorksSection";
import { content } from "@/lib/content";

/**
 * Reconstruction Next.js + Tailwind de la page d'accueil d'origine.
 *
 * La hiérarchie suit les enfants réels de `Main` dans la source Framer. Les
 * composants `framer/*` et le miroir `../site` restent la référence brute
 * HTML/CSS/JS utilisée pour vérifier chaque traduction.
 */
export async function HomePage() {
  const [site, home, allWorks, posts] = await Promise.all([
    content.getSiteConfig(),
    content.getHome(),
    content.getWorks(),
    content.getPosts(),
  ]);

  const works = home.featuredWorkSlugs.map((slug) =>
    allWorks.find((work) => work.slug === slug),
  ).filter((work): work is NonNullable<typeof work> => Boolean(work));
  const featuredPosts = home.articles.featuredSlugs.map((slug) =>
    posts.find((post) => post.slug === slug),
  ).filter((post): post is NonNullable<typeof post> => Boolean(post));

  const sections = {
    hero: <HeroSection hero={home.hero} site={site} />,
    about: <AboutSection about={home.about} />,
    showreel: <ShowreelSection showreel={home.showreel} />,
    works: <WorksSection works={works} />,
    whyUs: <WhyUsSection whyUs={home.whyUs} />,
    services: (
      <ServicesSection
        services={home.services.items}
        intro={home.services.intro}
        horsCatalogue={home.services.horsCatalogue}
        /* BANDE CLAIRE, ET NON ORANGE, DEPUIS QUE LES TARIFS SUIVENT.
           La bande orange en bas de l'accordéon annonçait la section des
           chiffres, qui est orange pleine page et la suivait immédiatement. La
           section tarifs s'intercale : la bande orange conduisait désormais à
           une section sombre, et la section orange arrivait sans annonce. Elle
           passe donc en bas des tarifs, et l'accordéon se ferme sur la même
           bande claire que celle qui l'ouvre. */
        bottomAccent="muted"
      />
    ),
    tarifs: <PricingSection />,
    numbers: <StatsSection numbers={home.numbers} />,
    faq: <FaqSection faq={home.faq ?? []} />,
    testimonials: (
      <TestimonialsSection testimonials={home.testimonials.items} />
    ),
    logoBand: home.logoBand ? (
      <LogoBandSection logoBand={home.logoBand} />
    ) : null,
    articles: <ArticlesSection posts={featuredPosts} />,
  } satisfies Record<string, ReactNode>;

  return (
    <>
      <SvgSprite />
      {/* `appear` : l'entrée scale(1.3) du header n'existe QUE sur la home dans
          la source (seule `/` porte `data-framer-appear-id="1nqx0rw"` ; les 17
          autres routes rendent le header sans appear-id, et le relevé rAF du
          live le confirme au runtime). Voir la prop `appear` de `Header`. */}
      <Header site={site} appear />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        {home.sectionOrder.map((section) => (
          <Fragment key={section}>
            {sections[section as keyof typeof sections] ?? null}
          </Fragment>
        ))}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
