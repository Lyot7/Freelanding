import { describe, expect, it } from "bun:test";

import { moisDesCreneaux, JOUR_DE_BASCULE } from "./availability-month";

/** Raccourci : un instant à midi UTC, pour rester loin des bords de journée. */
const midi = (iso) => new Date(`${iso}T12:00:00.000Z`);

describe("moisDesCreneaux", () => {
  it("affiche le mois courant avant le jour de bascule", () => {
    expect(moisDesCreneaux(midi("2026-08-01"))).toBe("AOÛT");
    expect(moisDesCreneaux(midi("2026-08-19"))).toBe("AOÛT");
  });

  it("bascule sur le mois suivant à partir du 20", () => {
    expect(moisDesCreneaux(midi("2026-08-20"))).toBe("SEPTEMBRE");
    expect(moisDesCreneaux(midi("2026-08-31"))).toBe("SEPTEMBRE");
  });

  it("passe à l'année suivante en fin décembre, sans cas particulier", () => {
    expect(moisDesCreneaux(midi("2026-12-19"))).toBe("DÉCEMBRE");
    expect(moisDesCreneaux(midi("2026-12-20"))).toBe("JANVIER");
  });

  it("couvre les douze mois", () => {
    const attendus = [
      "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
      "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
    ];
    for (let m = 0; m < 12; m += 1) {
      const iso = `2026-${String(m + 1).padStart(2, "0")}-05`;
      expect([iso, moisDesCreneaux(midi(iso))]).toEqual([iso, attendus[m]]);
    }
  });

  it("lit le jour DANS le fuseau visé, pas en UTC", () => {
    // 19 août 23 h 30 UTC = 20 août 01 h 30 à Paris : Paris a déjà basculé.
    const veille = new Date("2026-08-19T23:30:00.000Z");
    expect(moisDesCreneaux(veille, "Europe/Paris")).toBe("SEPTEMBRE");
    expect(moisDesCreneaux(veille, "UTC")).toBe("AOÛT");
  });

  it("rend un libellé en capitales, accents compris", () => {
    // La chaîne SERT DE REPÈRE à l'emphase du libellé : elle doit être en
    // capitales dans la donnée, pas seulement à l'écran via `text-transform`.
    const aout = moisDesCreneaux(midi("2026-08-01"));
    expect(aout).toBe(aout.toLocaleUpperCase("fr-FR"));
    expect(aout).toContain("Û");
  });

  it("expose un jour de bascule explicite", () => {
    expect(JOUR_DE_BASCULE).toBe(20);
  });
});
