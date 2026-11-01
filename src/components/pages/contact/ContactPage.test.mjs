import { afterEach, describe, expect, it } from "bun:test";

import { BlocContact } from "@/components/layout/BlocContact";
import { Footer } from "@/components/layout";
import { FaqSection } from "@/components/sections/FaqSection";
import { contactContent } from "@/content/contact";
import { siteConfig } from "@/content/site";
import { ContactPage } from "./ContactPage";

function elements(noeud, liste = []) {
  if (Array.isArray(noeud)) noeud.forEach((enfant) => elements(enfant, liste));
  else if (noeud && typeof noeud === "object" && noeud.props) {
    liste.push(noeud);
    elements(noeud.props.children, liste);
  }
  return liste;
}

/** Le héros de la page, composant enfant exécuté une fois. */
async function heros() {
  const liste = elements(await ContactPage());
  const main = liste.find((element) => element.type === "main");
  const [hero] = main.props.children;
  return hero.type(hero.props);
}

describe("page Contact", () => {
  const person = contactContent.contactCard.person;

  afterEach(() => {
    contactContent.contactCard.person = person;
  });

  it("met le formulaire dans le héros, puis la FAQ, et un seul formulaire", async () => {
    const liste = elements(await ContactPage());
    expect(liste.some((element) => element.type === FaqSection)).toBe(true);
    const pied = liste.find((element) => element.type === Footer);
    expect(pied.props.sansFormulaire).toBe(true);
    expect(elements(await heros()).some((element) => element.type === BlocContact)).toBe(true);
  });

  it("reçoit les liens #rendez-vous au-dessus du formulaire", async () => {
    expect(elements(await heros()).some((element) => element.props.id === "rendez-vous")).toBe(true);
  });

  it("dit la phrase, donne le visage, le téléphone et l'adresse", async () => {
    const hero = await heros();
    const liste = elements(hero);
    const liens = liste.filter((element) => element.type === "a").map((element) => element.props.href);
    expect(liens).toContain("tel:0632213711");
    expect(liens).toContain(`mailto:${siteConfig.contact.email}`);
    const titre = liste.find((element) => element.type === "h1");
    expect(titre.props.children).toBe("Montrez-moi ce qui vous bloque.");
    expect(contactContent.hero.subtitle).toBe("Si ce projet n’est pas pour moi, je vous le dis.");
  });

  it("a retiré le titre « Contact. » et n'annonce aucun faux client", () => {
    expect(JSON.stringify(contactContent)).not.toContain("Contact.\"");
  });

  it("se passe du portrait ou du rôle quand ils manquent", async () => {
    contactContent.contactCard.person = { name: person.name };
    const liste = elements(await heros());
    expect(liste.some((element) => String(element.props.className).includes("aspect-[136/167]"))).toBe(false);
  });
});
