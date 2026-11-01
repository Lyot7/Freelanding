import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LogoBandSection } from "./LogoBandSection";

const avecTaille = { name: "Acme", image: { src: "/logos/acme.png", alt: "Acme", width: 200, height: 40 } };
const sansTaille = { name: "Globex", image: { src: "/logos/globex.png", alt: "Globex" } };
const sansImage = { name: "Initech" };

const rendre = (logoBand) =>
  renderToStaticMarkup(createElement(LogoBandSection, { logoBand, variant: "heros" }));

describe("LogoBandSection, rangée du héros", () => {
  it("nomme les logos par l'intitulé, lu avant eux", () => {
    const html = rendre({ title: "Ils m'ont employé", logos: [avecTaille] });
    expect(html.indexOf("Ils m&#x27;ont employé")).toBeLessThan(html.indexOf("<ul"));
    const id = html.match(/<p id="([^"]+)"/)[1];
    expect(html).toContain(`aria-labelledby="${id}"`);
  });

  it("n'annonce rien sans intitulé", () => {
    const html = rendre({ logos: [avecTaille] });
    expect(html).not.toContain("<p");
    expect(html).not.toContain("aria-labelledby");
  });

  it("met chaque logo en blanc, à sa taille réduite, ou à la taille de repli", () => {
    const html = rendre({ logos: [avecTaille, sansTaille] });
    expect(html.match(/filter:url\(#/g)).toHaveLength(2);
    expect(html.match(/width="(\d+)"/g).slice(-2)).not.toContain('width="200"');
    const largeurs = [...html.matchAll(/<img[^>]* width="(\d+)"/g)].map((resultat) => Number(resultat[1]));
    expect(largeurs).toHaveLength(2);
    expect(largeurs[0] / 200).toBeCloseTo(largeurs[1] / 130, 1);
  });

  it("écrit le nom quand le logo n'a pas d'image", () => {
    const html = rendre({ logos: [sansImage] });
    expect(html).toContain("Initech");
    expect(html).not.toContain("<img");
  });

  it("ne rend rien sans logo", () => {
    expect(rendre({ logos: [] })).toBe("");
  });
});
