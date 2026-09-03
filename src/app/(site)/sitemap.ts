import type { MetadataRoute } from "next";
import { content } from "@/lib/content";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Sitemap, dérivé du manifeste `src/content/routes.ts`.
 *
 * `lastModified` N'EST POSÉE QUE LÀ OÙ UNE DATE EXISTE. C'est le seul signal de
 * fraîcheur gratuit qu'on puisse donner à un robot d'exploration, et il ne vaut
 * que s'il est vrai : une date inventée pour toutes les routes se fait repérer
 * dès la deuxième exploration, et le robot cesse alors de lire la balise —
 * y compris sur les pages où elle était juste. Aujourd'hui, seuls les articles
 * et l'index du blog en portent une (voir `ContentRoute.lastModified`).
 *
 * Ni `changeFrequency` ni `priority` : Google a annoncé publiquement les
 * ignorer, et les autres moteurs les traitent au mieux comme une indication.
 * Les poser reviendrait à alourdir le fichier pour rien.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await content.getRoutes();
  return routes.map((route) => ({
    url: absoluteUrl(route.pathname),
    ...(route.lastModified
      ? { lastModified: new Date(route.lastModified) }
      : {}),
  }));
}
