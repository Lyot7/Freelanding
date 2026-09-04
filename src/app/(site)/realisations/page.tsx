import type { Metadata } from "next";
import { WorkPage } from "@/components/pages/work/WorkPage";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await content.getWorkPage();
  return pageMetadata(page.seo, "/realisations");
}

export default function Work() {
  return <WorkPage />;
}
