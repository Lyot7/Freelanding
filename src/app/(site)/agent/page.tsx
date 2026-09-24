import type { Metadata } from "next";
import { AgentPage } from "@/components/pages/agent/AgentPage";
import { herosPages } from "@/content/heros-pages";
import { CHEMIN_VUE_AGENT, vueAgentContent } from "@/content/vue-agent";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";
import { construireProfil } from "@/lib/profil/profil";

export function generateMetadata(): Metadata {
  return pageMetadata(vueAgentContent.seo, CHEMIN_VUE_AGENT, {
    ogImage: herosPages.agent.og,
  });
}

export default async function Agent() {
  const [site, profil] = await Promise.all([
    content.getSiteConfig(),
    construireProfil(),
  ]);
  return <AgentPage site={site} profil={profil} />;
}
