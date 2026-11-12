/**
 * `/estimation` — l'outil de chiffrage : quatre questions, une description, les
 * coordonnées, puis une fourchette indicative en achat ou en abonnement.
 * La grille vit dans `src/lib/chiffrage/grille.ts`, le calcul se fait côté
 * serveur dans `/api/estimation`.
 */
import type { Metadata } from "next";
import { SvgSprite } from "@/components/SvgSprite";
import { OutilEstimation } from "@/components/estimation/OutilEstimation";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { CHEMIN_ESTIMATION, estimationContent } from "@/content/estimation";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

const t = estimationContent;

export const metadata: Metadata = pageMetadata(t.seo, CHEMIN_ESTIMATION);

export default async function Estimation() {
  const site = await content.getSiteConfig();
  return (
    <>
      <SvgSprite />
      <Header site={site} />
      <main id="main-content" tabIndex={-1}>
        <section className="relative bg-background px-[20px] pb-[100px] pt-[130px] text-foreground tablet:px-[24px] tablet:pt-[160px] desktop:px-[30px]">
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[44px]">
            <header className="flex flex-col gap-[16px]">
              <p className="m-0 text-[13px] font-medium uppercase leading-[1.2] tracking-[0.02em] text-accent">
                {t.eyebrow}
              </p>
              <h1 className="m-0 text-[44px] font-semibold uppercase leading-[0.88] tracking-[-0.055em] tablet:text-[72px]">
                {t.titre}
              </h1>
              <p className="m-0 max-w-[52ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground/65">
                {t.chapeau}
              </p>
            </header>
            <OutilEstimation />
          </div>
        </section>
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
