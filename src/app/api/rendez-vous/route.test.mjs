import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { rendezVousContent } from "@/content/rendez-vous";
import { POST } from "./route.ts";

/**
 * LA ROUTE DE RÉSERVATION, VUE DU NAVIGATEUR, pour chaque sujet proposé
 * (logiciel, site, ia, decouverte, demonstration, point-d-etape). Rien ne part au cockpit : sans clef Turnstile, une
 * demande valide s'arrête au captcha en 503, APRÈS la validation. Un 503 prouve
 * donc que la demande a passé la validation ; un 400 dit quel champ l'a
 * arrêtée.
 */

const VARIABLES = {
  RDV_TOKEN: "jeton-de-test",
  COCKPIT_URL: "https://cockpit.test",
  TURNSTILE_SECRET_KEY: "",
};
const avant = {};

beforeAll(() => {
  for (const [clef, valeur] of Object.entries(VARIABLES)) {
    avant[clef] = process.env[clef];
    process.env[clef] = valeur;
  }
});

afterAll(() => {
  for (const [clef, valeur] of Object.entries(avant)) {
    if (valeur === undefined) delete process.env[clef];
    else process.env[clef] = valeur;
  }
});

let appelant = 0;

function reserver(corps) {
  appelant += 1;
  const maintenant = Date.now();
  return POST(
    new Request("https://eliottbouquerel.fr/api/rendez-vous", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Une adresse par requête : le débit autorise trois réservations par quart d'heure.
        "x-forwarded-for": `203.0.113.${appelant}`,
      },
      body: JSON.stringify({
        debut: new Date(maintenant + 3 * 24 * 3600 * 1000).toISOString(),
        nom: "Camille Renard",
        email: "camille@exemple.fr",
        telephone: "06 12 34 56 78",
        debutMs: maintenant - 10_000,
        ...corps,
      }),
    }),
  );
}

describe("POST /api/rendez-vous : les sujets", () => {
  it.each(["logiciel", "site", "ia", "decouverte", "point-rapide", "demonstration", "proposition", "point-d-etape"])(
    "« %s » passe la validation sans autre champ que les coordonnées",
    async (type) => {
      const reponse = await reserver({ type });
      expect(reponse.status).toBe(503);
    },
  );

  it.each(["point-rapide", "demonstration", "proposition", "point-d-etape"])(
    "un client réserve « %s » sans téléphone",
    async (type) => {
      const reponse = await reserver({ type, telephone: "" });
      expect(reponse.status).toBe(503);
    },
  );

  it("garde la ligne libre facultative", async () => {
    const reponse = await reserver({ type: "site", message: "Refaire notre site vitrine." });
    expect(reponse.status).toBe(503);
  });

  it.each(["outil", "cto", "autre"])("traduit l'ancien sujet « %s » d'un onglet resté ouvert", async (type) => {
    const reponse = await reserver({ type });
    expect(reponse.status).toBe(503);
  });

  it("ignore sans erreur les champs de l'ancien questionnaire", async () => {
    const reponse = await reserver({
      type: "logiciel",
      budget: "n-importe-quoi",
      objectif: "inconnu",
      echeance: "demain",
      entreprise: "Transports Martin",
      activite: "Transport frigorifique",
      taille: "1000",
      decision: "personne",
      coince: "x",
      cout: "beaucoup",
      essaye: "rien",
      outil: "crm",
    });
    expect(reponse.status).toBe(503);
  });
});

describe("POST /api/rendez-vous : chaque refus nomme son champ", () => {
  const valide = { type: "logiciel" };
  const loin = new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString();

  it.each([
    ["nom", { nom: "A" }],
    ["email", { email: "a".repeat(300) }],
    ["email", { email: "pas-une-adresse" }],
    ["message", { message: "x".repeat(5_000) }],
    ["creneau", { debut: loin }],
    ["duree", { duree: 0.5 }],
    ["type", { type: "inconnu" }],
    ["telephone", { telephone: "abc" }],
    ["telephone", { telephone: "" }],
    ["telephone", { type: "site", telephone: "" }],
    ["telephone", { type: "point-d-etape", telephone: "abc" }],
  ])("%s", async (champ, surcharge) => {
    const reponse = await reserver({ ...valide, ...surcharge });
    expect(reponse.status).toBe(400);
    const corps = await reponse.json();
    expect(corps.champ).toBe(champ);
    expect(corps.message.length).toBeGreaterThan(0);
  });
});

describe("POST /api/rendez-vous : sans RDV_TOKEN", () => {
  it("répond 503 et renvoie vers l’e-mail, sans rien réserver", async () => {
    process.env.RDV_TOKEN = "";
    try {
      const reponse = await reserver({ type: "logiciel" });
      expect(reponse.status).toBe(503);
      expect((await reponse.json()).message).toBe(
        "La prise de rendez-vous en ligne est momentanément indisponible. Écrivez-moi directement à contact@eliottbouquerel.fr.",
      );
    } finally {
      process.env.RDV_TOKEN = VARIABLES.RDV_TOKEN;
    }
  });
});

describe("POST /api/rendez-vous : téléphone obligatoire", () => {
  const valide = { type: "logiciel" };

  it("passe la validation avec un numéro", async () => {
    const reponse = await reserver({ ...valide, telephone: "+33 6 32 21 37 11" });
    expect(reponse.status).toBe(503);
  });

  it("refuse un numéro trop court avec son message", async () => {
    const reponse = await reserver({ ...valide, telephone: "06 32" });
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      message: "Ce numéro de téléphone ne semble pas valide.",
      champ: "telephone",
    });
  });

  it("un numéro manquant demande la réponse, sans parler de format", async () => {
    const reponse = await reserver({ ...valide, telephone: "" });
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      message: rendezVousContent.formulaire.telephoneErreur,
      champ: "telephone",
    });
  });
});
