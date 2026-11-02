import { describe, expect, it } from "bun:test";
import { etatRendezVous, traduireRefus, validerAnnulation, validerDeplacement } from "./gestion.ts";

const MAINTENANT = new Date("2026-11-02T10:00:00.000Z");
const RDV = {
  type: "logiciel",
  titre: "Logiciel",
  duree: 45,
  durees: { options: [45], defaut: 45 },
  debut: "2026-11-10T09:00:00.000Z",
  fin: "2026-11-10T09:45:00.000Z",
  statut: "CONFIRME",
};

describe("etatRendezVous", () => {
  it("distingue confirmé, annulé, déplacé et passé", () => {
    expect(etatRendezVous(RDV, MAINTENANT)).toBe("confirme");
    expect(etatRendezVous({ ...RDV, statut: "ANNULE" }, MAINTENANT)).toBe("annule");
    expect(etatRendezVous({ ...RDV, statut: "DEPLACE" }, MAINTENANT)).toBe("deplace");
    expect(etatRendezVous(RDV, new Date("2026-11-10T09:10:00.000Z"))).toBe("passe");
  });
});

describe("validerAnnulation", () => {
  it("accepte un motif absent, vide ou raisonnable", () => {
    expect(validerAnnulation({})).toEqual({ ok: true });
    expect(validerAnnulation({ motif: "   " })).toEqual({ ok: true });
    expect(validerAnnulation({ motif: " Empêchement " })).toEqual({ ok: true, motif: "Empêchement" });
  });

  it("refuse un motif trop long, un motif non textuel et un corps absurde", () => {
    expect(validerAnnulation({ motif: "x".repeat(1001) }).ok).toBe(false);
    expect(validerAnnulation({ motif: 12 }).ok).toBe(false);
    expect(validerAnnulation(null).ok).toBe(false);
    expect(validerAnnulation([]).ok).toBe(false);
  });
});

describe("validerDeplacement", () => {
  const ms = MAINTENANT.getTime();
  it("normalise l’instant en UTC", () => {
    expect(validerDeplacement({ debut: "2026-11-05T15:00:00+01:00" }, ms)).toEqual({
      ok: true,
      debutUtc: "2026-11-05T14:00:00.000Z",
    });
    expect(validerDeplacement({ debut: "2026-11-05T14:00:00Z", duree: 30 }, ms)).toEqual({
      ok: true,
      debutUtc: "2026-11-05T14:00:00.000Z",
      duree: 30,
    });
  });

  it("refuse le passé, le trop proche, le trop lointain et l’illisible", () => {
    expect(validerDeplacement({ debut: "2026-11-01T10:00:00Z" }, ms)).toEqual({ ok: false, champ: "creneau" });
    expect(validerDeplacement({ debut: "2026-11-02T10:30:00Z" }, ms)).toEqual({ ok: false, champ: "creneau" });
    expect(validerDeplacement({ debut: "2027-06-01T10:00:00Z" }, ms)).toEqual({ ok: false, champ: "creneau" });
    expect(validerDeplacement({ debut: "demain" }, ms)).toEqual({ ok: false, champ: "creneau" });
    expect(validerDeplacement(null, ms)).toEqual({ ok: false, champ: "creneau" });
    expect(validerDeplacement({ debut: 12 }, ms)).toEqual({ ok: false, champ: "creneau" });
    expect(validerDeplacement({ debut: "2026-11-05T14:00:00Z", duree: 9999 }, ms)).toEqual({
      ok: false,
      champ: "duree",
    });
  });
});

describe("traduireRefus", () => {
  const repli = "Écrivez-moi.";
  it("dit au visiteur ce qu’il peut faire", () => {
    expect(traduireRefus({ raison: "refuse", statut: 409, detail: "creneau_pris" }, repli)).toMatchObject({
      statut: 409,
      champ: "creneau",
    });
    expect(traduireRefus({ raison: "refuse", statut: 409, detail: "deja_annule" }, repli).statut).toBe(409);
    expect(traduireRefus({ raison: "refuse", statut: 404, detail: "introuvable" }, repli).statut).toBe(404);
    expect(traduireRefus({ raison: "refuse", statut: 400, detail: "duree_invalide" }, repli).champ).toBe("duree");
  });

  it("garde le repli pour les pannes, sans trahir le code du cockpit", () => {
    const refus401 = traduireRefus({ raison: "refuse", statut: 401, detail: "jeton_invalide" }, repli);
    expect(refus401.statut).toBe(502);
    expect(refus401.message).toContain(repli);
    expect(refus401.message).not.toContain("jeton");
    expect(traduireRefus({ raison: "indisponible", detail: "TimeoutError" }, repli).statut).toBe(504);
    expect(traduireRefus({ raison: "indisponible", detail: "non_configure" }, repli).statut).toBe(503);
  });
});
