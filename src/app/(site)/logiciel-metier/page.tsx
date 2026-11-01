import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SvgSprite } from "@/components/SvgSprite";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Grain } from "@/components/effects/Grain";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { ListeMetiers } from "@/components/pages/metiers/ListeMetiers";
import {
  ANCRE_BESOINS,
  CHEMIN_HUB_METIERS,
  hubMetiers,
  pagesBesoin,
  pagesHub,
} from "@/content/metiers";
import { lienRendezVous } from "@/content/rendez-vous";
import { content } from "@/lib/content";
import { collectionSchema, filArianeSchema, graph } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata(
  { title: hubMetiers.seo.titre, description: hubMetiers.seo.description },
  CHEMIN_HUB_METIERS,
);

/** `/logiciel-metier` : le hub, qui liste toutes les pages publiées. */
export default async function HubMetiers() {
  const site = await content.getSiteConfig();
  return (
    <>
      <JsonLd
        data={graph(
          collectionSchema(hubMetiers.h1, hubMetiers.seo.description, CHEMIN_HUB_METIERS, [
            ...pagesHub,
            ...pagesBesoin,
          ]),
          filArianeSchema([
            { libelle: hubMetiers.filAccueil, href: "/" },
            { libelle: hubMetiers.filHub },
          ]),
        )}
      />
      <SvgSprite />
      <Header site={site} />
      <main id="main-content" tabIndex={-1}>
        <section className="relative flex min-h-[calc(56svh/var(--zoom-ecran,1))] items-end overflow-hidden bg-background px-[20px] pb-[50px] pt-[140px] text-foreground tablet:px-[24px] tablet:pb-[70px] desktop:px-[30px]">
          <GradientWaveBackdrop seed={41} />
          <Grain opacity={0.05} className="z-[1]" />
          <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] gap-[20px] tablet:grid-cols-2 tablet:items-end">
            <h1 className="accent-room m-0 max-w-[620px] text-[52px] font-semibold uppercase leading-[0.85] tracking-[-0.05em] tablet:pr-[30px] tablet:text-[66px] desktop:text-[86px]">
              {hubMetiers.h1}
            </h1>
            <p className="m-0 max-w-[46ch] text-[17px] font-medium leading-[1.4] tracking-[-0.01em] text-white/70 tablet:pl-[30px] desktop:pl-[40px]">
              {hubMetiers.resume}
            </p>
          </div>
        </section>
        <section
          data-section="liste-metiers"
          className="relative bg-background px-[20px] pb-[60px] text-foreground tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px]"
        >
          <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[40px]">
            <h2 className="sr-only">{hubMetiers.titreListe}</h2>
            <ListeMetiers entrees={pagesHub} />
            <div id={ANCRE_BESOINS} className="flex scroll-mt-[100px] flex-col gap-[20px]">
              <h2 className="accent-room m-0 text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
                {hubMetiers.besoins.titre}
              </h2>
              <ListeMetiers entrees={pagesBesoin} />
            </div>
            <div className="grid gap-[12px] tablet:grid-cols-2">
              <h2 className="accent-room m-0 text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:pr-[30px] tablet:text-[34px]">
                {hubMetiers.autre.titre}
              </h2>
              <div className="flex flex-col items-start gap-[14px] tablet:pl-[30px] desktop:pl-[40px]">
                <p className="m-0 max-w-[46ch] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-white/70">
                  {hubMetiers.autre.corps}
                </p>
                <Link
                  href={lienRendezVous("logiciel")}
                  className="flex h-[48px] items-center bg-accent px-[20px] text-[13px] font-semibold uppercase leading-none tracking-[-0.01em] text-accent-ink no-underline"
                >
                  {hubMetiers.autre.cta}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer sujetRendezVous="logiciel" />
      <FloatingNav site={site} />
    </>
  );
}
