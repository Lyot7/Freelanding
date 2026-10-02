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
 * CE QUE LA PAGE REPREND DE `/services/site-vitrine` : le gabarit, les trois
 * périmètres, leurs prix calculés, la section « pourquoi un devis bouge », la
 * prise de rendez-vous. Ce qu'elle ajoute est local : le contexte des
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
 * LES PRIX NE S'ÉCRIVENT PAS ICI, ils se calculent (`fourchette`, `prixPack`),
 * comme partout ailleurs sur le site.
 */
import type { FaqItem, ImageHero } from "@/lib/content/types";
import { fourchette, prestation, prixPack } from "./offre";
import type { SectionSecteur } from "./pages-secteur";

const VITRINE = prestation("vitrine");
const [LANDING, SITE, SIGNATURE] = VITRINE.packs;

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
   * Sections supplémentaires, après le contexte et avant les forfaits, dans
   * le gabarit des pages secteur : sur la page de Caen, la refonte, les sites
   * d'artisans et de commerces, le référencement local.
   */
  readonly sections?: readonly SectionSecteur[];
  /** Titre de la section des forfaits, à la place du titre générique. */
  readonly titrePacks?: string;
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
    description: `Site internet sur mesure pour les TPE et PME de Caen et du Calvados, pensé pour le référencement local : ${fourchette("vitrine")} HT, rendez-vous en visio.`,
  },
  h1: "Création de site internet à Caen",
  resume:
    "Un site sur mesure pour les TPE et PME de Caen et du Calvados. Il dit ce que tu fais, il sort quand on cherche ton métier près de chez toi, et il est à toi une fois livré.",
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
    titre: "Site vitrine et refonte pour les entreprises de Caen",
    intro:
      "Artisans, commerçants, professions libérales, PME de services ou d’industrie : tes clients te cherchent sur Google avec ton métier et le nom de leur ville. Le site se construit autour de ces recherches, de Caen à Hérouville-Saint-Clair, Bayeux, Lisieux, Falaise, Vire ou Honfleur.",
    titreLiens: "Pour aller plus loin",
    liens: [
      {
        libelle: "Le site vitrine en détail",
        href: "/services/site-vitrine",
        description: "Les 3 forfaits, ce que chacun contient et son prix.",
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
          "Quand il te faut une réservation, un espace client ou une tâche automatisée.",
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
        description: "Choisis un créneau pour parler de ton site.",
      },
    ],
    points: [
      {
        titre: "Les recherches locales d’abord",
        corps: `Tes clients tapent « plombier Caen » ou « fleuriste Bayeux », rarement le nom de ton entreprise. À partir de ${SITE.nom}, je cherche ces mots avant d’écrire, et je crée une page par métier ou par ville quand ton marché est local.`,
      },
      {
        titre: "Les mêmes coordonnées partout",
        corps:
          "Google recoupe ton site, ta fiche d’établissement et les annuaires pour décider qu’il s’agit bien de toi. Le site déclare ton nom, ton téléphone et ta zone d’intervention dans des données structurées, écrits comme sur ta fiche.",
      },
      {
        titre: "Tes photos, pas une banque d’images",
        corps:
          "Ta devanture, ton atelier, ton équipe : un client du coin reconnaît un lieu qu’il a déjà vu. Je recadre et je compresse tes photos pour que la page reste rapide sur mobile.",
      },
      {
        titre: "Un interlocuteur en Normandie, en visio",
        corps:
          "Je suis développeur freelance en Normandie, et le Calvados fait partie de ma zone d’intervention. On se parle en visio : 30 minutes pour poser ton besoin, puis un devis. Tu suis ensuite ton site en construction sur une adresse en ligne.",
      },
    ],
  },
  sections: [
    {
      id: "refonte",
      titre: "Refonte de site internet à Caen : que devient ton référencement ?",
      paragraphes: [
        `Ton site actuel a peut-être 10 ans, un thème qui s’affiche mal sur téléphone, ou un prestataire qui ne répond plus. Le refaire coûte le prix d’un site neuf, ${fourchette("vitrine")} HT. Le vrai risque est de perdre les pages que Google montre déjà quand on cherche ton métier dans le Calvados.`,
        "Avant d’écrire une ligne, je relève les adresses de ton site actuel et celles qui reçoivent des visites. Chaque ancienne adresse pointe ensuite vers la nouvelle page qui traite le même sujet, et les textes qui se classent bien sont repris puis complétés.",
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
            "Une ancienne adresse renvoie vers la page qui la remplace, sujet pour sujet. L’accueil ne sert jamais de destination par défaut.",
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
      titre: "Quel site pour un artisan ou un commerce du Calvados ?",
      paragraphes: [
        "Un artisan est appelé depuis un téléphone, souvent par quelqu’un qui a un problème à régler dans la semaine. Son site doit répondre en 1 écran : ce que tu fais, où tu interviens, comment te joindre. Un commerce doit donner ses horaires, son adresse et l’envie de passer la porte.",
        `Pour ces métiers, ${LANDING.nom} suffit souvent au départ. ${SITE.nom} devient utile quand tu proposes plusieurs prestations ou que tu interviens dans plusieurs villes : chaque recherche trouve alors la page qui lui répond.`,
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
          titre: "Ton numéro à portée de pouce",
          corps:
            "Sur téléphone, le numéro se touche pour appeler, en haut de chaque page. Ton client n’a rien à recopier.",
        },
        {
          titre: "Ta zone écrite en clair",
          corps:
            "Les communes où tu interviens figurent sur le site. Le client sait tout de suite si tu couvres son secteur.",
        },
        {
          titre: "Ton travail en images",
          corps:
            "Un chantier avant et après, une vitrine refaite, l’assiette du jour : tes photos montrent ce qu’une description ne dit pas.",
        },
        {
          titre: "Une demande qui arrive complète",
          corps:
            "Un formulaire court demande la commune et la nature du besoin, puis arrive dans ta boîte mail. Tu rappelles avec une réponse.",
        },
      ],
    },
    {
      id: "referencement-local",
      titre: "Référencement local : que faire en plus du site ?",
      paragraphes: [
        "Quand quelqu’un cherche « électricien Caen », Google affiche souvent, au-dessus des sites, une carte avec quelques établissements. Cette carte vient des fiches d’établissement Google, appelées Google Business Profile. Ta fiche et ton site travaillent ensemble : la fiche renvoie vers le site, et le site confirme ce que dit la fiche.",
        "La fiche se crée gratuitement et reste à ton nom. Sa remise d’aplomb ne fait partie d’aucun forfait : je la reprends en plus, sur devis. Tu peux aussi t’en charger toi-même, à partir des 3 points ci-contre.",
      ],
      points: [
        {
          titre: "Une fiche complète",
          corps:
            "La bonne catégorie principale, ta zone d’intervention, tes horaires, des photos récentes et le lien vers ton site.",
        },
        {
          titre: "Les annuaires de ton métier",
          corps:
            "Pages Jaunes et les annuaires de ta profession reprennent tes coordonnées. Un numéro faux, recopié d’annuaire en annuaire, brouille le signal que Google recoupe.",
        },
        {
          titre: "Des avis, et tes réponses",
          corps:
            "Demande un avis à la fin d’un travail réussi, avec le lien direct vers ta fiche. Réponds aux avis, critiques comprises : les prochains clients lisent tes réponses.",
        },
      ],
    },
  ],
  titrePacks: "Prix d’un site internet à Caen, en 3 forfaits",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Ton site", "sur Caen."],
    items: [
      {
        question: "Combien coûte un site internet à Caen ?",
        answer: `Le site coûte ${fourchette("vitrine")} HT, en 3 forfaits à prix ferme : ${prixPack(LANDING)} pour ${LANDING.nom}, ${prixPack(SITE)} pour ${SITE.nom}, ${prixPack(SIGNATURE)} pour ${SIGNATURE.nom}. Ce qui change de l’un à l’autre : le nombre de pages, le travail sur les textes et la mesure de ce que le site rapporte. Le prix du forfait choisi ne bouge plus.`,
      },
      {
        question: "Combien coûte la refonte d’un site à Caen ?",
        answer: `Une refonte entre dans l’un des 3 forfaits, de ${prixPack(LANDING)} à ${prixPack(SIGNATURE)} HT, comme un site neuf. Le relevé des anciennes adresses et leurs redirections font partie du travail : ton référencement acquis suit le nouveau site.`,
      },
      {
        question: "Mon site est sur Wix ou WordPress : peut-on le refaire ?",
        answer:
          "Oui. Je reconstruis le site sur mesure, je reprends tes textes et tes photos, et les anciennes adresses redirigent vers les nouvelles. Ton nom de domaine reste le tien : seul l’endroit où il pointe change.",
      },
      {
        question: "Faut-il se rencontrer pour lancer le projet ?",
        answer:
          "Non. Le premier échange se fait en visio, comme la suite : tu réserves un créneau sur cette page et le lien part par e-mail. Pendant le développement, tu suis ton site sur une adresse en ligne, depuis ton bureau ou ton téléphone.",
      },
      {
        question: "Mon site sortira-t-il dans les recherches à Caen ?",
        answer: `Chaque site part avec les bases du référencement posées et son indexation vérifiée. À partir de ${SITE.nom}, il vise les mots que tapent tes clients et déclare ta zone d’intervention à Google. Personne ne peut te garantir une position : le référencement local prend plusieurs mois, et ta fiche d’établissement Google pèse lourd dans les résultats.`,
      },
      {
        question: "Une fiche Google suffit-elle, sans site internet ?",
        answer:
          "Elle te rend visible sur la carte, avec ton numéro et tes horaires. Le client qui hésite entre 2 artisans clique ensuite vers leur site pour voir leurs réalisations et leurs prestations. Sans site, il ne trouve que la fiche pour te juger.",
      },
      {
        question: "Comment obtenir des avis Google pour mon entreprise ?",
        answer:
          "Demande-les au moment où le travail est fini et le client satisfait, avec le lien court que Google fournit dans ta fiche. Envoyé par SMS ou glissé dans la facture, il évite à ton client de chercher ta fiche.",
      },
      {
        question: "Tu travailles seulement avec des entreprises de Caen ?",
        answer:
          "Non. Ma zone d’intervention couvre le Calvados, la Manche et l’Orne, et je travaille à distance avec des entreprises de toute la France. Pour toi, la méthode et les prix restent les mêmes, et les rendez-vous se font en visio.",
      },
      {
        question: "Pourquoi un freelance plutôt qu’une agence web de Caen ?",
        answer:
          "Tu parles à la personne qui écrit le code, du premier appel à la mise en ligne. Aucun intermédiaire ne reformule ta demande. À la livraison, l’hébergement est à ton nom et le code dans ton dépôt.",
      },
    ],
  },
};

/**
 * LIEN VERS CETTE PAGE, posé sous les trois périmètres de
 * `/services/site-vitrine`, sur sa propre ligne après celle du prix. C'est
 * l'endroit où le lecteur vient de lire « une page par métier ou par ville si
 * ton marché est local » : la page Caen en est l'exemple.
 */
export const lienVersPageCaen = {
  avant: "Ton entreprise est à Caen ou dans le Calvados :",
  libelle: "création de site internet à Caen",
  href: CHEMIN_PAGE_CAEN,
} as const;
