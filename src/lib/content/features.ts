/**
 * Application des drapeaux de section (`src/content/features.ts`) au port
 * contenu.
 *
 * Le filtrage vit ICI, dans un décorateur posé autour de l'adapter actif, et pas
 * dans les composants. Deux raisons :
 *
 * 1. L'adapter passe par ce décorateur, quel qu'il soit :
 *    éteindre une section produit exactement le même site, quelle que soit la
 *    source de contenu.
 * 2. Aucun composant n'a besoin de connaître les drapeaux. Un composant reçoit
 *    une navigation déjà filtrée et un `sectionOrder` déjà filtré : il ne peut
 *    pas « oublier » de masquer quelque chose.
 *
 * Les blocs de témoignage qui vivent HORS de la home (page « à propos », pages
 * projet) ne transitent pas par une liste ordonnée : ils sont rendus par leur
 * page. Ceux-là consultent `siteFeatures` directement à l'endroit du rendu.
 */
import { siteFeatures } from "@/content/features";
import type { ContentRepository } from "./repository";
import type { Link, SiteFeatures } from "./types";

/** Sections de la home pilotées par un drapeau. */
const FLAGGED_HOME_SECTIONS: Record<string, keyof SiteFeatures> = {
  // « Actualités » : les 4 derniers articles du blog.
  articles: "blog",
  // Carrousel « ce que disent mes clients ».
  testimonials: "testimonials",
};

/** Un lien pointe-t-il vers le blog (index ou article) ? */
function isBlogLink(link: Link): boolean {
  return link.href === "/blog" || link.href.startsWith("/blog/");
}

function filterNav(links: Link[] | undefined, features: SiteFeatures) {
  if (!links || features.blog) return links;
  return links.filter((link) => !isBlogLink(link));
}

/**
 * Enveloppe un adapter pour qu'il ne serve plus que les sections allumées.
 *
 * `getPosts()` renvoie une liste vide quand le blog est éteint : c'est ce qui
 * vide `generateStaticParams()` des pages d'article. Combiné à
 * `dynamicParams = false`, aucune URL `/blog/…` n'est générée ni servie.
 */
export function withFeatureFlags(
  repository: ContentRepository,
  features: SiteFeatures = siteFeatures,
): ContentRepository {
  return {
    ...repository,

    getSiteConfig: async () => {
      const site = await repository.getSiteConfig();
      if (features.blog) return site;
      return {
        ...site,
        nav: filterNav(site.nav, features) ?? [],
        menuNav: filterNav(site.menuNav, features),
        footerNav: filterNav(site.footerNav, features),
      };
    },

    getHome: async () => {
      const home = await repository.getHome();
      return {
        ...home,
        sectionOrder: home.sectionOrder.filter((section) => {
          const flag = FLAGGED_HOME_SECTIONS[section];
          return flag === undefined || features[flag];
        }),
      };
    },

    getRoutes: async () => {
      const routes = await repository.getRoutes();
      if (features.blog) return routes;
      return routes.filter(
        (route) => route.kind !== "post" && route.pathname !== "/blog",
      );
    },

    getPosts: async () => (features.blog ? repository.getPosts() : []),

    getPost: async (slug) =>
      features.blog ? repository.getPost(slug) : null,

    getTestimonials: async () =>
      features.testimonials ? repository.getTestimonials() : [],
  };
}
