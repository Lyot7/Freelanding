import { describe, expect, it } from "bun:test";

/**
 * La valeur de secours doit se déclencher aussi sur une variable DÉCLARÉE MAIS
 * VIDE, pas seulement sur une variable absente : `.env.example` livre la ligne
 * `NEXT_PUBLIC_SITE_URL=` sans valeur, et `new URL(chemin, "")` lève
 * `TypeError: Invalid URL`, ce qui faisait tomber toute la page en 500.
 */
const FALLBACK = "http://localhost:3000";

async function chargerAvec(valeur) {
  const precedente = process.env.NEXT_PUBLIC_SITE_URL;
  if (valeur === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = valeur;
  // Chemin unique par cas : le registre de modules met le résultat en cache.
  const charge = await import(`./site-url.ts?cas=${encodeURIComponent(String(valeur))}`);
  if (precedente === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = precedente;
  return charge;
}

describe("SITE_URL", () => {
  it("retombe sur l'adresse locale quand la variable est absente", async () => {
    const { SITE_URL } = await chargerAvec(undefined);
    expect(SITE_URL).toBe(FALLBACK);
  });

  it("retombe sur l'adresse locale quand la variable est vide", async () => {
    const { SITE_URL } = await chargerAvec("");
    expect(SITE_URL).toBe(FALLBACK);
  });

  it("retombe sur l'adresse locale quand la variable n'a que des espaces", async () => {
    const { SITE_URL } = await chargerAvec("   ");
    expect(SITE_URL).toBe(FALLBACK);
  });

  it("retient la valeur fournie et construit une URL absolue", async () => {
    const { SITE_URL, absoluteUrl } = await chargerAvec(
      "https://www.eliottbouquerel.fr",
    );
    expect(SITE_URL).toBe("https://www.eliottbouquerel.fr");
    expect(absoluteUrl("/contact")).toBe(
      "https://www.eliottbouquerel.fr/contact",
    );
  });

  it("ne lève jamais sur absoluteUrl avec une variable vide", async () => {
    const { absoluteUrl } = await chargerAvec("");
    expect(absoluteUrl("/contact")).toBe(`${FALLBACK}/contact`);
  });
});
