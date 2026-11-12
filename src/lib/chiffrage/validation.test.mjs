import { describe, expect, it } from "bun:test";
import { validerDemande } from "./validation.ts";

const MAINTENANT = 1_800_000_000_000;

function corps(extra = {}) {
  return {
    reponses: { type: "site", equipe: "1-5", outils: "rien", urgence: "libre" },
    description: "Un site pour présenter mon atelier de menuiserie et recevoir des demandes de devis.",
    contact: {
      prenom: " Lucie ",
      nom: "Marchetti",
      societe: "Menuiserie des Coteaux",
      email: "Lucie@Coteaux.fr",
      telephone: "06 47 21 88 03",
    },
    consentement: true,
    jetonCaptcha: "jeton",
    debutMs: MAINTENANT - 60_000,
    referenceInterne: "",
    ...extra,
  };
}

describe("validerDemande", () => {
  it("accepte une demande complète et la normalise", () => {
    const r = validerDemande(corps(), MAINTENANT);
    expect(r.ok).toBe(true);
    expect(r.demande.contact.prenom).toBe("Lucie");
    expect(r.demande.contact.email).toBe("lucie@coteaux.fr");
    expect(r.demande.jetonCaptcha).toBe("jeton");
  });

  it("refuse en silence un robot : piège rempli ou envoi trop rapide", () => {
    expect(validerDemande(corps({ referenceInterne: "x" }), MAINTENANT)).toEqual({ ok: false });
    expect(validerDemande(corps({ debutMs: MAINTENANT - 500 }), MAINTENANT)).toEqual({ ok: false });
    expect(validerDemande("texte", MAINTENANT)).toEqual({ ok: false });
  });

  it("nomme le champ en faute", () => {
    expect(validerDemande(corps({ consentement: false }), MAINTENANT)).toEqual({ ok: false, champ: "consentement" });
    expect(validerDemande(corps({ description: "court" }), MAINTENANT)).toEqual({ ok: false, champ: "description" });
    expect(validerDemande(corps({ description: "x".repeat(3_001) }), MAINTENANT)).toEqual({
      ok: false,
      champ: "description",
    });
    const sansTel = corps();
    sansTel.contact = { ...sansTel.contact, telephone: "" };
    expect(validerDemande(sansTel, MAINTENANT)).toEqual({ ok: false, champ: "telephone" });
    const mauvaisMail = corps();
    mauvaisMail.contact = { ...mauvaisMail.contact, email: "lucie@" };
    expect(validerDemande(mauvaisMail, MAINTENANT)).toEqual({ ok: false, champ: "email" });
  });

  it("refuse une réponse hors liste", () => {
    const r = corps();
    r.reponses = { ...r.reponses, type: "crypto" };
    expect(validerDemande(r, MAINTENANT)).toEqual({ ok: false, champ: "type" });
  });
});
