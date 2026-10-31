/**
 * LES PAGES LOCALES : leurs types et leur chemin. `/creation-site-internet-caen`
 * redirige depuis le 2026-10-31 (une seule offre) ; reste `/logiciel-sur-mesure-caen`
 * (`page-logiciel-caen.ts`).
 */
import type { FaqItem, ImageHero } from "@/lib/content/types";
import type { SectionSecteur } from "./pages-secteur";

/** Chemin de la page locale du logiciel métier (`page-logiciel-caen.ts`). */
export const CHEMIN_PAGE_LOGICIEL_CAEN = "/logiciel-sur-mesure-caen";

/** Un lien interne de la page, avec la phrase qui dit où il mène. */
export interface LienLocal {
  readonly libelle: string;
  readonly href: string;
  readonly description: string;
}

/**
 * Contenu d'une page locale rendue par le gabarit de prestation.
 *
 * Le type vit ici plutôt que dans `types.ts` : une seule page l'emploie.
 */
export interface PageLocale {
  readonly chemin: string;
  readonly seo: {
    /** Balise `<title>`, marque comprise. 60 caractères, jamais plus. */
    readonly titre: string;
    /** Meta description : 150 à 160 caractères, tenus par le test. */
    readonly description: string;
  };
  readonly h1: string;
  /** Chapô du héros, à la place du résumé de la prestation. */
  readonly resume: string;
  /**
   * Photo de fond du héros. Facultative : sans elle, le héros garde le fond
   * animé des pages de prestation.
   */
  readonly heroImage?: ImageHero;
  /** Dernière marche du fil d'Ariane : la page courante. */
  readonly marcheFilAriane: string;
  /** Villes et départements déclarés en `areaServed` du JSON-LD. */
  readonly zones: {
    readonly villes: readonly string[];
    readonly departements: readonly string[];
  };
  readonly contexte: {
    readonly titre: string;
    readonly intro: string;
    readonly titreLiens: string;
    readonly liens: readonly LienLocal[];
    readonly points: readonly { readonly titre: string; readonly corps: string }[];
  };
  /**
   * Sections supplémentaires, après le contexte et avant l'offre, dans
   * le gabarit des pages secteur : sur la page de Caen, la refonte, les sites
   * d'artisans et de commerces, le référencement local.
   */
  readonly sections?: readonly SectionSecteur[];
  /** Titre de la section de l'offre, à la place du titre générique. */
  readonly titreOffre?: string;
  readonly faq: {
    readonly eyebrow: string;
    readonly titleLines: readonly string[];
    readonly items: readonly FaqItem[];
  };
}
