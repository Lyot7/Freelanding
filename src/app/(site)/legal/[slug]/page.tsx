import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageView } from "@/components/pages/legal/LegalPageView";
import { content } from "@/lib/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  const documents = await content.getLegalDocuments();
  return documents.flatMap((document) =>
    [document.slug, ...(document.aliases ?? [])].map((slug) => ({ slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const document = await content.getLegalDocument(slug);
  if (!document) return {};
  const canonical = `/legal/${document.slug}`;
  return {
    title: { absolute: document.seo.title },
    description: document.seo.description,
    alternates: { canonical },
    openGraph: {
      title: document.seo.title,
      description: document.seo.description,
      type: "website",
      url: canonical,
    },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [document, site] = await Promise.all([
    content.getLegalDocument(slug),
    content.getSiteConfig(),
  ]);
  if (!document) notFound();

  return <LegalPageView document={document} site={site} />;
}
