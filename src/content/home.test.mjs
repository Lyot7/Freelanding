import { describe, expect, test } from "bun:test";
import { homeContent } from "./home.ts";
import { packEntree, prixPack } from "./offre.ts";
import { siteConfig } from "./site.ts";
import { uiLabels } from "./ui.ts";

/**
 * L'ACCUEIL, ce que la relecture d'écran ne garde pas.
 *
 * L'ordre des sections et le libellé du rendez-vous ont été décidés par un
 * panel design le 2026-09-24 (phase C). Ils se défont sans bruit : une section
 * déplacée ou un bouton renommé ne casse ni les types ni le rendu.
 */
describe("accueil", () => {
  const ordre = homeContent.sectionOrder;

  test("la bande des logos suit directement le héros", () => {
    expect(ordre.slice(0, 3)).toEqual(["hero", "logoBand", "about"]);
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

  test("les prestations suivent le h1", () => {
    expect(ordre.indexOf("services")).toBe(ordre.indexOf("about") + 1);
  });

  test("le héros annonce le plus bas des prix d'entrée, lu dans l'offre", () => {
    const plancher = [packEntree("vitrine"), packEntree("logiciel")].reduce(
      (bas, pack) => (pack.prix < bas.prix ? pack : bas),
    );
    const phrase = homeContent.hero.subtitleParagraphs?.[0]?.text ?? "";
    expect(phrase).toContain(prixPack(plancher));
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
