/**
 * PAGE LOCALE `/logiciel-sur-mesure-caen` : la solution métier, déclinée pour
 * Caen et l'ouest normand.
 *
 * POURQUOI CETTE PAGE. Sur « logiciel sur mesure caen », les premiers
 * résultats sont un éditeur de 1991 sans H1, une page de 259 mots et un studio
 * sans prix (plan du 2026-10-02, `marque/seo-2026-10-02/`, lot 3). Une page
 * qui répond avec un prix, une méthode et un interlocuteur à Caen a sa place.
 *
 * CE QUI LA REND LÉGITIME, ET RIEN D'AUTRE : Eliott est basé à Caen, il
 * intervient dans le Calvados, la Manche et l'Orne (la zone de la fiche Google,
 * `site.ts`), et tous ses rendez-vous se font en visio.
 *
 * CE QUI N'Y FIGURE PAS, VOLONTAIREMENT :
 *   - aucun client caennais, aucune adresse, aucun partenariat local : il n'y
 *     en a pas, et la FAQ le dit ;
 *   - aucun présentiel ;
 *   - aucun montant écrit à la main : `offre.ts` les donne.
 *
 * MÊME TYPE QUE LA PAGE DE CAEN DU SITE VITRINE (`PageLocale`), avec des
 * sections en plus, rendues dans le gabarit des pages secteur.
 */
import {
  fourchette,
  plancherSuivi,
  prestation,
  prixPack,
  tauxSuivi,
} from "./offre";
import {
  CHEMIN_PAGE_CAEN,
  CHEMIN_PAGE_LOGICIEL_CAEN,
  type PageLocale,
} from "./page-caen";
import { CHEMIN_PRIX_LOGICIEL, pagesSecteur } from "./pages-secteur";

const LOGICIEL = prestation("logiciel");
const [OUTIL, LE_LOGICIEL, PLATEFORME] = LOGICIEL.packs;
const CHEMIN_PILIER = `/services/${LOGICIEL.slug}`;

export const pageLogicielCaen: PageLocale = {
  chemin: CHEMIN_PAGE_LOGICIEL_CAEN,
  seo: {
    titre: "Logiciel sur mesure à Caen · Eliott Bouquerel",
    description: `Votre logiciel métier ou votre application web sur mesure, par un développeur basé à Caen, pour les PME de Normandie : ${fourchette("logiciel")} HT.`,
  },
  h1: "Logiciel sur mesure à Caen",
  resume: `Je développe des logiciels métier et des applications web sur mesure pour les PME de Caen, du Calvados, de la Manche et de l’Orne. Basé à Caen, je mène chaque projet en visio, du premier appel à la livraison. Compte ${fourchette("logiciel", " HT")}, en 3 forfaits à prix ferme.`,
  marcheFilAriane: "Caen",
  zones: {
    villes: ["Caen"],
    departements: ["Calvados", "Manche", "Orne"],
  },
  contexte: {
    titre: "Développement de logiciel sur mesure en Normandie",
    intro:
      "Négoce, transport, BTP, agroalimentaire, services : dans beaucoup de PME normandes, un tableur déborde ou 2 logiciels ne se parlent pas. Je travaille depuis Caen pour les entreprises du Calvados, de la Manche et de l’Orne, avec la même méthode et les mêmes prix que pour une entreprise de Lyon ou de Lille.",
    titreLiens: "Pour aller plus loin",
    liens: [
      {
        libelle: "La solution métier",
        href: CHEMIN_PILIER,
        description: "Les 3 forfaits, et ce que chacun ajoute au précédent.",
      },
      {
        libelle: "Le prix d’un logiciel sur mesure",
        href: CHEMIN_PRIX_LOGICIEL,
        description: "Ce qui fait varier le prix, et le calcul face à un abonnement.",
      },
      {
        libelle: "Création de site internet à Caen",
        href: CHEMIN_PAGE_CAEN,
        description: "Quand il te faut d’abord un site pour présenter ton entreprise.",
      },
      {
        libelle: "Réserver un appel",
        href: "#rendez-vous",
        description: "Choisis un créneau en visio pour parler de ton projet.",
      },
    ],
    points: [
      {
        titre: "Basé à Caen",
        corps:
          "Je travaille depuis Caen. Ton interlocuteur est en Normandie, aux mêmes horaires que toi, et c’est lui qui écrit le code.",
      },
      {
        titre: "Calvados, Manche, Orne",
        corps:
          "Ma zone d’intervention couvre les 3 départements de l’ouest normand, de Cherbourg à Alençon, en passant par Saint-Lô, Vire et Lisieux.",
      },
      {
        titre: "Tous les rendez-vous en visio",
        corps:
          "Le premier appel, le devis relu ensemble, la démonstration de chaque module : tout se fait en visio, sur un créneau que tu choisis, partage d’écran compris.",
      },
    ],
  },
  sections: [
    {
      id: "besoins",
      titre: "Ce qu’un logiciel sur mesure règle dans une PME",
      paragraphes: [
        "Un logiciel métier sur mesure part d’une tâche précise : un devis qui se refait à la main, un planning tenu sur un tableau blanc, un stock auquel personne ne se fie. Il prend la forme d’une application web, qui s’ouvre dans un navigateur, sur ordinateur comme sur téléphone, sans rien installer sur les postes.",
        "Pour 4 métiers, le détail des modules et un calcul chiffré ont leur propre page.",
      ],
      liens: {
        titre: "Par métier",
        items: pagesSecteur.map((p) => ({
          libelle: p.h1,
          href: p.chemin,
          description: p.accroche,
        })),
      },
      points: [
        {
          titre: "Devis et facturation",
          corps:
            "Tes règles de prix, tes remises et tes acomptes appliqués sans calcul à la main, du devis jusqu’à la facture.",
        },
        {
          titre: "Planning et interventions",
          corps:
            "Les équipes, les véhicules ou les machines sur un même planning, que chacun consulte depuis son téléphone.",
        },
        {
          titre: "Stock et commandes",
          corps:
            "Les quantités réelles par dépôt, les commandes en cours et les réapprovisionnements suivis au même endroit.",
        },
        {
          titre: "Espace client",
          corps:
            "Tes clients suivent leurs commandes, leurs documents et leurs factures sans appeler ton secrétariat.",
        },
      ],
    },
    {
      id: "questions",
      titre: "4 questions à poser avant de signer",
      paragraphes: [
        "À Caen comme ailleurs, un logiciel sur mesure se commande à un éditeur, à un studio de développement ou à un indépendant. Avant de comparer les devis, pose les mêmes questions à chacun, et compare les réponses autant que les montants.",
        "En face de chaque question, voici ma réponse, pour te donner un point de comparaison.",
      ],
      points: [
        {
          titre: "À qui appartient le code ?",
          corps:
            "Chez moi, à toi dès la livraison : le code dans ton dépôt, la base et l’hébergement à ton nom. Un logiciel dont tu loues seulement l’usage te lie à son auteur.",
        },
        {
          titre: "Le prix est-il ferme ?",
          corps:
            "Oui. Le devis fixe les modules, le prix et la date de mise en ligne, et ce prix ne bouge plus. Une demande nouvelle en cours de route fait l’objet d’un devis séparé.",
        },
        {
          titre: "Qui écrit le code ?",
          corps:
            "Moi, du premier appel à la livraison. Je ne mène qu’un projet à la fois, et personne ne reformule ta demande entre nous.",
        },
        {
          titre: "Un autre développeur pourra-t-il reprendre ?",
          corps:
            "Oui. La documentation décrit l’installation, les règles métier et la structure de la base, et je l’écris au fil du projet.",
        },
      ],
    },
    {
      id: "budget",
      titre: "Ce que ton budget permet",
      paragraphes: [
        `Le prix se compte en modules, un module étant un pan de ton activité : les devis, le planning, la facturation. ${OUTIL.nom} en couvre 1, ${LE_LOGICIEL.nom} jusqu’à 3, ${PLATEFORME.nom} autant que ton activité en demande.`,
        "Le nombre de personnes qui s’en servent ne change rien : à 3 comme à 40, tu paies le même forfait, et aucune licence ne s’ajoute chaque mois.",
      ],
      points: [
        {
          titre: `${OUTIL.nom} : ${prixPack(OUTIL)} HT`,
          corps:
            "Par exemple, le bon d’intervention rempli sur téléphone, qui arrive tout seul dans ta facturation.",
        },
        {
          titre: `${LE_LOGICIEL.nom} : ${prixPack(LE_LOGICIEL)} HT`,
          corps:
            "Par exemple, devis, planning et facturation réunis, avec un compte par personne et la reprise de ton historique.",
        },
        {
          titre: `${PLATEFORME.nom} : à partir de ${prixPack(PLATEFORME)} HT`,
          corps:
            "Par exemple, ton logiciel, ton ERP et ton site marchand qui échangent dans les 2 sens et restent d’accord.",
        },
      ],
    },
    {
      id: "methode",
      titre: "Un projet mené en visio, depuis Caen",
      paragraphes: [
        "Pendant le développement, chaque module arrive sur une adresse en ligne que ton équipe ouvre depuis son poste. Tu vois le logiciel avancer module par module, et tes remarques entrent dans la version suivante au lieu d’attendre la livraison.",
        "Le projet chiffré que je peux te montrer vient de la distribution : chez Würth France, le parcours de création de compte de l’eShop, refait à partir des erreurs relevées, a conduit à −92 % d’erreurs, mesuré en interne.",
      ],
      liens: {
        titre: "À voir",
        items: [
          {
            libelle: "Le projet Würth France",
            href: "/realisations/wurth-creation-de-compte",
            description: "La méthode appliquée à un parcours de création de compte.",
          },
        ],
      },
      points: [
        {
          titre: "1. Un appel de 30 minutes",
          corps:
            "En visio, gratuit. Tu poses ton besoin, et je te dis ce que ton budget permet.",
        },
        {
          titre: "2. Le devis relu ensemble",
          corps:
            "Un second rendez-vous en visio pour parcourir les modules, le prix ferme et la date de mise en ligne.",
        },
        {
          titre: "3. Le développement, module par module",
          corps:
            "Ton équipe teste chaque module sur ses vraies données avant la mise en service.",
        },
        {
          titre: "4. La livraison à ton nom",
          corps:
            "Code, base, hébergement et documentation : tout est à toi, et tu choisis librement qui fera évoluer le logiciel.",
        },
      ],
    },
  ],
  titrePacks: "Prix d’un logiciel sur mesure à Caen, en 3 forfaits",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Ton logiciel", "sur Caen."],
    items: [
      {
        question: "Combien coûte un logiciel sur mesure à Caen ?",
        answer: `Le prix va ${fourchette("logiciel", " HT")}, en 3 forfaits : ${prixPack(OUTIL)} pour ${OUTIL.nom}, ${prixPack(LE_LOGICIEL)} pour ${LE_LOGICIEL.nom}, et à partir de ${prixPack(PLATEFORME)} pour ${PLATEFORME.nom}, chiffrée au devis. Être à Caen ne change pas le prix : la grille est la même pour toute la France.`,
      },
      {
        question: "Faut-il se rencontrer pour lancer un logiciel sur mesure ?",
        answer:
          "Non. Les échanges se font en visio, avec partage d’écran : tu me montres tes tableurs et tes outils actuels, je te montre le logiciel en construction. La visio permet aussi d’associer une équipe répartie sur plusieurs sites, à Caen, à Saint-Lô ou à Alençon.",
      },
      {
        question: "As-tu déjà développé un logiciel pour une entreprise de Caen ?",
        answer:
          "Pas encore. Mon projet chiffré le plus proche est le parcours de création de compte de l’eShop de Würth France, dans la distribution. Ce que je t’apporte à Caen, c’est ma méthode et ma disponibilité : un seul projet à la fois, et un interlocuteur dans ta région.",
      },
      {
        question: "Tu travailles aussi dans la Manche et dans l’Orne ?",
        answer:
          "Oui. Ma zone d’intervention couvre le Calvados, la Manche et l’Orne, et je travaille à distance avec des entreprises de toute la France. Partout, les prix et la méthode restent les mêmes.",
      },
      {
        question: "Application web ou logiciel à installer : que choisir ?",
        answer:
          "Pour un logiciel de gestion, je développe des applications web : elles s’ouvrent dans un navigateur, sur ordinateur, tablette ou téléphone, et une mise à jour touche tout le monde à la fois. Rien à installer poste par poste, et tes équipes sur le terrain y accèdent comme celles du bureau.",
      },
      {
        question: "Que devient mon logiciel si tu n’es plus disponible ?",
        answer: `Il continue de tourner : il est hébergé à ton nom, et son code est dans ton dépôt avec sa documentation, prêt pour un autre développeur. Si tu veux que je reste sur le projet, le suivi mensuel revient à ${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} par mois.`,
      },
    ],
  },
};

/**
 * LE LIEN DEPUIS LA PAGE PILIER, posé sous ses forfaits par
 * `lienLocalParPrestation`, comme la page de Caen l'est depuis le site vitrine.
 */
export const lienVersPageLogicielCaen = {
  avant: "Ton entreprise est à Caen ou en Normandie :",
  libelle: "logiciel sur mesure à Caen",
  href: CHEMIN_PAGE_LOGICIEL_CAEN,
} as const;
