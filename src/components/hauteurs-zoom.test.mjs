import { describe, expect, it } from "bun:test";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { WorkCard } from "@/components/cards/WorkCard";
import { WorkCardPin } from "@/components/cards/WorkCardPin";
import { Header } from "@/components/layout/Header";
import { RelatedWork } from "@/components/pages/work/RelatedWork";
import { WorkHero } from "@/components/pages/work/WorkHero";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { content } from "@/lib/content";

/**
 * Au-delà de 2048 px, `body` porte un `zoom` (`--zoom-ecran`). Une hauteur en
 * `vh` ou une largeur en `vw` se mesure sur la fenêtre, PUIS le zoom l'agrandit :
 * une carte haute d'un écran en aurait fait deux. Chaque unité de fenêtre est
 * donc divisée par le zoom, qui vaut 1 en dessous de 2048 px.
 *
 * Rendu serveur de chaque composant touché : la classe divisée doit y être, et
 * l'unité brute ne doit plus y être.
 */
const routeur = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };
const rendre = (composant, props) =>
  renderToStaticMarkup(
    createElement(AppRouterContext.Provider, { value: routeur }, createElement(composant, props)),
  );
const SANS_ZOOM = /h-\[100vh\]|h-\[300vh\]|desktop:h-screen|h-\[90svh\]|,17\.2vw,|,7\.2vw,|\(50vw-60px\)/;

describe("Unités de fenêtre divisées par le zoom des grands écrans", async () => {
  const [site, works, page, posts] = await Promise.all([
    content.getSiteConfig(),
    content.getWorks(),
    content.getWorkPage(),
    content.getPosts(),
  ]);
  const [work] = works;

  it("WorkCard : la carte tient un écran de haut", () => {
    const html = rendre(WorkCard, { work, index: 0 });
    expect(html).toContain("h-[calc(100vh/var(--zoom-ecran,1))]");
    expect(html).not.toMatch(SANS_ZOOM);
  });

  it("WorkCardPin : la rangée et la piste épinglée suivent le zoom", () => {
    const html = rendre(WorkCardPin, { work, index: 0 });
    expect(html).toContain("desktop:h-[calc(100vh/var(--zoom-ecran,1))]");
    expect(html).toContain("h-[calc(300vh/var(--zoom-ecran,1))]");
    expect(html).toContain("sticky top-0 flex h-[calc(100vh/var(--zoom-ecran,1))]");
    expect(html).not.toMatch(SANS_ZOOM);
  });

  it("RelatedWork : la rangée et le titre calé sur la colonne de 1440", () => {
    const html = rendre(RelatedWork, { work });
    expect(html).toContain("desktop:h-[calc(100vh/var(--zoom-ecran,1))]");
    expect(html).toContain("left-[max(20px,calc((calc(100vw/var(--zoom-ecran,1))-1440px)/2))]");
    expect(html).not.toMatch(SANS_ZOOM);
  });

  it("WorkHero : la hauteur du héros et le corps du titre", () => {
    const html = rendre(WorkHero, { hero: page.hero });
    expect(html).toContain("h-[calc(90svh/var(--zoom-ecran,1))]");
    expect(html).toContain("text-[clamp(44px,calc(17.2vw/var(--zoom-ecran,1)),63px)]");
    expect(html).toContain("tablet:text-[clamp(60px,calc(9.2vw/var(--zoom-ecran,1)),78px)]");
    expect(html).not.toMatch(SANS_ZOOM);
  });

  it("ArticlesSection : le corps du titre, à 68 px comme à 64 px en tablette", () => {
    const accueil = rendre(ArticlesSection, { posts: posts.slice(0, 2) });
    expect(accueil).toContain("text-[clamp(40px,calc(13.6vw/var(--zoom-ecran,1)),52px)]");
    expect(accueil).toContain("desktop:text-[min(92px,calc((calc(50vw/var(--zoom-ecran,1))-60px)/6.6))]");
    expect(accueil).toContain("tablet:text-[clamp(52px,calc(7.2vw/var(--zoom-ecran,1)),68px)]");
    expect(accueil).not.toMatch(SANS_ZOOM);

    const aPropos = rendre(ArticlesSection, { posts: posts.slice(0, 2), headingTabletPx: 64 });
    expect(aPropos).toContain("tablet:text-[clamp(52px,calc(7.2vw/var(--zoom-ecran,1)),64px)]");
  });

  it("Header : le logo et le menu se calent sur la colonne de 1440 au bureau", () => {
    const html = rendre(Header, { site });
    expect(html).toContain("desktop:px-[max(30px,calc((100%-1440px)/2+30px))]");
  });
});
