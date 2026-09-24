import type { ImageHero } from "@/lib/content/types";

/**
 * Photos des héros des pages sans contenu propre : index du blog et des
 * réalisations, vue Agent, pages de prestation, pages légales et page
 * introuvable.
 *
 * Même direction que le héros de Caen et ceux des articles : une photo libre
 * retouchée, un sujet détouré en lignes volt, un fondu vers le fond du site.
 * Aucune page ne s'affiche sans photo en héros (`heros-pages.test.mjs`).
 * Les prestations et les documents légaux sont indexés par leur `slug`.
 */
export const herosPages: {
  readonly blog: ImageHero;
  readonly realisations: ImageHero;
  readonly introuvable: ImageHero;
  readonly agent: ImageHero;
  readonly prestations: Readonly<Record<string, ImageHero | undefined>>;
  readonly legal: Readonly<Record<string, ImageHero | undefined>>;
} = {
  blog: {
    src: "/images/heros/page-blog-index.jpg",
    alt: "Une machine à écrire mécanique ancienne posée sur un bureau en bois, une feuille engagée dans le chariot",
    width: 2400,
    height: 1350,
    cadrage: { x: 36, y: 40 },
    credit: {
      prefixe: "Photo :",
      auteur: {
        libelle: "Daniel McCullough",
        href: "https://commons.wikimedia.org/wiki/File:Vintage_black_typewriter_(Unsplash).jpg",
      },
      licence: {
        libelle: "CC0",
        href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
      },
      modification: "retouchée",
    },
    og: {
      src: "/images/og-page-blog-index.jpg",
      alt: "Une machine à écrire mécanique ancienne posée sur un bureau en bois, une feuille engagée dans le chariot",
      width: 1200,
      height: 630,
    },
  },
  realisations: {
    src: "/images/heros/page-realisations.jpg",
    alt: "Maquette en coupe d’une maison en bois clair, avec son escalier, ses planchers et une chambre à l’étage",
    width: 2400,
    height: 1350,
    cadrage: { x: 30, y: 40 },
    credit: {
      prefixe: "Photo :",
      auteur: {
        libelle: "14GTR",
        href: "https://commons.wikimedia.org/wiki/File:Granby_Four_Streets_terraced_house_section_model_01.jpg",
      },
      licence: {
        libelle: "CC0",
        href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
      },
      modification: "retouchée",
    },
    og: {
      src: "/images/og-page-realisations.jpg",
      alt: "Maquette en coupe d’une maison en bois clair, avec son escalier, ses planchers et une chambre à l’étage",
      width: 1200,
      height: 630,
    },
  },
  introuvable: {
    src: "/images/heros/page-page-404.jpg",
    alt: "Boussole ancienne en laiton, ouverte, posée sur une carte papier dans la lumière du jour",
    width: 2400,
    height: 1350,
    cadrage: { x: 31, y: 40 },
    credit: {
      prefixe: "Photo :",
      auteur: {
        libelle: "Chris Lawton",
        href: "https://commons.wikimedia.org/wiki/File:Let_the_adventures_begin_(Unsplash).jpg",
      },
      licence: {
        libelle: "CC0",
        href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
      },
      modification: "retouchée",
    },
    og: {
      src: "/images/og-page-page-404.jpg",
      alt: "Boussole ancienne en laiton, ouverte, posée sur une carte papier dans la lumière du jour",
      width: 1200,
      height: 630,
    },
  },
  agent: {
    src: "/images/heros/page-agent.jpg",
    alt: "Une main pointe une ligne sur l’écran d’un ordinateur portable ouvert, posé sur un bureau en bois",
    width: 2400,
    height: 1350,
    cadrage: { x: 28, y: 40 },
    credit: {
      prefixe: "Photo :",
      auteur: {
        libelle: "Preply.com Images",
        href: "https://commons.wikimedia.org/wiki/File:Learning_to_Code.jpg",
      },
      licence: {
        libelle: "CC BY 2.0",
        href: "https://creativecommons.org/licenses/by/2.0/deed.fr",
      },
      modification: "retouchée",
    },
    og: {
      src: "/images/og-page-agent.jpg",
      alt: "Une main pointe une ligne sur l’écran d’un ordinateur portable ouvert, posé sur un bureau en bois",
      width: 1200,
      height: 630,
    },
  },
  prestations: {
    "site-vitrine": {
      src: "/images/heros/page-site-vitrine.jpg",
      alt: "Devanture de boutique en bois peint, vitrines et porte vitrée, en plein soleil dans une rue de Paris",
      width: 2400,
      height: 1350,
      cadrage: { x: 35, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Ricardalovesmonuments",
          href: "https://commons.wikimedia.org/wiki/File:Mariage_Fr%C3%A8res,_90_Rue_Montorgueil,_75002_Paris,_14_September_2019.jpg",
        },
        licence: {
          libelle: "CC BY-SA 4.0",
          href: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-page-site-vitrine.jpg",
        alt: "Devanture de boutique en bois peint, vitrines et porte vitrée, en plein soleil dans une rue de Paris",
        width: 1200,
        height: 630,
      },
    },
    "outil-metier": {
      src: "/images/heros/page-outil-metier.jpg",
      alt: "Pied à coulisse en acier posé en diagonale sur un plan de travail en bois clair",
      width: 2400,
      height: 1350,
      cadrage: { x: 26, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Santeri Viinamäki",
          href: "https://commons.wikimedia.org/wiki/File:Vernier_caliper_2016.jpg",
        },
        licence: {
          libelle: "CC BY-SA 4.0",
          href: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-page-outil-metier.jpg",
        alt: "Pied à coulisse en acier posé en diagonale sur un plan de travail en bois clair",
        width: 1200,
        height: 630,
      },
    },
    "logiciel-metier": {
      src: "/images/heros/page-logiciel-metier.jpg",
      alt: "Caisse enregistreuse mécanique ancienne en bois verni et laiton, posée sur un meuble en bois",
      width: 2400,
      height: 1350,
      cadrage: { x: 30, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Alf van Beem",
          href: "https://commons.wikimedia.org/wiki/File:National_cash_registers_pic2.JPG",
        },
        licence: {
          libelle: "CC0",
          href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-page-logiciel-metier.jpg",
        alt: "Caisse enregistreuse mécanique ancienne en bois verni et laiton, posée sur un meuble en bois",
        width: 1200,
        height: 630,
      },
    },
  },
  legal: {
    "mentions-legales": {
      src: "/images/heros/page-mentions-legales.jpg",
      alt: "Tampon encreur à manche en bois posé sur un tampon d’encre bleu, couvercle ouvert",
      width: 2400,
      height: 1350,
      cadrage: { x: 31, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "5snake5",
          href: "https://commons.wikimedia.org/wiki/File:Stempel,_Stempelkissen,_Stempelfarbe.jpg",
        },
        licence: {
          libelle: "CC0",
          href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-page-mentions-legales.jpg",
        alt: "Tampon encreur à manche en bois posé sur un tampon d’encre bleu, couvercle ouvert",
        width: 1200,
        height: 630,
      },
    },
    "politique-de-confidentialite": {
      src: "/images/heros/page-politique-de-confidentialite.jpg",
      alt: "Vieux cadenas en laiton fermé sur deux anneaux de fer rouillés, entre les battants d’une porte en bois rouge délavé",
      width: 2400,
      height: 1350,
      cadrage: { x: 33, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "iMahesh",
          href: "https://commons.wikimedia.org/wiki/File:A_padlock_with_hasps_on_a_door_at_Fort_Reis_Magos.jpg",
        },
        licence: {
          libelle: "CC BY-SA 4.0",
          href: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-page-politique-de-confidentialite.jpg",
        alt: "Vieux cadenas en laiton fermé sur deux anneaux de fer rouillés, entre les battants d’une porte en bois rouge délavé",
        width: 1200,
        height: 630,
      },
    },
    "conditions-generales-de-vente": {
      src: "/images/heros/page-conditions-generales-de-vente.jpg",
      alt: "Stylo plume argenté posé sur un carnet ouvert, sur un bureau en bois",
      width: 2400,
      height: 1350,
      cadrage: { x: 35, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Aaron Burden",
          href: "https://commons.wikimedia.org/wiki/File:Fountain_pen_on_a_journal_(Unsplash).jpg",
        },
        licence: {
          libelle: "CC0",
          href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-page-conditions-generales-de-vente.jpg",
        alt: "Stylo plume argenté posé sur un carnet ouvert, sur un bureau en bois",
        width: 1200,
        height: 630,
      },
    },
  },
};
