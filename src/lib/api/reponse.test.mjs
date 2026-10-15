import { afterEach, describe, expect, test } from "bun:test";
import { origineEtrangere } from "./reponse.ts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL;

function requete(url, entetes) {
  return new Request(url, { method: "POST", headers: entetes });
}

describe("origineEtrangere", () => {
  afterEach(() => {
    if (SITE === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = SITE;
  });

  test("accepte le site derrière un proxy, quand l'URL porte l'hôte interne", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://eliottbouquerel.fr";
    const r = requete("http://a4w8c0c0:3000/api/contact", {
      origin: "https://eliottbouquerel.fr",
      host: "a4w8c0c0:3000",
    });
    expect(origineEtrangere(r)).toBe(false);
  });

  test("accepte l'hôte transmis par le proxy", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const r = requete("http://0.0.0.0:3000/api/contact", {
      origin: "https://exemple.fr",
      "x-forwarded-host": "exemple.fr",
    });
    expect(origineEtrangere(r)).toBe(false);
  });

  test("accepte la variante www du site déclaré", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://eliottbouquerel.fr";
    const r = requete("http://interne:3000/api/contact", { origin: "https://www.eliottbouquerel.fr" });
    expect(origineEtrangere(r)).toBe(false);
  });

  test("accepte le domaine nu quand le site est déclaré en www", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.exemple.fr";
    const r = requete("http://interne:3000/api/contact", { origin: "https://exemple.fr" });
    expect(origineEtrangere(r)).toBe(false);
  });

  test("refuse un autre site", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://eliottbouquerel.fr";
    const r = requete("http://interne:3000/api/contact", {
      origin: "https://pirate.example",
      host: "interne:3000",
    });
    expect(origineEtrangere(r)).toBe(true);
  });

  test("refuse une origine illisible, laisse passer une requête sans origine", () => {
    expect(origineEtrangere(requete("http://interne/api", { origin: "::" }))).toBe(true);
    expect(origineEtrangere(requete("http://interne/api", {}))).toBe(false);
  });
});
