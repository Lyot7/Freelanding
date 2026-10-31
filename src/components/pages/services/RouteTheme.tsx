import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PageTheme } from "@/components/pages/services/PageTheme";
import { content } from "@/lib/content";
import { faqSchema, filArianeSchema, graph, serviceSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";
import { prestation } from "@/content/offre";
import type { IdPageTheme } from "@/content/page-theme";
import { pageTheme } from "@/content/pages-theme";

/**
 * Ce que partagent les routes thématiques : la balise `<head>` et la page
 * avec son JSON-LD. Chaque `page.tsx` ne fait que nommer sa page.
 */
export function metadataTheme(id: IdPageTheme): Metadata {
  const page = pageTheme(id);
  return pageMetadata(
    { title: page.seo.titre, description: page.seo.description },
    page.chemin,
  );
}

export async function RouteTheme({ id }: { id: IdPageTheme }) {
  const page = pageTheme(id);
  const site = await content.getSiteConfig();
  const service = { ...prestation(page.prestation), resume: page.resume };

  return (
    <>
      <JsonLd
        data={graph(
          serviceSchema(service, page.seo.description, {
            nom: page.h1,
            chemin: page.chemin,
            zones: page.zones,
          }),
          ...(page.filAriane ? [filArianeSchema(page.filAriane)] : []),
          faqSchema(page.faq.items),
        )}
      />
      <PageTheme page={page} site={site} />
    </>
  );
}
