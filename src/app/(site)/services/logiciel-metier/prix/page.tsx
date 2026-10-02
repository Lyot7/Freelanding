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
import { pagePrixLogiciel } from "@/content/page-prix-logiciel";
import { marchesFilAriane } from "@/content/service-pages";

/**
 * `/services/logiciel-metier/prix` : les prix de la solution métier, contenu
 * et règles dans `src/content/page-prix-logiciel.ts`.
 *
 * SEGMENT STATIQUE À CÔTÉ DE `[secteur]` : le routeur sert un segment nommé
 * avant un segment dynamique, et `[secteur]` garde `dynamicParams = false`,
 * donc `prix` ne peut pas y tomber ni y être confondu avec un secteur.
 */
const LOGICIEL = prestation("logiciel");

export function generateMetadata(): Metadata {
  return pageMetadata(
    {
      title: pagePrixLogiciel.seo.titre,
      description: pagePrixLogiciel.seo.description,
    },
    pagePrixLogiciel.chemin,
  );
}

export default async function PrixLogicielSurMesure() {
  const site = await content.getSiteConfig();

  return (
    <>
      {/* LE SERVICE ET SES 3 OFFRES, LE FIL D'ARIANE ET LA FAQ AFFICHÉE. Le
          service garde le nom de la prestation : la page en donne les prix,
          elle n'est pas un service à part. */}
      <JsonLd
        data={graph(
          serviceSchema(LOGICIEL, pagePrixLogiciel.seo.description, {
            nom: LOGICIEL.nom,
            chemin: pagePrixLogiciel.chemin,
          }),
          filArianeSchema(marchesFilAriane(LOGICIEL, pagePrixLogiciel)),
          faqSchema(pagePrixLogiciel.faq.items),
        )}
      />
      <ServicePage prestation={LOGICIEL} site={site} local={pagePrixLogiciel} />
    </>
  );
}
