import { Fragment, type ReactNode } from "react";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import Link from "next/link";
import { ConfianceSection } from "@/components/sections/ConfianceSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { LogicielSection } from "@/components/sections/LogicielSection";
import { LogoBandSection } from "@/components/sections/LogoBandSection";
import { MoyensSection } from "@/components/sections/MoyensSection";
import { PreuvesSection } from "@/components/sections/PreuvesSection";
import { RencontreSection } from "@/components/sections/RencontreSection";
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
    /* Les logos sont rendus DANS le héros depuis le 2026-09-24 (phase D), à
       côté de la ligne de preuve : c'est la seule place où ils sont vus sans
       défiler. Ils ne sont donc plus une entrée de `sections`, sinon un
       `logoBand` remis dans l'ordre les afficherait deux fois. */
    hero: (
      <HeroSection
        hero={home.hero}
        site={site}
        logos={
          home.logoBand ? (
            <LogoBandSection logoBand={home.logoBand} variant="heros" />
          ) : null
        }
      />
    ),
    logiciel: home.logiciel ? <LogicielSection logiciel={home.logiciel} bottomAccent="muted" /> : null,
    moyens: <MoyensSection moyens={home.moyens} />,
    preuves: <PreuvesSection preuves={home.preuves} />,
    confiance: <ConfianceSection confiance={home.confiance} />,
    rencontre: <RencontreSection rencontre={home.rencontre} />,
    faq: (
      <FaqSection
        faq={home.faq ?? []}
        topAccent={false}
        aside={
          <nav aria-label={home.lectures.titre} className="hidden flex-col gap-[12px] tablet:flex">
            <p className="micro m-0 text-background/60">{home.lectures.titre}</p>
            {featuredPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="cta-lien w-fit text-background">
                {post.title}
              </Link>
            ))}
            <Link href="/blog" className="cta-lien w-fit text-background">
              {home.lectures.tous}
            </Link>
          </nav>
        }
      />
    ),
  } satisfies Record<string, ReactNode>;

  return (
    <>
      <SvgSprite />
      {/* `appear` : l'entrée scale(1.3) du header n'existe QUE sur la home dans
          la source (seule `/` porte `data-framer-appear-id="1nqx0rw"` ; les 17
          autres routes rendent le header sans appear-id, et le relevé rAF du
          live le confirme au runtime). Voir la prop `appear` de `Header`. */}
      <Header site={site} appear />
      <FloatingNav site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        {home.sectionOrder.map((section) => (
          <Fragment key={section}>
            {sections[section as keyof typeof sections] ?? null}
          </Fragment>
        ))}
      </main>
      <Footer />
    </>
  );
}
