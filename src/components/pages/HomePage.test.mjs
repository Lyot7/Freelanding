import { afterEach, describe, expect, it } from "bun:test";

import { LogicielSection } from "@/components/sections/LogicielSection";
import { MetiersSection } from "@/components/sections/MetiersSection";
import { homeContent } from "@/content/home";
import { pagesHub } from "@/content/metiers";
import { HomePage } from "./HomePage";

/**
 * Composant SERVEUR asynchrone : l'appeler directement construit l'arbre de la
 * page sans exécuter ses sections. Depuis le 2026-10-31, la section noire du
 * logiciel suit le héros, et la section des métiers la suit.
 */
function sectionsRendues(arbre) {
  const racine = Array.isArray(arbre.props.children) ? arbre.props.children : [arbre.props.children];
  const main = racine.find((enfant) => enfant?.type === "main");
  return main.props.children.map((fragment) => ({
    cle: fragment.key,
    element: fragment.props.children,
  }));
}

describe("HomePage, section du logiciel", () => {
  const logiciel = homeContent.logiciel;

  afterEach(() => {
    homeContent.logiciel = logiciel;
  });

  it("rend la démonstration du logiciel juste après le héros, sans bande claire", async () => {
    const sections = sectionsRendues(await HomePage());
    const cles = sections.map((section) => section.cle);
    expect(cles).not.toContain("methode");
    expect(cles).toEqual(homeContent.sectionOrder);
    expect(cles.indexOf("logiciel")).toBe(cles.indexOf("hero") + 1);
    expect(cles.indexOf("metiers")).toBe(cles.indexOf("logiciel") + 1);

    const { element } = sections.find((section) => section.cle === "logiciel");
    expect(element.type).toBe(LogicielSection);
    expect(element.props.logiciel).toBe(logiciel);
    // La section des métiers, noire, suit : aucune bande claire en bas.
    expect(element.props.bottomAccent).toBeUndefined();
  });

  it("rend la section des métiers avec la liste du hub", async () => {
    const sections = sectionsRendues(await HomePage());
    const { element } = sections.find((section) => section.cle === "metiers");
    expect(element.type).toBe(MetiersSection);
    expect(element.props.metiers).toBe(homeContent.metiers);
    expect(element.props.entrees).toBe(pagesHub);
    expect(pagesHub.length).toBeGreaterThan(0);
  });

  it("n'en rend aucune quand le contenu n'a pas de logiciel", async () => {
    homeContent.logiciel = undefined;
    const sections = sectionsRendues(await HomePage());
    const { element } = sections.find((section) => section.cle === "logiciel");
    expect(element).toBeNull();
  });
});
