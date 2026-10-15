import type { BlogPost } from "@/lib/content/types";
import entrees from "./articles-cockpit.json";

/**
 * LES ARTICLES VALIDÉS DANS LE COCKPIT.
 *
 * Depuis le 2026-10-15, la routine du blog rédige un article, Eliott le valide
 * dans le cockpit (hub Blog), puis `scripts/publier-articles.ts` écrit son corps
 * dans `articles/<slug>.mdx` et ses métadonnées dans `articles-cockpit.json`.
 * Le JSON plutôt qu'une entrée de plus dans `blog.ts` : un script réécrit sans
 * risque un fichier de données, jamais un module TypeScript.
 *
 * Le contrôle reste le même que pour un article écrit à la main : ce module
 * convertit chaque entrée en `BlogPost` typé, et `blog.test.mjs` passe sur le
 * résultat (corps présent, description bornée, liens vers une prestation et la
 * prise de rendez-vous, aucun tiret cadratin).
 *
 * CHAQUE ARTICLE A SON VISUEL, conçu pour son sujet : le rédacteur l'écrit en
 * SVG dans la palette du site, Eliott le voit dans l'aperçu du cockpit, et
 * `scripts/visuel-article.mjs` le rend en JPG à la publication. Une photo de
 * héros ne sert qu'une fois (`heros-pages.test.mjs`). Les fichiers suivent le
 * slug : `heros/blog-<slug>.jpg`, `blog/<slug>.jpg`, `og-blog-<slug>.jpg`.
 */
export interface ArticleCockpit {
  slug: string;
  title: string;
  /** Date de publication ISO, jour de Paris. */
  date: string;
  category: string;
  /** 70 à 200 caractères : extrait de l'index et description de recherche. */
  description: string;
  readingTime: string;
  tags?: string[];
  /** Ce que montre le visuel, pour le texte de remplacement (20 à 200 caractères). */
  alt: string;
  /** La validation du cockpit, marquée publiée une fois l'article en ligne. */
  validationId: string;
}

export function articlesDuCockpit(
  base: readonly BlogPost[],
  liste: readonly ArticleCockpit[] = entrees as ArticleCockpit[],
): BlogPost[] {
  const auteur = base[0]?.author;
  if (!auteur) throw new Error("Registre du blog vide : aucun auteur à reprendre");
  return liste.map((a) => {
    const alt = a.alt?.trim();
    if (!alt) throw new Error(`Article ${a.slug} : visuel sans texte de remplacement`);
    const og = { src: `/images/og-blog-${a.slug}.jpg`, alt, width: 1200, height: 630 };
    return {
      slug: a.slug,
      title: a.title,
      date: a.date,
      dateSource: "editorial",
      listedInIndex: true,
      category: a.category,
      author: auteur,
      cover: { src: `/images/blog/${a.slug}.jpg`, alt, width: 1200, height: 1114 },
      heroImage: {
        src: `/images/heros/blog-${a.slug}.jpg`,
        alt,
        width: 2400,
        height: 1350,
        cadrage: { x: 50, y: 50 },
        credit: {
          prefixe: "Visuel :",
          auteur: { libelle: "Eliott Bouquerel", href: "/a-propos" },
          licence: { libelle: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/deed.fr" },
        },
        og,
      },
      excerpt: a.description,
      readingTime: a.readingTime,
      tags: a.tags,
      seo: { title: a.title, description: a.description, ogImage: og },
    };
  });
}
