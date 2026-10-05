import type { Metadata } from "next";
import { SimulateurPage } from "@/components/pages/simulateur/SimulateurPage";
import { JsonLd } from "@/components/JsonLd";
import { content } from "@/lib/content";
import { faqSchema, filArianeSchema, graph, simulateurSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";
import { pageSimulateur } from "@/content/simulateur-prix";
import { marchesSimulateur } from "@/content/service-pages";

/**
 * `/simulateur-prix` : contenu et règles dans `src/content/simulateur-prix.ts`,
 * calcul dans `src/lib/simulateur/estimation.ts`.
 */
export function generateMetadata(): Metadata {
  return pageMetadata(
    { title: pageSimulateur.seo.titre, description: pageSimulateur.seo.description },
    pageSimulateur.chemin,
  );
}

export default async function Simulateur() {
  const site = await content.getSiteConfig();

  return (
    <>
      {/* L'OUTIL, SON FIL D'ARIANE ET LA FAQ AFFICHÉE. */}
      <JsonLd
        data={graph(
          simulateurSchema({
            nom: pageSimulateur.h1,
            description: pageSimulateur.seo.description,
            chemin: pageSimulateur.chemin,
          }),
          filArianeSchema(marchesSimulateur(pageSimulateur)),
          faqSchema(pageSimulateur.faq.items),
        )}
      />
      <SimulateurPage site={site} />
    </>
  );
}
