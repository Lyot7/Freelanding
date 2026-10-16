import { afterEach, describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { herosPages } from "@/content/heros-pages";
import { prestations } from "@/content/offre";
import { pageCaen } from "@/content/page-caen";
import { pagesSecteur } from "@/content/pages-secteur";
import { pagesTheme } from "@/content/pages-theme";
import { marchesFilAriane, servicePageLabels } from "@/content/service-pages";
import { content } from "@/lib/content";
import { PageTheme } from "./PageTheme";
import { FilAriane, ServicePage } from "./ServicePage";

/**
 * Le fil d'Ariane a quitté le héros pour le PIED de page le 2026-10-16 : il
 * clôt `<main>`, en casse normale, séparé par `›`. `ServicePage` et `PageTheme`
 * sont des composants SERVEUR sans hook : on les appelle directement et on lit
 * l'arbre JSX rendu, sans exécuter les composants qu'il contient.
 */
function enfants(noeud) {
  const liste = noeud?.props?.children;
  if (liste === undefined || liste === null) return [];
  return (Array.isArray(liste) ? liste.flat(Infinity) : [liste]).filter(
    (enfant) => enfant !== null && enfant !== undefined && typeof enfant !== "boolean",
  );
}

function trouve(noeud, predicat) {
  if (!noeud || typeof noeud !== "object") return null;
  if (predicat(noeud)) return noeud;
  for (const enfant of enfants(noeud)) {
    const resultat = trouve(enfant, predicat);
    if (resultat) return resultat;
  }
  return null;
}

const principal = (arbre) => trouve(arbre, (noeud) => noeud.type === "main");
const dernier = (noeud) => enfants(noeud).at(-1);

describe("FilAriane", () => {
  const marches = [
    { libelle: "Accueil", href: "/" },
    { libelle: "Prestations", href: "/#services" },
    { libelle: "Site vitrine" },
  ];
  const html = renderToStaticMarkup(createElement(FilAriane, { marches }));

  it("est un nav nommé, chaque marche liée sauf la page courante", () => {
    expect(html).toMatch(new RegExp(`^<nav aria-label="${servicePageLabels.filAriane.intitule}"`));
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/#services"');
    expect(html).toMatch(/<span aria-current="page"[^>]*>Site vitrine<\/span><\/li><\/ol>/);
    expect(html.match(/aria-current/g)).toHaveLength(1);
  });

  it("sépare les marches par ›, décoratif, jamais avant la première", () => {
    expect(servicePageLabels.filAriane.separateur).toBe("›");
    expect(html.match(/<span aria-hidden="true">›<\/span>/g)).toHaveLength(marches.length - 1);
    expect(html).toMatch(/<ol[^>]*><li[^>]*><a[^>]*href="\/"/);
  });
});

describe("ServicePage, fil d'Ariane en pied de page", async () => {
  const site = await content.getSiteConfig();
  const [siteVitrine] = prestations;
  const heroLogiciel = herosPages.prestations["logiciel-metier"];

  afterEach(() => {
    herosPages.prestations["logiciel-metier"] = heroLogiciel;
  });

  it("clôt <main> sur la page de prestation", () => {
    const main = principal(ServicePage({ prestation: siteVitrine, site }));
    const fil = dernier(main);
    expect(fil.type).toBe(FilAriane);
    expect(fil.props.marches).toEqual(marchesFilAriane(siteVitrine, undefined));
    // Plus aucun fil dans le héros.
    const enTete = trouve(main, (noeud) => noeud.type === "section");
    expect(trouve(enTete, (noeud) => noeud.type === FilAriane)).toBeNull();
  });

  it("prolonge le fil d'une page secteur, l'omet sur une page de ville", () => {
    const secteur = pagesSecteur[0];
    const logiciel = prestations.find((p) => p.slug === "logiciel-metier");
    const filSecteur = dernier(principal(ServicePage({ prestation: logiciel, site, local: secteur })));
    expect(filSecteur.type).toBe(FilAriane);
    expect(filSecteur.props.marches).toEqual(marchesFilAriane(logiciel, secteur));

    const mainCaen = principal(ServicePage({ prestation: siteVitrine, site, local: pageCaen }));
    expect(trouve(mainCaen, (noeud) => noeud.type === FilAriane)).toBeNull();
  });

  it("divise la hauteur du héros par le zoom, avec ou sans photo", () => {
    const avecPhoto = trouve(
      principal(ServicePage({ prestation: siteVitrine, site })),
      (noeud) => noeud.type === "section",
    );
    expect(avecPhoto.props.className).toContain("min-h-[calc(85svh/var(--zoom-ecran,1))]");
    expect(avecPhoto.props.className).toContain("tablet:min-h-[calc(70svh/var(--zoom-ecran,1))]");

    const logiciel = prestations.find((p) => p.slug === "logiciel-metier");
    herosPages.prestations["logiciel-metier"] = undefined;
    const sansPhoto = trouve(
      principal(ServicePage({ prestation: logiciel, site })),
      (noeud) => noeud.type === "section",
    );
    expect(sansPhoto.props.className).toContain("min-h-[calc(70svh/var(--zoom-ecran,1))]");
    expect(sansPhoto.props.className).not.toContain("85svh");
  });
});

describe("PageTheme, fil d'Ariane en pied de page", async () => {
  const site = await content.getSiteConfig();

  it("clôt <main> quand la page a un fil, et seulement là", () => {
    const avecFil = pagesTheme.find((page) => page.filAriane);
    const fil = dernier(principal(PageTheme({ page: avecFil, site })));
    expect(fil.type).toBe(FilAriane);
    expect(fil.props.marches).toEqual(avecFil.filAriane);

    const sansFil = { ...avecFil, filAriane: undefined };
    const main = principal(PageTheme({ page: sansFil, site }));
    expect(trouve(main, (noeud) => noeud.type === FilAriane)).toBeNull();
  });

  it("divise la hauteur du héros par le zoom", () => {
    const main = principal(PageTheme({ page: pagesTheme[0], site }));
    const enTete = trouve(main, (noeud) => noeud.type === "section");
    expect(enTete.props.className).toContain("min-h-[calc(70svh/var(--zoom-ecran,1))]");
  });
});
