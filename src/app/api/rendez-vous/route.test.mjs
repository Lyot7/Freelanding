import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { prestation } from "../../../content/offre.ts";
import { POST } from "./route.ts";

/**
 * LA ROUTE DE RÉSERVATION, VUE DU NAVIGATEUR, pour les deux sujets qui restent
 * depuis le 2026-10-31 : « logiciel » et « decouverte ». Rien ne part chez Cal.com : sans clef Turnstile, une
 * demande valide s'arrête au captcha en 503, APRÈS la validation. Un 503 prouve
 * donc que la demande a passé la validation ; un 400 dit quel champ l'a
 * arrêtée.
 */

const VARIABLES = {
  CAL_COM_USERNAME: "eliott-bouquerel",
  CAL_COM_EVENT_LOGICIEL: "7514252",
  CAL_COM_EVENT_DECOUVERTE: "7514277",
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
        debutMs: maintenant - 10_000,
        ...corps,
      }),
    }),
  );
}

const PLANCHER = prestation("logiciel").plancher;
const tranche = `${PLANCHER}-${PLANCHER * 2}`;

describe("POST /api/rendez-vous — sujet « decouverte »", () => {
  it("passe la validation avec le budget, le besoin et l'échéance", async () => {
    const reponse = await reserver({
      type: "decouverte",
      budget: tranche,
      objectif: "conseil",
      echeance: "vite",
    });
    expect(reponse.status).toBe(503);
  });

  it("exige le budget : plus aucun sujet n'en est dispensé", async () => {
    const reponse = await reserver({ type: "decouverte", objectif: "conseil" });
    expect(reponse.status).toBe(400);
    expect((await reponse.json()).champ).toBe("budget");
  });

  it("refuse un besoin hors de sa liste, en nommant le champ", async () => {
    const reponse = await reserver({ type: "decouverte", budget: tranche, objectif: "tableur" });
    expect(reponse.status).toBe(400);
    expect((await reponse.json()).champ).toBe("objectif");
  });
});

describe("POST /api/rendez-vous — sujet « logiciel »", () => {
  it("passe la validation avec la tâche et une tranche de son plancher", async () => {
    const reponse = await reserver({ type: "logiciel", budget: tranche, objectif: "tableur" });
    expect(reponse.status).toBe(503);
  });

  it("ne demande plus d'outil, et ignore un outil envoyé par un ancien onglet", async () => {
    const reponse = await reserver({
      type: "logiciel",
      budget: tranche,
      objectif: "tache",
      outil: "crm",
    });
    expect(reponse.status).toBe(503);
  });

  it("refuse une tâche hors de sa liste avec le message commun", async () => {
    const reponse = await reserver({ type: "logiciel", budget: tranche, objectif: "conseil" });
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      message: "Choisissez la réponse la plus proche de votre cas.",
      champ: "objectif",
    });
  });
});

describe("POST /api/rendez-vous — chaque refus nomme son champ", () => {
  const valide = { type: "logiciel", budget: tranche, objectif: "tache" };
  const loin = new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString();

  it.each([
    ["nom", { nom: "A" }],
    ["email", { email: "a".repeat(300) }],
    ["email", { email: "pas-une-adresse" }],
    ["message", { message: "x".repeat(5_000) }],
    ["creneau", { debut: loin }],
    ["duree", { duree: 0.5 }],
    ["type", { type: "inconnu" }],
    ["budget", { budget: "" }],
    ["echeance", { echeance: "demain" }],
  ])("%s", async (champ, surcharge) => {
    const reponse = await reserver({ ...valide, ...surcharge });
    expect(reponse.status).toBe(400);
    const corps = await reponse.json();
    expect(corps.champ).toBe(champ);
    expect(corps.message.length).toBeGreaterThan(0);
  });
});
