import type { Metadata } from "next";
import { ServicePage } from "@/components/pages/services/ServicePage";
import { JsonLd } from "@/components/JsonLd";
import { content } from "@/lib/content";
import {
  businessSchema,
  faqSchema,
  filArianeSchema,
  graph,
  serviceSchema,
} from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";
import { prestation } from "@/content/offre";
import { pageCaen } from "@/content/page-caen";
import { marchesFilAriane } from "@/content/service-pages";

/**
 * `/creation-site-internet-caen` : le site vitrine, décliné pour Caen et le
 * Calvados. Même gabarit que `/services/site-vitrine`, contenu local dans
 * `src/content/page-caen.ts`, où sont aussi écrites les raisons de l'adresse.
 */
const VITRINE = prestation("vitrine");

export function generateMetadata(): Metadata {
  return pageMetadata(
    { title: pageCaen.seo.titre, description: pageCaen.seo.description },
    pageCaen.chemin,
  );
}

export default async function CreationSiteInternetCaen() {
  const [site, home] = await Promise.all([
    content.getSiteConfig(),
    content.getHome(),
  ]);

  return (
    <>
      {/* L'ACTIVITÉ, LE SERVICE LOCAL, LE FIL D'ARIANE ET LA FAQ AFFICHÉE.
          L'activité (`ProfessionalService`, un `LocalBusiness`) est redéclarée
          sous le même `@id` que sur l'accueil : un moteur fusionne les deux
          nœuds au lieu de croire à une seconde entreprise. Le service, lui,
          déclare Caen et le Calvados comme zone. */}
      <JsonLd
        data={graph(
          businessSchema(site, home),
          serviceSchema(VITRINE, pageCaen.seo.description, {
            nom: pageCaen.h1,
            chemin: pageCaen.chemin,
            zones: pageCaen.zones,
          }),
          filArianeSchema(marchesFilAriane(VITRINE, pageCaen)),
          faqSchema(pageCaen.faq.items),
        )}
      />
      <ServicePage prestation={VITRINE} site={site} local={pageCaen} />
    </>
  );
}
