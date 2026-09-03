import { uiLabels } from "@/content/ui";
import { servicePageLabels } from "@/content/service-pages";

/**
 * HABILLAGE DE LA SECTION TARIFS DE LA PAGE D'ACCUEIL.
 *
 * POURQUOI ELLE REVIENT, après avoir été retirée deux fois. Décision d'Eliott du
 * 2026-09-02, ses mots : « c'est dans la section tarif que le concret il
 * arrive ». L'accordéon des services annonce l'ÉTENDUE de ce qu'il sait faire,
 * une fourchette par prestation ; la section tarifs porte le détail, périmètre
 * par périmètre. Deux sections, deux rôles, et plus un seul bloc chiffré caché
 * derrière un pli.
 *
 * CE QUI AVAIT FAIT ÉCHOUER LES DEUX VERSIONS PRÉCÉDENTES, et ce qui y répond :
 *
 *  1. LA MATRICE D'ORIGINE comparait trois paliers d'UN SEUL produit : le site
 *     vitrine n'y avait pas sa place, donc le visiteur venu pour un site
 *     tombait sur un tableau où son cas n'existait pas. Le sélecteur de
 *     prestation règle exactement ça : les trois prestations sont dans la
 *     section, et chacune montre ses trois périmètres. Aucun cas n'est absent.
 *  2. LA REMPLAÇANTE PLEINE LARGEUR cassait la direction artistique : toutes les
 *     sections sombres du site sont bâties sur DEUX MOITIÉS que sépare un filet
 *     vertical. Celle-ci reprend le gabarit du template au pixel près : la
 *     citation à cheval sur le filet, le titre et les colonnes de prix dans la
 *     moitié droite, les libellés dans la moitié gauche.
 *
 * LE SÉLECTEUR N'EST PAS UN PÉAGE. Le dépôt a abandonné trois fois le motif du
 * « choisis ta case avant de lire » (la quatrième colonne de `offre.ts`, la
 * matrice ci-dessus, les intitulés de rendez-vous). Ce qui était refusé est un
 * CHOIX EXIGÉ AVANT L'INFORMATION. Ici une prestation est déjà sélectionnée à
 * l'arrivée, le tableau est rempli, et les pastilles ne font que reconfigurer ce
 * qui est déjà lisible. C'est le mécanisme du template lui-même, qui pose des
 * pastilles de plan au-dessus de son tableau dès que la largeur ne permet plus
 * de tout montrer.
 *
 * AUCUN MONTANT N'EST ÉCRIT ICI. Ils descendent tous de `offre.ts`.
 */
export const tarifsLabels = {
  /** Œil du bloc d'ouverture, moitié gauche, en vis-à-vis de la citation. */
  eyebrow: "Ma façon de facturer",

  /**
   * Ligne de clôture sous la citation, alignée à droite comme dans la source.
   *
   * ELLE ANNONCE LE TABLEAU, elle ne réengage rien : la citation au-dessus porte
   * déjà l'engagement de prix, et une deuxième promesse à trois lignes d'écart
   * se lirait comme une insistance.
   */
  quoteFooter: "3 périmètres par prestation, et ce que chacun contient.",

  /** Titre de section, même traitement que « Réalisations. » ou « Services ». */
  titre: "Les prix.",

  /**
   * Chapô, moitié gauche, sous le titre.
   *
   * « 3 » ET NON « TROIS », règle d'Eliott du 2026-09-01, appliquée partout.
   */
  intro:
    "Le prix suit le périmètre, jamais l’inverse. Choisis la prestation qui te concerne : ses 3 périmètres s’affichent, ligne par ligne.",

  /** Nom accessible du groupe de pastilles de prestation. */
  selecteurLabel: "Choisir une prestation",

  /**
   * Nom accessible du second groupe de pastilles, sous 810 seulement.
   *
   * Trois colonnes ne tiennent pas sur 390 px de large : le tableau y montre un
   * périmètre à la fois, exactement comme la source, qui bascule elle aussi sur
   * un sélecteur en dessous de sa bascule tablette.
   */
  perimetreLabel: "Choisir un périmètre",

  /** En-tête de la colonne de gauche (« Feature » dans la source). */
  colonne: "Ce qui est compris",

  /** Cellule cochée, pour qui n’a pas l’image. */
  compris: "Compris",

  /** Cellule vide, pour qui n’a pas l’image. */
  absent: "Pas dans ce périmètre",

  /**
   * Note de bas de tableau.
   *
   * ELLE EST OBLIGATOIRE : une colonne de durées en face d'une colonne de prix
   * se lit comme un engagement de délai. Ce n'en est pas un. La date vit sur le
   * devis et porte une marge au-dessus de l'estimation.
   */
  note: "Les durées sont indicatives. Le devis en porte une estimation, avec sa marge, et je te préviens dès qu’elle bouge. Le prix, lui, est arrêté avant de commencer et il ne bouge pas.",

  /** Amorce de la ligne qui dit ce que le forfait ne couvre pas. */
  horsPackLabel: "Ce qui sort du forfait",

  /**
   * LIEN VERS L'EXPLICATION DES ÉCARTS, et non l'explication elle-même.
   *
   * ARBITRAGE. « Pourquoi un devis ne tombe jamais pile sur ces montants » est
   * la meilleure page de l'offre, et elle vit sur les trois pages de prestation,
   * où chaque point est développé en un paragraphe. La recopier ici allongeait
   * d'un tiers la section la plus dense du site pour répondre à une question
   * qu'on se pose APRÈS avoir choisi un périmètre. Le lien porte son titre
   * entier, et il atterrit sur le bloc lui-même, pas en haut de la page.
   *
   * LE LIBELLÉ N'EST PAS RECOPIÉ : il vient de `service-pages.ts`, seul endroit
   * où ce titre est écrit. Deux formulations du même lien à deux écrans d'écart
   * se lisent comme deux contenus différents.
   */
  lienDevis: servicePageLabels.titreVariation,

  /**
   * Nom accessible d'un bouton de rendez-vous, colonne par colonne.
   *
   * LES TROIS BOUTONS D'UNE PRESTATION MÈNENT AU MÊME SUJET, parce que le sujet
   * est la prestation et non le périmètre : Cal.com n'a que quatre types
   * d'événement. À l'écran, le contexte vient de la colonne ; au lecteur
   * d'écran, il n'existe que si le nom accessible le porte, sans quoi la page
   * annonce trois fois le même lien.
   */
  rdvAria: (prestation: string, perimetre: string): string =>
    `${uiLabels.services.rdvAriaPrefix}${prestation}, ${perimetre}`,
} as const;

/** Adresse du bloc « pourquoi un devis ne tombe jamais pile », sur sa page. */
export const lienDevis = (slug: string): string => `/services/${slug}#devis`;
