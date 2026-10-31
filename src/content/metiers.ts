/**
 * LES PAGES PAR MÉTIER : `/logiciel-metier` et `/logiciel-metier/<metier>`.
 *
 * DEMANDE D'ELIOTT DU 2026-10-30. Une affaire est arrivée par ChatGPT : un
 * dirigeant cherche un logiciel pour SON métier, et Eliott revend un même
 * logiciel aux confrères d'un client. Ces pages parlent des tâches réelles du
 * métier, sans aucun nom ni donnée d'une entreprise.
 *
 * ALIMENTÉES PAR `metiers.json`, et non par du TypeScript, pour une raison : le
 * circuit de publication du blog écrit des données, jamais du code (`docs/BLOG.md`).
 * Une page ajoutée au fichier entre seule au hub, au sitemap, à `llms.txt` et au
 * maillage. Le fichier arrivant comme une donnée, il est relu ici (`lirePages`) :
 * une entrée malformée casse le build au lieu de casser la page.
 *
 * UNE PAGE N'EST PUBLIÉE QUE SI SON CONTENU EST PROPRE AU MÉTIER, et c'est
 * vérifié, pas promis. Google laisse hors de l'index trois pages secteur sur
 * quatre : même gabarit, même ordre, quelques mots changés. `motifsDeRefus` dit
 * pourquoi une page ne part pas : blocs trop peu nombreux, même enchaînement de
 * blocs qu'une autre page, vocabulaire du métier absent, paragraphe repris,
 * texte trop proche d'une autre page. `pagesMetier` ne garde que celles qui
 * passent, et `metiers.test.mjs` refuse qu'une entrée du fichier soit écartée :
 * dans le circuit, le test rouge empêche la poussée.
 *
 * AUCUN MONTANT DANS LE FICHIER : le prix vient d'`offre.ts`, au rendu.
 */
import { blogPosts } from "./blog";
import donnees from "./metiers.json";
import { prestation } from "./offre";
import type { BlocTheme, PageTheme } from "./page-theme";
import { pagesSecteur } from "./pages-secteur";

export const CHEMIN_HUB_METIERS = "/logiciel-metier";

/** Thèmes qui relient les pages entre elles et aux articles du blog. */
export const THEMES = [
  "facturation",
  "location",
  "chantier",
  "planning",
  "terrain",
  "stock",
  "flotte",
  "relances",
] as const;

export type Theme = (typeof THEMES)[number];

/** Une entrée de `metiers.json`, telle que le gabarit la lit. */
export interface PageMetier {
  readonly slug: string;
  /** Date de publication, `<lastmod>` du sitemap. */
  readonly date: string;
  /** Nom du métier, dans les listes et le fil d'Ariane. */
  readonly libelle: string;
  readonly h1: string;
  readonly seo: { readonly titre: string; readonly description: string };
  readonly resume: string;
  /** Une phrase : ce que la page couvre, sous son nom dans les listes. */
  readonly accroche: string;
  readonly noteLlms: string;
  readonly themes: readonly Theme[];
  /** Mots du métier : chacun doit se retrouver dans le texte de la page. */
  readonly lexique: readonly string[];
  readonly image: { readonly alt: string };
  readonly titreOffre: string;
  readonly blocs: readonly BlocTheme[];
  readonly faq: PageTheme["faq"];
}

/** Une page publiée : l'entrée et son adresse. */
export interface PageMetierPubliee extends PageMetier {
  readonly chemin: string;
}

const estObjet = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const estTexte = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

const estListe = (v: unknown, test: (x: unknown) => boolean): v is readonly unknown[] =>
  Array.isArray(v) && v.length > 0 && v.every(test);

const estTheme = (v: unknown): v is Theme => THEMES.some((t) => t === v);

const estBloc = (v: unknown): v is BlocTheme => {
  if (!estObjet(v) || !estTexte(v.id) || !estTexte(v.titre)) return false;
  if (!estListe(v.paragraphes, estTexte)) return false;
  const titreCorps = (x: unknown): boolean => estObjet(x) && estTexte(x.titre) && estTexte(x.corps);
  switch (v.type) {
    case "section":
      return estListe(v.points, titreCorps);
    case "etapes":
      return estListe(v.etapes, titreCorps);
    case "tableau":
      return (
        estTexte(v.legende) &&
        estListe(v.colonnes, estTexte) &&
        estListe(v.lignes, (l) => estListe(l, estTexte))
      );
    default:
      return false;
  }
};

const estQuestion = (v: unknown): boolean =>
  estObjet(v) && estTexte(v.question) && estTexte(v.answer);

/** Relit une entrée du fichier ; lève une erreur qui nomme ce qui manque. */
function lirePage(v: unknown, index: number): PageMetier {
  const champ = (nom: string) => new Error(`metiers.json, entrée ${index} : ${nom} invalide`);
  if (!estObjet(v)) throw champ("entrée");
  const { slug, date, libelle, h1, seo, resume, accroche, noteLlms } = v;
  const { themes, lexique, image, titreOffre, blocs, faq } = v;
  if (!estTexte(slug) || !/^[a-z0-9]+(-[a-z0-9]+)*$/u.test(slug)) throw champ("slug");
  if (!estTexte(date) || !/^\d{4}-\d{2}-\d{2}$/u.test(date)) throw champ("date");
  if (!estTexte(libelle) || !estTexte(h1)) throw champ("h1");
  if (!estTexte(resume) || !estTexte(accroche) || !estTexte(noteLlms)) throw champ("resume");
  if (!estObjet(seo) || !estTexte(seo.titre) || !estTexte(seo.description)) throw champ("seo");
  if (!estListe(themes, estTheme)) throw champ("themes");
  if (!estListe(lexique, estTexte)) throw champ("lexique");
  if (!estObjet(image) || !estTexte(image.alt)) throw champ("image");
  if (!estTexte(titreOffre)) throw champ("titreOffre");
  if (!estListe(blocs, estBloc)) throw champ("blocs");
  if (!estObjet(faq) || !estTexte(faq.eyebrow)) throw champ("faq");
  if (!estListe(faq.titleLines, estTexte) || !estListe(faq.items, estQuestion)) throw champ("faq");
  return v as unknown as PageMetier;
}

/** Toutes les entrées du fichier, publiées ou non. */
export const entreesMetier: readonly PageMetier[] = (donnees as readonly unknown[]).map(lirePage);

/** Les phrases courantes d'une page, à plat. */
export function textesCourants(page: PageMetier): readonly string[] {
  return [
    page.resume,
    ...page.blocs.flatMap((b) => [
      ...b.paragraphes,
      ...(b.type === "section" ? b.points.map((p) => p.corps) : []),
      ...(b.type === "etapes" ? b.etapes.map((e) => e.corps) : []),
      ...(b.type === "tableau" ? b.lignes.flat() : []),
    ]),
    ...page.faq.items.map((i) => i.answer),
  ];
}

/** L'enchaînement des natures de bloc, signature de la mise en page. */
const signature = (page: PageMetier): string => page.blocs.map((b) => b.type).join(">");

/** Suites de trois mots, ce qui se copie d'une page à l'autre. */
function trigrammes(page: PageMetier): ReadonlySet<string> {
  const mots = textesCourants(page)
    .join(" ")
    .toLocaleLowerCase("fr")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  return new Set(mots.slice(2).map((m, i) => `${mots[i]} ${mots[i + 1]} ${m}`));
}

/** Part des suites de mots communes à deux pages, de 0 à 1. */
export function ressemblance(a: PageMetier, b: PageMetier): number {
  const ta = trigrammes(a);
  const tb = trigrammes(b);
  const communs = [...ta].filter((t) => tb.has(t)).length;
  return communs / Math.max(1, Math.min(ta.size, tb.size));
}

/** Au-delà, deux pages disent la même chose à quelques mots près. */
export const RESSEMBLANCE_MAX = 0.05;
export const BLOCS_MIN = 4;
export const LEXIQUE_MIN = 6;

/** Ce qui empêche une page de partir. Vide : elle est propre à son métier. */
export function motifsDeRefus(page: PageMetier, toutes: readonly PageMetier[]): readonly string[] {
  const motifs: string[] = [];
  const autres = toutes.filter((p) => p.slug !== page.slug);
  const texte = [
    ...textesCourants(page),
    ...page.blocs.flatMap((b) => [
      b.titre,
      ...(b.type === "section" ? b.points.map((p) => p.titre) : []),
      ...(b.type === "etapes" ? b.etapes.map((e) => e.titre) : []),
    ]),
  ]
    .join(" ")
    .toLocaleLowerCase("fr");

  if (page.blocs.length < BLOCS_MIN) motifs.push(`moins de ${BLOCS_MIN} blocs`);
  if (new Set(page.blocs.map((b) => b.type)).size < 2) motifs.push("une seule nature de bloc");
  if (page.lexique.length < LEXIQUE_MIN) motifs.push(`moins de ${LEXIQUE_MIN} mots du métier`);
  for (const mot of page.lexique) {
    if (!texte.includes(mot.toLocaleLowerCase("fr"))) motifs.push(`« ${mot} » absent du texte`);
  }
  const phrases = new Set(autres.flatMap(textesCourants));
  for (const phrase of textesCourants(page)) {
    if (phrase.length > 40 && phrases.has(phrase)) motifs.push(`repris d’une autre page : ${phrase}`);
  }
  for (const autre of autres) {
    if (signature(autre) === signature(page)) motifs.push(`même enchaînement que ${autre.slug}`);
    if (ressemblance(page, autre) > RESSEMBLANCE_MAX) motifs.push(`trop proche de ${autre.slug}`);
  }
  return motifs;
}

/** Les pages publiées, dans l'ordre du fichier. */
export const pagesMetier: readonly PageMetierPubliee[] = entreesMetier
  .filter((p) => motifsDeRefus(p, entreesMetier).length === 0)
  .map((p) => ({ ...p, chemin: `${CHEMIN_HUB_METIERS}/${p.slug}` }));

export const pageMetier = (slug: string): PageMetierPubliee | undefined =>
  pagesMetier.find((p) => p.slug === slug);

/** Une ligne d'une liste de métiers. */
export interface EntreeHub {
  readonly libelle: string;
  readonly chemin: string;
  readonly accroche: string;
  readonly themes: readonly Theme[];
}

/*
 * LES PAGES SECTEUR DE 2026-10-02 GARDENT LEUR ADRESSE : le BTP sort déjà sur ses
 * requêtes, le négoce et la location servent le blog. Le hub les liste avec les
 * autres, et leurs thèmes les rendent voisines des pages par métier.
 */
const THEMES_SECTEUR: Readonly<Record<string, readonly Theme[]>> = {
  btp: ["chantier", "facturation", "planning", "terrain"],
  "location-materiel": ["location", "facturation", "stock", "planning"],
  "negoce-distribution": ["stock", "facturation", "relances"],
};

/** Tout ce que le hub liste : pages par métier, puis pages secteur. */
export const pagesHub: readonly EntreeHub[] = [
  ...pagesMetier,
  ...pagesSecteur.map((p) => ({
    libelle: p.marcheFilAriane,
    chemin: p.chemin,
    accroche: p.accroche,
    themes: THEMES_SECTEUR[p.slug] ?? [],
  })),
];

const communs = (a: readonly Theme[], b: readonly Theme[]): number =>
  a.filter((t) => b.includes(t)).length;

/** Les 3 métiers les plus proches par leurs thèmes, à égalité dans l'ordre du hub. */
export function voisinsDe(page: { readonly chemin: string; readonly themes: readonly Theme[] }): readonly EntreeHub[] {
  return pagesHub
    .filter((p) => p.chemin !== page.chemin)
    .map((entree, rang) => ({ entree, rang, score: communs(entree.themes, page.themes) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.rang - b.rang)
    .slice(0, 3)
    .map((p) => p.entree);
}

/* LES ARTICLES PAR THÈME, du plus proche au plus général. */
const ARTICLES_PAR_THEME: Readonly<Record<Theme, readonly string[]>> = {
  facturation: ["automatisation-factures-fournisseurs", "erp-pme"],
  location: ["remplacer-excel-par-un-logiciel"],
  chantier: ["remplacer-excel-par-un-logiciel", "logiciel-gestion-intervention"],
  planning: ["remplacer-excel-par-un-logiciel", "logiciel-gestion-de-production"],
  terrain: ["logiciel-gestion-intervention"],
  stock: ["logiciel-gestion-de-stock", "synchroniser-catalogue-stock-et-commandes"],
  flotte: ["logiciel-gestion-intervention", "crm-sur-mesure"],
  relances: ["crm-sur-mesure", "logiciel-relance-client"],
};

export const ARTICLES_MAX = 3;

/** Les articles publiés liés à une page, sans doublon. */
export function articlesDe(page: { readonly themes: readonly Theme[] }) {
  const slugs = [...new Set(page.themes.flatMap((t) => ARTICLES_PAR_THEME[t]))];
  return slugs
    .flatMap((slug) => blogPosts.filter((post) => post.slug === slug))
    .slice(0, ARTICLES_MAX);
}

const LOGICIEL = prestation("logiciel");

/** La page par métier, sous la forme que lit le gabarit des pages thématiques. */
export function versPageTheme(page: PageMetierPubliee): Omit<PageTheme, "id"> {
  return {
    ...page,
    prestation: LOGICIEL.id,
    offre: LOGICIEL,
    libelleLien: page.libelle,
    filAriane: [
      { libelle: hubMetiers.filAccueil, href: "/" },
      { libelle: hubMetiers.filHub, href: CHEMIN_HUB_METIERS },
      { libelle: page.libelle },
    ],
  };
}

/** Le visuel d'une page : trois JPG tirés du même SVG (`scripts/visuel-article.mjs`). */
export const visuelMetier = (slug: string) => ({
  heros: `/images/heros/metier-${slug}.jpg`,
  partage: `/images/og-metier-${slug}.jpg`,
});

/** Le hub, et les libellés du maillage. Aucun texte dans les composants. */
export const hubMetiers = {
  seo: {
    titre: "Logiciel métier, secteur par secteur · Eliott Bouquerel",
    description:
      "Chaque métier a ses corvées : une location en jours réels, une fiche à retaper, un client à rappeler la veille. Voyez ce qui disparaît dans le vôtre.",
  },
  h1: "Un logiciel pour votre métier",
  resume:
    "Chaque métier a ses corvées : une location qui se compte en jours réels, une fiche qui se retape au bureau, un destinataire à rappeler la veille. Choisissez le vôtre, et voyez ce qui disparaît.",
  filAccueil: "Accueil",
  filHub: "Par métier",
  titreListe: "Les métiers",
  autre: {
    titre: "Votre métier n’est pas dans la liste ?",
    corps:
      "La page viendra, mais votre logiciel n’a pas à l’attendre. Décrivez-moi la tâche qui vous bloque, je vous dis ce qu’elle deviendrait.",
    cta: "Réserver un appel",
  },
  maillage: {
    voisins: "Métiers voisins",
    articles: "À lire aussi",
    hub: "Tous les métiers",
  },
} as const;
