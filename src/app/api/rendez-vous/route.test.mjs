import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { integrationIA } from "../../../content/offre.ts";
import { POST } from "./route.ts";

/**
 * LA ROUTE DE RÉSERVATION, VUE DU NAVIGATEUR, pour les sujets « ia » et
 * « cto » du 2026-10-16. Rien ne part chez Cal.com : sans clef Turnstile, une
 * demande valide s'arrête au captcha en 503, APRÈS la validation. Un 503 prouve
 * donc que la demande a passé la validation ; un 400 dit quel champ l'a
 * arrêtée.
 */

const VARIABLES = {
  CAL_COM_USERNAME: "eliott-bouquerel",
  CAL_COM_EVENT_IA: "7514252",
  CAL_COM_EVENT_CTO: "7514277",
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

describe("POST /api/rendez-vous — sujet « cto »", () => {
  it("passe la validation sans budget, avec le besoin et l'échéance", async () => {
    const reponse = await reserver({ type: "cto", objectif: "devis", echeance: "vite" });
    expect(reponse.status).toBe(503);
  });

  it("refuse un besoin hors de sa liste, en nommant le champ", async () => {
    const reponse = await reserver({ type: "cto", objectif: "google" });
    expect(reponse.status).toBe(400);
    expect((await reponse.json()).champ).toBe("objectif");
  });
});

describe("POST /api/rendez-vous — sujet « ia »", () => {
  const tranche = `${integrationIA.plancher}-${integrationIA.plancher * 2}`;

  it("exige l'outil, et le dit au visiteur", async () => {
    const reponse = await reserver({ type: "ia", budget: tranche, objectif: "mails" });
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      message: "Choisissez l’outil où se fait cette tâche.",
      champ: "outil",
    });
  });

  it("passe la validation avec la tâche, l'outil et une tranche de son plancher", async () => {
    const reponse = await reserver({
      type: "ia",
      budget: tranche,
      objectif: "saisie",
      outil: "tableur",
    });
    expect(reponse.status).toBe(503);
  });

  it("refuse une tâche hors de sa liste avec le message commun", async () => {
    const reponse = await reserver({
      type: "ia",
      budget: tranche,
      objectif: "devis",
      outil: "crm",
    });
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      message: "Choisissez la réponse la plus proche de votre cas.",
      champ: "objectif",
    });
  });
});
