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
 * LE VISUEL EST EMPRUNTÉ, comme les couvertures qui se répètent déjà : chaque
 * entrée nomme l'article publié dont elle reprend couverture, héros et image de
 * partage (`visuelDe`). Un nom inconnu casse le build, il ne laisse pas un cadre
 * vide en ligne.
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
  /** Slug de l'article publié dont l'entrée reprend les visuels. */
  visuelDe: string;
  /** La validation du cockpit, marquée publiée une fois l'article en ligne. */
  validationId: string;
}

export function articlesDuCockpit(
  base: readonly BlogPost[],
  liste: readonly ArticleCockpit[] = entrees as ArticleCockpit[],
): BlogPost[] {
  return liste.map((a) => {
    const modele = base.find((p) => p.slug === a.visuelDe);
    if (!modele) {
      throw new Error(`Article ${a.slug} : visuel emprunté à ${a.visuelDe}, introuvable`);
    }
    return {
      slug: a.slug,
      title: a.title,
      date: a.date,
      dateSource: "editorial",
      listedInIndex: true,
      category: a.category,
      author: modele.author,
      cover: modele.cover,
      heroImage: modele.heroImage,
      excerpt: a.description,
      readingTime: a.readingTime,
      tags: a.tags,
      seo: { title: a.title, description: a.description, ogImage: modele.seo?.ogImage },
    };
  });
}
