import { describe, expect, it } from "bun:test";
import { messageSecours, texteFourchette, texteRecapitulatif } from "./recap.ts";

const fourchette = (bas, haut) => (haut === undefined ? { bas } : { bas, haut });

function envoi(source = "boutons", description = "Un outil de devis <urgent> & simple.") {
  return {
    demande: {
      reponses: { type: "logiciel", equipe: "6-20", outils: "plusieurs", urgence: "trimestre" },
      description,
      contact: {
        prenom: "Lucie",
        nom: "Marchetti",
        societe: "Menuiserie des Coteaux",
        email: "lucie@coteaux.fr",
        telephone: "06 47 21 88 03",
      },
      jetonCaptcha: undefined,
    },
    estimation: {
      type: "logiciel",
      grandProjet: false,
      prix: fourchette(8_000, 12_000),
      maintenance: fourchette(150, 250),
      abonnements: [
        { duree: 12, miseEnRoute: fourchette(2_000, 3_000), mensualite: fourchette(600, 900), suiviApres: fourchette(120, 200) },
        { duree: 24, miseEnRoute: fourchette(1_500), mensualite: fourchette(400, 600), suiviApres: fourchette(120, 200) },
      ],
    },
    composants: {},
    source,
  };
}

describe("texteFourchette", () => {
  it("écrit « à » entre deux bornes et « dès » quand le haut manque", () => {
    expect(texteFourchette(fourchette(8_000, 12_000))).toBe(`${(8_000).toLocaleString("fr-FR")} € à ${(12_000).toLocaleString("fr-FR")} €`);
    expect(texteFourchette(fourchette(30_000))).toBe(`dès ${(30_000).toLocaleString("fr-FR")} €`);
  });
});

describe("texteRecapitulatif", () => {
  it("rend le contact, le projet, la description et chaque formule", () => {
    const t = texteRecapitulatif(envoi("ia"));
    expect(t).toContain("Lucie Marchetti, Menuiserie des Coteaux");
    expect(t).toContain("lucie@coteaux.fr · 06 47 21 88 03");
    expect(t).toContain("Projet : logiciel · équipe 6-20 · outils plusieurs · échéance trimestre");
    expect(t).toContain("Composants lus par l'IA");
    expect(t).toContain("Achat direct :");
    expect(t).toContain("Abonnement 12 mois");
    expect(t).toContain("Abonnement 24 mois");
    expect(t).toContain("dès");
  });

  it("dit que les composants viennent des boutons quand l'IA n'a pas servi", () => {
    expect(texteRecapitulatif(envoi("boutons"))).toContain("Composants lus depuis les boutons");
  });
});

describe("messageSecours", () => {
  it("donne le motif, le texte et un HTML échappé", () => {
    const m = messageSecours(envoi(), "statut_503");
    expect(m.sujet).toBe("Estimation du site, cockpit injoignable : Menuiserie des Coteaux");
    expect(m.texte).toContain("(statut_503)");
    expect(m.texte).toContain("À saisir à la main.");
    expect(m.html).toContain("&lt;urgent&gt;");
    expect(m.html).not.toContain("<urgent>");
  });

  it("nettoie le sujet d'un saut de ligne glissé dans la société", () => {
    const e = envoi();
    e.demande.contact.societe = "Coteaux\r\nBcc: x@y.z";
    expect(messageSecours(e, "x").sujet).not.toMatch(/[\r\n]/);
  });
});
