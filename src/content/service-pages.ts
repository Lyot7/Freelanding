/**
 * Libellés des pages de prestation (`/services/<slug>`).
 *
 * TOUT LE TEXTE D'INTERFACE DE CES PAGES VIT ICI, comme le reste du site :
 * `scripts/hardcoded-text-audit.mjs` refuse une chaîne visible écrite dans un
 * composant. La règle a une raison pratique et une raison de fond : la première
 * est qu'une chaîne dans un composant échappe au correcteur typographique
 * français, la seconde est qu'on ne relit pas une offre en ouvrant du JSX.
 *
 * CE QUI NE FIGURE PAS ICI : les prix et les périmètres. Ils vivent dans
 * `offre.ts`, seule source des montants.
 */
import type { Prestation, PrestationId } from "./offre";
import { lienVersPageCaen } from "./page-caen";
import { lienVersPageLogicielCaen } from "./page-logiciel-caen";
import { avantLienPrix, pagePrixLogiciel } from "./page-prix-logiciel";
import { lienVersPagePrixSite } from "./page-prix-site";
import { avantLiensSecteur, pagesSecteur } from "./pages-secteur";
import { pageTheme } from "./pages-theme";

/** Lien vers une page thématique, sous l’offre de son pilier. */
const lienTheme = (id: Parameters<typeof pageTheme>[0]) => {
  const page = pageTheme(id);
  return { libelle: page.libelleLien, href: page.chemin };
};

/** Libellé de tout lien vers l'ancre `#rendez-vous` d'une page de prestation. */
const RESERVER_UN_APPEL = "Réserver un appel";

/**
 * TITRE DE RECHERCHE ET TITRE DE PAGE, prestation par prestation.
 *
 * CE QUI ÉTAIT SERVI, ET POURQUOI C'ÉTAIT UN DÉFAUT SANS CONTREPARTIE. La
 * balise `<title>` de ces trois pages valait `prestation.nom` : « Site
 * vitrine » et deux noms de palier aujourd'hui disparus. Ces deux-là étaient des NOMS
 * INTERNES DE CATALOGUE — personne ne tape « le logiciel » pour chercher un
 * développeur — et aucune ne portait la marque, alors que toutes les autres
 * pages du site suivent « … · Eliott Bouquerel ». Une page de vente sans mot
 * cherchable dans son titre est une page qui ne se trouve pas.
 *
 * POURQUOI ÇA VIT ICI ET NON DANS `offre.ts`. `nom` est le nom commercial de
 * l'offre : il porte l'accordéon de l'accueil, la matrice tarifaire et le
 * contrôle de cohérence de `offre.test.mjs` (`services.title === prestation.nom`).
 * Le titre de recherche est un autre objet, avec une autre contrainte, la
 * longueur. Les confondre revient à faire dépendre le catalogue du référencement.
 *
 * LA CONTRAINTE DE LONGUEUR EST DURE : au-delà d'une soixantaine de caractères,
 * un résultat de recherche est tronqué et la marque, qui est en fin de titre,
 * disparaît la première. Les deux titres sont MESURÉS sur le rendu : 58 et
 * 54 caractères (2026-09-28). `service-pages.test.mjs` refuse tout ajout au-dessus de 60.
 *
 * LA ZONE N'EST ÉCRITE QUE LÀ OÙ ELLE SE CHERCHE. « Site vitrine » est une
 * requête locale : on cherche quelqu'un près de chez soi. Un outil ou un
 * logiciel métier se commande à distance, et y coller une région ne fait que
 * rétrécir la requête sans rien gagner.
 */
export const servicePageSeo: Record<
  PrestationId,
  {
    /** Balise `<title>`, marque comprise. 60 caractères, jamais plus. */
    readonly titre: string;
    /**
     * Meta description, 140 à 155 caractères, au vouvoiement. Distincte du
     * résumé de la prestation, qui est un texte de page et dépassait 170.
     */
    readonly description: string;
    /**
     * Le H1. Il dit ce qui est vendu, avec les mots du client, et il reste
     * COURT : la typographie de la page le rend en capitales à 98 px sur une
     * colonne de 510 px, où chaque mot occupe une ligne pleine.
     */
    readonly h1: string;
  }
> = {
  vitrine: {
    titre: "Création de site internet sur mesure · Eliott Bouquerel",
    description:
      "Un site vitrine sur mesure, rapide et optimisé pour le référencement, qui convertit vos visiteurs en clients. Livré sans abonnement, à vous ensuite.",
    h1: "Site internet sur mesure",
  },
  logiciel: {
    titre: "Logiciel métier sur mesure pour PME · Eliott Bouquerel",
    description:
      "Remplacez Excel par un logiciel de gestion adapté à votre métier : devis, suivi client, stock. Développement sur mesure pour PME, sans abonnement.",
    h1: "Logiciel métier sur mesure pour PME",
  },
};

export const servicePageLabels = {
  /*
   * « Toutes les prestations » A DISPARU avec le retour simple qu'il libellait,
   * remplacé par le fil d'Ariane ci-dessous. Un libellé qui survit au composant
   * qui l'affichait est un texte que personne ne relit et que personne ne voit.
   */

  /**
   * FIL D'ARIANE, repris du motif déjà en place sur `/work/*`.
   *
   * La dernière marche porte `prestation.nom` — « Site vitrine », « La Solution métier » —
   * et c'est elle qui garde le nom de catalogue lisible sur la page, une fois
   * que le H1 est passé aux mots que le client tape.
   *
   * « Prestations » pointe sur `/#services`, l'accordéon de l'accueil : c'est
   * le seul index de l'offre, il n'existe pas de page `/services` nue. Déclarer
   * une marche vers une adresse qui répond 404 serait pire que ne rien déclarer.
   */
  filAriane: {
    /** Nom accessible du `<nav>`. Lu par un lecteur d'écran, jamais affiché. */
    intitule: "Fil d’Ariane",
    accueil: "Accueil",
    prestations: "Prestations",
    /** Séparateur visible entre deux marches. Pas la barre oblique du menu :
     *  le fil se lit comme un repère de page, pas comme une seconde navigation
     *  (décision d'Eliott du 2026-10-16). */
    separateur: "›",
  },

  /** Chapô du prix, en tête de page : le plancher, et où le prix se fixe. */
  chapoPrix: (plancher: string) => `À partir de ${plancher}, prix fixé au devis`,

  /** Suffixe des montants. Toujours séparé du chiffre : jamais « 5 000 €HT ». */
  horsTaxes: "HT",

  /** Titre de la section de l'offre. */
  titreOffre: "Ce qui est compris, ce qui fait varier le prix",

  /** Amorce de la liste de ce que comprend le plancher. */
  inclus: "Compris dès le plancher",

  /** Amorce de la liste de ce qui fait monter le prix. */
  faitMonter: "Ce qui fait monter le prix",

  /** En vis-à-vis du titre de l'offre : comment on paie, et que le prix tient. */
  reassurance:
    "Le prix est fixé au devis et ne bouge plus. Vous payez 40 % à la signature, 30 % à la première version fonctionnelle et 30 % à la livraison. Le code et l’hébergement sont à votre nom.",

  /** Bouton de l'offre, vers l'ancre `#rendez-vous` de la page. */
  cta: RESERVER_UN_APPEL,

  /** Amorce du plancher. */
  aPartirDe: "À partir de",

  /**
   * LE BLOC « SUR DEVIS » : ce qui sort de l'offre (`horsOffre` de la
   * prestation), et les trois questions du questionnaire de rendez-vous. Eliott
   * veut des demandes déjà cadrées, budget compris : le lecteur apprend ici que
   * le budget se pose d'entrée, et pourquoi il l'aide, lui, à cadrer.
   */
  surMesureBloc: {
    titre: "Hors offre, sur devis",
    cta: RESERVER_UN_APPEL,
    titreQuestions: "Pas sûr de ce qu’il vous faut ?",
    introQuestions:
      "3 questions, posées quand vous réservez votre appel. Je vous dis tout de suite ce que votre budget permet, et ce qu’il ne permet pas.",
    questions: [
      {
        titre: "Votre budget",
        corps:
          "Le repère le plus utile des trois. À budget connu, je vous dis ce qu’il permet de construire, et ce qui attendra.",
      },
      {
        titre: "Votre objectif",
        corps:
          "Le résultat que vous attendez décide de ce qu’on construit. Dites-le avec vos mots, je le traduis en périmètre.",
      },
      {
        titre: "Votre échéance",
        corps:
          "Si une date compte pour vous, dites-la dès le premier appel. Je vous dis tout de suite si elle tient.",
      },
    ],
  },
} as const;

/** Une marche du fil d'Ariane. Sans `href`, c'est la page courante. */
export interface MarcheFilAriane {
  readonly libelle: string;
  readonly href?: string;
}

/**
 * LES MARCHES DU FIL D'ARIANE, calculées au même endroit pour la page affichée
 * et pour le `BreadcrumbList` émis par la route : deux listes écrites
 * séparément finissent toujours par diverger.
 *
 * Une page locale ou une page secteur se range SOUS sa prestation : le nom de
 * catalogue redevient un lien vers `/services/<slug>`, et la ville ou le
 * secteur devient la dernière marche.
 */
export function marchesFilAriane(
  prestation: Prestation,
  local?: { readonly marcheFilAriane: string },
): readonly MarcheFilAriane[] {
  const { filAriane } = servicePageLabels;
  const base: MarcheFilAriane[] = [
    { libelle: filAriane.accueil, href: "/" },
    { libelle: filAriane.prestations, href: "/#services" },
  ];
  return local
    ? [
        ...base,
        { libelle: prestation.nom, href: `/services/${prestation.slug}` },
        { libelle: local.marcheFilAriane },
      ]
    : [...base, { libelle: prestation.nom }];
}

/**
 * LIENS VERS LES DÉCLINAISONS D'UNE PRESTATION, posés sous ses périmètres : le
 * site vitrine mène à la page de Caen, la solution métier à ses pages secteur,
 * à sa page de prix et à sa page de Caen. Une ligne sobre par famille, une
 * amorce et des liens : la page pilier ne devient pas un sommaire.
 */
export interface LiensDeclinaisons {
  readonly avant: string;
  readonly liens: readonly { readonly libelle: string; readonly href: string }[];
}

export const lienLocalParPrestation: Partial<
  Record<PrestationId, readonly LiensDeclinaisons[]>
> = {
  vitrine: [
    { avant: avantLienPrix, liens: [lienVersPagePrixSite] },
    { avant: avantLiensSecteur, liens: [lienTheme("artisans")] },
    { avant: lienVersPageCaen.avant, liens: [lienVersPageCaen] },
  ],
  logiciel: [
    {
      avant: avantLiensSecteur,
      liens: pagesSecteur.map((p) => ({ libelle: p.libelleLien, href: p.chemin })),
    },
    {
      avant: "Par besoin :",
      liens: [lienTheme("erp-sur-mesure"), lienTheme("maintenance-sav"), lienTheme("automatisation")],
    },
    {
      avant: avantLienPrix,
      liens: [{ libelle: pagePrixLogiciel.libelleLien, href: pagePrixLogiciel.chemin }],
    },
    { avant: lienVersPageLogicielCaen.avant, liens: [lienVersPageLogicielCaen] },
  ],
};
