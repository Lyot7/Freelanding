import { describe, expect, it } from "bun:test";

import { VOILE_TEXTE } from "@/components/pages/services/HeroPhoto";
import { content } from "@/lib/content";
import { BlogArticlePage } from "./BlogArticlePage";

/** Le premier élément de l'arbre qui répond au critère, sans exécuter les composants. */
function trouver(noeud, critere) {
  if (Array.isArray(noeud)) {
    for (const enfant of noeud) {
      const trouve = trouver(enfant, critere);
      if (trouve) return trouve;
    }
    return null;
  }
  if (!noeud?.props) return null;
  return critere(noeud) ? noeud : trouver(noeud.props.children, critere);
}

/**
 * Composant SERVEUR sans hook : l'appeler directement suffit à exécuter son
 * JSX. Ce test couvre le retrait du bloc newsletter (2026-09-21) : la colonne
 * de sommaire, elle, reste un `<div>` (ex-`<aside>`) toujours rendu.
 */
describe("BlogArticlePage", () => {
  it("ne rend plus de formulaire d'inscription à la newsletter", async () => {
    const [posts, site] = await Promise.all([content.getPosts(), content.getSiteConfig()]);
    const post = posts[0];

    const element = BlogArticlePage({
      post,
      related: posts.slice(1, 3),
      site,
      sommaire: [],
      children: "corps de l'article",
    });
    const vus = new WeakSet();
    const html = JSON.stringify(element, (_key, value) => {
      if (typeof value === "function") return undefined;
      if (typeof value === "object" && value !== null) {
        if (vus.has(value)) return undefined;
        vus.add(value);
      }
      return value;
    });

    expect(html).not.toContain('"aside"');
    expect(html).not.toContain("NewsletterForm");
    expect(html).not.toContain("Adresse e-mail");
  });

  it("ne voile le chapô que sur une photo", async () => {
    const [posts, site] = await Promise.all([content.getPosts(), content.getSiteConfig()]);
    const post = posts.find((candidat) => candidat.heroImage);
    const chapo = (article) => {
      const arbre = BlogArticlePage({ post: article, related: [], site, sommaire: [], children: null });
      return trouver(arbre, (element) => element.props.children === article.excerpt);
    };

    expect(chapo(post).props.className).toContain(VOILE_TEXTE);
    expect(chapo({ ...post, heroImage: undefined }).props.className).not.toContain(VOILE_TEXTE);
  });
});
