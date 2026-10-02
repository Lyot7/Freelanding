import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePage } from "@/components/pages/services/ServicePage";
import { JsonLd } from "@/components/JsonLd";
import { content } from "@/lib/content";
import {
  faqSchema,
  filArianeSchema,
  graph,
  serviceSchema,
} from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";
import { prestation } from "@/content/offre";
import { pageSecteur, pagesSecteur } from "@/content/pages-secteur";
import { marchesFilAriane } from "@/content/service-pages";

/**
 * `/services/logiciel-metier/<secteur>` : la solution métier, déclinée pour un
 * secteur (BTP, transport). Même gabarit que la page pilier, contenu dans
 * `src/content/pages-secteur.ts`, où sont écrites les règles de ces pages.
 *
 * `/services/logiciel-metier` reste servie par `services/[slug]` : ce dossier
 * n'a pas de `page.tsx` à sa racine, seulement le segment `[secteur]`.
 */
type SecteurRouteProps = {
  params: Promise<{ secteur: string }>;
};

const LOGICIEL = prestation("logiciel");

/** Un secteur absent de `pagesSecteur` répond 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return pagesSecteur.map((p) => ({ secteur: p.slug }));
}

export async function generateMetadata({
  params,
}: SecteurRouteProps): Promise<Metadata> {
  const { secteur } = await params;
  const page = pageSecteur(secteur);
  if (!page) {
    notFound();
  }
  return pageMetadata(
    { title: page.seo.titre, description: page.seo.description },
    page.chemin,
  );
}

export default async function PageSecteurRoute({ params }: SecteurRouteProps) {
  const { secteur } = await params;
  const page = pageSecteur(secteur);
  if (!page) {
    notFound();
  }
  const site = await content.getSiteConfig();

  return (
    <>
      {/* LE SERVICE, LE FIL D'ARIANE ET LA FAQ AFFICHÉE. Sans zones, le
          service déclare la France : une page secteur se vend à distance. Le
          fil d'Ariane est celui que la page affiche, au mot près. */}
      <JsonLd
        data={graph(
          serviceSchema(LOGICIEL, page.seo.description, {
            nom: page.h1,
            chemin: page.chemin,
          }),
          filArianeSchema(marchesFilAriane(LOGICIEL, page)),
          faqSchema(page.faq.items),
        )}
      />
      <ServicePage prestation={LOGICIEL} site={site} local={page} />
    </>
  );
}
