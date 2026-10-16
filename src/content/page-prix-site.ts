/**
 * PAGE `/services/site-vitrine/prix` : le prix d'un site internet sur mesure.
 *
 * POURQUOI CETTE PAGE. « Combien coûte un site internet professionnel » et
 * « prix site internet sur mesure » sont des requêtes de comparaison de budget,
 * tenues par des annuaires d'agences qui donnent des fourchettes sans rien
 * vendre. La page pilier `/services/site-vitrine` montre l'offre ; celle-ci
 * répond à la question du prix elle-même : ce qui le fait varier, ce qui coûte
 * après la mise en ligne, et comment se situent les autres options. Plan du
 * 2026-10-02 (`marque/seo-2026-10-02/00-plan-seo-maximal.md`, lot 4).
 *
 * MÊME GABARIT QUE LES PAGES SECTEUR : des sections en deux moitiés, puis
 * l'offre, le bloc sur devis, la prise de rendez-vous et une FAQ propre. Le
 * type reprend `SectionSecteur` plutôt que d'en déclarer un second identique.
 *
 * CE QUI N'Y FIGURE PAS, VOLONTAIREMENT :
 *   - aucun montant écrit à la main : plancher et suivi viennent de
 *     `offre.ts`. Le test le vérifie sur la source ;
 *   - aucun coût d'hébergement ni de nom de domaine chiffré : le site ne les
 *     facture pas, ils sont au nom du client et à son tarif ;
 *   - aucun chiffre de marché sans sa source : les repères WordPress et
 *     créateurs en ligne sont des ordres de grandeur d'Eliott, présentés comme
 *     tels ; le repère agence vient de La Fabrique du Net (`offre.ts`), cité
 *     avec son lien et sa date ;
 *   - aucune durée chiffrée (règle de `offre.ts`) et aucun présentiel.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott.
 */
import type { FaqItem } from "@/lib/content/types";
import {
  aPartirDe,
  euros,
  plancherSuivi,
  prestation,
  prixPlancher,
  repereAgenceSite,
  tauxSuivi,
} from "./offre";
import { CHEMIN_PAGE_CAEN } from "./page-caen";
import type { SectionSecteur } from "./pages-secteur";

const VITRINE = prestation("vitrine");
export const CHEMIN_PRIX_SITE = `/services/${VITRINE.slug}/prix`;
const CHEMIN_PILIER_LOGICIEL = `/services/${prestation("logiciel").slug}`;
const CHEMIN_ARTICLE_REFONTE = "/blog/refonte-site-internet-pme";
const CHEMIN_ARTICLE_WORDPRESS = "/blog/site-sur-mesure-ou-wordpress";
const AGENCE = repereAgenceSite;

export interface PagePrixSite {
  readonly chemin: string;
  readonly seo: {
    /** Balise `<title>`, marque comprise. 60 caractères, jamais plus. */
    readonly titre: string;
    /** Meta description, au vouvoiement : 150 à 160 caractères. */
    readonly description: string;
  };
  readonly h1: string;
  /** Chapô du héros : la réponse directe, chiffrée. */
  readonly resume: string;
  /** Dernière marche du fil d'Ariane. */
  readonly marcheFilAriane: string;
  /** Libellé du lien posé sur la page pilier et sur la page de Caen. */
  readonly libelleLien: string;
  /** Note de la ligne `llms.txt`. */
  readonly noteLlms: string;
  readonly sections: readonly SectionSecteur[];
  readonly titreOffre: string;
  readonly faq: {
    readonly eyebrow: string;
    readonly titleLines: readonly string[];
    readonly items: readonly FaqItem[];
  };
}

export const pagePrixSite: PagePrixSite = {
  chemin: CHEMIN_PRIX_SITE,
  seo: {
    titre: "Prix d’un site internet sur mesure · Eliott Bouquerel",
    description: `Combien coûte un site internet professionnel ? Comptez ${aPartirDe(VITRINE, " HT")} : ce qui fait varier le prix du devis, et ce qui se paie après la mise en ligne.`,
  },
  h1: "Prix d’un site internet sur mesure",
  /* RÉPONSE CHIFFRÉE EN TÊTE (carte SEO du 2026-10-15) : le plancher, puis le
     prix d'agence sourcé, qui vise aussi « agence web prix ». À LIVRABLE ÉGAL
     depuis le 2026-10-16 (décision d'Eliott) : la fourchette d'un site vitrine
     soigné, jamais la médiane de tous les sites face à mon plancher. */
  resume: `Un site internet professionnel sur mesure démarre à ${prixPlancher(VITRINE)} HT chez moi, textes compris. En agence, un site vitrine soigné se facture entre ${euros(AGENCE.soigneMin)} et ${euros(AGENCE.soigneMax)} selon ${AGENCE.source.nom} (${AGENCE.source.releve}). Le prix final dépend du nombre de pages, du référencement et de la mesure, et il est fixé au devis. Une fois livré, le site est à vous, sans abonnement.`,
  marcheFilAriane: "Prix",
  libelleLien: "prix d’un site internet sur mesure",
  noteLlms:
    "prix d’un site internet sur mesure : le plancher, ce qui fait varier le devis, les coûts après la mise en ligne, repères agence, freelance et WordPress",
  sections: [
    {
      id: "reponse",
      titre: "Combien coûte un site internet professionnel ?",
      paragraphes: [
        `Chez moi, un site internet sur mesure démarre à ${prixPlancher(VITRINE)} HT. Au-dessus, le montant dépend de ce que le site doit faire pour vous : exister en ligne, être trouvé par vos clients, ou rapporter des contacts que vous pouvez compter. Je le fixe au devis, et il ne bouge plus.`,
        "Tout site comprend la conception, les textes, le développement, la mise en ligne et une mesure de la vitesse sur mobile et sur ordinateur avant la livraison. Ce qui fait monter le prix, c’est la profondeur du travail : le nombre de pages, le référencement et la mesure.",
      ],
      points: [
        {
          titre: "Exister en ligne",
          corps:
            "1 page longue qui présente votre activité et donne envie d’appeler. Le bon point de départ pour une première présence en ligne ou une offre unique.",
        },
        {
          titre: "Être trouvé par vos clients",
          corps:
            "Plusieurs pages, et les recherches de vos clients étudiées avant d’écrire. Le choix courant quand vos prospects comparent avant de vous contacter.",
        },
        {
          titre: "Rapporter des contacts",
          corps:
            "Un parcours dessiné pour une action précise, et la mesure de ce qui déclenche un contact. Pour transformer des visites existantes en demandes.",
        },
      ],
    },
    {
      id: "variation",
      titre: "Qu’est-ce qui fait varier le prix d’un site ?",
      paragraphes: [
        "Le nombre de pages pèse moins lourd que le travail sur le référencement et sur la mesure. 5 postes font varier le prix, ou font sortir le projet du site vitrine.",
        "Ces postes se tranchent pendant le premier appel. Le devis les reprend un par un, avec le prix qui en découle.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Une solution métier sur mesure",
            href: CHEMIN_PILIER_LOGICIEL,
            description:
              "Quand votre projet demande une boutique, un espace client ou une réservation avec paiement.",
          },
          {
            libelle: "Refonte de site internet : prix moyen 2026 et méthode",
            href: CHEMIN_ARTICLE_REFONTE,
            description:
              "Refaire un site existant sans perdre le référencement acquis.",
          },
        ],
      },
      points: [
        {
          titre: "Le nombre de pages",
          corps:
            "Une page longue au départ, plusieurs pages ensuite, avec une page par métier ou par ville quand votre marché est local.",
        },
        {
          titre: "Les textes",
          corps:
            "Je les écris pour qu’ils soient lus et trouvés, et c’est compris dans le prix : vous n’avez rien à rédiger. Leur volume suit le nombre de pages.",
        },
        {
          titre: "Les mots que tapent vos clients",
          corps:
            "Je cherche les requêtes de votre marché avant d’écrire. Le balisage complet, les données structurées et la Search Console branchée font monter le prix.",
        },
        {
          titre: "La mesure",
          corps:
            "Savoir d’où viennent les visites et ce qui déclenche un contact demande d’installer la mesure et de corriger le site après sa mise en ligne. Ce travail s’ajoute au plancher.",
        },
        {
          titre: "Les fonctions",
          corps:
            "Une boutique en ligne, un espace client ou une réservation avec paiement sortent du site vitrine. Elles se chiffrent à part, sur devis.",
        },
      ],
    },
    {
      id: "recurrent",
      titre: "Combien coûte un site internet après sa mise en ligne ?",
      paragraphes: [
        "Un site sur mesure ne demande aucun abonnement pour continuer à fonctionner. Restent des dépenses que vous voyez sur des factures à votre nom, au tarif de vos prestataires.",
        "Le suivi est facultatif : sans lui, votre site reste en ligne et vous appartient. Il sert à le garder à jour et à corriger ce qui doit l’être.",
      ],
      points: [
        {
          titre: "L’hébergement",
          corps:
            "Le site est hébergé à votre nom, chez un hébergeur que vous payez directement. Si votre trafic grossit au point de demander une machine plus puissante, c’est cette facture qui change.",
        },
        {
          titre: "Le nom de domaine",
          corps:
            "Votre adresse est réservée à votre nom et se renouvelle chaque année auprès de votre bureau d’enregistrement. Vous la gardez si vous changez de prestataire.",
        },
        {
          titre: "Le suivi mensuel",
          corps: `${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} par mois. Il couvre les mises à jour, les sauvegardes vérifiées et les corrections.`,
        },
        {
          titre: "Les évolutions",
          corps:
            "Une page ou une fonction nouvelle n’était pas au cadrage : elle fait l’objet d’un devis à part, au moment où vous en avez besoin.",
        },
      ],
    },
    {
      id: "comparaison",
      titre: "Agence web, freelance ou Wix : quel prix pour un site ?",
      paragraphes: [
        "Les prix d’un site internet s’étalent sur une large plage, selon ce qui est livré et la structure de celui qui le livre. Les ordres de grandeur ci-contre servent de repères pour lire les devis que vous recevez.",
        `Je fais le travail d’une agence, de la conception à la mise en ligne, ${aPartirDe(VITRINE, " HT")}, pour un site vitrine soigné que les agences facturent entre ${euros(AGENCE.soigneMin)} et ${euros(AGENCE.soigneMax)}. Je conçois et je code moi-même, sans chef de projet ni structure à payer, et votre budget va au site.`,
      ],
      liens: {
        titre: "Pour comparer",
        items: [
          {
            libelle: "Site sur mesure ou WordPress",
            href: CHEMIN_ARTICLE_WORDPRESS,
            description:
              "Maintenance, sécurité, vitesse et coût sur 3 ans, et les cas où WordPress suffit.",
          },
          {
            libelle: AGENCE.source.nom,
            href: AGENCE.source.href,
            description: `Les tarifs des agences de création de site, relevés en ${AGENCE.source.releve}.`,
          },
        ],
      },
      points: [
        {
          titre: "Créateur de site en ligne",
          corps:
            "Wix, Squarespace et leurs équivalents : un abonnement de quelques dizaines d’euros par mois et votre temps pour construire le site. Bien pour démarrer seul, mais le site reste sur leur plateforme.",
        },
        {
          titre: "Thème WordPress installé par un prestataire",
          corps:
            "De quelques centaines à quelques milliers d’euros, plus une maintenance mensuelle pour tenir les extensions à jour. Le site ressemble à son thème.",
        },
        {
          titre: "Freelance",
          corps:
            "Des tarifs très variables selon l’expérience et le périmètre. Vous parlez directement à la personne qui construit votre site.",
        },
        {
          titre: "Agence web",
          corps: `Le prix couvre une équipe et sa structure. Pour un site vitrine de PME soigné, ${AGENCE.source.nom} relève entre ${euros(AGENCE.soigneMin)} et ${euros(AGENCE.soigneMax)} (${AGENCE.source.releve}).`,
        },
      ],
    },
    {
      id: "devis",
      titre: "Comment obtenir un devis de site internet ?",
      paragraphes: [
        "Le devis part d’un appel en visio. En réservant votre créneau, vous répondez à 3 questions sur votre budget, votre objectif et votre échéance : je sais avant l’appel quel projet se dessine.",
        "Le devis écrit reprend ce que contient votre site, son prix et la date de mise en ligne. Rien n’est dû tant que vous ne l’avez pas signé.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Création de site internet à Caen",
            href: CHEMIN_PAGE_CAEN,
            description:
              "Le référencement local pour les entreprises de Caen et du Calvados.",
          },
          {
            libelle: "Les réalisations",
            href: "/realisations",
            description: "Les projets livrés, expliqués de bout en bout.",
          },
          {
            libelle: "Réserver un appel",
            href: "#rendez-vous",
            description: "Choisissez un créneau en visio pour parler de votre site.",
          },
        ],
      },
      points: [
        {
          titre: "1. L’appel",
          corps:
            "15, 30 ou 45 minutes en visio, au choix, pour comprendre votre activité, vos clients et ce que votre site actuel ne fait pas.",
        },
        {
          titre: "2. Le devis écrit",
          corps:
            "Ce que contient votre site, son prix ferme et la date de mise en ligne, avant toute signature.",
        },
        {
          titre: "3. La construction",
          corps:
            "Vous suivez votre site sur une adresse en ligne pendant qu’il se construit, et vous donnez vos retours au fil de l’eau.",
        },
        {
          titre: "4. La livraison",
          corps:
            "Le site en ligne, le code dans votre dépôt et l’hébergement à votre nom.",
        },
      ],
    },
  ],
  titreOffre: "Ce qui est compris, ce qui fait varier le prix",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Le prix", "de votre site."],
    items: [
      {
        question: "Le devis de site internet est-il gratuit ?",
        answer:
          "Oui. L’appel en visio et le devis écrit ne vous coûtent rien et ne vous engagent à rien. Le premier paiement intervient à la signature du devis.",
      },
      {
        question: "Pourquoi un site sur mesure coûte-t-il plus cher qu’un site Wix ?",
        answer:
          "Avec un créateur de site en ligne, vous payez un abonnement et vous construisez le site vous-même dans un modèle. Un site sur mesure est conçu, écrit et développé pour votre entreprise, mesuré avant sa mise en ligne, et il vous appartient : vous ne payez plus rien à une plateforme pour qu’il reste en ligne.",
      },
      {
        question: "Le prix comprend-il l’hébergement ?",
        answer:
          "Non. L’hébergement est à votre nom, et vous le payez directement à votre hébergeur. Je le configure et je mets le site en ligne dessus. Si vous changez de prestataire un jour, votre site ne bouge pas.",
      },
      {
        question: "Que contient un devis de site internet ?",
        answer:
          "Le mien tient en 4 parties : les pages et ce que chacune doit obtenir, ce qui est compris (textes, référencement, mesure), le prix ferme hors taxes avec son échéancier, et la date de mise en ligne. Un devis lisible détaille ce qui est livré page par page. Une ligne unique « création de site » ne vous permet pas de comparer.",
      },
      {
        question: "Puis-je payer mon site en plusieurs fois ?",
        answer:
          "Oui, en 3 fois : 40 % à la signature du devis, 30 % à mi-parcours et 30 % à la livraison. Les montants et les dates sont écrits dans le devis.",
      },
      {
        question: "Combien coûte la refonte d’un site existant ?",
        answer: `Le même prix qu’un site neuf, ${aPartirDe(VITRINE, " HT")} : je reconstruis le site au lieu de retoucher l’ancien code. Le contenu qui se classe déjà sur Google est repris, et le devis liste les anciennes adresses à rediriger vers les nouvelles.`,
      },
      {
        question: "Le référencement est-il compris dans le prix ?",
        answer:
          "Les bases du référencement sont posées sur chaque site, et l’indexation est vérifiée. Les textes visent les mots que tapent vos clients. Le balisage complet et les données structurées s’ajoutent au devis. Personne ne peut vous garantir une position : le classement prend plusieurs mois et dépend aussi de vos concurrents.",
      },
    ],
  },
};

/**
 * LIEN VERS CETTE PAGE, posé sous l'offre de `/services/site-vitrine` et
 * dans les liens de la page de Caen.
 */
export const lienVersPagePrixSite = {
  libelle: pagePrixSite.libelleLien,
  href: CHEMIN_PRIX_SITE,
} as const;
