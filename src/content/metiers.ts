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
import {
  CHEMIN_AUTOMATISATION,
  CHEMIN_ERP,
  CHEMIN_GMAO,
  type BlocTheme,
  type PageTheme,
} from "./page-theme";
import { pagesSecteur, type SecteurSlug } from "./pages-secteur";

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
  /** « fonction » : la page vise un besoin (planning, flotte), pas un métier. */
  readonly nature?: "fonction";
  /** Date de publication, `<lastmod>` du sitemap. */
  readonly date: string;
  /** La validation du cockpit, marquée publiée une fois la page en ligne. Absente d'une page écrite à la main. */
  readonly validationId?: string;
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

const absentOuTexte = (v: unknown): boolean => v === undefined || estTexte(v);

/** Un champ optionnel mal formé casserait le rendu : il se refuse comme un champ obligatoire. */
const estLiens = (v: unknown): boolean =>
  estObjet(v) &&
  estTexte(v.titre) &&
  estListe(
    v.items,
    (l) => estObjet(l) && estTexte(l.href) && estTexte(l.libelle) && estTexte(l.description),
  );

const estBloc = (v: unknown): v is BlocTheme => {
  if (!estObjet(v) || !estTexte(v.id) || !estTexte(v.titre)) return false;
  if (!estListe(v.paragraphes, estTexte)) return false;
  if (v.liens !== undefined && !estLiens(v.liens)) return false;
  const titreCorps = (x: unknown): boolean => estObjet(x) && estTexte(x.titre) && estTexte(x.corps);
  switch (v.type) {
    case "section":
      return estListe(v.points, titreCorps);
    case "etapes":
      return estListe(v.etapes, (e) => titreCorps(e) && absentOuTexte((e as { passe?: unknown }).passe));
    case "tableau":
      return (
        estTexte(v.legende) &&
        estListe(v.colonnes, estTexte) &&
        estListe(v.lignes, (l) => estListe(l, estTexte)) &&
        (v.total === undefined || estListe(v.total, estTexte)) &&
        absentOuTexte(v.note)
      );
    default:
      return false;
  }
};

const estQuestion = (v: unknown): boolean =>
  estObjet(v) && estTexte(v.question) && estTexte(v.answer);

/** Relit une entrée du fichier ; lève une erreur qui nomme ce qui manque. */
export function lirePage(v: unknown, index: number): PageMetier {
  const champ = (nom: string) => new Error(`metiers.json, entrée ${index} : ${nom} invalide`);
  if (!estObjet(v)) throw champ("entrée");
  const { slug, nature, date, validationId, libelle, h1, seo, resume, accroche, noteLlms } = v;
  const { themes, lexique, image, titreOffre, blocs, faq } = v;
  if (!estTexte(slug) || !/^[a-z0-9]+(-[a-z0-9]+)*$/u.test(slug)) throw champ("slug");
  if (nature !== undefined && nature !== "fonction") throw champ("nature");
  if (!estTexte(date) || !/^\d{4}-\d{2}-\d{2}$/u.test(date)) throw champ("date");
  if (validationId !== undefined && !estTexte(validationId)) throw champ("validationId");
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

/**
 * Le corps d'une validation du cockpit : le JSON d'une entrée, sans sa date.
 * Une donnée, jamais du code : il est relu ici, à la publication comme à l'aperçu,
 * et seuls les champs d'une entrée en sont gardés. Lève une erreur lisible s'il ne
 * se relit pas, ou s'il ne porte pas le slug de la validation.
 */
export function pageDuCorps(corps: string, slug: string, date: string, rang: number): PageMetier {
  let valeur: unknown;
  try {
    valeur = JSON.parse(corps);
  } catch {
    throw new Error("Le corps de la page n’est pas un JSON lisible");
  }
  if (!estObjet(valeur)) return lirePage(valeur, rang);
  const { libelle, h1, seo, resume, accroche, noteLlms } = valeur;
  const { themes, lexique, image, titreOffre, blocs, faq } = valeur;
  const page = lirePage(
    { slug: valeur.slug, nature: valeur.nature, date, libelle, h1, seo, resume, accroche, noteLlms, themes, lexique, image, titreOffre, blocs, faq },
    rang,
  );
  if (page.slug !== slug) throw new Error(`Slug du corps (${page.slug}) différent de la validation (${slug})`);
  return page;
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

const estFonction = (page: { readonly nature?: "fonction" }): boolean => page.nature === "fonction";

/** Les pages qui visent un besoin plutôt qu'un métier. */
export const pagesFonction: readonly PageMetierPubliee[] = pagesMetier.filter(estFonction);

/** Une ligne d'une liste du hub. */
export interface LigneHub {
  readonly libelle: string;
  readonly chemin: string;
  readonly accroche: string;
}

/** Une ligne de la liste des métiers : ses thèmes la relient à ses voisines. */
export interface EntreeHub extends LigneHub {
  readonly themes: readonly Theme[];
}

/*
 * LES PAGES SECTEUR DE 2026-10-02 GARDENT LEUR ADRESSE : le BTP sort déjà sur ses
 * requêtes, le négoce et la location servent le blog. Le hub les liste avec les
 * autres, et leurs thèmes les rendent voisines des pages par métier.
 */
const THEMES_SECTEUR: Readonly<Record<SecteurSlug, readonly Theme[]>> = {
  btp: ["chantier", "facturation", "planning", "terrain"],
  "location-materiel": ["location", "facturation", "stock", "planning"],
  "negoce-distribution": ["stock", "facturation", "relances"],
};

/** Les métiers du hub : pages par métier, puis pages secteur. */
export const pagesHub: readonly EntreeHub[] = [
  ...pagesMetier.filter((p) => !estFonction(p)),
  ...pagesSecteur.map((p) => ({
    libelle: p.marcheFilAriane,
    chemin: p.chemin,
    accroche: p.accroche,
    themes: THEMES_SECTEUR[p.slug],
  })),
];

const communs = (a: readonly Theme[], b: readonly Theme[]): number =>
  a.filter((t) => b.includes(t)).length;

/** Les 3 métiers les plus proches par leurs thèmes, à égalité dans l'ordre du hub. */
export function voisinsDe(page: { readonly chemin: string; readonly themes: readonly Theme[] }): readonly EntreeHub[] {
  return [...pagesHub, ...pagesFonction]
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
    titre: "Logiciel métier, besoin par besoin · Eliott Bouquerel",
    description:
      "Stock, interventions, production, relances : partez de la tâche qui vous prend le plus de temps, et voyez ce qui disparaît.",
  },
  h1: "Partez de ce qui vous prend du temps",
  resume:
    "Stock, interventions, production, relances : choisissez la tâche qui vous coûte le plus d’heures, et voyez ce qu’elle deviendrait.",
  filAccueil: "Accueil",
  filHub: "Par besoin",
  besoins: {
    titre: "Par besoin",
    pages: [
      {
        libelle: "ERP sur mesure",
        chemin: CHEMIN_ERP,
        accroche: "Du devis à la facture, un seul outil au lieu de cinq.",
      },
      {
        libelle: "GMAO et SAV",
        chemin: CHEMIN_GMAO,
        accroche: "Les pannes, les visites planifiées et le rapport du technicien.",
      },
      {
        libelle: "Automatisation",
        chemin: CHEMIN_AUTOMATISATION,
        accroche: "Les tâches répétitives de votre bureau, faites sans vous.",
      },
    ],
    articles: [
      {
        slug: "logiciel-gestion-de-stock",
        libelle: "Gestion de stock",
        accroche: "Un stock juste entre vos dépôts, vos commandes et vos inventaires.",
      },
      {
        slug: "logiciel-gestion-intervention",
        libelle: "Gestion des interventions",
        accroche: "De la demande du client à la facture, sans fiche à retaper.",
      },
      {
        slug: "logiciel-gestion-de-production",
        libelle: "Gestion de production",
        accroche: "Les ordres de fabrication et la charge de l’atelier, à jour.",
      },
      {
        slug: "logiciel-gestion-de-commande",
        libelle: "Gestion des commandes",
        accroche: "Chaque commande suivie, de la saisie à la livraison.",
      },
      {
        slug: "crm-sur-mesure",
        libelle: "CRM sur mesure",
        accroche: "Vos clients et vos relances, suivis à votre façon.",
      },
    ],
  },
  autre: {
    titre: "Votre besoin n’est pas dans la liste ?",
    corps:
      "Décrivez-moi la tâche qui vous bloque, je vous dis ce qu’elle deviendrait.",
    cta: "Réserver un appel",
  },
  maillage: {
    voisins: "Pages voisines",
    articles: "À lire aussi",
    hub: "Tous les besoins",
  },
} as const;

/*
 * UNE REQUÊTE, UNE ADRESSE. Un besoin déjà tenu par une page ou un article garde
 * son adresse : une seconde page sur la même requête les ferait se concurrencer.
 * Le hub leur envoie son poids, puis liste les pages de fonction publiées.
 */
export const pagesBesoin: readonly LigneHub[] = [
  ...hubMetiers.besoins.pages,
  ...hubMetiers.besoins.articles
    .filter((a) => blogPosts.some((post) => post.slug === a.slug))
    .map((a) => ({ libelle: a.libelle, chemin: `/blog/${a.slug}`, accroche: a.accroche })),
  ...pagesFonction,
];
