import { describe, expect, it } from "bun:test";

import { RouteTheme, metadataTheme } from "@/components/pages/services/RouteTheme";
import { ctoReferentIA } from "@/content/offre";
import { pageCto } from "@/content/page-cto";
import Page, { generateMetadata } from "./page";

/**
 * `/services/cto-referent-ia` ne fait que nommer sa page thématique : la balise
 * `<head>` et le rendu viennent de `RouteTheme`. Ce test vérifie le nom, puis
 * traverse `RouteTheme` jusqu'au JSON-LD pour l'offre mensuelle.
 */
describe("route /services/cto-referent-ia", () => {
  it("pose les métadonnées de la page CTO", () => {
    const meta = generateMetadata();
    expect(meta).toEqual(metadataTheme("cto-referent-ia"));
    expect(JSON.stringify(meta)).toContain(pageCto.seo.titre);
  });

  it("rend la page thématique CTO", () => {
    const element = Page();
    expect(element.type).toBe(RouteTheme);
    expect(element.props.id).toBe("cto-referent-ia");
  });

  it("déclare dans le JSON-LD un prix mensuel, pas le prix d'un projet", async () => {
    const arbre = await RouteTheme({ id: "cto-referent-ia" });
    const [jsonLd] = arbre.props.children;
    const service = jsonLd.props.data["@graph"].find((n) => n["@type"] === "Service");
    const prix = service.offers.priceSpecification;
    expect(prix["@type"]).toBe("UnitPriceSpecification");
    expect(prix.unitCode).toBe("MON");
    expect(prix.minPrice).toBe(ctoReferentIA.plancher);
  });
});
