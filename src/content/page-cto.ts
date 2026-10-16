/**
 * PAGE `/services/cto-referent-ia` : le CTO et référent IA à temps partagé.
 *
 * REQUÊTES VISÉES : « CTO externalisé », « CTO à temps partagé » (+ CTO
 * freelance, CTO fractionnel) et « référent IA », intention commerciale. Le
 * titre porte la première, le H1 la deuxième, le chapô et la FAQ la troisième.
 *
 * DEMANDE D'ELIOTT DU 2026-10-16 : « CTO externalisé/fractionnel, et pas que
 * CTO mais aussi référent IA ». L'offre est `ctoReferentIA` d'`offre.ts`,
 * mensuelle, hors de `prestations` comme l'intégration IA.
 *
 * L'ÉLÉMENT PROPRE À LA PAGE : les décisions qu'une PME prend chaque année,
 * avec et sans quelqu'un qui code pour les prendre.
 *
 * AUCUN PRIX AU JOUR. Les jours disent le temps réservé chaque mois, le prix
 * est mensuel (`offre.test.mjs` refuse le vocabulaire du taux journalier).
 */
import { aPartirDe, CTO_QUATRE_JOURS, ctoReferentIA, euros, prixAffiche } from "./offre";
import { CHEMIN_AUTOMATISATION, CHEMIN_CTO, type PageTheme } from "./page-theme";
import { CHEMIN_PRIX_LOGICIEL } from "./pages-secteur";
import { RDV_HORS_PRESTATION } from "./rendez-vous";

export const pageCto: PageTheme = {
  id: "cto-referent-ia",
  chemin: CHEMIN_CTO,
  seo: {
    titre: "CTO externalisé et référent IA pour PME · Eliott Bouquerel",
    description: `CTO externalisé à temps partagé pour PME : décisions techniques, devis relus avant de signer, l’IA là où elle rend des heures, ${aPartirDe(ctoReferentIA, " HT")}.`,
  },
  h1: "CTO à temps partagé et référent IA",
  resume: `Votre PME n’a pas de directeur technique, et chaque choix de logiciel, de prestataire ou d’outil d’IA engage votre budget. Je tiens ce rôle à temps partagé, avec deux jours de travail chaque mois, ${aPartirDe(ctoReferentIA, " HT")}.`,
  prestation: "logiciel",
  rendezVous: RDV_HORS_PRESTATION.cto,
  offre: ctoReferentIA,
  reassurance:
    "Trois mois d’engagement pour poser les bases, puis vous arrêtez quand vous voulez, avec un mois de préavis.",
  filAriane: [
    { libelle: "Accueil", href: "/" },
    { libelle: "Prestations", href: "/#services" },
    { libelle: "CTO et référent IA" },
  ],
  libelleLien: "CTO et référent IA à temps partagé",
  accroche: "Vos décisions techniques et vos choix d’IA, pris avec quelqu’un qui code.",
  noteLlms:
    "CTO externalisé et référent IA à temps partagé pour PME : comité mensuel en visio, revue de l’architecture et des devis, feuille de route technique et IA, choix et mise en place des outils d’IA",
  blocs: [
    {
      type: "section",
      id: "pour-qui",
      titre: "Pour les PME qui n’ont personne pour trancher",
      paragraphes: [
        "Une PME de vingt ou cinquante personnes ne paie pas un directeur technique à plein temps. Elle prend pourtant des décisions techniques tous les mois : changer de logiciel, faire développer un outil, relancer un prestataire, essayer l’IA.",
        "Le dirigeant tranche alors seul, sur la foi d’un devis qu’il ne peut pas relire. Je prends cette place quelques jours chaque mois. Je code moi-même : je sais lire un devis de développement et mesurer ce qu’un outil d’IA fait sur vos vrais cas.",
      ],
      points: [
        {
          titre: "Le dirigeant sans équipe technique",
          corps:
            "Vous choisissez les outils de l’entreprise, et personne en interne ne peut vous dire si un choix tient la route.",
        },
        {
          titre: "Le dirigeant qui veut adopter l’IA",
          corps:
            "Vous voulez savoir où l’IA vous ferait gagner du temps, sans payer des essais qui ne mènent nulle part.",
        },
        {
          titre: "L’entreprise qui dépend d’un prestataire",
          corps:
            "Votre logiciel est entre les mains d’une agence ou d’un indépendant, et vous voulez quelqu’un de votre côté pour suivre son travail.",
        },
        {
          titre: "L’équipe qui grandit",
          corps:
            "Vous allez recruter votre premier développeur, et vous voulez savoir évaluer ce qu’il sait faire.",
        },
      ],
    },
    {
      type: "tableau",
      id: "decisions",
      titre: "Ce que ça change, décision par décision",
      paragraphes: [
        "Les décisions techniques d’une PME reviennent d’une année à l’autre. Voici comment elles se prennent sans référent technique, et avec quelqu’un qui code à vos côtés.",
      ],
      legende:
        "Cinq décisions techniques d’une PME, prises sans référent technique puis avec un CTO à temps partagé",
      colonnes: ["Décision", "Sans référent technique", "Avec un CTO à temps partagé"],
      lignes: [
        [
          "Signer un devis de développement",
          "Le prix se compare, le contenu se devine",
          "Le devis est relu avant la signature : ce qui manque, ce qui est surévalué, ce qu’il faut faire écrire",
        ],
        [
          "Choisir un logiciel",
          "La démonstration la plus convaincante l’emporte",
          "Le choix se fait sur vos données, vos usages et ce que le logiciel coûtera dans trois ans",
        ],
        [
          "Mettre de l’IA quelque part",
          "Un abonnement de plus, essayé puis oublié",
          "L’IA va sur la tâche qui rend le plus d’heures, avec un coût borné et un résultat mesuré",
        ],
        [
          "Suivre un prestataire",
          "Le retard se découvre à la livraison",
          "L’architecture et l’avancement sont revus chaque mois, en comité avec la direction",
        ],
        [
          "Ordonner les chantiers",
          "Les urgences décident à votre place",
          "Une feuille de route technique et IA, revue chaque trimestre sur ce que les chiffres montrent",
        ],
      ],
    },
    {
      type: "etapes",
      id: "deroule",
      titre: "Le déroulé, mois après mois",
      paragraphes: [
        "Les trois premiers mois posent les bases : l’état des lieux, puis la feuille de route. Ensuite, le rythme reste le même tant qu’il vous sert.",
      ],
      etapes: [
        {
          titre: "L’état des lieux",
          corps:
            "Je fais l’inventaire de vos outils, de vos prestataires et de vos contrats, et je repère où partent le temps et l’argent.",
        },
        {
          titre: "La feuille de route",
          corps:
            "Je vous remets par écrit les chantiers techniques et d’IA, classés selon ce qu’ils rapportent, avec leur coût estimé.",
        },
        {
          titre: "Le comité mensuel",
          corps:
            "En visio avec la direction : ce qui a avancé, ce qui bloque, et les décisions à prendre ce mois-ci.",
        },
        {
          titre: "Entre deux comités",
          corps:
            "Un devis à relire, un outil à choisir, une question qui tombe : vous m’écrivez, et vous avez ma réponse sous 48\u00A0h.",
        },
        {
          titre: "La revue trimestrielle",
          corps:
            "La feuille de route est reprise chaque trimestre : ce qui a rapporté continue, ce qui n’a rien donné s’arrête.",
        },
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Automatisation et IA pour PME",
            href: CHEMIN_AUTOMATISATION,
            description: "Quand la feuille de route désigne une tâche à confier à l’IA.",
          },
          {
            libelle: "La Solution métier",
            href: "/services/logiciel-metier",
            description: "Quand il faut construire l’outil plutôt que l’acheter.",
          },
          {
            libelle: "Prix d’un logiciel sur mesure",
            href: CHEMIN_PRIX_LOGICIEL,
            description: "Les repères pour situer un devis de développement.",
          },
        ],
      },
    },
  ],
  titreOffre: "Prix d’un CTO à temps partagé",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Votre CTO", "à temps partagé."],
    items: [
      {
        question: "Combien coûte un CTO à temps partagé ?",
        answer: `Comptez ${prixAffiche(ctoReferentIA, " HT")} pour deux jours de travail chaque mois : le comité mensuel, la revue de l’architecture et des devis, la feuille de route, vos outils d’IA et un support écrit sous 48\u00A0h. Avec quatre jours de travail chaque mois, à ${euros(CTO_QUATRE_JOURS)} HT par mois, j’ajoute le recrutement de votre équipe technique et la gouvernance de vos données.`,
      },
      {
        question: "Quelle différence entre un CTO externalisé et un prestataire ?",
        answer:
          "Un prestataire vend le projet qu’il réalise. Je suis de votre côté de la table : je relis ses devis, je suis son travail, et je vous dis quand un choix vous coûtera cher plus tard. Si un développement se justifie, je le chiffre à part, et vous restez libre de le confier à quelqu’un d’autre.",
      },
      {
        question: "Que fait un référent IA, concrètement ?",
        answer:
          "Il décide où l’IA sert dans votre entreprise, et où elle ne sert à rien. Je teste les outils sur vos vrais cas, je mets en place ceux qui rendent des heures, je borne leur coût, et je fixe les règles : quelles données peuvent partir vers un modèle, qui valide ce que l’IA produit.",
      },
      {
        question: "Faut-il s’engager longtemps ?",
        answer:
          "Trois mois, le temps de faire l’état des lieux et de poser la feuille de route. Ensuite, vous arrêtez quand vous voulez, avec un mois de préavis. Tout se passe en visio, et un déplacement occasionnel reste possible, sur devis.",
      },
    ],
  },
};
