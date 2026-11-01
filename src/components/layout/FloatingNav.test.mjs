import { afterEach, describe, expect, it } from "bun:test";
import { act, createElement } from "react";

import { avancerImages, installerDom, monter } from "@/components/motion/__tests__/dom.mjs";
import { siteConfig } from "@/content/site";
import { FloatingNav } from "./FloatingNav";

/**
 * Le dock : garé sous le bord en haut de page, il arrive passé le héros, porte
 * l'action une fois `#logiciel` lu, s'efface devant le pied de page, et son
 * panneau tient le contrat complet d'une fenêtre modale.
 *
 * La fenêtre de jsdom mesure 768 px de haut : le seuil tombe à 652,8 px.
 */
const LOIN = 1000;
const PRES = 100;

const panneau = (conteneur) => conteneur.querySelector("#floating-nav-panel");
const dock = (conteneur) => panneau(conteneur).parentElement;
const burger = (conteneur) => conteneur.querySelector("button[aria-controls]");
const action = (conteneur) => conteneur.querySelector(".dock-action");

function defiler(y) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  return act(async () => {
    window.dispatchEvent(new window.Event("scroll"));
  });
}

/** Une section de la page, dont la boîte est décidée par le test. */
function section(id, boite) {
  const element = document.createElement("div");
  element.id = id;
  element.getBoundingClientRect = () => boite;
  document.body.appendChild(element);
  return element;
}

function clic(element) {
  return act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
}

/** La course d'entrée ou de sortie du dock, jouée jusqu'au bout. */
async function jouerCourse() {
  await avancerImages();
  await avancerImages(2000);
  await avancerImages();
}

describe("FloatingNav", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  async function monterDock(site = siteConfig) {
    montage = await monter(createElement(FloatingNav, { site }));
    return montage.conteneur;
  }

  describe("apparition", () => {
    it("reste sous le bord en haut de page, arrive passé le héros, repart au retour", async () => {
      contexte = installerDom();
      const conteneur = await monterDock();
      expect(dock(conteneur).style.transform).toContain("translateY(90px)");

      await defiler(LOIN);
      await jouerCourse();
      expect(dock(conteneur).style.transform).toBe("none");

      await defiler(PRES);
      await jouerCourse();
      expect(dock(conteneur).style.transform).toContain("translateY(90px)");
    });

    it("est là tout de suite à un rechargement en cours de page", async () => {
      contexte = installerDom();
      Object.defineProperty(window, "scrollY", { value: LOIN, configurable: true });
      const conteneur = await monterDock();
      await jouerCourse();
      expect(dock(conteneur).style.transform).toBe("none");
    });

    it("reste tant que le clavier est sur le burger, et repart une fois le focus sorti", async () => {
      contexte = installerDom();
      const conteneur = await monterDock();
      await act(async () => {
        burger(conteneur).focus();
      });
      await jouerCourse();
      expect(dock(conteneur).style.transform).toBe("none");

      await defiler(PRES);
      await jouerCourse();
      expect(dock(conteneur).style.transform).toBe("none");

      await act(async () => {
        burger(conteneur).blur();
      });
      await defiler(PRES);
      await jouerCourse();
      expect(dock(conteneur).style.transform).toContain("translateY(90px)");
    });

    it("n'écoute plus ni le défilement ni le pied de page une fois démonté", async () => {
      contexte = installerDom();
      const pied = document.body.appendChild(document.createElement("footer"));
      let lectures = 0;
      section("logiciel", {
        get bottom() {
          lectures += 1;
          return 500;
        },
      });
      await monterDock();
      expect(contexte.observes()).toContain(pied);
      const avant = lectures;
      await defiler(LOIN);
      expect(lectures).toBe(avant + 1);

      await montage.demonter();
      montage = undefined;
      expect(contexte.observes()).not.toContain(pied);
      await defiler(PRES);
      expect(lectures).toBe(avant + 1);
    });
  });

  describe("l'action du dock", () => {
    it("n'apparaît qu'une fois la démonstration passée, et replie devant la réservation", async () => {
      contexte = installerDom();
      const logiciel = { bottom: 400 };
      const rendezVous = { top: 2000 };
      section("logiciel", logiciel);
      section("rendez-vous", rendezVous);
      const conteneur = await monterDock();
      const lien = action(conteneur).querySelector("a");
      expect(action(conteneur).dataset.ouvert).toBe("false");
      expect(lien.getAttribute("tabindex")).toBe("-1");
      expect(lien.getAttribute("aria-hidden")).toBe("true");
      expect(lien.className).toContain("pointer-events-none");

      logiciel.bottom = -1;
      await defiler(LOIN);
      expect(action(conteneur).dataset.ouvert).toBe("true");
      expect(lien.getAttribute("tabindex")).toBe("0");
      expect(lien.getAttribute("aria-hidden")).toBe("false");
      expect(lien.className).toContain("pointer-events-auto");
      expect(lien.getAttribute("href")).toBe(siteConfig.floatingCta.href);

      rendezVous.top = 100;
      await defiler(LOIN);
      expect(action(conteneur).dataset.ouvert).toBe("false");
    });

    it("n'existe jamais sur une page sans démonstration ni réservation", async () => {
      contexte = installerDom();
      const conteneur = await monterDock();
      await defiler(LOIN);
      expect(action(conteneur).dataset.ouvert).toBe("false");
    });

    it("se replie quand le panneau s'ouvre", async () => {
      contexte = installerDom();
      section("logiciel", { bottom: -1 });
      const conteneur = await monterDock();
      expect(action(conteneur).dataset.ouvert).toBe("true");
      await clic(burger(conteneur));
      expect(action(conteneur).dataset.ouvert).toBe("false");
    });

    it("donne le libellé court aux petits écrans quand il existe", async () => {
      contexte = installerDom();
      const conteneur = await monterDock();
      const texte = action(conteneur).querySelector(".dock-action-texte");
      expect(texte.textContent).toBe(`${siteConfig.primaryCta.shortLabel}${siteConfig.floatingCta.label}`);
      expect(texte.querySelectorAll("span")).toHaveLength(2);
    });

    it("retombe sur l'action principale, sans libellé court, faute d'action de dock", async () => {
      contexte = installerDom();
      const primaryCta = { ...siteConfig.primaryCta, shortLabel: undefined };
      const conteneur = await monterDock({ ...siteConfig, primaryCta, floatingCta: undefined });
      const lien = action(conteneur).querySelector("a");
      expect(lien.getAttribute("href")).toBe(primaryCta.href);
      expect(lien.textContent).toBe(primaryCta.label);
      expect(lien.querySelectorAll(".dock-action-texte span")).toHaveLength(0);
    });
  });

  describe("le pied de page", () => {
    /** Le rappel de l'observateur, pour lui passer ce qu'un test choisit. */
    function capterRappel() {
      const rappels = [];
      const Reel = globalThis.IntersectionObserver;
      globalThis.IntersectionObserver = class extends Reel {
        constructor(rappel, options) {
          super(rappel, options);
          rappels.push(rappel);
        }
      };
      return rappels;
    }

    it("efface le dock tant qu'il est à l'écran, sans le faire glisser", async () => {
      contexte = installerDom();
      const pied = document.body.appendChild(document.createElement("footer"));
      const conteneur = await monterDock();
      await defiler(LOIN);
      await jouerCourse();

      await contexte.entrer(pied);
      await jouerCourse();
      expect(dock(conteneur).style.opacity).toBe("0");
      expect(dock(conteneur).style.visibility).toBe("hidden");
      expect(dock(conteneur).style.transform).toBe("none");

      await contexte.entrer(pied, false);
      await jouerCourse();
      expect(dock(conteneur).style.opacity).toBe("1");
      expect(dock(conteneur).style.visibility).toBe("visible");
    });

    it("s'efface aussi garé sous le bord, et rouvre son panneau devant le pied", async () => {
      contexte = installerDom();
      const pied = document.body.appendChild(document.createElement("footer"));
      const conteneur = await monterDock();
      await contexte.entrer(pied);
      await jouerCourse();
      expect(dock(conteneur).style.opacity).toBe("0");
      expect(dock(conteneur).style.transform).toContain("translateY(90px)");

      await clic(burger(conteneur));
      await jouerCourse();
      expect(dock(conteneur).style.opacity).toBe("1");
    });

    it("ignore un relevé vide de l'observateur", async () => {
      contexte = installerDom();
      const rappels = capterRappel();
      document.body.appendChild(document.createElement("footer"));
      const conteneur = await monterDock();
      await act(async () => {
        rappels.at(-1)([]);
      });
      await jouerCourse();
      expect(dock(conteneur).style.opacity).toBe("1");
    });
  });

  describe("le panneau", () => {
    it("s'ouvre en fenêtre modale, prend le focus et le rend au burger à Échap", async () => {
      contexte = installerDom();
      const conteneur = await monterDock();
      const racine = conteneur.querySelector('[data-part="floating-nav"]');
      expect(racine.getAttribute("role")).toBeNull();
      expect(panneau(conteneur).getAttribute("aria-hidden")).toBe("true");

      await clic(burger(conteneur));
      expect(racine.getAttribute("role")).toBe("dialog");
      expect(burger(conteneur).getAttribute("aria-expanded")).toBe("true");
      expect(panneau(conteneur).getAttribute("aria-hidden")).toBe("false");
      expect(panneau(conteneur).style.transform).toBe("scale(1) translateY(0)");
      expect(document.activeElement).toBe(panneau(conteneur).querySelector("a"));
      await jouerCourse();
      expect(dock(conteneur).style.transform).toBe("none");

      await act(async () => {
        window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
      });
      expect(burger(conteneur).getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(burger(conteneur));
    });

    it("garde la tabulation à l'intérieur, burger compris", async () => {
      contexte = installerDom();
      const conteneur = await monterDock();
      await clic(burger(conteneur));
      const [premier] = panneau(conteneur).querySelectorAll("a");

      const tabuler = (cible, shiftKey) => {
        const evenement = new window.KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey,
          bubbles: true,
          cancelable: true,
        });
        act(() => {
          cible.dispatchEvent(evenement);
        });
        return evenement.defaultPrevented;
      };

      premier.focus();
      expect(tabuler(premier, true)).toBe(true);
      expect(document.activeElement).toBe(burger(conteneur));
      expect(tabuler(burger(conteneur), false)).toBe(true);
      expect(document.activeElement).toBe(premier);
    });

    it("ne publie aucun numéro tant que le site n'en a pas", async () => {
      contexte = installerDom();
      const avecNumero = await monterDock();
      expect(avecNumero.querySelector('a[href^="tel:"]').getAttribute("href")).toMatch(/^tel:[+\d]+$/);
      await montage.demonter();

      const sansNumero = await monterDock({
        ...siteConfig,
        contact: { ...siteConfig.contact, phone: "" },
      });
      expect(sansNumero.querySelector('a[href^="tel:"]')).toBeNull();
    });

    it("lit le menu dédié, puis retombe sur la navigation", async () => {
      contexte = installerDom();
      const liens = (conteneur) =>
        [...conteneur.querySelectorAll("nav a")].map((lien) => lien.getAttribute("href"));
      expect(liens(await monterDock())).toEqual(siteConfig.menuNav.map((lien) => lien.href));
      await montage.demonter();
      expect(liens(await monterDock({ ...siteConfig, menuNav: undefined }))).toEqual(
        siteConfig.nav.map((lien) => lien.href),
      );
    });
  });
});
