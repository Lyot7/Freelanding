/**
 * L'OFFRE — source unique de la prestation et de ce qu'elle comprend.
 *
 * UNE SEULE OFFRE DEPUIS LE 2026-10-31, décision d'Eliott du 2026-10-30 : le
 * logiciel métier et les gains de productivité, « en restant ouvert aux
 * propositions ». Le site vitrine, l'intégration IA et le CTO à temps partagé
 * ne sont plus des offres : leurs pages redirigent (`next.config.ts`), et une
 * autre demande passe par la phrase discrète du pied de page.
 *
 * AUCUN PRIX D'ELIOTT SUR LE SITE DEPUIS LE 2026-11-01. Ses mots : « arrête de
 * mettre à partir de […] partout, ça dépend de chaque projet, il y a des projets
 * très simples, les prix c'est uniquement sur devis ». Le plancher, le taux et
 * le minimum de la maintenance ont quitté ce module : le prix d'un projet comme
 * celui de son suivi se fixent au devis, et `offre.test.mjs` refuse leur retour.
 *
 * CE QUI A DISPARU AVEC LES PALIERS, LE 2026-10-05, ET NE REVIENT PAS :
 *  - les noms de forfait et leurs prix fermes. Le prix ferme existe toujours :
 *    c'est celui du DEVIS signé, il ne bouge plus ;
 *  - le délai affiché. La date se fixe au devis ;
 *  - la fourchette. Une borne publiée devient un prix que le visiteur s'attend
 *    à payer.
 *
 * CE QUI LES REMPLACE : ce qui est compris (`inclus`) et ce qui fait varier le
 * prix (`faitMonter`). Règle d'Eliott du 2026-09-01, toujours en vigueur : une
 * promesse qu'il n'a jamais faite n'a rien à faire sur le site. Chaque ligne
 * vient donc des anciens périmètres ; aucune n'a été inventée.
 *
 * LES SEULS MONTANTS DE CE FICHIER SONT CEUX DU MARCHÉ, relevés et sourcés
 * (`repereAgenceLogiciel`).
 */

/** Identifiant stable de la prestation à page dédiée. */
export type PrestationId = "logiciel";

/** Une offre : ce qu'elle comprend, ce qui fait varier son prix. */
export interface Offre {
  readonly nom: string;
  /** Ce que comprend tout projet de l'offre. */
  readonly inclus: readonly string[];
  /** Ce qui fait varier le prix. Chiffré au devis. */
  readonly faitMonter: readonly string[];
  /** Ce qui sort de l'offre, chiffré à part. */
  readonly horsOffre: string;
}

/** Une prestation vendable : une offre, une page dédiée. */
export interface Prestation extends Offre {
  readonly id: PrestationId;
  /** Segment d'URL de sa page dédiée, sous `/services/`. */
  readonly slug: string;
  /** Une phrase, affichée en tête de la page dédiée et dans l'accordéon. */
  readonly resume: string;
}

/**
 * Formate un montant en euros, avec l'espace insécable des milliers et celle
 * qui précède le symbole. Écrire le montant avec des espaces ordinaires laisse
 * le navigateur couper entre « 5 » et « 000 », ou renvoyer le « € » seul à la
 * ligne suivante.
 *
 * LES ESPACES SONT ÉCRITES EN ÉCHAPPEMENT, jamais en caractère littéral. Une
 * insécable et une espace ordinaire sont indiscernables à l'écran comme dans un
 * diff : une réécriture du fichier a déjà remplacé l'insécable par une espace
 * normale sans que rien ne le signale. ` ` se voit.
 *
 * `\s` couvre l'insécable étroite (U+202F) que `toLocaleString` produit selon
 * la version d'ICU, aussi bien que l'insécable ordinaire des versions plus
 * anciennes : les deux sont ramenées à U+00A0.
 */
export function euros(montant: number): string {
  return `${montant.toLocaleString("fr-FR").replace(/\s/gu, " ")} €`;
}

/** Là où se fixe le prix d'Eliott, tel qu'il s'écrit dans une ligne de prix. */
export const SUR_DEVIS = "sur devis";

/** La phrase du prix, reprise telle quelle partout où le visiteur le cherche. */
export const PRIX_AU_DEVIS =
  "Le prix dépend du projet : je le fixe au devis, avant de commencer, et il ne bouge plus.";

/*
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott. Eliott dit « je » : il
 * est seul, c'est son argument face aux agences. Le « nous » n'existe nulle part.
 */
export const prestations: readonly Prestation[] = [
  {
    id: "logiciel",
    nom: "Logiciel métier",
    slug: "logiciel-metier",
    resume:
      "Le logiciel fait pour votre métier : la contrainte qui vous bloque disparaît, et votre équipe reprend le temps qu’elle y perdait. L’IA fait le sale boulot, le recopiage, les factures, les relances, et les humains reviennent à ce qui les rend indispensables.",
    inclus: [
      "Les écrans nécessaires, la base de données et la mise en production sur votre hébergement",
      "Le raccordement à l’outil qui porte déjà vos données",
      "Un export de tout ce que le logiciel contient, à tout moment",
      "Code source dans votre dépôt, et sa documentation",
    ],
    faitMonter: [
      "Le nombre de modules, comme les devis, le planning et la facturation",
      "Le nombre d’outils à relier, et les échanges dans les deux sens",
      "Un compte par personne, et des droits différenciés par rôle",
      "La reprise de votre historique",
      "Les cas particuliers de votre métier, traités un par un",
      "La règle écrite : qui gagne quand deux sources se contredisent",
      "Supervision, alertes et journal des échanges",
      "Sauvegardes vérifiées, reprise après incident testée en conditions réelles",
    ],
    /*
     * La reprise d'un logiciel existant : possible sur une base JavaScript
     * récente et bien construite, refusée sur PHP et Laravel, et toujours
     * précédée d'un audit du code, lui-même prestation à part entière.
     */
    horsOffre:
      "Un existant non documenté ou plusieurs sociétés à servir : je chiffre le cadrage à part, je vous le remets écrit, et il vous appartient. La prise en main de vos équipes se fait en plus, sur devis. Reprendre un logiciel déjà en place se tranche par un audit de son code, et la réponse est non sur PHP et sur Laravel.",
  },
];

/** Accès par identifiant, pour que les consommateurs ne dépendent pas de l'ordre. */
export const prestation = (id: PrestationId): Prestation => {
  const trouve = prestations.find((p) => p.id === id);
  if (!trouve) throw new Error(`Prestation inconnue : ${id}`);
  return trouve;
};

/*
 * LES REPÈRES D'AGENCE, relevés le 2026-10-15 sur La Fabrique du Net
 * (`agences-developpement-logiciel/tarifs`) : un premier outil démarre autour de
 * 8 000 à 10 000 € ; médiane d'un projet logiciel en agence : 30 000 €.
 *
 * Une comparaison publique reste vérifiable : chaque chiffre affiché vient de
 * cette source, s'affiche avec son nom et sa date, et vit ici. Aucun autre
 * chiffre de marché ne s'écrit sur le site. Jamais de rapport seul : « deux fois
 * moins cher » ne valait que pour le site vitrine, et il est parti avec lui.
 */

/** La source des repères, telle qu'elle se cite et se lie. */
export interface SourceRepere {
  readonly nom: string;
  readonly href: string;
  /** Mois du relevé, tel qu'il s'écrit dans une phrase. */
  readonly releve: string;
}

const LA_FABRIQUE_DU_NET = "La Fabrique du Net";
const RELEVE_REPERES = "octobre 2026";

export const repereAgenceLogiciel = {
  source: {
    nom: LA_FABRIQUE_DU_NET,
    href: "https://www.lafabriquedunet.fr/agences/pages/agences-developpement-logiciel/tarifs",
    releve: RELEVE_REPERES,
  } satisfies SourceRepere,
  /** Médiane d'un projet logiciel en agence, en euros. */
  mediane: 30000,
  /** Prix d'entrée d'un premier outil en agence, bornes en euros. */
  premierOutilMin: 8000,
  premierOutilMax: 10000,
} as const;
