/**
 * L'OFFRE — source unique des prestations, de ce qu'elles comprennent et de
 * leur prix plancher.
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

/** Identifiants stables des prestations à page dédiée. */
export type PrestationId = "vitrine" | "logiciel";

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
  /**
   * Absente pour un projet, payé une fois. « mois » pour un accompagnement
   * facturé chaque mois : le plancher s'affiche alors « par mois ».
   */
  readonly periode?: "mois";
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
 * LES PLANCHERS, ARRÊTÉS PAR ELIOTT LE 2026-10-05 : les prix d'entrée des
 * anciennes grilles. Site vitrine dès 3 000 € HT ; intégration IA dans un outil
 * existant dès 2 500 € HT.
 *
 * LA SOLUTION MÉTIER DESCEND DE 6 000 À 3 500 € HT LE 2026-10-16, demande
 * d'Eliott : « il peut y avoir des solutions métier qui coûtent moins de
 * 6 000 € si c'est des outils simples ». Le plancher est celui d'un outil à
 * une fonction : un écran ou un flux, une base, une tâche automatisée. Relevé
 * de marché du jour (941 Consulting, Cœur du Web, Optimize Insight, Kolonell,
 * Digitiz, Fenxi) : un outil interne simple chez un indépendant démarre entre
 * 3 000 et 5 000 €. La comparaison aux agences reste à livrable égal : leur
 * premier outil (`repereAgenceLogiciel.premierOutilMin`) contre ce plancher,
 * jamais ce plancher contre leur médiane.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott. Eliott dit « je » : il
 * est seul, c'est son argument face aux agences. Le « nous » n'existe nulle part.
 */
export const prestations: readonly Prestation[] = [
  {
    id: "vitrine",
    nom: "Site vitrine",
    slug: "site-vitrine",
    plancher: 3000,
    resume:
      "Une adresse qui dit ce que vous faites, pour qui, et comment vous joindre, pensée pour vous amener des clients. Écrite et développée sur mesure. Une fois livrée, elle est à vous, sans abonnement pour continuer à l’utiliser.",
    inclus: [
      "Un site développé sur mesure, direction visuelle tirée de votre univers",
      "Vos textes écrits par moi, pour être lus et trouvés",
      "Les mots que tapent vos clients, cherchés avant d’écrire",
      "Vos photos recadrées et compressées",
      "Un formulaire qui arrive dans votre boîte mail",
      "Vitesse mesurée avant la mise en ligne, mobile et ordinateur",
      "Les bases du référencement posées, indexation vérifiée",
      "Mentions légales, politique de confidentialité et bandeau cookies",
      "Hébergement à votre nom, code dans votre dépôt",
    ],
    faitMonter: [
      "Le nombre de pages, d’une page longue à un site complet",
      "Une page par métier ou par ville si votre marché est local",
      "Balisage, données structurées, Search Console branchée",
      "Un parcours dessiné pour une action décidée avec vous",
      "La mesure installée : d’où viennent les visites, ce qui déclenche un contact",
      "Vos formulaires branchés sur votre agenda ou votre CRM",
      "Une passe de correction après la mise en ligne, sur ce que les chiffres montrent",
    ],
    horsOffre:
      "Boutique en ligne, espace client, réservation avec paiement : ces fonctions sortent du site, et je les chiffre avec La Solution métier. Un tableau de bord de suivi du trafic et la remise d’aplomb de votre fiche établissement Google se font en plus, sur devis.",
  },

  {
    id: "logiciel",
    nom: "La Solution métier",
    slug: "logiciel-metier",
    plancher: 3500,
    resume:
      "La réponse à un problème précis de votre métier : une tâche que vous refaites à la main, un tableur qui déborde, des outils qui ne se parlent pas. Du petit outil qui règle une seule tâche à la plateforme qui relie tous vos systèmes, à la taille de ce que vous devez résoudre.",
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

/*
 * L'INTÉGRATION IA DANS UN OUTIL EXISTANT, dès 2 500 € HT (2026-10-05).
 *
 * HORS DE `prestations`, ET C'EST VOULU. Dans `prestations`, l'offre
 * gagnerait d'office une page `/services/<slug>`, une prise de rendez-vous à
 * son nom et des tranches de budget dans le questionnaire. Sa page est une
 * page thématique (`/services/automatisation`), et depuis le 2026-10-16,
 * demande d'Eliott (« intégration IA dans les services »), elle a sa ligne
 * dans la liste des services de `/a-propos` (`services.ts`).
 *
 * Les lignes reprennent les périmètres validés : 1 usage dans 1 outil ; les
 * règles du métier ; plusieurs outils ; le modèle d'IA payé par le client, à
 * son nom.
 */
export const integrationIA: Offre = {
  nom: "L’intégration IA",
  plancher: 2500,
  inclus: [
    "1 usage : résumer, classer ou rédiger",
    "Branché sur 1 outil que vous utilisez déjà",
    "Code source dans votre dépôt, et sa documentation",
  ],
  faitMonter: [
    "Le nombre d’usages confiés à l’IA",
    "Les règles et le vocabulaire de votre métier appliqués",
    "Plusieurs outils reliés entre eux",
  ],
  horsOffre:
    "L’abonnement au modèle d’IA est ouvert à votre nom, et vous le payez directement à son éditeur.",
};

/*
 * LE CTO ET RÉFÉRENT IA À TEMPS PARTAGÉ, dès 1 600 € HT par mois (2026-10-16).
 *
 * DEMANDE D'ELIOTT DU 2026-10-16 : « CTO externalisé/fractionnel, et pas que
 * CTO mais aussi référent IA ». Prix calé sur le relevé de marché du jour
 * (941 Consulting, Cœur du Web, Optimize Insight, Kolonell, Digitiz, Fenxi) :
 * un CTO à temps partagé pour une PME se facture de l'ordre de 1 500 à
 * 3 500 € par mois pour deux à quatre jours de travail mensuels.
 *
 * LE PRIX EST UN PRIX MENSUEL, jamais un prix au jour : le site ne parle
 * d'aucun taux journalier (`offre.test.mjs`). Les jours décrivent le temps
 * réservé chaque mois, pas l'unité de facturation.
 *
 * HORS DE `prestations`, comme l'intégration IA : sa page est une page
 * thématique (`/services/cto-referent-ia`), et un abonnement mensuel n'entre
 * pas dans les tranches de budget du questionnaire, calculées pour un projet.
 */

/**
 * Quatre jours de travail chaque mois au lieu de deux, en euros HT par mois.
 * Le mot « palier » reste hors des textes : il désigne sur ce site les
 * forfaits supprimés le 2026-10-05, et `profil.test.mjs` le refuse.
 */
export const CTO_QUATRE_JOURS = 3200;

export const ctoReferentIA: Offre = {
  nom: "CTO et référent IA à temps partagé",
  plancher: 1600,
  periode: "mois",
  inclus: [
    "Deux jours de travail chaque mois, sur vos sujets techniques et d’IA",
    "Un comité mensuel en visio avec la direction",
    "La revue de votre architecture et des devis de vos prestataires",
    "La feuille de route technique et IA, revue chaque trimestre",
    "Le choix et la mise en place de vos outils d’IA",
    "Un support écrit, avec une réponse sous 48\u00A0h",
  ],
  faitMonter: [
    `Quatre jours de travail chaque mois au lieu de deux, à ${euros(CTO_QUATRE_JOURS)} HT par mois`,
    "Le recrutement de votre équipe technique, compris dans les quatre jours",
    "La gouvernance de vos données, comprise dans les quatre jours : qui accède à quoi, ce qui part vers un modèle d’IA",
    "Des déplacements occasionnels, sur devis",
  ],
  horsOffre:
    "Le développement d’un outil ou d’une intégration se chiffre à part, avec La Solution métier ou L’intégration IA. L’engagement court sur trois mois, puis vous arrêtez quand vous voulez, avec un mois de préavis.",
};

/**
 * SUIVI MENSUEL — part annuelle du prix du projet.
 *
 * VALEUR : 15 %, arbitrée par Eliott le 2026-08-27 sur relevé de marché. Six
 * sources françaises indépendantes placent la maintenance applicative entre 15
 * et 20 % du coût de développement par an.
 *
 * UNE RÈGLE, PAS UN MONTANT : exprimé en part du projet, le suivi suit la
 * grille automatiquement.
 *
 * OÙ IL S'AFFICHE : dans la FAQ, qui répond à « que se passe-t-il après la mise
 * en ligne ». Jamais sur les pages de prestation, à côté des prix : poser un
 * coût récurrent sous un prix de projet fait hésiter.
 *
 * PLANCHER À 90 € PAR MOIS, arbitré par Eliott le 2026-08-27 : le coût fixe
 * d'un suivi ne descend pas avec la taille du projet. Le plancher mord jusqu'à
 * 7 200 € de projet ; au-dessus, c'est le pourcentage qui commande.
 */
export const TAUX_SUIVI = 0.15;

/** Plancher mensuel du suivi, en euros HT. Voir l'en-tête de `TAUX_SUIVI`. */
export const PLANCHER_SUIVI = 90;

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
 * Suivi mensuel d'un projet donné, en NOMBRE d'euros HT, arrondi à l'euro,
 * plancher compris. Sert aux calculs de la page de prix, qui additionne le
 * suivi sur plusieurs années.
 */
export const suiviMensuelHT = (prixProjet: number): number =>
  Math.max(PLANCHER_SUIVI, Math.round((prixProjet * TAUX_SUIVI) / 12));

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

/** Ce qui suit le montant d'une offre mensuelle : « par mois ». */
export const PERIODES: Readonly<Record<NonNullable<Offre["periode"]>, string>> = {
  mois: "par mois",
};

/** « par mois » pour une offre mensuelle, rien pour un projet. */
export const periode = (offre: Offre): string =>
  offre.periode ? ` ${PERIODES[offre.periode]}` : "";

/**
 * Le plancher, la taxe si l'appelant la demande, puis la période d'une offre
 * mensuelle : « 3 000 € HT », « 1 600 € HT par mois ».
 */
export const prixAffiche = (offre: Offre, taxe = ""): string =>
  `${prixPlancher(offre)}${taxe}${periode(offre)}`;

/**
 * « à partir de 3 000 € », avec la taxe derrière le montant si l'appelant la
 * demande, et « par mois » derrière une offre mensuelle. En minuscule : la
 * phrase ou le composant décide de la capitale.
 */
export const aPartirDe = (offre: Offre, taxe = ""): string =>
  `à partir de ${prixAffiche(offre, taxe)}`;

/*
 * LES REPÈRES D'AGENCE, relevés le 2026-10-15 sur La Fabrique du Net.
 *
 * POSITIONNEMENT DU 2026-10-15, décision d'Eliott : la qualité et le travail
 * d'une agence, pour environ deux fois moins cher. Une comparaison publique
 * reste vérifiable : chaque chiffre affiché vient de cette source, s'affiche
 * avec son nom et sa date, et vit ici, à côté des planchers qu'il compare.
 * Aucun autre chiffre de marché ne s'écrit sur le site.
 *
 *  - Site (`agences-site-internet/tarifs`) : « Site vitrine PME soigné
 *    (design, UX/UI) : 5 000 – 8 000 € » ; médiane d'un site pour une PME :
 *    6 000 €, sur 357 projets d'agences.
 *  - Logiciel (`agences-developpement-logiciel/tarifs`) : un premier outil
 *    démarre autour de 8 000 à 10 000 € ; médiane d'un projet logiciel en
 *    agence : 30 000 €.
 *
 * « DEUX FOIS MOINS » NE S'ÉCRIT QUE POUR LE SITE, où il est exact : médiane
 * de 6 000 € contre un plancher de 3 000 €, et `offre.test.mjs` recalcule le
 * rapport. Pour le logiciel, le chiffre de l'agence s'écrit toujours à côté du
 * plancher, jamais un rapport seul.
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

export const repereAgenceSite = {
  source: {
    nom: LA_FABRIQUE_DU_NET,
    href: "https://www.lafabriquedunet.fr/agences/pages/agences-site-internet/tarifs",
    releve: RELEVE_REPERES,
  } satisfies SourceRepere,
  /** Médiane d'un site pour une PME, en euros. */
  mediane: 6000,
  /** Nombre de projets d'agences sur lesquels la médiane est calculée. */
  projets: 357,
  /** Site vitrine de PME soigné (design, UX/UI), bornes en euros. */
  soigneMin: 5000,
  soigneMax: 8000,
} as const;

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
