import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { aboutContent } from "@/content/about";
import { AboutParcours } from "./AboutPage";
// Fichier de types seuls : importé pour que la mesure de couverture le voie
// (les champs `apport` et `domaines` y sont déclarés).
import "@/lib/content/types";

/**
 * LA FORMATION DÉTAILLÉE (2026-10-16) : chaque diplôme dit son niveau, ce
 * qu'il a apporté et ses domaines ; une expérience sans ces champs garde sa
 * ligne courte, sans paragraphe ni étiquette vides.
 */
describe("parcours de la page À propos", () => {
  const parcours = aboutContent.parcours;
  if (!parcours) throw new Error("parcours absent de about.ts");
  const html = renderToStaticMarkup(createElement(AboutParcours, { parcours }));
  const formation = parcours.groupes.find((g) => g.titre === "Formation");
  const experience = parcours.groupes.find((g) => g.titre === "Expérience");

  it("annonce Bac+5 puis Bac+3, du plus récent au plus ancien", () => {
    const niveaux = formation?.etapes.map((etape) => etape.nature);
    expect(niveaux).toEqual(["Bac+5", "Bac+3"]);
    expect(html.indexOf("MyDigitalSchool")).toBeLessThan(html.indexOf("IUT de Saint-Lô"));
  });

  it("rend l'apport et chaque domaine des formations", () => {
    for (const etape of formation?.etapes ?? []) {
      expect(etape.apport).toBeTruthy();
      expect(html).toContain(etape.apport ?? "");
      expect(etape.domaines?.length).toBeGreaterThan(0);
      for (const domaine of etape.domaines ?? []) expect(html).toContain(`>${domaine}</li>`);
    }
    expect(html).toContain(">DevOps</li>");
    expect(html).toContain(">Expérience utilisateur</li>");
  });

  it("ne pose aucune ligne vide sous une étape sans lieu", () => {
    const groupes = parcours.groupes.map((groupe) => ({
      ...groupe,
      etapes: groupe.etapes.map((etape) => ({ ...etape, lieu: undefined })),
    }));
    const sansLieu = renderToStaticMarkup(
      createElement(AboutParcours, { parcours: { ...parcours, groupes } }),
    );
    const lignes = (rendu) => rendu.match(/<p class="m-0 micro text-background\/60">/g) ?? [];
    expect(lignes(html)).toHaveLength(parcours.groupes.flatMap((g) => g.etapes).length);
    expect(lignes(sansLieu)).toHaveLength(0);
  });

  it("ne pose ni paragraphe ni liste vides sur une expérience", () => {
    const sansDetail = experience?.etapes.filter((e) => !e.apport && !e.domaines) ?? [];
    expect(sansDetail.length).toBe(experience?.etapes.length);
    const listes = html.match(/<ul\b/g) ?? [];
    expect(listes).toHaveLength(formation?.etapes.length ?? -1);
  });
});
