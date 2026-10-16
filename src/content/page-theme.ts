/**
 * PAGES THÉMATIQUES : ERP sur mesure, GMAO, automatisation et IA, site pour
 * artisans, automatisation et IA à Caen (carte SEO du 2026-10-15, section 3 A,
 * `~/vault/wiki/business/seo-carte-mots-cles.md`).
 *
 * POURQUOI UN TYPE À PART, ET PAS UN SECTEUR DE PLUS. Google laisse hors de
 * l'index trois pages secteur sur quatre (transport, négoce, location de
 * matériel) : même gabarit, même longueur, cinq sections en deux moitiés
 * enchaînées dans le même ordre. Ces pages-ci composent des BLOCS de natures
 * différentes (sections, tableaux, étapes, chiffres), dans un ordre propre à
 * chacune, et chacune porte un élément qu'aucune autre page du site n'a :
 *   - ERP : le trajet d'une commande d'un bout à l'autre de l'outil ;
 *   - GMAO : le lexique du métier et l'argent immobilisé par les bons papier ;
 *   - automatisation : six tâches chiffrées, et l'outil qu'Eliott utilise
 *     lui-même ;
 *   - artisans : les chiffres de l'étude normande d'Eliott sur 4 895 fiches ;
 *   - IA à Caen : les métiers de l'ouest normand, tâche par tâche ;
 *   - CTO et référent IA : les décisions d'une PME, avec et sans quelqu'un
 *     qui code pour les prendre (2026-10-16).
 * `pages-theme.test.mjs` refuse un paragraphe repris d'une autre page.
 *
 * LES RÈGLES DU SITE TIENNENT ICI AUSSI : vouvoiement, aucun montant écrit à
 * la main (planchers et repères d'agence viennent d'`offre.ts`), un calcul
 * dérivé de ses hypothèses affichées, aucun client inventé, aucun présentiel.
 */
import type { FaqItem } from "@/lib/content/types";
import type { Offre, PrestationId } from "./offre";
import type { LienLocal } from "./page-caen";
import type { IdRendezVous } from "./rendez-vous";

/** Un point court : un titre, une phrase. */
export interface PointTheme {
  readonly titre: string;
  readonly corps: string;
}

interface BlocBase {
  /** Identifiant stable, repris en `data-section`. */
  readonly id: string;
  readonly titre: string;
  readonly paragraphes: readonly string[];
  readonly liens?: {
    readonly titre: string;
    readonly items: readonly LienLocal[];
  };
}

/** Deux moitiés : le texte à gauche, des points à droite. */
export interface BlocSection extends BlocBase {
  readonly type: "section";
  readonly points: readonly PointTheme[];
}

/** Un tableau à colonnes nommées : comparaison, lexique, calcul ligne à ligne. */
export interface BlocTableau extends BlocBase {
  readonly type: "tableau";
  /** Légende lue par les lecteurs d'écran, en `<caption>`. */
  readonly legende: string;
  readonly colonnes: readonly string[];
  readonly lignes: readonly (readonly string[])[];
  /** Ligne de total, en gras sous le tableau. */
  readonly total?: readonly string[];
  /** Hypothèses ou source, sous le tableau. */
  readonly note?: string;
}

/** Une suite numérotée : un trajet, un cycle, une méthode. */
export interface BlocEtapes extends BlocBase {
  readonly type: "etapes";
  readonly etapes: readonly {
    readonly titre: string;
    readonly corps: string;
    /** Ce qui passe à l'étape suivante, en une ligne. */
    readonly passe?: string;
  }[];
}

/** De grands chiffres, chacun avec son libellé, et leur source. */
export interface BlocChiffres extends BlocBase {
  readonly type: "chiffres";
  readonly chiffres: readonly {
    readonly valeur: string;
    readonly libelle: string;
  }[];
  readonly source?: LienLocal;
}

export type BlocTheme = BlocSection | BlocTableau | BlocEtapes | BlocChiffres;

export type IdPageTheme =
  | "erp-sur-mesure"
  | "maintenance-sav"
  | "automatisation"
  | "artisans"
  | "automatisation-ia-caen"
  | "cto-referent-ia";

export interface PageTheme {
  readonly id: IdPageTheme;
  readonly chemin: string;
  readonly seo: {
    /** Balise `<title>`, marque comprise. 60 caractères, jamais plus. */
    readonly titre: string;
    /** Meta description, au vouvoiement : 150 à 160 caractères. */
    readonly description: string;
  };
  readonly h1: string;
  /** Chapô du héros : la réponse directe, prix compris. */
  readonly resume: string;
  /**
   * Prestation de rattachement : type du rendez-vous imposé, et marche du fil
   * d'Ariane quand la page en a un.
   */
  readonly prestation: PrestationId;
  /** L'offre présentée sous les blocs : la prestation, l'intégration IA ou le CTO. */
  readonly offre: Offre;
  /**
   * Sujet du rendez-vous quand il n'est pas celui de la prestation de
   * rattachement : le CTO à temps partagé se réserve en « decouverte ».
   */
  readonly rendezVous?: IdRendezVous;
  /**
   * Phrase sous le titre de l'offre quand l'échéancier d'un projet (40 / 30 /
   * 30) ne s'applique pas : une offre mensuelle dit son engagement.
   */
  readonly reassurance?: string;
  /** Le fil d'Ariane, page courante comprise. Absent sur une page de ville. */
  readonly filAriane?: readonly { readonly libelle: string; readonly href?: string }[];
  /** Villes et départements déclarés en `areaServed` ; absents = France. */
  readonly zones?: {
    readonly villes: readonly string[];
    readonly departements: readonly string[];
  };
  /** Libellé du lien posé vers la page depuis son pilier et le pied de page. */
  readonly libelleLien: string;
  /** Ce que la page couvre, en une phrase : la description de ce lien. */
  readonly accroche: string;
  /** Note de la ligne `llms.txt`. */
  readonly noteLlms: string;
  readonly blocs: readonly BlocTheme[];
  readonly titreOffre: string;
  readonly faq: {
    readonly eyebrow: string;
    readonly titleLines: readonly string[];
    readonly items: readonly FaqItem[];
  };
}

/** Un nombre écrit à la française, espaces de milliers insécables. */
export const nombre = (n: number): string =>
  n.toLocaleString("fr-FR").replace(/\s/gu, " ");

/** Un pourcentage à la française, virgule décimale et espace fine insécable. */
export const pourcent = (n: number): string =>
  `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

export const CHEMIN_ERP = "/services/logiciel-metier/erp-sur-mesure";
export const CHEMIN_GMAO = "/services/logiciel-metier/maintenance-sav";
export const CHEMIN_AUTOMATISATION = "/services/automatisation";
export const CHEMIN_ARTISANS = "/services/site-vitrine/artisans";
export const CHEMIN_IA_CAEN = "/automatisation-ia-caen";
export const CHEMIN_CTO = "/services/cto-referent-ia";
