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
 *  - le délai affiché, y compris dans le simulateur. La date se fixe au devis ;
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
 * anciennes grilles. Site vitrine dès 3 000 € HT ; La Solution métier, qui
 * couvre aussi l'outil interne, dès 6 000 € HT ; intégration IA dans un outil
 * existant dès 2 500 € HT. Rien d'autre n'est chiffré sur le site.
 *
 * LE SITE TUTOIE, et Eliott dit « je » : il est seul, c'est son argument face
 * aux agences. Le « nous » n'existe nulle part.
 */
export const prestations: readonly Prestation[] = [
  {
    id: "vitrine",
    nom: "Site vitrine",
    slug: "site-vitrine",
    plancher: 3000,
    resume:
      "Une adresse qui dit ce que tu fais, pour qui, et comment te joindre. Écrite et développée sur mesure. Une fois livrée, elle est à toi, sans abonnement pour continuer à l’utiliser.",
    inclus: [
      "Un site développé sur mesure, direction visuelle tirée de ton univers",
      "Tes textes écrits par moi, pour être lus et trouvés",
      "Les mots que tapent tes clients, cherchés avant d’écrire",
      "Tes photos recadrées et compressées",
      "Un formulaire qui arrive dans ta boîte mail",
      "Vitesse mesurée avant la mise en ligne, mobile et ordinateur",
      "Les bases du référencement posées, indexation vérifiée",
      "Mentions légales, politique de confidentialité et bandeau cookies",
      "Hébergement à ton nom, code dans ton dépôt",
    ],
    faitMonter: [
      "Le nombre de pages, d’une page longue à un site complet",
      "Une page par métier ou par ville si ton marché est local",
      "Balisage, données structurées, Search Console branchée",
      "Un parcours dessiné pour une action décidée avec toi",
      "La mesure installée : d’où viennent les visites, ce qui déclenche un contact",
      "Tes formulaires branchés sur ton agenda ou ton CRM",
      "Une passe de correction après la mise en ligne, sur ce que les chiffres montrent",
    ],
    horsOffre:
      "Boutique en ligne, espace client, réservation avec paiement : ces fonctions sortent du site, et je les chiffre avec La Solution métier. Un tableau de bord de suivi du trafic et la remise d’aplomb de ta fiche établissement Google se font en plus, sur devis.",
  },

  {
    id: "logiciel",
    nom: "La Solution métier",
    slug: "logiciel-metier",
    plancher: 6000,
    resume:
      "La réponse à un problème précis de ton métier : une tâche que tu refais à la main, un tableur qui déborde, des outils qui ne se parlent pas. Des écrans, une base de données et une mise en production, à la taille de ce que tu dois résoudre.",
    inclus: [
      "Les écrans nécessaires, la base de données et la mise en production sur ton hébergement",
      "Le raccordement à l’outil qui porte déjà tes données",
      "Un export de tout ce que le logiciel contient, à tout moment",
      "Code source dans ton dépôt, et sa documentation",
    ],
    faitMonter: [
      "Le nombre de modules, comme les devis, le planning et la facturation",
      "Le nombre d’outils à relier, et les échanges dans les deux sens",
      "Un compte par personne, et des droits différenciés par rôle",
      "La reprise de ton historique",
      "Les cas particuliers de ton métier, traités un par un",
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
      "Un existant non documenté ou plusieurs sociétés à servir : je chiffre le cadrage à part, je te le remets écrit, et il t’appartient. La prise en main de tes équipes se fait en plus, sur devis. Reprendre un logiciel déjà en place se tranche par un audit de son code, et la réponse est non sur PHP et sur Laravel.",
  },
];

/*
 * L'INTÉGRATION IA DANS UN OUTIL EXISTANT, dès 2 500 € HT (2026-10-05).
 *
 * HORS DE `prestations`, ET C'EST VOULU. Les automatisations IA restent au
 * second rang (`offre-grille-prix.md` du vault) : elles se vendent, elles ne
 * se mettent pas en avant. Dans `prestations`, l'offre gagnerait d'office une
 * page `/services/…`, une ligne d'accordéon et une entrée au sitemap. Le
 * simulateur de prix la lit ; sa page et `llms.txt` en citent le plancher.
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
    "Branché sur 1 outil que tu utilises déjà",
    "Code source dans ton dépôt, et sa documentation",
  ],
  faitMonter: [
    "Le nombre d’usages confiés à l’IA",
    "Les règles et le vocabulaire de ton métier appliqués",
    "Plusieurs outils reliés entre eux",
  ],
  horsOffre:
    "L’abonnement au modèle d’IA est ouvert à ton nom, et tu le paies directement à son éditeur.",
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

/**
 * « à partir de 3 000 € », avec la taxe derrière le montant si l'appelant la
 * demande. En minuscule : la phrase ou le composant décide de la capitale.
 */
export const aPartirDe = (offre: Offre, taxe = ""): string =>
  `à partir de ${prixPlancher(offre)}${taxe}`;
