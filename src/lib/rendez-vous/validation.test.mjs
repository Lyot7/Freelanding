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
const TYPES = ["logiciel", "decouverte", "demonstration", "point-d-etape"];

function valider(surcharge = {}) {
  return validerReservation(
    {
      type: "logiciel",
      debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
      nom: "Camille Renard",
      email: "camille@exemple.fr",
      telephone: "06 32 21 37 11",
      budget: "5000-10000",
      objectif: "tableur",
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
    const resultat = validerReservation(
      {
        type: "logiciel",
        debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
        nom: "Camille Renard",
        email: "camille@exemple.fr",
        budget: "5000-10000",
        objectif: "tableur",
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

  it("traduit le sujet retiré d'un onglet resté ouvert, sans perdre le rendez-vous", () => {
    const attendus = { site: "decouverte", cto: "decouverte", ia: "logiciel", outil: "logiciel" };
    for (const [type, traduit] of Object.entries(attendus)) {
      const resultat = valider({ type, objectif: "google" });
      expect(resultat.ok, type).toBe(true);
      expect(resultat.reservation.type).toBe(traduit);
      expect(resultat.reservation.objectif).toBe("autre");
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

describe("validerReservation — le questionnaire", () => {
  it("garde les trois réponses, échéance comprise", () => {
    const resultat = valider({ echeance: "trimestre" });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.budget).toBe("5000-10000");
    expect(resultat.reservation.objectif).toBe("tableur");
    expect(resultat.reservation.echeance).toBe("trimestre");
  });

  it("accepte une échéance absente, et la laisse absente", () => {
    expect(valider({ echeance: "" }).reservation.echeance).toBeUndefined();
    expect(valider().reservation.echeance).toBeUndefined();
  });

  it("exige le budget et l’objectif", () => {
    expect(valider({ budget: "" }).motif).toEqual({
      type: "champ_invalide",
      champ: "budget",
      raison: "requis",
    });
    expect(valider({ objectif: undefined }).motif).toEqual({
      type: "champ_invalide",
      champ: "objectif",
      raison: "requis",
    });
  });

  it("rattache une tranche retirée à la tranche actuelle", () => {
    expect(valider({ budget: "4800-7200" }).reservation.budget).toBe("moins-5000");
    expect(valider({ budget: "3000-6000" }).reservation.budget).toBe("moins-5000");
    expect(valider({ budget: "moins-6000" }).reservation.budget).toBe("moins-5000");
    expect(valider({ budget: "plus-7200" }).reservation.budget).toBe("5000-10000");
    expect(valider({ budget: "6000-12000" }).reservation.budget).toBe("5000-10000");
    expect(valider({ budget: "7000-14000" }).reservation.budget).toBe("5000-10000");
    expect(valider({ budget: "plus-14000" }).reservation.budget).toBe("10000-25000");
  });

  it("accepte « je ne sais pas encore » comme budget", () => {
    expect(valider({ budget: "inconnu" }).ok).toBe(true);
  });

  it("exige le budget pour chaque sujet de prospect, la découverte comprise", () => {
    // Démonstration et point d'étape n'ont pas de budget (2026-11-02) : testés à part.
    for (const type of ["logiciel", "decouverte"]) {
      expect(valider({ type, budget: "" }).motif).toEqual({
        type: "champ_invalide",
        champ: "budget",
        raison: "requis",
      });
    }
  });

  it("refuse une réponse hors de la liste du type choisi", () => {
    // Une tranche qui n'est ni actuelle ni une ancienne tranche rattachée.
    expect(valider({ budget: "3500-9000" }).motif).toEqual({
      type: "champ_invalide",
      champ: "budget",
      raison: "hors_liste",
    });
    // `conseil` est un objectif de la « decouverte », pas du « logiciel ».
    expect(valider({ objectif: "conseil" }).motif.champ).toBe("objectif");
    expect(valider({ objectif: "inconnu" }).motif.champ).toBe("objectif");
    expect(valider({ echeance: "demain" }).motif.champ).toBe("echeance");
    expect(valider({ budget: 3000 }).motif.raison).toBe("requis");
  });

  it("accepte une tranche actuelle sur le sujet « decouverte »", () => {
    const resultat = valider({
      type: "decouverte",
      budget: "10000-25000",
      objectif: "conseil",
    });
    expect(resultat.ok).toBe(true);
  });

  it("n'accepte plus de question d'outil : une réponse envoyée n'atteint jamais la réservation", () => {
    const resultat = valider({ outil: "crm" });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation).not.toHaveProperty("outil");
  });
});

describe("validerReservation — la durée", () => {
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

describe("validerReservation — téléphone obligatoire", () => {
  it("refuse un numéro absent, vide ou fait d'espaces, quel que soit le sujet", () => {
    for (const type of TYPES) {
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

describe("validerReservation — démonstration et point d'étape", () => {
  it("la démonstration passe sans budget, et ignore budget et échéance envoyés", () => {
    const resultat = valider({
      type: "demonstration",
      objectif: "logiciel",
      budget: "n-importe-quoi",
      echeance: "jamais",
      projet: "ignoré",
    });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation).toMatchObject({ type: "demonstration", objectif: "logiciel" });
    expect(resultat.reservation).not.toHaveProperty("budget");
    expect(resultat.reservation).not.toHaveProperty("echeance");
    expect(resultat.reservation).not.toHaveProperty("projet");
  });

  it("la démonstration exige encore ce qu'on veut voir, dans sa liste", () => {
    expect(valider({ type: "demonstration", objectif: "tableur" })).toEqual({
      ok: false,
      motif: { type: "champ_invalide", champ: "objectif", raison: "hors_liste" },
    });
  });

  it("le point d'étape garde le projet, ramené sur une ligne", () => {
    const resultat = valider({
      type: "point-d-etape",
      objectif: "priorites",
      budget: undefined,
      projet: "  Cockpit\n module   agenda ",
    });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation).toMatchObject({
      type: "point-d-etape",
      projet: "Cockpit module agenda",
      objectif: "priorites",
    });
    expect(resultat.reservation).not.toHaveProperty("budget");
  });

  it("le point d'étape refuse un projet vide ou trop long", () => {
    expect(valider({ type: "point-d-etape", objectif: "priorites", projet: "   " })).toEqual({
      ok: false,
      motif: { type: "champ_invalide", champ: "projet", raison: "requis" },
    });
    expect(
      valider({ type: "point-d-etape", objectif: "priorites", projet: "x".repeat(121) }),
    ).toEqual({
      ok: false,
      motif: { type: "champ_invalide", champ: "projet", raison: "longueur" },
    });
  });

  it("refuse le point d'étape quand il n'est pas configuré", () => {
    const resultat = validerReservation(
      {
        type: "point-d-etape",
        debut: new Date(MAINTENANT + 48 * 3600 * 1000).toISOString(),
        nom: "Camille Renard",
        email: "camille@exemple.fr",
        objectif: "priorites",
        projet: "Cockpit",
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

describe("validerReservation — le cadrage, posé avant le créneau", () => {
  const CADRAGE = {
    telephone: "06 12 34 56 78",
    echeance: "trimestre",
    entreprise: "Transports Martin",
    activite: "Transport frigorifique",
    taille: "6-20",
    decision: "plusieurs",
    coince: "On ressaisit chaque commande dans trois fichiers.",
    cout: "2-5h",
    essaye: "tableur",
  };

  it("garde les sept réponses du cadrage", () => {
    const resultat = valider(CADRAGE);
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation).toMatchObject({
      entreprise: "Transports Martin",
      activite: "Transport frigorifique",
      taille: "6-20",
      decision: "plusieurs",
      coince: "On ressaisit chaque commande dans trois fichiers.",
      cout: "2-5h",
      essaye: "tableur",
      telephone: "06 12 34 56 78",
      echeance: "trimestre",
    });
  });

  it("exige chaque réponse, téléphone et échéance compris, en nommant le champ", () => {
    for (const champ of ["entreprise", "activite", "taille", "decision", "cout", "essaye", "telephone", "echeance"]) {
      const resultat = valider({ ...CADRAGE, [champ]: "" });
      expect(resultat.ok, champ).toBe(false);
      expect(resultat.motif.champ).toBe(champ);
    }
  });

  it("refuse un « ce qui coince » d'un mot, et une réponse hors liste", () => {
    expect(valider({ ...CADRAGE, coince: "tout" }).motif).toEqual({
      type: "champ_invalide",
      champ: "coince",
      raison: "longueur",
    });
    expect(valider({ ...CADRAGE, taille: "1000" }).motif.raison).toBe("hors_liste");
  });

  it("laisse passer un onglet ouvert avant le cadrage, qui n'en envoie rien", () => {
    const resultat = valider({});
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.entreprise).toBeUndefined();
  });

  it("ne pose pas le cadrage à un point d'étape, quoi que le client envoie", () => {
    const resultat = valider({
      type: "point-d-etape",
      budget: undefined,
      objectif: "priorites",
      projet: "Cockpit",
      coince: "x",
    });
    expect(resultat.ok).toBe(true);
    expect(resultat.reservation.coince).toBeUndefined();
  });
});
