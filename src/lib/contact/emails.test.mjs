import { describe, expect, it } from "bun:test";
import { composerNotification } from "./emails.ts";

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
