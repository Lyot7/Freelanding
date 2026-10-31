import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { MaillageMetier } from "@/components/pages/metiers/MaillageMetier";
import { PageTheme } from "@/components/pages/services/PageTheme";
import { pageMetier, pagesMetier, versPageTheme, visuelMetier } from "@/content/metiers";
import { prestation } from "@/content/offre";
import { content } from "@/lib/content";
import { faqSchema, filArianeSchema, graph, serviceSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";

type RouteMetier = { params: Promise<{ metier: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return pagesMetier.map((p) => ({ metier: p.slug }));
}

export async function generateMetadata({ params }: RouteMetier): Promise<Metadata> {
  const { metier } = await params;
  const page = pageMetier(metier);
  if (!page) notFound();
  return pageMetadata({ title: page.seo.titre, description: page.seo.description }, page.chemin);
}

export default async function PageMetierRoute({ params }: RouteMetier) {
  const { metier } = await params;
  const page = pageMetier(metier);
  if (!page) notFound();
  const site = await content.getSiteConfig();
  const theme = versPageTheme(page);
  return (
    <>
      <JsonLd
        data={graph(
          serviceSchema(prestation("logiciel"), page.seo.description, {
            nom: page.h1,
            chemin: page.chemin,
          }),
          filArianeSchema(theme.filAriane ?? []),
          faqSchema(page.faq.items),
        )}
      />
      <PageTheme
        page={theme}
        site={site}
        visuel={{ src: visuelMetier(page.slug).heros, alt: page.image.alt }}
        maillage={<MaillageMetier page={page} />}
      />
    </>
  );
}
