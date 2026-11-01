import { describe, expect, test } from "bun:test";
import { duree, homeContent } from "./home.ts";
import { siteConfig } from "./site.ts";
import { uiLabels } from "./ui.ts";
import { euros, prestation, prixPlancher, repereAgenceLogiciel } from "./offre.ts";

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

  test("l'ordre des sections est celui de la page d'origine, décision du 2026-11-01", () => {
    expect(ordre).toEqual([
      "hero",
      "about",
      "showreel",
      "works",
      "numbers",
      "logiciel",
      "moyens",
      "whyUs",
      "faq",
      "articles",
    ]);
    expect(new Set(ordre).size).toBe(ordre.length);
    // « works » se rend depuis `featuredWorkSlugs`, les autres depuis leur clef.
    for (const section of ordre.filter((nom) => nom !== "works")) {
      expect(homeContent[section], `la section « ${section} » n'a pas de contenu`).toBeDefined();
    }
    expect(homeContent.featuredWorkSlugs.length).toBeGreaterThan(0);
  });

  test("l'accueil ne liste aucun métier : il parle à chacun sans le citer", () => {
    expect(ordre).not.toContain("metiers");
    expect(JSON.stringify(homeContent.hero)).not.toContain("/logiciel-metier/");
  });

  test("le chiffre Würth n'est plus dans le héros", () => {
    expect(homeContent.hero.proofs ?? []).toHaveLength(0);
    expect(JSON.stringify(homeContent.hero)).not.toContain("Würth");
  });

  test("le héros compare les prix à livrable égal, sourcé", () => {
    const comparaison = homeContent.hero.comparison;
    const [agence, moi] = comparaison?.lignes ?? [];
    expect(comparaison?.sujet).toMatch(/premier outil/u);
    // Les deux bornes de l'agence sont écrites (8 000 à 10 000 €), jamais une
    // médiane seule.
    expect(agence?.prix).toContain(euros(repereAgenceLogiciel.premierOutilMax));
    expect(agence?.prix).toContain(euros(repereAgenceLogiciel.premierOutilMin).replace(/\s€$/u, ""));
    expect(agence?.prix).not.toContain(euros(repereAgenceLogiciel.mediane));
    expect(moi?.prix).toContain(prixPlancher(prestation("logiciel")));
    expect(moi?.fort).toBe(true);
    expect(comparaison?.source.href).toBe(repereAgenceLogiciel.source.href);
    expect(prestation("logiciel").plancher).toBeLessThan(repereAgenceLogiciel.premierOutilMin);
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
    expect(homeContent.logiciel?.cta.href).toBe("#moyens");
  });

  test("trois moyens rendent le temps, sans aucun nom de prospect", () => {
    const { moyens } = homeContent;
    expect(moyens.lignes.map((l) => l.lien.href)).toContain("/services/logiciel-metier");
    expect(moyens.lignes).toHaveLength(3);
    expect(moyens.etapes).toHaveLength(4);
    expect(JSON.stringify(moyens).toLowerCase()).not.toContain("sitpo");
  });

  test("chaque tâche de la démonstration montre son remède", () => {
    const remedes = new Set(homeContent.logiciel.demo.taches.map((t) => t.moyen));
    expect(remedes.size).toBe(2);
  });

  test("la démonstration montre un gain dérivé de ses hypothèses, jamais écrit à la main", () => {
    const demo = homeContent.logiciel?.demo;
    expect(demo?.taches).toHaveLength(6);
    expect(Math.max(...demo.taches.map((t) => t.part))).toBe(1);
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

  test("le titre du héros est une seule porte, vers l'offre unique", () => {
    const portes = homeContent.hero.doors ?? [];
    expect(portes.map((porte) => porte.href)).toEqual(["/services/logiciel-metier"]);
    expect(homeContent.hero.title).toBe("Je vous rends des heures.");
    expect(homeContent.hero.titleLines?.join(" ")).toBe(homeContent.hero.title);
    expect(portes[0]?.price).toContain(prixPlancher(prestation("logiciel")));
    expect(homeContent.about.title).not.toBe(homeContent.hero.title);
    expect(homeContent.about.titleLines?.join(" ")).toBe(homeContent.about.title);
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

describe("la marche « Prestations » des fils d'Ariane", () => {
  test("mène à une section qui existe sur l'accueil", async () => {
    const { readFileSync } = await import("node:fs");
    const heros = readFileSync(new URL("../components/sections/HeroSection.tsx", import.meta.url), "utf8");
    // `/#services` : l'accordéon a quitté l'accueil, l'ancre vit sur les portes.
    expect(heros).toContain('id="services"');
    expect(homeContent.sectionOrder).toContain("hero");
  });
});
