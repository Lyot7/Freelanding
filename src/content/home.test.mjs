import { describe, expect, test } from "bun:test";
import { duree, homeContent } from "./home.ts";
import { siteConfig } from "./site.ts";
import { uiLabels } from "./ui.ts";
import { euros, repereAgenceLogiciel, SUR_DEVIS } from "./offre.ts";
import { lienRendezVous, rendezVousContent } from "./rendez-vous.ts";

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
    expect(ordre[0]).toBe("hero");
    expect(homeContent.logoBand?.logos.length).toBeGreaterThan(0);
  });

  test("l'ordre des sections : le temps rendu, le moyen, la preuve, l'homme, décision du 2026-11-01", () => {
    expect(ordre).toEqual(["hero", "logiciel", "moyens", "preuves", "confiance", "rencontre", "faq"]);
    expect(new Set(ordre).size).toBe(ordre.length);
    for (const section of ordre) {
      expect(homeContent[section], `la section « ${section} » n'a pas de contenu`).toBeDefined();
    }
  });

  test("l'accueil ne liste aucun métier : il parle à chacun sans le citer", () => {
    expect(ordre).not.toContain("metiers");
    expect(JSON.stringify(homeContent.hero)).not.toContain("/logiciel-metier/");
  });

  test("le chiffre Würth n'est plus dans le héros", () => {
    expect(homeContent.hero.proofs ?? []).toHaveLength(0);
    expect(JSON.stringify(homeContent.hero)).not.toContain("Würth");
  });

  test("le héros montre ce qu'une agence facture, sourcé", () => {
    const comparaison = homeContent.hero.comparison;
    const [agence, moi] = comparaison?.lignes ?? [];
    expect(comparaison?.sujet).toMatch(/logiciel métier/u);
    // Du premier outil à la médiane d'un projet, décision d'Eliott du 2026-11-01.
    expect(agence?.prix).toContain(euros(repereAgenceLogiciel.premierOutilMin));
    expect(agence?.detail).toContain(euros(repereAgenceLogiciel.mediane));
    expect(moi?.prix).toBe(SUR_DEVIS);
    expect(moi?.fort).toBe(true);
    expect(comparaison?.source.href).toBe(repereAgenceLogiciel.source.href);
  });

  test("la bande des logos dit qu'il s'agit d'employeurs, jamais de clients", () => {
    const titre = homeContent.logoBand?.title ?? "";
    expect(titre).toMatch(/développé chez/u);
    expect(titre).not.toMatch(/client|confiance|référence/iu);
    // Ni date ni mention de contrat : décision d'Eliott du 2026-09-02.
    expect(titre).not.toMatch(/\d|stage|alternance/iu);
  });

  test("la seule face volt arrive juste avant les dernières questions", () => {
    expect(ordre.indexOf("rencontre")).toBe(ordre.indexOf("faq") - 1);
  });

  test("aucun faux chiffre sur les preuves : seul Würth porte un résultat mesuré", () => {
    const { projets } = homeContent.preuves;
    expect(projets.map((p) => p.slug)).toEqual(["wurth-creation-de-compte", "kpsull"]);
    expect(projets.filter((p) => p.chiffre).map((p) => p.slug)).toEqual(["wurth-creation-de-compte"]);
    expect(projets[0].resume).toContain("mesuré");
  });

  test("les preuves ne présentent aucun employeur comme client", () => {
    const { preuves, confiance, rencontre } = homeContent;
    expect(JSON.stringify({ preuves, confiance, rencontre })).not.toMatch(/\bclients?\b/iu);
  });

  test("les offres ne sont pas redites sous le héros, chacune a sa section", () => {
    expect(ordre).not.toContain("services");
    expect(ordre.indexOf("logiciel")).toBe(ordre.indexOf("hero") + 1);
    // La section des moyens suit : l'action mène au rendez-vous, pas à la voisine.
    expect(homeContent.logiciel?.cta.href).toBe(lienRendezVous("logiciel"));
    expect(homeContent.hero.offerLink?.href).toBe("#logiciel");
  });

  test("trois moyens rendent le temps, sans aucun nom de prospect", () => {
    const { moyens } = homeContent;
    expect(moyens.lignes.map((l) => l.lien.href)).toContain("/services/automatisation#referent");
    expect(moyens.lignes).toHaveLength(3);
    expect(moyens.lignes.at(-1).corps).toContain("ponctuelles");
    const { hero, logiciel, preuves, confiance, rencontre } = homeContent;
    expect(JSON.stringify({ hero, logiciel, moyens, preuves, confiance, rencontre })).not.toContain(
      "/services/logiciel-metier",
    );
    expect(JSON.stringify(moyens).toLowerCase()).not.toContain("sitpo");
  });

  test("la semaine rend exactement le gain annoncé", () => {
    const { jours } = homeContent.logiciel.demo;
    expect(jours.map((j) => j.main)).toEqual([150, 180, 90, 120, 120].map(duree));
    expect(jours.map((j) => j.rendu)).toEqual([120, 144, 72, 96, 96].map(duree));
  });

  test("le héros dit ce qu'une agence facture et chiffre l'écart", () => {
    expect(homeContent.hero.eyebrow).toContain("agence");
    expect(homeContent.hero.comparison.lignes[0].detail).toContain("30");
  });

  test("la démonstration montre un gain dérivé de ses hypothèses, jamais écrit à la main", () => {
    const demo = homeContent.logiciel?.demo;
    expect(demo?.jours).toHaveLength(5);
    expect(Math.max(...demo.jours.map((j) => j.part))).toBe(1);
    expect(demo.compteur.main.valeur).toBe(duree(660));
    expect(demo.compteur.outil.valeur).toBe(duree(132));
    expect(demo.gain.valeur).toBe(duree(528));
    expect(demo.gain.detail).toContain("396 heures");
    expect(demo.note).toMatch(/exemple/iu);
  });

  test("une durée s'écrit en minutes, en heures, ou les deux", () => {
    expect(duree(36)).toBe("36\u00A0min");
    expect(duree(120)).toBe("2\u00A0h");
    expect(duree(132)).toBe("2\u00A0h\u00A012");
    expect(duree(65)).toBe("1\u00A0h\u00A005");
  });

  test("le titre du héros est un titre, ni lien ni prix", () => {
    const portes = homeContent.hero.doors ?? [];
    expect(portes).toHaveLength(1);
    expect(Object.keys(portes[0] ?? {})).toEqual(["lines"]);
    expect(homeContent.hero.title).toBe("Je vous rends des heures.");
    expect(homeContent.hero.titleLines?.join(" ")).toBe(homeContent.hero.title);
    expect(homeContent.about.title).not.toBe(homeContent.hero.title);
    expect(homeContent.rencontre.titleLines.join(" ")).toBe(homeContent.about.title);
  });

  test("« indispensable » n'est dit qu'une fois, dans le héros", () => {
    // Tout ce que l'accueil rend sous le héros.
    const { hero, logiciel, moyens, preuves, confiance, rencontre, faq } = homeContent;
    expect(hero.subtitle).toContain("indispensable");
    const reste = { logiciel, moyens, preuves, confiance, rencontre, faq };
    expect(JSON.stringify(reste)).not.toContain("indispensable");
  });

  test("la durée annoncée sous le bouton est celle du sujet ouvert par le bouton", () => {
    const logiciel = rendezVousContent.types.find((type) => type.id === "logiciel");
    expect(logiciel?.duree).toContain("30");
    expect(logiciel?.duree).toContain("60");
    expect(homeContent.hero.ctaNote).toMatch(/30 à 60\sminutes/u);
  });

  test("le héros dit ce qui explique le prix, sans montant", () => {
    const phrase = homeContent.hero.subtitleParagraphs?.[0]?.text ?? "";
    expect(phrase.toLowerCase()).not.toContain("prix ferme");
    expect(phrase).not.toMatch(/\d\s?000/u);
  });

  test("« jusqu'à deux fois moins cher » est parti avec le site vitrine", () => {
    // Seule la comparaison du site vitrine le rendait exact : le logiciel
    // s'approche du prix d'une agence sans le diviser par deux.
    const textes = [
      homeContent.hero.eyebrow,
      homeContent.seo.description,
      ...homeContent.about.body,
    ];
    for (const texte of textes) expect(texte ?? "").not.toMatch(/deux fois moins/iu);
  });

  test("« un chantier à la fois » n'est dit qu'une fois, par la confiance", () => {
    const { confiance, rencontre } = homeContent;
    const textes = [...rencontre.paragraphes, rencontre.citation, ...homeContent.about.body];
    for (const texte of textes) expect(texte).not.toMatch(/(projet|chantier) à la fois/u);
    expect(confiance.tuiles.map((t) => t.titre)).toContain("chantier à la fois");
  });
});

describe("un seul libellé pour le rendez-vous", () => {
  const libelle = uiLabels.services.rdvLabel;

  test("l'en-tête, le bouton flottant et « Pourquoi moi » disent le même mot", () => {
    expect(siteConfig.primaryCta.label.toLowerCase()).toBe(libelle.toLowerCase());
    expect(siteConfig.floatingCta?.label).toBe(libelle);
    expect(homeContent.confiance.cta.label).toBe(libelle);
    expect(homeContent.rencontre.cta.label).toBe(libelle);
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

describe("la marche « Prestations » des fils d'Ariane", () => {
  test("mène à une section qui existe sur l'accueil", async () => {
    const { readFileSync } = await import("node:fs");
    const heros = readFileSync(new URL("../components/sections/HeroSection.tsx", import.meta.url), "utf8");
    // `/#services` : l'accordéon a quitté l'accueil, l'ancre vit sur les portes.
    expect(heros).toContain('id="services"');
    expect(homeContent.sectionOrder).toContain("hero");
  });
});
