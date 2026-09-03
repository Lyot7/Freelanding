import { describe, expect, it } from "bun:test";
import {
  LONGUEUR_MESSAGE_MAX,
  PREAVIS_MINIMAL_MS,
  validerReservation,
} from "./validation.ts";

/**
 * UNE RÉSERVATION N'EST PAS UN E-MAIL DE PLUS. Elle pose un événement dans
 * l'agenda d'Eliott et bloque un créneau que personne d'autre ne pourra
 * prendre. Une régression ici est silencieuse : l'interface continue d'afficher
 * « c'est réservé ».
 */

const MAINTENANT = Date.UTC(2026, 8, 1, 13, 0, 0);
const DEBUT_HUMAIN = MAINTENANT - 10_000;
const TYPES = ["site", "outil", "decouverte"];

function valider(surcharge = {}) {
  return validerReservation(
    {
      type: "site",
      debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
      nom: "Camille Renard",
      email: "camille@exemple.fr",
      debutMs: DEBUT_HUMAIN,
      ...surcharge,
    },
    { typesAutorises: TYPES, maintenantMs: MAINTENANT },
  );
}

describe("validerReservation — chemin nominal", () => {
  it("accepte une demande complète et la normalise", () => {
    const resultat = valider({ nom: "  Camille   Renard  " });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.nom).toBe("Camille Renard");
    expect(resultat.reservation.type).toBe("site");
    // Cal.com exige l'instant en UTC, quel que soit le décalage écrit.
    expect(resultat.reservation.debutUtc).toBe("2026-09-03T13:00:00.000Z");
  });

  it("convertit un début écrit avec un décalage local", () => {
    const resultat = valider({ debut: "2026-09-03T15:00:00.000+02:00" });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.debutUtc).toBe("2026-09-03T13:00:00.000Z");
  });

  it("laisse le message absent quand il est vide", () => {
    expect(valider({ message: "   " }).reservation.message).toBeUndefined();
    expect(valider({ message: "Refonte du site." }).reservation.message).toBe(
      "Refonte du site.",
    );
  });
});

describe("validerReservation — le type", () => {
  it("refuse un type inconnu du contenu", () => {
    const resultat = valider({ type: "audit" });
    expect(resultat.ok).toBe(false);
    expect(resultat.motif).toEqual({
      type: "champ_invalide",
      champ: "type",
      raison: "hors_liste",
    });
  });

  it("refuse un type connu mais NON CONFIGURÉ", () => {
    // `logiciel` existe dans le contenu ; il n'est pas dans `typesAutorises`.
    // Sans ce contrôle, une requête forgée réserverait sur une variable vide.
    expect(valider({ type: "logiciel" }).ok).toBe(false);
  });
});

describe("validerReservation — le créneau", () => {
  it("refuse une date illisible", () => {
    expect(valider({ debut: "demain matin" }).ok).toBe(false);
    expect(valider({ debut: "" }).ok).toBe(false);
    expect(valider({ debut: 42 }).ok).toBe(false);
  });

  it("refuse un créneau passé ou trop proche", () => {
    const passe = valider({ debut: new Date(MAINTENANT - 3600_000).toISOString() });
    expect(passe.motif.raison).toBe("passe");
    const juste = valider({
      debut: new Date(MAINTENANT + PREAVIS_MINIMAL_MS - 1000).toISOString(),
    });
    expect(juste.motif.raison).toBe("passe");
  });

  it("refuse un créneau au-delà de l’horizon", () => {
    const resultat = valider({ debut: "2030-01-01T10:00:00.000Z" });
    expect(resultat.motif.raison).toBe("hors_horizon");
  });
});

describe("validerReservation — identité", () => {
  it("refuse un nom trop court ou trop long", () => {
    expect(valider({ nom: "A" }).motif.champ).toBe("nom");
    expect(valider({ nom: "x".repeat(81) }).motif.champ).toBe("nom");
  });

  it("refuse une adresse mal formée", () => {
    expect(valider({ email: "camille@exemple" }).motif.champ).toBe("email");
    expect(valider({ email: "camille exemple.fr" }).motif.champ).toBe("email");
    expect(valider({ email: "" }).motif.champ).toBe("email");
  });

  it("refuse un message au-delà du plafond", () => {
    expect(valider({ message: "x".repeat(LONGUEUR_MESSAGE_MAX + 1) }).motif.champ).toBe(
      "message",
    );
    expect(valider({ message: "x".repeat(LONGUEUR_MESSAGE_MAX) }).ok).toBe(true);
  });

  it("retire les caractères de contrôle d’un nom", () => {
    // `\r` dans une valeur qui repart dans un e-mail est une injection
    // d'en-tête. Le nettoyage vient de `contact/validation`, réutilisé tel quel.
    const resultat = valider({ nom: "Camille\r\nBcc: pirate@exemple.fr" });
    expect(resultat.reservation.nom).not.toContain("\n");
  });
});

describe("validerReservation — anti-robot", () => {
  it("refuse un piège rempli, AVANT toute autre vérification", () => {
    const resultat = validerReservation(
      { referenceInterne: "https://spam.example" },
      { typesAutorises: TYPES, maintenantMs: MAINTENANT },
    );
    expect(resultat.motif).toEqual({ type: "piege_rempli" });
  });

  it("refuse un formulaire rempli trop vite", () => {
    expect(valider({ debutMs: MAINTENANT - 100 }).motif).toEqual({
      type: "trop_rapide",
    });
  });

  it("refuse un horodatage absent, futur ou trop vieux", () => {
    expect(valider({ debutMs: undefined }).motif.type).toBe("horodatage_invalide");
    expect(valider({ debutMs: MAINTENANT + 5000 }).motif.type).toBe(
      "horodatage_invalide",
    );
    expect(valider({ debutMs: MAINTENANT - 13 * 3600 * 1000 }).motif.type).toBe(
      "horodatage_invalide",
    );
  });

  it("refuse un corps qui n’est pas un objet", () => {
    const options = { typesAutorises: TYPES, maintenantMs: MAINTENANT };
    expect(validerReservation(null, options).motif.type).toBe("corps_illisible");
    expect(validerReservation([], options).motif.type).toBe("corps_illisible");
    expect(validerReservation("nom=x", options).motif.type).toBe("corps_illisible");
  });
});
