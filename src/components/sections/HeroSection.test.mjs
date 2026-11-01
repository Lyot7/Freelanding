import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { homeContent } from "@/content/home";
import { siteConfig } from "@/content/site";
import { uiLabels } from "@/content/ui";
import { content } from "@/lib/content";
import { HeroSection, HeroVideo } from "./HeroSection";

/**
 * `HeroVideo` ne pose la vidéo qu'APRÈS le montage (`useEffect`, jamais au
 * premier rendu) : un DOM réel est nécessaire pour observer `aria-hidden` et
 * `tabIndex={-1}`, posés le 2026-09-21 pour sortir ce décor muet de l'arbre
 * d'accessibilité et du parcours clavier.
 *
 * Un `JSDOM` local (et non l'environnement global d'un test runner) : ce
 * fichier tourne aussi bien sous `bun test` (le runtime réel du dépôt) que
 * sous `bunx vitest` (rejoué par le gate pre-pr-gate), sans dépendre d'une
 * configuration propre à l'un des deux.
 */
function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  // `navigator` est un accesseur en lecture seule sur `globalThis` depuis
  // Node 21 : une simple affectation lève `TypeError`, `defineProperty` la
  // remplace proprement, et reste sans effet quand l'accesseur n'existe pas.
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom n'implémente pas matchMedia : la vidéo n'est montée qu'à partir de
  // 810 px (voir l'en-tête de `HeroVideo`), donc `matches: true` ici.
  dom.window.matchMedia = (query) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    },
  });
  return {
    dom,
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      Object.defineProperty(globalThis, "navigator", {
        value: precedent.navigator,
        configurable: true,
        writable: true,
      });
    },
  };
}

describe("HeroVideo", () => {
  let contexte;

  afterEach(() => {
    contexte?.restaurer();
    contexte = undefined;
  });

  it("sort la vidéo décorative de l'arbre d'accessibilité une fois montée", async () => {
    contexte = installerDom();
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);

    await act(async () => {
      racine.render(createElement(HeroVideo, { src: "/videos/hero-loop.mp4", poster: "/hero.jpg" }));
    });

    // `document.readyState` de jsdom vaut déjà "complete" : `HeroVideo` a donc
    // programmé `window.setTimeout(lancer, 0)` (voir son `useEffect`). On le
    // laisse s'exécuter réellement, à l'intérieur d'un `act()` qui attend son
    // propre écoulement.
    await act(async () => {
      await new Promise((resoudre) => setTimeout(resoudre, 20));
    });

    const video = conteneur.querySelector("video");
    expect(video).not.toBeNull();
    expect(video.getAttribute("aria-hidden")).toBe("true");
    expect(video.getAttribute("tabindex")).toBe("-1");

    await act(async () => {
      racine.unmount();
    });
    // Laisse le scheduler de React vider sa file avant de restaurer les
    // globals : une continuation en retard référencerait sinon un `window`
    // déjà remplacé.
    await new Promise((resoudre) => setTimeout(resoudre, 20));
  });
});

/**
 * Le prix d'une agence et le mien pour le même site (2026-10-16), rendu côté
 * serveur sous les portes, à côté des preuves. Le décor vidéo est retiré : il
 * n'a pas d'effet sur ce bloc et ne se monte qu'au client.
 */
describe("HeroSection, comparaison de prix", async () => {
  const site = await content.getSiteConfig();
  const heroSansVideo = { ...homeContent.hero, media: undefined };
  const comparaison = homeContent.hero.comparison;
  // `DemanderAssistant`, monté dans le héros, lit le routeur de l'app.
  const routeur = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };
  const rendre = (hero, logos) =>
    renderToStaticMarkup(
      createElement(
        AppRouterContext.Provider,
        { value: routeur },
        createElement(HeroSection, { hero, site, logos }),
      ),
    );
  const BLOC_BAS = "border-t border-white/10 pt-[18px]";

  it("porte l'ancre #services sur le seul h1, cible des fils d'Ariane", () => {
    const html = rendre(heroSansVideo);
    expect(html).toMatch(/<h1 id="services" data-part="hero-titre"/);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("le h1 vaut exactement le titre : ni prix, ni lien, ni flèche", () => {
    const html = rendre(heroSansVideo);
    const h1 = html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)?.[1] ?? "";
    expect(h1.replace(/<[^>]+>/g, "")).toBe("Je vous rends des heures.");
    expect(h1).not.toContain("<a ");
    expect(h1).not.toContain("<svg");
  });

  it("dit sous le bouton la durée de l'appel, gratuit et sans engagement", () => {
    const html = rendre(heroSansVideo);
    expect(html).toContain(`data-part="hero-note-cta"`);
    expect(html).toContain(homeContent.hero.ctaNote);
  });

  it("nomme le sujet, puis chaque ligne avec son prix, le mien seul en accent", () => {
    const html = rendre(heroSansVideo);
    const bloc = html.slice(html.indexOf('data-part="comparaison"'));
    expect(bloc).toContain(comparaison.sujet);
    // Une seule ligne : le sujet d'abord, puis chaque acteur et son prix.
    let curseur = bloc.indexOf(comparaison.sujet);
    for (const ligne of comparaison.lignes) {
      const motif = new RegExp(
        `${ligne.qui}<span class="[^"]*${ligne.fort ? "text-accent" : "text-foreground"}"[^>]*>${ligne.prix.replace(/\s/gu, "\\s")}</span>`,
      );
      expect(bloc).toMatch(motif);
      const position = bloc.indexOf(ligne.prix);
      expect(position).toBeGreaterThan(curseur);
      expect(bloc).toContain(ligne.detail);
      curseur = position;
    }
    expect(bloc).not.toContain("<dl");
    expect(comparaison.lignes.filter((ligne) => ligne.fort)).toHaveLength(1);
  });

  it("cite sa source dans un nouvel onglet", () => {
    const html = rendre(heroSansVideo);
    const bloc = html.slice(html.indexOf('data-part="comparaison"'));
    expect(bloc).toContain(uiLabels.hero.source);
    const lien = bloc.match(/<a [^>]*>[^<]*<\/a>/)?.[0] ?? "";
    expect(lien).toContain(`href="${comparaison.source.href}"`);
    expect(lien).toContain('target="_blank"');
    expect(lien).toContain('rel="noopener noreferrer"');
    expect(lien).toContain(`>${comparaison.source.label}</a>`);
  });

  it("garde le bas du héros pour les preuves, la comparaison ou les logos seuls", () => {
    const preuve = { value: "-92 %", label: "d'erreurs de saisie" };
    const avecPreuves = rendre({ ...heroSansVideo, comparison: undefined, proofs: [preuve] });
    expect(avecPreuves).toContain(BLOC_BAS);
    expect(avecPreuves).toContain('data-part="preuve"');
    expect(avecPreuves).not.toContain('data-part="comparaison"');

    const comparaisonSeule = rendre({ ...heroSansVideo, proofs: [] });
    expect(comparaisonSeule).toContain(BLOC_BAS);
    expect(comparaisonSeule).toContain('data-part="comparaison"');

    const logosSeuls = rendre(
      { ...heroSansVideo, comparison: undefined, proofs: [] },
      createElement("span", { "data-part": "logos" }),
    );
    expect(logosSeuls).toContain(BLOC_BAS);
    expect(logosSeuls).toContain('data-part="logos"');

    const rien = rendre({ ...heroSansVideo, comparison: undefined, proofs: [] });
    expect(rien).not.toContain(BLOC_BAS);
  });
});

describe("HeroSection, le lien vers l'offre", () => {
  it("lie l'offre sans lister aucun métier", () => {
    const rendu = JSON.stringify(HeroSection({ hero: homeContent.hero, site: siteConfig }));
    expect(rendu).toContain(homeContent.hero.offerLink.label);
    expect(rendu).not.toContain("/logiciel-metier/");
  });

  it("n'affiche pas le lien quand il manque", () => {
    const hero = { ...homeContent.hero, offerLink: undefined };
    const rendu = JSON.stringify(HeroSection({ hero, site: siteConfig }));
    expect(rendu).not.toContain(homeContent.hero.offerLink.label);
  });
});
