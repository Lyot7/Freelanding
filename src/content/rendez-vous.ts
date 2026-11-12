/**
 * Contenu du bloc de prise de rendez-vous.
 *
 * POURQUOI TOUT LE TEXTE EST ICI. `scripts/hardcoded-text-audit.mjs` refuse la
 * moindre chaîne rendue depuis un composant : le site lit 100 % de son contenu
 * par la donnée. Le composant `ReservationRendezVous` n'écrit donc aucun
 * libellé, pas même « Réessayer ».
 *
 * CE QUI N'EST PAS ICI, et ne doit pas y venir : la durée RÉELLE de chaque
 * rendez-vous. Elle vit au cockpit, qui est l'autorité sur l'agenda. Le champ
 * `duree` ci-dessous n'est qu'un AFFICHAGE : s'il ment, c'est le réglage
 * cockpit qui fait foi, et `docs/RENDEZ-VOUS.md` donne la procédure pour que les
 * deux coïncident.
 *
 * LE QUESTIONNAIRE, LUI, VIT ICI ET PAS CHEZ CAL.COM (2026-09-23). Ses
 * réponses partent dans le champ natif `notes` de la réservation, mises en
 * forme par `src/lib/rendez-vous/questionnaire.ts`. Aucun champ cockpit
 * supplémentaire : un champ personnalisé obligatoire ajouté là-bas casserait
 * la route sans que rien ne change dans le dépôt.
 */

import type { PrestationId } from "@/content/offre";

/**
 * Les entrées du sélecteur, et l'ordre dans lequel elles s'affichent.
 *
 * UN SEUL LIEN DE PREMIER RENDEZ-VOUS DEPUIS LE 2026-11-12 (`/rdv`) : le visiteur
 * choisit son sujet par un bouton, « logiciel », « site », « ia » ou « autre »
 * (« decouverte » côté cockpit). Le sujet suit le rendez-vous au cockpit : titre
 * de l'agenda, fiche, e-mail de confirmation. « cto » et « outil » restent
 * traduits par `resoudreSujet` (`src/lib/rendez-vous/config.ts`).
 */
export const IDS_RENDEZ_VOUS = [
  "logiciel",
  "site",
  "ia",
  "decouverte",
  "point-rapide",
  "demonstration",
  "proposition",
  "point-d-etape",
] as const;

export type IdRendezVous = (typeof IDS_RENDEZ_VOUS)[number];

/**
 * Les rendez-vous de CLIENTS (`/rdv/client`) : jamais dans le choix de sujet du
 * premier rendez-vous, et un formulaire réduit à ce qu'il faut pour poser
 * l'événement (nom, e-mail), le téléphone et la ligne libre étant facultatifs.
 */
export const IDS_CLIENT = [
  "point-rapide",
  "demonstration",
  "proposition",
  "point-d-etape",
] as const satisfies readonly IdRendezVous[];

/** Les sujets pour lesquels le formulaire de contact pose la question de l'objectif. */
export type IdObjectif = "logiciel" | "decouverte";

export interface TypeRendezVous {
  readonly id: IdRendezVous;
  readonly nom: string;
  /** Durée AFFICHÉE. L'autorité reste le type du cockpit. */
  readonly duree: string;
  readonly description: string;
  /**
   * Hors du choix de sujet (démonstration, point d'étape : clients en cours) :
   * jamais proposé parmi les boutons, il ne s'ouvre que par `?sujet=<id>` (`typesVisibles`, `src/lib/rendez-vous/config.ts`).
   */
  readonly prive?: true;
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
  /** Page `/rdv/client` : rendez-vous de clients, formulaire réduit. */
  readonly client: {
    readonly eyebrow: string;
    readonly titre: string;
    readonly chapeau: string;
    readonly metaTitre: string;
    readonly metaDescription: string;
  };
  /** Légendes des trois blocs du formulaire. */
  readonly blocs: {
    readonly sujet: string;
    readonly creneau: string;
    readonly coordonnees: string;
  };
  readonly actions: {
    readonly reessayer: string;
    readonly moisPrecedent: string;
    readonly moisSuivant: string;
  };
  readonly creneaux: {
    readonly chargement: string;
    readonly erreur: string;
    readonly vide: string;
    readonly indisponible: string;
    /** Titre de la colonne des heures, suivi du jour choisi. */
    readonly libelleGrille: string;
    readonly libelleCalendrier: string;
    /** Annonce au lecteur d'écran de ce que montre la colonne des heures. */
    readonly annonce: (jour: string, nombre: number) => string;
    /** Une durée du cockpit, en minutes (page de gestion). */
    readonly duree: (minutes: number) => string;
  };
  /** Titre du récapitulatif affiché au-dessus de chaque étape franchie. */
  readonly recapitulatif: string;
  readonly formulaire: {
    readonly nomLabel: string;
    readonly nomPlaceholder: string;
    readonly emailLabel: string;
    readonly emailPlaceholder: string;
    readonly telephoneLabel: string;
    readonly telephoneAide: string;
    readonly telephoneErreur: string;
    readonly telephonePlaceholder: string;
    readonly messageLabel: string;
    readonly messagePlaceholder: string;
    /** Rendez-vous de client : le téléphone et la ligne libre sont facultatifs. */
    readonly telephoneLabelClient: string;
    readonly messageLabelClient: string;
    readonly messagePlaceholderClient: string;
    readonly envoyer: string;
    readonly envoiEnCours: string;
    /** Sous les boutons de sujet, tant qu'aucun n'est choisi : pourquoi le calendrier manque. */
    readonly choisirSujet: string;
    /** Sous le calendrier, tant qu'aucune heure n'est retenue. */
    readonly choisirHeure: string;
    /** Lu au lecteur d'écran quand une heure est choisie : le bouton est plus bas. */
    readonly confirmerCiDessous: string;
    readonly mention: string;
    readonly mentionLien: string;
    readonly mentionHref: string;
  };
  readonly questionnaire: {
    readonly budget: {
      readonly legende: string;
      readonly erreur: string;
      /** Les bornes vivent dans `questionnaire.ts` ; seuls leurs mots sont ici. */
      readonly moinsDe: (prix: string) => string;
      readonly entre: (bas: string, haut: string) => string;
      readonly plusDe: (prix: string) => string;
      readonly inconnu: string;
    };
    readonly objectif: {
      /** Légende commune, reprise par le formulaire de contact. */
      readonly legende: string;
      readonly erreur: string;
      readonly options: Readonly<Record<IdObjectif, readonly OptionQuestion[]>>;
    };
    readonly echeance: {
      readonly legende: string;
      readonly erreur: string;
      readonly options: readonly OptionQuestion[];
    };
  };
  readonly succes: {
    readonly titre: string;
    readonly texte: string;
    readonly autre: string;
  };
  /** Page `/rdv/gerer/[jeton]` : le lien « déplacer ou annuler » des e-mails. */
  readonly gestion: ContenuGestionRendezVous;
}

/** Un état de la page de gestion : titre court, puis une phrase. */
export interface EtatGestion {
  readonly titre: string;
  readonly texte: string;
}

export interface ContenuGestionRendezVous {
  readonly metaTitre: string;
  readonly eyebrow: string;
  readonly titre: string;
  readonly libelleSujet: string;
  readonly libelleDate: string;
  readonly libelleDuree: string;
  readonly actions: {
    readonly deplacer: string;
    readonly annuler: string;
    readonly confirmerAnnulation: string;
    readonly confirmerDeplacement: string;
    readonly retour: string;
    readonly reserver: string;
  };
  readonly lienReserver: string;
  readonly motif: {
    readonly libelle: string;
    readonly aide: string;
  };
  readonly choisirCreneau: string;
  readonly etats: {
    readonly inconnu: EtatGestion;
    readonly annule: EtatGestion;
    readonly deplace: EtatGestion;
    readonly passe: EtatGestion;
    readonly indisponible: EtatGestion;
  };
  readonly succes: {
    readonly annule: EtatGestion;
    readonly deplace: EtatGestion;
  };
}

export const rendezVousContent: ContenuRendezVous = {
  eyebrow: "Prendre rendez-vous",
  titre: "Réserver un créneau",
  chapeau:
    "Un sujet, un créneau, vos coordonnées. Le lien de visio part par e-mail dans la foulée.",
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
   * l'événement dans Google Agenda est posé par le cockpit, sobre et scannable
   * (« <titre du type> entre Eliott Bouquerel et <nom> »), parce qu'un agenda se lit en diagonale entre deux
   * réunions. Le site invite, l'agenda classe. Voir `docs/RENDEZ-VOUS.md`.
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
   * LE VISITEUR CHOISIT SA DURÉE depuis le 2026-10-01. Chaque type du cockpit
   * propose plusieurs durées et en désigne une par défaut, présélectionnée
   * sur le site. Le sélecteur les lit au cockpit (`src/lib/rendez-vous/durees.ts`) ;
   * le champ `duree` ci-dessous ne fait qu'annoncer la fourchette sur la carte.
   *
   * CETTE DURÉE EST UN AFFICHAGE. L'autorité reste le type du cockpit :
   * si les deux divergent, c'est le cockpit qui fait foi et le site qui ment.
   */
  types: [
    {
      id: "logiciel",
      nom: "Logiciel",
      duree: "30, 45 ou 60 minutes",
      description:
        "Une tâche refaite à la main, un tableur qui déborde, des outils qui ne se parlent pas, ou un logiciel entier à construire.",
    },
    {
      id: "site",
      nom: "Site",
      duree: "15, 30 ou 45 minutes",
      description:
        "Un site à créer ou à refaire : ce qu’il doit faire pour vos clients, et ce qui existe déjà.",
    },
    {
      id: "ia",
      nom: "IA",
      duree: "30, 45 ou 60 minutes",
      description:
        "Une tâche répétitive que l’IA peut prendre en charge : on regarde laquelle, et ce que cela vous rendrait.",
    },
    {
      id: "decouverte",
      nom: "Autre",
      duree: "15, 30 ou 45 minutes",
      description:
        "Autre chose, ou le problème sans la solution : on en parle. Si ce n’est pas pour moi, je vous le dis pendant l’appel.",
    },
    /* RENDEZ-VOUS DE CLIENTS, depuis le 2026-11-12 : un seul lien, `/rdv/client`,
       qui propose ces quatre sujets avec un formulaire réduit (nom, e-mail).
       Ils ne figurent jamais dans le choix du premier rendez-vous. */
    {
      id: "point-rapide",
      nom: "Point rapide",
      duree: "15 ou 30 minutes",
      description:
        "Une question, un retour, un ajustement : un court échange pour avancer sans attendre le prochain point d’étape.",
      prive: true,
    },
    {
      id: "demonstration",
      nom: "Démonstration",
      duree: "45 minutes",
      description:
        "Je vous montre en direct un logiciel métier que j’ai construit, sur le cas qui ressemble le plus au vôtre. Vous voyez ce qu’il change au quotidien avant de décider quoi que ce soit.",
      prive: true,
    },
    {
      id: "proposition",
      nom: "Proposition",
      duree: "30, 45 ou 60 minutes",
      description:
        "Je vous présente la proposition et le devis, et on les relit ensemble : périmètre, prix, délais, ce qui peut changer.",
      prive: true,
    },
    {
      id: "point-d-etape",
      nom: "Point d’étape",
      duree: "45 minutes",
      description:
        "On regarde où en est le projet, ce qui est livré et ce qui reste à trancher. Vous repartez avec les décisions prises et la suite datée.",
      prive: true,
    },
  ],

  client: {
    eyebrow: "Déjà client",
    titre: "Prendre un rendez-vous",
    chapeau:
      "Un point rapide, une démonstration, la présentation d’une proposition ou un point d’étape : choisissez un créneau, il ne manque que votre nom et votre e-mail.",
    metaTitre: "Rendez-vous client · Eliott Bouquerel",
    metaDescription: "Réservez un point rapide, une démonstration, une proposition ou un point d’étape avec Eliott Bouquerel.",
  },

  blocs: {
    sujet: "Votre sujet",
    creneau: "Votre créneau",
    coordonnees: "Vos coordonnées",
  },

  actions: {
    reessayer: "Réessayer",
    moisPrecedent: "Mois précédent",
    moisSuivant: "Mois suivant",
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
    telephoneLabel: "Votre téléphone",
    telephoneAide: "Pour vous joindre si la visio ne démarre pas.",
    telephoneErreur: "Indiquez un numéro où vous joindre le jour du rendez-vous.",
    telephonePlaceholder: "06 12 34 56 78",
    messageLabel: "Votre projet en une ligne (facultatif)",
    messagePlaceholder: "Ce que vous voulez améliorer ou construire.",
    telephoneLabelClient: "Votre téléphone (facultatif)",
    messageLabelClient: "De quoi parler (facultatif)",
    messagePlaceholderClient: "Un point précis, une question, un document à regarder.",
    envoyer: "Confirmer le rendez-vous",
    envoiEnCours: "Confirmation en cours…",
    choisirSujet: "Choisissez un sujet pour voir les créneaux libres.",
    choisirHeure: "Choisissez un jour puis une heure pour confirmer.",
    confirmerCiDessous: "Heure retenue. Confirmez avec le bouton plus bas.",
    mention:
      "Votre nom, votre adresse et votre numéro sont enregistrés dans mon outil de gestion et dans mon agenda, dans le seul but de créer ce rendez-vous. Détail dans la",
    mentionLien: "politique de confidentialité",
    mentionHref: "/legal/politique-de-confidentialite",
  },

  /*
   * LE QUESTIONNAIRE, demandé par Eliott le 2026-09-23 : « avoir leur budget
   * c'est de l'OR, sinon ce qu'ils veulent et leur dire si c'est possible ou non
   * et ce qu'ils peuvent espérer à ce prix ». Trois questions, deux obligatoires.
   *
   * AUCUN MONTANT ICI. Les bornes des tranches vivent dans
   * `src/lib/rendez-vous/questionnaire.ts`, et aucune ne cite un prix d'Eliott
   * (décision du 2026-11-01 : ses prix se donnent uniquement sur devis).
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
      erreur: "Choisissez la réponse la plus proche de votre cas.",
      options: {
        logiciel: [
          { id: "tache", libelle: "Supprimer une tâche faite à la main" },
          { id: "tableur", libelle: "Sortir du tableur partagé" },
          { id: "relier", libelle: "Relier des outils qui ne se parlent pas" },
          { id: "clients", libelle: "Donner un accès à mes clients" },
          { id: "autre", libelle: "Autre chose" },
        ],
        decouverte: [
          { id: "tache", libelle: "Supprimer une tâche faite à la main" },
          { id: "relier", libelle: "Relier des outils qui ne se parlent pas" },
          { id: "conseil", libelle: "Avoir un avis sur un projet" },
          { id: "autre", libelle: "Autre chose" },
        ],
      },
    },
    echeance: {
      legende: "Votre échéance",
      erreur: "Choisissez une échéance.",
      options: [
        { id: "vite", libelle: "Dès que possible" },
        { id: "trimestre", libelle: "Dans les trois mois" },
        { id: "libre", libelle: "Pas de date précise" },
      ],
    },
  },

  succes: {
    titre: "C’est réservé.",
    texte:
      "Un e-mail de confirmation vient de partir vers votre boîte, avec le lien de visio et de quoi déplacer ou annuler en un clic. Vous pouvez y répondre pour m’envoyer ce qui m’aidera à préparer l’appel : un lien, un document, deux lignes sur votre situation.",
    autre: "Prendre un autre rendez-vous",
  },
  gestion: {
    metaTitre: "Votre rendez-vous",
    eyebrow: "Votre rendez-vous",
    titre: "Déplacer ou annuler",
    libelleSujet: "Sujet",
    libelleDate: "Date",
    libelleDuree: "Durée",
    actions: {
      deplacer: "Déplacer",
      annuler: "Annuler",
      confirmerAnnulation: "Confirmer l’annulation",
      confirmerDeplacement: "Confirmer ce créneau",
      retour: "Retour",
      reserver: "Réserver un créneau",
    },
    lienReserver: "/rdv",
    motif: {
      libelle: "Motif (facultatif)",
      aide: "Une ligne suffit, elle m’aide à vous proposer mieux la prochaine fois.",
    },
    choisirCreneau: "Choisissez le nouveau créneau",
    etats: {
      inconnu: {
        titre: "Lien introuvable",
        texte: "Ce lien ne correspond à aucun rendez-vous. Vérifiez qu’il est complet dans l’e-mail, ou écrivez-moi.",
      },
      annule: {
        titre: "Rendez-vous annulé",
        texte: "Ce rendez-vous est annulé. Vous pouvez en réserver un autre quand vous voulez.",
      },
      deplace: {
        titre: "Rendez-vous déplacé",
        texte: "Ce rendez-vous a été déplacé. Le lien à jour est dans le dernier e-mail de confirmation.",
      },
      passe: {
        titre: "Rendez-vous passé",
        texte: "Ce rendez-vous a déjà eu lieu. Pour en prévoir un autre, réservez un nouveau créneau.",
      },
      indisponible: {
        titre: "Momentanément indisponible",
        texte: "La gestion du rendez-vous ne répond pas. Réessayez dans un moment, ou écrivez-moi.",
      },
    },
    succes: {
      annule: {
        titre: "C’est annulé.",
        texte: "Un e-mail de confirmation part vers votre boîte. Vous pouvez reprendre un créneau quand vous voulez.",
      },
      deplace: {
        titre: "C’est déplacé.",
        texte: "L’invitation de votre agenda est mise à jour, avec le même lien de visioconférence. Un e-mail de confirmation part vers votre boîte.",
      },
    },
  },
};

/**
 * Nom du paramètre d'URL qui PRÉSÉLECTIONNE le sujet sur `/rdv` (et dans le
 * formulaire du pied de page) : `?sujet=logiciel|site|ia|autre`.
 */
export const PARAM_SUJET = "sujet";

/** Page du premier rendez-vous, la seule : tout lien de réservation y mène. */
export const CHEMIN_RDV = "/rdv";

/**
 * Prestation de l'offre → sujet de rendez-vous : `offre.ts` nomme des
 * prestations vendues, ce fichier nomme des types de rendez-vous.
 */
export const RDV_PAR_PRESTATION: Readonly<Record<PrestationId, IdRendezVous>> = {
  logiciel: "logiciel",
};

/**
 * Adresse de la prise de rendez-vous, sujet compris.
 *
 * COMPOSÉE, JAMAIS ÉCRITE À LA MAIN : trois appelants la construisent
 * (l'accordéon des prestations, les cartes de périmètre, et rien n'empêche un
 * quatrième), et un paramètre recopié de travers ne produit aucune erreur, juste
 * une présélection qui ne se fait pas.
 */
export const lienRendezVous = (id: IdRendezVous): string =>
  `${CHEMIN_RDV}?${PARAM_SUJET}=${id === "decouverte" ? "autre" : id}`;
