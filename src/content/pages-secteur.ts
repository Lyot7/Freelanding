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
 * AJOUTER UN SECTEUR (maintenance, agroalimentaire) : un objet de plus dans
 * `pagesSecteur`, et son slug dans `SecteurSlug`. La route, le sitemap,
 * `llms.txt` et le lien depuis la page pilier en sont dérivés.
 *
 * LOCATION DE MATÉRIEL ET NÉGOCE (lot 3, 2026-10-02). Pour la location, comme
 * pour le BTP et le transport, Eliott n'a aucun client : Würth y reste un
 * autre secteur. Pour le négoce, Würth France EST la distribution : la page le
 * présente comme une preuve directe, avec le seul chiffre de `work.ts`.
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

export type SecteurSlug =
  | "btp"
  | "transport"
  | "location-materiel"
  | "negoce-distribution";

/**
 * LA PAGE DE PRIX DE LA SOLUTION MÉTIER. Son chemin est composé ici, et non
 * dans `page-prix-logiciel.ts`, parce que chaque page secteur la lie : la page
 * de prix importe déjà ce fichier, l'inverse ferait une boucle d'imports.
 */
export const CHEMIN_PRIX_LOGICIEL = `${CHEMIN_PILIER}/prix`;

/** Le lien vers la page de prix, posé dans la méthode de chaque secteur. */
const LIEN_PRIX: LienLocal = {
  libelle: "Le prix d’un logiciel sur mesure",
  href: CHEMIN_PRIX_LOGICIEL,
  description:
    "Ce qui fait varier le prix, et la comparaison avec un abonnement sur 3 ans.",
};

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
  /**
   * Ce que la page couvre, en une phrase : la description du lien posé vers
   * elle depuis la page de Caen et la page de prix.
   */
  readonly accroche: string;
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
  accroche: "Devis, situations de travaux et pointage des équipes.",
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
          LIEN_PRIX,
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
  accroche: "Ordres, tournées, preuves de livraison et facturation.",
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
          LIEN_PRIX,
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

/* ------------------------------------------------------------------------ */
/* LOCATION DE MATÉRIEL                                                      */
/* ------------------------------------------------------------------------ */

/*
 * HYPOTHÈSES DU CALCUL LOCATION : 24 mouvements par jour (départs et retours),
 * 5 minutes de ressaisie par mouvement, 250 jours d'ouverture, 34 € de l'heure
 * chargée. L'unité est le mouvement de machine, celle du dépôt.
 */
const LOC_MOUVEMENTS_JOUR = 24;
const LOC_MINUTES = 5;
const LOC_JOURS = 250;
const LOC_COUT_HORAIRE = 34;
const LOC_HEURES_AN = ((LOC_MOUVEMENTS_JOUR * LOC_MINUTES) / 60) * LOC_JOURS;
const LOC_COUT_AN = LOC_HEURES_AN * LOC_COUT_HORAIRE;

const pageLocation: PageSecteur = {
  slug: "location-materiel",
  chemin: cheminSecteur("location-materiel"),
  seo: {
    titre: "Logiciel de gestion location de matériel · Eliott Bouquerel",
    description: `Logiciel de location de matériel sur mesure : votre parc, vos contrats, disponibilités, états des lieux et facturation. Prix : ${fourchette("logiciel", " HT")}.`,
  },
  h1: "Logiciel de gestion de location de matériel",
  resume: `Un logiciel de gestion de location de matériel sur mesure suit ton parc machine par machine, te dit ce qui est disponible demain, et édite le contrat, l’état des lieux et la facture à la journée. Il vise les loueurs et les entreprises de BTP ou de TP qui gèrent leur parc sur un tableur ou un planning mural. Compte ${fourchette("logiciel", " HT")} selon les modules retenus.`,
  marcheFilAriane: "Location de matériel",
  libelleLien: "logiciel de gestion de location de matériel",
  noteLlms:
    "logiciel de gestion de location de matériel sur mesure : parc, contrats, disponibilités, états des lieux, maintenance préventive, facturation à la journée",
  accroche: "Parc, contrats, états des lieux et facturation à la journée.",
  sections: [
    {
      id: "metier",
      titre: "Quand le planning mural ne suit plus le parc",
      paragraphes: [
        "Chez un loueur, une même machine change de mains plusieurs fois par mois. Le commercial la réserve au téléphone, le dépôt la prépare, le chauffeur la livre sur le chantier, le client prolonge d’une semaine par SMS, puis elle revient avec des heures au compteur, des rayures et un réservoir à moitié vide. Chaque étape laisse sa trace sur un support différent : planning mural, carnet de bons, tableur, photos dans un téléphone.",
        "Le jour où 2 commerciaux promettent la même minipelle pour le lundi, ou qu’une prolongation n’arrive jamais sur la facture, tu paies le prix de ces supports qui ne se parlent pas.",
      ],
      points: [
        {
          titre: "Disponibilités",
          corps:
            "Savoir si une nacelle est libre du 12 au 19 oblige à appeler le dépôt, qui regarde le planning, puis la cour.",
        },
        {
          titre: "Contrats et prolongations",
          corps:
            "Un contrat signé sur papier, une prolongation accordée au téléphone, un retour anticipé : la facture part sur la durée prévue au lieu de la durée réelle.",
        },
        {
          titre: "États des lieux",
          corps:
            "Les photos du départ restent dans le téléphone du chauffeur. Au retour, la casse se discute sans preuve, et la franchise ne se refacture pas.",
        },
        {
          titre: "Entretien du parc",
          corps:
            "Vidanges et révisions dépendent du compteur d’heures, que personne ne relève tant que la machine travaille dehors.",
        },
      ],
    },
    {
      id: "modules",
      titre: "Ce que fait ton logiciel de location",
      paragraphes: [
        "Le logiciel part de ton parc tel qu’il est : tes familles de matériel, tes numéros de série, tes tarifs à la journée, à la semaine et au mois, tes conditions par client. Tu choisis les modules, et leur nombre fixe le forfait.",
        "Chaque mouvement alimente le suivant : la réservation bloque la machine sur le planning, le départ ouvre le contrat, le retour clôt la période facturée et relève le compteur qui déclenche l’entretien.",
      ],
      points: [
        {
          titre: "Planning du parc",
          corps:
            "Chaque machine sur sa ligne, réservée, sortie, à l’atelier ou disponible, et la recherche par famille et par dates.",
        },
        {
          titre: "Contrats de location",
          corps:
            "Le contrat édité depuis la réservation, avec ou sans opérateur, signé sur tablette, et ses prolongations rattachées au contrat d’origine.",
        },
        {
          titre: "États des lieux départ et retour",
          corps:
            "Photos, compteur, niveau de carburant et réserves saisis depuis un téléphone, puis comparés au retour sur le même écran.",
        },
        {
          titre: "Facturation à la durée",
          corps:
            "Le tarif dégressif appliqué à la durée réelle, avec tes règles pour les jours non ouvrés, et le carburant, le nettoyage et le transport ajoutés.",
        },
        {
          titre: "Maintenance préventive",
          corps:
            "Les entretiens programmés au compteur d’heures ou à la date, la machine retirée du planning le temps de l’atelier, et l’historique de chaque intervention.",
        },
      ],
    },
    {
      id: "calcul",
      titre: "Les mouvements du dépôt, chiffrés sur une année",
      paragraphes: [
        `Prends un dépôt qui enregistre ${LOC_MOUVEMENTS_JOUR} mouvements par jour, départs et retours confondus. Pour chacun, ${LOC_MINUTES} minutes partent à recopier le bon de sortie, à reporter le compteur et à corriger la durée pour la facture. Sur ${LOC_JOURS} jours d’ouverture, le total atteint ${LOC_HEURES_AN} heures par an.`,
        `À ${euros(LOC_COUT_HORAIRE)} l’heure, salaire chargé et frais compris, ces heures coûtent ${euros(LOC_COUT_AN)} par an. ${LE_LOGICIEL.nom} coûte ${prixPack(LE_LOGICIEL)} HT, payé une fois. Ces 4 chiffres sont des hypothèses : remplace-les par ceux de ton dépôt.`,
      ],
      points: [
        {
          titre: `Hypothèse 1 : ${LOC_MOUVEMENTS_JOUR} mouvements par jour`,
          corps:
            "Les machines qui sortent du dépôt et celles qui y reviennent, livrées par ton chauffeur ou enlevées par le client.",
        },
        {
          titre: `Hypothèse 2 : ${LOC_MINUTES} minutes par mouvement`,
          corps:
            "Le bon recopié, le compteur et le carburant reportés, la date de retour corrigée dans le tableur.",
        },
        {
          titre: `Hypothèse 3 : ${euros(LOC_COUT_HORAIRE)} l’heure`,
          corps:
            "Le coût complet d’une heure au comptoir ou au dépôt : salaire, charges patronales et frais de structure.",
        },
        {
          titre: `Hypothèse 4 : ${LOC_JOURS} jours par an`,
          corps: "Les jours d’ouverture du dépôt, fermetures et jours fériés retirés.",
        },
      ],
    },
    {
      id: "marche",
      titre: "Sur mesure ou logiciel de location du marché ?",
      paragraphes: [
        "Des éditeurs vendent des logiciels de location complets, souvent pensés pour un type de parc : l’outillage, les engins de TP, l’événementiel. Si ton activité ressemble à celle qu’ils ont modélisée, commence par eux : la mise en place est rapide et l’abonnement reste lisible.",
        "Le sur mesure prend le relais quand tes règles sortent de leurs paramètres : un parc partagé entre la location et tes propres chantiers, des tarifs négociés par client, ou des compteurs déjà relevés par un boîtier télématique qu’il faut faire entrer dans le planning.",
      ],
      liens: {
        titre: "Pour trancher",
        items: [
          {
            libelle: "Outil sur mesure ou abonnements SaaS",
            href: CHEMIN_ARTICLE_SAAS,
            description:
              "Comparer un abonnement par utilisateur et un outil qui t’appartient.",
          },
        ],
      },
      points: [
        {
          titre: "Le logiciel du marché suffit",
          corps:
            "Un seul dépôt, un parc homogène, des tarifs publics et des contrats types.",
        },
        {
          titre: "Le sur mesure se justifie",
          corps:
            "Plusieurs dépôts, du matériel loué avec opérateur, de la sous-location chez des confrères, ou un parc qui sert aussi tes chantiers.",
        },
        {
          titre: "Entre les deux",
          corps: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, ajoute à ton outil actuel la pièce qui lui manque : l’état des lieux photo sur téléphone, ou le relevé de compteurs qui déclenche l’entretien.`,
        },
      ],
    },
    {
      id: "methode",
      titre: "Le projet, du premier appel à la première location",
      paragraphes: [
        "Je commence par suivre une machine sur toute sa boucle, de la réservation à la facture, en notant chaque endroit où l’information est recopiée. Chez Würth France, dans la distribution de fournitures professionnelles, ce relevé appliqué au parcours de création de compte a conduit à −92 % d’erreurs, mesuré en interne.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "La solution métier",
            href: CHEMIN_PILIER,
            description: "Les 3 forfaits et la liste de ce que chacun contient.",
          },
          LIEN_PRIX,
          {
            libelle: "Le projet Würth France",
            href: CHEMIN_WURTH,
            description:
              "Un parcours de création de compte refait à partir des erreurs relevées.",
          },
          {
            libelle: "Réserver un appel",
            href: "#rendez-vous",
            description: "Choisis un créneau en visio pour parler de ton parc.",
          },
        ],
      },
      points: [
        {
          titre: "1. Un appel en visio",
          corps:
            "Gratuit. Tu me décris ton parc, ton dépôt et ta façon de facturer, et je te dis dès l’appel quel forfait y correspond.",
        },
        {
          titre: "2. Un devis à prix ferme",
          corps:
            "Les modules, le prix et la date de mise en service, présentés lors d’un second rendez-vous et écrits avant toute signature.",
        },
        {
          titre: "3. Testé sur tes vraies machines",
          corps:
            "Chaque module arrive sur une adresse en ligne. Ton équipe de dépôt l’essaie sur de vrais départs avant la mise en service.",
        },
        {
          titre: "4. À ton nom",
          corps:
            "Le code dans ton dépôt Git, l’hébergement à ton nom, et une documentation qu’un autre développeur sait reprendre.",
        },
      ],
    },
  ],
  calcul: {
    heuresParAn: LOC_HEURES_AN,
    coutHoraire: LOC_COUT_HORAIRE,
    coutAnnuel: LOC_COUT_AN,
  },
  titrePacks: "Prix d’un logiciel de location, en 3 forfaits",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Ton logiciel", "de location."],
    items: [
      {
        question: "Combien coûte un logiciel de gestion de location de matériel ?",
        answer: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, règle une tâche, par exemple l’état des lieux photo. ${LE_LOGICIEL.nom}, à ${prixPack(LE_LOGICIEL)} HT, couvre jusqu’à 3 modules, comme le planning du parc, les contrats et la facturation. ${PLATEFORME.nom} commence à ${prixPack(PLATEFORME)} HT, pour plusieurs dépôts ou plusieurs systèmes à accorder entre eux.`,
      },
      {
        question: "Le logiciel gère-t-il les tarifs dégressifs et les prolongations ?",
        answer:
          "Oui. Tu poses tes grilles à la journée, à la semaine et au mois, et tes remises par client. Une prolongation s’ajoute au contrat en cours, et la facture reprend la durée réelle sans ressaisie.",
      },
      {
        question: "Peut-on signer le contrat et faire l’état des lieux sur une tablette ?",
        answer:
          "Oui, dans le navigateur de la tablette ou du téléphone, sans application à installer. Photos, compteur, carburant et signature du client s’enregistrent sur le contrat. Si ton dépôt ou tes chantiers captent mal, la saisie hors connexion entre au devis.",
      },
      {
        question: "Le logiciel peut-il suivre l’entretien de mes engins ?",
        answer:
          "Oui, avec le module de maintenance. Chaque machine porte ses entretiens, déclenchés par le compteur d’heures ou par une date, et ses vérifications périodiques avec leurs rapports. Une machine à l’atelier sort du planning de location jusqu’à sa remise en service.",
      },
      {
        question: "As-tu déjà travaillé pour un loueur de matériel ?",
        answer:
          "Non, pas encore. Le projet que je peux te montrer chiffres à l’appui vient de la distribution : le parcours de création de compte de l’eShop de Würth France. J’en reprends la méthode : observer le terrain avant de coder, livrer module par module, faire tester par ceux qui s’en servent.",
      },
    ],
  },
};

/* ------------------------------------------------------------------------ */
/* NÉGOCE ET DISTRIBUTION                                                    */
/* ------------------------------------------------------------------------ */

/*
 * HYPOTHÈSES DU CALCUL NÉGOCE : 90 lignes de devis et de commande par jour,
 * 2 minutes de recherche par ligne (remise, prix net, stock d'un autre dépôt),
 * 225 jours ouvrés, 38 € de l'heure chargée. L'unité est la ligne de vente,
 * celle du comptoir.
 */
const NEG_LIGNES_JOUR = 90;
const NEG_MINUTES_LIGNE = 2;
const NEG_JOURS = 225;
const NEG_COUT_HORAIRE = 38;
const NEG_HEURES_AN = ((NEG_LIGNES_JOUR * NEG_MINUTES_LIGNE) / 60) * NEG_JOURS;
const NEG_COUT_AN = NEG_HEURES_AN * NEG_COUT_HORAIRE;

const pageNegoce: PageSecteur = {
  slug: "negoce-distribution",
  chemin: cheminSecteur("negoce-distribution"),
  seo: {
    titre: "Logiciel de gestion de négoce sur mesure · Eliott Bouquerel",
    description: `Logiciel de négoce sur mesure pour votre distribution : stock, tarifs clients, remises, comptoir, reliquats, achats. Prix : ${fourchette("logiciel", " HT")}.`,
  },
  h1: "Logiciel de gestion de négoce",
  resume: `Un logiciel de gestion de négoce sur mesure réunit ton stock, tes tarifs clients, tes commandes et tes achats fournisseurs dans un seul outil, comptoir compris. Il s’adresse aux négociants et aux distributeurs techniques dont l’ERP ne suit plus les conditions commerciales, ou qui travaillent encore sur tableur. Son prix va ${fourchette("logiciel", " HT")}.`,
  marcheFilAriane: "Négoce et distribution",
  libelleLien: "logiciel de gestion de négoce",
  noteLlms:
    "logiciel de gestion de négoce et de distribution technique sur mesure : stock multi-dépôts, tarifs clients et remises, comptoir, reliquats, achats fournisseurs",
  accroche: "Tarifs clients, comptoir, stock multi-dépôts et reliquats.",
  sections: [
    {
      id: "metier",
      titre: "Quand chaque client a son prix",
      paragraphes: [
        "Dans le négoce, la marge tient dans les conditions commerciales : un tarif fournisseur qui change 2 fois par an, des remises par famille de produits, des prix nets négociés avec les gros comptes. Quand ces règles vivent dans la tête des commerciaux et dans un tableur à côté de l’ERP, chaque devis commence par une recherche.",
        "Au comptoir, la question est plus courte et plus pressante : le produit est-il en stock, dans quel dépôt, et à quel prix pour ce client ? Chaque minute de recherche fait attendre un artisan qui a un chantier en cours.",
      ],
      points: [
        {
          titre: "Tarifs et remises",
          corps:
            "Le tarif fournisseur à jour, la remise de la famille, le prix net du client : 3 sources à recouper avant de chiffrer une ligne.",
        },
        {
          titre: "Stock multi-dépôts",
          corps:
            "Le stock affiché ignore les commandes en préparation et les transferts entre dépôts, et la rupture se découvre au moment de préparer.",
        },
        {
          titre: "Reliquats",
          corps:
            "Une commande livrée en partie laisse un reliquat que personne ne relance, jusqu’au coup de fil du client.",
        },
        {
          titre: "Achats fournisseurs",
          corps:
            "Les seuils de réapprovisionnement se fixent à l’œil, les accusés de réception arrivent par mail, et le prix d’achat réel n’atteint jamais la fiche produit.",
        },
      ],
    },
    {
      id: "modules",
      titre: "Ce que fait ton logiciel de négoce",
      paragraphes: [
        "Le logiciel reprend ton catalogue, tes familles de produits, tes dépôts et tes conditions par client, tels que tu les pratiques. Tu retiens les modules qui te coûtent le plus aujourd’hui, et leur nombre décide du forfait.",
        "Une condition saisie une fois s’applique partout : le prix calculé au devis est celui de la commande, du bon de livraison et de la facture, et chaque vente décompte le stock du bon dépôt.",
      ],
      points: [
        {
          titre: "Tarifs clients",
          corps:
            "Tarifs fournisseurs importés, coefficients de vente, remises par famille et prix nets par client, appliqués à la ligne sans calcul à la main.",
        },
        {
          titre: "Devis et commandes",
          corps:
            "Le devis transformé en commande en un clic, les reliquats suivis ligne par ligne, et l’accusé de réception envoyé au client.",
        },
        {
          titre: "Vente au comptoir",
          corps:
            "Un écran de vente rapide : recherche par référence ou par désignation, stock de chaque dépôt, prix du client, bon de livraison imprimé.",
        },
        {
          titre: "Stock et dépôts",
          corps:
            "Le stock physique, réservé et disponible, les transferts entre dépôts et les inventaires tournants.",
        },
        {
          titre: "Achats et réapprovisionnement",
          corps:
            "Les propositions de commande calculées depuis les ventes et les seuils, et les réceptions rapprochées des commandes fournisseurs.",
        },
        {
          titre: "Espace client professionnel",
          corps:
            "Tes clients consultent leurs prix, leurs commandes et leurs factures en ligne, et commandent sans appeler le comptoir.",
        },
      ],
    },
    {
      id: "calcul",
      titre: "La recherche de prix, chiffrée sur une année",
      paragraphes: [
        `Prends une équipe de vente qui saisit ${NEG_LIGNES_JOUR} lignes de devis et de commande par jour. Pour chaque ligne, ${NEG_MINUTES_LIGNE} minutes partent à retrouver la remise du client dans un tableur, à vérifier le stock d’un autre dépôt ou à recalculer un prix net. Sur ${NEG_JOURS} jours ouvrés, le total atteint ${NEG_HEURES_AN} heures par an.`,
        `À ${euros(NEG_COUT_HORAIRE)} l’heure, salaire chargé et frais compris, ces heures coûtent ${euros(NEG_COUT_AN)} par an. ${LE_LOGICIEL.nom} coûte ${prixPack(LE_LOGICIEL)} HT, payé une fois. Ces 4 chiffres sont des hypothèses : mets les tiens à leur place avant de conclure.`,
      ],
      points: [
        {
          titre: `Hypothèse 1 : ${NEG_LIGNES_JOUR} lignes par jour`,
          corps:
            "Les lignes de devis et de commande saisies par le comptoir et par les commerciaux sédentaires.",
        },
        {
          titre: `Hypothèse 2 : ${NEG_MINUTES_LIGNE} minutes par ligne`,
          corps:
            "Le temps de retrouver la bonne condition commerciale et de confirmer la disponibilité.",
        },
        {
          titre: `Hypothèse 3 : ${euros(NEG_COUT_HORAIRE)} l’heure`,
          corps:
            "Le coût complet d’une heure de vendeur : salaire, charges patronales et frais de structure.",
        },
        {
          titre: `Hypothèse 4 : ${NEG_JOURS} jours par an`,
          corps: "Les jours ouvrés, une fois retirés les congés et les jours fériés.",
        },
      ],
    },
    {
      id: "marche",
      titre: "Sur mesure ou ERP négoce du marché ?",
      paragraphes: [
        "Les ERP pour le négoce couvrent la gestion commerciale, le stock, les achats et la comptabilité, avec des années de cas particuliers derrière eux. Si tu démarres ou si tes conditions restent classiques, un ERP du marché te coûtera moins cher qu’un développement.",
        "Le sur mesure trouve souvent sa place autour de l’ERP : le portail de commande que tes clients attendent, le calcul de prix que l’ERP ne sait pas faire, la liaison avec la plateforme d’un fournisseur. Ton ERP garde la comptabilité, et le module développé échange avec lui.",
      ],
      liens: {
        titre: "Pour trancher",
        items: [
          {
            libelle: "Outil sur mesure ou abonnements SaaS",
            href: CHEMIN_ARTICLE_SAAS,
            description:
              "Mettre en face un abonnement par utilisateur et un outil à toi.",
          },
          {
            libelle: "Synchroniser catalogue, stock et commandes",
            href: "/blog/synchroniser-catalogue-stock-et-commandes",
            description:
              "Quand le site, l’ERP et le stock doivent rester d’accord.",
          },
        ],
      },
      points: [
        {
          titre: "L’ERP du marché suffit",
          corps:
            "Un seul dépôt, des tarifs fournisseurs standards, des remises simples et peu de vente en ligne.",
        },
        {
          titre: "Le sur mesure se justifie",
          corps:
            "Des conditions par client et par famille que l’ERP gère mal, plusieurs dépôts, ou des clients professionnels qui veulent commander en ligne à leur prix.",
        },
        {
          titre: "Entre les deux",
          corps: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, relie ton ERP à ce qui lui manque : l’import automatique d’un tarif fournisseur, ou un écran de comptoir plus rapide.`,
        },
      ],
    },
    {
      id: "methode",
      titre: "Le projet, du premier appel au premier bon de livraison",
      paragraphes: [
        "Würth France distribue des fournitures aux professionnels. En 2024, j’y ai refait le parcours de création de compte de l’eShop : relevé des erreurs réellement commises, contraintes affichées avant la saisie, SIRET vérifié auprès des données de l’INSEE. Résultat : −92 % d’erreurs à la création de compte, mesuré en interne.",
        "Ton logiciel de négoce se construit de la même façon : je cherche où l’erreur naît avant de dessiner un écran.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Le projet Würth France",
            href: CHEMIN_WURTH,
            description:
              "Le parcours de création de compte de l’eShop, expliqué de bout en bout.",
          },
          {
            libelle: "La solution métier en 3 forfaits",
            href: CHEMIN_PILIER,
            description: "Ce que chaque forfait ajoute au précédent, et son prix.",
          },
          LIEN_PRIX,
          {
            libelle: "Réserver un appel",
            href: "#rendez-vous",
            description: "Choisis un créneau en visio pour parler de ton comptoir.",
          },
        ],
      },
      points: [
        {
          titre: "1. Un appel en visio",
          corps:
            "Gratuit. Tu me montres ton écran de commande et tes grilles de remises, et je te dis dès l’appel ce que ton budget permet.",
        },
        {
          titre: "2. Le devis, prix ferme compris",
          corps:
            "Présenté lors d’un second rendez-vous : les modules, les raccordements à ton ERP ou à ta comptabilité, le prix et la date de mise en ligne.",
        },
        {
          titre: "3. Testé sur de vraies commandes",
          corps:
            "Chaque module arrive sur une adresse en ligne. Ton comptoir le compare à l’outil actuel sur des commandes réelles avant la bascule.",
        },
        {
          titre: "4. Livré avec ses règles écrites",
          corps:
            "Le code et la base t’appartiennent dès la livraison, et la documentation décrit chaque règle de prix pour qu’un autre développeur puisse reprendre.",
        },
      ],
    },
  ],
  calcul: {
    heuresParAn: NEG_HEURES_AN,
    coutHoraire: NEG_COUT_HORAIRE,
    coutAnnuel: NEG_COUT_AN,
  },
  titrePacks: "Prix d’un logiciel de négoce, en 3 forfaits",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Ton logiciel", "de distribution."],
    items: [
      {
        question: "Combien coûte un logiciel de gestion de négoce sur mesure ?",
        answer: `${OUTIL.nom}, à ${prixPack(OUTIL)} HT, règle une tâche, comme l’import des tarifs fournisseurs. ${LE_LOGICIEL.nom}, à ${prixPack(LE_LOGICIEL)} HT, réunit jusqu’à 3 modules, par exemple tarifs clients, commandes et stock. ${PLATEFORME.nom} démarre à ${prixPack(PLATEFORME)} HT, quand le logiciel doit rester d’accord avec ton ERP, ta comptabilité et ton site dans les 2 sens.`,
      },
      {
        question: "Faut-il remplacer mon ERP ?",
        answer:
          "Pas forcément. Si ton ERP tient correctement la comptabilité et le stock, je développe la partie qui manque et je la raccorde à lui.",
      },
      {
        question: "Le logiciel gère-t-il les remises en cascade et les prix nets ?",
        answer:
          "Oui. Tu fixes l’ordre d’application : tarif de base, remise de la famille, remise du client, puis le prix net négocié qui prend le dessus. Chaque ligne affiche le détail du calcul, et le commercial voit sa marge avant de valider.",
      },
      {
        question: "Mes clients pourront-ils commander en ligne à leur prix ?",
        answer:
          "Oui, avec le module d’espace client : chaque compte professionnel voit ses prix, le stock disponible et ses commandes en cours, reliquats compris. La commande arrive dans le logiciel sans ressaisie.",
      },
      {
        question: "As-tu déjà travaillé dans la distribution ?",
        answer:
          "Oui. En 2024, chez Würth France, distributeur de fournitures pour les professionnels, j’ai refait le parcours de création de compte de l’eShop : −92 % d’erreurs, mesuré en interne. Je n’ai pas encore développé de logiciel de gestion complet pour un négociant.",
      },
    ],
  },
};

/** Toutes les pages secteur, dans l'ordre où la page pilier les liste. */
export const pagesSecteur: readonly PageSecteur[] = [
  pageBtp,
  pageTransport,
  pageLocation,
  pageNegoce,
];

/** Résolution par slug. `undefined` plutôt qu'une exception : la route 404. */
export const pageSecteur = (slug: string): PageSecteur | undefined =>
  pagesSecteur.find((p) => p.slug === slug);

/** Amorce de la liste des pages secteur, sous les forfaits de la page pilier. */
export const avantLiensSecteur = "Par métier :";
