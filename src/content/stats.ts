import type { Stat } from "@/lib/content/types";

/**
 * Chiffres clés de la home — DEUX sections distinctes dans l'archive Framer :
 *
 *  1. « How we do it » (numbers.ts)      → `howWeDoItStats` (3 chiffres)
 *  2. « Built on reputation » (number.ts) → `reputationStats` (2 chiffres)
 *
 * NOTE FIDÉLITÉ : ces compteurs sont animés côté client et rendent à 0 (« 0 »,
 * « 0.0 ») dans le HTML statique. `suffix`/`format` décrivent la restitution
 * d'un compteur animé, `prefix` le glyphe décoratif des cartes « Why us? ».
 *
 * TRADUCTION FR : les valeurs du template (60+ projets livrés, 3.2s, 89 % de
 * recommandation, 4.9/5 sur Google & Clutch) étaient des preuves sociales
 * fabriquées, invérifiables pour une activité démarrée le 1er juin 2026. Elles
 * sont remplacées par des ENGAGEMENTS au présent, tenables dès le premier
 * projet. Le composant impose un `value` numérique (AnimatedCounter /
 * NumberCounter) : ces valeurs sont des choix à arbitrer, pas un relevé.
 */

/** Section « Ton projet n'attend personne » (numbers.ts) : grille principale. */
export const howWeDoItStats: Stat[] = [
  /*
   * LES TROIS CHIFFRES CHOISIS PAR ELIOTT LE 2026-09-24, dans cet ordre : un
   * projet à la fois, la réponse sous 24 h ouvrées, les -92 % chez Würth.
   *
   * SORT « 30 % D'ACOMPTE ». C'était une information de paiement posée comme
   * une preuve : l'échéancier vit sur les pages de forfaits et dans les CGV, là
   * où le client le cherche au moment de signer.
   *
   * « 1 PROJET À LA FOIS » ouvre la grille parce que c'est l'argument du
   * titre : le projet du client n'attend personne. Le délai de réponse en est
   * la conséquence mesurable, la ligne Würth la preuve que le travail rapporte.
   */
  {
    value: "1",
    label: "Projet à la fois",
    format: "integer",
  },
  /**
   * DEUX CHIFFRES DE DÉLAI COEXISTENT SUR CE SITE, et c'est voulu depuis le
   * 2026-08-28 : ici le PLAFOND garanti (24 h ouvrées), ailleurs l'engagement
   * courant. Le libellé dit lequel des deux on lit.
   */
  {
    value: "24h",
    label: "Pour répondre à ton message, en heures ouvrées",
    suffix: "h",
    format: "integer",
    highlights: ["Pour répondre à ton message"],
  },
  /*
   * LE SEUL RÉSULTAT MESURÉ QU'ELIOTT POSSÈDE : le parcours de création de
   * compte refait chez Würth France en 2024. La forme du contrat n'est pas
   * dans le libellé (consigne du 2026-09-04) : un chiffre de page d'accueil dit
   * ce qui a été fait et où.
   *
   * LE SIGNE MOINS EST UN PRÉFIXE et non une partie de la valeur : le compteur
   * monte de 0 à 92, il ne sait pas descendre. Le moins typographique (U+2212)
   * plutôt que le trait d'union, qui se lit comme une coupure.
   */
  {
    value: "92",
    label: "D’erreurs sur un parcours d’inscription refait chez Würth France",
    prefix: "\u2212",
    suffix: "%",
    format: "integer",
    highlights: ["D’erreurs"],
  },
];

/**
 * Section « Personne ne te tient en otage » (number.ts) : UNE carte depuis le
 * 2026-09-24. « /10+ design pensé pour dix ans » est sorti (un cap de
 * conception, pas un fait que le client peut vérifier) ; reste la propriété,
 * vérifiable dès la mise en ligne. Préfixe et suffixe sont rendus tels quels
 * par `WhyUsSection` : la valeur reste un nombre que le compteur fait monter.
 */
export const reputationStats: Stat[] = [
  {
    value: "100",
    label: "Du code, de l’hébergement et des données à ton nom",
    prefix: "/",
    suffix: "%",
    format: "integer",
  },
];

/**
 * Export historique `stats` (consommé par le port `getStats()`) = grille
 * principale « How we do it ». Les deux groupes nommés restent la SSOT des
 * sections respectives de la home.
 */
export const stats: Stat[] = howWeDoItStats;
