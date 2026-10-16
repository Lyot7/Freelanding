/**
 * PAGE LOCALE `/creation-site-internet-caen`.
 *
 * POURQUOI CETTE ADRESSE, ET PAS UNE AUTRE. Elle est reprise telle quelle de
 * l'ancien site SvelteKit, où elle portait la requête « création site internet
 * Caen ». Garder le chemin conserve ce que Google en a déjà indexé, sans
 * redirection. `/developpeur-web-caen`, l'autre page locale de l'ancien site,
 * y est redirigée en 301 (voir `next.config.ts`) : deux pages locales sur la
 * même ville se seraient disputé la même requête.
 *
 * CE QUE LA PAGE REPREND DE `/services/site-vitrine` : le gabarit, l'offre et
 * son plancher calculé, le bloc sur devis, la prise de rendez-vous. Ce qu'elle ajoute est local : le contexte des
 * entreprises de Caen et du Calvados, une FAQ locale, et un fil d'Ariane qui la
 * range SOUS le site vitrine.
 *
 * CE QUI N'Y FIGURE PAS, VOLONTAIREMENT :
 *   - aucune promesse de rendez-vous sur place ni de déplacement : tous les
 *     rendez-vous se font en visio. L'ancienne page promettait « un rendez-vous
 *     sur place », elle ne le reprend pas ;
 *   - aucune adresse postale : le site publie une zone d'intervention
 *     (Calvados, Manche, Orne), celle de la fiche Google. En inventer une
 *     casserait l'alignement NAP décrit dans `site.ts` ;
 *   - aucun client, aucun chiffre, aucun témoignage : il n'y en a pas de
 *     caennais à citer.
 *
 * LES PRIX NE S'ÉCRIVENT PAS ICI, ils se calculent (`aPartirDe`, `prixPlancher`),
 * comme partout ailleurs sur le site. Le repère d'agence aussi (`offre.ts`) :
 * sa source et sa date sont citées, le lien est sur la page de prix.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott.
 */
import type { FaqItem, ImageHero } from "@/lib/content/types";
import {
  aPartirDe,
  euros,
  prestation,
  prixPlancher,
  repereAgenceSite,
} from "./offre";
import type { SectionSecteur } from "./pages-secteur";

const VITRINE = prestation("vitrine");

export const CHEMIN_PAGE_CAEN = "/creation-site-internet-caen";

/**
 * La page locale de la solution métier (`page-logiciel-caen.ts`). Son chemin
 * vit ici pour que les 2 pages de Caen se lient sans boucle d'imports : ce
 * fichier ne dépend pas de l'autre, l'autre dépend de lui.
 */
export const CHEMIN_PAGE_LOGICIEL_CAEN = "/logiciel-sur-mesure-caen";
/*
 * LIENS VERS LA PAGE DE PRIX ET LES ARTICLES. Le chemin du prix se compose ici
 * au lieu d'être importé de `page-prix-site.ts`, qui importe déjà ce fichier :
 * l'import croisé figerait l'un des deux modules avant son initialisation. Le
 * test vérifie que les deux chemins sont identiques.
 */
const CHEMIN_PRIX_SITE = `/services/${VITRINE.slug}/prix`;
const CHEMIN_ARTICLE_REFONTE = "/blog/refonte-site-internet-pme";
const CHEMIN_ARTICLE_WORDPRESS = "/blog/site-sur-mesure-ou-wordpress";

/** Un lien interne de la page, avec la phrase qui dit où il mène. */
export interface LienLocal {
  readonly libelle: string;
  readonly href: string;
  readonly description: string;
}

/**
 * Contenu d'une page locale rendue par le gabarit de prestation.
 *
 * Le type vit ici plutôt que dans `types.ts` : une seule page l'emploie, et le
 * jour où une deuxième ville s'ajoute, c'est ce fichier qu'on duplique.
 */
export interface PageLocale {
  readonly chemin: string;
  readonly seo: {
    /** Balise `<title>`, marque comprise. 60 caractères, jamais plus. */
    readonly titre: string;
    /** Meta description : 150 à 160 caractères, tenus par le test. */
    readonly description: string;
  };
  readonly h1: string;
  /** Chapô du héros, à la place du résumé de la prestation. */
  readonly resume: string;
  /**
   * Photo de fond du héros. Facultative : sans elle, le héros garde le fond
   * animé des pages de prestation.
   */
  readonly heroImage?: ImageHero;
  /** Dernière marche du fil d'Ariane : la page courante. */
  readonly marcheFilAriane: string;
  /** Villes et départements déclarés en `areaServed` du JSON-LD. */
  readonly zones: {
    readonly villes: readonly string[];
    readonly departements: readonly string[];
  };
  readonly contexte: {
    readonly titre: string;
    readonly intro: string;
    readonly titreLiens: string;
    readonly liens: readonly LienLocal[];
    readonly points: readonly { readonly titre: string; readonly corps: string }[];
  };
  /**
   * Sections supplémentaires, après le contexte et avant l'offre, dans
   * le gabarit des pages secteur : sur la page de Caen, la refonte, les sites
   * d'artisans et de commerces, le référencement local.
   */
  readonly sections?: readonly SectionSecteur[];
  /** Titre de la section de l'offre, à la place du titre générique. */
  readonly titreOffre?: string;
  readonly faq: {
    readonly eyebrow: string;
    readonly titleLines: readonly string[];
    readonly items: readonly FaqItem[];
  };
}

export const pageCaen: PageLocale = {
  chemin: CHEMIN_PAGE_CAEN,
  seo: {
    titre: "Création de site internet à Caen · Eliott Bouquerel",
    description: `Site internet sur mesure pour les TPE et PME de Caen et du Calvados, pensé pour le référencement local : ${aPartirDe(VITRINE, " HT")}, rendez-vous en visio.`,
  },
  h1: "Création de site internet à Caen",
  resume:
    "Un site sur mesure pour les TPE et PME de Caen et du Calvados. Il dit ce que vous faites, il sort quand on cherche votre métier près de chez vous, et il est à vous une fois livré.",
  /*
   * L'ÉGLISE SAINT-PIERRE VUE DU CHÂTEAU, et non une photo de bureau : c'est la
   * vue que tout Caennais reconnaît, et elle dit la ville avant le titre.
   * Photo Wikimedia Commons sous CC BY-SA 4.0, retouchée (contour vert de
   * l'église, bas fondu vers le fond du site) : le crédit est donc obligatoire,
   * avec la mention de la retouche.
   *
   * CADRAGE : la flèche est à 49,5 % de la largeur de l'image. Sur mobile,
   * l'image centrée la garde au milieu de l'écran, au-dessus du titre. À partir
   * de 810 px, le titre occupe la moitié droite : l'image est élargie de 30 %
   * vers la gauche, ce qui pose la flèche vers 34 % de la largeur, dans la
   * moitié gauche, à l'écart du titre (mesuré à 810, 1200 et 1440 px). En
   * hauteur, l'image est posée par le haut pour ne pas rogner la pointe.
   */
  heroImage: {
    src: "/images/heros/caen-saint-pierre.jpg",
    alt: "L’église Saint-Pierre de Caen sous un ciel d’été, vue depuis le château",
    width: 2400,
    height: 1150,
    cadrage: { x: 49.5, y: 0 },
    elargissement: 30,
    credit: {
      prefixe: "Photo :",
      auteur: {
        libelle: "Florian Pépellin",
        href: "https://commons.wikimedia.org/wiki/File:Caen_et_l%27%C3%A9glise_Saint-Pierre_depuis_le_ch%C3%A2teau_(juillet_2025).JPG",
      },
      licence: {
        libelle: "CC BY-SA 4.0",
        href: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
      },
      modification: "retouchée",
    },
    og: {
      src: "/images/og-caen.jpg",
      alt: "L’église Saint-Pierre de Caen sous un ciel d’été, vue depuis le château",
      width: 1200,
      height: 630,
    },
  },
  marcheFilAriane: "Caen",
  zones: {
    villes: ["Caen"],
    departements: ["Calvados"],
  },
  contexte: {
    /* H2 VISANT « agence web Caen » (carte SEO du 2026-10-15). Depuis le
       2026-10-16, la comparaison se fait À LIVRABLE ÉGAL, décision d'Eliott :
       la fourchette d'un site vitrine soigné en agence contre mon plancher,
       jamais mon plancher contre leur médiane. La source et sa date sont dans
       l'introduction, juste dessous. */
    titre: "Agence web à Caen : la qualité d’une agence, jusqu’à deux fois moins cher",
    intro: `Artisans, commerçants, PME de services ou d’industrie : vos clients vous cherchent sur Google avec votre métier et le nom de leur ville. Je conçois, j’écris et je code votre site comme une agence, ${aPartirDe(VITRINE, " HT")}, quand un site vitrine soigné se facture ${euros(repereAgenceSite.soigneMin)} à ${euros(repereAgenceSite.soigneMax)} en agence selon ${repereAgenceSite.source.nom} (${repereAgenceSite.source.releve}). Le site part de ces recherches, de Caen à Bayeux, Lisieux ou Honfleur.`,
    titreLiens: "Pour aller plus loin",
    liens: [
      {
        libelle: "Le site vitrine en détail",
        href: "/services/site-vitrine",
        description: "Ce qui est compris, et ce qui fait varier le prix.",
      },
      {
        libelle: "Prix d’un site internet sur mesure",
        href: CHEMIN_PRIX_SITE,
        description:
          "Ce qui fait varier le devis et ce qui se paie après la mise en ligne.",
      },
      {
        libelle: "Une solution métier sur mesure",
        href: "/services/logiciel-metier",
        description:
          "Quand il vous faut une réservation, un espace client ou une tâche automatisée.",
      },
      {
        libelle: "Un logiciel sur mesure à Caen",
        href: CHEMIN_PAGE_LOGICIEL_CAEN,
        description: "Le logiciel métier, pour les PME du Calvados, de la Manche et de l’Orne.",
      },
      {
        libelle: "Les réalisations",
        href: "/realisations",
        description: "Les projets livrés, expliqués de bout en bout.",
      },
      // LE RENDEZ-VOUS ET NON LE FORMULAIRE depuis le 2026-09-24 : c'est le
      // chemin principal du site, et il est sur cette page. Écrire reste
      // possible par « Poser une question », sous la FAQ.
      {
        libelle: "Réserver un appel",
        href: "#rendez-vous",
        description: "Choisissez un créneau pour parler de votre site.",
      },
    ],
    points: [
      {
        titre: "Les recherches locales d’abord",
        corps: `Vos clients tapent « plombier Caen » ou « fleuriste Bayeux », rarement le nom de votre entreprise. Je cherche ces mots avant d’écrire, et je crée une page par métier ou par ville quand votre marché est local.`,
      },
      {
        titre: "Les mêmes coordonnées partout",
        corps:
          "Google recoupe votre site, votre fiche d’établissement et les annuaires. Le site déclare votre nom, votre téléphone et votre zone d’intervention dans des données structurées, écrits comme sur votre fiche.",
      },
      {
        titre: "Vos photos, pas une banque d’images",
        corps:
          "Votre devanture, votre atelier, votre équipe : un client du coin reconnaît un lieu qu’il a déjà vu. Je recadre et je compresse vos photos pour que la page reste rapide sur mobile.",
      },
      {
        titre: "Un interlocuteur en Normandie, en visio",
        corps:
          "Je suis développeur freelance en Normandie. On se parle en visio : 30 minutes pour poser votre besoin, puis un devis, et vous suivez votre site en construction sur une adresse en ligne.",
      },
    ],
  },
  sections: [
    {
      id: "refonte",
      titre: "Refonte de site internet à Caen : que devient votre référencement ?",
      paragraphes: [
        `Votre site actuel a peut-être 10 ans, un thème qui s’affiche mal sur téléphone, ou un prestataire qui ne répond plus. Le refaire coûte le prix d’un site neuf, ${aPartirDe(VITRINE, " HT")}. Le vrai risque est de perdre les pages que Google montre déjà quand on cherche votre métier dans le Calvados.`,
        "Avant d’écrire une ligne, je relève les adresses de votre site actuel et celles qui reçoivent des visites. Chaque ancienne adresse pointe ensuite vers la nouvelle page qui traite le même sujet, et les textes qui se classent bien sont repris puis complétés.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Refonte de site internet : prix et méthode",
            href: CHEMIN_ARTICLE_REFONTE,
            description:
              "Quand refaire son site, et comment garder les visites acquises.",
          },
        ],
      },
      points: [
        {
          titre: "L’inventaire des adresses",
          corps:
            "Chaque page de l’ancien site, ses visites et les recherches qui y mènent, relevées avant le premier coup de crayon.",
        },
        {
          titre: "Les redirections 301",
          corps:
            "Une ancienne adresse renvoie vers la page qui la remplace, sujet pour sujet.",
        },
        {
          titre: "Le contenu qui se classe",
          corps:
            "Une page qui sort déjà sur « menuisier Caen » garde son sujet et ses mots. Elle gagne en clarté, en photos et en preuves.",
        },
        {
          titre: "Le contrôle après la bascule",
          corps:
            "La Search Console montre si Google explore les nouvelles adresses et si les anciennes redirigent sans erreur. Une baisse de quelques semaines est normale ; une chute qui dure se corrige.",
        },
      ],
    },
    {
      id: "artisans-commerces",
      // Vise « site vitrine Caen » (carte SEO du 2026-10-15).
      titre: "Site vitrine à Caen : quel site pour un artisan ou un commerce ?",
      paragraphes: [
        "Un artisan est appelé depuis un téléphone, souvent par quelqu’un qui a un problème à régler dans la semaine. Son site doit répondre en 1 écran : ce qu’il fait, où il intervient, comment le joindre. Un commerce doit donner ses horaires, son adresse et l’envie de passer la porte.",
        "Pour ces métiers, une page longue suffit souvent au départ. Plusieurs pages deviennent utiles quand vous proposez plusieurs prestations ou que vous intervenez dans plusieurs villes : chaque recherche trouve alors la page qui lui répond.",
      ],
      liens: {
        titre: "Pour comparer",
        items: [
          {
            libelle: "Site sur mesure ou WordPress",
            href: CHEMIN_ARTICLE_WORDPRESS,
            description:
              "Maintenance, vitesse, coût sur 3 ans, et les cas où WordPress suffit.",
          },
        ],
      },
      points: [
        {
          titre: "Votre numéro à portée de pouce",
          corps:
            "Sur téléphone, le numéro se touche pour appeler, en haut de chaque page.",
        },
        {
          titre: "Votre zone écrite en clair",
          corps:
            "Les communes où vous intervenez figurent sur le site. Le client sait tout de suite si vous couvrez son secteur.",
        },
        {
          titre: "Votre travail en images",
          corps:
            "Un chantier avant et après, une vitrine refaite, l’assiette du jour : vos photos montrent ce qu’une description ne dit pas.",
        },
        {
          titre: "Une demande qui arrive complète",
          corps:
            "Un formulaire court demande la commune et la nature du besoin, puis arrive dans votre boîte mail. Vous rappelez avec une réponse.",
        },
      ],
    },
    {
      id: "referencement-local",
      titre: "Référencement local : que faire en plus du site ?",
      paragraphes: [
        "Quand quelqu’un cherche « électricien Caen », Google affiche souvent, au-dessus des sites, une carte avec quelques établissements. Cette carte vient des fiches d’établissement Google, appelées Google Business Profile. Votre fiche et votre site travaillent ensemble : la fiche renvoie vers le site, et le site confirme ce que dit la fiche.",
        "La fiche se crée gratuitement et reste à votre nom. Sa remise d’aplomb n’est pas comprise : je la reprends en plus, sur devis.",
      ],
      points: [
        {
          titre: "Une fiche complète",
          corps:
            "La bonne catégorie principale, votre zone d’intervention, vos horaires, des photos récentes et le lien vers votre site.",
        },
        {
          titre: "Les annuaires de votre métier",
          corps:
            "Pages Jaunes et les annuaires de votre profession reprennent vos coordonnées. Un numéro faux, recopié d’annuaire en annuaire, brouille le signal que Google recoupe.",
        },
        {
          titre: "Des avis, et vos réponses",
          corps:
            "Demandez un avis à la fin d’un travail réussi, avec le lien direct vers votre fiche. Répondez aux avis, critiques comprises : les prochains clients lisent vos réponses.",
        },
      ],
    },
  ],
  titreOffre: "Prix d’un site internet à Caen : ce qui le fait varier",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Votre site", "sur Caen."],
    items: [
      {
        question: "Combien coûte un site internet à Caen ?",
        answer: `Un site démarre à ${prixPlancher(VITRINE)} HT. Le prix final dépend du nombre de pages, du travail sur le référencement local et de la mesure de ce que le site rapporte. Je le fixe au devis, après un appel en visio, et il ne bouge plus.`,
      },
      {
        question: "Combien coûte la refonte d’un site à Caen ?",
        answer: `Une refonte coûte le prix d’un site neuf, ${aPartirDe(VITRINE, " HT")}. Le relevé des anciennes adresses et leurs redirections font partie du travail : votre référencement acquis suit le nouveau site.`,
      },
      {
        question: "Mon site est sur Wix ou WordPress : peut-on le refaire ?",
        answer:
          "Oui. Je reconstruis le site sur mesure, je reprends vos textes et vos photos, et les anciennes adresses redirigent vers les nouvelles. Votre nom de domaine reste le vôtre : seul l’endroit où il pointe change.",
      },
      {
        question: "Faut-il se rencontrer pour lancer le projet ?",
        answer:
          "Non. Le premier échange se fait en visio, comme la suite : vous réservez un créneau sur cette page et le lien part par e-mail. Pendant le développement, vous suivez votre site sur une adresse en ligne, depuis votre bureau ou votre téléphone.",
      },
      {
        question: "Mon site sortira-t-il dans les recherches à Caen ?",
        answer:
          "Chaque site part avec les bases du référencement posées et son indexation vérifiée, et ses textes visent les mots que tapent vos clients. Le balisage complet, qui déclare votre zone d’intervention à Google, s’ajoute au devis. Personne ne peut vous garantir une position : le référencement local prend plusieurs mois, et votre fiche d’établissement Google pèse lourd dans les résultats.",
      },
      {
        question: "Une fiche Google suffit-elle, sans site internet ?",
        answer:
          "Elle vous rend visible sur la carte, avec votre numéro et vos horaires. Le client qui hésite entre 2 artisans clique ensuite vers leur site pour voir leurs réalisations et leurs prestations. Sans site, il ne trouve que la fiche pour vous juger.",
      },
      {
        question: "Comment obtenir des avis Google pour mon entreprise ?",
        answer:
          "Demandez-les au moment où le travail est fini et le client satisfait, avec le lien court que Google fournit dans votre fiche. Envoyé par SMS ou glissé dans la facture, il évite à votre client de chercher votre fiche.",
      },
      {
        question: "Vous travaillez seulement avec des entreprises de Caen ?",
        answer:
          "Non. Ma zone d’intervention couvre le Calvados, la Manche et l’Orne, et je travaille à distance avec des entreprises de toute la France. Pour vous, la méthode et les prix restent les mêmes, et les rendez-vous se font en visio.",
      },
      {
        question: "Pourquoi un freelance plutôt qu’une agence web de Caen ?",
        answer: `Vous parlez à la personne qui conçoit et code votre site. Sans structure à payer, un site vitrine soigné coûte ${aPartirDe(VITRINE, " HT")} chez moi, contre ${euros(repereAgenceSite.soigneMin)} à ${euros(repereAgenceSite.soigneMax)} en agence selon ${repereAgenceSite.source.nom} (${repereAgenceSite.source.releve}). Le code et l’hébergement sont à votre nom.`,
      },
    ],
  },
};

/**
 * LIEN VERS CETTE PAGE, posé sous les trois périmètres de
 * `/services/site-vitrine`, sur sa propre ligne après celle du prix. C'est
 * l'endroit où le lecteur vient de lire « une page par métier ou par ville si
 * votre marché est local » : la page Caen en est l'exemple.
 */
export const lienVersPageCaen = {
  avant: "Votre entreprise est à Caen ou dans le Calvados :",
  libelle: "création de site internet à Caen",
  href: CHEMIN_PAGE_CAEN,
} as const;
