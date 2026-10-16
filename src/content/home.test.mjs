import { describe, expect, test } from "bun:test";
import { homeContent } from "./home.ts";
import { siteConfig } from "./site.ts";
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

  test("le chiffre Würth n'est plus dans le héros", () => {
    expect(homeContent.hero.proofs ?? []).toHaveLength(0);
    expect(JSON.stringify(homeContent.hero)).not.toContain("Würth");
  });

  test("le héros compare les prix à livrable égal, sourcé", () => {
    const comparaison = homeContent.hero.comparison;
    const [agence, moi] = comparaison?.lignes ?? [];
    expect(comparaison?.sujet).toMatch(/site vitrine soigné/u);
    // Les deux bornes de l'agence sont écrites, jamais une médiane seule.
    expect(agence?.prix).toContain(euros(repereAgenceSite.soigneMax));
    expect(agence?.prix).toContain(euros(repereAgenceSite.soigneMin).replace(/\s€$/u, ""));
    expect(moi?.prix).toContain(prixPlancher(prestation("vitrine")));
    expect(moi?.fort).toBe(true);
    expect(comparaison?.source.href).toBe(repereAgenceSite.source.href);
    expect(prestation("vitrine").plancher).toBeLessThan(repereAgenceSite.soigneMin);
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

  test("les offres ne sont pas redites sous le héros, chacune a sa section", () => {
    expect(ordre).not.toContain("services");
    expect(ordre.indexOf("showreel")).toBe(ordre.indexOf("about") + 1);
    expect(ordre).toContain("logiciel");
    expect(homeContent.logiciel?.cta.href).toBe("/services/logiciel-metier");
  });

  test("la démonstration du logiciel compte les étapes qui vous restent", () => {
    const demo = homeContent.logiciel?.demo;
    expect(demo?.main.every((etape) => !etape.auto)).toBe(true);
    expect(demo?.outil.filter((etape) => !etape.auto)).toHaveLength(1);
    expect(demo?.main).toHaveLength(demo?.outil.length ?? -1);
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
    const about = homeContent.about;
    const textes = [about.launchedLabel, about.projectsLabel, about.counter?.caption, ...about.body];
    for (const texte of textes) expect(texte ?? "").not.toMatch(/projet à la fois/u);
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
