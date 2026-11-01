/**
 * PAGE DE PRIX DE LA SOLUTION MÉTIER, `/services/logiciel-metier/prix`.
 *
 * POURQUOI CETTE PAGE. « Prix logiciel sur mesure » et « combien coûte un
 * logiciel sur mesure » sont tenus par des comparateurs et une ferme de
 * contenu (plan du 2026-10-02, lot 3). La page répond en tête, dans le format
 * que reprennent les moteurs génératifs : réponse directe, ce qui fait varier le
 * prix, les repères du marché, un calcul à hypothèses affichées, une FAQ.
 *
 * ELLE NE PORTE AUCUN CHIFFRE D'ELIOTT DEPUIS LE 2026-11-01 : ses prix se
 * donnent uniquement sur devis (voir `offre.ts`). Elle reste en ligne pour la
 * requête. Le suivi n'y a plus de taux ni de minimum : il entre dans le calcul
 * comme une ligne du devis.
 *
 * LES MONTANTS NE S'ÉCRIVENT PAS ICI. Le calcul face à un abonnement part de ses
 * hypothèses, et `page-prix-logiciel.test.mjs` vérifie qu'il tombe juste. Le
 * repère d'agence vient d'`offre.ts`, avec sa source, son lien et sa date.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott.
 */
import type { FaqItem } from "@/lib/content/types";
import { euros, prestation, repereAgenceLogiciel } from "./offre";
import { CHEMIN_PAGE_LOGICIEL_CAEN } from "./page-caen";
import {
  CHEMIN_PRIX_LOGICIEL,
  pagesSecteur,
  type SectionSecteur,
} from "./pages-secteur";

const LOGICIEL = prestation("logiciel");
const CHEMIN_PILIER = `/services/${LOGICIEL.slug}`;
const AGENCE = repereAgenceLogiciel;

/*
 * HYPOTHÈSES DE LA COMPARAISON : 20 utilisateurs, un abonnement à 40 € HT par
 * utilisateur et par mois, 36 mois. Le coût de l'abonnement devient la barre
 * sous laquelle le devis du visiteur, suivi compris, passe devant : la page donne
 * la méthode et le lecteur y met son propre devis.
 */
const SAAS_UTILISATEURS = 20;
const SAAS_PRIX_UTILISATEUR = 40;
const DUREE_MOIS = 36;
const SAAS_COUT_UTILISATEUR = SAAS_PRIX_UTILISATEUR * DUREE_MOIS;
const SAAS_COUT = SAAS_UTILISATEURS * SAAS_COUT_UTILISATEUR;

/** La comparaison, en nombres : le texte est écrit depuis eux. */
export interface ComparaisonAbonnement {
  readonly utilisateurs: number;
  /** Prix d'un abonnement, en euros HT par utilisateur et par mois. */
  readonly prixParUtilisateur: number;
  readonly mois: number;
  /** Ce que coûte un utilisateur de plus, sur la durée. */
  readonly coutParUtilisateur: number;
  readonly coutAbonnement: number;
}

export interface PagePrix {
  readonly chemin: string;
  readonly seo: {
    /** Balise `<title>`, marque comprise. 60 caractères, jamais plus. */
    readonly titre: string;
    /** Meta description, au vouvoiement : 150 à 160 caractères. */
    readonly description: string;
  };
  readonly h1: string;
  /** Chapô du héros : la réponse directe, prix compris. */
  readonly resume: string;
  readonly marcheFilAriane: string;
  /** Libellé du lien posé sur la page pilier, sous l'offre. */
  readonly libelleLien: string;
  /** Note de la ligne `llms.txt`. */
  readonly noteLlms: string;
  readonly sections: readonly SectionSecteur[];
  readonly comparaison: ComparaisonAbonnement;
  readonly titreOffre: string;
  readonly faq: {
    readonly eyebrow: string;
    readonly titleLines: readonly string[];
    readonly items: readonly FaqItem[];
  };
}

export const pagePrixLogiciel: PagePrix = {
  chemin: CHEMIN_PRIX_LOGICIEL,
  seo: {
    // « en 2026 » : la carte SEO du 2026-10-15 vise « Prix d'un logiciel sur
    // mesure en 2026 : fourchettes réelles » ; la marque, exigée par le test,
    // ne laisse la place qu'à l'année dans 60 caractères.
    titre: "Prix d’un logiciel sur mesure en 2026 · Eliott Bouquerel",
    description:
      "Combien coûte un logiciel sur mesure pour votre PME : ce qui fait varier le prix du devis, les repères d’agence et le calcul face à un abonnement SaaS.",
  },
  h1: "Prix d’un logiciel sur mesure",
  /* RÉPONSE DIRECTE EN TÊTE (carte SEO du 2026-10-15) : ce dont dépend le prix,
     puis le repère d'agence sourcé. */
  resume: `Le prix d’un logiciel sur mesure dépend des modules, des outils à relier et de votre historique, jamais du nombre d’utilisateurs. Je le fixe au devis, avant de commencer, et il ne bouge plus. En agence, ${AGENCE.source.nom} relève un premier outil entre ${euros(AGENCE.premierOutilMin)} et ${euros(AGENCE.premierOutilMax)} (${AGENCE.source.releve}).`,
  marcheFilAriane: "Prix",
  libelleLien: "prix d’un logiciel sur mesure",
  noteLlms:
    "prix d’un logiciel sur mesure : ce qui fait varier le prix, les repères d’agence, le suivi mensuel, et une comparaison chiffrée avec un abonnement SaaS sur 3 ans",
  sections: [
    {
      id: "forfaits",
      titre: "Un prix qui suit la taille de votre problème",
      paragraphes: [
        "Un module correspond à un pan de votre activité : les devis, le planning, la facturation, le stock. Un raccordement relie le logiciel à un outil qui porte déjà vos données, comme votre comptabilité ou votre ERP. Ces 2 unités font l’essentiel du prix.",
        "Ce que comprend chaque projet est détaillé plus bas, ligne par ligne. Les pages par métier montrent à quoi ressemblent ces modules dans un secteur donné.",
      ],
      liens: {
        titre: "Exemples par métier",
        items: pagesSecteur.map((p) => ({
          libelle: p.h1,
          href: p.chemin,
          description: p.accroche,
        })),
      },
      points: [
        {
          titre: "1 module, 1 raccordement",
          corps:
            "Le point de départ. Exemples : l’état des lieux photo d’un loueur, l’import des ordres d’un chargeur, le pointage mobile d’une entreprise du BTP.",
        },
        {
          titre: "Plusieurs modules",
          corps:
            "Plusieurs modules et raccordements, un compte par personne et la reprise de votre historique. Exemple : tarifs clients, commandes et stock chez un négociant.",
        },
        {
          titre: "Plusieurs systèmes",
          corps:
            "Autant de modules que votre activité en demande, et des systèmes qui échangent dans les 2 sens. Le montant se fixe au devis, après un cadrage.",
        },
      ],
    },
    {
      id: "variation",
      titre: "Ce qui fait varier le prix",
      paragraphes: [
        "Le prix suit le périmètre : le nombre de modules, le nombre d’outils à relier, et la part de votre métier qui sort des cas courants. Le nombre d’utilisateurs n’y entre pas, et une fois livré, le logiciel ne vous coûte aucune licence.",
        "Au premier appel, ces 4 postes suffisent pour vous donner un ordre de prix. Le devis le fixe ensuite, poste par poste.",
        `En agence, ${AGENCE.source.nom} relève un premier outil entre ${euros(AGENCE.premierOutilMin)} et ${euros(AGENCE.premierOutilMax)}, et une médiane de ${euros(AGENCE.mediane)} par projet logiciel (${AGENCE.source.releve}). Je conçois et je code moi-même : votre budget paie le logiciel plutôt qu’un chef de projet.`,
      ],
      liens: {
        titre: "Source",
        items: [
          {
            libelle: AGENCE.source.nom,
            href: AGENCE.source.href,
            description: `Les tarifs des agences de développement logiciel, relevés en ${AGENCE.source.releve}.`,
          },
        ],
      },
      points: [
        {
          titre: "Le nombre de modules",
          corps:
            "Chaque module ajoute ses écrans et ses règles : c’est le premier poste du devis.",
        },
        {
          titre: "Les raccordements",
          corps:
            "Chaque outil relié compte : votre comptabilité, votre ERP, votre site, l’interface d’un fournisseur. Un échange dans les 2 sens pèse plus qu’un simple import.",
        },
        {
          titre: "La reprise de l’historique",
          corps:
            "Des tableurs bien tenus se chargent vite. Des années de fichiers en double demandent un nettoyage avant l’import.",
        },
        {
          titre: "Les cas particuliers",
          corps:
            "Une règle de prix, une exception de facturation, un circuit de validation : chaque cas propre à votre métier se traite à part, et il est chiffré au devis.",
        },
        {
          titre: "Ce qui reste à part",
          corps:
            "Le cadrage d’un existant non documenté et la prise en main de vos équipes, chiffrés à part, sur devis.",
        },
      ],
    },
    {
      id: "comparaison",
      titre: "Sur mesure ou abonnement SaaS : le calcul sur 3 ans",
      paragraphes: [
        `Prenez une équipe de ${SAAS_UTILISATEURS} utilisateurs sur un logiciel en abonnement à ${euros(SAAS_PRIX_UTILISATEUR)} HT par utilisateur et par mois. Sur ${DUREE_MOIS} mois, l’abonnement coûte ${euros(SAAS_COUT)} HT.`,
        `Un logiciel sur mesure se paie une fois, puis son suivi mensuel, tous deux chiffrés au devis. Le calcul se fait donc avec votre devis : additionnez le projet et ${DUREE_MOIS} mois de suivi. Sous ${euros(SAAS_COUT)} HT, le sur mesure coûte moins cher que l’abonnement sur 3 ans. Chaque utilisateur en plus relève cette barre de ${euros(SAAS_COUT_UTILISATEUR)} HT, et l’écart se creuse chaque année suivante.`,
        "Ces chiffres sont des hypothèses : votre nombre d’utilisateurs, le tarif de votre éditeur et le prix de votre devis changent le résultat. Le calcul laisse de côté l’hébergement du sur mesure, payé à votre hébergeur, et le temps de paramétrage d’un abonnement.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Outil sur mesure ou abonnements SaaS",
            href: "/blog/outil-sur-mesure-ou-abonnements-saas",
            description: "La même question, posée en heures de travail gagnées.",
          },
        ],
      },
      points: [
        {
          titre: `Hypothèse 1 : ${SAAS_UTILISATEURS} utilisateurs`,
          corps:
            "Les personnes qui ouvrent le logiciel chaque semaine, au bureau comme sur le terrain.",
        },
        {
          titre: `Hypothèse 2 : ${euros(SAAS_PRIX_UTILISATEUR)} par utilisateur et par mois`,
          corps:
            "Un tarif d’abonnement professionnel pris comme exemple, options et modules supplémentaires exclus.",
        },
        {
          titre: `Hypothèse 3 : ${DUREE_MOIS} mois`,
          corps: "3 ans d’usage, sans hausse de tarif de l’éditeur sur la période.",
        },
        {
          titre: "Hypothèse 4 : le suivi compte dans le total",
          corps:
            "Le suivi couvre les mises à jour, les sauvegardes vérifiées et les corrections. Je le chiffre au devis, avec le projet.",
        },
      ],
    },
    {
      id: "devis",
      titre: "Comment votre prix est fixé",
      paragraphes: [
        "Le prix se fixe en 2 rendez-vous en visio. Au premier, vous décrivez le problème et votre budget ; au second, je vous présente le devis : modules retenus, raccordements, prix ferme et date de mise en service.",
        "Une fois le devis signé, le montant ne bouge plus. Une demande nouvelle en cours de route reçoit son propre devis, que vous acceptez ou non.",
      ],
      liens: {
        titre: "À lire aussi",
        items: [
          {
            libelle: "Le logiciel métier",
            href: CHEMIN_PILIER,
            description: "La page de l’offre, avec la prise de rendez-vous.",
          },
          {
            libelle: "Un logiciel sur mesure à Caen",
            href: CHEMIN_PAGE_LOGICIEL_CAEN,
            description: "Pour les PME du Calvados, de la Manche et de l’Orne.",
          },
          {
            libelle: "Réserver un appel",
            href: "#rendez-vous",
            description: "Choisissez un créneau en visio pour chiffrer votre projet.",
          },
        ],
      },
      points: [
        {
          titre: "Un prix ferme",
          corps:
            "Le montant écrit au devis est celui que vous payez, quel que soit le temps que j’y passe.",
        },
        {
          titre: "Un paiement en 3 fois",
          corps:
            "À la signature, à la première version qui fonctionne, puis à la livraison.",
        },
        {
          titre: "Une date de mise en service",
          corps:
            "Écrite au devis. Je ne mène qu’un projet à la fois, ce qui me permet de la tenir.",
        },
        {
          titre: "Le code à votre nom",
          corps:
            "Livré dans votre dépôt avec sa documentation : aucune licence à payer ensuite.",
        },
      ],
    },
  ],
  comparaison: {
    utilisateurs: SAAS_UTILISATEURS,
    prixParUtilisateur: SAAS_PRIX_UTILISATEUR,
    mois: DUREE_MOIS,
    coutParUtilisateur: SAAS_COUT_UTILISATEUR,
    coutAbonnement: SAAS_COUT,
  },
  titreOffre: "Ce qui est compris, ce qui fait varier le prix",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Le prix", "de votre logiciel."],
    items: [
      {
        question: "Qu’est-ce qu’un logiciel sur mesure ?",
        answer:
          "Un logiciel écrit pour une seule entreprise, à partir de sa façon de travailler : ses étapes, ses règles de prix, ses exceptions. Il s’ouvre dans un navigateur, ne contient que ce dont votre équipe se sert, et son code vous appartient à la livraison. Un logiciel du marché se loue, et se paramètre dans le cadre prévu par son éditeur.",
      },
      {
        question: "Combien coûte un logiciel sur mesure ?",
        answer:
          "Le prix suit le nombre de modules, les outils à relier, la reprise de votre historique et les cas particuliers de votre métier. Je le fixe au devis, après un premier échange, et le montant signé ne change plus.",
      },
      {
        question: "Et si le projet vous prend plus de temps que prévu ?",
        answer:
          "Le prix ne bouge pas. Le devis écrit le périmètre et le montant : si je me trompe sur le temps nécessaire, ce dépassement est pour moi, jamais sur votre facture.",
      },
      {
        question: "Combien coûte la maintenance d’un logiciel sur mesure ?",
        answer:
          "Le suivi mensuel se chiffre au devis, avec le projet. Il couvre les mises à jour, les sauvegardes vérifiées et les corrections. Il reste facultatif : le logiciel livré fonctionne sans lui. L’hébergement, lui, est à votre nom et se paie directement à l’hébergeur, selon la charge.",
      },
      {
        question: "Le prix dépend-il du nombre d’utilisateurs ?",
        answer:
          "Non. Le prix couvre un périmètre, des modules et des raccordements. Que 5 ou 50 personnes se servent du logiciel, vous ne payez aucune licence par utilisateur.",
      },
      {
        question: "Peut-on commencer petit et agrandir ensuite ?",
        answer:
          "Oui. Commencer par la tâche qui vous coûte le plus permet de mesurer le gain avant d’aller plus loin. Les modules suivants s’ajoutent sur la même base, chacun avec son devis.",
      },
      {
        question: "Pourquoi ne pas prendre un logiciel du marché ?",
        answer:
          "Si un logiciel du marché couvre votre métier, prenez-le : il vous coûtera moins cher au départ. Le sur mesure se justifie quand vos licences s’additionnent, quand vos règles sortent de ses paramètres, ou quand vos outils ne se parlent pas. Le calcul plus haut se refait avec vos chiffres.",
      },
    ],
  },
};

/** Amorce du lien vers cette page, sous l'offre de la page pilier. */
export const avantLienPrix = "Ce qui fait varier le prix :";
