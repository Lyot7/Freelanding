import { describe, expect, it } from "bun:test";

import { content } from "@/lib/content";
import { BlogArticlePage } from "./BlogArticlePage";

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
});
