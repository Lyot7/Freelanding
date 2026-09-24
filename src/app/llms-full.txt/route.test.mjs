import { describe, expect, it } from "bun:test";

import { construireProfil, profilEnMarkdown } from "@/lib/profil/profil";
import { absoluteUrl } from "@/lib/site-url";
import { GET } from "./route";

/**
 * `/llms-full.txt` sert le profil complet en Markdown brut : la même source
 * que la page `/agent` et que le prompt copié (`construireProfil`), traversée
 * ici de bout en bout, du contenu du site jusqu'à la réponse HTTP.
 */
describe("GET /llms-full.txt", () => {
  it("sert le profil en texte brut UTF-8, mis en cache une heure", async () => {
    const reponse = await GET();
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(reponse.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it("rend exactement le Markdown du profil, titre en tête", async () => {
    const corps = await (await GET()).text();
    const profil = await construireProfil();
    expect(corps).toBe(profilEnMarkdown(profil));
    expect(corps.startsWith(`# ${profil.titre}\n\n`)).toBe(true);
    expect(corps.endsWith("\n")).toBe(true);
  });

  it("cite la page source et le formulaire en adresses absolues", async () => {
    const corps = await (await GET()).text();
    expect(corps).toContain(absoluteUrl("/agent"));
    expect(corps).toContain(absoluteUrl("/contact"));
    expect(corps).not.toContain("—");
  });
});
