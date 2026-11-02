import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GestionRendezVous } from "@/components/rendez-vous/GestionRendezVous";
import { rendezVousContent } from "@/content/rendez-vous";
import GererRendezVous, { dynamic, metadata } from "./page.tsx";

/**
 * LA PAGE `/rdv/gerer/[jeton]`, lue côté serveur à chaque visite. Le cockpit
 * est simulé (fetch) : selon ce qu'il rend, la page montre les actions, un
 * état (annulé, déplacé, passé, lien inconnu) ou l'indisponibilité, et ne
 * montre le détail du rendez-vous que quand elle l'a lu.
 */

const G = rendezVousContent.gestion;
const JETON = "f".repeat(43);
const VARIABLES = { RDV_TOKEN: "jeton-de-test", COCKPIT_URL: "https://cockpit-page.test" };
const avant = {};
const fetchOriginal = globalThis.fetch;

beforeAll(() => {
  for (const [clef, valeur] of Object.entries(VARIABLES)) {
    avant[clef] = process.env[clef];
    process.env[clef] = valeur;
  }
});
afterAll(() => {
  for (const [clef, valeur] of Object.entries(avant)) {
    if (valeur === undefined) delete process.env[clef];
    else process.env[clef] = valeur;
  }
});
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

const RDV = {
  type: "logiciel",
  titre: "Explique-moi ton projet de logiciel",
  duree: 45,
  durees: [30, 45, 60],
  // Un mardi, 10 h à Paris (heure d'hiver).
  debut: "2030-03-12T09:00:00.000Z",
  fin: "2030-03-12T09:45:00.000Z",
  statut: "CONFIRME",
};

function simuler(reponse) {
  const appels = [];
  globalThis.fetch = async (url) => {
    appels.push(String(url));
    if (reponse instanceof Error) throw reponse;
    const [corps, statut = 200] = reponse;
    return new Response(JSON.stringify(corps), { status: statut });
  };
  return appels;
}

/** Premier élément de l'arbre rendu par la page qui satisfait `test`. */
function trouver(noeud, test) {
  if (Array.isArray(noeud)) {
    for (const enfant of noeud) {
      const trouve = trouver(enfant, test);
      if (trouve) return trouve;
    }
    return undefined;
  }
  if (!isValidElement(noeud)) return undefined;
  if (test(noeud)) return noeud;
  return trouver(noeud.props.children, test);
}

const routeur = { replace() {}, push() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };

/** La page pour ce jeton : l'arbre, et le HTML de son contenu principal. */
async function ouvrir(jeton = JETON) {
  const arbre = await GererRendezVous({ params: Promise.resolve({ jeton }) });
  const section = trouver(arbre, (element) => element.type === "section");
  const html = renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: routeur }, section));
  return { arbre, html };
}

describe("/rdv/gerer/[jeton]", () => {
  it("n’est ni indexée, ni mise en cache, ni transmise en référent", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.referrer).toBe("no-referrer");
    expect(dynamic).toBe("force-dynamic");
  });

  it("montre le rendez-vous à venir et ses actions", async () => {
    const appels = simuler([RDV]);
    const { arbre, html } = await ouvrir();
    expect(appels).toEqual([`https://cockpit-page.test/api/rdv/gestion/${JETON}`]);
    expect(html).toContain(RDV.titre);
    expect(html).toContain("mardi 12 mars à 10:00");
    expect(html).toContain(rendezVousContent.creneaux.duree(45));
    expect(html).toContain(rendezVousContent.noteFuseau);
    expect(html).toContain(`>${G.actions.deplacer}<`);
    expect(html).toContain(`>${G.actions.annuler}<`);
    const actions = trouver(arbre, (element) => element.type === GestionRendezVous);
    expect(actions.props.jeton).toBe(JETON);
  });

  it.each([
    ["ANNULE", G.etats.annule, true],
    ["DEPLACE", G.etats.deplace, false],
  ])("rendez-vous %s : l’état, sans actions", async (statut, etat, reserver) => {
    simuler([{ ...RDV, statut }]);
    const { arbre, html } = await ouvrir();
    expect(html).toContain(etat.titre);
    expect(html).toContain(etat.texte);
    expect(html).toContain(RDV.titre);
    expect(html.includes(`href="${G.lienReserver}"`)).toBe(reserver);
    expect(trouver(arbre, (element) => element.type === GestionRendezVous)).toBeUndefined();
  });

  it("rendez-vous commencé : passé, et invitation à en réserver un autre", async () => {
    simuler([{ ...RDV, debut: "2020-01-07T09:00:00.000Z", fin: "2020-01-07T09:45:00.000Z" }]);
    const { arbre, html } = await ouvrir();
    expect(html).toContain(G.etats.passe.titre);
    expect(html).toContain(`href="${G.lienReserver}"`);
    expect(html).toContain(G.actions.reserver);
    expect(trouver(arbre, (element) => element.type === GestionRendezVous)).toBeUndefined();
  });

  it("lien inconnu : ni détail ni action, une invitation à réserver", async () => {
    simuler([{ erreur: "introuvable" }, 404]);
    const { html } = await ouvrir();
    expect(html).toContain(G.etats.inconnu.titre);
    expect(html).toContain(`href="${G.lienReserver}"`);
    expect(html).not.toContain(G.libelleSujet);
    expect(html).not.toContain(rendezVousContent.noteFuseau);
  });

  it("cockpit injoignable ou en refus : indisponible, sans proposer de réserver", async () => {
    for (const reponse of [new TypeError("fetch failed"), [{ erreur: "jeton_invalide" }, 401]]) {
      simuler(reponse);
      const { html } = await ouvrir();
      expect(html).toContain(G.etats.indisponible.titre);
      expect(html).not.toContain(`href="${G.lienReserver}"`);
      expect(html).not.toContain(G.libelleSujet);
    }
  });
});
