import type { Metadata } from "next";

import type { ImageAsset, PageSeo } from "@/lib/content/types";

/**
 * Métadonnées d'une page, construites au même endroit pour toutes.
 *
 * POURQUOI CETTE FONCTION EXISTE : chaque page composait son objet `Metadata` à
 * la main. Résultat, `alternates.canonical` n'était posé que sur `/blog` et
 * `/legal`, les deux pages ajoutées en dernier — la home, `/about`, `/work` et
 * `/contact` n'en avaient aucun. Personne ne l'avait vu parce qu'aucune de ces
 * pages n'est fausse : il leur manquait juste une ligne, chacune de son côté.
 *
 * Un canonical absent laisse un moteur choisir lui-même l'adresse de référence
 * d'une page. Sur un site servi à la fois avec et sans `www`, ou atteint avec
 * des paramètres de campagne (`?utm_source=…`), il peut indexer plusieurs
 * variantes de la même page et diviser leur poids.
 *
 * Le chemin est passé RELATIF (« /about ») ; `metadataBase`, défini dans le
 * layout, en fait une URL absolue.
 */
export function pageMetadata(
  seo: PageSeo,
  canonical: string,
  extra: { ogType?: "website" | "article"; ogImage?: ImageAsset } = {},
): Metadata {
  const image = extra.ogImage ?? seo.ogImage;

  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      type: extra.ogType ?? "website",
      ...(image ? { images: [{ url: image.src, alt: image.alt }] } : {}),
    },
  };
}
