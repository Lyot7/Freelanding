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

describe("POST /api/estimation, chemins d'erreur et de secours", () => {
  let journal;
  let consoleOrigine;
  let reponseTurnstile;
  let reponseIA;
  let reponseResend;
  let appelsResend;

  beforeEach(() => {
    journal = [];
    consoleOrigine = console.error;
    console.error = (...args) => journal.push(args.join(" "));
    reponseTurnstile = { success: true };
    reponseIA = undefined;
    reponseResend = undefined;
    appelsResend = [];
    const base = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const adresse = String(url);
      if (adresse.includes("turnstile")) return Response.json(reponseTurnstile);
      if (adresse.includes("api.cloudflare.com")) {
        if (reponseIA instanceof Error) throw reponseIA;
        return reponseIA ?? Response.json({ result: { response: "pas du json" } });
      }
      if (adresse.startsWith("https://api.resend.com")) {
        appelsResend.push(JSON.parse(init.body));
        return reponseResend ?? Response.json({ id: "mail-1" });
      }
      return base(url, init);
    };
  });

  afterEach(() => {
    console.error = consoleOrigine;
  });

  const corpsValide = () => ({ ...VALIDE, debutMs: Date.now() - 30_000 });
  const journalContient = (texte) => journal.some((l) => l.includes(texte));

  test("refuse une origine étrangère", async () => {
    const r = await POST(
      new Request("http://localhost:3000/api/estimation", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://ailleurs.example" },
        body: JSON.stringify(corpsValide()),
      }),
    );
    expect(r.status).toBe(403);
  });

  test("refuse une requête sans type de contenu", async () => {
    const r = await POST(new Request("http://localhost:3000/api/estimation", { method: "POST" }));
    expect(r.status).toBe(415);
  });

  test("répond 400 à un corps qui n'est pas du JSON", async () => {
    ip += 1;
    const r = await POST(
      new Request("http://localhost:3000/api/estimation", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": `203.0.113.${ip}` },
        body: "{pas du json",
      }),
    );
    expect(r.status).toBe(400);
    expect((await r.json()).champ).toBeUndefined();
  });

  test("rejette un robot en silence, sans nommer de champ", async () => {
    const r = await POST(requete({ ...corpsValide(), referenceInterne: "robot" }));
    expect(r.status).toBe(400);
    const charge = await r.json();
    expect(charge.champ).toBeUndefined();
    expect(journalContient("rejet_validation")).toBe(true);
  });

  test("captcha refusé : 403 ; captcha non configuré : 503", async () => {
    reponseTurnstile = { success: false, "error-codes": ["invalid-input-response"] };
    expect((await POST(requete(corpsValide()))).status).toBe(403);
    expect(journalContient("captcha_refuse")).toBe(true);
    delete process.env.TURNSTILE_SECRET_KEY;
    expect((await POST(requete(corpsValide()))).status).toBe(503);
  });

  test("avec l'IA configurée : les composants viennent du modèle", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
    process.env.CLOUDFLARE_AI_TOKEN = "jeton-ia";
    reponseIA = Response.json({
      result: {
        response:
          '{"pages":0,"modules":3,"connexions":1,"utilisateurs":12,"usagesIA":0,"boutique":false,"espacePrive":false,"multilingue":false,"flou":"faible"}',
      },
    });
    const r = await POST(requete(corpsValide()));
    expect(r.status).toBe(200);
    expect((await r.json()).source).toBe("ia");
    expect(appelsCockpit[0].corps.sourceComposants).toBe("ia");
  });

  test("IA en panne ou illisible : repli sur les boutons, journalisé", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
    process.env.CLOUDFLARE_AI_TOKEN = "jeton-ia";
    reponseIA = new TypeError("réseau");
    const panne = await POST(requete(corpsValide()));
    expect((await panne.json()).source).toBe("boutons");
    expect(journalContient("extraction_repli")).toBe(true);
    expect(journalContient("TypeError")).toBe(true);
    journal.length = 0;
    reponseIA = undefined;
    const illisible = await POST(requete(corpsValide()));
    expect((await illisible.json()).source).toBe("boutons");
    expect(journalContient("illisible")).toBe(true);
  });

  test("cockpit en panne : l'estimation part par mail à Eliott", async () => {
    statutCockpit = 503;
    process.env.RESEND_API_KEY = "cle-resend-de-test";
    const r = await POST(requete(corpsValide()));
    expect(r.status).toBe(200);
    expect(appelsResend.length).toBe(1);
    expect(appelsResend[0].subject).toContain("Menuiserie des Coteaux");
    expect(appelsResend[0].reply_to).toBe("lucie@coteaux.fr");
    expect(appelsResend[0].text).toContain("statut_503");
    expect(journalContient("cockpit_echoue")).toBe(true);
    expect(journalContient("contact_perdu")).toBe(false);
  });

  test("cockpit en panne et mail refusé : le contact perdu est journalisé", async () => {
    statutCockpit = 503;
    process.env.RESEND_API_KEY = "cle-resend-de-test";
    reponseResend = Response.json({ message: "domaine non vérifié" }, { status: 403 });
    const r = await POST(requete(corpsValide()));
    expect(r.status).toBe(200);
    expect(journalContient("contact_perdu")).toBe(true);
    expect(journalContient("refuse")).toBe(true);
  });

  test("cockpit en panne et aucun expéditeur : le contact perdu est journalisé", async () => {
    statutCockpit = 503;
    const r = await POST(requete(corpsValide()));
    expect(r.status).toBe(200);
    expect(journalContient("contact_perdu")).toBe(true);
    expect(journalContient("expediteur_non_configure")).toBe(true);
  });
});
