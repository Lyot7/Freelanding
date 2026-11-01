import { afterEach, describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteFeatures } from "@/content/features";
import { FlecheSortante } from "@/components/ui/FlecheSortante";
import { installerDom, monter } from "./__tests__/dom.mjs";
import { Reveal } from "./Reveal";
import { SignatureTracee } from "./SignatureTracee";
import { COURBE, DELAI_MAX, DUREE } from "./tempo";
import { TitreMasque } from "./TitreMasque";
import { Trait } from "./Trait";

describe("le tempo du site", () => {
  it("deux courbes, cinq durées, les mêmes en CSS", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    expect(css).toContain(`--courbe-sortie: cubic-bezier(${COURBE.sortie.join(", ")})`);
    expect(css).toContain(`--courbe-vive: cubic-bezier(${COURBE.vive.join(", ")})`);
    expect(Object.keys(DUREE)).toHaveLength(5);
  });
});


/* `Reveal` appelle des hooks : on lit ses défauts sur le rendu serveur. */
describe("Reveal", () => {
  it("rend l'état masqué dès le serveur et le filet sans script", () => {
    const html = renderToStaticMarkup(
      createElement(Reveal, { initialOpacity: 0.001, initialY: 40 }, "Texte"),
    );
    expect(html).toContain('data-reveal=""');
    expect(html).toContain("opacity:0.001");
    expect(html).toContain("translateY(40px)");
  });

  it("le texte courant ne voyage pas : six pixels au plus", () => {
    const html = renderToStaticMarkup(
      createElement(Reveal, { as: "p", initialOpacity: 0.001, initialY: 30 }, "Texte"),
    );
    expect(html).toContain("translateY(6px)");
    expect(html).not.toContain("translateY(30px)");
  });

  it("un texte sans déplacement reste sans déplacement", () => {
    const html = renderToStaticMarkup(createElement(Reveal, { as: "p", initialOpacity: 0 }, "Texte"));
    expect(html).not.toContain("translateY");
  });

  it("plafonne le délai d'une section à ce que le lecteur tolère", () => {
    expect(DELAI_MAX).toBeLessThanOrEqual(0.24);
  });
});

describe("TitreMasque", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  it("rend un seul h2, une ligne par entrée, masquée jusqu'à l'entrée à l'écran", async () => {
    contexte = installerDom();
    montage = await monter(createElement(TitreMasque, { lignes: ["Une", "Deux"], className: "titre" }));
    const titre = montage.conteneur.querySelector("h2");
    expect(titre.className).toContain("titre");
    expect(titre.textContent).toBe("UneDeux");
    expect(titre.querySelectorAll(".overflow-hidden")).toHaveLength(2);
    await contexte.entrer(titre);
  });

  it("en mouvement réduit, le titre est en place sans attendre", async () => {
    contexte = installerDom({ mouvementReduit: true });
    montage = await monter(createElement(TitreMasque, { lignes: ["Une"] }));
    expect(montage.conteneur.querySelector("h2 .block.overflow-hidden > span")).not.toBeNull();
  });
});

describe("Trait", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  it("décore sans parler, part replié, et garde son filet par défaut", () => {
    const html = renderToStaticMarkup(createElement(Trait));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("bg-current/15");
    expect(html).toContain("scaleX(0)");
  });

  it("prend la couleur demandée", () => {
    expect(renderToStaticMarkup(createElement(Trait, { className: "bg-accent" }))).toContain("bg-accent");
  });

  it("se monte aussi en mouvement réduit", async () => {
    contexte = installerDom({ mouvementReduit: true });
    montage = await monter(createElement(Trait, { delai: 0.1 }));
    expect(montage.conteneur.querySelector("span")).not.toBeNull();
  });
});

describe("SignatureTracee", () => {
  const signature = siteFeatures.signature;
  let contexte;
  let montage;

  afterEach(async () => {
    siteFeatures.signature = signature;
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  it("découvre le paraphe de gauche à droite", () => {
    const html = renderToStaticMarkup(createElement(SignatureTracee, { className: "w-[180px]" }));
    expect(html).toContain("inset(0 100% 0 0)");
    expect(html).toContain("w-[180px]");
    expect(html).toContain("<svg");
  });

  it("disparaît avec le drapeau de la signature", () => {
    siteFeatures.signature = false;
    expect(renderToStaticMarkup(createElement(SignatureTracee))).toBe("");
  });

  it("se monte aussi en mouvement réduit", async () => {
    contexte = installerDom({ mouvementReduit: true });
    montage = await monter(createElement(SignatureTracee));
    expect(montage.conteneur.querySelector("svg")).not.toBeNull();
  });
});

describe("FlecheSortante", () => {
  it("rend deux copies décoratives", () => {
    const html = renderToStaticMarkup(createElement(FlecheSortante));
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html).toContain('aria-hidden="true"');
  });
});
