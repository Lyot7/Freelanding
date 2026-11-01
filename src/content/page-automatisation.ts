/**
 * PAGE `/services/automatisation` : l'automatisation et l'IA pour les PME.
 *
 * REQUÊTES VISÉES : « automatisation processus pme » (+ automatisation
 * entreprise) et « automatisation ia pme » (+ solution ia pme), intention
 * commerciale. Devant : salesforce.com, francenum.gouv.fr, visiativ.com,
 * algos-ai.com, bpifrance.fr. Des guides et des éditeurs : aucun ne chiffre
 * une tâche avant et après, aucun n'est un développeur qui l'installe.
 *
 * DEMANDE D'ELIOTT DU 2026-10-15 : la carte SEO relève que le site n'a aucune
 * page pour son discours (temps repris, process, trésorerie, IA). L'offre
 * est le logiciel métier depuis le 2026-10-31 : l'automatisation n'est plus une
 * offre à part, c'est ce que le logiciel fait.
 *
 * L'ÉLÉMENT PROPRE À LA PAGE : six tâches chiffrées avant et après, total
 * calculé depuis les hypothèses ; et l'outil qu'Eliott utilise lui-même pour
 * son activité, décrit tel qu'il tourne.
 */
import { aPartirDe, euros, prestation, prixPlancher } from "./offre";
import { CHEMIN_AUTOMATISATION, nombre, type PageTheme } from "./page-theme";

const LOGICIEL = prestation("logiciel");

/*
 * HYPOTHÈSES DU CALCUL : minutes par semaine pour une PME d'une dizaine de
 * personnes au bureau, 45 semaines travaillées, 40 € l'heure chargée.
 */
export const TACHES_BUREAU = [
  {
    tache: "Trier les mails entrants",
    avant: "Une personne lit tout le matin et transfère",
    apres: "Chaque mail classé à l’arrivée, envoyé à la bonne personne, réponse en brouillon",
    minutes: 150,
  },
  {
    tache: "Saisir les commandes reçues en PDF",
    avant: "Recopiées ligne à ligne dans votre logiciel",
    apres: "Lignes extraites et proposées à la validation",
    minutes: 180,
  },
  {
    tache: "Relancer les factures échues",
    avant: "Quand quelqu’un y pense",
    apres: "Relance partie à l’échéance, facture jointe, ton adapté au client",
    minutes: 60,
  },
  {
    tache: "Rédiger les comptes rendus",
    avant: "Notes éparses, recopiées le soir",
    apres: "Compte rendu et tâches tirés de la note vocale",
    minutes: 90,
  },
  {
    tache: "Répondre aux demandes de devis simples",
    avant: "Le même chiffrage retapé à chaque demande",
    apres: "Premier chiffrage tiré de votre grille, à relire",
    minutes: 120,
  },
  {
    tache: "Rapprocher la banque et les factures",
    avant: "À la main, en fin de mois",
    apres: "Seuls les écarts vous sont signalés",
    minutes: 60,
  },
] as const;
const SEMAINES = 45;
const COUT_HORAIRE = 40;
const MINUTES_SEMAINE = TACHES_BUREAU.reduce((total, t) => total + t.minutes, 0);
const HEURES_AN = (MINUTES_SEMAINE * SEMAINES) / 60;
const COUT_AN = HEURES_AN * COUT_HORAIRE;

/** « 2 h 30 », « 1 h », espaces insécables. */
const duree = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
};

/** Exposé pour le test, qui vérifie que le texte suit les hypothèses. */
export const calculAutomatisation = {
  minutesSemaine: MINUTES_SEMAINE,
  heuresAn: HEURES_AN,
  coutAn: COUT_AN,
} as const;

export const pageAutomatisation: PageTheme = {
  id: "automatisation",
  chemin: CHEMIN_AUTOMATISATION,
  seo: {
    titre: "Automatisation et IA pour PME · Eliott Bouquerel",
    description: `Automatisation et IA pour votre PME : mails triés, commandes saisies, factures relancées, sur vos outils. Vous reprenez des heures, ${aPartirDe(LOGICIEL, " HT")}.`,
  },
  h1: "Automatisation et IA pour PME",
  resume: `J’installe l’IA dans les outils que vous utilisez déjà, sur les tâches que votre équipe refait chaque semaine : trier les mails, saisir les commandes, relancer les factures. Vous reprenez des heures pour le travail qui demande quelqu’un. Comptez ${aPartirDe(LOGICIEL, " HT")} pour un premier usage.`,
  prestation: "logiciel",
  offre: LOGICIEL,
  filAriane: [
    { libelle: "Accueil", href: "/" },
    { libelle: "Prestations", href: "/#services" },
    { libelle: "Automatisation et IA" },
  ],
  libelleLien: "automatisation et IA",
  accroche: "Mails triés, commandes saisies, factures relancées sans y penser.",
  noteLlms:
    "automatisation et intégration de l’IA dans les outils d’une PME : tri des mails, saisie des commandes, relances de factures, comptes rendus",
  blocs: [
    {
      type: "tableau",
      id: "taches",
      titre: "Six tâches que l’IA rend à votre équipe",
      paragraphes: [
        "Une tâche se prête à l’automatisation quand elle revient chaque semaine, suit toujours le même chemin, et qu’on peut juger le résultat d’un coup d’œil. Voici celles que je rencontre le plus dans les PME.",
      ],
      legende: "Six tâches répétitives, avant et après automatisation, avec le temps rendu par semaine",
      colonnes: ["Tâche", "Aujourd’hui", "Avec l’automatisation", "Temps rendu par semaine"],
      lignes: TACHES_BUREAU.map((t) => [t.tache, t.avant, t.apres, duree(t.minutes)]),
      total: ["Total", "", "", duree(MINUTES_SEMAINE)],
      note: `Hypothèses : une PME d’une dizaine de personnes au bureau, ${SEMAINES} semaines travaillées, ${euros(COUT_HORAIRE)} l’heure chargée. Sur une année, ${nombre(HEURES_AN)} heures, soit ${euros(COUT_AN)}. Remplacez ces minutes par les vôtres : une seule de ces tâches suffit souvent à payer le projet.`,
    },
    {
      type: "section",
      id: "chez-moi",
      titre: "Je m’en sers d’abord pour mon activité",
      paragraphes: [
        "Chaque mail qui arrive dans mes boîtes est classé par un modèle de langage, rattaché à la bonne fiche client, et sa réponse est rédigée en brouillon. Les noms et les coordonnées sont masqués avant l’envoi au modèle. Rien ne part sans que je l’aie relu.",
        "C’est le même montage que j’installe chez vous : un modèle choisi pour la tâche, branché sur vos outils, avec un plafond de dépense et un journal de tout ce qu’il fait.",
      ],
      points: [
        {
          titre: "Un plafond de dépense",
          corps:
            "Le coût du modèle est borné par jour et par tâche dans le code. Une erreur de boucle ne peut pas vider votre budget.",
        },
        {
          titre: "Vos données protégées",
          corps:
            "Ce qui identifie une personne est masqué avant de sortir de vos outils, et l’abonnement au modèle est ouvert à votre nom.",
        },
        {
          titre: "Un journal lisible",
          corps:
            "Chaque décision de l’IA est enregistrée : quel mail, quel classement, quelle réponse proposée.",
        },
        {
          titre: "Une relecture là où elle compte",
          corps:
            "Vous décidez de ce qui part seul et de ce qui attend votre validation.",
        },
      ],
    },
    {
      type: "etapes",
      id: "methode",
      titre: "De la tâche choisie à l’outil qui tourne",
      paragraphes: [
        "Le premier usage se choisit sur un critère : le temps qu’il rend. Le reste attend qu’il ait fait ses preuves.",
      ],
      etapes: [
        {
          titre: "Choisir la tâche",
          corps:
            "Je regarde avec vous où partent vos heures, et je chiffre ce qu’une automatisation rendrait.",
        },
        {
          titre: "La tester sur vos vrais cas",
          corps:
            "Je fais tourner l’IA sur une centaine de vos mails, commandes ou factures passés, et je compare le résultat avec ce qu’a fait votre équipe.",
        },
        {
          titre: "La brancher sur vos outils",
          corps:
            "Messagerie, logiciel de gestion, tableur partagé : l’automatisation lit et écrit là où vous travaillez déjà.",
        },
        {
          titre: "La surveiller",
          corps:
            "Les premières semaines, chaque résultat passe par une validation. Quand le taux d’erreur est connu, vous décidez de ce qui part seul.",
        },
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Automatisation et IA à Caen",
            href: "/automatisation-ia-caen",
            description: "Les cas des entreprises de l’ouest normand.",
          },
          {
            libelle: "Remplacer Excel par un logiciel",
            href: "/blog/remplacer-excel-par-un-logiciel",
            description: "Quand le tableur partagé devient lui-même la tâche répétitive.",
          },
          {
            libelle: "Le logiciel métier",
            href: "/services/logiciel-metier",
            description: "Quand l’automatisation demande un outil entier.",
          },
        ],
      },
    },
  ],
  titreOffre: "Prix d’une automatisation IA : le premier usage",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["L’IA dans", "votre PME."],
    items: [
      {
        question: "Combien coûte une automatisation avec l’IA ?",
        answer: `Un premier usage branché sur un outil que vous utilisez déjà démarre à ${prixPlancher(LOGICIEL)} HT. Le prix monte avec le nombre d’usages, les règles de votre métier à appliquer et le nombre d’outils à relier. L’abonnement au modèle d’IA est à votre nom, payé directement à son éditeur.`,
      },
      {
        question: "Faut-il changer nos logiciels ?",
        answer:
          "Non. L’automatisation se branche sur votre messagerie, votre logiciel de gestion ou vos tableurs. Quand il manque un outil entier, je le chiffre à part avec le logiciel métier.",
      },
      {
        question: "L’IA peut-elle se tromper ?",
        answer:
          "Oui, et c’est prévu. Elle propose, votre équipe valide, tant que son taux d’erreur sur vos cas réels n’est pas connu. Les calculs exacts, comme un total de facture, restent faits par le code.",
      },
      {
        question: "Où vont nos données ?",
        answer:
          "Elles restent dans vos outils. Seul le texte utile à la tâche part vers le modèle, après masquage de ce qui identifie une personne, sur un compte ouvert à votre nom.",
      },
    ],
  },
};
