import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { contentRoutes } from "./routes.ts";

/**
 * AUCUNE URL NE CASSE (passage à une seule offre, 2026-10-31). Chaque page retirée
 * redirige en 301 vers une page qui existe, sans chaîne de redirections.
 */
const source = readFileSync("next.config.ts", "utf8");
const regles = [...source.matchAll(/source: "([^"]+)",\s*destination: "([^"]+)",\s*statusCode: (\d+)/gu)].map(
  ([, origine, destination, code]) => ({ origine, destination, code }),
);

const RETIREES = [
  ["/services/site-vitrine", "/services/logiciel-metier"],
  ["/services/site-vitrine/prix", "/services/logiciel-metier/prix"],
  ["/services/site-vitrine/artisans", "/logiciel-metier"],
  ["/creation-site-internet-caen", "/logiciel-sur-mesure-caen"],
  ["/services/cto-referent-ia", "/services/automatisation"],
  ["/services/logiciel-metier/transport", "/logiciel-metier/transport-routier"],
];

describe("les pages retirées redirigent en 301", () => {
  const routes = new Set(contentRoutes.map((r) => r.pathname));

  for (const [origine, destination] of RETIREES) {
    test(`${origine} mène à ${destination}, qui existe`, () => {
      const regle = regles.find((r) => r.origine === origine);
      expect(regle?.destination).toBe(destination);
      expect(regle?.code).toBe("301");
      expect(routes.has(destination)).toBe(true);
      expect(routes.has(origine)).toBe(false);
    });
  }

  test("aucune redirection n'en enchaîne une autre", () => {
    const origines = new Set(regles.map((r) => r.origine));
    for (const regle of regles) expect(origines.has(regle.destination)).toBe(false);
  });
});

describe("un seul lien de premier rendez-vous : /rdv", () => {
  test("/rdv/logiciel renvoie définitivement (301) vers /rdv?sujet=logiciel", () => {
    const regle = regles.find((r) => r.origine === "/rdv/logiciel");
    expect(regle?.destination).toBe("/rdv?sujet=logiciel");
    expect(regle?.code).toBe("301");
  });

  test("/rdv est une page, jamais une redirection", () => {
    expect(regles.some((r) => r.origine === "/rdv")).toBe(false);
    expect(contentRoutes.some((r) => r.pathname === "/rdv")).toBe(true);
  });

  test("la démonstration et le point d'étape gardent leur lien et ouvrent /rdv/client (307)", () => {
    for (const sujet of ["demonstration", "point-d-etape"]) {
      const regle = regles.find((r) => r.origine === `/rdv/${sujet}`);
      expect(regle?.destination).toBe(`/rdv/client?sujet=${sujet}`);
      expect(regle?.code).toBe("307");
    }
  });
});

describe("les redirections de next.config.ts", () => {
  test("/rdv/logiciel garde son sujet, en permanent", async () => {
    const { default: config } = await import("../../next.config.ts");
    const redirections = await config.redirects();
    const vers = (origine) => redirections.find((r) => r.source === origine);
    expect(vers("/rdv/logiciel")).toEqual({
      source: "/rdv/logiciel",
      destination: "/rdv?sujet=logiciel",
      statusCode: 301,
    });
    expect(vers("/rdv")).toBeUndefined();
    for (const sujet of ["demonstration", "point-d-etape"]) {
      expect(vers(`/rdv/${sujet}`)).toEqual({
        source: `/rdv/${sujet}`,
        destination: `/rdv/client?sujet=${sujet}`,
        statusCode: 307,
      });
    }
  });
});
