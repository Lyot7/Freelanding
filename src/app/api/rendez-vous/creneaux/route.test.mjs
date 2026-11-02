import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { GET } from "./route.ts";

/**
 * LES CRÉNEAUX DU FORMULAIRE, relayés au cockpit. Le cockpit est simulé
 * (fetch) : on vérifie ce qui lui part (clé du type, fenêtre bornée, durée
 * proposée, jeton en en-tête) et ce que le navigateur reçoit.
 */

const VARIABLES = { RDV_TOKEN: "jeton-de-test", COCKPIT_URL: "https://cockpit-creneaux.test" };
const avant = {};
const fetchOriginal = globalThis.fetch;

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
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

const TYPES = {
  types: [
    { cle: "logiciel", durees: [30, 45, 60], defaut: 45 },
    { cle: "decouverte", durees: [15, 30], defaut: 30 },
  ],
};

/** Le cockpit rend ses types, puis `creneaux` (ou lève). */
function simuler(creneaux) {
  const appels = [];
  globalThis.fetch = async (url, options = {}) => {
    const adresse = String(url);
    appels.push({ url: adresse, options });
    if (adresse.endsWith("/api/rdv/types")) return new Response(JSON.stringify(TYPES), { status: 200 });
    if (creneaux instanceof Error) throw creneaux;
    const [corps, statut = 200] = creneaux;
    return new Response(JSON.stringify(corps), { status: statut });
  };
  return appels;
}

let appelant = 0;
function demander(parametres, entetes = {}) {
  appelant += 1;
  return GET(
    new Request(`https://eliottbouquerel.fr/api/rendez-vous/creneaux?${parametres}`, {
      headers: { "x-forwarded-for": `203.0.113.${appelant}`, ...entetes },
    }),
  );
}

/** Un créneau libre dans cinq jours, sur l'heure pleine, et son jour à Paris. */
function creneauLibre() {
  const libre = new Date(Date.now() + 5 * 24 * 3600 * 1000);
  libre.setUTCMinutes(0, 0, 0);
  const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(libre);
  return { libre, jour };
}

describe("GET /api/rendez-vous/creneaux — relais au cockpit", () => {
  it("demande au cockpit les créneaux du type, à la durée choisie", async () => {
    const { libre, jour } = creneauLibre();
    const appels = simuler([{ jours: [{ jour, creneaux: [libre.toISOString()] }] }]);
    const reponse = await demander("type=logiciel&duree=60");
    expect(reponse.status).toBe(200);
    const charge = await reponse.json();
    expect(charge.durees).toEqual({ options: [30, 45, 60], defaut: 45 });
    expect(charge.duree).toBe(60);
    expect(charge.jours.flatMap((j) => j.creneaux.map((c) => c.debut))).toContain(libre.toISOString());

    const demande = appels.find((appel) => appel.url.includes("/api/rdv/creneaux"));
    expect(demande.options.headers.authorization).toBe("Bearer jeton-de-test");
    const params = new URL(demande.url).searchParams;
    expect(params.get("type")).toBe("logiciel");
    expect(params.get("duree")).toBe("60");
    expect(params.get("fuseau")).toBe("Europe/Paris");
  });

  it("ignore une durée que le type ne propose pas", async () => {
    const appels = simuler([{ jours: [] }]);
    const reponse = await demander("type=decouverte&duree=240");
    expect(reponse.status).toBe(200);
    const demande = appels.find((appel) => appel.url.includes("/api/rdv/creneaux"));
    expect(new URL(demande.url).searchParams.get("duree")).toBe("30");
  });

  it("répond 502 quand le cockpit ne répond pas, jamais une liste vide", async () => {
    simuler(new TypeError("fetch failed"));
    const reponse = await demander("type=logiciel");
    expect(reponse.status).toBe(502);
    expect(await reponse.json()).toEqual({ message: "Créneaux indisponibles." });
  });

  it("répond 503 sans RDV_TOKEN, sans appeler le cockpit", async () => {
    const appels = simuler([{ jours: [] }]);
    process.env.RDV_TOKEN = "";
    try {
      const reponse = await demander("type=logiciel");
      expect(reponse.status).toBe(503);
    } finally {
      process.env.RDV_TOKEN = VARIABLES.RDV_TOKEN;
    }
    expect(appels).toHaveLength(0);
  });

  it("refuse un type inconnu et une origine étrangère", async () => {
    const appels = simuler([{ jours: [] }]);
    expect((await demander("type=inconnu")).status).toBe(400);
    expect((await demander("type=logiciel", { origin: "https://pirate.example" })).status).toBe(403);
    expect(appels).toHaveLength(0);
  });
});
