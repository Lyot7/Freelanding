import { describe, expect, it } from "bun:test";

import { content } from "@/lib/content";
import { pagesTheme } from "@/content/pages-theme";
import { PageTheme } from "./PageTheme";
import { metadataTheme, RouteTheme } from "./RouteTheme";

/**
 * `PageTheme` est un composant SERVEUR sans hook. On l'appelle directement,
 * puis on déroule SES sous-composants (et `SectionDeuxMoities`, qu'il
 * réutilise) pour obtenir le texte rendu, sans DOM. Les composants partagés
 * (en-tête, pied de page, rendez-vous, FAQ, animation) ne sont pas appelés :
 * seul leur contenu passé en enfants est lu. Ils ont leurs propres tests.
 */
const DEROULES = new Set([
  "Bloc",
  "Tableau",
  "Etapes",
  "Chiffres",
  "EnTeteBloc",
  "LiensBloc",
  "Enveloppe",
  "SectionDeuxMoities",
  "OffreDetail",
  "ListeOffre",
]);

/** Tout le texte d'un arbre JSX, composants locaux déroulés. */
function texte(noeud) {
  if (noeud === null || noeud === undefined || typeof noeud === "boolean") return "";
  if (typeof noeud === "string" || typeof noeud === "number") return String(noeud);
  if (Array.isArray(noeud)) return noeud.map(texte).join(" ");
  const { type, props } = noeud;
  if (typeof type === "function") {
    return DEROULES.has(type.name) ? texte(type(props)) : texte(props?.children);
  }
  return [props?.caption, texte(props?.children)].filter(Boolean).join(" ");
}

/** Les attributs `href` d'un arbre, composants locaux déroulés. */
function liens(noeud) {
  if (!noeud || typeof noeud !== "object") return [];
  if (Array.isArray(noeud)) return noeud.flatMap(liens);
  const { type, props } = noeud;
  if (typeof type === "function" && DEROULES.has(type.name)) return liens(type(props));
  return [...(props?.href ? [props.href] : []), ...liens(props?.children)];
}

describe("PageTheme", async () => {
  const site = await content.getSiteConfig();

  for (const page of pagesTheme) {
    describe(page.id, () => {
      const arbre = PageTheme({ page, site });
      const rendu = texte(arbre);

      it("affiche le H1, le chapô et le titre de l'offre", () => {
        expect(rendu).toContain(page.h1);
        expect(rendu).toContain(page.resume);
        expect(rendu).toContain(page.titreOffre);
      });

      it("rend le titre de chaque bloc, quelle que soit sa nature", () => {
        for (const bloc of page.blocs) {
          expect(rendu).toContain(bloc.titre);
        }
      });

      it("rend le contenu propre à chaque nature de bloc", () => {
        for (const bloc of page.blocs) {
          if (bloc.type === "tableau") {
            for (const ligne of bloc.lignes) expect(rendu).toContain(ligne[0]);
            for (const colonne of bloc.colonnes.slice(1)) expect(rendu).toContain(colonne);
            if (bloc.total) expect(rendu).toContain(bloc.total.at(-1));
            if (bloc.note) expect(rendu).toContain(bloc.note);
          }
          if (bloc.type === "etapes") {
            for (const etape of bloc.etapes) {
              expect(rendu).toContain(etape.titre);
              if (etape.passe) expect(rendu).toContain(etape.passe);
            }
            expect(rendu).toContain(String(bloc.etapes.length).padStart(2, "0"));
          }
          if (bloc.type === "chiffres") {
            for (const chiffre of bloc.chiffres) expect(rendu).toContain(chiffre.valeur);
            if (bloc.source) expect(rendu).toContain(bloc.source.description);
          }
          if (bloc.type === "section") {
            for (const point of bloc.points) expect(rendu).toContain(point.titre);
          }
        }
      });

      it("pose chaque lien déclaré par les blocs", () => {
        const hrefs = liens(arbre);
        for (const bloc of page.blocs) {
          for (const lien of bloc.liens?.items ?? []) expect(hrefs).toContain(lien.href);
          if (bloc.type === "chiffres" && bloc.source) expect(hrefs).toContain(bloc.source.href);
        }
      });

      it("affiche le fil d'Ariane seulement quand la page en déclare un", () => {
        const fil = JSON.stringify(arbre).includes("\"marches\"");
        expect(fil).toBe(page.filAriane !== undefined);
      });
    });
  }
});

describe("RouteTheme", () => {
  it("donne à chaque page son titre, sa description et son adresse canonique", () => {
    for (const page of pagesTheme) {
      const meta = metadataTheme(page.id);
      expect(JSON.stringify(meta.title)).toContain(page.seo.titre.split(" · ")[0]);
      expect(meta.description).toBe(page.seo.description);
      expect(JSON.stringify(meta.alternates)).toContain(page.chemin);
    }
  });

  it("déclare au JSON-LD l'offre affichée, son prix et la zone de la page", async () => {
    for (const page of pagesTheme) {
      const arbre = await RouteTheme({ id: page.id });
      const json = JSON.stringify(arbre);
      expect(json).toContain(`"minPrice":${page.offre.plancher}`);
      expect(json).toContain(page.offre.nom);
      expect(json).toContain("FAQPage");
      expect(json.includes("BreadcrumbList")).toBe(page.filAriane !== undefined);
      if (page.zones) expect(json).toContain("\"City\"");
    }
  });
});

describe("PageTheme, tons alternés", () => {
  it("rend un tableau à total sur le ton sombre quand il arrive en deuxième", async () => {
    const site = await content.getSiteConfig();
    const base = pagesTheme.find((p) => p.id === "automatisation");
    const [tableau, section] = base.blocs;
    const page = { ...base, blocs: [section, tableau] };
    const arbre = PageTheme({ page, site });
    const json = JSON.stringify(texte(arbre));
    expect(json).toContain(tableau.total.at(-1));
    const sombre = (noeud) =>
      !!noeud && typeof noeud === "object" &&
      (Array.isArray(noeud)
        ? noeud.some(sombre)
        : typeof noeud.type === "function" && DEROULES.has(noeud.type.name)
          ? sombre(noeud.type(noeud.props))
          : String(noeud.props?.className ?? "").includes("border-white/40") || sombre(noeud.props?.children));
    expect(sombre(arbre)).toBe(true);
  });
});
