import { describe, expect, it } from "bun:test";

import { PageTheme } from "@/components/pages/services/PageTheme";
import { pagesHub, pagesMetier, versPageTheme, visuelMetier } from "@/content/metiers";
import { siteConfig } from "@/content/site";
import { MESSAGES_METIER } from "@/lib/blog/apercu";
import { ApercuMetier } from "./ApercuMetier";
import { ListeMetiers, PlanMetiers } from "./ListeMetiers";
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

describe("PlanMetiers", () => {
  it("rend chaque page en petit, avec sa phrase et son lien", () => {
    const rendu = PlanMetiers({ entrees: pagesHub });
    for (const entree of pagesHub) {
      expect(texte(rendu)).toContain(entree.accroche);
      expect(liens(rendu)).toContain(entree.chemin);
    }
  });
});

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

describe("ApercuMetier", () => {
  const apercu = { page, visuel: { src: "data:image/svg+xml;base64,", alt: "Un visuel" }, motifs: [] };
  const pageRendue = (rendu) => rendu.props.children.find((c) => c?.type === PageTheme);

  it("rend la page telle qu'elle sera publiée, avec le visuel de l'aperçu et son maillage", () => {
    const rendu = ApercuMetier({ apercu, site: siteConfig });
    expect(pageRendue(rendu).props.page).toEqual(versPageTheme(page));
    expect(pageRendue(rendu).props.visuel).toBe(apercu.visuel);
    expect(pageRendue(rendu).props.maillage.type).toBe(MaillageMetier);
    expect(texte(rendu.props.children[0])).toBe("");
  });

  it("met les motifs de refus en tête", () => {
    const rendu = ApercuMetier({ apercu: { ...apercu, motifs: ["moins de 4 blocs", "« x » absent du texte"] }, site: siteConfig });
    const bandeau = rendu.props.children[0];
    expect(bandeau.props.role).toBe("alert");
    expect(texte(bandeau)).toContain(MESSAGES_METIER.refus);
    expect(texte(bandeau)).toContain("moins de 4 blocs");
    expect(texte(bandeau)).toContain("« x » absent du texte");
  });

  it("un corps illisible donne son message, sans page", () => {
    const rendu = ApercuMetier({ apercu: { illisible: "faq invalide" }, site: siteConfig });
    expect(texte(rendu)).toContain(MESSAGES_METIER.illisible);
    expect(texte(rendu)).toContain("faq invalide");
    expect(rendu.type).toBe("main");
  });
});
