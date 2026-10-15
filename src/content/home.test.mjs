import { describe, expect, test } from "bun:test";
import { homeContent } from "./home.ts";
import { siteConfig } from "./site.ts";
import { howWeDoItStats } from "./stats.ts";
import { uiLabels } from "./ui.ts";
import { euros, prestation, prixPlancher, repereAgenceSite } from "./offre.ts";

/**
 * L'ACCUEIL, ce que la relecture d'écran ne garde pas.
 *
 * L'ordre des sections et le libellé du rendez-vous ont été décidés par un
 * panel design le 2026-09-24 (phase C). Ils se défont sans bruit : une section
 * déplacée ou un bouton renommé ne casse ni les types ni le rendu.
 */
describe("accueil", () => {
  const ordre = homeContent.sectionOrder;

  test("les logos vivent dans le héros, plus dans une section à part", () => {
    expect(ordre).not.toContain("logoBand");
    expect(ordre.slice(0, 2)).toEqual(["hero", "about"]);
    expect(homeContent.logoBand?.logos.length).toBeGreaterThan(0);
  });

  test("la première preuve du héros est le chiffre Würth de la section chiffres", () => {
    const stat = howWeDoItStats.find((s) => s.label.includes("Würth"));
    const preuve = homeContent.hero.proofs?.[0];
    expect(stat).toBeDefined();
    expect(preuve?.label).toBe(stat?.label);
    expect(preuve?.value).toBe(`${stat?.prefix}${stat?.value}\u202F${stat?.suffix}`);
    expect(preuve?.href).toBe("/realisations/wurth-creation-de-compte");
  });

  test("la comparaison avec les agences est calculée et sourcée", () => {
    const preuve = homeContent.hero.proofs?.[1];
    const part = Math.round((prestation("vitrine").plancher / repereAgenceSite.mediane) * 100);
    expect(preuve?.value).toBe(`${part}\u202F%`);
    expect(preuve?.label).toContain(euros(repereAgenceSite.mediane));
    expect(preuve?.source?.href).toBe(repereAgenceSite.source.href);
    // « Jusqu'à deux fois moins cher » n'est vrai que tant que le site
    // d'entrée vaut au plus la moitié de la médiane d'agence.
    expect(part).toBeLessThanOrEqual(50);
  });

  test("aucune preuve ne présente une entreprise comme cliente", () => {
    for (const preuve of homeContent.hero.proofs ?? []) {
      expect(preuve.label.toLowerCase()).not.toContain("client");
    }
  });

  test("la bande des logos ne porte aucun intitulé qui en ferait des clients", () => {
    expect(homeContent.logoBand?.title).toBeUndefined();
  });

  test("les deux sections à cartes noires ne se suivent pas", () => {
    const chiffres = ordre.indexOf("numbers");
    const pourquoi = ordre.indexOf("whyUs");
    expect(chiffres).toBeGreaterThan(-1);
    expect(pourquoi).toBeGreaterThan(-1);
    expect(Math.abs(chiffres - pourquoi)).toBeGreaterThan(1);
  });

  test("les prestations suivent la section About", () => {
    expect(ordre.indexOf("services")).toBe(ordre.indexOf("about") + 1);
  });

  test("le titre du héros est fait des deux portes, chacune vers sa prestation", () => {
    const portes = homeContent.hero.doors ?? [];
    expect(portes.map((porte) => porte.href)).toEqual([
      "/services/site-vitrine",
      "/services/logiciel-metier",
    ]);
    expect(homeContent.hero.title).toBe(
      "Un site qui vous ramène des clients. Un outil qui vous rend des heures.",
    );
    expect(homeContent.hero.titleLines?.join(" ")).toBe(homeContent.hero.title);
    expect(portes[0]?.price).toContain(prixPlancher(prestation("vitrine")));
    expect(portes[1]?.price).toContain(prixPlancher(prestation("logiciel")));
    expect(homeContent.about.title).not.toBe(homeContent.hero.title);
    expect(homeContent.about.titleLines?.join(" ")).toBe(homeContent.about.title);
  });

  test("le héros dit ce qui explique le prix, sans montant", () => {
    const phrase = homeContent.hero.subtitleParagraphs?.[0]?.text ?? "";
    expect(phrase.toLowerCase()).not.toContain("prix ferme");
    expect(phrase).not.toMatch(/\d\s?000/u);
  });

  test("« 1 projet à la fois » n'est dit qu'une fois, par la section chiffres", () => {
    expect(homeContent.about.counter).toBeUndefined();
    expect(homeContent.about.launchedLabel).toBeUndefined();
  });
});

describe("un seul libellé pour le rendez-vous", () => {
  const libelle = uiLabels.services.rdvLabel;

  test("l'en-tête, le bouton flottant et « Pourquoi moi » disent le même mot", () => {
    expect(siteConfig.primaryCta.label.toLowerCase()).toBe(libelle.toLowerCase());
    expect(siteConfig.floatingCta?.label).toBe(libelle);
    expect(homeContent.whyUs.ctas?.[0]?.label).toBe(libelle);
  });

  test("« Démarrer un projet » ne revient pas comme libellé d'action", () => {
    const libelles = [
      siteConfig.primaryCta.label,
      siteConfig.primaryCta.shortLabel ?? "",
      siteConfig.floatingCta?.label ?? "",
    ];
    for (const l of libelles) expect(l.toLowerCase()).not.toContain("démarrer");
  });
});
