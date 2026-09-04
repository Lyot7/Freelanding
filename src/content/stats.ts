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

/** Section « Comment je travaille » (numbers.ts) — grille principale « Numbers ». */
export const howWeDoItStats: Stat[] = [
  {
    /* « 3 etapes que vous validez » RETIRE le 2026-08-31. Eliott : « les 3
       etapes a valider c'est bullshit ». Il ne fait pas de maquette et ne
       pouvait pas les nommer : une promesse qu'on ne sait pas enumerer est une
       promesse qu'un client ressort un jour. Remplacee par l'echeancier reel,
       confirme par Eliott le 2026-08-31 et deja ecrit dans les CGV : 30 / 40 / 30.
       La cession des droits, elle, vit dans `reputationStats` : ne pas la
       dupliquer ici, les deux grilles s'affichent sur la meme page. */
    value: "30",
    label: "D’acompte à la signature, 40 % à mi-parcours, 30 % à la livraison",
    suffix: "%",
    format: "integer",
    highlights: ["D’acompte à la signature"],
  },
  /*
   * « 2,5 S DE CHARGEMENT VISÉ » A ÉTÉ RETIRÉ le 2026-08-31. Le chiffre n'était
   * dans aucun des mots d'Eliott : c'était une cible inventée, et « visé » ne
   * suffit pas à protéger un nombre affiché en 58 px sur la page d'accueil.
   *
   * CE QUI LE REMPLACE EST LE SEUL RÉSULTAT MESURÉ QU'IL POSSÈDE : le parcours
   * de création de compte refait chez Würth France en 2024.
   *
   * LA FORME DU CONTRAT A QUITTÉ LE LIBELLÉ le 2026-09-04, sur consigne
   * d'Eliott. Elle y était écrite (« refait en stage chez Würth ») pour qu'on ne
   * lise pas une mission facturée en indépendant ; c'était résoudre un problème
   * de lecture en publiant une justification. Un chiffre de page d'accueil dit
   * ce qui a été fait et où, pas sous quel contrat.
   */
  {
    value: "92",
    label: "D’erreurs en moins sur un parcours d’inscription refait chez Würth France",
    suffix: "%",
    format: "integer",
    highlights: ["D’erreurs en moins"],
  },
  /**
   * DEUX CHIFFRES DE DÉLAI COEXISTENT SUR CE SITE, et c'est voulu depuis le
   * 2026-08-28. Ailleurs (`site.ts`, `contact.ts`, `/about`), Eliott annonce
   * répondre « sous deux heures ouvrées » : c'est son engagement courant, celui
   * qu'il tient en pratique. Ici, c'est le PLAFOND, le pire cas qu'il garantit.
   *
   * L'un ne contredit l'autre que si le libellé ne dit pas lequel est lequel.
   * Le libellé précédent annonçait « délai de réponse maximum » à 48 h pendant
   * que trois autres endroits promettaient 2 h : le lecteur attentif y voyait
   * deux maximums différents, et une promesse qui se contredit ne vaut rien
   * quand elle est l'actif de vente principal. D'où « au plus tard », qui pose
   * ce chiffre en garantie et non en concurrent de l'engagement à 2 h.
   */
  {
    value: "24h",
    label: "Réponse à chaque message, en heures ouvrées",
    suffix: "h",
    format: "integer",
    highlights: ["Réponse à chaque message"],
  },
];

/**
 * Section « Bâti sur la preuve » (number.ts).
 * NOTE : les deux cartes encadrent leur chiffre (« / » devant, glyphe derrière).
 * Le glyphe est écrit en dur dans `WhyUsSection` (« + » sur la carte noire,
 * « % » sur la carte blanche) : la première valeur doit rester un nombre qui se
 * lit avec « + », la seconde un pourcentage.
 */
export const reputationStats: Stat[] = [
  /*
   * « SCORE DE PERFORMANCE VISÉ : 95 » A ÉTÉ RETIRÉ le 2026-08-31, pour la même
   * raison que les 2,5 s : un seuil chiffré qu'Eliott n'a jamais posé, et qu'un
   * client peut lui ressortir au pied de la lettre.
   *
   * CE QUI LE REMPLACE est dans ses mots : « est-ce qu'il sera toujours au bout
   * du jour dix ans après ? Je m'efforce à vraiment pousser là-dessus. » Le
   * libellé écrit « pensé pour » et non « tient » : c'est un cap de conception,
   * pas une garantie de durée. Le glyphe « + » est écrit en dur dans
   * `WhyUsSection` (carte noire), la valeur doit donc rester un nombre qui se
   * lit avec lui : « /10+ » se lit « dix ans et plus ».
   */
  {
    value: "10",
    label: "Un design pensé pour tenir dix ans, pas une saison",
    prefix: "/",
    suffix: "+",
    format: "integer",
  },
  /**
   * « 100 % réalisé par moi, sans sous-traitance » parlait de MON organisation,
   * pas du client. La propriété du code, elle, est vérifiable à 100 % et se lit
   * du côté de celui qui paie. Les glyphes « / » et « % » restent ceux du
   * composant : rendu « /100 % », 2 lignes dans la boîte de 160 px, aucune ligne
   * de `WhyUsSection.tsx` à toucher.
   *
   * TUTOIEMENT le 2026-09-02 (« vous appartient » → « t'appartient », cf.
   * l'en-tête de `home.ts`). Le libellé perd trois signes : il tient toujours
   * en 2 lignes, il n'en gagne pas une troisième.
   */
  {
    value: "100",
    label: "Le code que je livre t’appartient",
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
