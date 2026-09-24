import { describe, expect, it } from "bun:test";

import { AgentPage } from "@/components/pages/agent/AgentPage";
import { vueAgentContent } from "@/content/vue-agent";
import { content } from "@/lib/content";
import { construireProfil } from "@/lib/profil/profil";
import Agent, { generateMetadata } from "./page";

/**
 * Page `/agent` : composant serveur asynchrone sans hook, appelé directement.
 * Il traverse le vrai contenu du site (`content`, `construireProfil`) jusqu'aux
 * props de `AgentPage`.
 */
describe("page /agent", () => {
  it("publie ses métadonnées sous l'adresse canonique /agent", () => {
    const meta = generateMetadata();
    expect(meta.title).toEqual({ absolute: vueAgentContent.seo.title });
    expect(meta.description).toBe(vueAgentContent.seo.description);
    expect(meta.alternates.canonical).toBe("/agent");
  });

  it("passe à AgentPage la configuration du site et le profil complet", async () => {
    const element = await Agent();
    expect(element.type).toBe(AgentPage);
    expect(element.props.site).toEqual(await content.getSiteConfig());
    expect(element.props.profil).toEqual(await construireProfil());
  });
});
