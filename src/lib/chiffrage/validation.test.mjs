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

describe("validerDemande, champs un à un", () => {
  const tel = (valeur) => corps({ contact: { ...corps().contact, telephone: valeur } });

  it("refuse un corps sans réponses ou sans description texte", () => {
    expect(validerDemande(corps({ reponses: null }), MAINTENANT)).toEqual({ ok: false });
    expect(validerDemande(corps({ reponses: [] }), MAINTENANT)).toEqual({ ok: false });
    expect(validerDemande(corps({ description: 12 }), MAINTENANT)).toEqual({ ok: false, champ: "description" });
    expect(validerDemande(corps({ debutMs: "hier" }), MAINTENANT)).toEqual({ ok: false });
    expect(validerDemande(corps({ debutMs: Number.NaN }), MAINTENANT)).toEqual({ ok: false });
    expect(validerDemande(corps({ debutMs: MAINTENANT - 13 * 3_600_000 }), MAINTENANT)).toEqual({ ok: false });
  });

  it("nomme chaque réponse hors liste", () => {
    for (const champ of ["equipe", "outils", "urgence"]) {
      const r = corps();
      r.reponses = { ...r.reponses, [champ]: "nimporte" };
      expect(validerDemande(r, MAINTENANT)).toEqual({ ok: false, champ });
    }
  });

  it("nomme chaque coordonnée absente, vide ou trop longue", () => {
    expect(validerDemande(corps({ contact: "Lucie" }), MAINTENANT)).toEqual({ ok: false, champ: "prenom" });
    for (const [champ, max] of [
      ["prenom", 60],
      ["nom", 80],
      ["societe", 120],
    ]) {
      const vide = corps({ contact: { ...corps().contact, [champ]: "   " } });
      expect(validerDemande(vide, MAINTENANT)).toEqual({ ok: false, champ });
      const absent = corps({ contact: { ...corps().contact, [champ]: undefined } });
      expect(validerDemande(absent, MAINTENANT)).toEqual({ ok: false, champ });
      const long = corps({ contact: { ...corps().contact, [champ]: "a".repeat(max + 1) } });
      expect(validerDemande(long, MAINTENANT)).toEqual({ ok: false, champ });
    }
    const mailVide = corps({ contact: { ...corps().contact, email: 4 } });
    expect(validerDemande(mailVide, MAINTENANT)).toEqual({ ok: false, champ: "email" });
  });

  it("refuse un téléphone illisible ou mal formé", () => {
    expect(validerDemande(tel("abc"), MAINTENANT)).toEqual({ ok: false, champ: "telephone" });
    expect(validerDemande(tel("06"), MAINTENANT)).toEqual({ ok: false, champ: "telephone" });
    expect(validerDemande(tel(null), MAINTENANT)).toEqual({ ok: false, champ: "telephone" });
  });

  it("garde un jeton captcha absent comme indéfini", () => {
    const r = validerDemande(corps({ jetonCaptcha: 42 }), MAINTENANT);
    expect(r.ok).toBe(true);
    expect(r.demande.jetonCaptcha).toBeUndefined();
  });

  it("ne tient pas compte d'un piège qui n'est pas du texte", () => {
    expect(validerDemande(corps({ referenceInterne: 0 }), MAINTENANT).ok).toBe(true);
    expect(validerDemande(corps({ referenceInterne: "   " }), MAINTENANT).ok).toBe(true);
  });
});
