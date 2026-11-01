import { afterEach, describe, expect, it } from "bun:test";
import { hasReducedMotionListener, prefersReducedMotion } from "motion/react";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { avancerImages, installerDom, monter } from "@/components/motion/__tests__/dom.mjs";
import { FaqSection } from "./FaqSection";

const faq = [
  { question: "Première question ?", answer: "Première réponse." },
  { question: "Deuxième question ?", answer: "Deuxième réponse." },
];

const entete = (conteneur, rang) => conteneur.querySelector(`#faq-h-${rang}`);
const reponse = (conteneur, rang) => conteneur.querySelector(`#faq-p-${rang}`);

/** Le rendu de la question suit l'état ouvert ; les animations n'y entrent pas. */
function attendreOuvert(conteneur, rang, ouvert) {
  const bouton = entete(conteneur, rang);
  const numero = bouton.querySelector("span[aria-hidden]");
  const panneau = reponse(conteneur, rang);
  expect(bouton.getAttribute("aria-expanded")).toBe(String(ouvert));
  expect(numero.style.opacity).toBe(ouvert ? "1" : "0.6");
  expect(panneau.getAttribute("role")).toBe(ouvert ? "region" : null);
  expect(panneau.getAttribute("aria-labelledby")).toBe(ouvert ? `faq-h-${rang}` : null);
}

function clic(bouton) {
  return act(async () => {
    bouton.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
}

describe("FaqSection", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
    prefersReducedMotion.current = null;
  });

  it("ne donne au serveur que la première réponse à lire", () => {
    const html = renderToStaticMarkup(createElement(FaqSection, { faq }));
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html.match(/visibility:hidden/g)).toHaveLength(1);
  });

  it("ouvre et ferme chaque question, indépendamment des autres", async () => {
    contexte = installerDom();
    // Mesure d'une hauteur `auto` : motion remet le défilement en place après.
    window.scrollTo = () => {};
    montage = await monter(createElement(FaqSection, { faq }));
    const { conteneur } = montage;
    attendreOuvert(conteneur, 0, true);
    attendreOuvert(conteneur, 1, false);

    await clic(entete(conteneur, 1));
    attendreOuvert(conteneur, 0, true);
    attendreOuvert(conteneur, 1, true);

    await clic(entete(conteneur, 0));
    attendreOuvert(conteneur, 0, false);
    attendreOuvert(conteneur, 1, true);
    for (let image = 0; image < 6; image += 1) await avancerImages(200);
    expect(reponse(conteneur, 0).style.height).toBe("0px");
    expect(reponse(conteneur, 1).style.visibility).toBe("visible");
  });

  it("bascule sans durée en mouvement réduit", async () => {
    contexte = installerDom();
    hasReducedMotionListener.current = true;
    prefersReducedMotion.current = true;
    window.scrollTo = () => {};
    montage = await monter(createElement(FaqSection, { faq }));
    const { conteneur } = montage;

    await clic(entete(conteneur, 0));
    attendreOuvert(conteneur, 0, false);
    await avancerImages();
    expect(reponse(conteneur, 0).style.height).toBe("0px");
    expect(reponse(conteneur, 0).style.visibility).toBe("hidden");
  });
});
