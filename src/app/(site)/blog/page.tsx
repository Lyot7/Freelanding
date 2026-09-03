import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndexPage } from "@/components/pages/blog/BlogIndexPage";
import { siteFeatures } from "@/content/features";
import { content } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  // Blog éteint : pas de métadonnées à exposer pour une page qui répond 404.
  if (!siteFeatures.blog) return {};
  const blog = await content.getBlog();
  return {
    title: { absolute: blog.seo.title },
    description: blog.seo.description,
    alternates: { canonical: "/blog" },
    openGraph: {
      title: blog.seo.title,
      description: blog.seo.description,
      url: "/blog",
      type: "website",
    },
  };
}

export default async function BlogPage() {
  // Le blog est éteint tant qu'Eliott n'a pas écrit ses propres articles (voir
  // `src/content/features.ts`). L'index répond 404 plutôt que d'afficher les
  // contenus de démonstration hérités du template.
  if (!siteFeatures.blog) notFound();

  const [blog, site] = await Promise.all([
    content.getBlog(),
    content.getSiteConfig(),
  ]);

  return <BlogIndexPage blog={blog} site={site} />;
}
