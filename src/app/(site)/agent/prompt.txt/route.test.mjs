import { describe, expect, it } from "bun:test";

import { vueAgentContent } from "@/content/vue-agent";
import {
  consignesDuPrompt,
  construireProfil,
  construirePrompt,
  profilEnMarkdown,
} from "@/lib/profil/profil";
import { GET } from "./route";

/**
 * `/agent/prompt.txt` est ce que va chercher le raccourci du héros de
 * l'accueil (`DemanderAssistant`) : il doit rendre, octet pour octet, le
 * prompt que copie le bouton de la page `/agent`.
 */
describe("GET /agent/prompt.txt", () => {
  it("sert le prompt en texte brut UTF-8, mis en cache une heure", async () => {
    const reponse = await GET();
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(reponse.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it("rend le même prompt que le bouton de la page", async () => {
    const corps = await (await GET()).text();
    expect(corps).toBe(construirePrompt(await construireProfil()));
  });

  it("encadre le profil complet, après les consignes", async () => {
    const corps = await (await GET()).text();
    const { debutProfil, finProfil } = vueAgentContent.prompt;
    const debut = corps.indexOf(`--- ${debutProfil} ---`);
    const fin = corps.indexOf(`--- ${finProfil} ---`);

    expect(corps.startsWith(consignesDuPrompt())).toBe(true);
    expect(debut).toBeGreaterThan(0);
    expect(fin).toBeGreaterThan(debut);
    expect(corps.slice(debut, fin)).toContain(profilEnMarkdown(await construireProfil()).trimEnd());
    expect(corps.endsWith(`--- ${finProfil} ---`)).toBe(true);
  });
});
