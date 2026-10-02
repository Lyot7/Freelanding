/**
 * PAGE `/services/site-vitrine/prix` : le prix d'un site internet sur mesure.
 *
 * POURQUOI CETTE PAGE. « Combien coûte un site internet professionnel » et
 * « prix site internet sur mesure » sont des requêtes de comparaison de budget,
 * tenues par des annuaires d'agences qui donnent des fourchettes sans rien
 * vendre. La page pilier `/services/site-vitrine` montre les forfaits ; celle-ci
 * répond à la question du prix elle-même : ce qui le fait varier, ce qui coûte
 * après la mise en ligne, et comment se situent les autres options. Plan du
 * 2026-10-02 (`marque/seo-2026-10-02/00-plan-seo-maximal.md`, lot 4).
 *
 * MÊME GABARIT QUE LES PAGES SECTEUR : des sections en deux moitiés, puis les
 * forfaits, le bloc sur devis, la prise de rendez-vous et une FAQ propre. Le
 * type reprend `SectionSecteur` plutôt que d'en déclarer un second identique.
 *
 * CE QUI N'Y FIGURE PAS, VOLONTAIREMENT :
 *   - aucun montant écrit à la main : prix, fourchette et suivi viennent de
 *     `offre.ts`. Le test le vérifie sur la source ;
 *   - aucun coût d'hébergement ni de nom de domaine chiffré : le site ne les
 *     facture pas, ils sont au nom du client et à son tarif ;
 *   - aucun chiffre de marché attribué à une source : les repères agence,
 *     WordPress et créateurs en ligne sont des ordres de grandeur d'Eliott,
 *     présentés comme tels ;
 *   - aucune durée à côté d'un prix (règle de `offre.ts`) et aucun présentiel.
 */
import type { FaqItem } from "@/lib/content/types";
import {
  fourchette,
  plancherSuivi,
  prestation,
  prixPack,
  suiviMensuel,
  tauxSuivi,
} from "./offre";
import { CHEMIN_PAGE_CAEN } from "./page-caen";
import type { SectionSecteur } from "./pages-secteur";

const VITRINE = prestation("vitrine");
const [LANDING, SITE, SIGNATURE] = VITRINE.packs;

export const CHEMIN_PRIX_SITE = `/services/${VITRINE.slug}/prix`;
const CHEMIN_PILIER_LOGICIEL = `/services/${prestation("logiciel").slug}`;
const CHEMIN_ARTICLE_REFONTE = "/blog/refonte-site-internet-pme";
const CHEMIN_ARTICLE_WORDPRESS = "/blog/site-sur-mesure-ou-wordpress";

/**
 * LE SUIVI D'UN SITE VITRINE, en une phrase juste quelle que soit la grille.
 * Aujourd'hui le plancher mord sur les 3 forfaits et la mensualité est la
 * même ; si la grille bouge et que les montants divergent, la phrase les
 * détaille au lieu d'en affirmer un seul.
 */
function suiviDuSite(): string {
  const montants = VITRINE.packs.map((p) => suiviMensuel(p.prix));
  return new Set(montants).size === 1
    ? `${montants[0]} HT par mois, quel que soit le forfait`
    : VITRINE.packs.map((p, i) => `${montants[i]} HT par mois pour ${p.nom}`).join(", ");
}

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
  readonly titrePacks: string;
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
    description: `Combien coûte un site internet professionnel ? Comptez ${fourchette("vitrine", " HT")}, 3 forfaits fermes : ce qui fait varier le devis, ce qui se paie ensuite.`,
  },
  h1: "Prix d’un site internet sur mesure",
  resume: `Un site internet professionnel sur mesure coûte ${fourchette("vitrine", " HT")}, en 3 forfaits à prix ferme : ${prixPack(LANDING)} pour une page, ${prixPack(SITE)} pour 5 à 7 pages, ${prixPack(SIGNATURE)} avec la mesure de ce qu’il rapporte. Une fois livré, il est à toi, sans abonnement.`,
  marcheFilAriane: "Prix",
  libelleLien: "prix d’un site internet sur mesure",
  noteLlms:
    "prix d’un site internet sur mesure : les 3 forfaits, ce qui fait varier le devis, les coûts après la mise en ligne, repères agence, freelance et WordPress",
  sections: [
    {
      id: "reponse",
      titre: "Combien coûte un site internet professionnel ?",
      paragraphes: [
        `Chez moi, un site internet sur mesure coûte ${fourchette("vitrine", " HT")}. Le montant dépend du forfait, et le forfait dépend de ce que le site doit faire pour toi : exister en ligne, être trouvé par tes clients, ou rapporter des contacts que tu peux compter.`,
        "Chaque forfait comprend la conception, le développement, la mise en ligne et une mesure de la vitesse sur mobile et sur ordinateur avant la livraison. Aucun ne retire le sur mesure : ce qui change d’un palier à l’autre, c’est la profondeur du travail sur les textes, sur le référencement et sur la mesure.",
      ],
      points: [
        {
          titre: `${LANDING.nom} : ${prixPack(LANDING)} HT`,
          corps:
            "1 page longue qui présente ton activité et donne envie d’appeler. Le bon point de départ pour une première présence en ligne ou une offre unique.",
        },
        {
          titre: `${SITE.nom} : ${prixPack(SITE)} HT`,
          corps:
            "5 à 7 pages, des textes réécrits avec toi et les recherches de tes clients étudiées avant d’écrire. Le choix courant quand tes prospects comparent avant de te contacter.",
        },
        {
          titre: `${SIGNATURE.nom} : ${prixPack(SIGNATURE)} HT`,
          corps:
            "Le site complet, plus un parcours dessiné pour une action précise et la mesure de ce qui déclenche un contact. Pour transformer des visites existantes en demandes.",
        },
      ],
    },
    {
      id: "variation",
      titre: "Qu’est-ce qui fait varier le prix d’un site ?",
      paragraphes: [
        "Le nombre de pages pèse moins lourd que le travail sur les textes et sur les recherches de tes clients. 5 postes décident du forfait, ou font sortir le projet des forfaits.",
        "Ces postes se tranchent pendant le premier appel. Le devis tombe ensuite sur un forfait, et son montant reste celui de la grille.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Une solution métier sur mesure",
            href: CHEMIN_PILIER_LOGICIEL,
            description:
              "Quand ton projet demande une boutique, un espace client ou une réservation avec paiement.",
          },
          {
            libelle: "Refonte de site internet : prix et méthode",
            href: CHEMIN_ARTICLE_REFONTE,
            description:
              "Refaire un site existant sans perdre le référencement acquis.",
          },
        ],
      },
      points: [
        {
          titre: "Le nombre de pages",
          corps: `1 page pour ${LANDING.nom}, 5 à 7 pages à partir de ${SITE.nom}, avec une page par métier ou par ville quand ton marché est local.`,
        },
        {
          titre: "Les textes",
          corps: `Avec ${LANDING.nom}, je mets en page les textes que tu fournis. À partir de ${SITE.nom}, nous les réécrivons ensemble pour qu’ils soient lus et trouvés.`,
        },
        {
          titre: "Les mots que tapent tes clients",
          corps: `Chercher les requêtes de ton marché avant d’écrire, puis baliser chaque page en conséquence. Ce travail commence avec ${SITE.nom}.`,
        },
        {
          titre: "La mesure",
          corps: `Savoir d’où viennent les visites et ce qui déclenche un contact demande d’installer la mesure et de corriger le site après sa mise en ligne. C’est le travail de ${SIGNATURE.nom}.`,
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
        "Un site sur mesure ne demande aucun abonnement pour continuer à fonctionner. Restent des dépenses que tu vois sur des factures à ton nom, au tarif de tes prestataires.",
        "Le suivi est facultatif : sans lui, ton site reste en ligne et t’appartient. Il sert à le garder à jour et à corriger ce qui doit l’être.",
      ],
      points: [
        {
          titre: "L’hébergement",
          corps:
            "Le site est hébergé à ton nom, chez un hébergeur que tu paies directement. Si ton trafic grossit au point de demander une machine plus puissante, c’est cette facture qui change.",
        },
        {
          titre: "Le nom de domaine",
          corps:
            "Ton adresse est réservée à ton nom et se renouvelle chaque année auprès de ton bureau d’enregistrement. Tu la gardes si tu changes de prestataire.",
        },
        {
          titre: "Le suivi mensuel",
          corps: `${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} par mois : pour un site vitrine, ${suiviDuSite()}. Il couvre les mises à jour, les sauvegardes vérifiées et les corrections.`,
        },
        {
          titre: "Les évolutions",
          corps:
            "Une page ou une fonction nouvelle n’était pas au cadrage : elle fait l’objet d’un devis à part, au moment où tu en as besoin.",
        },
      ],
    },
    {
      id: "comparaison",
      titre: "Agence, freelance ou Wix : quel budget prévoir ?",
      paragraphes: [
        "Les prix d’un site internet s’étalent sur une large plage, selon ce qui est livré et la structure de celui qui le livre. Les ordres de grandeur ci-contre servent de repères pour lire les devis que tu reçois.",
        `Je me situe sur le sur mesure, sans la structure d’une agence : ${fourchette("vitrine", " HT")}, avec la personne qui écrit le code comme seul interlocuteur.`,
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
        ],
      },
      points: [
        {
          titre: "Créateur de site en ligne",
          corps:
            "Wix, Squarespace et leurs équivalents : un abonnement de quelques dizaines d’euros par mois et ton temps pour construire le site. Bien pour démarrer seul, mais le site reste sur leur plateforme.",
        },
        {
          titre: "Thème WordPress installé par un prestataire",
          corps:
            "De quelques centaines à quelques milliers d’euros, plus une maintenance mensuelle pour tenir les extensions à jour. Le site ressemble à son thème.",
        },
        {
          titre: "Freelance",
          corps:
            "Des tarifs très variables selon l’expérience et le périmètre. Tu parles directement à la personne qui construit ton site.",
        },
        {
          titre: "Agence web",
          corps:
            "Chef de projet, designer, développeur : le prix couvre cette équipe et sa structure. Pour un site sur mesure, compte plusieurs milliers à plusieurs dizaines de milliers d’euros.",
        },
      ],
    },
    {
      id: "devis",
      titre: "Comment obtenir un devis de site internet ?",
      paragraphes: [
        "Le devis part d’un appel en visio. En réservant ton créneau, tu réponds à 3 questions sur ton budget, ton objectif et ton échéance : je sais avant l’appel quel forfait se dessine.",
        "Le devis écrit reprend le forfait, son prix et la date de mise en ligne. Rien n’est dû tant que tu ne l’as pas signé.",
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
            description: "Choisis un créneau en visio pour parler de ton site.",
          },
        ],
      },
      points: [
        {
          titre: "1. L’appel",
          corps:
            "15, 30 ou 45 minutes en visio, au choix, pour comprendre ton activité, tes clients et ce que ton site actuel ne fait pas.",
        },
        {
          titre: "2. Le devis écrit",
          corps:
            "Le forfait retenu, ce qu’il contient, son prix ferme et la date de mise en ligne, avant toute signature.",
        },
        {
          titre: "3. La construction",
          corps:
            "Tu suis ton site sur une adresse en ligne pendant qu’il se construit, et tu donnes tes retours au fil de l’eau.",
        },
        {
          titre: "4. La livraison",
          corps:
            "Le site en ligne, le code dans ton dépôt et l’hébergement à ton nom.",
        },
      ],
    },
  ],
  titrePacks: "Les 3 forfaits, leur prix et leur contenu",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Le prix", "de ton site."],
    items: [
      {
        question: "Le devis de site internet est-il gratuit ?",
        answer:
          "Oui. L’appel en visio et le devis écrit ne te coûtent rien et ne t’engagent à rien. Le premier paiement intervient à la signature du devis.",
      },
      {
        question: "Pourquoi un site sur mesure coûte-t-il plus cher qu’un site Wix ?",
        answer:
          "Avec un créateur de site en ligne, tu paies un abonnement et tu construis le site toi-même dans un modèle. Un site sur mesure est conçu, écrit et développé pour ton entreprise, mesuré avant sa mise en ligne, et il t’appartient : tu ne paies plus rien à une plateforme pour qu’il reste en ligne.",
      },
      {
        question: "Le prix comprend-il l’hébergement ?",
        answer:
          "Non. L’hébergement est à ton nom, et tu le paies directement à ton hébergeur. Je le configure et je mets le site en ligne dessus. Si tu changes de prestataire un jour, ton site ne bouge pas.",
      },
      {
        question: "Puis-je payer mon site en plusieurs fois ?",
        answer:
          "Oui, en 3 fois : 40 % à la signature du devis, 30 % à mi-parcours et 30 % à la livraison. Les montants et les dates sont écrits dans le devis.",
      },
      {
        question: "Combien coûte la refonte d’un site existant ?",
        answer: `Le même prix qu’un site neuf, ${fourchette("vitrine", " HT")} : je reconstruis le site au lieu de retoucher l’ancien code. Le contenu qui se classe déjà sur Google est repris, et le devis liste les anciennes adresses à rediriger vers les nouvelles.`,
      },
      {
        question: "Le référencement est-il compris dans le prix ?",
        answer: `Les bases du référencement sont posées dans chaque forfait, et l’indexation est vérifiée. À partir de ${SITE.nom}, le site vise les mots que tapent tes clients, avec balisage et données structurées. Personne ne peut te garantir une position : le classement prend plusieurs mois et dépend aussi de tes concurrents.`,
      },
    ],
  },
};

/**
 * LIEN VERS CETTE PAGE, posé sous les forfaits de `/services/site-vitrine` et
 * dans les liens de la page de Caen.
 */
export const lienVersPagePrixSite = {
  libelle: pagePrixSite.libelleLien,
  href: CHEMIN_PRIX_SITE,
} as const;
