import { FloatingNav, Footer, Header } from "@/components/layout";
import { content } from "@/lib/content";
import { WorkExplorer } from "./WorkExplorer";
import { WorkHero } from "./WorkHero";

export async function WorkPage() {
  const [site, page] = await Promise.all([
    content.getSiteConfig(),
    content.getWorkPage(),
  ]);

  return (
    <>
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <WorkHero hero={page.hero} />
        <WorkExplorer filters={page.filters} works={page.items} />
        {/* LA FAQ A ÉTÉ RETIRÉE D'ICI. Elle occupait 866 des 899 mots de cette
            page, soit la quasi-totalité de son texte pour une page dont le
            sujet est le travail livré, pas le prix. Le champ `faq` de
            `workContent` a été retiré avec elle : un tableau qui n'est plus
            rendu nulle part est une donnée que personne ne relit. Les questions
            restent sur l'accueil, le contact et les trois pages de prestation. */}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
