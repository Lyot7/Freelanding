import { describe, expect, it } from "bun:test";
import { composerAccuseReception, composerNotification } from "./emails.ts";

const base = {
  intention: "projet",
  nom: "Jean Dupont",
  email: "jean@example.com",
  typeProjet: "Un site",
};

describe("composerNotification — questionnaire", () => {
  it("écrit les réponses du questionnaire dans l'ordre du formulaire", () => {
    const { texte, html } = composerNotification({
      ...base,
      budget: "Je ne sais pas encore",
      objectif: "Être trouvé sur Google",
      echeance: "Dès que possible",
    });
    expect(texte).toContain(
      "Budget HT : Je ne sais pas encore\nObjectif : Être trouvé sur Google\nÉchéance : Dès que possible",
    );
    expect(html).toContain("Être trouvé sur Google");
  });

  it("n'écrit aucune ligne de questionnaire sans réponse", () => {
    const { texte } = composerNotification(base);
    expect(texte).not.toContain("Budget HT");
    expect(texte).not.toContain("Objectif");
  });
});

describe("composerNotification — téléphone", () => {
  it("donne le numéro à Eliott, sous l'e-mail, avec un lien d'appel", () => {
    const { texte, html } = composerNotification({ ...base, telephone: "06 32 21 37 11" });
    expect(texte).toContain("E-mail : jean@example.com\nTéléphone : 06 32 21 37 11");
    expect(html).toContain('href="tel:0632213711"');
    expect(html).toContain("06 32 21 37 11");
  });

  it("n'écrit aucune ligne de téléphone sans numéro", () => {
    const { texte, html } = composerNotification(base);
    expect(texte).not.toContain("Téléphone");
    expect(html).not.toContain("tel:");
  });

  it("ne met pas le numéro dans l'accusé de réception du visiteur", () => {
    const { texte, html } = composerAccuseReception(
      { ...base, telephone: "06 32 21 37 11" },
      "contact@example.com",
    );
    expect(texte).not.toContain("06 32 21 37 11");
    expect(html).not.toContain("06 32 21 37 11");
  });
});
