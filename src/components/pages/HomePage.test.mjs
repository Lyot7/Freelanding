import { afterEach, describe, expect, it } from "bun:test";

import { LogicielSection } from "@/components/sections/LogicielSection";
import { homeContent } from "@/content/home";
import { HomePage } from "./HomePage";

/**
 * Composant SERVEUR asynchrone : l'appeler directement construit l'arbre de la
 * page sans exécuter ses sections. La section noire du logiciel a pris la
 * place de la méthode le 2026-10-16, entre les chiffres et « Pourquoi moi ».
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

  it("rend la démonstration du logiciel avec la bande claire du bas", async () => {
    const sections = sectionsRendues(await HomePage());
    const cles = sections.map((section) => section.cle);
    expect(cles).not.toContain("methode");
    expect(cles.indexOf("logiciel")).toBe(cles.indexOf("numbers") + 1);
    expect(cles.indexOf("whyUs")).toBe(cles.indexOf("logiciel") + 1);

    const { element } = sections.find((section) => section.cle === "logiciel");
    expect(element.type).toBe(LogicielSection);
    expect(element.props.logiciel).toBe(logiciel);
    expect(element.props.bottomAccent).toBe("muted");
  });

  it("n'en rend aucune quand le contenu n'a pas de logiciel", async () => {
    homeContent.logiciel = undefined;
    const sections = sectionsRendues(await HomePage());
    const { element } = sections.find((section) => section.cle === "logiciel");
    expect(element).toBeNull();
  });
});
