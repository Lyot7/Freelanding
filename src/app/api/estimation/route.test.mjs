import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { POST } from "./route.ts";

/**
 * La route complète, réseau simulé : Turnstile répond oui, le cockpit répond
 * ce que le test choisit, aucune IA configurée (repli sur les boutons).
 */
const fetchOrigine = globalThis.fetch;
const envOrigine = { ...process.env };
let appelsCockpit;
let statutCockpit;
let ip = 10;

beforeEach(() => {
  appelsCockpit = [];
  statutCockpit = 200;
  process.env.TURNSTILE_SECRET_KEY = "secret-de-test";
  process.env.RDV_TOKEN = "jeton-rdv-de-test-0123456789abcdef0123";
  process.env.COCKPIT_URL = "https://cockpit.test";
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_AI_TOKEN;
  // Jamais de vrai mail depuis un test, même si un .env en pose les clés.
  delete process.env.SMTP_HOTE;
  delete process.env.RESEND_API_KEY;
  globalThis.fetch = async (url, init) => {
    const adresse = String(url);
    if (adresse.includes("turnstile")) return Response.json({ success: true });
    if (adresse.startsWith("https://cockpit.test/api/rdv/estimation")) {
      appelsCockpit.push({ init, corps: JSON.parse(init.body) });
      return Response.json({ ok: statutCockpit === 200 }, { status: statutCockpit });
    }
    throw new Error(`appel inattendu : ${adresse}`);
  };
});

afterEach(() => {
  globalThis.fetch = fetchOrigine;
  process.env = { ...envOrigine };
});

function requete(corps) {
  ip += 1;
  return new Request("http://localhost:3000/api/estimation", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "x-forwarded-for": `203.0.113.${ip}`,
    },
    body: JSON.stringify(corps),
  });
}

const VALIDE = {
  reponses: { type: "logiciel", equipe: "6-20", outils: "plusieurs", urgence: "trimestre" },
  description: "Nos devis se font sur Excel et se perdent dans les mails, je veux un outil de devis.",
  contact: {
    prenom: "Lucie",
    nom: "Marchetti",
    societe: "Menuiserie des Coteaux",
    email: "lucie@coteaux.fr",
    telephone: "06 47 21 88 03",
  },
  consentement: true,
  jetonCaptcha: "jeton",
};

describe("POST /api/estimation", () => {
  test("refuse ce qui n'est pas du JSON", async () => {
    const r = await POST(
      new Request("http://localhost:3000/api/estimation", {
        method: "POST",
        headers: { "content-type": "text/plain", origin: "http://localhost:3000" },
        body: "x",
      }),
    );
    expect(r.status).toBe(415);
  });

  test("nomme le champ manquant", async () => {
    const r = await POST(requete({ ...VALIDE, consentement: false, debutMs: Date.now() - 30_000 }));
    expect(r.status).toBe(400);
    expect((await r.json()).champ).toBe("consentement");
  });

  test("rend une fourchette et envoie la fiche au cockpit", async () => {
    const r = await POST(requete({ ...VALIDE, debutMs: Date.now() - 30_000 }));
    expect(r.status).toBe(200);
    const charge = await r.json();
    expect(charge.source).toBe("boutons");
    expect(charge.estimation.prix.haut).toBeGreaterThan(charge.estimation.prix.bas);
    expect(appelsCockpit.length).toBe(1);
    expect(appelsCockpit[0].init.headers.authorization).toBe(`Bearer ${process.env.RDV_TOKEN}`);
    expect(appelsCockpit[0].corps.contact.email).toBe("lucie@coteaux.fr");
    expect(appelsCockpit[0].corps.sourceComposants).toBe("boutons");
  });

  test("le visiteur a son estimation même si le cockpit tombe", async () => {
    statutCockpit = 503;
    const r = await POST(requete({ ...VALIDE, debutMs: Date.now() - 30_000 }));
    expect(r.status).toBe(200);
    expect((await r.json()).estimation.prix.bas).toBeGreaterThan(0);
  });

  test("bloque au-delà de cinq estimations par jour et par adresse", async () => {
    const meme = () =>
      new Request("http://localhost:3000/api/estimation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "x-forwarded-for": "198.51.100.7",
        },
        body: JSON.stringify({ ...VALIDE, debutMs: Date.now() - 30_000 }),
      });
    for (let i = 0; i < 5; i += 1) expect((await POST(meme())).status).toBe(200);
    expect((await POST(meme())).status).toBe(429);
  });
});
