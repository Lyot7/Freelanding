import { afterEach, beforeEach, describe, expect, it } from "bun:test";

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

describe("Footer", () => {
  it("monte toujours les glyphes sociaux exposés", async () => {
    const element = await Footer();
    expect(trouveIconeSociale(element)).toBe(true);
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

/** Les listes `types` passées aux blocs de réservation, dans l'ordre de l'arbre. */
function listesDeTypes(noeud, vus = new WeakSet(), trouves = []) {
  if (noeud === null || typeof noeud !== "object" || vus.has(noeud)) return trouves;
  vus.add(noeud);
  if (Array.isArray(noeud)) {
    for (const enfant of noeud) listesDeTypes(enfant, vus, trouves);
    return trouves;
  }
  const props = noeud.props;
  if (!props || typeof props !== "object") return trouves;
  if (Array.isArray(props.types)) trouves.push(props.types.map((type) => type.id));
  for (const valeur of Object.values(props)) listesDeTypes(valeur, vus, trouves);
  return trouves;
}

describe("Footer — le point d'étape reste réservé aux clients", () => {
  let jetonAvant;
  beforeEach(() => {
    jetonAvant = process.env.RDV_TOKEN;
    process.env.RDV_TOKEN = "jeton-de-test";
  });
  afterEach(() => {
    if (jetonAvant === undefined) delete process.env.RDV_TOKEN;
    else process.env.RDV_TOKEN = jetonAvant;
  });

  it("sans sujet, aucun choix visible ne le propose", async () => {
    const listes = listesDeTypes(await Footer());
    expect(listes.length).toBeGreaterThan(0);
    // Le repli (sans lecture de l'URL) le cache ; `ReservationAvecSujet` reçoit
    // la liste entière et filtre elle-même selon `?sujet=`.
    expect(listes[0]).toEqual(["logiciel", "decouverte", "demonstration"]);
  });

  it("une page qui le demande l'ouvre seul", async () => {
    const listes = listesDeTypes(await Footer({ sujetRendezVous: "point-d-etape" }));
    expect(listes[0]).toEqual(["point-d-etape"]);
  });

  it("une page de prestation ne le montre pas", async () => {
    const listes = listesDeTypes(await Footer({ sujetRendezVous: "logiciel" }));
    expect(listes[0]).toEqual(["logiciel", "decouverte", "demonstration"]);
  });
});
