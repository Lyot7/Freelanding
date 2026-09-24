import { describe, expect, it } from "bun:test";

import { Header } from "@/components/layout";
import { RichText } from "@/components/pages/RichText";
import { vueAgentContent } from "@/content/vue-agent";
import { content } from "@/lib/content";
import { consignesDuPrompt, construireProfil, construirePrompt } from "@/lib/profil/profil";
import { AgentPage } from "./AgentPage";
import { CopierPrompt } from "./CopierPrompt";

/**
 * `AgentPage` est un composant SERVEUR sans hook : l'appeler directement
 * exécute son JSX. On inspecte l'arbre produit, sans DOM.
 */
function elements(noeud, vus = new WeakSet(), acc = []) {
  if (noeud === null || typeof noeud !== "object" || vus.has(noeud)) return acc;
  vus.add(noeud);
  if (Array.isArray(noeud)) {
    for (const enfant of noeud) elements(enfant, vus, acc);
    return acc;
  }
  if ("type" in noeud && "props" in noeud) {
    acc.push(noeud);
    elements(noeud.props.children, vus, acc);
  }
  return acc;
}

function texte(noeud) {
  if (noeud === null || noeud === undefined || typeof noeud === "boolean") return "";
  if (typeof noeud === "string" || typeof noeud === "number") return String(noeud);
  if (Array.isArray(noeud)) return noeud.map(texte).join("");
  return texte(noeud.props?.children);
}

const site = await content.getSiteConfig();
const profil = await construireProfil();
const t = vueAgentContent;

describe("AgentPage", () => {
  const arbre = elements(AgentPage({ site, profil }));

  it("pose deux boutons de copie qui copient le prompt complet", () => {
    const boutons = arbre.filter((el) => el.type === CopierPrompt);
    expect(boutons).toHaveLength(2);
    for (const bouton of boutons) {
      expect(bouton.props.prompt).toBe(construirePrompt(profil));
      expect(bouton.props.libelles).toBe(t.copier);
    }
    expect(boutons.map((bouton) => bouton.props.ton)).toEqual([undefined, "clair"]);
  });

  it("affiche l'en-tête en vue agent et le profil avec ses liens", () => {
    const entete = arbre.find((el) => el.type === Header);
    expect(entete.props.vue).toBe("agent");
    const corps = arbre.find((el) => el.type === RichText);
    expect(corps.props.blocks).toBe(profil.blocs);
    expect(corps.props.liens).toBe(true);
  });

  it("dit qui parle, numérote le mode d'emploi et montre les consignes", () => {
    const tout = texte(arbre[0]) + arbre.map((el) => texte(el.props.children)).join("");
    expect(tout).toContain(t.hero.surtitre(site.contact.person.name, site.tagline));
    expect(tout).toContain(t.hero.titre);
    expect(tout).toContain(profil.titre);
    t.mode.etapes.forEach((etape, index) => {
      expect(tout).toContain(`${String(index + 1).padStart(2, "0")}${etape}`);
    });
    expect(tout).toContain(consignesDuPrompt());
  });

  it("mène au profil en texte brut", () => {
    const lien = arbre.find((el) => el.type === "a" && el.props.href === "/llms-full.txt");
    expect(texte(lien)).toBe(t.mode.lienTexte);
  });

  it("signe du nom de la marque quand aucune personne n'est déclarée", () => {
    const sansPersonne = { ...site, contact: { ...site.contact, person: undefined } };
    const surtitre = elements(AgentPage({ site: sansPersonne, profil }))
      .filter((el) => el.type === "p")
      .map(texte)
      .find((ligne) => ligne.startsWith(`${site.brand.name} · `));
    expect(surtitre).toBe(t.hero.surtitre(site.brand.name, site.tagline));
  });
});
