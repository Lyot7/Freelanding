import { describe, expect, it } from "vitest";
import { prestations, prixPack } from "@/content/offre";
import { IDS_RENDEZ_VOUS, lienRendezVous } from "@/content/rendez-vous";
import { workItems } from "@/content/work";
import { faqItems } from "@/content/faq";
import { absoluteUrl } from "@/lib/site-url";
import {
  construireProfil,
  construirePrompt,
  profilEnMarkdown,
} from "./profil";

const profil = await construireProfil();
const markdown = profilEnMarkdown(profil);
const prompt = construirePrompt(profil);

describe("profil complet de la vue Agent", () => {
  it("cite chaque pack au prix calculé par offre.ts", () => {
    for (const prestation of prestations) {
      for (const pack of prestation.packs) {
        expect(markdown).toContain(`${pack.nom}\u00A0: ${prixPack(pack)}\u00A0HT`);
      }
    }
  });

  it("cite chaque réalisation et chaque question de la FAQ", () => {
    for (const work of workItems) expect(markdown).toContain(`### ${work.title}`);
    for (const item of faqItems) expect(markdown).toContain(item.answer);
  });

  it("donne le lien exact de chaque type de rendez-vous, et du formulaire", () => {
    for (const id of IDS_RENDEZ_VOUS) {
      expect(markdown).toContain(absoluteUrl(lienRendezVous(id)));
    }
    expect(markdown).toContain(absoluteUrl("/contact"));
  });

  it("n'écrit aucun lien relatif", () => {
    expect(markdown).not.toMatch(/(?:^|\s)\/(?:contact|services|realisations)\b/m);
  });

  it("ne propose aucun déplacement : les rendez-vous se font en visio", () => {
    expect(markdown).not.toMatch(/sur place|en personne|présentiel|chez toi\.|au téléphone ou chez toi/iu);
    expect(markdown).toMatch(/visio/iu);
  });

  it("ne fait pas de l'IA une raison de choisir Eliott", () => {
    const pourquoi = markdown.split("## Pourquoi moi")[1].split("\n## ")[0];
    expect(pourquoi).not.toMatch(/intelligence artificielle/iu);
  });

  it("ne porte aucun tiret cadratin dans le prompt", () => {
    expect(prompt).not.toContain("—");
  });

  it("place les consignes avant le profil, et le profil en entier", () => {
    expect(prompt.indexOf("conseiller")).toBeLessThan(prompt.indexOf(profil.titre));
    expect(prompt).toContain(markdown.trimEnd());
  });
});
