import { afterEach, describe, expect, it } from "bun:test";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { installerDom, monter } from "@/components/motion/__tests__/dom.mjs";
import { uiLabels } from "@/content/ui";
import { workContent, workItems } from "@/content/work";
import { WorkExplorer } from "./WorkExplorer";
import { WorkHero } from "./WorkHero";

describe("WorkHero", () => {
  const { hero } = workContent;

  it("annonce les trois projets, sans crédit photo", () => {
    const html = renderToStaticMarkup(createElement(WorkHero, { hero }));
    expect(html).toContain("Trois projets, en ligne ou mesurés.");
    expect(html).not.toContain("Photo :");
    expect(html).not.toContain("Maquette");
  });

  it("tourne sur la boucle de Kpsull, avec son affiche fixe", () => {
    expect(hero.media).toEqual({
      kind: "video",
      src: "/work/kpsull/mockup.mp4",
      poster: "/work/kpsull/mockup-poster.jpg",
    });
    const html = renderToStaticMarkup(createElement(WorkHero, { hero }));
    expect(html).toContain(encodeURIComponent(hero.media.poster));
  });

  it("garde son texte sans média", () => {
    const html = renderToStaticMarkup(createElement(WorkHero, { hero: { ...hero, media: undefined } }));
    expect(html).toContain(hero.title);
    expect(html).not.toContain("<img");
  });

  it("se passe d'affiche quand la donnée n'en a pas", () => {
    const media = { kind: "video", src: hero.media.src };
    const html = renderToStaticMarkup(createElement(WorkHero, { hero: { ...hero, media } }));
    expect(html).not.toContain("<img");
  });

  it("retombe sur le sous-titre, ou sur rien", () => {
    const reste = { ...hero, subtitleParagraphs: undefined };
    expect(renderToStaticMarkup(createElement(WorkHero, { hero: reste }))).toContain(hero.subtitle);
    const vide = { ...reste, subtitle: undefined };
    expect(renderToStaticMarkup(createElement(WorkHero, { hero: vide }))).not.toContain(hero.subtitle);
  });
});

describe("WorkExplorer", () => {
  const seuil = Array.from({ length: 6 }, (_, index) => ({
    ...workItems[index % workItems.length],
    slug: `projet-${index}`,
    cardMockup: undefined,
    cardMedia: undefined,
  }));
  const filtres = ["Tous", "Rien"];
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  it("sur trois projets : ni recherche, ni millésime, ni filtres", () => {
    const html = renderToStaticMarkup(
      createElement(WorkExplorer, { filters: workContent.filters, works: workItems }),
    );
    expect(html).not.toContain('type="search"');
    expect(html).not.toContain("2026©");
    expect(html).not.toContain("aria-pressed");
    for (const work of workItems) expect(html).toContain(work.etiquette);
  });

  it("étiquette ce que chaque projet prouve, sans perdre les mentions honnêtes", () => {
    const [kpsull, wurth, nslysium] = workItems;
    expect(kpsull.etiquette).toContain("mené seul");
    expect(kpsull.etiquette).toContain("projet en propre");
    expect(wurth.etiquette).toContain("Un résultat mesuré");
    expect(nslysium.etiquette).toContain("workshop d’école");
  });

  it("à six projets, filtre, dit quand rien ne correspond, et revient à tout", async () => {
    contexte = installerDom();
    montage = await monter(createElement(WorkExplorer, { filters: filtres, works: seuil }));
    const bouton = (libelle) =>
      [...montage.conteneur.querySelectorAll("button")].find((b) => b.textContent.includes(libelle));

    await act(async () => {
      bouton("Rien").click();
    });
    expect(montage.conteneur.textContent).toContain(uiLabels.filters.workEmptyLabel);

    await act(async () => {
      bouton(uiLabels.filters.workResetLabel).click();
    });
    expect(montage.conteneur.textContent).not.toContain(uiLabels.filters.workEmptyLabel);
  });
});
