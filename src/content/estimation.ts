import type { OutilsActuels, TailleEquipe, TypeProjet, Urgence } from "@/lib/chiffrage/grille";
import type { ChampEstimation } from "@/lib/chiffrage/validation";

/**
 * Textes de l'outil de chiffrage (`/estimation`).
 *
 * Le ton est celui d'Eliott qui pose ses questions lui-même : vouvoiement,
 * phrases courtes, aucun prix journalier ni nombre de jours. La fourchette se
 * présente toujours comme indicative, le prix ferme vient au devis.
 */

export const CHEMIN_ESTIMATION = "/estimation";

export interface OptionChoix<T extends string> {
  readonly valeur: T;
  readonly libelle: string;
}

export interface QuestionChoix<T extends string> {
  readonly cle: "type" | "equipe" | "outils" | "urgence";
  readonly question: string;
  readonly options: readonly OptionChoix<T>[];
}

const type: QuestionChoix<TypeProjet> = {
  cle: "type",
  question: "Bonjour, je suis Eliott. Quel projet avez-vous en tête ?",
  options: [
    { valeur: "logiciel", libelle: "Un logiciel pour mon entreprise" },
    { valeur: "site", libelle: "Un site internet" },
    { valeur: "ia", libelle: "De l’IA dans mon quotidien de travail" },
    { valeur: "autre", libelle: "Autre chose" },
  ],
};

const equipe: QuestionChoix<TailleEquipe> = {
  cle: "equipe",
  question: "Combien de personnes travaillent dans l’entreprise ?",
  options: [
    { valeur: "1-5", libelle: "1 à 5" },
    { valeur: "6-20", libelle: "6 à 20" },
    { valeur: "21-50", libelle: "21 à 50" },
    { valeur: "50+", libelle: "Plus de 50" },
  ],
};

const outils: QuestionChoix<OutilsActuels> = {
  cle: "outils",
  question: "Aujourd’hui, vous travaillez avec quoi ?",
  options: [
    { valeur: "papier", libelle: "Du papier et des tableaux Excel" },
    { valeur: "logiciel", libelle: "Un logiciel du marché" },
    { valeur: "plusieurs", libelle: "Plusieurs outils qui ne se parlent pas" },
    { valeur: "rien", libelle: "Rien encore" },
  ],
};

const urgence: QuestionChoix<Urgence> = {
  cle: "urgence",
  question: "Pour quand en avez-vous besoin ?",
  options: [
    { valeur: "urgent", libelle: "Dans le mois" },
    { valeur: "trimestre", libelle: "Dans les trois mois" },
    { valeur: "libre", libelle: "Pas de date fixée" },
  ],
};

const MESSAGES_CHAMP: Readonly<Record<ChampEstimation, string>> = {
  type: "Choisissez le type de projet.",
  equipe: "Choisissez la taille de l’équipe.",
  outils: "Choisissez vos outils actuels.",
  urgence: "Choisissez une échéance.",
  description: "Décrivez votre projet en quelques phrases (20 caractères au moins).",
  prenom: "Indiquez votre prénom.",
  nom: "Indiquez votre nom.",
  societe: "Indiquez le nom de votre société.",
  email: "Cette adresse e-mail ne semble pas valide.",
  telephone: "Ce numéro de téléphone ne semble pas valide.",
  consentement: "Rechargez la page et réessayez.",
};

export const estimationContent = {
  seo: {
    title: "Estimer le prix de votre projet · Eliott Bouquerel",
    description:
      "Logiciel métier, site internet ou IA : répondez à quatre questions, décrivez votre projet et recevez une fourchette de prix indicative, en achat ou en abonnement.",
  },
  eyebrow: "Estimation",
  titre: "Une fourchette de prix en deux minutes",
  chapeau:
    "Quatre questions, quelques lignes sur votre projet, vos coordonnées, et votre fourchette s’affiche aussitôt.",
  auteur: {
    nom: "Eliott Bouquerel",
    avatar: "/images/eliott-bouquerel-avatar.jpg",
  },
  questions: { type, equipe, outils, urgence },
  modifier: "Modifier",
  description: {
    question:
      "Décrivez ce que vous voulez créer : le problème à régler, la tâche à automatiser, ce qui vous fait perdre du temps.",
    libelle: "Votre projet",
    exemple:
      "Exemple : nos devis se font sur Excel et se perdent dans les mails. Je voudrais un outil où l’équipe crée le devis, le client le signe en ligne et la facture part toute seule.",
    compteur: (n: number, max: number) => `${n.toLocaleString("fr-FR")} / ${max.toLocaleString("fr-FR")}`,
    valider: "Continuer",
    minimum: "20 caractères au moins",
  },
  contact: {
    question: "Dernière étape : à qui j’envoie le détail de l’estimation ?",
    champs: {
      prenom: "Prénom",
      nom: "Nom",
      societe: "Société",
      email: "E-mail",
      telephone: "Téléphone",
    },
    consentement:
      "En envoyant, vous acceptez que je vous recontacte au sujet de ce projet. Votre description sert au calcul automatique de l’estimation.",
    preuve: "Déjà livré : la création de compte B2B de Würth France, 92 % d’erreurs en moins au support.",
    lienPreuve: "Voir la réalisation",
    cheminPreuve: "/realisations/wurth-creation-de-compte",
    lienConfidentialite: "Politique de confidentialité",
    cheminConfidentialite: "/legal/politique-de-confidentialite",
    valider: "Voir mon estimation",
    envoi: "Calcul en cours",
    obligatoires: "Tous les champs sont obligatoires.",
  },
  resultat: {
    intro: (prenom: string) => `Voici votre estimation, ${prenom}.`,
    avertissement: "Estimation indicative. Le prix ferme se donne au devis, après un rendez-vous.",
    achat: {
      titre: "Achat direct",
      sousTitre: "Vous payez le projet, il est à vous.",
      maintenance: "Puis maintenance et hébergement",
      parMois: "HT par mois",
    },
    abonnement: {
      titre: "Abonnement",
      sousTitre: "Une part à la commande, le reste chaque mois, suivi compris.",
      engagement: (mois: number) => `${mois} mois`,
      choixDuree: "Durée d’engagement",
      miseEnRoute: "À la commande, mise en route",
      mensualite: (mois: number) => `Puis chaque mois, pendant ${mois} mois`,
      apres: (mois: number) => `Après ${mois} mois, le projet est à vous : il ne reste que le suivi`,
      parMois: "HT par mois",
    },
    ht: "HT",
    a: "à",
    de: "de",
    des: "dès",
    aPartirDe: "À partir de",
    grandProjet: "Pour un projet de cette taille, le haut de la fourchette se fixe en rendez-vous.",
    sourceBoutons: "Un rendez-vous de 30 minutes resserre la fourchette.",
    rendezVous: "En parler en rendez-vous",
    rendezVousNote: "30 minutes en visio.",
    recommencer: "Refaire une estimation",
  },
  erreurs: {
    generique: "L’estimation n’a pas pu être calculée. Rechargez la page et réessayez.",
    debit:
      "Vous avez déjà fait plusieurs estimations aujourd’hui. Réessayez demain, ou prenez directement rendez-vous.",
    reseau: "La connexion a échoué. Vérifiez votre réseau et réessayez.",
    champ: MESSAGES_CHAMP,
  },
} as const;

/** Lien de rendez-vous propre au type de projet (`/rdv?sujet=…`). */
export function lienRendezVous(typeProjet: TypeProjet): string {
  return `/rdv?sujet=${typeProjet}`;
}
