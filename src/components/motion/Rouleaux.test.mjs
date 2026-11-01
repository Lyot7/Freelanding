import { afterEach, describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { installerDom, monter } from "./__tests__/dom.mjs";
import { Rouleaux } from "./Rouleaux";

const racine = (conteneur) => conteneur.querySelector("span");
const colonnes = (conteneur) => [...conteneur.querySelectorAll('[aria-hidden="true"] .flex-col')];

describe("Rouleaux", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  it("le serveur rend la valeur finale, sans JavaScript elle se lit juste", () => {
    const html = renderToStaticMarkup(createElement(Rouleaux, { valeur: "92" }));
    expect(html).toContain("translateY(-90%)");
    expect(html).toContain("translateY(-20%)");
  });

  it("donne le texte complet au lecteur d'écran, jamais les colonnes", () => {
    const html = renderToStaticMarkup(createElement(Rouleaux, { valeur: "−92 %" }));
    expect(html).toContain('<span class="sr-only">−92 %</span>');
    expect(html).toContain('aria-hidden="true"');
  });

  it("garde fixes les caractères qui ne sont pas des chiffres", async () => {
    contexte = installerDom();
    montage = await monter(createElement(Rouleaux, { valeur: "−9 %" }));
    expect(colonnes(montage.conteneur)).toHaveLength(1);
    expect(montage.conteneur.querySelector('[aria-hidden="true"]').textContent).toContain("−");
  });

  it("repart de zéro une fois hydraté, puis passe ses crans à l'entrée dans l'écran", async () => {
    contexte = installerDom();
    montage = await monter(createElement(Rouleaux, { valeur: "24", className: "chiffre" }));
    const [dizaines] = colonnes(montage.conteneur);
    expect(racine(montage.conteneur).className).toContain("chiffre");
    expect(dizaines.style.transform).not.toContain("-20%");
    await contexte.entrer(racine(montage.conteneur));
    expect(contexte.observes()).not.toContain(racine(montage.conteneur));
  });

  it("en mouvement réduit, la valeur finale sans animation", async () => {
    contexte = installerDom({ mouvementReduit: true });
    montage = await monter(createElement(Rouleaux, { valeur: "7" }));
    await new Promise((resoudre) => setTimeout(resoudre, 30));
    expect(colonnes(montage.conteneur)[0].style.transform).toContain("-70%");
  });
});
