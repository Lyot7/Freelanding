import { afterEach, describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { installerDom, monter } from "@/components/motion/__tests__/dom.mjs";
import { homeContent } from "@/content/home";
import { siteConfig } from "@/content/site";
import { MoyensSection, lignesDe } from "./MoyensSection";

describe("MoyensSection", () => {
  const { moyens } = homeContent;
  const html = renderToStaticMarkup(createElement(MoyensSection, { moyens }));
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  it("porte l'ancre du lien « Comment » de l'en-tête", () => {
    const hrefs = siteConfig.nav.map((lien) => lien.href);
    expect(html).toContain('id="moyens"');
    expect(hrefs).toContain("/#moyens");
  });

  it("rend chaque moyen avec son lien, et une flèche qui dit qu'on sort", () => {
    for (const ligne of moyens.lignes) {
      expect(html).toContain(ligne.titre);
      expect(html.replaceAll("&amp;", "&")).toContain(`href="${ligne.lien.href}"`);
    }
    expect(html.match(/fleche-sortante/g)).toHaveLength(moyens.lignes.length);
  });

  it("étiquette la troisième ligne comme une option, sans lui donner le même poids", () => {
    const option = moyens.lignes.find((ligne) => ligne.option);
    expect(option).toBe(moyens.lignes.at(-1));
    expect(html).toContain(option.option);
    expect(html.match(/desktop:min-h-\[38vh\]/g)).toHaveLength(moyens.lignes.length - 1);
  });

  it("met en avant la ligne au milieu de l'écran, puis se débranche", async () => {
    contexte = installerDom();
    montage = await monter(createElement(MoyensSection, { moyens }));
    const lignes = [...montage.conteneur.querySelectorAll(".moyen-ligne")];
    expect(lignes[0].dataset.active).toBe("true");

    await contexte.entrer(lignes[1]);
    expect(lignes[0].dataset.active).toBe("false");
    expect(lignes[1].dataset.active).toBe("true");

    await contexte.entrer(lignes[2], false);
    expect(lignes[1].dataset.active).toBe("true");

    await montage.demonter();
    montage = undefined;
    for (const ligne of lignes) expect(contexte.observes()).not.toContain(ligne);
  });
});

describe("lignesDe", () => {
  it("n'observe rien tant que la liste n'existe pas", () => {
    expect(lignesDe(null)).toEqual([]);
  });

  it("rend les lignes de la liste, dans l'ordre", () => {
    const enfants = [{ id: "une" }, { id: "deux" }];
    expect(lignesDe({ children: enfants })).toEqual(enfants);
  });
});
