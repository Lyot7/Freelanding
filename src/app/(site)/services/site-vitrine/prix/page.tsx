import type { Metadata } from "next";
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
import { pagePrixSite } from "@/content/page-prix-site";
import { marchesFilAriane } from "@/content/service-pages";

/**
 * `/services/site-vitrine/prix` : le prix d'un site internet sur mesure. Même
 * gabarit que les pages secteur, contenu dans `src/content/page-prix-site.ts`.
 *
 * `/services/site-vitrine` reste servie par `services/[slug]` : ce dossier n'a
 * pas de `page.tsx` à sa racine, seulement le segment `prix`.
 */
const VITRINE = prestation("vitrine");

export const metadata: Metadata = pageMetadata(
  { title: pagePrixSite.seo.titre, description: pagePrixSite.seo.description },
  pagePrixSite.chemin,
);

export default async function PagePrixSiteRoute() {
  const site = await content.getSiteConfig();

  return (
    <>
      {/* LE SERVICE ET SES 3 OFFRES CHIFFRÉES, le fil d'Ariane affiché et la
          FAQ. Sans zones, le service déclare la France. */}
      <JsonLd
        data={graph(
          serviceSchema(VITRINE, pagePrixSite.seo.description, {
            nom: pagePrixSite.h1,
            chemin: pagePrixSite.chemin,
          }),
          filArianeSchema(marchesFilAriane(VITRINE, pagePrixSite)),
          faqSchema(pagePrixSite.faq.items),
        )}
      />
      <ServicePage prestation={VITRINE} site={site} local={pagePrixSite} />
    </>
  );
}
