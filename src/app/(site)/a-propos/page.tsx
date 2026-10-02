import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { AboutPage } from "@/components/pages/about/AboutPage";
import { content } from "@/lib/content";
import { graph, personSchema, profilePageSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await content.getAbout();
  return pageMetadata(seo, "/a-propos");
}

export default async function About() {
  const site = await content.getSiteConfig();

  return (
    <>
      <JsonLd data={graph(profilePageSchema(), personSchema(site))} />
      <AboutPage />
    </>
  );
}
