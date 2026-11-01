import { afterEach, describe, expect, it } from "bun:test";
import { Suspense, act, createElement, use } from "react";

import { avancerImages, installerDom, monter, patienter } from "@/components/motion/__tests__/dom.mjs";
import { homeContent } from "@/content/home";
import { DUREE_CADRAN, RETARD_CADRAN, formatHeure } from "./cadran";
import { HeroCadran } from "./HeroCadran";
import { PreuvesSection } from "./PreuvesSection";

/** Ce que seul le temps ou le défilement déclenche, image par image. */
const { cadran } = homeContent.hero;
const { preuves } = homeContent;

/** Suspend tout ce qui l'entoure dès qu'une promesse lui est donnée. */
function Suspendu({ promesse }) {
  if (promesse) use(promesse);
  return null;
}

describe("mouvement de l'accueil", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  describe("HeroCadran", () => {
    it("suit l'aiguille, puis passe la main à la trotteuse et au lien", async () => {
      contexte = installerDom();
      montage = await monter(createElement(HeroCadran, { cadran }));
      const { conteneur } = montage;
      const compteur = conteneur.querySelector("span.font-mono");
      const tache = conteneur.querySelector("span.micro");
      const lien = conteneur.querySelector("a");
      expect(compteur.textContent).toBe(formatHeure(cadran.depart));
      expect(tache.textContent).toBe(cadran.taches[0]);
      expect(conteneur.querySelector(".hero-trotteuse")).toBeNull();
      expect(lien.className).toContain("opacity-0");

      await avancerImages();
      await avancerImages((RETARD_CADRAN + DUREE_CADRAN / 2) * 1000);
      expect(compteur.textContent).not.toBe(formatHeure(cadran.depart));
      expect(compteur.textContent).not.toBe(formatHeure(cadran.arrivee));
      expect(conteneur.querySelector(".hero-trotteuse")).toBeNull();

      await avancerImages((DUREE_CADRAN + 1) * 1000);
      await avancerImages();
      expect(compteur.textContent).toBe(formatHeure(cadran.arrivee));
      expect(tache.textContent).toBe(cadran.taches.at(-1));
      expect(conteneur.querySelector(".hero-trotteuse")).not.toBeNull();
      expect(lien.className).toContain("opacity-100");
    });

    it("n'écrit plus rien pendant qu'un Suspense le cache, sans s'interrompre", async () => {
      contexte = installerDom();
      const rendu = (promesse) =>
        createElement(
          Suspense,
          { fallback: null },
          createElement(HeroCadran, { cadran }),
          createElement(Suspendu, { promesse }),
        );
      montage = await monter(rendu());
      const compteur = montage.conteneur.querySelector("span.font-mono");
      await avancerImages();

      await act(async () => {
        montage.racine.render(rendu(new Promise(() => {})));
      });
      // React retient une fraction de seconde le repli d'un écran déjà visible.
      await patienter(350);
      expect(compteur.closest(".hero-cadran").style.display).toBe("none");

      await avancerImages((RETARD_CADRAN + DUREE_CADRAN / 2) * 1000);
      await avancerImages((DUREE_CADRAN + 1) * 1000);
      expect(compteur.textContent).toBe(formatHeure(cadran.depart));
    });
  });

  describe("PreuvesSection", () => {
    /** Une page de 5 000 px, sa section de 1 000 px tout en haut, dans une fenêtre de 1 000. */
    function poserGeometrie() {
      const racine = document.documentElement;
      Object.defineProperty(document, "scrollingElement", { value: racine, configurable: true });
      Object.defineProperty(racine, "scrollHeight", { value: 5000, configurable: true });
      Object.defineProperty(window.HTMLElement.prototype, "clientHeight", {
        value: 1000,
        configurable: true,
      });
      return racine;
    }

    async function defiler(racine, position) {
      racine.scrollTop = position;
      window.dispatchEvent(new window.Event("scroll"));
      await avancerImages();
    }

    it("passe en encre pleine le projet à l'écran, et jamais au-delà du dernier", async () => {
      contexte = installerDom();
      const racine = poserGeometrie();
      montage = await monter(createElement(PreuvesSection, { preuves }));
      const pleins = () =>
        [...montage.conteneur.querySelectorAll("ol > li")].map((ligne) =>
          ligne.className.includes("tablet:opacity-100"),
        );
      const dernier = preuves.projets.length - 1;
      const seul = (rang) => preuves.projets.map((_, index) => index === rang);
      expect(pleins()).toEqual(seul(0));

      // Course de -1 000 à 1 000 : la fin de section, puis bien au-delà.
      await defiler(racine, 999);
      expect(pleins()).toEqual(seul(dernier));
      await defiler(racine, 2000);
      expect(pleins()).toEqual(seul(dernier));

      await defiler(racine, 0);
      expect(pleins()).toEqual(seul(Math.floor(0.5 * preuves.projets.length)));
    });
  });
});
