import { describe, expect, it } from "bun:test";
import {
  DELAI_MAXIMAL_MS,
  DELAI_MINIMAL_MS,
  LIMITES,
  validerSoumission,
} from "./validation.ts";

/**
 * La validation est la seule barrière réelle : la validation HTML du navigateur
 * se contourne avec un `curl`. Une régression ici est SILENCIEUSE — le
 * formulaire continue de dire « envoyé » —, d'où ces tests.
 */

const TYPES = [
  "Un site et de la visibilité locale",
  "Un outil métier sur mesure",
  "Je ne sais pas encore",
];

const MAINTENANT = 1_700_000_000_000;
const DEBUT_HUMAIN = MAINTENANT - 10_000;

function valider(corps) {
  return validerSoumission(corps, {
    typesProjetAutorises: TYPES,
    maintenantMs: MAINTENANT,
  });
}

function soumissionProjet(surcharge = {}) {
  return {
    intention: "projet",
    nom: "Jean Dupont",
    email: "jean@example.com",
    typeProjet: TYPES[0],
    message: "Bonjour, je cherche un site pour mon atelier de menuiserie.",
    debutMs: DEBUT_HUMAIN,
    ...surcharge,
  };
}

describe("validerSoumission — cas nominal", () => {
  it("accepte une demande complète et la renvoie normalisée", () => {
    const resultat = valider(soumissionProjet());
    expect(resultat.ok).toBe(true);
    expect(resultat.soumission).toEqual({
      intention: "projet",
      nom: "Jean Dupont",
      email: "jean@example.com",
      typeProjet: TYPES[0],
      message: "Bonjour, je cherche un site pour mon atelier de menuiserie.",
    });
  });

  it("accepte le pied de page sans message", () => {
    const resultat = valider({
      intention: "footer",
      nom: "Alex Martin",
      email: "alex@example.fr",
      typeProjet: TYPES[1],
      debutMs: DEBUT_HUMAIN,
    });
    expect(resultat.ok).toBe(true);
    expect(resultat.soumission.message).toBeUndefined();
  });

  it("accepte la newsletter avec la seule adresse", () => {
    const resultat = valider({
      intention: "newsletter",
      email: "lecteur@example.org",
      debutMs: DEBUT_HUMAIN,
    });
    expect(resultat.ok).toBe(true);
    expect(resultat.soumission).toEqual({
      intention: "newsletter",
      email: "lecteur@example.org",
    });
  });

  it("accepte une demande de contact sans message (le champ est facultatif)", () => {
    const resultat = valider(soumissionProjet({ message: "" }));
    expect(resultat.ok).toBe(true);
    expect(resultat.soumission.message).toBeUndefined();
  });
});

describe("validerSoumission — piège à robots", () => {
  it("rejette dès que le champ piège porte une valeur", () => {
    const resultat = valider(soumissionProjet({ referenceInterne: "https://spam.example" }));
    expect(resultat.ok).toBe(false);
    expect(resultat.motif.type).toBe("piege_rempli");
  });

  it("laisse passer un piège vide ou fait d'espaces", () => {
    expect(valider(soumissionProjet({ referenceInterne: "" })).ok).toBe(true);
    expect(valider(soumissionProjet({ referenceInterne: "   " })).ok).toBe(true);
  });

  it("rejette le piège AVANT toute autre vérification", () => {
    // Corps par ailleurs invalide de partout : le motif doit rester le piège,
    // sinon la réponse renseignerait le robot sur le contrôle qui l'a arrêté.
    const resultat = valider({
      intention: "projet",
      referenceInterne: "x",
      email: "pas-une-adresse",
      debutMs: MAINTENANT,
    });
    expect(resultat.motif.type).toBe("piege_rempli");
  });
});

describe("validerSoumission — temps de remplissage", () => {
  it("rejette une soumission instantanée", () => {
    const resultat = valider(soumissionProjet({ debutMs: MAINTENANT - 200 }));
    expect(resultat.ok).toBe(false);
    expect(resultat.motif.type).toBe("trop_rapide");
  });

  it("rejette juste sous le seuil et accepte juste au-dessus", () => {
    expect(valider(soumissionProjet({ debutMs: MAINTENANT - DELAI_MINIMAL_MS + 1 })).ok).toBe(false);
    expect(valider(soumissionProjet({ debutMs: MAINTENANT - DELAI_MINIMAL_MS })).ok).toBe(true);
  });

  it("rejette un horodatage dans le futur ou trop ancien", () => {
    expect(valider(soumissionProjet({ debutMs: MAINTENANT + 5_000 })).motif.type).toBe(
      "horodatage_invalide",
    );
    expect(
      valider(soumissionProjet({ debutMs: MAINTENANT - DELAI_MAXIMAL_MS - 1 })).motif.type,
    ).toBe("horodatage_invalide");
  });

  it("rejette un horodatage absent ou non numérique", () => {
    expect(valider(soumissionProjet({ debutMs: undefined })).motif.type).toBe(
      "horodatage_invalide",
    );
    expect(valider(soumissionProjet({ debutMs: "1700000000000" })).motif.type).toBe(
      "horodatage_invalide",
    );
    expect(valider(soumissionProjet({ debutMs: Number.NaN })).motif.type).toBe(
      "horodatage_invalide",
    );
  });
});

describe("validerSoumission — champs", () => {
  it("rejette un corps qui n'est pas un objet", () => {
    for (const corps of [null, "texte", 42, [], undefined]) {
      expect(valider(corps).motif.type).toBe("corps_illisible");
    }
  });

  it("rejette une intention absente ou inventée", () => {
    expect(valider(soumissionProjet({ intention: undefined })).motif.type).toBe(
      "intention_inconnue",
    );
    expect(valider(soumissionProjet({ intention: "facture" })).motif.type).toBe(
      "intention_inconnue",
    );
  });

  it("rejette les adresses e-mail malformées", () => {
    const mauvaises = [
      "",
      "jean",
      "jean@",
      "@example.com",
      "jean@example",
      "jean dupont@example.com",
      "jean@exa mple.com",
      "<jean@example.com>",
      `${"a".repeat(250)}@example.com`,
    ];
    for (const email of mauvaises) {
      const resultat = valider(soumissionProjet({ email }));
      expect(resultat.ok).toBe(false);
      expect(resultat.motif.champ).toBe("email");
    }
  });

  it("accepte les adresses e-mail courantes", () => {
    for (const email of [
      "jean.dupont@example.fr",
      "jean+devis@example.co.uk",
      "j_d-1@sous.domaine.example.com",
    ]) {
      expect(valider(soumissionProjet({ email })).ok).toBe(true);
    }
  });

  it("rejette un type de projet hors de la liste affichée", () => {
    const resultat = valider(soumissionProjet({ typeProjet: "Refaire ma cuisine" }));
    expect(resultat.ok).toBe(false);
    expect(resultat.motif.champ).toBe("typeProjet");
  });

  it("rejette un nom trop court ou trop long", () => {
    expect(valider(soumissionProjet({ nom: "J" })).motif.champ).toBe("nom");
    expect(
      valider(soumissionProjet({ nom: "a".repeat(LIMITES.nom.max + 1) })).motif.champ,
    ).toBe("nom");
  });

  it("rejette un message trop court ou trop long", () => {
    expect(valider(soumissionProjet({ message: "salut" })).motif.champ).toBe("message");
    expect(
      valider(soumissionProjet({ message: "a".repeat(LIMITES.message.max + 1) })).motif
        .champ,
    ).toBe("message");
  });
});

describe("validerSoumission — normalisation", () => {
  it("retire les caractères de contrôle et les retours chariot des champs d'en-tête", () => {
    const resultat = valider(
      soumissionProjet({
        nom: "  Jean\r\nBcc: victime@example.com  ",
        email: "  jean@example.com\r\n ",
      }),
    );
    expect(resultat.ok).toBe(true);
    expect(resultat.soumission.nom).toBe("Jean Bcc: victime@example.com");
    expect(resultat.soumission.email).toBe("jean@example.com");
    expect(resultat.soumission.nom).not.toContain("\n");
    expect(resultat.soumission.nom).not.toContain("\r");
  });

  it("conserve les sauts de ligne du message mais retire les caractères de contrôle", () => {
    const resultat = valider(
      soumissionProjet({ message: "Ligne un\r\nLigne\u0007 deux et la fin." }),
    );
    expect(resultat.soumission.message).toBe("Ligne un\nLigne deux et la fin.");
    expect(resultat.soumission.message).not.toContain("\r");
  });

  it("ignore les champs supplémentaires envoyés par un client bavard", () => {
    const resultat = valider(soumissionProjet({ role: "admin", montant: 0 }));
    expect(resultat.ok).toBe(true);
    expect(Object.keys(resultat.soumission).sort()).toEqual([
      "email",
      "intention",
      "message",
      "nom",
      "typeProjet",
    ]);
  });
});
