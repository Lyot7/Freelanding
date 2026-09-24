import { describe, expect, it } from "bun:test";

import { GET } from "./route";

/**
 * Les trois pages de droit ont été ajoutées le 2026-09-21 : un agent qui lit
 * `/llms.txt` doit pouvoir les trouver au même titre que les autres pages,
 * sans avoir à les deviner depuis le pied de page.
 */
describe("GET /llms.txt", () => {
  it("liste les trois pages légales avec leur note", async () => {
    const reponse = await GET();
    expect(reponse.status).toBe(200);
    const corps = await reponse.text();

    expect(corps).toContain(
      "[Mentions légales](http://localhost:3000/legal/mentions-legales) : éditeur, directeur de publication, hébergeur",
    );
    expect(corps).toContain(
      "[Politique de confidentialité](http://localhost:3000/legal/politique-de-confidentialite) : données collectées, bases légales, durées, droits RGPD",
    );
    expect(corps).toContain(
      "[Conditions générales de vente](http://localhost:3000/legal/conditions-generales-de-vente) : vente aux professionnels : devis, paiement, délais, droits sur le livrable",
    );
  });

  it("garde les pages légales après les pages de contact, dans la section « Pages »", () => {
    return GET()
      .then((reponse) => reponse.text())
      .then((corps) => {
        const pages = corps.split("## Pages")[1]?.split("## Questions")[0] ?? "";
        const indexContact = pages.indexOf("Contact");
        const indexMentions = pages.indexOf("Mentions légales");
        expect(indexContact).toBeGreaterThan(-1);
        expect(indexMentions).toBeGreaterThan(indexContact);
      });
  });

  it("mène à la vue agent et au profil complet en texte brut", async () => {
    const corps = await (await GET()).text();
    expect(corps).toContain("[Vue agent](http://localhost:3000/agent) : ");
    expect(corps).toContain(
      "[Profil complet](http://localhost:3000/llms-full.txt) : le même profil en Markdown brut, en un seul fichier",
    );
  });
});
