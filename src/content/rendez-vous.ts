/**
 * Contenu du bloc de prise de rendez-vous.
 *
 * POURQUOI TOUT LE TEXTE EST ICI. `scripts/hardcoded-text-audit.mjs` refuse la
 * moindre chaîne rendue depuis un composant : le site lit 100 % de son contenu
 * par la donnée. Le composant `ReservationRendezVous` n'écrit donc aucun
 * libellé, pas même « Réessayer ».
 *
 * CE QUI N'EST PAS ICI, et ne doit pas y venir : la durée RÉELLE de chaque
 * rendez-vous et les questions posées à la réservation. Elles vivent chez
 * Cal.com, qui est l'autorité sur l'agenda. Le champ `duree` ci-dessous n'est
 * qu'un AFFICHAGE : s'il ment, c'est le réglage Cal.com qui fait foi, et
 * `docs/CAL-COM.md` donne la procédure pour que les deux coïncident.
 */

import type { PrestationId } from "@/content/offre";

/** Les quatre entrées du sélecteur, et l'ordre dans lequel elles s'affichent. */
export const IDS_RENDEZ_VOUS = [
  "site",
  "outil",
  "logiciel",
  "decouverte",
] as const;

export type IdRendezVous = (typeof IDS_RENDEZ_VOUS)[number];

export interface TypeRendezVous {
  readonly id: IdRendezVous;
  readonly nom: string;
  /** Durée AFFICHÉE. L'autorité reste le type d'événement Cal.com. */
  readonly duree: string;
  readonly description: string;
}

export interface ContenuRendezVous {
  readonly eyebrow: string;
  readonly titre: string;
  readonly chapeau: string;
  readonly noteFuseau: string;
  readonly types: readonly TypeRendezVous[];
  readonly etapes: {
    readonly sujet: string;
    readonly creneau: string;
    readonly coordonnees: string;
  };
  readonly actions: {
    readonly changer: string;
    readonly reessayer: string;
    readonly semainePrecedente: string;
    readonly semaineSuivante: string;
  };
  readonly creneaux: {
    readonly chargement: string;
    readonly erreur: string;
    readonly vide: string;
    readonly indisponible: string;
    readonly libelleGrille: string;
    readonly libelleJours: string;
  };
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
    "Dis-moi de quoi tu veux parler, choisis une heure, et c’est réglé. Le lien de visioconférence part par e-mail dans la foulée.",
  noteFuseau: "Heures affichées à l’heure de Paris.",

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
   * CETTE DURÉE EST UN AFFICHAGE. L'autorité reste le type d'événement Cal.com :
   * si les deux divergent, c'est Cal.com qui fait foi et le site qui ment.
   */
  types: [
    {
      id: "site",
      nom: "Parle-moi de ton projet de site",
      duree: "30 minutes",
      description:
        "Vitrine, refonte, visibilité locale. On regarde ce que tu as déjà, ce qui manque, et ce que ça représente.",
    },
    {
      id: "outil",
      nom: "Quel outil te ferait gagner du temps",
      duree: "30 minutes",
      description:
        "Devis, planning, suivi de chantier. On part de ce que tu fais à la main aujourd’hui.",
    },
    {
      id: "logiciel",
      nom: "Explique-moi ton projet de logiciel",
      duree: "30 minutes",
      description:
        "Plusieurs utilisateurs, plusieurs rôles, des données à tenir dans le temps. On dégrossit l’essentiel.",
    },
    {
      id: "decouverte",
      nom: "Dis-moi où tu en es",
      duree: "30 minutes",
      description:
        "Tu vois le problème, pas encore la solution. C’est souvent le meilleur moment pour en parler.",
    },
  ],

  etapes: {
    sujet: "Le sujet",
    creneau: "Le créneau",
    coordonnees: "Tes coordonnées",
  },

  actions: {
    changer: "Changer",
    reessayer: "Réessayer",
    semainePrecedente: "Semaine précédente",
    semaineSuivante: "Semaine suivante",
  },

  creneaux: {
    chargement: "Recherche des créneaux libres…",
    erreur:
      "Les créneaux n’ont pas pu être chargés. Réessaie, ou écris-moi par le formulaire ci-dessus.",
    vide: "Aucun créneau libre sur cette semaine. Essaie la suivante.",
    indisponible:
      "La prise de rendez-vous en ligne est momentanément indisponible. Le formulaire ci-dessus reste le chemin le plus direct.",
    libelleGrille: "Créneaux disponibles",
    libelleJours: "Jour du rendez-vous",
  },

  formulaire: {
    nomLabel: "Ton nom",
    nomPlaceholder: "Prénom et nom",
    emailLabel: "Ton e-mail",
    emailPlaceholder: "toi@exemple.fr",
    messageLabel: "Ta situation en deux lignes (facultatif)",
    messagePlaceholder: "Ce que tu as déjà, ce qui coince, ton échéance.",
    envoyer: "Confirmer le rendez-vous",
    envoiEnCours: "Confirmation en cours…",
    mention:
      "Ton nom et ton adresse sont transmis à Cal.com, qui héberge mon agenda, dans le seul but de créer ce rendez-vous. Détail dans la",
    mentionLien: "politique de confidentialité",
    mentionHref: "/legal/politique-de-confidentialite",
  },

  succes: {
    titre: "C’est réservé.",
    texte:
      "Un e-mail de confirmation vient de partir vers ta boîte, avec le lien de visioconférence et de quoi annuler ou déplacer en un clic. Tu n’as rien d’autre à faire d’ici là.",
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
  outil: "outil",
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
  `/contact?${PARAM_SUJET}=${id}#rendez-vous`;
