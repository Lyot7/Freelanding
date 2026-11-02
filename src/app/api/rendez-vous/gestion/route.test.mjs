import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { POST as annuler } from "./[jeton]/annuler/route.ts";
import { GET as creneaux } from "./[jeton]/creneaux/route.ts";
import { POST as deplacer } from "./[jeton]/deplacer/route.ts";

/**
 * LES ROUTES DE GESTION, vues du navigateur. Le cockpit est simulé (fetch) :
 * on vérifie les protections (origine, type de contenu, jeton, configuration),
 * le relais et la traduction des refus.
 */

const JETON = "c".repeat(43);
const VARIABLES = { RDV_TOKEN: "jeton-de-test", COCKPIT_URL: "https://cockpit.test" };
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

function simuler(...reponses) {
  const appels = [];
  globalThis.fetch = async (url, options = {}) => {
    appels.push({ url: String(url), options });
    const suivante = reponses[Math.min(appels.length - 1, reponses.length - 1)];
    if (suivante instanceof Error) throw suivante;
    const [corps, statut = 200] = suivante;
    return new Response(JSON.stringify(corps), { status: statut });
  };
  return appels;
}

let appelant = 0;
function requete(chemin, { methode = "POST", corps, entetes = {} } = {}) {
  appelant += 1;
  return new Request(`https://eliottbouquerel.fr/api/rendez-vous/gestion/${chemin}`, {
    method: methode,
    headers: {
      ...(methode === "POST" ? { "content-type": "application/json" } : {}),
      "x-forwarded-for": `198.51.100.${appelant}`,
      ...entetes,
    },
    ...(corps !== undefined ? { body: JSON.stringify(corps) } : {}),
  });
}
const contexte = (jeton = JETON) => ({ params: Promise.resolve({ jeton }) });
const dansTroisJours = () => new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();

describe("POST …/annuler", () => {
  it("relaie au cockpit avec le jeton porteur et le motif", async () => {
    const appels = simuler([{ statut: "ANNULE", deja: false }]);
    const reponse = await annuler(requete(`${JETON}/annuler`, { corps: { motif: "Empêchement" } }), contexte());
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ ok: true });
    expect(appels[0].url).toBe(`https://cockpit.test/api/rdv/gestion/${JETON}/annuler`);
    expect(appels[0].options.headers.authorization).toBe("Bearer jeton-de-test");
    expect(JSON.parse(appels[0].options.body)).toEqual({ motif: "Empêchement" });
  });

  it("refuse une origine étrangère et un corps qui n’est pas du JSON", async () => {
    const appels = simuler([{}]);
    const etrangere = await annuler(
      requete(`${JETON}/annuler`, { corps: {}, entetes: { origin: "https://pirate.example" } }),
      contexte(),
    );
    expect(etrangere.status).toBe(403);
    const texte = await annuler(
      requete(`${JETON}/annuler`, { corps: {}, entetes: { "content-type": "text/plain" } }),
      contexte(),
    );
    expect(texte.status).toBe(415);
    expect(appels).toHaveLength(0);
  });

  it("répond 404 à un jeton mal formé sans appeler le cockpit", async () => {
    const appels = simuler([{}]);
    const reponse = await annuler(requete("nimporte/annuler", { corps: {} }), contexte("nimporte"));
    expect(reponse.status).toBe(404);
    expect(appels).toHaveLength(0);
  });

  it("refuse un corps illisible", async () => {
    simuler([{}]);
    const corpsCasse = (chemin) =>
      new Request(`https://eliottbouquerel.fr/api/rendez-vous/gestion/${chemin}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${(appelant += 1)}` },
        body: "{",
      });
    expect((await annuler(corpsCasse(`${JETON}/annuler`), contexte())).status).toBe(400);
    expect((await deplacer(corpsCasse(`${JETON}/deplacer`), contexte())).status).toBe(400);
  });

  it("limite les écritures par adresse", async () => {
    simuler([{ statut: "ANNULE", deja: true }]);
    const meme = () =>
      annuler(
        new Request(`https://eliottbouquerel.fr/api/rendez-vous/gestion/${JETON}/annuler`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.250" },
          body: "{}",
        }),
        contexte(),
      );
    const statuts = [];
    for (let i = 0; i < 7; i += 1) statuts.push((await meme()).status);
    expect(statuts.slice(0, 6).every((s) => s === 200)).toBe(true);
    expect(statuts[6]).toBe(429);
  });

  it("refuse un motif trop long", async () => {
    simuler([{}]);
    const reponse = await annuler(requete(`${JETON}/annuler`, { corps: { motif: "x".repeat(1001) } }), contexte());
    expect(reponse.status).toBe(400);
  });

  it("traduit un rendez-vous inconnu du cockpit en 404", async () => {
    simuler([{ erreur: "introuvable" }, 404]);
    const reponse = await annuler(requete(`${JETON}/annuler`, { corps: {} }), contexte());
    expect(reponse.status).toBe(404);
  });

  it("refuse une écriture sans type de contenu", async () => {
    const appels = simuler([{}]);
    const reponse = await annuler(
      new Request(`https://eliottbouquerel.fr/api/rendez-vous/gestion/${JETON}/annuler`, {
        method: "POST",
        // Sans corps : aucun type de contenu, pas même celui qu'ajoute un corps texte.
        headers: { "x-forwarded-for": `198.51.100.${(appelant += 1)}` },
      }),
      contexte(),
    );
    expect(reponse.status).toBe(415);
    expect(appels).toHaveLength(0);
  });

  it("répond 504 et propose l’e-mail quand le cockpit ne répond pas", async () => {
    simuler(new TypeError("fetch failed"));
    const reponse = await annuler(requete(`${JETON}/annuler`, { corps: {} }), contexte());
    expect(reponse.status).toBe(504);
    expect((await reponse.json()).message).toContain("Écrivez-moi directement à contact@eliottbouquerel.fr.");
  });

  it("relaie le champ que le refus du cockpit désigne", async () => {
    simuler([{ erreur: "creneau_pris" }, 409]);
    const reponse = await annuler(requete(`${JETON}/annuler`, { corps: {} }), contexte());
    expect(reponse.status).toBe(409);
    expect(await reponse.json()).toEqual({
      message: "Ce créneau vient d’être pris. Choisissez-en un autre dans la liste.",
      champ: "creneau",
    });
  });

  it("répond 503 sans RDV_TOKEN", async () => {
    const appels = simuler([{}]);
    process.env.RDV_TOKEN = "";
    try {
      const reponse = await annuler(requete(`${JETON}/annuler`, { corps: {} }), contexte());
      expect(reponse.status).toBe(503);
    } finally {
      process.env.RDV_TOKEN = VARIABLES.RDV_TOKEN;
    }
    expect(appels).toHaveLength(0);
  });
});

describe("POST …/deplacer", () => {
  it("relaie le nouveau créneau et rend le nouveau jeton", async () => {
    const nouveau = "d".repeat(43);
    const debut = dansTroisJours();
    const appels = simuler([{ id: "r2", debut, fin: debut, lienMeet: "x", jetonGestion: nouveau }]);
    const reponse = await deplacer(requete(`${JETON}/deplacer`, { corps: { debut } }), contexte());
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ ok: true, jeton: nouveau });
    expect(JSON.parse(appels[0].options.body)).toEqual({ debut });
  });

  it("traduit le 409 `creneau_pris` en message actionnable", async () => {
    simuler([{ erreur: "creneau_pris" }, 409]);
    const reponse = await deplacer(requete(`${JETON}/deplacer`, { corps: { debut: dansTroisJours() } }), contexte());
    expect(reponse.status).toBe(409);
    expect((await reponse.json()).champ).toBe("creneau");
  });

  it("refuse un créneau passé avant d’appeler le cockpit", async () => {
    const appels = simuler([{}]);
    const reponse = await deplacer(
      requete(`${JETON}/deplacer`, { corps: { debut: "2020-01-01T10:00:00Z" } }),
      contexte(),
    );
    expect(reponse.status).toBe(400);
    expect(appels).toHaveLength(0);
  });

  it("relaie la durée choisie avec le nouveau créneau", async () => {
    const nouveau = "e".repeat(43);
    const debut = dansTroisJours();
    const appels = simuler([{ debut, fin: debut, jetonGestion: nouveau }]);
    const reponse = await deplacer(requete(`${JETON}/deplacer`, { corps: { debut, duree: 60 } }), contexte());
    expect(reponse.status).toBe(200);
    expect(JSON.parse(appels[0].options.body)).toEqual({ debut, duree: 60 });
  });

  it("refuse une durée absurde avant d’appeler le cockpit", async () => {
    const appels = simuler([{}]);
    const reponse = await deplacer(
      requete(`${JETON}/deplacer`, { corps: { debut: dansTroisJours(), duree: 1000 } }),
      contexte(),
    );
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({ message: "Cette durée n’est plus proposée.", champ: "duree" });
    expect(appels).toHaveLength(0);
  });

  it("répond 404 à un jeton mal formé sans appeler le cockpit", async () => {
    const appels = simuler([{}]);
    const reponse = await deplacer(
      requete("court/deplacer", { corps: { debut: dansTroisJours() } }),
      contexte("court"),
    );
    expect(reponse.status).toBe(404);
    expect(appels).toHaveLength(0);
  });

  it("répond 504 quand le cockpit ne répond pas", async () => {
    simuler(new TypeError("fetch failed"));
    const reponse = await deplacer(requete(`${JETON}/deplacer`, { corps: { debut: dansTroisJours() } }), contexte());
    expect(reponse.status).toBe(504);
    expect(await reponse.json()).not.toHaveProperty("champ");
  });

  it("ne relaie pas le 401 du cockpit tel quel", async () => {
    simuler([{ erreur: "jeton_invalide" }, 401]);
    const reponse = await deplacer(requete(`${JETON}/deplacer`, { corps: { debut: dansTroisJours() } }), contexte());
    expect(reponse.status).toBe(502);
  });
});

describe("GET …/creneaux", () => {
  const RDV = {
    type: "decouverte",
    titre: "Premier échange",
    duree: 30,
    durees: [15, 30, 45],
    debut: dansTroisJours(),
    fin: dansTroisJours(),
    statut: "CONFIRME",
  };

  it("lit le type et la durée du rendez-vous, puis ses créneaux", async () => {
    const libre = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    libre.setUTCMinutes(0, 0, 0);
    const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(libre);
    const appels = simuler([RDV], [{ jours: [{ jour, creneaux: [libre.toISOString()] }] }]);
    const reponse = await creneaux(requete(`${JETON}/creneaux`, { methode: "GET" }), contexte());
    expect(reponse.status).toBe(200);
    const charge = await reponse.json();
    expect(charge.duree).toBe(30);
    const params = new URL(appels[1].url).searchParams;
    expect(params.get("type")).toBe("decouverte");
    expect(params.get("duree")).toBe("30");
    expect(charge.fenetre.mois).toMatch(/^\d{4}-\d{2}$/);
  });

  it("répond 404 quand le cockpit ne connaît pas le jeton", async () => {
    simuler([{ erreur: "introuvable" }, 404]);
    const reponse = await creneaux(requete(`${JETON}/creneaux`, { methode: "GET" }), contexte());
    expect(reponse.status).toBe(404);
  });

  it("répond 502 quand le cockpit refuse les créneaux", async () => {
    simuler([RDV], [{ erreur: "sans_agenda" }, 503]);
    const reponse = await creneaux(requete(`${JETON}/creneaux`, { methode: "GET" }), contexte());
    expect(reponse.status).toBe(502);
  });

  it("répond 404 à un jeton mal formé sans appeler le cockpit", async () => {
    const appels = simuler([RDV]);
    const reponse = await creneaux(requete("court/creneaux", { methode: "GET" }), contexte("court"));
    expect(reponse.status).toBe(404);
    expect(appels).toHaveLength(0);
  });

  it("répond 502 quand le cockpit tombe entre le rendez-vous et ses créneaux", async () => {
    simuler([RDV], new TypeError("fetch failed"));
    const reponse = await creneaux(requete(`${JETON}/creneaux`, { methode: "GET" }), contexte());
    expect(reponse.status).toBe(502);
    expect(await reponse.json()).toEqual({ message: "Créneaux indisponibles." });
  });

  it("refuse de proposer des créneaux pour un rendez-vous annulé", async () => {
    const appels = simuler([{ ...RDV, statut: "ANNULE" }]);
    const reponse = await creneaux(requete(`${JETON}/creneaux`, { methode: "GET" }), contexte());
    expect(reponse.status).toBe(409);
    expect(appels).toHaveLength(1);
  });
});
