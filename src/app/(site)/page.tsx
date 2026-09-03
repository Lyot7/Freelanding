import type { Metadata } from "next";
import { HomePage } from "@/components/pages/HomePage";
import { JsonLd } from "@/components/JsonLd";
import { content } from "@/lib/content";
import { businessSchema, faqSchema, graph, personSchema } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await content.getHome();
  return pageMetadata(seo, "/");
}

export default async function Home() {
  // La home porte l'identité complète : qui, quelle activité, quelles
  // prestations, quelle zone, et les questions déjà répondues sur la page.
  // C'est la page qu'un assistant lit en premier pour savoir de qui il parle.
  const [site, home] = await Promise.all([
    content.getSiteConfig(),
    content.getHome(),
  ]);

  return (
    <>
      <JsonLd
        data={graph(
          personSchema(site),
          businessSchema(site, home),
          // La FAQ est optionnelle dans le contrat : pas de bloc quand elle
          // est vide, plutôt qu'un `FAQPage` sans question.
          home.faq?.length ? faqSchema(home.faq) : [],
        )}
      />
      <HomePage />
    </>
  );
}
