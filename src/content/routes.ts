import type { ContentRoute } from "@/lib/content/types";
import { blogPosts } from "./blog";
import { prestations } from "./offre";

/**
 * Manifest public, dans l'ordre exact du sitemap Framer live.
 *
 * Les slugs atypiques restent ici tels qu'ils sont publiés. Le repository les
 * résout vers les slugs canoniques stockés dans les entités via `aliases`.
 */
/**
 * Date du plus récent article publié, ou `undefined` s'il n'y en a aucun.
 *
 * Elle sert de `<lastmod>` à `/blog` : l'index change exactement quand un
 * article paraît, jamais autrement. C'est la seule date de fraîcheur du site
 * dont on soit certain.
 */
const derniereDateArticle: string | undefined = blogPosts
  .map((post) => post.date)
  .sort()
  .at(-1);

export const contentRoutes: readonly ContentRoute[] = [
  { pathname: "/", kind: "page" },
  { pathname: "/contact", kind: "page" },
  { pathname: "/about", kind: "page" },
  { pathname: "/blog", kind: "page", lastModified: derniereDateArticle },
  { pathname: "/work", kind: "page" },
  /*
   * PAGES DE PRESTATION, ajoutées le 2026-08-27 avec le retrait de la grille
   * tarifaire de la page d'accueil. Elles sont DÉRIVÉES de `offre.ts`, comme les
   * articles le sont de `blog.ts` : ajouter une prestation suffit à publier sa
   * page et à l'annoncer au sitemap, il n'y a pas de seconde liste à tenir.
   */
  ...prestations.map(
    (p): ContentRoute => ({
      pathname: `/services/${p.slug}`,
      kind: "service",
      contentSlug: p.slug,
    }),
  ),
  // Trois projets réels depuis le 2026-08-10, à la place des cinq études de cas
  // inventées du template. Les anciens chemins ne sont pas redirigés : ils n'ont
  // jamais été publiés sous ce domaine, personne n'a de lien vers eux.
  // L'ORDRE SUIT `workItems` (voir la note 5 de `src/content/work.ts`) : Würth
  // est passé en deuxième le 2026-08-31, devant NSLysium. Ce manifeste alimente
  // le sitemap, dont l'ordre n'a aucun effet sur l'exploration, mais deux
  // listes qui disent la même chose dans deux ordres différents finissent par
  // diverger sur autre chose que l'ordre.
  { pathname: "/work/kpsull", kind: "work", contentSlug: "kpsull" },
  {
    pathname: "/work/wurth-creation-de-compte",
    kind: "work",
    contentSlug: "wurth-creation-de-compte",
  },
  { pathname: "/work/nslysium", kind: "work", contentSlug: "nslysium" },
  /*
   * PAGES LÉGALES, aux slugs FRANCISÉS depuis le 2026-08-28.
   *
   * `privacy-policy` et `terms-of-service` étaient les slugs anglais hérités du
   * template. Ils sont devenus `politique-de-confidentialite` et
   * `conditions-generales-de-vente` : sur un site français dont chaque autre
   * mot est en français, une adresse anglaise pour un document de droit
   * français se lit comme un reste de gabarit, et c'est exactement ce que
   * c'était.
   *
   * LES ANCIENNES ADRESSES NE MEURENT PAS : `redirects()` dans `next.config.ts`
   * les redirige en 301. Sans ces règles, `dynamicParams = false` sur
   * `/legal/[slug]` les ferait répondre 404.
   */
  {
    // Mentions légales : obligatoires pour tout site professionnel français.
    // LCEN, art. 1-1 depuis la loi SREN du 21 mai 2024 (et non plus 6-III).
    // Absentes du template américain d'origine.
    pathname: "/legal/mentions-legales",
    kind: "legal",
    contentSlug: "mentions-legales",
  },
  {
    pathname: "/legal/politique-de-confidentialite",
    kind: "legal",
    contentSlug: "politique-de-confidentialite",
  },
  {
    pathname: "/legal/conditions-generales-de-vente",
    kind: "legal",
    contentSlug: "conditions-generales-de-vente",
  },
  // Les articles NE SONT PAS listés à la main : ils sont dérivés de
  // `blogPosts`, la seule source qui décide de leur existence.
  //
  // CE QUE ÇA CORRIGE, et c'était grave. Ce fichier gardait en dur les HUIT
  // articles anglais du template, supprimés le 2026-08-26 avec le passage au
  // MDX. Conséquence mesurée le 2026-08-27 : `/sitemap.xml` déclarait à Google
  // huit adresses qui répondent 404 (`/blog/stop-hiding-your-prices` et les
  // sept autres), et n'annonçait AUCUN des quatre articles réellement publiés.
  // Rien ne le signalait : les types étaient verts, les pages s'affichaient, et
  // seul un appel au sitemap le montrait.
  //
  // La dérivation supprime la classe d'erreur : publier un article suffit à le
  // faire apparaître, en retirer un suffit à l'en sortir.
  ...blogPosts.map(
    (post): ContentRoute => ({
      pathname: `/blog/${post.slug}`,
      kind: "post",
      contentSlug: post.slug,
      lastModified: post.date,
    }),
  ),
];
