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

const VITRINE = prestation("vitrine");
const [LANDING, SITE, SIGNATURE] = VITRINE.packs;

export const CHEMIN_PAGE_CAEN = "/creation-site-internet-caen";

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
    titre: "Un site pour les entreprises de Caen et du Calvados",
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
        libelle: "Une solution métier sur mesure",
        href: "/services/logiciel-metier",
        description:
          "Quand il te faut une réservation, un espace client ou une tâche automatisée.",
      },
      {
        libelle: "Les réalisations",
        href: "/realisations",
        description: "Les projets livrés, expliqués de bout en bout.",
      },
      {
        libelle: "Me contacter",
        href: "/contact",
        description: "Un message, une réponse sous 24 heures ouvrées.",
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
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Questions", "locales."],
    items: [
      {
        question: "Combien coûte un site internet à Caen ?",
        answer: `Le site coûte ${fourchette("vitrine")} HT, en 3 forfaits à prix ferme : ${prixPack(LANDING)} pour ${LANDING.nom}, ${prixPack(SITE)} pour ${SITE.nom}, ${prixPack(SIGNATURE)} pour ${SIGNATURE.nom}. Ce qui change de l’un à l’autre : le nombre de pages, le travail sur les textes et la mesure de ce que le site rapporte. Le prix du forfait choisi ne bouge plus.`,
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
 * LE SEUL LIEN QUI MÈNE À CETTE PAGE DEPUIS LE RESTE DU SITE, posé sous les
 * trois périmètres de `/services/site-vitrine`. C'est l'endroit où le lecteur
 * vient de lire « une page par métier ou par ville si ton marché est local » :
 * la page Caen en est l'exemple, et elle lui parle directement s'il est du coin.
 */
export const lienVersPageCaen = {
  avant: "Ton entreprise est à Caen ou dans le Calvados :",
  libelle: "création de site internet à Caen",
  href: CHEMIN_PAGE_CAEN,
} as const;
