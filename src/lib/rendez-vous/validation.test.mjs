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
const TYPES = ["logiciel", "site", "ia", "decouverte", "point-rapide", "demonstration", "proposition", "point-d-etape"];
const PREMIER_RDV = ["logiciel", "site", "ia", "decouverte"];
const CLIENTS = ["point-rapide", "demonstration", "proposition", "point-d-etape"];

function valider(surcharge = {}) {
  return validerReservation(
    {
      type: "logiciel",
      debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
      nom: "Camille Renard",
      email: "camille@exemple.fr",
      telephone: "06 32 21 37 11",
      debutMs: DEBUT_HUMAIN,
      ...surcharge,
    },
    { typesAutorises: TYPES, maintenantMs: MAINTENANT },
  );
}

describe("validerReservation : chemin nominal", () => {
  it("accepte une demande complète et la normalise", () => {
    const resultat = valider({ nom: "  Camille   Renard  " });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.nom).toBe("Camille Renard");
    expect(resultat.reservation.type).toBe("logiciel");
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
    expect(valider({ message: "Sortir du tableur." }).reservation.message).toBe(
      "Sortir du tableur.",
    );
  });
});

describe("validerReservation : le type", () => {
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
    const resultat = validerReservation(
      {
        type: "logiciel",
        debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
        nom: "Camille Renard",
        email: "camille@exemple.fr",
        telephone: "06 32 21 37 11",
        debutMs: DEBUT_HUMAIN,
      },
      { typesAutorises: ["decouverte"], maintenantMs: MAINTENANT },
    );
    expect(resultat.ok).toBe(false);
    expect(resultat.motif).toEqual({
      type: "champ_invalide",
      champ: "type",
      raison: "hors_liste",
    });
  });

  it("accepte chaque sujet proposé, site et ia compris, sans les traduire", () => {
    for (const type of ["logiciel", "site", "ia", "decouverte", "demonstration"]) {
      const resultat = valider({ type });
      expect(resultat.ok, type).toBe(true);
      expect(resultat.reservation.type).toBe(type);
    }
  });

  it("traduit le sujet retiré d'un onglet resté ouvert, sans perdre le rendez-vous", () => {
    const attendus = { cto: "decouverte", autre: "decouverte", outil: "logiciel" };
    for (const [type, traduit] of Object.entries(attendus)) {
      const resultat = valider({ type });
      expect(resultat.ok, type).toBe(true);
      expect(resultat.reservation.type).toBe(traduit);
    }
  });

  it("refuse site ou ia quand ils ne sont pas configurés", () => {
    for (const type of ["site", "ia"]) {
      const resultat = validerReservation(
        {
          type,
          debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
          nom: "Camille Renard",
          email: "camille@exemple.fr",
          telephone: "06 32 21 37 11",
          debutMs: DEBUT_HUMAIN,
        },
        { typesAutorises: ["logiciel"], maintenantMs: MAINTENANT },
      );
      expect(resultat.motif, type).toEqual({
        type: "champ_invalide",
        champ: "type",
        raison: "hors_liste",
      });
    }
  });

  it("refuse un type inconnu", () => {
    expect(valider({ type: "inconnu" }).motif).toEqual({
      type: "champ_invalide",
      champ: "type",
      raison: "hors_liste",
    });
  });
});

describe("validerReservation : le créneau", () => {
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

describe("validerReservation : identité", () => {
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

describe("validerReservation : anti-robot", () => {
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

describe("validerReservation : la durée", () => {
  it("garde une durée plausible et la laisse absente sinon", () => {
    expect(valider({ duree: 45 }).reservation.duree).toBe(45);
    expect(valider().reservation.duree).toBeUndefined();
    expect(valider({ duree: null }).reservation.duree).toBeUndefined();
  });

  it("refuse une durée qui n'est pas un entier de minutes raisonnable", () => {
    for (const duree of ["45", 2.5, 0, 10_000]) {
      const resultat = valider({ duree });
      expect(resultat.ok).toBe(false);
      expect(resultat.motif.champ).toBe("duree");
    }
  });
});

describe("validerReservation : téléphone", () => {
  it("un client en cours (`/rdv/client`) peut ne pas en donner, et rien n'est gardé", () => {
    for (const type of CLIENTS) {
      for (const telephone of [undefined, "", "  "]) {
        const resultat = valider({ type, telephone });
        expect(resultat.ok, type).toBe(true);
        expect(resultat.reservation, type).not.toHaveProperty("telephone");
      }
    }
  });

  it("un client qui le donne le garde, et un numéro faux reste refusé", () => {
    expect(valider({ type: "proposition", telephone: "06 32 21 37 11" }).reservation.telephone).toBe("06 32 21 37 11");
    expect(valider({ type: "proposition", telephone: "abc" }).ok).toBe(false);
  });

  it("refuse un numéro absent, vide ou fait d'espaces au premier rendez-vous, quel que soit le sujet", () => {
    for (const type of PREMIER_RDV) {
      for (const telephone of [undefined, "", "  "]) {
        const resultat = valider({ type, telephone });
        expect(resultat.ok).toBe(false);
        expect(resultat.motif).toEqual({ type: "champ_invalide", champ: "telephone", raison: "requis" });
      }
    }
  });

  it("accepte un numéro français", () => {
    const resultat = valider({ telephone: " 06 32 21 37 11 " });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.telephone).toBe("06 32 21 37 11");
  });

  it("accepte un numéro international", () => {
    const resultat = valider({ telephone: "+33 6 32 21 37 11" });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.telephone).toBe("+33 6 32 21 37 11");
  });

  it("refuse des lettres", () => {
    const resultat = valider({ telephone: "abc" });
    expect(resultat.ok).toBe(false);
    expect(resultat.motif).toEqual({ type: "champ_invalide", champ: "telephone", raison: "format" });
  });

  it("refuse un numéro trop court", () => {
    const resultat = valider({ telephone: "12345" });
    expect(resultat.ok).toBe(false);
    expect(resultat.motif).toEqual({ type: "champ_invalide", champ: "telephone", raison: "longueur" });
  });
});

describe("validerReservation : rendez-vous de clients", () => {
  it("les quatre sujets passent avec nom, e-mail et créneau seulement", () => {
    for (const type of CLIENTS) {
      const resultat = valider({ type, telephone: undefined });
      expect(resultat.ok, type).toBe(true);
      expect(resultat.reservation.type).toBe(type);
    }
  });

  it("ne demande plus le projet, et n'en garde aucun", () => {
    for (const type of TYPES) {
      const resultat = valider({ type, projet: "Cockpit" });
      expect(resultat.ok, type).toBe(true);
      expect(resultat.reservation, type).not.toHaveProperty("projet");
    }
  });

  it("refuse le point d'étape quand il n'est pas configuré", () => {
    const resultat = validerReservation(
      {
        type: "point-d-etape",
        debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
        nom: "Camille Renard",
        email: "camille@exemple.fr",
        telephone: "06 32 21 37 11",
        debutMs: DEBUT_HUMAIN,
      },
      { typesAutorises: ["logiciel", "decouverte"], maintenantMs: MAINTENANT },
    );
    expect(resultat).toEqual({
      ok: false,
      motif: { type: "champ_invalide", champ: "type", raison: "hors_liste" },
    });
  });
});

describe("validerReservation : plus de questionnaire", () => {
  const ANCIEN_QUESTIONNAIRE = {
    budget: "5000-10000",
    objectif: "tableur",
    echeance: "trimestre",
    entreprise: "Transports Martin",
    activite: "Transport frigorifique",
    taille: "6-20",
    decision: "plusieurs",
    coince: "On ressaisit chaque commande dans trois fichiers.",
    cout: "2-5h",
    essaye: "tableur",
    outil: "crm",
  };

  it("ignore sans erreur les réponses d'un onglet resté ouvert sur l'ancien formulaire", () => {
    for (const type of TYPES) {
      const resultat = valider({ type, projet: "Cockpit", ...ANCIEN_QUESTIONNAIRE });
      expect(resultat.ok, type).toBe(true);
      for (const champ of Object.keys(ANCIEN_QUESTIONNAIRE)) {
        expect(resultat.reservation, `${type} ${champ}`).not.toHaveProperty(champ);
      }
    }
  });

  it("ignore même une valeur absurde dans un champ d'ancien questionnaire", () => {
    const resultat = valider({ budget: 3000, objectif: { x: 1 }, taille: "1000", coince: "tout" });
    expect(resultat.ok).toBe(true);
  });

  it("ne garde que les champs de la réservation", () => {
    const resultat = valider({ message: "Sortir du tableur." });
    expect(Object.keys(resultat.reservation).sort()).toEqual([
      "debutUtc",
      "email",
      "message",
      "nom",
      "telephone",
      "type",
    ]);
  });
});
