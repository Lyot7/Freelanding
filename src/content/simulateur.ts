/**
 * LE SIMULATEUR DE PRIX : ses 4 types de projet, leurs questions, et
 * l'écriture du résultat. Lu par le composant client : ce module n'importe que
 * `offre.ts`, pour que le navigateur ne reçoive pas les pages de contenu.
 * Le contenu de la page elle-même est dans `simulateur-prix.ts`.
 *
 * CALCUL DÉTERMINISTE, AUCUN MODÈLE. Chaque réponse désigne un palier de la
 * grille (`palier`) ; une question sans réponse, ou une réponse incertaine
 * (`palierMax`), élargit la fourchette jusqu'au palier le plus haut qu'elle
 * autorise. Le calcul vit dans `src/lib/simulateur/estimation.ts`.
 *
 * AUCUN MONTANT NE S'ÉCRIT ICI. Les grilles viennent de `offre.ts` : le site
 * vitrine et la solution métier (`prestations`), l'intégration IA
 * (`integrationIA`). L'outil interne n'a pas de grille à lui, décision d'Eliott
 * du 2026-10-05 : il se chiffre sur les paliers de la solution métier, dont
 * L'Outil est le premier.
 */
import { integrationIA, prestation, prixPack, suiviMensuel, type Pack } from "./offre";
import type { IdRendezVous } from "./rendez-vous";

const VITRINE = prestation("vitrine");
const LOGICIEL = prestation("logiciel");

/** Rang d'un forfait dans sa grille : 0 pour le premier, 2 pour le dernier. */
export type Palier = 0 | 1 | 2;

export interface OptionSimulateur {
  /** Identifiant stable, unique dans sa question. */
  readonly id: string;
  readonly libelle: string;
  /** Palier que cette réponse exige au minimum. */
  readonly palier: Palier;
  /**
   * Palier le plus haut que la réponse laisse possible (« je ne sais pas
   * encore »). Absent : la réponse est ferme, `palier` vaut aussi plafond.
   */
  readonly palierMax?: Palier;
  /** Ce que la réponse ajoute hors forfait, chiffré au devis. */
  readonly horsForfait?: string;
}

export interface QuestionSimulateur {
  readonly id: string;
  readonly intitule: string;
  readonly options: readonly OptionSimulateur[];
}

export type IdTypeProjet = "vitrine" | "logiciel" | "outil-interne" | "integration-ia";

export interface TypeProjet {
  readonly id: IdTypeProjet;
  readonly libelle: string;
  /** Une phrase sous le libellé : le besoin, pas la technique. */
  readonly accroche: string;
  /** La grille lue dans `offre.ts`, jamais recopiée. */
  readonly packs: readonly [Pack, Pack, Pack];
  /** Ce qui sort de la grille, tel que `offre.ts` l'écrit. */
  readonly horsPack: string;
  /** Sujet présélectionné de la prise de rendez-vous. */
  readonly rdv: IdRendezVous;
  readonly questions: readonly QuestionSimulateur[];
}

const JE_NE_SAIS_PAS = "Je ne sais pas encore";

export const typesProjet: readonly TypeProjet[] = [
  {
    id: "vitrine",
    libelle: "Site vitrine",
    accroche: "Présenter ton activité et te faire appeler.",
    packs: VITRINE.packs,
    horsPack: VITRINE.horsPack,
    rdv: "site",
    questions: [
      {
        id: "pages",
        intitule: "Combien de pages ?",
        options: [
          { id: "une", libelle: "Une seule page", palier: 0 },
          { id: "plusieurs", libelle: "De 2 à 7 pages", palier: 1 },
          { id: "inconnu", libelle: JE_NE_SAIS_PAS, palier: 0, palierMax: 1 },
        ],
      },
      {
        id: "textes",
        intitule: "Tes textes sont-ils prêts ?",
        options: [
          { id: "prets", libelle: "Oui, je les fournis", palier: 0 },
          { id: "a-ecrire", libelle: "Non, à écrire avec toi", palier: 1 },
        ],
      },
      {
        id: "recherche",
        intitule: "Comment tes clients te trouvent-ils ?",
        options: [
          { id: "nom", libelle: "Par mon nom, ou par recommandation", palier: 0 },
          {
            id: "google",
            libelle: "En cherchant mon métier sur Google",
            palier: 1,
          },
        ],
      },
      {
        id: "mesure",
        intitule: "Veux-tu savoir ce que ton site rapporte ?",
        options: [
          { id: "non", libelle: "Pas pour l’instant", palier: 0 },
          {
            id: "oui",
            libelle: "Oui : d’où viennent les visites, ce qui fait appeler",
            palier: 2,
          },
        ],
      },
      {
        id: "demandes",
        intitule: "Où doivent arriver les demandes ?",
        options: [
          { id: "mail", libelle: "Dans ma boîte mail", palier: 0 },
          { id: "crm", libelle: "Dans mon agenda ou mon CRM", palier: 2 },
          {
            id: "paiement",
            libelle: "Paiement, réservation ou espace client",
            palier: 0,
            horsForfait:
              "Paiement, réservation et espace client sortent du site vitrine : je les chiffre avec La Solution métier.",
          },
        ],
      },
    ],
  },
  {
    id: "logiciel",
    libelle: "Logiciel métier sur mesure",
    accroche: "Sortir ton métier des tableurs partagés.",
    packs: LOGICIEL.packs,
    horsPack: LOGICIEL.horsPack,
    rdv: "logiciel",
    questions: [
      {
        id: "modules",
        intitule: "Combien de pans de ton activité couvrir ? Devis, planning, facturation, stock…",
        options: [
          { id: "un", libelle: "1", palier: 0 },
          { id: "deux-trois", libelle: "2 ou 3", palier: 1 },
          { id: "plus", libelle: "Plus de 3", palier: 2 },
          { id: "inconnu", libelle: JE_NE_SAIS_PAS, palier: 0, palierMax: 2 },
        ],
      },
      {
        id: "raccordements",
        intitule: "Combien d’outils existants relier ? Comptabilité, ERP, site…",
        options: [
          { id: "zero-un", libelle: "Aucun ou 1", palier: 0 },
          { id: "deux", libelle: "2", palier: 1 },
          { id: "plus", libelle: "Plus de 2, ou des échanges dans les 2 sens", palier: 2 },
        ],
      },
      {
        id: "utilisateurs",
        intitule: "Qui s’en sert ?",
        options: [
          { id: "une", libelle: "Une seule personne", palier: 0 },
          {
            id: "plusieurs",
            libelle: "Plusieurs personnes, avec des droits différents",
            palier: 1,
          },
        ],
      },
      {
        id: "historique",
        intitule: "Faut-il reprendre ton historique ?",
        options: [
          { id: "non", libelle: "Non, on part de zéro", palier: 0 },
          { id: "oui", libelle: "Oui, depuis des tableurs ou un ancien logiciel", palier: 1 },
        ],
      },
      {
        id: "depart",
        intitule: "D’où pars-tu ?",
        options: [
          { id: "tableurs", libelle: "Des tableurs, du papier ou des mails", palier: 0 },
          {
            id: "reprise",
            libelle: "Un logiciel en place, à reprendre",
            palier: 0,
            horsForfait:
              "Reprendre un logiciel en place commence par un audit de son code, chiffré à part. Je ne reprends pas de code PHP ni Laravel.",
          },
          {
            id: "societes",
            libelle: "Plusieurs sociétés à servir",
            palier: 0,
            horsForfait:
              "Plusieurs sociétés à servir : je chiffre le cadrage à part.",
          },
        ],
      },
    ],
  },
  {
    id: "outil-interne",
    libelle: "Outil interne",
    accroche: "Supprimer une tâche que tu refais à la main.",
    packs: LOGICIEL.packs,
    horsPack: LOGICIEL.horsPack,
    rdv: "logiciel",
    questions: [
      {
        id: "taches",
        intitule: "Combien de tâches l’outil doit-il remplacer ?",
        options: [
          { id: "une", libelle: "1 tâche répétitive", palier: 0 },
          { id: "deux-trois", libelle: "2 ou 3", palier: 1 },
          { id: "plus", libelle: "Plus de 3", palier: 2 },
          { id: "inconnu", libelle: JE_NE_SAIS_PAS, palier: 0, palierMax: 1 },
        ],
      },
      {
        id: "raccordements",
        intitule: "Doit-il lire ou écrire dans un autre logiciel ?",
        options: [
          { id: "seul", libelle: "Non, il fonctionne seul", palier: 0 },
          { id: "un", libelle: "Oui, dans 1 logiciel", palier: 0 },
          { id: "deux", libelle: "Oui, dans 2 logiciels", palier: 1 },
        ],
      },
      {
        id: "utilisateurs",
        intitule: "Qui s’en sert ?",
        options: [
          { id: "une", libelle: "Une seule personne", palier: 0 },
          {
            id: "plusieurs",
            libelle: "Plusieurs personnes, avec des droits différents",
            palier: 1,
          },
        ],
      },
      {
        id: "donnees",
        intitule: "Faut-il importer des données existantes ?",
        options: [
          { id: "non", libelle: "Non", palier: 0 },
          { id: "oui", libelle: "Oui, un historique à reprendre", palier: 1 },
        ],
      },
    ],
  },
  {
    id: "integration-ia",
    libelle: "Intégration IA",
    accroche: "Confier une tâche à l’IA, dans un outil que tu utilises déjà.",
    packs: integrationIA.packs,
    horsPack: integrationIA.horsPack,
    rdv: "logiciel",
    questions: [
      {
        id: "usages",
        intitule: "Combien de tâches confier à l’IA ? Résumer, classer, rédiger…",
        options: [
          { id: "une", libelle: "1", palier: 0 },
          { id: "deux-trois", libelle: "2 ou 3", palier: 1 },
          { id: "plus", libelle: "Plus de 3", palier: 2 },
          { id: "inconnu", libelle: JE_NE_SAIS_PAS, palier: 0, palierMax: 1 },
        ],
      },
      {
        id: "outils",
        intitule: "Dans combien d’outils travaille-t-elle ?",
        options: [
          { id: "un", libelle: "1 : mon CRM, ma messagerie ou mon tableur", palier: 0 },
          { id: "plusieurs", libelle: "Plusieurs outils qui doivent échanger", palier: 2 },
        ],
      },
      {
        id: "sources",
        intitule: "Où sont les informations qu’elle doit lire ?",
        options: [
          { id: "meme", libelle: "Dans ce même outil", palier: 0 },
          { id: "autre", libelle: "Dans un autre logiciel", palier: 2 },
        ],
      },
      {
        id: "regles",
        intitule: "Doit-elle suivre les règles de ton métier ?",
        options: [
          { id: "non", libelle: "Non, un usage général suffit", palier: 0 },
          { id: "oui", libelle: "Oui : mon vocabulaire, mes cas particuliers", palier: 1 },
        ],
      },
    ],
  },
];

/** Accès par identifiant, sans dépendre de l'ordre de la liste. */
export const typeProjet = (id: IdTypeProjet): TypeProjet => {
  const trouve = typesProjet.find((t) => t.id === id);
  if (!trouve) throw new Error(`Type de projet inconnu : ${id}`);
  return trouve;
};

/**
 * La fourchette d'une estimation, écrite comme `fourchette()` d'`offre.ts` :
 * « et plus » derrière un haut de grille sur mesure, « à partir de » quand le
 * seul palier possible l'est.
 */
export function prixEstime(bas: Pack, haut: Pack): string {
  if (bas === haut) {
    return `${bas.surMesure ? "à partir de " : ""}${prixPack(bas)} HT`;
  }
  return `de ${prixPack(bas)} à ${prixPack(haut)} HT${haut.surMesure ? " et plus" : ""}`;
}

/** Le délai, de la borne basse du premier palier à la borne haute du dernier. */
export function delaiEstime(bas: Pack, haut: Pack): string {
  if (!haut.delai) {
    return bas.delai
      ? `${bas.delai.min} semaine${bas.delai.min > 1 ? "s" : ""} au moins, date exacte au devis`
      : "fixé au devis";
  }
  const min = bas.delai?.min ?? haut.delai.min;
  return `${min} à ${haut.delai.max} semaines`;
}

/** Le forfait, ou les deux bornes quand la fourchette en couvre plusieurs. */
export const forfaitEstime = (bas: Pack, haut: Pack): string =>
  bas === haut ? bas.nom : `${bas.nom} à ${haut.nom}`;

/** Le suivi mensuel facultatif du forfait d'entrée de la fourchette. */
export const suiviEstime = (bas: Pack): string =>
  `à partir de ${suiviMensuel(bas.prix)} HT par mois`;

/** Les libellés du simulateur et de son résultat. */
export const libellesSimulateur = {
  titre: "Estime ton projet",
  legendeType: "Ton projet",
  legendeQuestions: "Quelques questions",
  eyebrowResultat: (type: string): string => `Estimation · ${type}`,
  libellePrix: "Prix indicatif",
  libelleForfait: "Forfait\u00a0:",
  libelleDelai: "Mise en ligne\u00a0:",
  libelleInclus: "Ce qui est inclus",
  libelleHorsForfait: "En plus, sur devis",
  libelleSuivi: "Suivi mensuel, facultatif\u00a0:",
  restantes: (n: number): string =>
    n === 1
      ? "Réponds à la dernière question pour resserrer la fourchette."
      : `Réponds aux ${n} questions restantes pour resserrer la fourchette.`,
  mention:
    "Ce résultat est indicatif : le prix ferme s’écrit au devis, après un premier échange.",
  cta: "Réserver un appel",
  recommencer: "Effacer mes réponses",
  /** Repris de `servicePageLabels.toutLePrecedent`, sans importer `service-pages.ts` côté navigateur. */
  toutLePrecedent: (precedent: string): string => `Tout ce que contient ${precedent}, plus\u00a0:`,
};
