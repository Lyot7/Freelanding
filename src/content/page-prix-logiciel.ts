/**
 * PAGE DE PRIX DE LA SOLUTION MÉTIER, `/services/logiciel-metier/prix`.
 *
 * POURQUOI CETTE PAGE. « Prix logiciel sur mesure » et « combien coûte un
 * logiciel sur mesure » sont tenus par des comparateurs et une ferme de
 * contenu ; aucun développeur indépendant n'y publie ses prix (plan du
 * 2026-10-02, lot 3). La page répond en tête, chiffres compris, dans le format
 * que reprennent les moteurs génératifs : réponse directe, plancher, ce qui
 * fait varier le prix, un calcul à hypothèses affichées, une FAQ.
 *
 * LES MONTANTS NE S'ÉCRIVENT PAS ICI. Le plancher et le suivi viennent de
 * `offre.ts` ; le calcul face à un abonnement est fait à partir de ses
 * hypothèses, et `page-prix-logiciel.test.mjs` vérifie qu'il tombe juste.
 *
 * LE SUIVI MENSUEL APPARAÎT ICI, contrairement aux pages de prestation (voir
 * `TAUX_SUIVI`) : une page qui répond « combien ça coûte » et compare à un
 * abonnement sur 3 ans ne peut pas l'omettre sans fausser la comparaison. Il
 * reste hors de l'offre : il est dans le calcul et dans la FAQ.
 */
import type { FaqItem } from "@/lib/content/types";
import {
  aPartirDe,
  euros,
  plancherSuivi,
  prestation,
  prixPlancher,
  suiviMensuelHT,
  tauxSuivi,
} from "./offre";
import { CHEMIN_PAGE_LOGICIEL_CAEN } from "./page-caen";
import {
  CHEMIN_PRIX_LOGICIEL,
  CHEMIN_SIMULATEUR,
  pagesSecteur,
  type SectionSecteur,
} from "./pages-secteur";

const LOGICIEL = prestation("logiciel");
const CHEMIN_PILIER = `/services/${LOGICIEL.slug}`;

/*
 * HYPOTHÈSES DE LA COMPARAISON : 20 utilisateurs, un abonnement à 40 € HT par
 * utilisateur et par mois, 36 mois.
 *
 * EN FACE, PLUS DE PRIX FERME DEPUIS LE 2026-10-05. La comparaison reposait
 * sur le prix ferme du palier du milieu, supprimé. Elle répond maintenant à la
 * question que le visiteur se pose vraiment, à hypothèses affichées : jusqu'à
 * quel prix de devis le sur mesure, suivi compris, reste moins cher que
 * l'abonnement (`BUDGET_EQUIVALENT`, arrondi à la centaine inférieure). Et au
 * plancher de l'offre, à partir de combien d'utilisateurs il passe devant
 * (`SEUIL_UTILISATEURS`). Aucun des deux ne présente un prix de projet comme
 * acquis.
 */
const SAAS_UTILISATEURS = 20;
const SAAS_PRIX_UTILISATEUR = 40;
const DUREE_MOIS = 36;
const SAAS_COUT = SAAS_UTILISATEURS * SAAS_PRIX_UTILISATEUR * DUREE_MOIS;
const coutSurMesure = (prixProjet: number): number =>
  prixProjet + suiviMensuelHT(prixProjet) * DUREE_MOIS;
const PLANCHER = LOGICIEL.plancher;
const SUIVI = suiviMensuelHT(PLANCHER);
const SUR_MESURE_COUT = coutSurMesure(PLANCHER);
const SEUIL_UTILISATEURS =
  Math.floor(SUR_MESURE_COUT / (SAAS_PRIX_UTILISATEUR * DUREE_MOIS)) + 1;
function budgetEquivalent(): number {
  let budget = Math.floor(SAAS_COUT / 100) * 100;
  while (budget > 0 && coutSurMesure(budget) > SAAS_COUT) budget -= 100;
  return budget;
}
const BUDGET_EQUIVALENT = budgetEquivalent();

/** La comparaison, en nombres : le texte est écrit depuis eux. */
export interface ComparaisonAbonnement {
  readonly utilisateurs: number;
  /** Prix d'un abonnement, en euros HT par utilisateur et par mois. */
  readonly prixParUtilisateur: number;
  readonly mois: number;
  readonly coutAbonnement: number;
  /** Le plancher de l'offre, en euros HT. */
  readonly prixProjet: number;
  /** Suivi mensuel d'un projet au plancher, en euros HT. */
  readonly suiviMensuel: number;
  /** Projet au plancher et son suivi, sur la durée. */
  readonly coutSurMesure: number;
  /** Au plancher, nombre d'utilisateurs à partir duquel le sur mesure coûte moins cher. */
  readonly seuilUtilisateurs: number;
  /** Prix de projet le plus haut qui, suivi compris, reste sous le coût de l'abonnement. */
  readonly budgetEquivalent: number;
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
    titre: "Prix d’un logiciel sur mesure · Eliott Bouquerel",
    description: `Combien coûte un logiciel sur mesure pour votre PME : ${aPartirDe(LOGICIEL, " HT")}, ce qui fait varier le prix du devis, et le calcul face à un abonnement SaaS.`,
  },
  h1: "Prix d’un logiciel sur mesure",
  resume: `Un logiciel sur mesure démarre à ${prixPlancher(LOGICIEL)} HT. Le prix dépend du nombre de modules et d’outils à relier, de la reprise de ton historique et des cas particuliers de ton métier, jamais du nombre d’utilisateurs. Il est fixé au devis, et il ne bouge plus.`,
  marcheFilAriane: "Prix",
  libelleLien: "prix d’un logiciel sur mesure",
  noteLlms:
    "prix d’un logiciel sur mesure : le plancher, ce qui fait varier le prix, le suivi mensuel, et une comparaison chiffrée avec un abonnement SaaS sur 3 ans",
  sections: [
    {
      id: "forfaits",
      titre: "Un plancher, puis la taille de ton problème",
      paragraphes: [
        "Un module correspond à un pan de ton activité : les devis, le planning, la facturation, le stock. Un raccordement relie le logiciel à un outil qui porte déjà tes données, comme ta comptabilité ou ton ERP. Ces 2 unités font l’essentiel du prix.",
        "Ce qui est compris dès le plancher est détaillé plus bas, ligne par ligne. Les pages par métier montrent à quoi ressemblent ces modules dans un secteur donné.",
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
            "Plusieurs modules et raccordements, un compte par personne et la reprise de ton historique. Exemple : tarifs clients, commandes et stock chez un négociant.",
        },
        {
          titre: "Plusieurs systèmes",
          corps:
            "Autant de modules que ton activité en demande, et des systèmes qui échangent dans les 2 sens. Le montant se fixe au devis, après un cadrage.",
        },
      ],
    },
    {
      id: "variation",
      titre: "Ce qui fait varier le prix",
      paragraphes: [
        "Le prix suit le périmètre : le nombre de modules, le nombre d’outils à relier, et la part de ton métier qui sort des cas courants. Le nombre d’utilisateurs n’y entre pas, et une fois livré, le logiciel ne te coûte aucune licence.",
        "Au premier appel, ces 4 postes suffisent pour te donner un ordre de prix. Le devis le fixe ensuite, poste par poste.",
      ],
      points: [
        {
          titre: "Le nombre de modules",
          corps:
            "Chaque module ajoute ses écrans et ses règles : c’est le premier poste du devis.",
        },
        {
          titre: "Les raccordements",
          corps:
            "Chaque outil relié compte : ta comptabilité, ton ERP, ton site, l’interface d’un fournisseur. Un échange dans les 2 sens pèse plus qu’un simple import.",
        },
        {
          titre: "La reprise de l’historique",
          corps:
            "Des tableurs bien tenus se chargent vite. Des années de fichiers en double demandent un nettoyage avant l’import.",
        },
        {
          titre: "Les cas particuliers",
          corps:
            "Une règle de prix, une exception de facturation, un circuit de validation : chaque cas propre à ton métier se traite à part, et il est chiffré au devis.",
        },
        {
          titre: "Ce qui reste à part",
          corps:
            "Le cadrage d’un existant non documenté et la prise en main de tes équipes, chiffrés à part, sur devis.",
        },
      ],
    },
    {
      id: "comparaison",
      titre: "Sur mesure ou abonnement SaaS : le calcul sur 3 ans",
      paragraphes: [
        `Prends une équipe de ${SAAS_UTILISATEURS} utilisateurs sur un logiciel en abonnement à ${euros(SAAS_PRIX_UTILISATEUR)} HT par utilisateur et par mois. Sur ${DUREE_MOIS} mois, l’abonnement coûte ${euros(SAAS_COUT)} HT.`,
        `Un logiciel sur mesure se paie une fois, puis son suivi mensuel, à ${tauxSuivi()} du prix par an. Avec ces hypothèses, tout projet jusqu’à ${euros(BUDGET_EQUIVALENT)} HT, suivi compris, coûte moins cher que l’abonnement sur 3 ans. Au plancher, ${prixPlancher(LOGICIEL)} HT et ${euros(SUIVI)} de suivi par mois, soit ${euros(SUR_MESURE_COUT)} HT sur la durée, le sur mesure passe devant dès ${SEUIL_UTILISATEURS} utilisateurs, et l’écart se creuse chaque année suivante.`,
        "Ces chiffres sont des hypothèses : ton nombre d’utilisateurs, le tarif de ton éditeur et le prix de ton devis changent le résultat. Le calcul laisse de côté l’hébergement du sur mesure, payé à ton hébergeur, et le temps de paramétrage d’un abonnement.",
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
          titre: `Hypothèse 4 : un suivi à ${tauxSuivi()} par an`,
          corps: `Le suivi que je propose vaut ${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} par mois. Il couvre les mises à jour, les sauvegardes vérifiées et les corrections.`,
        },
      ],
    },
    {
      id: "devis",
      titre: "Comment ton prix est fixé",
      paragraphes: [
        "Le prix se fixe en 2 rendez-vous en visio. Au premier, tu décris le problème et ton budget ; au second, je te présente le devis : modules retenus, raccordements, prix ferme et date de mise en ligne.",
        "Une fois le devis signé, le montant ne bouge plus. Une demande nouvelle en cours de route reçoit son propre devis, que tu acceptes ou non.",
      ],
      liens: {
        titre: "À lire aussi",
        items: [
          {
            libelle: "La solution métier",
            href: CHEMIN_PILIER,
            description: "La page de l’offre, avec la prise de rendez-vous.",
          },
          {
            libelle: "Simulateur de prix",
            href: CHEMIN_SIMULATEUR,
            description: "Le plancher de ton projet, et ce qui fera monter le prix.",
          },
          {
            libelle: "Un logiciel sur mesure à Caen",
            href: CHEMIN_PAGE_LOGICIEL_CAEN,
            description: "Pour les PME du Calvados, de la Manche et de l’Orne.",
          },
          {
            libelle: "Réserver un appel",
            href: "#rendez-vous",
            description: "Choisis un créneau en visio pour chiffrer ton projet.",
          },
        ],
      },
      points: [
        {
          titre: "Un prix ferme",
          corps:
            "Le montant écrit au devis est celui que tu paies, quel que soit le temps que j’y passe.",
        },
        {
          titre: "Un paiement en 3 fois",
          corps:
            "À la signature, à la première version qui fonctionne, puis à la livraison.",
        },
        {
          titre: "Une date de mise en ligne",
          corps:
            "Écrite au devis. Je ne mène qu’un projet à la fois, ce qui me permet de la tenir.",
        },
        {
          titre: "Le code à ton nom",
          corps:
            "Livré dans ton dépôt avec sa documentation : aucune licence à payer ensuite.",
        },
      ],
    },
  ],
  comparaison: {
    utilisateurs: SAAS_UTILISATEURS,
    prixParUtilisateur: SAAS_PRIX_UTILISATEUR,
    mois: DUREE_MOIS,
    coutAbonnement: SAAS_COUT,
    prixProjet: PLANCHER,
    suiviMensuel: SUIVI,
    coutSurMesure: SUR_MESURE_COUT,
    seuilUtilisateurs: SEUIL_UTILISATEURS,
    budgetEquivalent: BUDGET_EQUIVALENT,
  },
  titreOffre: "Ce qui est compris, ce qui fait varier le prix",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Le prix", "de ton logiciel."],
    items: [
      {
        question: "Combien coûte un logiciel sur mesure ?",
        answer: `Chez moi, ${aPartirDe(LOGICIEL, " HT")}. Au-dessus, le prix suit le nombre de modules, les outils à relier, la reprise de ton historique et les cas particuliers de ton métier. Je le fixe au devis, après un premier échange, et le montant signé ne change plus.`,
      },
      {
        question: "Pourquoi un prix au devis plutôt qu’à la journée ?",
        answer:
          "Un taux journalier te fait porter le risque du dépassement : chaque jour de plus s’ajoute à la facture. Avec un devis, le périmètre est écrit, le prix aussi, et si je me trompe sur le temps nécessaire, c’est à moi de l’absorber.",
      },
      {
        question: "Combien coûte la maintenance d’un logiciel sur mesure ?",
        answer: `Le suivi mensuel revient à ${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} par mois. Il couvre les mises à jour, les sauvegardes vérifiées et les corrections. Il reste facultatif : le logiciel livré fonctionne sans lui.`,
      },
      {
        question: "Et l’hébergement, combien coûte-t-il ?",
        answer:
          "L’hébergement est à ton nom, et tu le paies directement à l’hébergeur. Son coût dépend de la charge : plus de monde connecté demande une machine plus puissante, et je te préviens avant tout changement de ce type.",
      },
      {
        question: "Le prix dépend-il du nombre d’utilisateurs ?",
        answer:
          "Non. Le prix couvre un périmètre, des modules et des raccordements. Que 5 ou 50 personnes se servent du logiciel, tu ne paies aucune licence par utilisateur.",
      },
      {
        question: "Peut-on commencer petit et agrandir ensuite ?",
        answer:
          "Oui. Commencer par la tâche qui te coûte le plus permet de mesurer le gain avant d’aller plus loin. Les modules suivants s’ajoutent sur la même base, chacun avec son devis.",
      },
      {
        question: "Pourquoi ne pas prendre un logiciel du marché ?",
        answer:
          "Si un logiciel du marché couvre ton métier, prends-le : il te coûtera moins cher au départ. Le sur mesure se justifie quand tes licences s’additionnent, quand tes règles sortent de ses paramètres, ou quand tes outils ne se parlent pas. Le calcul plus haut te donne un seuil, à refaire avec tes chiffres.",
      },
    ],
  },
};

/** Amorce du lien vers cette page, sous l'offre de la page pilier. */
export const avantLienPrix = "Le détail des prix :";
