/**
 * L'OFFRE — source unique de la prestation, de ce qu'elle comprend et de son
 * prix plancher.
 *
 * UNE SEULE OFFRE DEPUIS LE 2026-10-31, décision d'Eliott du 2026-10-30 : le
 * logiciel métier et les gains de productivité, « en restant ouvert aux
 * propositions ». Le site vitrine, l'intégration IA et le CTO à temps partagé
 * ne sont plus des offres : leurs pages redirigent (`next.config.ts`), et une
 * autre demande passe par la phrase discrète du pied de page.
 *
 * UN PLANCHER PAR OFFRE, TOUT LE RESTE SUR DEVIS, DEPUIS LE 2026-10-05.
 * Décision d'Eliott, qui remplace les forfaits à prix ferme du 2026-09-23. Ses
 * mots : « le temps estimé en développement, ça peut être très très subjectif
 * en fonction des différentes fonctionnalités, de la complexité des outils
 * avec lesquels connecter », et il ne veut pas qu'un visiteur arrive avec
 * « j'ai fait l'estimation, on est à 7000, pourquoi est-ce que c'est plus ».
 * Les projets lourds (sept modules, plusieurs systèmes) n'entraient dans aucun
 * palier publié.
 *
 * CE QUI A DISPARU AVEC LES PALIERS :
 *  - les neuf noms de forfait (trois par offre) et leurs prix fermes. Le prix
 *    ferme existe toujours : c'est celui du DEVIS signé, il ne bouge plus ;
 *  - le délai affiché. La date se fixe au devis ;
 *  - la fourchette « de X à Y ». Une borne haute publiée devient un prix que
 *    le visiteur s'attend à payer.
 *
 * CE QUI LES REMPLACE : pour chaque offre, ce qui est compris dès le plancher
 * (`inclus`) et ce qui fait monter le prix (`faitMonter`). Règle d'Eliott du
 * 2026-09-01, toujours en vigueur : une promesse qu'il n'a jamais faite n'a
 * rien à faire sur le site. Chaque ligne vient donc des anciens périmètres,
 * redistribuée entre les deux listes ; aucune n'a été inventée.
 *
 * LES TEXTES DU SITE VITRINE SONT ÉCRITS PAR ELIOTT, optimisés pour le
 * référencement, et compris dans le prix : « Moi je prépare des textes
 * préfaits pour qu'ils soient optimisés SEO justement et pour qu'ils n'aient
 * pas à le faire. Donc c'est dans mon prix. » (2026-10-05).
 *
 * POURQUOI CE FICHIER EXISTE. Les prix vivaient à deux endroits, `services.ts`
 * et `pricing.ts`, et ils ont divergé à deux écrans d'intervalle sans que rien
 * ne le signale. `offre.test.mjs` empêche le retour de cette classe d'erreur :
 * aucun montant ne s'écrit ailleurs qu'ici.
 */

/** Identifiant stable de la prestation à page dédiée. */
export type PrestationId = "logiciel";

/** Une offre : son plancher, ce qu'elle comprend, ce qui en fait monter le prix. */
export interface Offre {
  readonly nom: string;
  /**
   * Prix plancher HT, en euros, affiché « à partir de ». Le devis ne descend
   * jamais dessous ; il le dépasse selon `faitMonter`.
   */
  readonly plancher: number;
  /** Ce que comprend tout projet de l'offre, dès le plancher. */
  readonly inclus: readonly string[];
  /** Ce qui fait monter le prix au-dessus du plancher. Chiffré au devis. */
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

/*
 * LE PLANCHER : 6 000 € HT, CELUI DE LA GRILLE (`offre-grille-prix.md` du
 * vault), repris au passage à une seule offre, le 2026-10-31. Le site affichait
 * 3 500 € HT depuis le 2026-10-16 alors que les mails annonçaient 6 000 € HT :
 * deux prix pour la même offre. L'accueil montre ce qu'une agence facture, du
 * premier outil à la médiane d'un projet (décision d'Eliott du 2026-11-01) ; la
 * FAQ compare à livrable égal, premier outil contre plancher.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott. Eliott dit « je » : il
 * est seul, c'est son argument face aux agences. Le « nous » n'existe nulle part.
 */
export const prestations: readonly Prestation[] = [
  {
    id: "logiciel",
    nom: "Logiciel métier",
    slug: "logiciel-metier",
    plancher: 6000,
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

/**
 * MAINTENANCE — part annuelle du prix du logiciel.
 *
 * VALEUR : 18 % par an, soit 1,5 % par mois, avec un minimum de 125 € HT par
 * mois, arrondie aux 5 € supérieurs (règle du 2026-10-05, `offre-grille-prix.md`
 * du vault). Le site gardait les 15 % et les 90 € du site vitrine : à une seule
 * offre, c'est la règle du logiciel qui vaut.
 *
 * UNE RÈGLE, PAS UN MONTANT : exprimée en part du projet, elle suit le devis.
 *
 * OÙ ELLE S'AFFICHE : dans la FAQ, qui répond à « que se passe-t-il après la
 * mise en service », et sur la page de prix. Jamais à côté du prix d'entrée :
 * poser un coût récurrent sous un prix de projet fait hésiter.
 */
export const TAUX_SUIVI = 0.18;

/** Plancher mensuel de la maintenance, en euros HT. */
export const PLANCHER_SUIVI = 125;

/** La maintenance s'arrondit aux 5 € supérieurs. */
const PAS_SUIVI = 5;

/**
 * « 15 % » — le taux, tel qu'il s'écrit dans une phrase.
 *
 * ESPACE FINE INSÉCABLE (U+202F) devant le pourcent, et non l'insécable
 * ordinaire (U+00A0) qui précède l'euro : c'est la convention française, celle
 * qu'applique `scripts/typo-fr.mjs`. Écrite en échappement, parce qu'invisible.
 */
export const tauxSuivi = (): string =>
  `${Math.round(TAUX_SUIVI * 100)} %`;

/**
 * Suivi mensuel d'un projet donné, en NOMBRE d'euros HT, arrondi aux 5 €
 * supérieurs, plancher compris. Sert aux calculs de la page de prix, qui additionne le
 * suivi sur plusieurs années.
 */
export const suiviMensuelHT = (prixProjet: number): number =>
  Math.max(
    PLANCHER_SUIVI,
    Math.ceil(Math.round((prixProjet * TAUX_SUIVI) / 12) / PAS_SUIVI) * PAS_SUIVI,
  );

/** Le même suivi, formaté pour une phrase. */
export const suiviMensuel = (prixProjet: number): string =>
  euros(suiviMensuelHT(prixProjet));

/** « 90 € » — le plancher, tel qu'il s'écrit dans une phrase. */
export const plancherSuivi = (): string => euros(PLANCHER_SUIVI);

/** Accès par identifiant, pour que les consommateurs ne dépendent pas de l'ordre. */
export const prestation = (id: PrestationId): Prestation => {
  const trouve = prestations.find((p) => p.id === id);
  if (!trouve) throw new Error(`Prestation inconnue : ${id}`);
  return trouve;
};

/** Le plancher d'une offre, formaté : « 3 000 € ». */
export const prixPlancher = (offre: Offre): string => euros(offre.plancher);

/** Le plancher, avec la taxe si l'appelant la demande : « 6 000 € HT ». */
export const prixAffiche = (offre: Offre, taxe = ""): string =>
  `${prixPlancher(offre)}${taxe}`;

/**
 * « à partir de 6 000 € », avec la taxe derrière le montant si l'appelant la
 * demande. En minuscule : la phrase ou le composant décide de la capitale.
 */
export const aPartirDe = (offre: Offre, taxe = ""): string =>
  `à partir de ${prixAffiche(offre, taxe)}`;

/*
 * LES REPÈRES D'AGENCE, relevés le 2026-10-15 sur La Fabrique du Net
 * (`agences-developpement-logiciel/tarifs`) : un premier outil démarre autour de
 * 8 000 à 10 000 € ; médiane d'un projet logiciel en agence : 30 000 €.
 *
 * Une comparaison publique reste vérifiable : chaque chiffre affiché vient de
 * cette source, s'affiche avec son nom et sa date, et vit ici. Aucun autre
 * chiffre de marché ne s'écrit sur le site. Le chiffre de l'agence s'écrit
 * toujours à côté du plancher, jamais un rapport seul : « deux fois moins cher »
 * ne valait que pour le site vitrine, et il est parti avec lui.
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
