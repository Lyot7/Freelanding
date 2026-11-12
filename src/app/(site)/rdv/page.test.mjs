import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { rendezVousContent } from "@/content/rendez-vous";
import Rdv, { metadata } from "./page.tsx";

/**
 * LA PAGE `/rdv`, composant serveur asynchrone : l'appeler exécute son JSX.
 * On lit l'arbre obtenu (sans le rendre) pour savoir ce qu'il monte.
 */
const C = rendezVousContent;

/** Les éléments de l'arbre dont le type porte ce nom, sans boucler sur les cycles React. */
function elementsNommes(noeud, nom, vus = new WeakSet(), trouves = []) {
  if (noeud === null || typeof noeud !== "object" || vus.has(noeud)) return trouves;
  vus.add(noeud);
  if (typeof noeud.type === "function" && noeud.type.name === nom) trouves.push(noeud);
  const enfants = noeud.props?.children;
  for (const enfant of Array.isArray(enfants) ? enfants : [enfants]) elementsNommes(enfant, nom, vus, trouves);
  for (const [clef, valeur] of Object.entries(noeud.props ?? {})) {
    if (clef !== "children" && valeur && typeof valeur === "object") elementsNommes(valeur, nom, vus, trouves);
  }
  return trouves;
}

/** Tout le texte littéral de l'arbre. */
function texteDe(noeud, vus = new WeakSet()) {
  if (typeof noeud === "string") return noeud;
  if (noeud === null || typeof noeud !== "object" || vus.has(noeud)) return "";
  vus.add(noeud);
  const enfants = noeud.props?.children;
  return (Array.isArray(enfants) ? enfants : [enfants]).map((e) => texteDe(e, vus)).join(" ");
}

describe("page /rdv", () => {
  let jetonAvant;
  beforeEach(() => {
    jetonAvant = process.env.RDV_TOKEN;
  });
  afterEach(() => {
    if (jetonAvant === undefined) delete process.env.RDV_TOKEN;
    else process.env.RDV_TOKEN = jetonAvant;
  });

  it("monte le formulaire quand le cockpit est configuré, et le pied de page sans formulaire", async () => {
    process.env.RDV_TOKEN = "jeton-de-test";
    const arbre = await Rdv();
    const formulaires = elementsNommes(arbre, "ReservationAvecSujet");
    expect(formulaires).toHaveLength(1);
    expect(Boolean(formulaires[0].props.client)).toBe(false);
    expect(formulaires[0].props.types.length).toBeGreaterThan(0);
    expect(elementsNommes(arbre, "Footer")[0].props.sansFormulaire).toBe(true);
  });

  it("dit que la réservation est indisponible quand le cockpit n'est pas configuré", async () => {
    delete process.env.RDV_TOKEN;
    const arbre = await Rdv();
    expect(elementsNommes(arbre, "ReservationAvecSujet")).toHaveLength(0);
    expect(texteDe(arbre)).toContain(C.creneaux.indisponible);
  });

  it("a un titre propre", () => {
    expect(JSON.stringify(metadata.title)).toContain("Eliott Bouquerel");
    expect(metadata.description.length).toBeGreaterThan(20);
  });
});
