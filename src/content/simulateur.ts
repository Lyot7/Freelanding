/**
 * LE SIMULATEUR DE PRIX : ses 4 types de projet, leurs questions, et
 * l'écriture du résultat. Lu par le composant client : ce module n'importe que
 * `offre.ts`, pour que le navigateur ne reçoive pas les pages de contenu.
 * Le contenu de la page elle-même est dans `simulateur-prix.ts`.
 *
 * UN OUTIL DE CADRAGE DEPUIS LE 2026-10-05, décision d'Eliott : les paliers
 * sont partis, et avec eux la fourchette, le délai et le nom de forfait du
 * résultat. Il affiche le plancher du type de projet, « prix au devis », et ce
 * qui fera monter le prix selon les réponses : chaque option peut porter un
 * `facteur`. Le calcul vit dans `src/lib/simulateur/estimation.ts`, sans
 * modèle.
 *
 * AUCUN MONTANT NE S'ÉCRIT ICI. Les offres viennent de `offre.ts` : le site
 * vitrine et la solution métier (`prestations`), l'intégration IA
 * (`integrationIA`). L'outil interne n'a pas d'offre à lui, décision d'Eliott
 * du 2026-10-05 : il se chiffre comme la solution métier.
 */
import { integrationIA, prestation, prixPlancher, suiviMensuel, type Offre } from "./offre";
import type { IdRendezVous } from "./rendez-vous";

const VITRINE = prestation("vitrine");
const LOGICIEL = prestation("logiciel");

export interface OptionSimulateur {
  /** Identifiant stable, unique dans sa question. */
  readonly id: string;
  readonly libelle: string;
  /** Ce que la réponse fait monter au-dessus du plancher. Chiffré au devis. */
  readonly facteur?: string;
  /** Ce que la réponse ajoute hors de l'offre, chiffré à part. */
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
  /** L'offre lue dans `offre.ts`, jamais recopiée. */
  readonly offre: Offre;
  /** Sujet présélectionné de la prise de rendez-vous. */
  readonly rdv: IdRendezVous;
  readonly questions: readonly QuestionSimulateur[];
}

const JE_NE_SAIS_PAS = "Je ne sais pas encore";

/** Un compte par personne : la même ligne pour le logiciel et l'outil interne. */
const COMPTES = "Un compte par personne, et des droits différenciés par rôle";
const HISTORIQUE = "La reprise de ton historique";

export const typesProjet: readonly TypeProjet[] = [
  {
    id: "vitrine",
    libelle: "Site vitrine",
    accroche: "Présenter ton activité et te faire appeler.",
    offre: VITRINE,
    rdv: "site",
    questions: [
      {
        id: "pages",
        intitule: "Combien de pages ?",
        options: [
          { id: "une", libelle: "Une seule page" },
          {
            id: "plusieurs",
            libelle: "De 2 à 7 pages",
            facteur: "Plusieurs pages à écrire et à développer",
          },
          {
            id: "inconnu",
            libelle: JE_NE_SAIS_PAS,
            facteur: "Le nombre de pages, à arrêter ensemble",
          },
        ],
      },
      {
        id: "recherche",
        intitule: "Comment tes clients te trouvent-ils ?",
        options: [
          { id: "nom", libelle: "Par mon nom, ou par recommandation" },
          {
            id: "google",
            libelle: "En cherchant mon métier sur Google",
            facteur:
              "Une page par métier ou par ville, avec balisage et données structurées",
          },
        ],
      },
      {
        id: "mesure",
        intitule: "Veux-tu savoir ce que ton site rapporte ?",
        options: [
          { id: "non", libelle: "Pas pour l’instant" },
          {
            id: "oui",
            libelle: "Oui : d’où viennent les visites, ce qui fait appeler",
            facteur:
              "La mesure installée, et une passe de correction sur ce que les chiffres montrent",
          },
        ],
      },
      {
        id: "demandes",
        intitule: "Où doivent arriver les demandes ?",
        options: [
          { id: "mail", libelle: "Dans ma boîte mail" },
          {
            id: "crm",
            libelle: "Dans mon agenda ou mon CRM",
            facteur: "Tes formulaires branchés sur ton agenda ou ton CRM",
          },
          {
            id: "paiement",
            libelle: "Paiement, réservation ou espace client",
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
    offre: LOGICIEL,
    rdv: "logiciel",
    questions: [
      {
        id: "modules",
        intitule: "Combien de pans de ton activité couvrir ? Devis, planning, facturation, stock…",
        options: [
          { id: "un", libelle: "1" },
          { id: "deux-trois", libelle: "2 ou 3", facteur: "2 ou 3 modules" },
          { id: "plus", libelle: "Plus de 3", facteur: "Plus de 3 modules" },
          {
            id: "inconnu",
            libelle: JE_NE_SAIS_PAS,
            facteur: "Le nombre de modules, à arrêter ensemble",
          },
        ],
      },
      {
        id: "raccordements",
        intitule: "Combien d’outils existants relier ? Comptabilité, ERP, site…",
        options: [
          { id: "zero-un", libelle: "Aucun ou 1" },
          { id: "deux", libelle: "2", facteur: "2 outils à relier" },
          {
            id: "plus",
            libelle: "Plus de 2, ou des échanges dans les 2 sens",
            facteur: "Plusieurs outils à relier, ou des échanges dans les 2 sens",
          },
        ],
      },
      {
        id: "utilisateurs",
        intitule: "Qui s’en sert ?",
        options: [
          { id: "une", libelle: "Une seule personne" },
          {
            id: "plusieurs",
            libelle: "Plusieurs personnes, avec des droits différents",
            facteur: COMPTES,
          },
        ],
      },
      {
        id: "historique",
        intitule: "Faut-il reprendre ton historique ?",
        options: [
          { id: "non", libelle: "Non, on part de zéro" },
          {
            id: "oui",
            libelle: "Oui, depuis des tableurs ou un ancien logiciel",
            facteur: HISTORIQUE,
          },
        ],
      },
      {
        id: "depart",
        intitule: "D’où pars-tu ?",
        options: [
          { id: "tableurs", libelle: "Des tableurs, du papier ou des mails" },
          {
            id: "reprise",
            libelle: "Un logiciel en place, à reprendre",
            horsForfait:
              "Reprendre un logiciel en place commence par un audit de son code, chiffré à part. Je ne reprends pas de code PHP ni Laravel.",
          },
          {
            id: "societes",
            libelle: "Plusieurs sociétés à servir",
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
    offre: LOGICIEL,
    rdv: "logiciel",
    questions: [
      {
        id: "taches",
        intitule: "Combien de tâches l’outil doit-il remplacer ?",
        options: [
          { id: "une", libelle: "1 tâche répétitive" },
          { id: "deux-trois", libelle: "2 ou 3", facteur: "2 ou 3 tâches à remplacer" },
          { id: "plus", libelle: "Plus de 3", facteur: "Plus de 3 tâches à remplacer" },
          {
            id: "inconnu",
            libelle: JE_NE_SAIS_PAS,
            facteur: "Le nombre de tâches, à arrêter ensemble",
          },
        ],
      },
      {
        id: "raccordements",
        intitule: "Doit-il lire ou écrire dans un autre logiciel ?",
        options: [
          { id: "seul", libelle: "Non, il fonctionne seul" },
          { id: "un", libelle: "Oui, dans 1 logiciel" },
          { id: "deux", libelle: "Oui, dans 2 logiciels", facteur: "2 logiciels à relier" },
        ],
      },
      {
        id: "utilisateurs",
        intitule: "Qui s’en sert ?",
        options: [
          { id: "une", libelle: "Une seule personne" },
          {
            id: "plusieurs",
            libelle: "Plusieurs personnes, avec des droits différents",
            facteur: COMPTES,
          },
        ],
      },
      {
        id: "donnees",
        intitule: "Faut-il importer des données existantes ?",
        options: [
          { id: "non", libelle: "Non" },
          { id: "oui", libelle: "Oui, un historique à reprendre", facteur: HISTORIQUE },
        ],
      },
    ],
  },
  {
    id: "integration-ia",
    libelle: "Intégration IA",
    accroche: "Confier une tâche à l’IA, dans un outil que tu utilises déjà.",
    offre: integrationIA,
    rdv: "logiciel",
    questions: [
      {
        id: "usages",
        intitule: "Combien de tâches confier à l’IA ? Résumer, classer, rédiger…",
        options: [
          { id: "une", libelle: "1" },
          { id: "deux-trois", libelle: "2 ou 3", facteur: "2 ou 3 usages confiés à l’IA" },
          { id: "plus", libelle: "Plus de 3", facteur: "Plus de 3 usages confiés à l’IA" },
          {
            id: "inconnu",
            libelle: JE_NE_SAIS_PAS,
            facteur: "Le nombre d’usages, à arrêter ensemble",
          },
        ],
      },
      {
        id: "outils",
        intitule: "Dans combien d’outils travaille-t-elle ?",
        options: [
          { id: "un", libelle: "1 : mon CRM, ma messagerie ou mon tableur" },
          {
            id: "plusieurs",
            libelle: "Plusieurs outils qui doivent échanger",
            facteur: "Plusieurs outils reliés entre eux",
          },
        ],
      },
      {
        id: "sources",
        intitule: "Où sont les informations qu’elle doit lire ?",
        options: [
          { id: "meme", libelle: "Dans ce même outil" },
          {
            id: "autre",
            libelle: "Dans un autre logiciel",
            facteur: "Des informations à lire dans un autre logiciel",
          },
        ],
      },
      {
        id: "regles",
        intitule: "Doit-elle suivre les règles de ton métier ?",
        options: [
          { id: "non", libelle: "Non, un usage général suffit" },
          {
            id: "oui",
            libelle: "Oui : mon vocabulaire, mes cas particuliers",
            facteur: "Les règles et le vocabulaire de ton métier appliqués",
          },
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

/** Le plancher, tel que le résultat l'affiche : « 3 000 € HT ». */
export const plancherEstime = (offre: Offre): string => `${prixPlancher(offre)} HT`;

/** Le suivi mensuel facultatif, à partir du plancher de l'offre. */
export const suiviEstime = (offre: Offre): string =>
  `à partir de ${suiviMensuel(offre.plancher)} HT par mois`;

/** Les libellés du simulateur et de son résultat. */
export const libellesSimulateur = {
  titre: "Estime ton projet",
  legendeType: "Ton projet",
  legendeQuestions: "Quelques questions",
  eyebrowResultat: (type: string): string => `Cadrage · ${type}`,
  libellePrix: "À partir de",
  prixAuDevis: "Prix au devis",
  libelleFacteurs: "Ce qui fera monter le prix",
  aucunFacteur: "Rien dans tes réponses pour l’instant : le premier échange le confirmera.",
  libelleInclus: "Compris dès le plancher",
  libelleHorsForfait: "En plus, sur devis",
  libelleSuivi: "Suivi mensuel, facultatif :",
  restantes: (n: number): string =>
    n === 1
      ? "Réponds à la dernière question pour compléter ton cadrage."
      : `Réponds aux ${n} questions restantes pour compléter ton cadrage.`,
  mention:
    "Ce cadrage est indicatif : le prix ferme s’écrit au devis, après un premier échange.",
  cta: "Réserver un appel",
  recommencer: "Effacer mes réponses",
};
