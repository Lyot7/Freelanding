import { describe, expect, it } from "bun:test";

import {
  CONSENT_ALL_DENIED,
  CONSENT_ALL_GRANTED,
  CONSENT_STORAGE_KEY,
  CONSENT_TTL_MS,
  CONSENT_VERSION,
  clearConsent,
  consentAllows,
  effectiveChoices,
  isConsentExpired,
  parseConsent,
  readConsent,
  serialiseConsent,
  writeConsent,
} from "./consent.ts";

/**
 * POURQUOI CE FICHIER EXISTE.
 *
 * Une régression ici ne se voit pas : le site s'affiche exactement pareil, les
 * types restent verts, aucune page ne casse. Elle se voit dans l'onglet réseau
 * d'un contrôleur, ou dans une plainte. Les quatre familles couvertes sont
 * celles qui coûtent : le REFUS qui ne tient pas, l'EXPIRATION qui ne se
 * déclenche pas (ou qui se déclenche trop tôt), la RÉVOCATION qui laisse le
 * choix en place, et le stockage CORROMPU qui passerait pour un consentement.
 */

const MAINTENANT = Date.UTC(2026, 7, 28, 12, 0, 0);

/** Faux stockage, avec le même contrat que `window.localStorage`. */
function stockage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
    /** Pour les assertions du test seulement. */
    brut: () => Object.fromEntries(data),
  };
}

/** Stockage qui lève à chaque appel (navigation privée verrouillée, quota). */
const stockageEnPanne = {
  getItem() {
    throw new Error("stockage indisponible");
  },
  setItem() {
    throw new Error("stockage indisponible");
  },
  removeItem() {
    throw new Error("stockage indisponible");
  },
};

describe("parseConsent — ce qui est refusé", () => {
  it("refuse l'absence de valeur", () => {
    expect(parseConsent(null, MAINTENANT)).toBeNull();
    expect(parseConsent(undefined, MAINTENANT)).toBeNull();
    expect(parseConsent("", MAINTENANT)).toBeNull();
    expect(parseConsent("   ", MAINTENANT)).toBeNull();
  });

  it("refuse une chaîne qui n'est pas du JSON", () => {
    expect(parseConsent("{oui", MAINTENANT)).toBeNull();
    expect(parseConsent("accepte", MAINTENANT)).toBeNull();
  });

  it("refuse un JSON valide qui n'est pas un objet", () => {
    expect(parseConsent("true", MAINTENANT)).toBeNull();
    expect(parseConsent("[1,2]", MAINTENANT)).toBeNull();
    expect(parseConsent("null", MAINTENANT)).toBeNull();
  });

  it("refuse une autre version du schéma", () => {
    const raw = JSON.stringify({
      version: CONSENT_VERSION + 1,
      decidedAt: MAINTENANT,
      choices: { analytics: true, replay: true },
    });
    expect(parseConsent(raw, MAINTENANT)).toBeNull();
  });

  it("refuse une date absente, non numérique ou non finie", () => {
    for (const decidedAt of [undefined, "hier", Number.NaN, Infinity]) {
      const raw = JSON.stringify({
        version: CONSENT_VERSION,
        decidedAt,
        choices: { analytics: true, replay: false },
      });
      expect(parseConsent(raw, MAINTENANT)).toBeNull();
    }
  });

  it("refuse une date située dans le futur au-delà de la tolérance d'horloge", () => {
    const raw = JSON.stringify({
      version: CONSENT_VERSION,
      decidedAt: MAINTENANT + 3 * 24 * 60 * 60 * 1000,
      choices: { analytics: true, replay: true },
    });
    expect(parseConsent(raw, MAINTENANT)).toBeNull();
  });

  it("refuse des choix qui ne sont pas des booléens", () => {
    for (const choices of [undefined, "tout", { analytics: "oui" }, {}]) {
      const raw = JSON.stringify({
        version: CONSENT_VERSION,
        decidedAt: MAINTENANT,
        choices,
      });
      expect(parseConsent(raw, MAINTENANT)).toBeNull();
    }
  });
});

describe("parseConsent — ce qui est accepté", () => {
  it("relit un consentement complet", () => {
    const raw = serialiseConsent(CONSENT_ALL_GRANTED, MAINTENANT);
    expect(parseConsent(raw, MAINTENANT)).toEqual({
      version: CONSENT_VERSION,
      decidedAt: MAINTENANT,
      choices: { analytics: true, replay: true },
    });
  });

  it("relit un REFUS, qui doit tenir exactement comme une acceptation", () => {
    const raw = serialiseConsent(CONSENT_ALL_DENIED, MAINTENANT);
    const record = parseConsent(raw, MAINTENANT);
    expect(record).not.toBeNull();
    expect(record.choices).toEqual({ analytics: false, replay: false });
  });

  it("relit un choix partiel : mesure oui, rejeu non", () => {
    const raw = serialiseConsent({ analytics: true, replay: false }, MAINTENANT);
    expect(parseConsent(raw, MAINTENANT).choices).toEqual({
      analytics: true,
      replay: false,
    });
  });

  it("retombe sur le refus quand `replay` manque, sans invalider le reste", () => {
    const raw = JSON.stringify({
      version: CONSENT_VERSION,
      decidedAt: MAINTENANT,
      choices: { analytics: true },
    });
    expect(parseConsent(raw, MAINTENANT).choices).toEqual({
      analytics: true,
      replay: false,
    });
  });
});

describe("expiration à six mois", () => {
  const raw = serialiseConsent(CONSENT_ALL_GRANTED, MAINTENANT);

  it("tient jusqu'à la veille de l'échéance", () => {
    const presque = MAINTENANT + CONSENT_TTL_MS - 1;
    expect(parseConsent(raw, presque)).not.toBeNull();
  });

  it("tombe à l'échéance exacte", () => {
    expect(parseConsent(raw, MAINTENANT + CONSENT_TTL_MS)).toBeNull();
  });

  it("tombe bien après", () => {
    expect(parseConsent(raw, MAINTENANT + 2 * CONSENT_TTL_MS)).toBeNull();
  });

  it("fait expirer le REFUS comme l'acceptation, ni avant ni après", () => {
    const refus = serialiseConsent(CONSENT_ALL_DENIED, MAINTENANT);
    expect(parseConsent(refus, MAINTENANT + CONSENT_TTL_MS - 1)).not.toBeNull();
    expect(parseConsent(refus, MAINTENANT + CONSENT_TTL_MS)).toBeNull();
  });

  it("isConsentExpired suit la même frontière", () => {
    const record = parseConsent(raw, MAINTENANT);
    expect(isConsentExpired(record, MAINTENANT + CONSENT_TTL_MS - 1)).toBe(false);
    expect(isConsentExpired(record, MAINTENANT + CONSENT_TTL_MS)).toBe(true);
  });
});

describe("consentAllows", () => {
  const sansChoix = null;
  const refus = parseConsent(
    serialiseConsent(CONSENT_ALL_DENIED, MAINTENANT),
    MAINTENANT,
  );
  const mesureSeule = parseConsent(
    serialiseConsent({ analytics: true, replay: false }, MAINTENANT),
    MAINTENANT,
  );
  const tout = parseConsent(
    serialiseConsent(CONSENT_ALL_GRANTED, MAINTENANT),
    MAINTENANT,
  );

  it("laisse toujours passer le strictement nécessaire", () => {
    for (const record of [sansChoix, refus, mesureSeule, tout]) {
      expect(consentAllows(record, "necessary")).toBe(true);
    }
  });

  it("refuse tout le reste tant qu'aucun choix n'a été fait", () => {
    expect(consentAllows(sansChoix, "analytics")).toBe(false);
    expect(consentAllows(sansChoix, "replay")).toBe(false);
  });

  it("refuse tout le reste après un refus explicite", () => {
    expect(consentAllows(refus, "analytics")).toBe(false);
    expect(consentAllows(refus, "replay")).toBe(false);
  });

  it("sépare bien mesure et rejeu", () => {
    expect(consentAllows(mesureSeule, "analytics")).toBe(true);
    expect(consentAllows(mesureSeule, "replay")).toBe(false);
    expect(consentAllows(tout, "replay")).toBe(true);
  });

  it("subordonne le rejeu à la mesure, même si le stockage dit l'inverse", () => {
    const incoherent = parseConsent(
      JSON.stringify({
        version: CONSENT_VERSION,
        decidedAt: MAINTENANT,
        choices: { analytics: false, replay: true },
      }),
      MAINTENANT,
    );
    expect(consentAllows(incoherent, "replay")).toBe(false);
    expect(effectiveChoices(incoherent)).toEqual({
      analytics: false,
      replay: false,
    });
  });
});

describe("cycle complet lecture / écriture / révocation", () => {
  it("écrit, relit, puis efface", () => {
    const store = stockage();
    expect(readConsent(store, MAINTENANT)).toBeNull();

    writeConsent(store, CONSENT_ALL_GRANTED, MAINTENANT);
    expect(store.brut()[CONSENT_STORAGE_KEY]).toBeDefined();
    expect(readConsent(store, MAINTENANT).choices).toEqual({
      analytics: true,
      replay: true,
    });

    clearConsent(store);
    expect(store.brut()[CONSENT_STORAGE_KEY]).toBeUndefined();
    // Après révocation on repart de zéro : la bannière doit se rouvrir, et
    // surtout rien ne doit plus être autorisé.
    expect(readConsent(store, MAINTENANT)).toBeNull();
    expect(consentAllows(readConsent(store, MAINTENANT), "analytics")).toBe(
      false,
    );
  });

  it("un refus persiste au rechargement et ne redemande rien", () => {
    const store = stockage();
    writeConsent(store, CONSENT_ALL_DENIED, MAINTENANT);
    const relu = readConsent(store, MAINTENANT + 60_000);
    expect(relu).not.toBeNull();
    expect(relu.choices.analytics).toBe(false);
  });

  it("un choix modifié écrase le précédent et redate la décision", () => {
    const store = stockage();
    writeConsent(store, CONSENT_ALL_GRANTED, MAINTENANT);
    const plusTard = MAINTENANT + 10 * 24 * 60 * 60 * 1000;
    writeConsent(store, { analytics: true, replay: false }, plusTard);
    const relu = readConsent(store, plusTard);
    expect(relu.decidedAt).toBe(plusTard);
    expect(relu.choices).toEqual({ analytics: true, replay: false });
  });

  it("ne lève jamais quand le stockage est indisponible", () => {
    expect(readConsent(stockageEnPanne, MAINTENANT)).toBeNull();
    expect(readConsent(null, MAINTENANT)).toBeNull();
    expect(() => writeConsent(stockageEnPanne, CONSENT_ALL_DENIED, MAINTENANT)).not.toThrow();
    expect(() => clearConsent(stockageEnPanne)).not.toThrow();
    // Le choix vaut quand même pour la session en cours.
    expect(
      writeConsent(stockageEnPanne, CONSENT_ALL_GRANTED, MAINTENANT).choices,
    ).toEqual({ analytics: true, replay: true });
  });

  it("une valeur corrompue dans le stockage ne vaut pas consentement", () => {
    const store = stockage({ [CONSENT_STORAGE_KEY]: "{\"version\":1," });
    expect(readConsent(store, MAINTENANT)).toBeNull();
    expect(consentAllows(readConsent(store, MAINTENANT), "analytics")).toBe(
      false,
    );
  });
});
