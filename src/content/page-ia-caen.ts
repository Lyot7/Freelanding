/**
 * PAGE LOCALE `/automatisation-ia-caen` : l'automatisation et l'IA pour les
 * PME de Caen et de l'ouest normand.
 *
 * REQUÊTES VISÉES : « consultant ia caen », « automatisation ia caen »,
 * « agent ia caen », intention locale, faible difficulté. Devant (carte du
 * 2026-10-15) : algominem.com, am-webmaster.fr/agent-ia-caen, nexus-core.fr.
 *
 * CE QUI LA REND LÉGITIME, ET RIEN D'AUTRE : Eliott est basé à Caen et
 * intervient dans le Calvados, la Manche et l'Orne (zone de la fiche Google).
 * Aucun client normand pour l'IA : la FAQ le dit. Aucun présentiel.
 *
 * L'ÉLÉMENT PROPRE À LA PAGE : les métiers de l'ouest normand, chacun avec la
 * tâche qui y revient et ce que l'IA en fait. La page générale
 * (`page-automatisation.ts`) chiffre des tâches de bureau ; celle-ci part des
 * métiers du territoire, sans reprendre un seul de ses paragraphes.
 */
import { aPartirDe, integrationIA, prixPlancher } from "./offre";
import { CHEMIN_PAGE_CAEN, CHEMIN_PAGE_LOGICIEL_CAEN } from "./page-caen";
import { CHEMIN_AUTOMATISATION, CHEMIN_IA_CAEN, type PageTheme } from "./page-theme";

export const pageIaCaen: PageTheme = {
  id: "automatisation-ia-caen",
  chemin: CHEMIN_IA_CAEN,
  seo: {
    titre: "Automatisation et IA à Caen · Eliott Bouquerel",
    description: `Automatisation et IA pour les PME de Caen et de Normandie : je choisis la tâche, je code l’outil et je le branche sur vos logiciels, ${aPartirDe(integrationIA, " HT")}.`,
  },
  h1: "Automatisation et IA à Caen",
  resume: `Basé à Caen, j’installe l’IA dans les outils des PME du Calvados, de la Manche et de l’Orne. Je choisis la tâche avec vous, je code l’automatisation et je la branche moi-même sur vos logiciels. Rendez-vous en visio, ${aPartirDe(integrationIA, " HT")} pour un premier usage.`,
  prestation: "logiciel",
  offre: integrationIA,
  zones: {
    villes: ["Caen"],
    departements: ["Calvados", "Manche", "Orne"],
  },
  libelleLien: "automatisation et IA à Caen",
  accroche: "Pour les PME du Calvados, de la Manche et de l’Orne.",
  noteLlms:
    "automatisation et IA pour les PME de Caen et de l’ouest normand, par un développeur basé à Caen",
  blocs: [
    {
      type: "section",
      id: "conseil-et-code",
      titre: "Du conseil jusqu’à l’outil qui tourne",
      paragraphes: [
        "Autour de Caen, beaucoup d’offres d’IA s’arrêtent au conseil ou à la formation : vous savez ce que l’IA pourrait faire, et il reste à trouver qui l’installe. Je mène les deux dans la même mission.",
        "Je travaille depuis Caen, et tous mes rendez-vous se font en visio : un appel pour choisir la tâche, un autre pour vous montrer les résultats sur vos propres documents.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Automatisation et IA pour PME",
            href: CHEMIN_AUTOMATISATION,
            description: "Six tâches de bureau chiffrées, et la méthode pas à pas.",
          },
          {
            libelle: "Logiciel sur mesure à Caen",
            href: CHEMIN_PAGE_LOGICIEL_CAEN,
            description: "Quand la tâche demande un outil entier.",
          },
          {
            libelle: "Création de site internet à Caen",
            href: CHEMIN_PAGE_CAEN,
            description: "Le site qui fait venir les demandes que l’IA triera.",
          },
        ],
      },
      points: [
        {
          titre: "Un seul interlocuteur",
          corps:
            "La personne qui choisit la tâche avec vous est celle qui écrit le code et le surveille ensuite.",
        },
        {
          titre: "Un essai sur vos documents",
          corps:
            "Avant d’installer quoi que ce soit, l’IA tourne sur vos mails, bons ou factures passés, et vous jugez le résultat.",
        },
        {
          titre: "Un coût connu",
          corps:
            "La dépense du modèle est plafonnée par jour dans le code, sur un compte ouvert à votre nom.",
        },
        {
          titre: "Un outil qui vous reste",
          corps:
            "Code et documentation dans votre dépôt : l’automatisation continue de tourner sans moi.",
        },
      ],
    },
    {
      type: "tableau",
      id: "metiers",
      titre: "Des métiers de l’ouest normand, et la tâche que l’IA reprend",
      paragraphes: [
        "Chaque métier du territoire a sa tâche qui revient toutes les semaines, sur des documents qui se ressemblent. C’est là que l’IA rend le plus de temps.",
      ],
      legende: "Métiers de l’ouest normand, tâche répétitive et ce que l’IA en fait",
      colonnes: ["Métier", "La tâche qui revient", "Ce que l’IA en fait"],
      lignes: [
        [
          "Laiteries et fromageries du Pays d’Auge et du Bessin",
          "Les bons de réception et fiches de lot, ressaisis pour la traçabilité",
          "Les champs lus sur le document et rangés dans le registre de lots, à valider",
        ],
        [
          "Négoce de matériaux et d’agrofournitures",
          "Les commandes reçues par mail, en PDF ou en photo",
          "Les lignes extraites, l’article retrouvé dans votre catalogue, la commande prête à saisir",
        ],
        [
          "Chantiers navals et entretien de bateaux, de Cherbourg à Granville",
          "Les demandes d’hivernage et d’entretien qui arrivent toutes à l’automne",
          "Chaque demande triée par type de travaux, avec un créneau proposé dans le planning",
        ],
        [
          "Entreprises du bâtiment du Calvados",
          "Les comptes rendus de chantier dictés dans la voiture",
          "Un compte rendu propre et la liste des réserves, envoyés au client après relecture",
        ],
        [
          "Cabinets comptables et de conseil caennais",
          "Les pièces envoyées en vrac par les clients",
          "Chaque pièce classée par client, par mois et par nature",
        ],
        [
          "Transporteurs autour du port de Caen-Ouistreham",
          "Les preuves de livraison à rapprocher des factures",
          "Les écarts seuls signalés, le reste rapproché",
        ],
      ],
    },
  ],
  titreOffre: "Prix d’une automatisation IA à Caen",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["L’IA à Caen", "et en Normandie."],
    items: [
      {
        question: "Combien coûte une automatisation IA pour une PME caennaise ?",
        answer: `Un premier usage démarre à ${prixPlancher(integrationIA)} HT, branché sur un outil que vous utilisez déjà. Le prix suit le nombre d’usages et d’outils à relier, et se fixe au devis. Être à Caen ne change pas le calcul.`,
      },
      {
        question: "Vous déplacez-vous dans nos locaux ?",
        answer:
          "Tous mes rendez-vous se font en visio, du premier appel à la mise en service. L’automatisation se branche sur vos outils à distance, avec des accès que vous ouvrez et fermez vous-même.",
      },
      {
        question: "Avez-vous des clients à Caen pour l’IA ?",
        answer:
          "Pas encore. Je l’utilise pour ma propre activité : chaque mail que je reçois est classé, rattaché au bon dossier et sa réponse préparée par un modèle de langage, sous ma relecture.",
      },
      {
        question: "Consultant IA ou développeur ?",
        answer:
          "Développeur, qui fait aussi le travail du consultant : choisir la tâche, mesurer le temps qu’elle rendra, puis écrire et maintenir le code qui l’automatise.",
      },
    ],
  },
};
