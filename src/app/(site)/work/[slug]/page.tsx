import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkDetailPage } from "@/components/pages/work/WorkDetailPage";
import { content } from "@/lib/content";
import { JsonLd } from "@/components/JsonLd";
import { graph, workSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";

type WorkRouteProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const works = await content.getWorks();
  return works.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({
  params,
}: WorkRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const work = await content.getWork(slug);
  if (!work) {
    notFound();
  }

  // Le résumé sert de description : il est écrit pour être lu seul, c'est
  // exactement ce qu'attend un extrait de résultat de recherche.
  return pageMetadata(
    { title: work.title, description: work.overview },
    `/work/${work.slug}`,
    { ogType: "article", ogImage: work.cover },
  );
}

export default async function WorkDetail({ params }: WorkRouteProps) {
  const { slug } = await params;
  const [site, work, works] = await Promise.all([
    content.getSiteConfig(),
    content.getWork(slug),
    content.getWorks(),
  ]);

  if (!work) {
    notFound();
  }

  return (
    <>
      {/* La réalisation elle-même, plus le fil d'Ariane qui la situe sous
          /work : sans lui, un moteur voit une page isolée et ne rattache pas
          le projet au portfolio. */}
      <JsonLd data={graph(workSchema(work))} />
      <WorkDetailPage site={site} work={work} works={works} />
    </>
  );
}
