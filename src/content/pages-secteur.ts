/**
 * PAGES SECTEUR DE LA SOLUTION MÉTIER, sous `/services/logiciel-metier/<secteur>`.
 *
 * POURQUOI CES PAGES. La demande réelle se tape « logiciel gestion chantier
 * btp » ou « logiciel gestion transport », jamais « logiciel sur mesure ». Sur
 * ces requêtes, les résultats sont tenus par une ferme de contenu et des
 * éditeurs : aucun développeur français n'y répond avec un prix et une méthode.
 * Plan du 2026-10-02 (`marque/seo-2026-10-02/00-plan-seo-maximal.md`, lot 2).
 *
 * LA RÈGLE QUI TIENT CES PAGES HORS DU « SCALED CONTENT ABUSE ». Google
 * sanctionne les pages produites en série où seul le nom du secteur change.
 * Chaque page porte donc son propre vocabulaire de métier, ses propres modules,
 * et un CALCUL chiffré qu'aucune autre page n'a, hypothèses affichées comme
 * telles. `pages-secteur.test.mjs` refuse qu'un paragraphe se retrouve sur deux
 * secteurs.
 *
 * CE QUI N'Y FIGURE PAS, VOLONTAIREMENT :
 *   - aucun client, chiffre client ou témoignage du secteur : Eliott n'en a
 *     pas. Le seul cas cité est Würth France, présenté comme un autre secteur
 *     (la distribution), et une question de FAQ le dit en toutes lettres ;
 *   - aucun présentiel : les rendez-vous se font en visio ;
 *   - aucun montant écrit à la main : les prix viennent de `offre.ts`, et les
 *     montants du calcul sont calculés depuis leurs hypothèses ;
 *   - aucune affirmation réglementaire datée (facture électronique, seuils) :
 *     le vocabulaire est exact, les obligations restent celles du contrat.
 *
 * AJOUTER UN SECTEUR (location de matériel, négoce, maintenance,
 * agroalimentaire) : un objet de plus dans `pagesSecteur`, et son slug dans
 * `SecteurSlug`. La route, le sitemap, `llms.txt` et le lien depuis la page
 * pilier en sont dérivés.
 */
import type { FaqItem } from "@/lib/content/types";
import { euros, fourchette, prestation, prixPack } from "./offre";
import type { LienLocal } from "./page-caen";

const LOGICIEL = prestation("logiciel");
const [OUTIL, LE_LOGICIEL, PLATEFORME] = LOGICIEL.packs;

/** Le cas Würth, seule preuve de méthode citée : un autre secteur. */
const CHEMIN_WURTH = "/realisations/wurth-creation-de-compte";
const CHEMIN_ARTICLE_SAAS = "/blog/outil-sur-mesure-ou-abonnements-saas";
const CHEMIN_PILIER = `/services/${LOGICIEL.slug}`;

export type SecteurSlug = "btp" | "transport";

/** Un point de la moitié droite d'une section : un titre court, une phrase. */
export interface PointSecteur {
  readonly titre: string;
  readonly corps: string;
}

/**
 * Une section de la page, rendue dans la découpe en deux moitiés des pages de
 * prestation : à gauche le titre, les paragraphes et des liens, à droite les
 * points.
 */
export interface SectionSecteur {
  /** Identifiant stable, repris en `data-section`. */
  readonly id: string;
  readonly titre: string;
  readonly paragraphes: readonly string[];
  readonly liens?: {
    readonly titre: string;
    readonly items: readonly LienLocal[];
  };
  readonly points: readonly PointSecteur[];
}

/**
 * LE CALCUL DE LA PAGE, en nombres. Le texte de la section `calcul` est écrit
 * à partir de ces valeurs, jamais l'inverse : le test vérifie que le coût
 * annoncé est bien le produit des hypothèses.
 */
export interface CalculSecteur {
  readonly heuresParAn: number;
  /** Coût complet d'une heure, en euros HT : une hypothèse, pas un tarif. */
  readonly coutHoraire: number;
  readonly coutAnnuel: number;
}

export interface PageSecteur {
  readonly slug: SecteurSlug;
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
  /** Dernière marche du fil d'Ariane. */
  readonly marcheFilAriane: string;
  /** Libellé du lien posé sur la page pilier, sous les forfaits. */
  readonly libelleLien: string;
  /** Note de la ligne `llms.txt`. */
  readonly noteLlms: string;
  readonly sections: readonly SectionSecteur[];
  readonly calcul: CalculSecteur;
  readonly titrePacks: string;
  readonly faq: {
    readonly eyebrow: string;
    readonly titleLines: readonly string[];
    readonly items: readonly FaqItem[];
  };
}

/** Chemin d'une page secteur, le seul endroit où il se compose. */
export const cheminSecteur = (slug: SecteurSlug): string =>
  `${CHEMIN_PILIER}/${slug}`;

/* ------------------------------------------------------------------------ */
/* BTP                                                                       */
/* ------------------------------------------------------------------------ */

/*
 * HYPOTHÈSES DU CALCUL BTP : 3 conducteurs de travaux, 4 heures de ressaisie
 * par semaine et par personne, 45 semaines travaillées, 40 € de l'heure
 * chargée. Ordres de grandeur affichés comme hypothèses sur la page.
 */
const BTP_CONDUCTEURS = 3;
const BTP_HEURES_SEMAINE = 4;
const BTP_SEMAINES = 45;
const BTP_COUT_HORAIRE = 40;
const BTP_HEURES_AN = BTP_CONDUCTEURS * BTP_HEURES_SEMAINE * BTP_SEMAINES;
const BTP_COUT_AN = BTP_HEURES_AN * BTP_COUT_HORAIRE;

const pageBtp: PageSecteur = {
  slug: "btp",
  chemin: cheminSecteur("btp"),
  seo: {
    titre: "Logiciel de gestion de chantier BTP · Eliott Bouquerel",
    description: `Logiciel de gestion de chantier sur mesure pour votre PME du BTP : devis, situations, pointage, sous-traitants. Prix : ${fourchette("logiciel", " HT")}.`,
  },
  h1: "Logiciel de gestion de chantier BTP",
  resume: `Un logiciel de gestion de chantier sur mesure réunit tes devis, l’avancement, les situations de travaux et les heures de tes équipes dans un seul outil. Il s’adresse aux PME du BTP que le tableur ou un logiciel standard ne suit plus. Compte ${fourchette("logiciel", " HT")} selon le périmètre.`,
  marcheFilAriane: "BTP",
  libelleLien: "logiciel de gestion de chantier BTP",
  noteLlms:
    "logiciel de gestion de chantier sur mesure pour les PME du BTP : devis, suivi de chantier, situations de travaux, pointage",
  sections: [
    {
      id: "metier",
      titre: "Entre le devis et la dernière situation, les chiffres se perdent",
      paragraphes: [
        "Sur un chantier, la marge se joue à 3 moments : le devis, l’avancement, la facture. Dans beaucoup de PME du bâtiment et des travaux publics, ces 3 moments vivent dans 3 fichiers. Le devis sort d’un logiciel, les métrés d’un tableur, le pointage d’un carnet ou d’une photo envoyée le vendredi soir, et la situation de travaux se refait à la main en fin de mois.",
        "Le conducteur de travaux recopie alors le soir des chiffres déjà saisis par un autre, et la direction découvre la marge d’un chantier à sa clôture, quand il n’y a plus rien à corriger.",
      ],
      points: [
        {
          titre: "Devis et métrés",
          corps:
            "Les quantités du métré ne descendent pas seules dans le devis, et un avenant accepté au téléphone se perd avant d’arriver sur la facture.",
        },
        {
          titre: "Situations de travaux",
          corps:
            "Chaque mois, il faut reprendre l’avancement poste par poste, déduire les situations précédentes, appliquer la retenue de garantie et la révision de prix quand le marché en prévoit une.",
        },
        {
          titre: "Sous-traitants",
          corps:
            "Contrats, attestations de vigilance à redemander tous les 6 mois, autoliquidation de la TVA sur leurs factures : l’oubli se découvre au contrôle.",
        },
        {
          titre: "Pointage des compagnons",
          corps:
            "Les heures, les paniers et les indemnités de trajet arrivent sur papier, se ressaisissent pour la paie, puis une seconde fois pour imputer le coût au bon chantier.",
        },
      ],
    },
    {
      id: "modules",
      titre: "Ce que fait ton logiciel de chantier",
      paragraphes: [
        "Le logiciel reprend tes lots, ta bibliothèque d’ouvrages et tes règles de facturation. Tu retiens les modules qui règlent ton problème, et leur nombre décide du forfait.",
        "Une donnée saisie une fois sert partout : le métré alimente le devis, le devis signé devient le budget, le pointage nourrit le coût réel, l’avancement produit la situation du mois.",
      ],
      points: [
        {
          titre: "Devis par ouvrage",
          corps:
            "Tes ouvrages avec leur déboursé sec, tes coefficients de vente, les variantes, et les avenants rattachés au devis d’origine.",
        },
        {
          titre: "Suivi de chantier",
          corps:
            "L’avancement saisi par lot ou par poste depuis un téléphone, et l’écart entre budget et coût réel, chantier par chantier.",
        },
        {
          titre: "Facturation à l’avancement",
          corps:
            "La situation de travaux calculée depuis l’avancement, situations précédentes déduites, retenue de garantie et acomptes appliqués, prête à partir chez le maître d’ouvrage.",
        },
        {
          titre: "Pointage mobile",
          corps:
            "Le chef d’équipe pointe ses compagnons depuis son téléphone. Les heures partent vers la paie, leur coût vers le chantier.",
        },
        {
          titre: "Sous-traitance",
          corps:
            "Les contrats et les pièces de chaque sous-traitant, relancées automatiquement à leur échéance.",
        },
        {
          titre: "Documents de chantier",
          corps:
            "Plans, procès-verbaux, photos et fiches techniques classés par chantier, pour sortir le DOE sans fouiller les messageries.",
        },
      ],
    },
    {
      id: "calcul",
      titre: "La ressaisie, chiffrée sur une année",
      paragraphes: [
        `Prends une PME avec ${BTP_CONDUCTEURS} conducteurs de travaux. Par personne, ${BTP_HEURES_SEMAINE} heures par semaine partent à recopier des pointages, à tenir un tableur d’avancement et à refaire les situations. Sur ${BTP_SEMAINES} semaines travaillées, le total atteint ${BTP_HEURES_AN} heures par an.`,
        `À ${euros(BTP_COUT_HORAIRE)} l’heure, salaire chargé et frais compris, ces heures coûtent ${euros(BTP_COUT_AN)} par an. ${LE_LOGICIEL.nom} coûte ${prixPack(LE_LOGICIEL)} HT, payé une fois. Ces 4 chiffres sont des hypothèses : remplace-les par les tiens avant d’en tirer une conclusion.`,
      ],
      points: [
        {
          titre: `Hypothèse 1 : ${BTP_CONDUCTEURS} conducteurs de travaux`,
          corps:
            "Les personnes qui ressaisissent des données de chantier toutes les semaines.",
        },
        {
          titre: `Hypothèse 2 : ${BTP_HEURES_SEMAINE} heures par semaine`,
          corps:
            "Le pointage recopié pour la paie, la mise à jour de l’avancement, et la situation du mois répartie sur 4 semaines.",
        },
        {
          titre: `Hypothèse 3 : ${euros(BTP_COUT_HORAIRE)} l’heure`,
          corps:
            "Le coût complet d’une heure de conducteur de travaux : salaire, charges patronales, véhicule et frais de structure.",
        },
        {
          titre: `Hypothèse 4 : ${BTP_SEMAINES} semaines par an`,
          corps:
            "Congés, fermeture d’été et jours fériés retirés.",
        },
      ],
    },
    {
      id: "marche",
      titre: "Sur mesure ou logiciel BTP du marché ?",
      paragraphes: [
        "Des éditeurs vendent des logiciels BTP complets, avec devis, situations et facturation, sur abonnement mensuel. Si ton activité tient dans leurs écrans, prends-en un : il coûtera moins cher et se mettra en place plus vite qu’un développement.",
        "Le sur mesure se justifie quand ton métier sort de leur cadre, ou quand ton logiciel actuel fait l’essentiel et que le reste te coûte des heures chaque semaine. Dans ce cas, garde-le et fais développer la pièce qui manque.",
      ],
      liens: {
        titre: "Pour trancher",
        items: [
          {
            libelle: "Outil sur mesure ou abonnements SaaS",
            href: CHEMIN_ARTICLE_SAAS,
            description:
              "Comment comparer un abonnement par utilisateur et un outil qui t’appartient.",
          },
        ],
      },
      points: [
        {
          titre: "Le logiciel du marché suffit",
          corps:
            "Une seule société, des chantiers classiques, une facturation sans règle particulière, et des équipes prêtes à suivre l’outil tel qu’il est.",
        },
        {
          titre: "Le sur mesure se justifie",
          corps:
            "Plusieurs sociétés à consolider, un process propre à ton métier comme la préfabrication en atelier ou un parc de matériel interne, ou des outils existants à faire parler entre eux.",
        },
        {
          titre: "Entre les deux",
          corps: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, ajoute à ton logiciel actuel la fonction qui lui manque : un pointage mobile, un export vers la paie, un tableau de marge par chantier.`,
        },
        {
          titre: "À qui appartient l’outil",
          corps:
            "Avec un abonnement, tu loues l’outil et tes données vivent chez l’éditeur. Le sur mesure t’appartient à la livraison, code et base compris, sans licence par utilisateur.",
        },
      ],
    },
    {
      id: "methode",
      titre: "Le projet, de l’appel à la mise en ligne",
      paragraphes: [
        "Avant de dessiner un écran, je relève où l’information se perd : tableurs, situations, feuilles de pointage. Chez Würth France, dans la distribution de fournitures professionnelles, cette méthode appliquée à un parcours de création de compte a donné −92 % d’erreurs, mesuré en interne.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "La solution métier en détail",
            href: CHEMIN_PILIER,
            description: "Les 3 forfaits, ce que chacun contient et son prix.",
          },
          {
            libelle: "Le projet Würth France",
            href: CHEMIN_WURTH,
            description:
              "Un parcours refait à partir des erreurs relevées, dans la distribution.",
          },
          {
            libelle: "Réserver un appel",
            href: "#rendez-vous",
            description: "Choisis un créneau en visio pour parler de tes chantiers.",
          },
        ],
      },
      points: [
        {
          titre: "1. Un appel en visio",
          corps:
            "Gratuit. Quand tu le réserves, 3 questions sur ton budget, ton objectif et ton échéance me permettent de te dire dès l’appel ce que ton budget permet.",
        },
        {
          titre: "2. Le devis, relu ensemble",
          corps:
            "Je te le présente lors d’un second rendez-vous : les modules retenus, le prix ferme et la date de mise en ligne, écrits avant que tu signes.",
        },
        {
          titre: "3. Le logiciel avance sous tes yeux",
          corps:
            "Je ne mène qu’un projet à la fois. Chaque module arrive sur une adresse en ligne, et tes conducteurs de travaux l’essaient sur un vrai chantier avant la livraison.",
        },
        {
          titre: "4. Livré à ton nom",
          corps:
            "Le code dans ton dépôt, l’hébergement à ton nom, et une documentation qui permet à un autre développeur de reprendre.",
        },
      ],
    },
  ],
  calcul: {
    heuresParAn: BTP_HEURES_AN,
    coutHoraire: BTP_COUT_HORAIRE,
    coutAnnuel: BTP_COUT_AN,
  },
  titrePacks: "Prix d’un logiciel de chantier, en 3 forfaits",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Ton logiciel", "de chantier."],
    items: [
      {
        question: "Combien coûte un logiciel de gestion de chantier sur mesure ?",
        answer: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, règle une tâche, comme le pointage mobile. ${LE_LOGICIEL.nom}, à ${prixPack(LE_LOGICIEL)} HT, couvre jusqu’à 3 modules : devis, suivi de chantier, situations. ${PLATEFORME.nom} démarre à ${prixPack(PLATEFORME)} HT quand plusieurs sociétés doivent rester d’accord. Le prix est fixé au devis et ne bouge plus.`,
      },
      {
        question:
          "Le logiciel gère-t-il la facturation à l’avancement et la retenue de garantie ?",
        answer:
          "Oui, si tu retiens ce module. Chaque situation reprend l’avancement par poste, déduit les situations déjà facturées et applique la retenue de garantie prévue au marché, ou note la caution qui la remplace. Le logiciel garde la trace de chaque retenue jusqu’à sa libération.",
      },
      {
        question: "Mes chefs d’équipe pourront-ils pointer depuis le chantier ?",
        answer:
          "Oui. Le pointage s’ouvre dans le navigateur du téléphone, sans application à installer : le chantier, les compagnons présents, les heures. Si tes chantiers captent mal, dis-le au premier appel, et la saisie hors connexion entre dans le périmètre du devis.",
      },
      {
        question: "Peut-on reprendre mes devis et mes chantiers en cours ?",
        answer: `Oui, la reprise de ton historique fait partie de ${LE_LOGICIEL.nom} : tes tableurs et les exports de ton logiciel actuel sont nettoyés et chargés avant la mise en ligne, chantiers ouverts compris.`,
      },
      {
        question: "As-tu déjà travaillé pour une entreprise du BTP ?",
        answer:
          "Pas encore. Mon projet chiffré le plus proche vient de la distribution : le parcours de création de compte de l’eShop de Würth France. Ce que j’en transpose, c’est la façon de travailler : comprendre comment tes équipes saisissent avant de coder, puis te montrer chaque module en cours de route.",
      },
    ],
  },
};

/* ------------------------------------------------------------------------ */
/* TRANSPORT                                                                 */
/* ------------------------------------------------------------------------ */

/*
 * HYPOTHÈSES DU CALCUL TRANSPORT : 45 ordres par jour, 4 minutes de ressaisie
 * par ordre, 220 jours ouvrés, 35 € de l'heure chargée. Base différente de
 * celle du BTP (à l'ordre et au jour, et non à la personne et à la semaine) :
 * le calcul suit l'unité de travail du métier.
 */
const TR_ORDRES_JOUR = 45;
const TR_MINUTES_ORDRE = 4;
const TR_JOURS = 220;
const TR_COUT_HORAIRE = 35;
const TR_HEURES_JOUR = (TR_ORDRES_JOUR * TR_MINUTES_ORDRE) / 60;
const TR_HEURES_AN = TR_HEURES_JOUR * TR_JOURS;
const TR_COUT_AN = TR_HEURES_AN * TR_COUT_HORAIRE;

const pageTransport: PageSecteur = {
  slug: "transport",
  chemin: cheminSecteur("transport"),
  seo: {
    titre: "Logiciel de gestion de transport (TMS) · Eliott Bouquerel",
    description: `TMS sur mesure pour votre entreprise de transport routier : ordres, tournées, CMR, preuves de livraison, facturation. Prix : ${fourchette("logiciel", " HT")}.`,
  },
  h1: "Logiciel de gestion de transport",
  resume: `Un logiciel de gestion de transport sur mesure, ou TMS, reçoit tes ordres de transport, organise les tournées, suit chaque livraison jusqu’à la preuve signée et prépare la facture. Il vise les PME du transport routier que les mails et les tableurs ne suivent plus. Son prix va ${fourchette("logiciel", " HT")}, selon le nombre de modules.`,
  marcheFilAriane: "Transport",
  libelleLien: "logiciel de gestion de transport",
  noteLlms:
    "TMS sur mesure pour les PME du transport routier : ordres de transport, tournées, lettres de voiture et CMR, facturation",
  sections: [
    {
      id: "metier",
      titre: "De l’ordre de transport à la facture, 4 ressaisies",
      paragraphes: [
        "Un ordre arrive par mail, par téléphone ou dans le fichier d’un chargeur. L’exploitant le recopie dans le planning, le planning part au conducteur par message, la lettre de voiture se remplit à la main, et la preuve de livraison revient en photo ou en papier froissé le lendemain.",
        "En fin de mois, la facturation reprend tout : le poids, les palettes, l’attente au quai, la surcharge gazole. Chaque étape recopie la précédente, et chaque copie peut faire tomber une ligne facturable.",
      ],
      points: [
        {
          titre: "Ordres de transport",
          corps:
            "Un format par chargeur, des adresses incomplètes, des créneaux de livraison noyés dans le corps du mail.",
        },
        {
          titre: "Tournées et affrètement",
          corps:
            "L’exploitant arbitre entre tes camions et un confrère affrété de mémoire, sans voir la marge de chaque option.",
        },
        {
          titre: "Lettres de voiture et CMR",
          corps:
            "Un document par envoi, la CMR pour l’international, et les réserves du destinataire à reporter quand il en émet.",
        },
        {
          titre: "POD et litiges",
          corps:
            "Quand la preuve de livraison met une journée à refaire surface, la contestation du client traîne et la facture attend.",
        },
        {
          titre: "Facturation et indexation gazole",
          corps:
            "Des grilles au poids, à la palette ou au mètre de plancher, des prestations annexes, et une surcharge gazole recalculée selon la clause de chaque contrat.",
        },
        {
          titre: "Conducteurs et temps de service",
          corps:
            "Les heures de conduite, de travail et de repos à rapprocher des tournées prévues, sans reprendre à la main les fichiers du chronotachygraphe.",
        },
      ],
    },
    {
      id: "modules",
      titre: "Ce que fait ton TMS sur mesure",
      paragraphes: [
        "Un TMS sur mesure suit ton exploitation telle qu’elle tourne : tes chargeurs, tes grilles tarifaires, ton affrètement. Le nombre de modules retenus fixe le forfait.",
        "L’ordre importé ou saisi une seule fois devient la mission du conducteur, puis la ligne de facture, sans nouvelle frappe entre les deux.",
      ],
      points: [
        {
          titre: "Prise d’ordres",
          corps:
            "L’import des fichiers de tes chargeurs, ou la saisie par tes clients sur un espace à leur nom, avec contrôle des adresses et des créneaux.",
        },
        {
          titre: "Planning et tournées",
          corps:
            "Le planning par camion et par conducteur, un ordre glissé d’une tournée à l’autre, et l’affrètement à un confrère avec sa marge affichée.",
        },
        {
          titre: "Application conducteur",
          corps:
            "La mission sur le téléphone, la signature du destinataire, les photos et les réserves, et le POD renvoyé au bureau dès la remise.",
        },
        {
          titre: "Documents de transport",
          corps:
            "Lettre de voiture et CMR produites depuis l’ordre, prêtes à imprimer, puis archivées avec la preuve de livraison.",
        },
        {
          titre: "Facturation transport",
          corps:
            "Tarifs au poids, à la palette, au mètre de plancher ou au forfait, indexation gazole appliquée, factures regroupées par client en fin de mois.",
        },
      ],
    },
    {
      id: "calcul",
      titre: "Le prix d’une ressaisie de 4 minutes",
      paragraphes: [
        `Prends une exploitation qui reçoit ${TR_ORDRES_JOUR} ordres de transport par jour. Recopier un ordre du mail vers le planning, puis vers la lettre de voiture et la facture, prend ${TR_MINUTES_ORDRE} minutes au total. La ressaisie occupe ${TR_HEURES_JOUR} heures par jour, soit ${TR_HEURES_AN} heures sur ${TR_JOURS} jours ouvrés.`,
        `À ${euros(TR_COUT_HORAIRE)} l’heure chargée, elle coûte ${euros(TR_COUT_AN)} par an, sans compter les lignes oubliées à la facturation. ${LE_LOGICIEL.nom} coûte ${prixPack(LE_LOGICIEL)} HT, payé une fois. Remplace ces hypothèses par tes chiffres : si le résultat tombe loin sous le prix du forfait, garde tes outils actuels.`,
      ],
      points: [
        {
          titre: `Hypothèse 1 : ${TR_ORDRES_JOUR} ordres par jour`,
          corps:
            "Pour trouver le tien, compte les ordres d’une semaine ordinaire et divise par 5.",
        },
        {
          titre: `Hypothèse 2 : ${TR_MINUTES_ORDRE} minutes par ordre`,
          corps:
            "La saisie dans le planning, la reprise sur la lettre de voiture, puis la ligne de facture en fin de mois.",
        },
        {
          titre: `Hypothèse 3 : ${euros(TR_COUT_HORAIRE)} l’heure`,
          corps:
            "Le salaire chargé d’un exploitant ou d’une assistante d’exploitation, avec les frais de son poste de travail.",
        },
        {
          titre: `Hypothèse 4 : ${TR_JOURS} jours ouvrés`,
          corps: "Une année sans les week-ends, les jours fériés ni les congés.",
        },
      ],
    },
    {
      id: "marche",
      titre: "TMS du marché ou TMS sur mesure ?",
      paragraphes: [
        "Les éditeurs de TMS couvrent bien le cas général, sur abonnement : ordres, planning, documents de transport, facturation. Pour une flotte en lot complet ou en messagerie classique, avec des chargeurs qui envoient des ordres propres, un TMS du marché fait le travail et démarre plus vite qu’un développement.",
        "Le sur mesure prend le relais quand ton exploitation a ses propres règles, ou quand ton TMS tient l’essentiel et qu’une partie de ta journée se passe encore dans des tableurs à côté.",
      ],
      liens: {
        titre: "Pour comparer",
        items: [
          {
            libelle: "Outil sur mesure ou abonnements SaaS",
            href: CHEMIN_ARTICLE_SAAS,
            description:
              "Avant de payer une licence de plus par camion ou par poste.",
          },
        ],
      },
      points: [
        {
          titre: "Un TMS du marché suffit",
          corps:
            "Des règles de tarification courantes, peu d’échanges de fichiers avec tes chargeurs, et une équipe prête à suivre les écrans de l’éditeur.",
        },
        {
          titre: "Le sur mesure se justifie",
          corps:
            "Des chargeurs qui imposent leur format, une activité mixte entre transport et entreposage, ou une tarification que ton TMS ne sait pas calculer.",
        },
        {
          titre: "Garder ton TMS",
          corps: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, branche la pièce manquante sur ton TMS actuel : l’import des ordres d’un gros chargeur, ou le calcul de l’indexation gazole.`,
        },
        {
          titre: "Ton outil, tes données",
          corps:
            "Une fois livré, le logiciel t’appartient : code, base et hébergement. Aucune licence par camion ni par utilisateur ne s’ajoute quand la flotte grandit.",
        },
      ],
    },
    {
      id: "methode",
      titre: "La méthode, appliquée à ton exploitation",
      paragraphes: [
        "Je commence par relever où l’information se perd : quel ordre a été retapé, quelle ligne a sauté de la facture, quel POD a manqué. C’est la méthode suivie chez Würth France, dans un autre secteur, la distribution, sur un parcours de création de compte : −92 % d’erreurs, mesuré en interne.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Les forfaits de la solution métier",
            href: CHEMIN_PILIER,
            description: "Ce que contient chaque forfait, ligne à ligne, et son prix.",
          },
          {
            libelle: "Le cas Würth France",
            href: CHEMIN_WURTH,
            description:
              "Un formulaire repris en partant des erreurs réellement commises.",
          },
          {
            libelle: "Réserver un appel",
            href: "#rendez-vous",
            description: "Un créneau en visio pour parler de ton exploitation.",
          },
        ],
      },
      points: [
        {
          titre: "1. Un premier appel en visio",
          corps:
            "Sans frais. En réservant, tu réponds à 3 questions, budget, objectif et échéance, et je te dis pendant l’appel ce que ton budget couvre.",
        },
        {
          titre: "2. Un devis présenté à 2",
          corps:
            "Il ne part jamais seul par e-mail : je te le présente lors d’un second rendez-vous, avec les modules, le prix ferme et la date de mise en ligne.",
        },
        {
          titre: "3. Des modules testés sur de vrais ordres",
          corps:
            "Un seul projet à la fois. Chaque module arrive sur une adresse en ligne, et ton équipe d’exploitation l’essaie sur ses ordres du jour avant la livraison.",
        },
        {
          titre: "4. Un logiciel à ton nom",
          corps:
            "Code dans ton dépôt, hébergement à ton nom, documentation remise : tu changes de prestataire quand tu le décides.",
        },
      ],
    },
  ],
  calcul: {
    heuresParAn: TR_HEURES_AN,
    coutHoraire: TR_COUT_HORAIRE,
    coutAnnuel: TR_COUT_AN,
  },
  titrePacks: "Prix d’un TMS sur mesure, en 3 forfaits",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Ton TMS", "sur mesure."],
    items: [
      {
        question: "Combien coûte un TMS sur mesure ?",
        answer: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, règle une tâche, comme l’import des ordres d’un chargeur. ${LE_LOGICIEL.nom}, à ${prixPack(LE_LOGICIEL)} HT, réunit jusqu’à 3 modules : prise d’ordres, planning, facturation. ${PLATEFORME.nom} commence à ${prixPack(PLATEFORME)} HT, quand le TMS dialogue dans les 2 sens avec tes autres systèmes.`,
      },
      {
        question: "Le logiciel peut-il importer les ordres de mes clients ?",
        answer: `Oui, quand le chargeur envoie un fichier ou dispose d’une interface d’échange : chaque format compte comme un raccordement, et ${LE_LOGICIEL.nom} en inclut 2. Un ordre rédigé en texte libre passe par un formulaire qui contrôle adresses et créneaux.`,
      },
      {
        question: "Mes conducteurs devront-ils installer une application ?",
        answer:
          "Non. La mission s’ouvre depuis un lien, dans le navigateur du téléphone : signature du destinataire, photos, réserves. Pour les zones sans réseau, je prévois au devis un envoi différé : la preuve part dès que le téléphone capte.",
      },
      {
        question: "Le TMS calcule-t-il l’indexation gazole ?",
        answer:
          "Oui. Tu saisis pour chaque contrat l’indice de référence et la part du gazole dans le prix, et le logiciel recalcule la surcharge à chaque nouvelle valeur de l’indice, puis l’ajoute aux factures concernées.",
      },
      {
        question: "As-tu déjà développé un TMS ?",
        answer:
          "Non, pas pour une entreprise de transport. Le projet que je peux te montrer chiffres à l’appui vient de la distribution : le parcours de création de compte de l’eShop de Würth France. J’en apporte la manière de faire : relever où l’information se perd, construire module par module, tester sur de vrais ordres.",
      },
    ],
  },
};

/** Toutes les pages secteur, dans l'ordre où la page pilier les liste. */
export const pagesSecteur: readonly PageSecteur[] = [pageBtp, pageTransport];

/** Résolution par slug. `undefined` plutôt qu'une exception : la route 404. */
export const pageSecteur = (slug: string): PageSecteur | undefined =>
  pagesSecteur.find((p) => p.slug === slug);

/** Amorce de la liste des pages secteur, sous les forfaits de la page pilier. */
export const avantLiensSecteur = "Par métier :";
