/**
 * Contenu du bloc de prise de rendez-vous.
 *
 * POURQUOI TOUT LE TEXTE EST ICI. `scripts/hardcoded-text-audit.mjs` refuse la
 * moindre chaîne rendue depuis un composant : le site lit 100 % de son contenu
 * par la donnée. Le composant `ReservationRendezVous` n'écrit donc aucun
 * libellé, pas même « Réessayer ».
 *
 * CE QUI N'EST PAS ICI, et ne doit pas y venir : la durée RÉELLE de chaque
 * rendez-vous. Elle vit chez Cal.com, qui est l'autorité sur l'agenda. Le champ
 * `duree` ci-dessous n'est qu'un AFFICHAGE : s'il ment, c'est le réglage
 * Cal.com qui fait foi, et `docs/CAL-COM.md` donne la procédure pour que les
 * deux coïncident.
 *
 * LE QUESTIONNAIRE, LUI, VIT ICI ET PAS CHEZ CAL.COM (2026-09-23). Ses
 * réponses partent dans le champ natif `notes` de la réservation, mises en
 * forme par `src/lib/rendez-vous/questionnaire.ts`. Aucun champ Cal.com
 * supplémentaire : un champ personnalisé obligatoire ajouté là-bas casserait
 * la route sans que rien ne change dans le dépôt.
 */

import type { PrestationId } from "@/content/offre";

/**
 * Les trois entrées du sélecteur, et l'ordre dans lequel elles s'affichent.
 *
 * « outil » a disparu le 2026-09-23 avec la prestation du même nom : l'outil
 * est entré dans La Solution métier, et le rendez-vous
 * « logiciel » couvre les deux tailles. Un ancien lien `?sujet=outil` est
 * redirigé vers « logiciel » par `resoudreSujet` (`src/lib/rendez-vous/config.ts`).
 */
export const IDS_RENDEZ_VOUS = ["site", "logiciel", "decouverte"] as const;

export type IdRendezVous = (typeof IDS_RENDEZ_VOUS)[number];

export interface TypeRendezVous {
  readonly id: IdRendezVous;
  readonly nom: string;
  /** Durée AFFICHÉE. L'autorité reste le type d'événement Cal.com. */
  readonly duree: string;
  readonly description: string;
}

/** Une réponse possible à une question du questionnaire. */
export interface OptionQuestion {
  /** Identifiant stable, transmis au serveur et vérifié en liste fermée. */
  readonly id: string;
  readonly libelle: string;
}

export interface ContenuRendezVous {
  readonly eyebrow: string;
  readonly titre: string;
  readonly chapeau: string;
  readonly noteFuseau: string;
  /** Faits courts posés sous le chapeau : ce que le visiteur engage en réservant. */
  readonly garanties: readonly string[];
  readonly types: readonly TypeRendezVous[];
  readonly etapes: {
    readonly sujet: string;
    readonly creneau: string;
    readonly projet: string;
    readonly coordonnees: string;
  };
  readonly actions: {
    readonly reessayer: string;
    readonly moisPrecedent: string;
    readonly moisSuivant: string;
    readonly continuer: string;
    readonly retour: string;
  };
  readonly creneaux: {
    readonly chargement: string;
    readonly erreur: string;
    readonly vide: string;
    readonly indisponible: string;
    /** Titre de la colonne des heures, suivi du jour choisi. */
    readonly libelleGrille: string;
    readonly libelleCalendrier: string;
    readonly libelleDuree: string;
    /** Annonce au lecteur d'écran de ce que montre la colonne des heures. */
    readonly annonce: (jour: string, nombre: number) => string;
    /** Une durée Cal.com, en minutes, telle qu'affichée sur sa pastille. */
    readonly duree: (minutes: number) => string;
  };
  /** Titre du récapitulatif affiché au-dessus de chaque étape franchie. */
  readonly recapitulatif: string;
  readonly formulaire: {
    readonly nomLabel: string;
    readonly nomPlaceholder: string;
    readonly emailLabel: string;
    readonly emailPlaceholder: string;
    readonly messageLabel: string;
    readonly messagePlaceholder: string;
    readonly envoyer: string;
    readonly envoiEnCours: string;
    readonly mention: string;
    readonly mentionLien: string;
    readonly mentionHref: string;
  };
  readonly questionnaire: {
    readonly budget: {
      readonly legende: string;
      readonly erreur: string;
      /** Les tranches sont CALCULÉES depuis `offre.ts` ; seuls leurs mots sont ici. */
      readonly moinsDe: (prix: string) => string;
      readonly entre: (bas: string, haut: string) => string;
      readonly plusDe: (prix: string) => string;
      readonly inconnu: string;
    };
    readonly objectif: {
      readonly legende: string;
      readonly erreur: string;
      readonly options: Readonly<Record<IdRendezVous, readonly OptionQuestion[]>>;
    };
    readonly echeance: {
      readonly legende: string;
      readonly options: readonly OptionQuestion[];
    };
  };
  /** « Ce que vous pouvez espérer à ce budget », affiché dès qu'une tranche est choisie. */
  readonly retour: {
    readonly titre: string;
    readonly aucun: (prixEntree: string) => string;
    readonly inconnu: string;
    readonly repere: (prestation: string, prix: string) => string;
    readonly prixPlancher: (prix: string) => string;
    /** Le plancher tient dans la tranche. */
    readonly aPortee: string;
    /** La tranche est ouverte vers le haut. */
    readonly large: string;
  };
  /**
   * Intitulés des lignes déposées dans les notes Cal.com. Lus par Eliott dans
   * son agenda, jamais par le visiteur.
   */
  readonly notes: {
    readonly budget: string;
    readonly forfait: string;
    readonly objectif: string;
    readonly echeance: string;
    readonly aucunForfait: string;
    readonly aCaler: string;
  };
  readonly succes: {
    readonly titre: string;
    readonly texte: string;
    readonly autre: string;
  };
}

export const rendezVousContent: ContenuRendezVous = {
  eyebrow: "Prendre rendez-vous",
  titre: "Réserver un créneau",
  chapeau:
    "Choisissez un sujet, une durée et une heure, puis répondez à trois questions sur votre projet : vous savez avant l’appel ce que votre budget permet. Le lien de visioconférence part par e-mail dans la foulée.",
  noteFuseau: "Heures affichées à l’heure de Paris.",
  garanties: [
    "Gratuit et sans engagement",
    "En visio, lien envoyé par e-mail",
    "Annulable ou déplaçable en un clic",
  ],

  /*
   * LES INTITULÉS SONT DES INVITATIONS, PAS DES CATÉGORIES, depuis le
   * 2026-09-02. « Un site », « Un outil métier », « Un logiciel sur mesure »
   * nommaient un rayon de magasin : le visiteur devait se ranger dans une case
   * avant d'avoir dit un mot. Eliott, le même jour : « il faut que ce soit un
   * peu plus vivant sur les titres, par exemple parle-moi de ton projet de
   * site, ou quel outil te ferait gagner du temps ». Les quatre commencent donc
   * par un verbe qui s'adresse à quelqu'un, et chacun un verbe DIFFÉRENT : deux
   * entrées qui ouvriraient sur « parle-moi » se liraient comme un doublon.
   *
   * TROIS ENTRÉES DEPUIS LE 2026-09-23. « logiciel » absorbe l'ancien « outil » :
   * son intitulé part du problème (ce qui coince) et non de la taille de la
   * réponse, parce que c'est le budget du questionnaire qui dira ensuite s'il
   * s'agit d'un outil ou d'un logiciel complet.
   *
   * ILS NE SONT PAS CE QU'ELIOTT LIT DANS SON AGENDA, et c'est voulu. Le nom de
   * l'événement dans Google Agenda est réglé chez Cal.com, sobre et scannable
   * (« SITE · Prénom Nom »), parce qu'un agenda se lit en diagonale entre deux
   * réunions. Le site invite, l'agenda classe. Voir `docs/CAL-COM.md`.
   *
   * TRENTE MINUTES PARTOUT depuis le 2026-09-02, contre 20 / 20 / 30 / 15.
   * Eliott : « 15 minutes ça peut faire vraiment bâclé en terme de rendez-vous,
   * il faut toujours aborder plein de sujets et prendre le temps de discuter
   * avec la personne. » Le raisonnement tient au-delà du confort : un premier
   * échange utile doit couvrir la situation de départ, ce qui a déjà été tenté,
   * l'échéance, qui décide, et se terminer par une prochaine étape posée. Un
   * quart d'heure ne suffit pas, et l'ASYMÉTRIE tranche : un rendez-vous trop
   * court qu'il faut écourter alors qu'il y avait de la matière fait partir le
   * prospect sans suite, quand un rendez-vous trop long qu'on termine en douze
   * minutes rend simplement du temps. La durée annoncée est aussi la même pour
   * les quatre, ce qui évite au visiteur de croire que son sujet vaut moins de
   * temps que celui d'à côté.
   *
   * LE VISITEUR CHOISIT SA DURÉE depuis le 2026-10-01. Chaque type d'événement
   * Cal.com propose plusieurs durées et en désigne une par défaut, présélectionnée
   * sur le site. Le sélecteur les lit chez Cal.com (`src/lib/rendez-vous/durees.ts`) ;
   * le champ `duree` ci-dessous ne fait qu'annoncer la fourchette sur la carte.
   *
   * CETTE DURÉE EST UN AFFICHAGE. L'autorité reste le type d'événement Cal.com :
   * si les deux divergent, c'est Cal.com qui fait foi et le site qui ment.
   */
  types: [
    {
      id: "site",
      nom: "Parlez-moi de votre projet de site",
      duree: "15, 30 ou 45 minutes",
      description:
        "On regarde ce que vous avez aujourd’hui, ce que vous voulez que le site rapporte, et à quoi ressemblerait la bonne version. Vous repartez avec un ordre de grandeur de budget et de délai, et on cale la suite.",
    },
    {
      id: "logiciel",
      nom: "Expliquez-moi ce qui coince dans votre métier",
      duree: "30, 45 ou 60 minutes",
      description:
        "Une tâche que vous refaites à la main, un tableur qui déborde, des outils qui ne se parlent pas, ou un logiciel entier à construire. On regarde où passe le temps et ce qui existe déjà. Vous repartez avec un ordre de grandeur et une prochaine étape.",
    },
    {
      id: "decouverte",
      nom: "Décrivez-moi votre projet",
      duree: "15, 30 ou 45 minutes",
      description:
        "Vous voyez le problème, pas encore la solution. On en parle sans que vous ayez à choisir une case avant. Si ce n’est pas pour moi, je vous le dis pendant l’appel, ça vous évite de perdre du temps.",
    },
  ],

  etapes: {
    sujet: "Le sujet",
    creneau: "Le créneau",
    projet: "Votre projet",
    coordonnees: "Vos coordonnées",
  },

  actions: {
    reessayer: "Réessayer",
    moisPrecedent: "Mois précédent",
    moisSuivant: "Mois suivant",
    continuer: "Continuer",
    retour: "Retour",
  },

  creneaux: {
    chargement: "Recherche des créneaux libres…",
    erreur:
      "Les créneaux n’ont pas pu être chargés. Réessayez, ou écrivez-moi par le formulaire de contact.",
    vide: "Aucun créneau libre ce mois-ci. Essayez le suivant.",
    indisponible:
      "La prise de rendez-vous en ligne est momentanément indisponible. Le formulaire de contact reste le chemin le plus direct.",
    libelleGrille: "Heures libres",
    libelleCalendrier: "Jour du rendez-vous",
    libelleDuree: "Durée de l’appel",
    annonce: (jour, nombre) =>
      `${nombre} ${nombre > 1 ? "créneaux libres" : "créneau libre"} le ${jour}.`,
    duree: (minutes) => `${minutes} min`,
  },

  recapitulatif: "Votre rendez-vous",

  formulaire: {
    nomLabel: "Votre nom",
    nomPlaceholder: "Prénom et nom",
    emailLabel: "Votre e-mail",
    emailPlaceholder: "vous@exemple.fr",
    messageLabel: "Votre situation en deux lignes (facultatif)",
    messagePlaceholder:
      "Ce que vous avez aujourd’hui, ce qui coince, ce que vous avez déjà essayé.",
    envoyer: "Confirmer le rendez-vous",
    envoiEnCours: "Confirmation en cours…",
    mention:
      "Votre nom, votre adresse et vos réponses sont transmis à Cal.com, qui héberge mon agenda, dans le seul but de créer ce rendez-vous. Détail dans la",
    mentionLien: "politique de confidentialité",
    mentionHref: "/legal/politique-de-confidentialite",
  },

  /*
   * LE QUESTIONNAIRE, demandé par Eliott le 2026-09-23 : « avoir leur budget
   * c'est de l'OR, sinon ce qu'ils veulent et leur dire si c'est possible ou non
   * et ce qu'ils peuvent espérer à ce prix ». Trois questions, deux obligatoires.
   *
   * AUCUN MONTANT ICI. Les tranches de budget sont calculées depuis les planchers de
   * `offre.ts` par `src/lib/rendez-vous/questionnaire.ts` : un prix qui change
   * là-bas déplace les tranches sans qu'on touche à ce fichier.
   *
   * « AUTRE CHOSE » RENVOIE AU MESSAGE LIBRE, qui existe déjà à l'étape
   * suivante. Pas de champ texte de plus sous l'option.
   */
  questionnaire: {
    budget: {
      legende: "Votre budget, hors taxes",
      erreur: "Choisissez une tranche. « Je ne sais pas encore » est une réponse valable.",
      moinsDe: (prix) => `Moins de ${prix}`,
      entre: (bas, haut) => `De ${bas} à ${haut}`,
      plusDe: (prix) => `Plus de ${prix}`,
      inconnu: "Je ne sais pas encore",
    },
    objectif: {
      legende: "Ce que vous voulez obtenir en priorité",
      erreur: "Choisissez ce qui compte le plus pour vous.",
      options: {
        site: [
          { id: "google", libelle: "Être trouvé sur Google" },
          { id: "demandes", libelle: "Recevoir plus d’appels et de demandes" },
          { id: "concurrents", libelle: "Faire sérieux face à mes concurrents" },
          { id: "remplacer", libelle: "Remplacer un site qui date" },
          { id: "autre", libelle: "Autre chose" },
        ],
        logiciel: [
          { id: "tache", libelle: "Supprimer une tâche faite à la main" },
          { id: "tableur", libelle: "Sortir du tableur partagé" },
          { id: "relier", libelle: "Relier des outils qui ne se parlent pas" },
          { id: "clients", libelle: "Donner un accès à mes clients" },
          { id: "autre", libelle: "Autre chose" },
        ],
        decouverte: [
          { id: "google", libelle: "Être trouvé sur Google" },
          { id: "demandes", libelle: "Recevoir plus de demandes" },
          { id: "tache", libelle: "Supprimer une tâche faite à la main" },
          { id: "relier", libelle: "Relier des outils qui ne se parlent pas" },
          { id: "autre", libelle: "Autre chose" },
        ],
      },
    },
    echeance: {
      legende: "Votre échéance (facultatif)",
      options: [
        { id: "vite", libelle: "Dès que possible" },
        { id: "trimestre", libelle: "Dans les trois mois" },
        { id: "libre", libelle: "Pas de date précise" },
      ],
    },
  },

  retour: {
    titre: "Ce que vous pouvez espérer à ce budget",
    aucun: (prixEntree) =>
      `Mes projets commencent à ${prixEntree} HT, et ce budget n’y suffit pas. Réservez quand même : on regarde ensemble ce qui est faisable, et par quoi commencer.`,
    inconnu: "On le cale ensemble pendant l’appel. Pour vous situer :",
    repere: (prestation, prix) => `${prestation}, ${prix}.`,
    prixPlancher: (prix) => `À partir de ${prix} HT`,
    aPortee:
      "Votre budget couvre le prix de départ. Ce qu’il permet d’ajouter, je vous le dis pendant l’appel, et le devis le fixe.",
    large:
      "Votre budget laisse de la place à un projet complet. On fixe le périmètre ensemble, au devis.",
  },

  notes: {
    budget: "Budget HT",
    forfait: "À portée",
    objectif: "Objectif",
    echeance: "Échéance",
    aucunForfait: "rien à ce budget",
    aCaler: "à caler pendant l’appel",
  },

  succes: {
    titre: "C’est réservé.",
    texte:
      "Un e-mail de confirmation vient de partir vers votre boîte, avec le lien de visioconférence et de quoi annuler ou déplacer en un clic. Vous n’avez rien d’autre à faire d’ici là.",
    autre: "Prendre un autre rendez-vous",
  },
};

/**
 * Nom du paramètre d'URL qui PRÉSÉLECTIONNE le sujet sur `/contact`.
 *
 * Il existe parce que la prise de rendez-vous était injoignable : elle vit tout
 * en bas de `/contact`, derrière un formulaire de contact complet qui est son
 * concurrent direct, et AUCUN lien du site n'y menait. Les boutons de
 * l'accordéon des prestations pointent maintenant dessus, sujet déjà choisi.
 */
export const PARAM_SUJET = "sujet";

/**
 * Prestation de l'offre → sujet de rendez-vous.
 *
 * SEUL ENDROIT OÙ « vitrine » DEVIENT « site ». Les deux nomenclatures ne
 * coïncident pas et n'ont aucune raison de coïncider : `offre.ts` nomme des
 * prestations vendues, ce fichier nomme des types d'événement Cal.com. Écrire
 * la correspondance ailleurs, ou la supposer être l'identité, casserait le lien
 * du site vitrine sans que rien ne le signale — le paramètre inconnu est
 * ignoré en silence, par construction.
 */
export const RDV_PAR_PRESTATION: Readonly<Record<PrestationId, IdRendezVous>> = {
  vitrine: "site",
  logiciel: "logiciel",
};

/**
 * Les deux offres sans prestation propre, depuis le 2026-10-16 : l'intégration
 * IA et le CTO et référent IA à temps partagé. Aucun type d'événement Cal.com
 * de plus : l'intégration IA se discute comme un outil (« logiciel »), et le
 * pilotage technique part d'un problème dont la solution n'est pas encore
 * choisie (« decouverte »). Un nouveau sujet demanderait son type d'événement
 * chez Cal.com avant d'exister ici (`docs/CAL-COM.md`).
 */
export const RDV_HORS_PRESTATION = {
  integrationIA: "logiciel",
  cto: "decouverte",
} as const satisfies Readonly<Record<string, IdRendezVous>>;

/**
 * Adresse de la prise de rendez-vous, sujet compris.
 *
 * COMPOSÉE, JAMAIS ÉCRITE À LA MAIN : trois appelants la construisent
 * (l'accordéon des prestations, les cartes de périmètre, et rien n'empêche un
 * quatrième), et un paramètre recopié de travers ne produit aucune erreur, juste
 * une présélection qui ne se fait pas.
 */
export const lienRendezVous = (id: IdRendezVous): string =>
  `/contact?${PARAM_SUJET}=${id}#rendez-vous`;
