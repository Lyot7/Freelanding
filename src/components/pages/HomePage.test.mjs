import { afterEach, describe, expect, it } from "bun:test";

import { FaqSection } from "@/components/sections/FaqSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { LogicielSection } from "@/components/sections/LogicielSection";
import { homeContent } from "@/content/home";
import { HomePage } from "./HomePage";

/**
 * Composant SERVEUR asynchrone : l'appeler directement construit l'arbre de la
 * page sans exécuter ses sections. La section noire du logiciel suit le héros.
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
  const lectures = homeContent.lectures.slugs;

  afterEach(() => {
    homeContent.logiciel = logiciel;
  });

  it("rend la démonstration du logiciel avec la bande claire du bas", async () => {
    const sections = sectionsRendues(await HomePage());
    const cles = sections.map((section) => section.cle);
    expect(cles).not.toContain("methode");
    expect(cles).not.toContain("metiers");
    expect(cles).toEqual(homeContent.sectionOrder);

    const { element } = sections.find((section) => section.cle === "logiciel");
    expect(element.type).toBe(LogicielSection);
    expect(element.props.logiciel).toBe(logiciel);
    // Les trois moyens, sur fond clair, suivent : la bande claire les annonce.
    expect(element.props.bottomAccent).toBe("muted");
  });

  it("les lectures de la FAQ mènent aux guides mis en avant", async () => {
    const sections = sectionsRendues(await HomePage());
    const faq = sections.find((section) => section.cle === "faq");
    const lectures = faq.element.props.aside.props.children;
    expect(lectures[1]).toHaveLength(homeContent.lectures.slugs.length);
    expect(lectures[1][0].props.href).toBe(`/blog/${homeContent.lectures.slugs[0]}`);
    expect(lectures[2].props.href).toBe("/blog");
  });

  it("n'affiche pas un slug disparu", async () => {
    homeContent.lectures.slugs = ["article-disparu"];
    const sections = sectionsRendues(await HomePage());
    homeContent.lectures.slugs = lectures;
    const faq = sections.find((section) => section.cle === "faq");
    expect(faq.element.props.aside.props.children[1]).toHaveLength(0);
  });

  it("rend chaque section de l'ordre, héros d'abord", async () => {
    const sections = sectionsRendues(await HomePage());
    expect(sections.at(0).element.type).toBe(HeroSection);
    expect(sections.at(-1).element.type).toBe(FaqSection);
    expect(sections.every((section) => section.element !== null)).toBe(true);
  });

  it("rend une FAQ vide plutôt que de casser quand le contenu n'en a pas", async () => {
    const { faq } = homeContent;
    homeContent.faq = undefined;
    try {
      const sections = sectionsRendues(await HomePage());
      expect(sections.find((section) => section.cle === "faq").element.props.faq).toEqual([]);
    } finally {
      homeContent.faq = faq;
    }
  });

  it("n'en rend aucune quand le contenu n'a pas de logiciel", async () => {
    homeContent.logiciel = undefined;
    const sections = sectionsRendues(await HomePage());
    const { element } = sections.find((section) => section.cle === "logiciel");
    expect(element).toBeNull();
  });
});
