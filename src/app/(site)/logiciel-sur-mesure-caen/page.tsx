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
import { pageLogicielCaen } from "@/content/page-logiciel-caen";
import { marchesFilAriane } from "@/content/service-pages";

/**
 * `/logiciel-sur-mesure-caen` : la solution métier, déclinée pour Caen et
 * l'ouest normand. Même gabarit et même JSON-LD que
 * `/creation-site-internet-caen` ; contenu et règles dans
 * `src/content/page-logiciel-caen.ts`.
 */
const LOGICIEL = prestation("logiciel");

export function generateMetadata(): Metadata {
  return pageMetadata(
    {
      title: pageLogicielCaen.seo.titre,
      description: pageLogicielCaen.seo.description,
    },
    pageLogicielCaen.chemin,
  );
}

export default async function LogicielSurMesureCaen() {
  const [site, home] = await Promise.all([
    content.getSiteConfig(),
    content.getHome(),
  ]);

  return (
    <>
      {/* L'ACTIVITÉ, LE SERVICE LOCAL, LE FIL D'ARIANE ET LA FAQ AFFICHÉE,
          comme sur la page de Caen du site vitrine : l'activité reprend le
          même `@id` que l'accueil, le service déclare Caen et les 3
          départements de la zone d'intervention. */}
      <JsonLd
        data={graph(
          businessSchema(site, home),
          serviceSchema(LOGICIEL, pageLogicielCaen.seo.description, {
            nom: pageLogicielCaen.h1,
            chemin: pageLogicielCaen.chemin,
            zones: pageLogicielCaen.zones,
          }),
          filArianeSchema(marchesFilAriane(LOGICIEL, pageLogicielCaen)),
          faqSchema(pageLogicielCaen.faq.items),
        )}
      />
      <ServicePage prestation={LOGICIEL} site={site} local={pageLogicielCaen} />
    </>
  );
}
