import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { POST } from "./route.ts";

/**
 * LA RÉSERVATION JUSQU'AU COCKPIT. Turnstile et le cockpit sont simulés
 * (fetch) : on vérifie ce qui part au cockpit (téléphone en tête des notes,
 * réponses brutes, durée) et la traduction de ses refus pour le prospect.
 */

const VARIABLES = {
  RDV_TOKEN: "jeton-de-test",
  COCKPIT_URL: "https://cockpit-reservation.test",
  TURNSTILE_SECRET_KEY: "secret-de-test",
};
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

const TYPES = { types: [{ cle: "logiciel", titre: "Logiciel", durees: [30, 45, 60], defaut: 45 }] };

/** Turnstile accepte ; le cockpit rend ses types puis `reponseCockpit` (ou lève). */
function simuler(reponseCockpit) {
  const envois = [];
  globalThis.fetch = async (url, options = {}) => {
    const adresse = String(url);
    if (adresse.includes("challenges.cloudflare.com")) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (adresse.endsWith("/api/rdv/types?prive=1")) return new Response(JSON.stringify(TYPES), { status: 200 });
    envois.push({ url: adresse, options });
    if (reponseCockpit instanceof Error) throw reponseCockpit;
    const [corps, statut] = reponseCockpit;
    return new Response(JSON.stringify(corps), { status: statut });
  };
  return envois;
}

let appelant = 0;
function reserver(corps = {}) {
  appelant += 1;
  const maintenant = Date.now();
  return POST(
    new Request("https://eliottbouquerel.fr/api/rendez-vous", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `192.0.2.${appelant}` },
      body: JSON.stringify({
        type: "logiciel",
        debut: new Date(maintenant + 3 * 24 * 3600 * 1000).toISOString(),
        duree: 45,
        nom: "Camille Renard",
        email: "camille@exemple.fr",
        telephone: "06 12 34 56 78",
        budget: "5000-10000",
        objectif: "tableur",
        debutMs: maintenant - 10_000,
        jetonCaptcha: "jeton-turnstile",
        ...corps,
      }),
    }),
  );
}

describe("POST /api/rendez-vous — jusqu’au cockpit", () => {
  it("réserve et garde le téléphone en première ligne des notes", async () => {
    const envois = simuler([{ id: "rdv_1", jetonGestion: "x" }, 201]);
    const reponse = await reserver({ echeance: "vite" });
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ ok: true });
    expect(envois[0].url).toBe("https://cockpit-reservation.test/api/rdv");
    expect(envois[0].options.headers.authorization).toBe("Bearer jeton-de-test");
    const corps = JSON.parse(envois[0].options.body);
    expect(corps.type).toBe("logiciel");
    expect(corps.duree).toBe(45);
    expect(corps.telephone).toBe("06 12 34 56 78");
    expect(corps.notes.split("\n")[0]).toContain("06 12 34 56 78");
    expect(corps.reponses).toEqual({ budget: "5000-10000", objectif: "tableur", echeance: "vite" });
  });

  it("réserve un point d'étape : le projet part au cockpit, sans budget", async () => {
    const envois = simuler([{ id: "rdv_2", jetonGestion: "y" }, 201]);
    const reponse = await reserver({
      type: "point-d-etape",
      budget: undefined,
      objectif: "priorites",
      projet: "Cockpit",
    });
    expect(reponse.status).toBe(200);
    const corps = JSON.parse(envois[0].options.body);
    expect(corps.type).toBe("point-d-etape");
    expect(corps.reponses).toEqual({ projet: "Cockpit", objectif: "priorites" });
    expect(corps.notes.split("\n")[0]).toBe("Téléphone : 06 12 34 56 78");
    expect(corps.notes.split("\n")[1]).toBe("Projet : Cockpit");
  });

  it("refuse un point d'étape sans projet, champ `projet` nommé", async () => {
    const envois = simuler([{ id: "rdv_3", jetonGestion: "z" }, 201]);
    const reponse = await reserver({ type: "point-d-etape", objectif: "priorites", projet: "" });
    expect(reponse.status).toBe(400);
    expect((await reponse.json()).champ).toBe("projet");
    expect(envois).toHaveLength(0);
  });

  it("traduit le 409 `creneau_pris` en invitation à choisir un autre créneau", async () => {
    simuler([{ erreur: "creneau_pris" }, 409]);
    const reponse = await reserver({ echeance: undefined });
    expect(reponse.status).toBe(409);
    expect((await reponse.json()).champ).toBe("creneau");
  });

  it("ne relaie pas un 401 du cockpit : 502 et repli par e-mail", async () => {
    simuler([{ erreur: "jeton_invalide" }, 401]);
    const reponse = await reserver();
    expect(reponse.status).toBe(502);
    expect((await reponse.json()).message).toContain("Écrivez-moi");
  });

  it("répond 504 quand le cockpit ne répond pas", async () => {
    simuler(new TypeError("fetch failed"));
    const reponse = await reserver();
    expect(reponse.status).toBe(504);
  });
});
