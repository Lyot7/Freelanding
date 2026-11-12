import { describe, expect, it } from "bun:test";
import { estimationContent, lienRendezVous } from "./estimation.ts";

const C = estimationContent;

describe("textes de l'outil de chiffrage", () => {
  it("le compteur de description utilise le format français", () => {
    expect(C.description.compteur(1_234, 3_000)).toBe(`${(1_234).toLocaleString("fr-FR")} / ${(3_000).toLocaleString("fr-FR")}`);
  });

  it("« manque » s'accorde au pluriel", () => {
    expect(C.description.manque(1)).toBe("Encore 1 caractère au moins.");
    expect(C.description.manque(12)).toBe("Encore 12 caractères au moins.");
  });

  it("l'introduction du résultat nomme le visiteur", () => {
    expect(C.resultat.intro("Lucie")).toBe("Voici votre estimation, Lucie.");
  });

  it("l'abonnement dit la durée et ce qui reste après", () => {
    expect(C.resultat.abonnement.engagement(12)).toBe("12 mois");
    expect(C.resultat.abonnement.mensualite(24)).toContain("24 mois");
    expect(C.resultat.abonnement.apres(12, true)).toContain("évolutions");
    expect(C.resultat.abonnement.apres(24, false)).toContain("il ne reste que le suivi");
  });

  it("le lien de rendez-vous porte le type de projet", () => {
    expect(lienRendezVous("site")).toBe("/rdv?sujet=site");
    expect(lienRendezVous("ia")).toBe("/rdv?sujet=ia");
  });
});
