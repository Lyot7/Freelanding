import { describe, expect, it } from "bun:test";

import {
  CONSENT_BOOT_SCRIPT,
  CONSENT_STORAGE_KEY,
  CONSENT_TTL_MS,
  CONSENT_VERSION,
  parseConsent,
} from "./consent.ts";

/**
 * Le script inline du `<head>` recopie les règles de `parseConsent`, faute de
 * pouvoir importer un module avant la première peinture. S'ils divergent, la
 * bannière est masquée chez un visiteur sans choix valide jusqu'à l'hydratation,
 * ou montrée à qui a déjà choisi. Ce fichier les confronte cas par cas.
 */

const MAINTENANT = Date.UTC(2026, 8, 15, 12, 0, 0);
const JOUR = 24 * 60 * 60 * 1000;

function scriptMasque(raw, now) {
  let masque = false;
  let cleLue = null;
  const localStorage = {
    getItem: (key) => {
      cleLue = key;
      return raw;
    },
  };
  const document = {
    documentElement: {
      setAttribute: () => {
        masque = true;
      },
    },
  };
  new Function("localStorage", "document", "Date", CONSENT_BOOT_SCRIPT)(
    localStorage,
    document,
    { now: () => now },
  );
  expect(cleLue).toBe(CONSENT_STORAGE_KEY);
  return masque;
}

const enregistrement = (overrides = {}) =>
  JSON.stringify({
    version: CONSENT_VERSION,
    decidedAt: MAINTENANT - JOUR,
    choices: { analytics: false, replay: false },
    ...overrides,
  });

const CAS = {
  "refus valide": enregistrement(),
  "acceptation valide": enregistrement({
    choices: { analytics: true, replay: true },
  }),
  "replay absent": enregistrement({ choices: { analytics: true } }),
  absent: null,
  vide: "",
  blancs: "   ",
  "JSON illisible": "{oui",
  "null stocké": "null",
  tableau: "[]",
  "autre version": enregistrement({ version: CONSENT_VERSION + 1 }),
  "date texte": enregistrement({ decidedAt: "hier" }),
  "périmé pile au terme": enregistrement({
    decidedAt: MAINTENANT - CONSENT_TTL_MS,
  }),
  "juste avant le terme": enregistrement({
    decidedAt: MAINTENANT - CONSENT_TTL_MS + 1,
  }),
  "futur dans la tolérance": enregistrement({ decidedAt: MAINTENANT + JOUR }),
  "futur hors tolérance": enregistrement({ decidedAt: MAINTENANT + JOUR + 1 }),
  "choix absents": enregistrement({ choices: undefined }),
  "analytics non booléen": enregistrement({ choices: { analytics: "oui" } }),
};

describe("CONSENT_BOOT_SCRIPT", () => {
  for (const [nom, raw] of Object.entries(CAS)) {
    it(`s'accorde avec parseConsent : ${nom}`, () => {
      expect(scriptMasque(raw, MAINTENANT)).toBe(
        parseConsent(raw, MAINTENANT) !== null,
      );
    });
  }

  it("ne lève jamais, même sans localStorage", () => {
    expect(() =>
      new Function("localStorage", "document", "Date", CONSENT_BOOT_SCRIPT)(
        undefined,
        undefined,
        Date,
      ),
    ).not.toThrow();
  });
});
