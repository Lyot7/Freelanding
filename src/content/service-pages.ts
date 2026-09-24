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
import { lienVersPageCaen, type PageLocale } from "./page-caen";

/** Libellé de tout lien vers l'ancre `#rendez-vous` d'une page de prestation. */
const RESERVER_UN_APPEL = "Réserver un appel";

/**
 * TITRE DE RECHERCHE ET TITRE DE PAGE, prestation par prestation.
 *
 * CE QUI ÉTAIT SERVI, ET POURQUOI C'ÉTAIT UN DÉFAUT SANS CONTREPARTIE. La
 * balise `<title>` de ces trois pages valait `prestation.nom` : « Site
 * vitrine », « L'Outil », « Le Logiciel ». Deux d'entre elles sont des NOMS
 * INTERNES DE CATALOGUE — personne ne tape « le logiciel » pour chercher un
 * développeur — et aucune ne portait la marque, alors que toutes les autres
 * pages du site suivent « … · Eliott Bouquerel ». Une page de vente sans mot
 * cherchable dans son titre est une page qui ne se trouve pas.
 *
 * POURQUOI ÇA VIT ICI ET NON DANS `offre.ts`. `nom` est le nom commercial du
 * palier : il porte l'accordéon de l'accueil, la matrice tarifaire et le
 * contrôle de cohérence de `offre.test.mjs` (`services.title === prestation.nom`).
 * Le titre de recherche est un autre objet, avec une autre contrainte, la
 * longueur. Les confondre revient à faire dépendre le catalogue du référencement.
 *
 * LA CONTRAINTE DE LONGUEUR EST DURE : au-delà d'une soixantaine de caractères,
 * un résultat de recherche est tronqué et la marque, qui est en fin de titre,
 * disparaît la première. Les trois titres sont MESURÉS sur le rendu : 56, 58
 * et 54 caractères. `service-pages.test.mjs` refuse tout ajout au-dessus de 60.
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
     * Le H1. Il dit ce qui est vendu, avec les mots du client, et il reste
     * COURT : la typographie de la page le rend en capitales à 98 px sur une
     * colonne de 510 px, où chaque mot occupe une ligne pleine.
     */
    readonly h1: string;
  }
> = {
  vitrine: {
    titre: "Création de site vitrine en Normandie · Eliott Bouquerel",
    h1: "Site vitrine sur mesure",
  },
  logiciel: {
    titre: "Logiciel métier sur mesure pour PME · Eliott Bouquerel",
    h1: "Logiciel métier sur mesure",
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
   * La dernière marche porte `prestation.nom` — « L'Outil », « Le Logiciel » —
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
    /** Séparateur visible entre deux marches. */
    separateur: "/",
  },

  /** Chapô de la fourchette, en tête de page. */
  fourchette: "Selon le forfait,",

  /** Suffixe des montants. Toujours séparé du chiffre : jamais « 5 000 €HT ». */
  horsTaxes: "HT",

  /**
   * Titre de la section des trois périmètres.
   *
   * « 3 » ET NON « TROIS », règle posée par Eliott le 2026-09-01 et appliquée à
   * tout le site : un nombre écrit en chiffres s'accroche à l'œil, le même
   * nombre écrit en lettres se lit comme un mot de plus.
   */
  titrePacks: (hautSurMesure: boolean) =>
    hautSurMesure
      ? "3 forfaits, du prix ferme au sur mesure"
      : "3 forfaits, à prix ferme",

  /** Amorce de la ligne « pour qui ». */
  pourQui: "Pour toi si",

  /**
   * Phrase d'enchaînement entre deux périmètres.
   *
   * ELLE EST OBLIGATOIRE, et pas décorative. À partir du deuxième périmètre, la
   * liste n'énumère que ce qui S'AJOUTE : sans cette phrase, le lecteur voit une
   * liste plus courte en face d'un prix plus élevé et en conclut l'inverse de ce
   * qui est vrai.
   */
  toutLePrecedent: (precedent: string) => `Tout ce que contient ${precedent}, plus :`,

  /** En vis-à-vis du titre des forfaits : comment on paie, et que le prix tient. */
  reassurance:
    "Le prix est fixé au devis et ne bouge plus. Tu paies 30 % à la signature, 40 % à la première version fonctionnelle et 30 % à la livraison. Le code et l’hébergement sont à ton nom.",

  /**
   * Bouton de chaque forfait. UN SEUL LIBELLÉ pour l'ancre `#rendez-vous` sur
   * toute la page : « En parler » et « Réserver un appel » y menaient tous
   * deux, et deux libellés pour une même destination se lisent comme deux
   * actions différentes.
   */
  cta: RESERVER_UN_APPEL,

  /** Amorce du montant d'un palier sur mesure : son prix est un plancher. */
  aPartirDe: "À partir de",

  /** Signalement du palier sur mesure : son prix est un plancher. */
  surMesure: "Sur mesure",

  /**
   * LE BLOC « SUR MESURE, SUR DEVIS », qui remplace depuis le 2026-09-23 la
   * section « Pourquoi un devis ne tombe jamais pile sur ces montants ». Un
   * forfait à prix ferme qui explique pourquoi il ne l'est pas se contredit :
   * la section est partie, décision d'Eliott.
   *
   * CE QU'IL FAIT À LA PLACE : il dit ce qui sort des forfaits (`horsPack` de
   * la prestation) et il prépare le visiteur aux trois questions du
   * questionnaire de rendez-vous. Eliott veut des demandes déjà cadrées, budget
   * compris : le lecteur apprend ici que le budget se pose d'entrée, et
   * pourquoi il l'aide, lui, à choisir.
   */
  surMesureBloc: {
    titre: "Hors forfait, sur devis",
    cta: RESERVER_UN_APPEL,
    titreQuestions: "Pas sûr du forfait ?",
    introQuestions:
      "3 questions, posées quand tu réserves ton appel. Je te dis tout de suite ce que ton budget permet, et ce qu’il ne permet pas.",
    questions: [
      {
        titre: "Ton budget",
        corps:
          "Le repère le plus utile des trois. À budget connu, je te montre le forfait qu’il paie et ce que tu obtiens avec.",
      },
      {
        titre: "Ton objectif",
        corps:
          "Le résultat que tu attends décide du forfait. Dis-le avec tes mots, je le traduis en périmètre.",
      },
      {
        titre: "Ton échéance",
        corps:
          "Si une date compte pour toi, dis-la dès le premier appel. Je te dis tout de suite si elle tient.",
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
 * Une page locale se range SOUS sa prestation : le nom de catalogue redevient
 * un lien vers `/services/<slug>`, et la ville devient la dernière marche.
 */
export function marchesFilAriane(
  prestation: Prestation,
  local?: PageLocale,
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
 * LIEN VERS UNE PAGE LOCALE, posé sous les périmètres de la prestation qu'elle
 * décline. Un seul aujourd'hui : le site vitrine mène à la page de Caen.
 */
export const lienLocalParPrestation: Partial<
  Record<PrestationId, { readonly avant: string; readonly libelle: string; readonly href: string }>
> = {
  vitrine: lienVersPageCaen,
};
