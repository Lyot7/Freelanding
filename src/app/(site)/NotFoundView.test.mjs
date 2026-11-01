import { describe, expect, it } from "bun:test";

import { FloatingNav, Footer, Header } from "@/components/layout";
import { FaqSection } from "@/components/sections/FaqSection";
import { content } from "@/lib/content";
import { NotFoundView } from "./NotFoundView";

/** Tous les éléments de l'arbre, sans exécuter les composants enfants. */
function elements(noeud, liste = []) {
  if (Array.isArray(noeud)) noeud.forEach((enfant) => elements(enfant, liste));
  else if (noeud?.props) {
    liste.push(noeud);
    elements(noeud.props.children, liste);
  }
  return liste;
}

describe("NotFoundView", () => {
  it("garde le site autour du 404 : en-tête, dock, FAQ et pied de page", async () => {
    const liste = elements(await NotFoundView());
    for (const composant of [Header, FloatingNav, FaqSection, Footer]) {
      expect(liste.some((element) => element.type === composant)).toBe(true);
    }
  });

  it("lit ses textes dans la donnée, découpés comme elle les découpe", async () => {
    const notFound = await content.getNotFound();
    const liste = elements(await NotFoundView());
    const titre = liste.find((element) => element.type === "h1");
    expect(titre.props.children).toContain(notFound.titleLines[0]);
    expect(titre.props.children).toContain(notFound.titleLines[1]);
    expect(liste.some((element) => element.props.href === notFound.backLink.href)).toBe(true);
    expect(liste.some((element) => element.props.children === notFound.errorLabel)).toBe(true);
  });
});
