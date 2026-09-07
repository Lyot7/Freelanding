import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticlePage } from "@/components/pages/blog/BlogArticlePage";
import { JsonLd } from "@/components/JsonLd";
import { content } from "@/lib/content";
import { articleSchema, graph, personSchema } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site-url";
import { sommaireDeLArticle } from "@/lib/blog/sommaire";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await content.getPosts();
  return posts.flatMap((post) =>
    [post.slug, ...(post.aliases ?? [])].map((slug) => ({ slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await content.getPost(slug);
  if (!post) return {};
  const title = post.seo?.title ?? post.title;
  const description = post.seo?.description ?? post.excerpt;
  const canonical = `/blog/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    /*
     * L'AUTEUR, EN CLAIR DANS L'HEADER. Le JSON-LD le déclare déjà, mais il le
     * fait par référence d'identifiant : les vérificateurs qui ne résolvent pas
     * les `@id` ne voyaient aucun auteur sur un article signé. Une balise ne
     * coûte rien et ferme l'écart.
     */
    authors: [{ name: post.author.name, url: absoluteUrl("/a-propos") }],
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.date,
      images: [
        {
          url: post.seo?.ogImage?.src ?? post.cover.src,
          alt: post.seo?.ogImage?.alt ?? post.cover.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.seo?.ogImage?.src ?? post.cover.src],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, posts, site] = await Promise.all([
    content.getPost(slug),
    content.getPosts(),
    content.getSiteConfig(),
  ]);
  if (!post) notFound();

  /*
   * LE CORPS EST CHARGÉ ICI, par son slug.
   *
   * `post.slug` et non le paramètre d'URL : un article peut répondre sur
   * plusieurs adresses (`post.aliases`, cf. `generateStaticParams`), mais il n'a
   * qu'un seul fichier. Importer par le paramètre ferait échouer la compilation
   * de chaque alias.
   *
   * L'expression d'import est PARTIELLEMENT statique (`src/content/articles/` +
   * variable + `.mdx`) : le bundler en déduit le lot de fichiers candidats et
   * les compile tous à l'avance. Une variable seule ne lui laisserait rien à
   * analyser, et l'import échouerait au rendu.
   */
  const { default: Corps } = await import(
    `@/content/articles/${post.slug}.mdx`
  );

  const related = posts.filter((candidate) => candidate.slug !== post.slug);
  return (
    <>
      {/*
       * `personSchema` VOYAGE AVEC L'ARTICLE, et ce n'est pas une redite de
       * l'accueil : `articleSchema` désigne son auteur par `@id`, et une
       * référence dont la cible n'est décrite sur aucune page du parcours reste
       * un identifiant creux. Le nœud est déclaré ici pour que l'auteur se
       * résolve sur la page même, là où le signal compte.
       */}
      <JsonLd data={graph(articleSchema(post), personSchema(site))} />
      <BlogArticlePage
        post={post}
        related={related}
        site={site}
        sommaire={sommaireDeLArticle(post.slug)}
      >
        <Corps />
      </BlogArticlePage>
    </>
  );
}
