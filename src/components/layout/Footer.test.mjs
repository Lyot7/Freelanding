import { afterEach, describe, expect, it } from "bun:test";

import { siteConfig } from "@/content/site";
import { BlocContact } from "./BlocContact";
import { decouperAutour, Footer } from "./Footer";

/**
 * Composant SERVEUR asynchrone sans hook : l'appeler directement exécute son
 * JSX (il lit lui-même `content.getSiteConfig()`). Couvre le commentaire mis à
 * jour après le retrait du bloc newsletter — `SocialGlyph` reste monté dans le
 * pied de page, seul endroit qui le consomme désormais.
 */
/** Cherche un élément dont les props portent `social`, sans boucler sur les cycles React. */
function trouveIconeSociale(noeud, vus = new WeakSet()) {
  if (noeud === null || typeof noeud !== "object") return false;
  if (vus.has(noeud)) return false;
  vus.add(noeud);
  if (noeud.props && typeof noeud.props === "object" && "social" in noeud.props) return true;
  const enfants = noeud.props?.children;
  if (Array.isArray(enfants)) return enfants.some((enfant) => trouveIconeSociale(enfant, vus));
  return trouveIconeSociale(enfants, vus);
}

/** Tous les éléments de l'arbre, sans exécuter les composants enfants. */
function elements(noeud, liste = []) {
  if (Array.isArray(noeud)) noeud.forEach((enfant) => elements(enfant, liste));
  else if (noeud && typeof noeud === "object" && noeud.props) {
    liste.push(noeud);
    elements(noeud.props.children, liste);
  }
  return liste;
}

describe("Footer", () => {
  it("monte toujours les glyphes sociaux exposés", async () => {
    const element = await Footer();
    expect(trouveIconeSociale(element)).toBe(true);
  });

  it("porte le formulaire, son ancre et le sujet de la page", async () => {
    const liste = elements(await Footer({ sujetRendezVous: "logiciel" }));
    const bloc = liste.find((element) => element.type === BlocContact);
    expect(bloc.props.sujetRendezVous).toBe("logiciel");
    expect(liste.some((element) => element.props.id === "rendez-vous")).toBe(true);
    expect(liste.some((element) => element.type === "h2")).toBe(true);
  });

  it("sur /contact, ne garde que la navigation : un seul formulaire sur la page", async () => {
    const element = await Footer({ sansFormulaire: true });
    const liste = elements(element);
    expect(liste.some((enfant) => enfant.type === BlocContact)).toBe(false);
    expect(liste.some((enfant) => enfant.props.id === "rendez-vous")).toBe(false);
    expect(liste.some((enfant) => enfant.type === "h2")).toBe(false);
    expect(trouveIconeSociale(element)).toBe(true);
  });
});

describe("Footer, données optionnelles", () => {
  const { contact, footerCta } = siteConfig;

  afterEach(() => {
    siteConfig.contact = contact;
    siteConfig.footerCta = footerCta;
  });

  const textes = (liste) =>
    liste.flatMap((element) => (typeof element.props.children === "string" ? [element.props.children] : []));

  it("montre tout ce que le site publie", async () => {
    const liste = elements(await Footer());
    expect(liste.some((element) => element.props.href?.startsWith("tel:"))).toBe(true);
    expect(textes(liste)).toContain(contact.responseTime);
    expect(textes(liste)).toContain(contact.address);
    expect(textes(liste)).toContain(footerCta.lettre.signataire);
  });

  it("retire sans laisser de trou ce que le site ne publie pas", async () => {
    siteConfig.contact = { ...contact, phone: "", responseTime: "", address: "" };
    siteConfig.footerCta = { ...footerCta, lettre: undefined };
    const liste = elements(await Footer());
    expect(liste.some((element) => element.props.href?.startsWith("tel:"))).toBe(false);
    expect(textes(liste)).not.toContain(contact.responseTime);
    expect(textes(liste)).not.toContain(contact.address);
    expect(textes(liste)).not.toContain(footerCta.lettre.signataire);
  });
});

describe("decouperAutour", () => {
  it("garde ce qui suit le fragment mis en avant", () => {
    expect(decouperAutour("Avant. Fort. Après.", "Fort.")).toEqual(["Avant. ", " Après."]);
  });

  it("rend tout le texte quand aucun fragment n'est donné", () => {
    expect(decouperAutour("Tout le texte.", "")).toEqual(["Tout le texte."]);
  });
});
