import { afterEach, describe, expect, it } from "bun:test";

import { POST } from "./route";

/*
 * Le relais vers PostHog doit porter l'adresse du VISITEUR : sans elle,
 * PostHog voit celle du serveur, situe toutes les visites au centre de données
 * et confond les visiteurs comptés sans cookie (leur identité de visite est un
 * hachage de l'adresse et du navigateur).
 */
const vraiFetch = globalThis.fetch;

function intercepter() {
  const envois = [];
  globalThis.fetch = async (url, init) => {
    envois.push({ url: String(url), entetes: new Headers(init.headers) });
    return new Response('{"status":"Ok"}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return envois;
}

function evenement(entetes) {
  return new Request("https://eliottbouquerel.fr/ingest/e", {
    method: "POST",
    headers: { "content-type": "application/json", ...entetes },
    body: '{"event":"$pageview"}',
  });
}

const contexte = { params: Promise.resolve({ chemin: ["e"] }) };

describe("relais /ingest, adresse du visiteur", () => {
  afterEach(() => {
    globalThis.fetch = vraiFetch;
  });

  it("relaie le premier élément de x-forwarded-for, et lui seul", async () => {
    const envois = intercepter();
    const reponse = await POST(
      evenement({ "x-forwarded-for": "203.0.113.9, 10.0.0.2" }),
      contexte,
    );
    expect(reponse.status).toBe(200);
    expect(envois).toHaveLength(1);
    expect(envois[0].entetes.get("x-forwarded-for")).toBe("203.0.113.9");
  });

  it("se rabat sur x-real-ip quand le mandataire ne pose que lui", async () => {
    const envois = intercepter();
    await POST(evenement({ "x-real-ip": "198.51.100.4" }), contexte);
    expect(envois[0].entetes.get("x-forwarded-for")).toBe("198.51.100.4");
    expect(envois[0].entetes.get("x-real-ip")).toBeNull();
  });

  it("n'invente aucune adresse quand la requête n'en porte pas", async () => {
    const envois = intercepter();
    await POST(evenement({}), contexte);
    expect(envois[0].entetes.get("x-forwarded-for")).toBeNull();
  });
});
