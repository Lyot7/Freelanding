import { afterEach, describe, expect, it } from "bun:test";
import { corpsCockpit, envoyerAuCockpit } from "./cockpit.ts";

const ENV = { RDV_TOKEN: "jeton-rdv-de-test-0123456789abcdef0123", COCKPIT_URL: "https://cockpit.test" };

const envoi = {
  demande: {
    reponses: { type: "site", equipe: "1-5", outils: "rien", urgence: "libre" },
    description: "Un site pour mon atelier de menuiserie.",
    contact: { prenom: "Lucie", nom: "Marchetti", societe: "Coteaux", email: "lucie@coteaux.fr", telephone: "0647218803" },
    jetonCaptcha: "jeton-a-ne-pas-transmettre",
  },
  estimation: { type: "site" },
  composants: { pages: 6 },
  source: "boutons",
};

const fetchOrigine = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOrigine;
});

describe("corpsCockpit", () => {
  it("n'envoie ni jeton captcha ni rien d'autre que la fiche", () => {
    const corps = corpsCockpit(envoi);
    expect(Object.keys(corps).sort()).toEqual(["composants", "contact", "description", "estimation", "reponses", "sourceComposants"]);
    expect(corps.sourceComposants).toBe("boutons");
    expect(JSON.stringify(corps)).not.toContain("jeton-a-ne-pas-transmettre");
  });
});

describe("envoyerAuCockpit", () => {
  it("sans accès configuré : aucun appel réseau", async () => {
    let appels = 0;
    globalThis.fetch = async () => {
      appels += 1;
      return new Response("{}");
    };
    expect(await envoyerAuCockpit(envoi, {})).toEqual({ ok: false, detail: "non_configure" });
    expect(appels).toBe(0);
  });

  it("POST authentifié vers le cockpit, réponse ok", async () => {
    let vu;
    globalThis.fetch = async (url, init) => {
      vu = { url: String(url), init };
      return new Response("{}", { status: 200 });
    };
    expect(await envoyerAuCockpit(envoi, ENV)).toEqual({ ok: true });
    expect(vu.url).toBe("https://cockpit.test/api/rdv/estimation");
    expect(vu.init.method).toBe("POST");
    expect(vu.init.headers.authorization).toBe(`Bearer ${ENV.RDV_TOKEN}`);
    expect(JSON.parse(vu.init.body).contact.email).toBe("lucie@coteaux.fr");
  });

  it("lit l'environnement du processus par défaut", async () => {
    const avant = { ...process.env };
    Object.assign(process.env, ENV);
    globalThis.fetch = async () => new Response("{}", { status: 200 });
    try {
      expect(await envoyerAuCockpit(envoi)).toEqual({ ok: true });
    } finally {
      process.env = avant;
    }
  });

  it("statut en erreur : le détail porte le statut", async () => {
    globalThis.fetch = async () => new Response("{}", { status: 503 });
    expect(await envoyerAuCockpit(envoi, ENV)).toEqual({ ok: false, detail: "statut_503" });
  });

  it("exception réseau : le détail porte le nom de l'erreur, jamais l'exception", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    expect(await envoyerAuCockpit(envoi, ENV)).toEqual({ ok: false, detail: "TypeError" });
    globalThis.fetch = async () => {
      throw "chaîne";
    };
    expect(await envoyerAuCockpit(envoi, ENV)).toEqual({ ok: false, detail: "inconnue" });
  });
});
