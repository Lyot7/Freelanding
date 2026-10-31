import { describe, expect, it } from "bun:test";

import { PageTheme } from "@/components/pages/services/PageTheme";
import { MetiersSection } from "@/components/sections/MetiersSection";
import { homeContent } from "@/content/home";
import { pagesHub, pagesMetier, versPageTheme, visuelMetier } from "@/content/metiers";
import { siteConfig } from "@/content/site";
import { ListeMetiers } from "./ListeMetiers";
import { MaillageMetier } from "./MaillageMetier";

/** Tout le texte d'un arbre JSX, la liste des métiers déroulée. */
function texte(noeud) {
  if (noeud === null || noeud === undefined || typeof noeud === "boolean") return "";
  if (typeof noeud === "string" || typeof noeud === "number") return String(noeud);
  if (Array.isArray(noeud)) return noeud.map(texte).join(" ");
  const { type, props } = noeud;
  if (type === ListeMetiers) return texte(ListeMetiers(props));
  return texte(props?.children);
}

/** Les `href` d'un arbre, la liste des métiers déroulée. */
function liens(noeud) {
  if (noeud === null || noeud === undefined || typeof noeud !== "object") return [];
  if (Array.isArray(noeud)) return noeud.flatMap(liens);
  const { type, props } = noeud;
  if (type === ListeMetiers) return liens(ListeMetiers(props));
  return [...(props?.href ? [props.href] : []), ...liens(props?.children)];
}

const page = pagesMetier[0];

describe("ListeMetiers", () => {
  it("rend chaque métier avec sa phrase et son lien, sur fond sombre", () => {
    const rendu = ListeMetiers({ entrees: pagesHub });
    for (const entree of pagesHub) {
      expect(texte(rendu)).toContain(entree.libelle);
      expect(texte(rendu)).toContain(entree.accroche);
      expect(liens(rendu)).toContain(entree.chemin);
    }
    expect(rendu.props.className).toContain("border-white/10");
  });

  it("change de filet sur fond clair", () => {
    expect(ListeMetiers({ entrees: pagesHub, ton: "clair" }).props.className).toContain("border-black");
  });
});

describe("MetiersSection", () => {
  it("rend le titre, l'intro, le renvoi au hub et tous les métiers", () => {
    const rendu = MetiersSection({ metiers: homeContent.metiers, entrees: pagesHub });
    expect(texte(rendu)).toContain(homeContent.metiers.titleLines[0]);
    expect(texte(rendu)).toContain(homeContent.metiers.intro);
    expect(liens(rendu)).toContain(homeContent.metiers.cta.href);
    expect(liens(rendu)).toContain(pagesHub[0].chemin);
  });
});

describe("MaillageMetier", () => {
  it("lie le hub, les voisins et les articles, jamais la page elle-même", () => {
    const hrefs = liens(MaillageMetier({ page }));
    expect(hrefs).toContain("/logiciel-metier");
    expect(hrefs).not.toContain(page.chemin);
    expect(hrefs.some((href) => href.startsWith("/blog/"))).toBe(true);
  });

  it("n'affiche pas la liste d'articles quand aucun n'est lié", () => {
    const hrefs = liens(MaillageMetier({ page: { ...page, themes: [] } }));
    expect(hrefs.some((href) => href.startsWith("/blog/"))).toBe(false);
  });
});

describe("PageTheme, avec un visuel et un maillage", () => {
  it("pose le visuel à la place du fond animé et place le maillage", () => {
    const visuel = { src: visuelMetier(page.slug).heros, alt: page.image.alt };
    const maillage = "maillage";
    const rendu = JSON.stringify(
      PageTheme({ page: versPageTheme(page), site: siteConfig, visuel, maillage }),
    );
    expect(rendu).toContain(visuel.src);
    expect(rendu).toContain("maillage");
  });
});
