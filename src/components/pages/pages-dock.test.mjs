import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FloatingNav } from "@/components/layout";
import { content } from "@/lib/content";
import { BlogIndexPage } from "./blog/BlogIndexPage";
import { WorkDetailPage } from "./work/WorkDetailPage";
import { WorkNarrative } from "./work/WorkNarrative";
import { WorkPage } from "./work/WorkPage";
import { createWorkDetailContent } from "./work/work-detail-content";

/** Tous les éléments de l'arbre, sans exécuter les composants enfants. */
function elements(noeud, liste = []) {
  if (Array.isArray(noeud)) noeud.forEach((enfant) => elements(enfant, liste));
  else if (noeud?.props) {
    liste.push(noeud);
    elements(noeud.props.children, liste);
  }
  return liste;
}

const dockDe = (arbre) => elements(arbre).find((element) => element.type === FloatingNav);

describe("le dock sur les pages du site", async () => {
  const site = await content.getSiteConfig();
  const page = await content.getWorkPage();
  const works = page.items;

  it("le blog le monte, avec la configuration du site", async () => {
    const blog = await content.getBlog();
    expect(dockDe(BlogIndexPage({ blog, site })).props.site).toBe(site);
  });

  it("la liste des réalisations le monte", async () => {
    expect(dockDe(await WorkPage()).props.site).toBe(site);
  });

  it("chaque réalisation le monte", () => {
    for (const work of works) {
      expect(dockDe(WorkDetailPage({ site, work, works })).props.site).toBe(site);
    }
  });
});

describe("WorkNarrative", async () => {
  const { items: works } = await content.getWorkPage();
  const [work] = works;
  const rendre = (changements) => {
    const projet = { ...work, ...changements };
    const detail = createWorkDetailContent(projet);
    return renderToStaticMarkup(createElement(WorkNarrative, { detail, work: projet }));
  };

  it("raconte chaque réalisation : le problème, puis l'approche", () => {
    for (const projet of works) {
      const detail = createWorkDetailContent(projet);
      const html = renderToStaticMarkup(createElement(WorkNarrative, { detail, work: projet }))
        .replaceAll("&#x27;", "'")
        .replaceAll("&amp;", "&");
      expect(html).toContain(detail.problemTitle);
      expect(html).toContain(detail.approachTitle);
    }
  });

  it("range les écrans numérotés par leur numéro, quel que soit l'ordre d'écriture", () => {
    const html = rendre({
      gallery: [
        { src: "/b.webp", alt: "B", step: "02", stepTitle: "Écran deux" },
        { src: "/a.webp", alt: "A", step: "01", stepTitle: "Écran un" },
      ],
    });
    expect(html.indexOf("Écran un")).toBeGreaterThan(-1);
    expect(html.indexOf("Écran un")).toBeLessThan(html.indexOf("Écran deux"));
    expect(html).toContain('<span class="micro text-background/60">01</span>');
  });

  it("laisse le comparateur sans numéro quand la donnée n'en donne pas", () => {
    const image = { src: "/c.webp", alt: "C" };
    const html = rendre({
      gallery: [],
      comparison: {
        step: "",
        stepTitle: "Avant et après",
        caption: "La même fiche.",
        before: image,
        after: image,
        beforeLabel: "Avant",
        afterLabel: "Après",
      },
    });
    expect(html).toContain("Avant et après");
    expect(html.slice(html.indexOf("<figure"))).not.toContain('<span class="micro text-background/60">');
  });
});
