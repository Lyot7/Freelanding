/**
 * PAGE DE PRIX DE LA SOLUTION MÉTIER, `/services/logiciel-metier/prix`.
 *
 * POURQUOI CETTE PAGE. « Prix logiciel sur mesure » et « combien coûte un
 * logiciel sur mesure » sont tenus par des comparateurs et une ferme de
 * contenu ; aucun développeur indépendant n'y publie ses prix (plan du
 * 2026-10-02, lot 3). La page répond en tête, chiffres compris, dans le format
 * que reprennent les moteurs génératifs : réponse directe, forfaits, ce qui
 * fait varier le prix, un calcul à hypothèses affichées, une FAQ.
 *
 * LES MONTANTS NE S'ÉCRIVENT PAS ICI. Les forfaits et le suivi viennent de
 * `offre.ts` ; le calcul face à un abonnement est fait à partir de ses
 * hypothèses, et `page-prix-logiciel.test.mjs` vérifie qu'il tombe juste.
 *
 * LE SUIVI MENSUEL APPARAÎT ICI, contrairement aux pages de prestation (voir
 * `TAUX_SUIVI`) : une page qui répond « combien ça coûte » et compare à un
 * abonnement sur 3 ans ne peut pas l'omettre sans fausser la comparaison. Il
 * reste hors de la liste des forfaits : il est dans le calcul et dans la FAQ.
 */
import type { FaqItem } from "@/lib/content/types";
import {
  euros,
  fourchette,
  plancherSuivi,
  prestation,
  prixPack,
  suiviMensuel,
  suiviMensuelHT,
  tauxSuivi,
} from "./offre";
import { CHEMIN_PAGE_LOGICIEL_CAEN } from "./page-caen";
import {
  CHEMIN_PRIX_LOGICIEL,
  pagesSecteur,
  type SectionSecteur,
} from "./pages-secteur";

const LOGICIEL = prestation("logiciel");
const [OUTIL, LE_LOGICIEL, PLATEFORME] = LOGICIEL.packs;
const CHEMIN_PILIER = `/services/${LOGICIEL.slug}`;

/*
 * HYPOTHÈSES DE LA COMPARAISON : 20 utilisateurs, un abonnement à 40 € HT par
 * utilisateur et par mois, 36 mois. En face, Le Logiciel et son suivi mensuel,
 * tels que `offre.ts` les fixe. Le seuil est le plus petit nombre
 * d'utilisateurs à partir duquel l'abonnement coûte plus cher sur la durée.
 */
const SAAS_UTILISATEURS = 20;
const SAAS_PRIX_UTILISATEUR = 40;
const DUREE_MOIS = 36;
const SAAS_COUT = SAAS_UTILISATEURS * SAAS_PRIX_UTILISATEUR * DUREE_MOIS;
const SUIVI = suiviMensuelHT(LE_LOGICIEL.prix);
const SUIVI_DUREE = SUIVI * DUREE_MOIS;
const SUR_MESURE_COUT = LE_LOGICIEL.prix + SUIVI_DUREE;
const SEUIL_UTILISATEURS =
  Math.floor(SUR_MESURE_COUT / (SAAS_PRIX_UTILISATEUR * DUREE_MOIS)) + 1;

/** La comparaison, en nombres : le texte est écrit depuis eux. */
export interface ComparaisonAbonnement {
  readonly utilisateurs: number;
  /** Prix d'un abonnement, en euros HT par utilisateur et par mois. */
  readonly prixParUtilisateur: number;
  readonly mois: number;
  readonly coutAbonnement: number;
  readonly prixProjet: number;
  /** Suivi mensuel du projet, en euros HT. */
  readonly suiviMensuel: number;
  readonly coutSurMesure: number;
  /** Nombre d'utilisateurs à partir duquel le sur mesure coûte moins cher. */
  readonly seuilUtilisateurs: number;
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
  /** Libellé du lien posé sur la page pilier, sous les forfaits. */
  readonly libelleLien: string;
  /** Note de la ligne `llms.txt`. */
  readonly noteLlms: string;
  readonly sections: readonly SectionSecteur[];
  readonly comparaison: ComparaisonAbonnement;
  readonly titrePacks: string;
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
    description: `Combien coûte un logiciel sur mesure pour votre PME : 3 forfaits ${fourchette("logiciel", " HT")}, ce qui fait varier le prix, et le calcul face à un SaaS.`,
  },
  h1: "Prix d’un logiciel sur mesure",
  resume: `Un logiciel sur mesure coûte ${fourchette("logiciel", " HT")} : ${prixPack(OUTIL)} pour ${OUTIL.nom}, ${prixPack(LE_LOGICIEL)} pour ${LE_LOGICIEL.nom}, à partir de ${prixPack(PLATEFORME)} pour ${PLATEFORME.nom}. Le prix dépend du nombre de modules et d’outils à relier, jamais du nombre d’utilisateurs, et il est fixé au devis.`,
  marcheFilAriane: "Prix",
  libelleLien: "prix d’un logiciel sur mesure",
  noteLlms:
    "prix d’un logiciel sur mesure : les 3 forfaits, ce qui fait varier le prix, le suivi mensuel, et une comparaison chiffrée avec un abonnement SaaS sur 3 ans",
  sections: [
    {
      id: "forfaits",
      titre: "3 forfaits, 3 tailles de problème",
      paragraphes: [
        "Un module correspond à un pan de ton activité : les devis, le planning, la facturation, le stock. Un raccordement relie le logiciel à un outil qui porte déjà tes données, comme ta comptabilité ou ton ERP. Ces 2 unités suffisent à situer ton projet dans la grille.",
        "Le contenu exact de chaque forfait est détaillé plus bas, ligne par ligne. Les pages par métier montrent à quoi ressemblent ces modules dans un secteur donné.",
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
          titre: `${OUTIL.nom} : ${prixPack(OUTIL)} HT`,
          corps:
            "1 module et 1 raccordement. Exemples : l’état des lieux photo d’un loueur, l’import des ordres d’un chargeur, le pointage mobile d’une entreprise du BTP.",
        },
        {
          titre: `${LE_LOGICIEL.nom} : ${prixPack(LE_LOGICIEL)} HT`,
          corps:
            "Jusqu’à 3 modules et 2 raccordements, un compte par personne et la reprise de ton historique. Exemple : tarifs clients, commandes et stock chez un négociant.",
        },
        {
          titre: `${PLATEFORME.nom} : à partir de ${prixPack(PLATEFORME)} HT`,
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
        "Au premier appel, ces 4 postes suffisent pour te dire dans quel forfait tombe ton projet.",
      ],
      points: [
        {
          titre: "Le nombre de modules",
          corps: `1 module tient dans ${OUTIL.nom}, 3 dans ${LE_LOGICIEL.nom}. Au-delà, ${PLATEFORME.nom} se chiffre au devis.`,
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
          titre: "Ce qui reste hors forfait",
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
        `${LE_LOGICIEL.nom} coûte ${prixPack(LE_LOGICIEL)} HT, une fois. Ajoute le suivi mensuel, ${euros(SUIVI)} par mois pour ce projet, soit ${euros(SUIVI_DUREE)} sur la même durée : le total atteint ${euros(SUR_MESURE_COUT)} HT. En dessous de ${SEUIL_UTILISATEURS} utilisateurs, l’abonnement reste moins cher sur 3 ans ; à partir de ${SEUIL_UTILISATEURS}, le sur mesure passe devant, et l’écart se creuse chaque année suivante.`,
        "Ces chiffres sont des hypothèses : ton nombre d’utilisateurs et le tarif de ton éditeur changent le résultat. Le calcul laisse de côté l’hébergement du sur mesure, payé à ton hébergeur, et le temps de paramétrage d’un abonnement.",
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
    prixProjet: LE_LOGICIEL.prix,
    suiviMensuel: SUIVI,
    coutSurMesure: SUR_MESURE_COUT,
    seuilUtilisateurs: SEUIL_UTILISATEURS,
  },
  titrePacks: "Ce que contient chaque forfait, et son prix",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Le prix", "de ton logiciel."],
    items: [
      {
        question: "Combien coûte un logiciel sur mesure ?",
        answer: `Chez moi, ${fourchette("logiciel", " HT")}. ${OUTIL.nom} coûte ${prixPack(OUTIL)} HT pour une tâche et un outil à relier, ${LE_LOGICIEL.nom} ${prixPack(LE_LOGICIEL)} HT pour 3 modules au plus, et ${PLATEFORME.nom} démarre à ${prixPack(PLATEFORME)} HT, sur devis. Le montant signé ne change plus.`,
      },
      {
        question: "Pourquoi un forfait plutôt qu’un prix à la journée ?",
        answer:
          "Un taux journalier te fait porter le risque du dépassement : chaque jour de plus s’ajoute à la facture. Avec un forfait, le périmètre est écrit au devis, le prix aussi, et si je me trompe sur le temps nécessaire, c’est à moi de l’absorber.",
      },
      {
        question: "Combien coûte la maintenance d’un logiciel sur mesure ?",
        answer: `Le suivi mensuel revient à ${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} par mois : ${suiviMensuel(LE_LOGICIEL.prix)} par mois pour ${LE_LOGICIEL.nom}. Il couvre les mises à jour, les sauvegardes vérifiées et les corrections. Il reste facultatif : le logiciel livré fonctionne sans lui.`,
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
        answer: `Oui. Commencer par ${OUTIL.nom} sur la tâche qui te coûte le plus permet de mesurer le gain avant d’aller plus loin. Les modules suivants s’ajoutent sur la même base, chacun avec son devis.`,
      },
      {
        question: "Pourquoi ne pas prendre un logiciel du marché ?",
        answer:
          "Si un logiciel du marché couvre ton métier, prends-le : il te coûtera moins cher au départ. Le sur mesure se justifie quand tes licences s’additionnent, quand tes règles sortent de ses paramètres, ou quand tes outils ne se parlent pas. Le calcul plus haut te donne un seuil, à refaire avec tes chiffres.",
      },
    ],
  },
};

/** Amorce du lien vers cette page, sous les forfaits de la page pilier. */
export const avantLienPrix = "Le détail des prix :";
