import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/about/AboutPage";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await content.getAbout();
  return pageMetadata(seo, "/a-propos");
}

export default function About() {
  return <AboutPage />;
}
