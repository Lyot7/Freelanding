import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { CLES_COCKPIT } from "@/lib/rendez-vous/config";
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

const CLES = ["logiciel", "site", "ia", "decouverte", "demonstration", "point-d-etape"];
const TYPES = {
  types: CLES.map((cle) => ({ cle, titre: cle, durees: [30, 45, 60], defaut: 45 })),
};

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
        debutMs: maintenant - 10_000,
        jetonCaptcha: "jeton-turnstile",
        ...corps,
      }),
    }),
  );
}

describe("POST /api/rendez-vous : jusqu’au cockpit", () => {
  it("réserve et garde le téléphone en première ligne des notes", async () => {
    const envois = simuler([{ id: "rdv_1", jetonGestion: "x" }, 201]);
    const reponse = await reserver();
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ ok: true });
    expect(envois[0].url).toBe("https://cockpit-reservation.test/api/rdv");
    expect(envois[0].options.headers.authorization).toBe("Bearer jeton-de-test");
    const corps = JSON.parse(envois[0].options.body);
    expect(corps.type).toBe("logiciel");
    expect(corps.duree).toBe(45);
    expect(corps.telephone).toBe("06 12 34 56 78");
    expect(corps.notes).toBe("Téléphone : 06 12 34 56 78");
    expect(corps.reponses).toBeUndefined();
    expect(corps).not.toHaveProperty("entreprise");
  });

  it.each(["logiciel", "site", "ia", "decouverte", "demonstration"])(
    "envoie le sujet « %s » au cockpit avec sa clé",
    async (type) => {
      const envois = simuler([{ id: "rdv_t", jetonGestion: "t" }, 201]);
      const reponse = await reserver({ type });
      expect(reponse.status).toBe(200);
      const corps = JSON.parse(envois[0].options.body);
      expect(corps.type).toBe(type);
      expect(corps.type).toBe(CLES_COCKPIT[type]);
    },
  );

  it("traduit un ancien sujet avant l'envoi au cockpit", async () => {
    for (const [ancien, attendu] of [["outil", "logiciel"], ["cto", "decouverte"], ["autre", "decouverte"]]) {
      const envois = simuler([{ id: "rdv_a", jetonGestion: "a" }, 201]);
      const reponse = await reserver({ type: ancien });
      expect(reponse.status, ancien).toBe(200);
      expect(JSON.parse(envois[0].options.body).type).toBe(attendu);
    }
  });

  it("envoie la ligne libre dans les notes et dans les réponses reprises par le mail", async () => {
    const envois = simuler([{ id: "rdv_3", jetonGestion: "z" }, 201]);
    const reponse = await reserver({
      type: "site",
      message: "On ressaisit chaque commande\ndans trois fichiers.",
    });
    expect(reponse.status).toBe(200);
    const corps = JSON.parse(envois[0].options.body);
    expect(corps.reponses).toEqual({ coince: "On ressaisit chaque commande dans trois fichiers." });
    expect(corps.notes).toBe(
      "Téléphone : 06 12 34 56 78\n\nOn ressaisit chaque commande\ndans trois fichiers.",
    );
  });

  it("n'envoie rien d'un ancien questionnaire resté dans un onglet périmé", async () => {
    const envois = simuler([{ id: "rdv_4", jetonGestion: "w" }, 201]);
    const reponse = await reserver({
      budget: "5000-10000",
      objectif: "tableur",
      echeance: "vite",
      entreprise: "Transports Martin",
      activite: "Transport frigorifique",
      taille: "6-20",
      decision: "plusieurs",
      coince: "texte ignoré",
      cout: "2-5h",
      essaye: "tableur",
      projet: "ignoré",
    });
    expect(reponse.status).toBe(200);
    const corps = JSON.parse(envois[0].options.body);
    expect(corps.reponses).toBeUndefined();
    expect(corps.notes).toBe("Téléphone : 06 12 34 56 78");
    expect(corps).not.toHaveProperty("entreprise");
  });

  it.each(["point-rapide", "demonstration", "proposition", "point-d-etape"])(
    "un client réserve « %s » avec son seul nom et son e-mail : ni téléphone ni notes envoyés",
    async (type) => {
      const envois = simuler([{ id: "rdv_2", jetonGestion: "y" }, 201]);
      const reponse = await reserver({ type, telephone: "" });
      expect(reponse.status).toBe(200);
      const corps = JSON.parse(envois[0].options.body);
      expect(corps.type).toBe(type);
      expect(corps).not.toHaveProperty("telephone");
      expect(corps).not.toHaveProperty("notes");
      expect(corps).not.toHaveProperty("reponses");
    },
  );

  it("un client qui laisse un mot le voit dans les notes et dans le mail de confirmation", async () => {
    const envois = simuler([{ id: "rdv_7", jetonGestion: "t" }, 201]);
    const reponse = await reserver({ type: "proposition", telephone: "", message: "Relire le devis du module stock." });
    expect(reponse.status).toBe(200);
    const corps = JSON.parse(envois[0].options.body);
    expect(corps.notes).toBe("Relire le devis du module stock.");
    expect(corps.reponses).toEqual({ coince: "Relire le devis du module stock." });
  });

  it("refuse une réservation sans téléphone au premier rendez-vous, sans rien envoyer", async () => {
    const envois = simuler([{ id: "rdv_5", jetonGestion: "v" }, 201]);
    for (const type of ["logiciel", "site", "ia", "decouverte"]) {
      const reponse = await reserver({ type, telephone: "" });
      expect(reponse.status, type).toBe(400);
      expect((await reponse.json()).champ).toBe("telephone");
    }
    expect(envois).toHaveLength(0);
  });

  it("refuse une durée que le cockpit ne propose pas, sans rien envoyer", async () => {
    const envois = simuler([{ id: "rdv_6", jetonGestion: "u" }, 201]);
    const reponse = await reserver({ type: "site", duree: 90 });
    expect(reponse.status).toBe(400);
    expect((await reponse.json()).champ).toBe("duree");
    expect(envois).toHaveLength(0);
  });

  it("traduit le 409 `creneau_pris` en invitation à choisir un autre créneau", async () => {
    simuler([{ erreur: "creneau_pris" }, 409]);
    const reponse = await reserver();
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
