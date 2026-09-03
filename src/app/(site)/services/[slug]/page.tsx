import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePage } from "@/components/pages/services/ServicePage";
import { JsonLd } from "@/components/JsonLd";
import { content } from "@/lib/content";
import { breadcrumbSchema, graph, serviceSchema } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site-url";
import { pageMetadata } from "@/lib/page-metadata";
import { prestations } from "@/content/offre";
import { servicePageLabels, servicePageSeo } from "@/content/service-pages";

type ServiceRouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return prestations.map((p) => ({ slug: p.slug }));
}

/** Résolution par slug. `undefined` plutôt qu'une exception : la route 404. */
function trouve(slug: string) {
  return prestations.find((p) => p.slug === slug);
}

export async function generateMetadata({
  params,
}: ServiceRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const prestation = trouve(slug);
  if (!prestation) {
    notFound();
  }

  // LE TITRE N'EST PLUS `prestation.nom`. Ce champ est le nom de CATALOGUE du
  // palier (« L'Outil », « Le Logiciel ») : il range l'offre, il ne se cherche
  // pas, et il ne portait pas la marque que toutes les autres pages ont en
  // suffixe. Le titre de recherche vit dans `service-pages.ts`, avec sa
  // contrainte de longueur ; voir l'en-tête de `servicePageSeo`.
  //
  // Le résumé reste la description : il est écrit pour être lu seul, c'est
  // exactement ce qu'attend un extrait de résultat de recherche.
  return pageMetadata(
    {
      title: servicePageSeo[prestation.id].titre,
      description: prestation.resume,
    },
    `/services/${prestation.slug}`,
  );
}

export default async function ServiceDetail({ params }: ServiceRouteProps) {
  const { slug } = await params;
  const [site, prestation] = await Promise.all([
    content.getSiteConfig(),
    Promise.resolve(trouve(slug)),
  ]);

  if (!prestation) {
    notFound();
  }

  return (
    <>
      {/* CE QUE CES TROIS PAGES NE DÉCLARAIENT PAS. La page d'accueil émet cinq
          types de données structurées ; les pages qui portent l'offre, ses
          périmètres et ses prix n'en émettaient aucun. Un moteur y lisait du
          texte sans savoir qu'il regardait une prestation vendue, ni à quel
          prix, ni où elle se situe dans le site.

          Le fil d'Ariane reprend le motif de `/work/*` : mêmes marches, même
          dernière marche sans adresse, et il dit la même chose que celui qui
          est affiché en tête de page. Un balisage qui décrit un chemin que la
          page ne montre pas est une déclaration trompeuse. */}
      <JsonLd
        data={graph(
          serviceSchema(prestation, prestation.resume),
          breadcrumbSchema([
            {
              name: servicePageLabels.filAriane.accueil,
              item: absoluteUrl("/"),
            },
            {
              name: servicePageLabels.filAriane.prestations,
              item: absoluteUrl("/#services"),
            },
            { name: prestation.nom },
          ]),
        )}
      />
      <ServicePage prestation={prestation} site={site} />
    </>
  );
}
