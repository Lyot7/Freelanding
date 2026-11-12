import { describe, expect, it } from "bun:test";
import {
  bornerComposants,
  composantsParDefaut,
  estimer,
  indicesTexte,
  joursEstimes,
  PLANCHER_JOUR,
  SEUIL_GRAND_PROJET,
} from "./grille.ts";

/** Composants neutres, à compléter cas par cas. */
const VIDE = {
  pages: 0,
  modules: 0,
  connexions: 0,
  utilisateurs: 1,
  usagesIA: 0,
  boutique: false,
  espacePrive: false,
  multilingue: false,
  flou: "faible",
};

const reponses = (type, extra = {}) => ({
  type,
  equipe: "6-20",
  outils: "logiciel",
  urgence: "trimestre",
  ...extra,
});

/**
 * Les affaires réellement chiffrées par Eliott. La grille doit retrouver leurs
 * jours à un jour et demi près, et leur prix doit tomber dans la fourchette
 * (ou sous son bas quand l'affaire était sous la cible, voir Navicom).
 */
describe("calibrage sur les affaires réelles", () => {
  it("Transports Crouvezier : logiciel, deux processus, une connexion, ~13 j, 7 500 €", () => {
    const c = { ...VIDE, modules: 2, connexions: 1, utilisateurs: 8 };
    expect(Math.abs(joursEstimes("logiciel", c) - 13)).toBeLessThanOrEqual(1.5);
    const e = estimer(reponses("logiciel"), c);
    expect(e.prix.bas).toBeLessThanOrEqual(7_500);
    expect(e.prix.haut).toBeGreaterThanOrEqual(7_500);
  });

  it("Bertrand Pneus : logiciel complet (huit modules, trois connexions), ~36 j", () => {
    const c = { ...VIDE, modules: 8, connexions: 3, utilisateurs: 25, flou: "moyen" };
    expect(Math.abs(joursEstimes("logiciel", c) - 36)).toBeLessThanOrEqual(1.5);
    // 16 200 € était juste au-dessus du plancher : la grille vise plus haut.
    const e = estimer(reponses("logiciel"), c);
    expect(e.prix.bas).toBeGreaterThanOrEqual(16_200);
  });

  it("Navicom : site avec boutique et accès distributeurs, ~18 j", () => {
    const c = { ...VIDE, pages: 15, connexions: 1, boutique: true, espacePrive: true };
    expect(Math.abs(joursEstimes("site", c) - 18)).toBeLessThanOrEqual(1.5);
    // 6 900 € était sous le plancher (383 €/j) : la grille ne le reproduit pas.
    expect(estimer(reponses("site"), c).prix.bas).toBeGreaterThan(6_900);
  });

  it("Normandie Broc : site, 8 j, 4 000 €", () => {
    const c = { ...VIDE, pages: 8, connexions: 1, multilingue: true };
    expect(Math.abs(joursEstimes("site", c) - 8)).toBeLessThanOrEqual(1.5);
    const e = estimer(reponses("site"), c);
    expect(e.prix.bas).toBeLessThanOrEqual(5_000);
  });

  it("Aurore André : site simple, ~4,5 j, 1 890 €", () => {
    const c = { ...VIDE, pages: 7, flou: "moyen" };
    expect(Math.abs(joursEstimes("site", c) - 4.5)).toBeLessThanOrEqual(1.5);
    const e = estimer(reponses("site"), c);
    expect(e.prix.bas).toBeLessThanOrEqual(2_000);
    expect(e.prix.haut).toBeGreaterThanOrEqual(1_890);
  });
});

describe("estimer", () => {
  it("rend toujours une fourchette, jamais un montant unique", () => {
    for (const type of ["logiciel", "site", "ia", "autre"]) {
      const e = estimer(reponses(type));
      expect(e.prix.haut).toBeGreaterThan(e.prix.bas);
    }
  });

  it("ne passe jamais sous le plancher de 400 € par jour", () => {
    for (const flou of ["faible", "moyen", "fort"]) {
      const c = { ...VIDE, modules: 3, connexions: 2, flou };
      const jours = joursEstimes("logiciel", c);
      expect(estimer(reponses("logiciel"), c).prix.bas).toBeGreaterThanOrEqual(jours * 0.85 * PLANCHER_JOUR);
    }
  });

  it("élargit la fourchette quand le besoin est flou", () => {
    const net = estimer(reponses("logiciel"), { ...VIDE, modules: 3, flou: "faible" });
    const flou = estimer(reponses("logiciel"), { ...VIDE, modules: 3, flou: "fort" });
    expect(flou.prix.haut - flou.prix.bas).toBeGreaterThan(net.prix.haut - net.prix.bas);
  });

  it("majore un projet urgent", () => {
    const c = { ...VIDE, modules: 3 };
    const calme = estimer(reponses("logiciel"), c);
    const urgent = estimer(reponses("logiciel", { urgence: "urgent" }), c);
    expect(urgent.prix.bas).toBeGreaterThan(calme.prix.bas);
  });

  it("marche avec les seuls boutons", () => {
    const e = estimer(reponses("ia"));
    expect(e.prix.bas).toBeGreaterThanOrEqual(2_000);
    expect(e.grandProjet).toBe(false);
  });

  it("n'affiche pas de haut au-delà du seuil des grands projets", () => {
    const c = { ...VIDE, modules: 12, connexions: 8, usagesIA: 5, utilisateurs: 400, flou: "fort" };
    const e = estimer(reponses("logiciel"), c);
    expect(e.grandProjet).toBe(true);
    expect(e.prix.haut).toBeUndefined();
    expect(e.maintenance.haut).toBeUndefined();
    expect(e.abonnements[0].mensualite.haut).toBeUndefined();
    expect(e.prix.bas).toBeLessThan(SEUIL_GRAND_PROJET);
  });

  it("n'expose ni jours ni taux journalier", () => {
    const e = estimer(reponses("logiciel"));
    const texte = JSON.stringify(e);
    expect(texte).not.toMatch(/jour|taux|tjm/i);
  });
});

describe("maintenance et abonnement", () => {
  it("logiciel : 18 % par an, jamais sous 125 € par mois", () => {
    const petit = estimer(reponses("logiciel"), { ...VIDE, modules: 1 });
    expect(petit.maintenance.bas).toBe(125);
    const gros = estimer(reponses("logiciel"), { ...VIDE, modules: 7, connexions: 3 });
    expect(gros.maintenance.bas).toBe(Math.ceil((gros.prix.bas * 0.18) / 12 / 5) * 5);
  });

  it("site : 15 % par an, jamais sous 90 € par mois", () => {
    const e = estimer(reponses("site"), { ...VIDE, pages: 5 });
    expect(e.maintenance.bas).toBe(90);
  });

  it("retrouve les repères du 2026-11-12 pour un logiciel de 12 000 €", () => {
    // Mise en route 4 000, 12 mois → ~1 060, 24 mois → ~720, suivi 390.
    const e = estimer(reponses("logiciel"), { ...VIDE, modules: 2, connexions: 1, utilisateurs: 8 });
    const prix = e.prix.bas;
    const [douze, vingtQuatre] = e.abonnements;
    expect(douze.miseEnRoute.bas / prix).toBeGreaterThanOrEqual(0.3);
    expect(douze.mensualite.bas).toBe(
      Math.ceil((prix - douze.miseEnRoute.bas) / 12 / 10) * 10 + douze.suiviApres.bas,
    );
    expect(vingtQuatre.mensualite.bas).toBeLessThan(douze.mensualite.bas);
  });

  it("couvre au moins la valeur sur la durée d'engagement", () => {
    const e = estimer(reponses("site"), { ...VIDE, pages: 8 });
    for (const a of e.abonnements) {
      const paye = a.miseEnRoute.bas + a.duree * (a.mensualite.bas - a.suiviApres.bas);
      expect(paye).toBeGreaterThanOrEqual(e.prix.bas);
    }
  });
});

describe("entrées", () => {
  it("borne les nombres extravagants ou invalides", () => {
    const c = bornerComposants({ ...VIDE, pages: 9999, modules: -3, connexions: Number.NaN, flou: "absurde" });
    expect(c.pages).toBe(40);
    expect(c.modules).toBe(0);
    expect(c.connexions).toBe(0);
    expect(c.flou).toBe("fort");
  });

  it("les boutons seuls donnent un flou fort", () => {
    expect(composantsParDefaut(reponses("logiciel")).flou).toBe("fort");
  });

  it("lit boutique, espace client et langues dans le texte", () => {
    const base = composantsParDefaut(reponses("site"));
    const c = indicesTexte("Un site avec boutique en ligne et un espace client, en anglais aussi", base);
    expect(c.boutique).toBe(true);
    expect(c.espacePrive).toBe(true);
    expect(c.multilingue).toBe(true);
  });
});
