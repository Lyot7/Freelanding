import { describe, expect, it } from "bun:test";
import { construirePrompt, creerCompteur, extraire, lireComposants, PLAFOND_JOUR } from "./extraction.ts";

const REPONSES = { type: "logiciel", equipe: "6-20", outils: "plusieurs", urgence: "trimestre" };
const ENV = { CLOUDFLARE_ACCOUNT_ID: "0123456789abcdef0123456789abcdef", CLOUDFLARE_AI_TOKEN: "jeton" };
const JSON_OK =
  '{"pages":0,"modules":3,"connexions":1,"utilisateurs":12,"usagesIA":0,"boutique":false,"espacePrive":false,"multilingue":false,"flou":"moyen"}';

function faux(reponse, statut = 200) {
  const appels = [];
  const f = async (url, init) => {
    appels.push({ url, init });
    return new Response(JSON.stringify(reponse), { status: statut });
  };
  return { f, appels };
}

describe("lireComposants", () => {
  it("lit un objet JSON, même entouré de texte", () => {
    const c = lireComposants(`Voici : ${JSON_OK} fin`);
    expect(c?.modules).toBe(3);
    expect(c?.flou).toBe("moyen");
  });

  it("refuse une réponse incomplète plutôt que d'inventer des zéros", () => {
    expect(lireComposants('{"pages":2}')).toBeUndefined();
    expect(lireComposants("pas de json")).toBeUndefined();
    expect(lireComposants("{cassé")).toBeUndefined();
  });

  it("ramène un flou inconnu à « fort »", () => {
    expect(lireComposants(JSON_OK.replace('"moyen"', '"énorme"'))?.flou).toBe("fort");
  });
});

describe("construirePrompt", () => {
  it("borne la description et la met entre balises", () => {
    const p = construirePrompt(REPONSES, "x".repeat(5_000));
    expect(p).toContain("<description>");
    expect(p.match(/x/g)?.length).toBe(3_000);
  });
});

describe("compteur journalier", () => {
  it("refuse au-delà du plafond et repart le lendemain (heure de Paris)", () => {
    const c = creerCompteur(2);
    const matin = Date.parse("2026-11-12T08:00:00+01:00");
    expect(c.reserver(matin)).toBe(true);
    expect(c.reserver(matin)).toBe(true);
    expect(c.reserver(matin)).toBe(false);
    expect(c.reserver(Date.parse("2026-11-13T00:05:00+01:00"))).toBe(true);
  });

  it("le plafond par défaut reste sous l'allocation gratuite", () => {
    // ~50 neurons par appel, 10 000 gratuits par jour.
    expect(PLAFOND_JOUR * 50).toBeLessThan(10_000 / 2);
  });
});

describe("extraire", () => {
  it("sans clés : aucun appel réseau", async () => {
    const { f, appels } = faux({});
    const r = await extraire(REPONSES, "un projet", { env: {}, compteur: creerCompteur(), fetch: f });
    expect(r).toEqual({ ok: false, raison: "non_configure" });
    expect(appels.length).toBe(0);
  });

  it("plafond atteint : aucun appel réseau", async () => {
    const { f, appels } = faux({});
    const r = await extraire(REPONSES, "un projet", { env: ENV, compteur: creerCompteur(0), fetch: f });
    expect(r.ok).toBe(false);
    expect(r.raison).toBe("plafond");
    expect(appels.length).toBe(0);
  });

  it("un seul appel, sans coordonnées, et des composants lus", async () => {
    const { f, appels } = faux({ result: { response: JSON_OK } });
    const r = await extraire(REPONSES, "Nos devis sont sur Excel", { env: ENV, compteur: creerCompteur(), fetch: f });
    expect(r.ok).toBe(true);
    expect(r.composants.modules).toBe(3);
    expect(appels.length).toBe(1);
    expect(appels[0].url).toContain("/ai/run/@cf/");
    expect(appels[0].init.headers.authorization).toBe("Bearer jeton");
    const corps = JSON.parse(appels[0].init.body);
    expect(corps.max_tokens).toBeLessThanOrEqual(200);
    expect(JSON.stringify(corps)).not.toContain("@");
  });

  it("réponse en erreur ou illisible : repli signalé", async () => {
    const erreur = await extraire(REPONSES, "x", { env: ENV, compteur: creerCompteur(), fetch: faux({}, 429).f });
    expect(erreur).toEqual({ ok: false, raison: "indisponible", detail: "429" });
    const illisible = await extraire(REPONSES, "x", {
      env: ENV,
      compteur: creerCompteur(),
      fetch: faux({ result: { response: "je ne sais pas" } }).f,
    });
    expect(illisible).toEqual({ ok: false, raison: "illisible" });
  });

  it("refuse un identifiant de compte mal formé", async () => {
    const r = await extraire(REPONSES, "x", {
      env: { ...ENV, CLOUDFLARE_ACCOUNT_ID: "../autre" },
      compteur: creerCompteur(),
      fetch: faux({}).f,
    });
    expect(r.ok).toBe(false);
  });
});

describe("lecture de la réponse du modèle", () => {
  it("refuse des accolades qui ne contiennent pas du JSON", () => {
    expect(lireComposants("x {1} y")).toBeUndefined();
  });

  it("prend un objet déjà décodé rendu par le modèle", async () => {
    const objet = JSON.parse(JSON_OK);
    const r = await extraire(REPONSES, "x", {
      env: ENV,
      compteur: creerCompteur(),
      fetch: faux({ result: { response: objet } }).f,
    });
    expect(r.ok).toBe(true);
    expect(r.composants.modules).toBe(3);
  });

  it("repli illisible quand la forme de la réponse n'est pas celle de Workers AI", async () => {
    for (const charge of [null, "texte", { result: null }, { result: "x" }, { result: {} }, { result: { response: 12 } }]) {
      const r = await extraire(REPONSES, "x", {
        env: ENV,
        compteur: creerCompteur(),
        fetch: async () => new Response(JSON.stringify(charge)),
      });
      expect(r).toEqual({ ok: false, raison: "illisible" });
    }
  });

  it("repli illisible quand la réponse n'est pas du JSON", async () => {
    const r = await extraire(REPONSES, "x", {
      env: ENV,
      compteur: creerCompteur(),
      fetch: async () => new Response("<html>"),
    });
    expect(r).toEqual({ ok: false, raison: "illisible" });
  });

  it("repli indisponible sur une exception, avec son nom ou « inconnue »", async () => {
    const nommee = await extraire(REPONSES, "x", {
      env: ENV,
      compteur: creerCompteur(),
      fetch: async () => {
        throw new TypeError("réseau");
      },
    });
    expect(nommee).toEqual({ ok: false, raison: "indisponible", detail: "TypeError" });
    const autre = await extraire(REPONSES, "x", {
      env: ENV,
      compteur: creerCompteur(),
      fetch: async () => {
        throw "chaîne";
      },
    });
    expect(autre).toEqual({ ok: false, raison: "indisponible", detail: "inconnue" });
  });

  it("choisit le modèle de l'environnement, sinon celui par défaut", async () => {
    const { f, appels } = faux({ result: { response: JSON_OK } });
    await extraire(REPONSES, "x", { env: { ...ENV, CLOUDFLARE_AI_MODEL: " @cf/autre/modele " }, compteur: creerCompteur(), fetch: f });
    expect(appels[0].url).toContain("/ai/run/@cf/autre/modele");
  });

  it("lit l'environnement du processus et le fetch global par défaut", async () => {
    const envAvant = { ...process.env };
    const fetchAvant = globalThis.fetch;
    process.env.CLOUDFLARE_ACCOUNT_ID = ENV.CLOUDFLARE_ACCOUNT_ID;
    process.env.CLOUDFLARE_AI_TOKEN = "jeton";
    const appels = [];
    globalThis.fetch = async (url) => {
      appels.push(String(url));
      return new Response(JSON.stringify({ result: { response: JSON_OK } }));
    };
    try {
      const r = await extraire(REPONSES, "x", { compteur: creerCompteur() });
      expect(r.ok).toBe(true);
      expect(appels.length).toBe(1);
    } finally {
      globalThis.fetch = fetchAvant;
      process.env = envAvant;
    }
  });

  it("le compteur sans date compte le jour courant", () => {
    const c = creerCompteur(3);
    expect(c.utilises()).toBe(0);
    c.reserver();
    expect(c.utilises()).toBe(1);
  });
});
