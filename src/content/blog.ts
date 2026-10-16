import type { BlogContent, BlogPost } from "@/lib/content/types";
import { articlesDuCockpit } from "./blog-cockpit";

/**
 * REGISTRE DES ARTICLES — métadonnées seulement, jamais le corps.
 *
 * LE PARTAGE DES RÔLES. Le corps d'un article vit dans
 * `src/content/articles/<slug>.mdx` ; ses métadonnées vivent ici. Les deux ne
 * sont pas au même endroit, et c'est délibéré :
 *
 *  - Les métadonnées sont TYPÉES. Un article auquel il manque une description,
 *    une couverture ou une date ne compile pas. Mises dans le MDX en frontmatter
 *    YAML, elles n'auraient aucun contrôle — or les articles sont rédigés par un
 *    agent, et le compilateur est le seul relecteur qui ne se fatigue jamais.
 *  - L'index, le sitemap, les articles liés et le JSON-LD lisent ce registre
 *    SANS compiler le moindre MDX. Un outil hors du graphe Next (script d'audit,
 *    génération d'image de partage) y accède comme à n'importe quel module.
 *
 * `src/content/blog.test.mjs` vérifie la correspondance : tout article listé ici
 * a son fichier MDX, tout fichier MDX est listé ici, et chaque corps se termine
 * par un chemin d'achat (une page de prestation et la page de contact).
 *
 * CE QUI A DISPARU LE 2026-08-26. Ce fichier portait 26 articles de
 * démonstration hérités du template : personas fictifs illustrés par des photos
 * de banque d'images, chiffres inventés dans les titres (« 34 % », « 23 fois »),
 * et le MÊME corps pour les 26. Ils ont été supprimés avec le passage au MDX,
 * en même temps que Payload. Le blog ne montre que ce qui est réellement écrit.
 *
 * CE QUI A CHANGÉ LE 2026-08-28, et c'est un changement de destinataire.
 *
 * Le blog s'adressait à des artisans et des commerçants de quartier. La cible
 * est désormais le dirigeant ou le responsable d'une boutique en ligne : ses
 * questions sont le taux de conversion, l'abandon de panier, la vitesse des
 * pages, la dépendance à une plateforme et la synchronisation de son catalogue.
 * Les douze articles ajoutés ce jour-là sont écrits pour lui ; les quatre
 * précédents restent, ils traitent de sujets qui valent pour les deux publics.
 *
 * DEUX RÈGLES DE FOND, qui expliquent la forme des articles.
 *
 *  1. AUCUN CHIFFRE DE RÉSULTAT PERSONNEL. L'activité a démarré le 2026-06-01 :
 *     il n'y a ni cas client chiffré, ni témoignage, ni « +40 % de conversion
 *     chez un client ». Les seuls chiffres publiés sont des valeurs PUBLIQUES,
 *     avec leur source NOMMÉE dans le corps de l'article — seuils des signaux
 *     Web essentiels de Google, taux d'abandon documenté par l'institut Baymard,
 *     papier GEO de la conférence KDD 2024, directive européenne 2019/882. Le
 *     seul chiffre mesuré du blog est le −92 % de Würth, et il vit dans un
 *     article qui dit d'où il vient.
 *  2. CHAQUE ARTICLE MÈNE QUELQUE PART. Les cinq premiers articles ne pointaient
 *     vers aucune page où l'on peut acheter : un lecteur convaincu n'avait
 *     nulle part où aller. Tous se terminent désormais par un lien vers la
 *     prestation correspondante et vers `/contact`, et le test du registre
 *     refuse un corps qui ne le fait pas.
 */

/** Le seul auteur du blog. Repris de la carte du hero et du pied de page. */
const eliott = {
  name: "Eliott Bouquerel",
  role: "Développeur freelance",
  avatar: {
    src: "/images/eliott-bouquerel-avatar.jpg",
    alt: "Eliott Bouquerel",
    width: 400,
    height: 400,
  },
};

/*
 * LES COUVERTURES SE RÉPÈTENT, et c'est assumé plutôt que subi.
 *
 * Le dépôt sert huit visuels exploitables en couverture (cinq photographies
 * Unsplash de la section Services, le mécanisme d'horlogerie, l'escalier, et
 * les captures des trois projets réels), pour seize articles. Plutôt que
 * d'inventer des fichiers ou de générer des images sans rapport, trois
 * couvertures servent deux articles chacune, appariées par SUJET : les deux
 * articles sur le fait d'être trouvé partagent la photo de la rue commerçante,
 * les deux articles sur la dépendance aux outils partagent les engrenages, les
 * deux articles sur la conception partagent les ciseaux à bois. La provenance
 * de chaque fichier est dans `docs/ASSETS.md`.
 *
 * LE 2026-10-02, quatre articles de plus reprennent chacun la couverture d'un
 * article de même sujet, sans fichier nouveau : Odoo le rabot (outil sur
 * mesure), Excel le tiroir de fiches (données), la refonte le chronomètre
 * (vitesse), WordPress le buste de couture (sur mesure contre prêt-à-porter).
 */

export const blogPosts: BlogPost[] = [

  /*
   * ÉTUDE DE DONNÉES ORIGINALES (2026-10-02). Chaque chiffre du corps vient de
   * `marque/seo-2026-10-02/etude-pme-normandes/donnees.json`, avec sa valeur
   * exacte et son effectif. Le périmètre est celui des entreprises et commerces
   * de proximité présents sur Google Maps : aucune donnée d'effectif, donc
   * jamais le mot « PME ». Les trois visuels sont calculés à partir des mêmes
   * chiffres par `scripts/visuel-etude-normandie.mjs` : aucune photo tierce.
   */
  {
    slug: "etat-des-sites-des-entreprises-normandes-2026",
    title: "Sites internet des entreprises normandes : l’étude 2026",
    date: "2026-10-02",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Étude",
    author: eliott,
    cover: {
      src: "/images/blog/etat-des-sites-des-entreprises-normandes-2026.jpg",
      alt: "Un champ de points sur fond noir, un par fiche Google Maps : près de trois sur dix sont en vert, la part des fiches sans site renseigné",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-etat-des-sites-des-entreprises-normandes-2026.jpg",
      alt: "Un champ de 25 736 points sur fond noir, un par fiche Google Maps relevée : les 7 631 fiches sans site renseigné sont en vert",
      width: 2400,
      height: 1350,
      cadrage: { x: 50, y: 50 },
      credit: {
        prefixe: "Visuel :",
        auteur: { libelle: "Eliott Bouquerel", href: "/a-propos" },
        licence: {
          libelle: "CC BY 4.0",
          href: "https://creativecommons.org/licenses/by/4.0/deed.fr",
        },
      },
      og: {
        src: "/images/og-blog-etat-des-sites-des-entreprises-normandes-2026.jpg",
        alt: "Un champ de points sur fond noir, un par fiche Google Maps : près de trois sur dix sont en vert, la part des fiches sans site renseigné",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "25 736 fiches Google Maps et 6 631 sites relevés dans 35 villes normandes : qui a un site, avec quel outil, et ce que ça change pour votre commerce.",
    readingTime: "9 min de lecture",
    tags: ["étude", "Normandie", "site internet", "Google Maps"],
    seo: {
      title: "Sites internet des entreprises normandes : l’étude 2026",
      description:
        "29,65 % des fiches Google Maps d’entreprises normandes n’ont aucun site. L’étude 2026 sur 25 736 fiches et 6 631 sites, par secteur et département.",
      ogImage: {
        src: "/images/og-blog-etat-des-sites-des-entreprises-normandes-2026.jpg",
        alt: "Un champ de points sur fond noir, un par fiche Google Maps : près de trois sur dix sont en vert, la part des fiches sans site renseigné",
        width: 1200,
        height: 630,
      },
    },
    dataset: {
      name: "Présence web des entreprises et commerces de proximité normands en 2026",
      description:
        "Indicateurs agrégés relevés sur 25 736 fiches Google Maps d’entreprises et de commerces de proximité de 35 villes du Calvados, de l’Eure, de la Manche, de l’Orne et de la Seine-Maritime, et sur la page d’accueil de 6 631 sites : site renseigné ou non, outil de création, année de copyright, signaux techniques et temps de réponse du serveur.",
      license: "https://creativecommons.org/licenses/by/4.0/deed.fr",
      temporalCoverage: "2026-07-19/2026-09-01",
      spatialCoverage: "Normandie, France (départements 14, 27, 50, 61 et 76)",
      variableMeasured: [
        "Part des fiches Google Maps sans site web renseigné",
        "Part des fiches Google Maps sans site web propre",
        "Fiches sans site par secteur d’activité et par département",
        "Répartition des outils de création de site (CMS)",
        "Année de copyright affichée sur la page d’accueil",
        "Part des sites sans HTTPS, sans balise viewport, en tableaux ou chargeant jQuery 1.x/2.x ou Flash",
        "Temps de réponse du serveur jusqu’au premier octet",
      ],
    },
  },

  {
    slug: "logiciel-sur-mesure-ou-odoo",
    title: "Odoo ou logiciel sur mesure : comment choisir",
    date: "2026-10-02",
    updated: "2026-10-16",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Outils métier",
    author: eliott,
    cover: {
      src: "/images/blog/logiciel-sur-mesure-ou-odoo.jpg",
      alt: "Une grille de modules carrés identiques sur fond noir, et un groupe de forme libre qui ressort en vert",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-logiciel-sur-mesure-ou-odoo.jpg",
      alt: "Une grille de modules carrés identiques sur fond noir, et un groupe de forme libre qui ressort en vert",
      width: 2400,
      height: 1350,
      cadrage: { x: 50, y: 50 },
      credit: {
        prefixe: "Visuel :",
        auteur: { libelle: "Eliott Bouquerel", href: "/a-propos" },
        licence: {
          libelle: "CC BY 4.0",
          href: "https://creativecommons.org/licenses/by/4.0/deed.fr",
        },
      },
      og: {
        src: "/images/og-blog-logiciel-sur-mesure-ou-odoo.jpg",
        alt: "Une grille de modules carrés identiques sur fond noir, et un groupe de forme libre qui ressort en vert",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Les licences Odoo sur 3 ans pour 5, 10 et 20 utilisateurs, ce que l’intégrateur ajoute, et les cas où Odoo reste meilleur qu’un logiciel sur mesure.",
    readingTime: "8 min de lecture",
    tags: ["Odoo", "ERP", "logiciel sur mesure"],
    seo: {
      // Réécriture du 2026-10-16 (vault `blog-etat-articles.md`, n° 1) : le
      // titre ne porte plus « prix » à côté de « logiciel sur mesure », pour
      // rendre « logiciel sur mesure prix » à la page prix. Prix d'Odoo du
      // corps relevés sur odoo.com le 2026-10-15.
      title: "Odoo ou logiciel sur mesure : tarifs Odoo sur 3 ans",
      description:
        "Odoo se paie par utilisateur et par mois, plus l’intégrateur. Comparez le total sur 3 ans avec un logiciel sur mesure, et voyez quand Odoo reste meilleur.",
      ogImage: {
        src: "/images/og-blog-logiciel-sur-mesure-ou-odoo.jpg",
        alt: "Une grille de modules carrés identiques sur fond noir, et un groupe de forme libre qui ressort en vert",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "remplacer-excel-par-un-logiciel",
    title: "Remplacer Excel par un logiciel : quand et à quel prix",
    date: "2026-10-02",
    updated: "2026-10-16",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Outils métier",
    author: eliott,
    cover: {
      src: "/images/blog/remplacer-excel-par-un-logiciel.jpg",
      alt: "Une grille de tableur sur fond noir, une colonne de cellules surlignée en vert",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-remplacer-excel-par-un-logiciel.jpg",
      alt: "Une grille de tableur sur fond noir, une colonne de cellules surlignée en vert",
      width: 2400,
      height: 1350,
      cadrage: { x: 50, y: 50 },
      credit: {
        prefixe: "Visuel :",
        auteur: { libelle: "Eliott Bouquerel", href: "/a-propos" },
        licence: {
          libelle: "CC BY 4.0",
          href: "https://creativecommons.org/licenses/by/4.0/deed.fr",
        },
      },
      og: {
        src: "/images/og-blog-remplacer-excel-par-un-logiciel.jpg",
        alt: "Une grille de tableur sur fond noir, une colonne de cellules surlignée en vert",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Un tableur partagé coûte des heures que personne ne facture. Les 6 signes qu’Excel ne suffit plus, l’option qui le remplace, la migration en 4 étapes et le prix.",
    readingTime: "8 min de lecture",
    tags: ["Excel", "migration", "logiciel sur mesure"],
    seo: {
      // Position 14,8 sur « remplacer excel logiciel sur mesure » : le titre
      // garde la formulation exacte (réécriture du 2026-10-16, vault n° 2).
      title: "Remplacer Excel par un logiciel sur mesure : signes et prix",
      description:
        "Votre fichier Excel fait office de logiciel de gestion ? Les 6 signes, ce qu’il vous coûte en heures, la migration en 4 étapes et le prix du sur mesure.",
      ogImage: {
        src: "/images/og-blog-remplacer-excel-par-un-logiciel.jpg",
        alt: "Une grille de tableur sur fond noir, une colonne de cellules surlignée en vert",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "refonte-site-internet-pme",
    title: "Refonte de site internet : prix moyen et méthode",
    date: "2026-10-02",
    updated: "2026-10-16",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Méthode",
    author: eliott,
    cover: {
      src: "/images/blog/refonte-site-internet-pme.jpg",
      alt: "Deux colonnes d’adresses sur fond noir, reliées une à une par des courbes vertes",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-refonte-site-internet-pme.jpg",
      alt: "Deux colonnes d’adresses sur fond noir, reliées une à une par des courbes vertes",
      width: 2400,
      height: 1350,
      cadrage: { x: 50, y: 50 },
      credit: {
        prefixe: "Visuel :",
        auteur: { libelle: "Eliott Bouquerel", href: "/a-propos" },
        licence: {
          libelle: "CC BY 4.0",
          href: "https://creativecommons.org/licenses/by/4.0/deed.fr",
        },
      },
      og: {
        src: "/images/og-blog-refonte-site-internet-pme.jpg",
        alt: "Deux colonnes d’adresses sur fond noir, reliées une à une par des courbes vertes",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Une refonte coûte 6 500 € de médiane en agence pour une PME. Voici ce qui fait varier votre devis, quand refondre plutôt que réparer, et comment garder votre référencement.",
    readingTime: "6 min de lecture",
    tags: ["refonte", "référencement", "redirections"],
    seo: {
      // Réécrit le 2026-10-16 sur « refonte site internet prix » (fiche du
      // vault `blog-etat-articles.md`, n° 7). « plan de migration refonte »
      // reste en section ; « refonte site internet caen » va à la page Caen.
      title: "Refonte de site internet : prix moyen 2026 et méthode",
      description:
        "Prix moyen d’une refonte de site en 2026, agence contre indépendant, ce qui fait varier le devis, et le plan de redirections qui garde votre référencement.",
      ogImage: {
        src: "/images/og-blog-refonte-site-internet-pme.jpg",
        alt: "Deux colonnes d’adresses sur fond noir, reliées une à une par des courbes vertes",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "site-sur-mesure-ou-wordpress",
    title: "WordPress ou site sur mesure : comment choisir",
    date: "2026-10-02",
    updated: "2026-10-16",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Méthode",
    author: eliott,
    cover: {
      src: "/images/blog/site-sur-mesure-ou-wordpress.jpg",
      alt: "Sur fond noir, un bloc unique cerné de vert face à une pile de petits blocs gris",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-site-sur-mesure-ou-wordpress.jpg",
      alt: "Sur fond noir, un bloc unique cerné de vert face à une pile de petits blocs gris",
      width: 2400,
      height: 1350,
      cadrage: { x: 50, y: 50 },
      credit: {
        prefixe: "Visuel :",
        auteur: { libelle: "Eliott Bouquerel", href: "/a-propos" },
        licence: {
          libelle: "CC BY 4.0",
          href: "https://creativecommons.org/licenses/by/4.0/deed.fr",
        },
      },
      og: {
        src: "/images/og-blog-site-sur-mesure-ou-wordpress.jpg",
        alt: "Sur fond noir, un bloc unique cerné de vert face à une pile de petits blocs gris",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "WordPress achète l’autonomie sur vos textes, le sur mesure un site rapide qui ne ressemble qu’à vous. Sur 3 ans, l’entretien pèse autant que la création.",
    readingTime: "6 min de lecture",
    tags: ["WordPress", "Next.js", "site sur mesure"],
    seo: {
      // Réécrit le 2026-10-16 sur « wordpress ou site sur mesure » (fiche
      // `blog-etat-articles.md`, n° 9). L'entretien WordPress est laissé à
      // l'article Maintenance, qui le vise : une phrase et un lien ici.
      title: "WordPress ou site sur mesure : le coût réel sur 3 ans",
      description:
        "WordPress ou site sur mesure : extensions, sécurité, vitesse et coût sur 3 ans entretien compris, avec les cas où WordPress reste le bon choix pour vous.",
      ogImage: {
        src: "/images/og-blog-site-sur-mesure-ou-wordpress.jpg",
        alt: "Sur fond noir, un bloc unique cerné de vert face à une pile de petits blocs gris",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "landing-page-ou-page-produit",
    title: "Landing page ou page produit : laquelle convertit le mieux",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Conversion",
    author: eliott,
    cover: {
      src: "/images/blog/landing-page-ou-page-produit.jpg",
      alt: "Une bottine en cuir noir posée seule sur une caisse en bois dans une boutique",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-landing-page-ou-page-produit.jpg",
      alt: "Une bottine en cuir noir posée seule sur une caisse en bois dans une boutique",
      width: 2400,
      height: 1350,
      cadrage: { x: 30, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Clark Street Mercantile",
          href: "https://commons.wikimedia.org/wiki/File:Black_boot_in_a_store_(Unsplash).jpg",
        },
        licence: {
          libelle: "CC0",
          href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-blog-landing-page-ou-page-produit.jpg",
        alt: "Une bottine en cuir noir posée seule sur une caisse en bois dans une boutique",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Ce qui décide, c’est d’où vient la personne, pas ce qu’il y a sur la page. Une landing page se justifie dès qu’il y a un budget d’acquisition en face, et se périme avec la campagne.",
    readingTime: "7 min de lecture",
    tags: ["landing page", "acquisition", "conversion"],
    seo: {
      title: "Landing page ou page produit : quand l’une bat l’autre",
      description:
        "Landing page ou page produit : laquelle choisir selon d’où vient votre visiteur, la structure qui convertit et les erreurs qui gâchent un budget pub.",
      ogImage: {
        src: "/images/og-blog-landing-page-ou-page-produit.jpg",
        alt: "Une bottine en cuir noir posée seule sur une caisse en bois dans une boutique",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "site-e-commerce-lent-ce-que-ca-coute",
    title: "Site e-commerce lent : ce que ça coûte, et comment le mesurer",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Performance",
    author: eliott,
    cover: {
      src: "/images/blog/site-e-commerce-lent-ce-que-ca-coute.jpg",
      alt: "Chronomètre mécanique à cadran blanc posé sur une table claire, couronne et anneau en haut à droite",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-site-e-commerce-lent-ce-que-ca-coute.jpg",
      alt: "Chronomètre mécanique à cadran blanc posé sur une table claire, couronne et anneau en haut à droite",
      width: 2400,
      height: 1350,
      cadrage: { x: 28, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Tim Reckmann",
          href: "https://commons.wikimedia.org/wiki/File:Stoppuhr_I_(12163259433).jpg",
        },
        licence: {
          libelle: "CC BY 2.0",
          href: "https://creativecommons.org/licenses/by/2.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-blog-site-e-commerce-lent-ce-que-ca-coute.jpg",
        alt: "Chronomètre mécanique à cadran blanc posé sur une table claire, couronne et anneau en haut à droite",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Trois seuils publiés par Google décident si votre boutique est considérée comme rapide. Ils se relèvent gratuitement, et les deux tiers des corrections consistent à retirer.",
    readingTime: "7 min de lecture",
    tags: ["performance", "signaux Web essentiels", "e-commerce"],
    seo: {
      // Position 4,4 sur « site e-commerce lent » et aucun clic (Search
      // Console, 2026-09-28) : le titre promet désormais ce que l'article
      // livre, le moyen de chiffrer la perte, plutôt qu'un intitulé technique.
      // Carte SEO du 2026-10-15 : position 4,1, 50 impressions, 0 clic. Le
      // seul chiffre que l'article garantit est le seuil de Google : c'est lui
      // qui va dans le titre, aucun taux de perte inventé.
      title: "Site e-commerce lent : au-delà de 2,5 s, ce que vous perdez",
      description:
        "Au-delà de 2,5 s, Google juge votre site lent et vos visiteurs partent. Mesurez vos 3 seuils gratuitement en 10 minutes, puis corrigez dans le bon ordre.",
      ogImage: {
        src: "/images/og-blog-site-e-commerce-lent-ce-que-ca-coute.jpg",
        alt: "Chronomètre mécanique à cadran blanc posé sur une table claire, couronne et anneau en haut à droite",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "shopify-ou-site-sur-mesure",
    title: "Shopify ou site sur mesure : comment trancher",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Méthode",
    author: eliott,
    cover: {
      src: "/images/blog/shopify-ou-site-sur-mesure.jpg",
      alt: "Buste de couture habillé d’un tissu à fines rayures, un mètre ruban autour du cou, dans un atelier",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-shopify-ou-site-sur-mesure.jpg",
      alt: "Buste de couture habillé d’un tissu à fines rayures, un mètre ruban autour du cou, dans un atelier",
      width: 2400,
      height: 1350,
      cadrage: { x: 26, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Igor Ovsyannykov",
          href: "https://commons.wikimedia.org/wiki/File:Igor_Ovsyannykov_2017-05-08_(Unsplash).jpg",
        },
        licence: {
          libelle: "CC0",
          href: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-blog-shopify-ou-site-sur-mesure.jpg",
        alt: "Buste de couture habillé d’un tissu à fines rayures, un mètre ruban autour du cou, dans un atelier",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Ce qui coûte, c’est l’écart entre votre façon de vendre et ce que la plateforme prévoit. Voici comment mettre un chiffre en face de cet écart.",
    readingTime: "7 min de lecture",
    tags: ["Shopify", "sur mesure", "e-commerce"],
    seo: {
      title: "Shopify ou site sur mesure : les cinq critères qui décident",
      description:
        "Shopify ou site sur mesure : ce que chaque option achète, le coût sur 3 ans commissions comprises, et les signaux qui font basculer vers le sur mesure.",
      ogImage: {
        src: "/images/og-blog-shopify-ou-site-sur-mesure.jpg",
        alt: "Buste de couture habillé d’un tissu à fines rayures, un mètre ruban autour du cou, dans un atelier",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "outil-sur-mesure-ou-abonnements-saas",
    title: "Logiciel sur mesure ou SaaS : comment décider",
    date: "2026-08-28",
    updated: "2026-10-16",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Outils métier",
    author: eliott,
    cover: {
      src: "/images/blog/outil-sur-mesure-ou-abonnements-saas.jpg",
      alt: "Rabot à main en métal posé sur une planche de pin, au milieu des copeaux",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-outil-sur-mesure-ou-abonnements-saas.jpg",
      alt: "Rabot à main en métal posé sur une planche de pin, au milieu des copeaux",
      width: 2400,
      height: 1350,
      cadrage: { x: 30, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Phil Gradwell",
          href: "https://commons.wikimedia.org/wiki/File:Stanley_jack_plane.jpg",
        },
        licence: {
          libelle: "CC BY 2.0",
          href: "https://creativecommons.org/licenses/by/2.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-blog-outil-sur-mesure-ou-abonnements-saas.jpg",
        alt: "Rabot à main en métal posé sur une planche de pin, au milieu des copeaux",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Un abonnement achète un droit d’usage, un logiciel sur mesure achète un actif. Le coût sur 3 ans chiffré, le seuil en utilisateurs et à qui restent vos données.",
    readingTime: "9 min de lecture",
    tags: ["outil métier", "SaaS", "coûts", "données"],
    seo: {
      // Réécriture du 2026-10-16 (vault n° 3) : vise « logiciel sur mesure ou
      // saas » et absorbe l'article « À qui appartient votre fichier client »,
      // redirigé ici en 301 (voir `next.config.ts`).
      title: "Logiciel sur mesure ou SaaS : le vrai coût sur 3 ans",
      description:
        "Abonnement SaaS ou logiciel sur mesure : le coût sur 3 ans chiffré, à qui appartiennent vos données, et les cas où l’abonnement reste le meilleur choix.",
      ogImage: {
        src: "/images/og-blog-outil-sur-mesure-ou-abonnements-saas.jpg",
        alt: "Rabot à main en métal posé sur une planche de pin, au milieu des copeaux",
        width: 1200,
        height: 630,
      },
    },
  },

  {
    slug: "synchroniser-catalogue-stock-et-commandes",
    title: "Connecter son ERP et son site e-commerce sans écart de stock",
    date: "2026-08-28",
    updated: "2026-10-16",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Outils métier",
    author: eliott,
    cover: {
      src: "/images/blog/synchroniser-catalogue-stock-et-commandes.jpg",
      alt: "Travée de rayonnage métallique chargée de cartons dans un entrepôt",
      width: 1200,
      height: 1114,
    },
    heroImage: {
      src: "/images/heros/blog-synchroniser-catalogue-stock-et-commandes.jpg",
      alt: "Travée de rayonnage métallique chargée de cartons dans un entrepôt",
      width: 2400,
      height: 1350,
      cadrage: { x: 27, y: 40 },
      credit: {
        prefixe: "Photo :",
        auteur: {
          libelle: "Encik Tekateki",
          href: "https://commons.wikimedia.org/wiki/File:Warehouse_Interior_Storing_Batteries_in_Indonesia.jpg",
        },
        licence: {
          libelle: "CC BY 4.0",
          href: "https://creativecommons.org/licenses/by/4.0/deed.fr",
        },
        modification: "retouchée",
      },
      og: {
        src: "/images/og-blog-synchroniser-catalogue-stock-et-commandes.jpg",
        alt: "Travée de rayonnage métallique chargée de cartons dans un entrepôt",
        width: 1200,
        height: 630,
      },
    },
    excerpt:
      "Votre ERP et votre boutique ne disent pas le même stock tant que personne n’a décidé lequel a raison. La table à écrire, et ce qui fait tenir la synchronisation.",
    readingTime: "7 min de lecture",
    tags: ["synchronisation", "catalogue", "outil métier"],
    seo: {
      // Réécrit le 2026-10-16 sur « connecter erp et site e-commerce » (fiche
      // `blog-etat-articles.md`, n° 12) ; le slug garde l'ancienne requête.
      title: "Connecter ERP et site e-commerce : stock et commandes",
      description:
        "Votre site, votre ERP et vos commandes ne disent pas le même stock ? La source de vérité à choisir, pourquoi les connecteurs cassent, et ce qui tient.",
      ogImage: {
        src: "/images/og-blog-synchroniser-catalogue-stock-et-commandes.jpg",
        alt: "Travée de rayonnage métallique chargée de cartons dans un entrepôt",
        width: 1200,
        height: 630,
      },
    },
  },
];

// Les articles validés dans le cockpit passent en tête du registre (`blog-cockpit.ts`).
blogPosts.unshift(...articlesDuCockpit(blogPosts));

/**
 * LES QUATRE ARTICLES MIS EN AVANT, dérivés du registre au lieu d'être recopiés.
 *
 * CE QUE ÇA CORRIGE. L'accueil et `/about` portaient chacun une liste de quatre
 * slugs ÉCRITE À LA MAIN, et la même liste dans les deux fichiers. Deux défauts
 * en découlaient, l'un déjà survenu et l'autre garanti :
 *
 *  - elle se périme à chaque publication. Publier un article ne le fait pas
 *    apparaître sur l'accueil, il faut y penser, dans deux fichiers ;
 *  - elle pointe vers des slugs qui peuvent disparaître. C'est exactement ce qui
 *    s'est produit au passage au MDX : les quatre slugs référencés n'existaient
 *    plus, la sélection ne trouvait rien, et la section rendait un titre, un
 *    bouton « Voir plus » et RIEN entre les deux. Rien ne le signalait, ni les
 *    types, ni le rendu.
 *
 * La dérivation supprime les deux : publier un article suffit à le faire
 * remonter, en retirer un suffit à l'en sortir, et une entrée non listée à
 * l'index (`listedInIndex: false`) n'y arrive jamais.
 *
 * LE CRITÈRE EST LA DATE, du plus récent au plus ancien. `sort` est stable en
 * JavaScript : à date égale, c'est l'ordre du registre qui tranche, et cet ordre
 * est un choix éditorial. Mettre un article en tête de `blogPosts` suffit donc
 * à le pousser sur l'accueil sans toucher à sa date.
 */
export const slugsMisEnAvant: string[] = [...blogPosts]
  .filter(({ listedInIndex }) => listedInIndex)
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 4)
  .map(({ slug }) => slug);

export const blogContent = {
  hero: {
    title: "Derniers articles.",
    // Le titre est rendu sur deux lignes séparées par un saut forcé.
    titleLines: ["Derniers", "articles."],
    subtitle:
      "Pour les dirigeants de PME : ce que coûtent un site ou un logiciel sur mesure, et comment choisir.",
    // Carte SEO du 2026-10-15 : l'index dit à qui il s'adresse. L'ancien
    // sous-titre parlait de boutiques en ligne, hors des deux offres.
    subtitleParagraphs: [
      {
        text: "Pour les dirigeants de PME : ce que coûtent un site ou un logiciel sur mesure, et comment choisir.",
        emphasis: ["dirigeants de PME", "comment choisir."],
      },
    ],
  },
  /*
   * LES CATÉGORIES SUIVENT LES ARTICLES, elles ne les précèdent pas.
   *
   * La liste était figée sur les cinq rubriques du template, dont quatre sans
   * aucun article : le filtre affichait des onglets qui ne renvoyaient rien.
   * Elle se déduit désormais de ce qui est publié, la première entrée restant la
   * sentinelle « tout afficher » (cf. `blog-filter.ts`).
   */
  categories: [
    "Tous",
    ...[...new Set(blogPosts.map(({ category }) => category))].sort((a, b) =>
      a.localeCompare(b, "fr"),
    ),
  ],
  posts: blogPosts.filter(({ listedInIndex }) => listedInIndex),
  relatedLink: { label: "Tous les articles", href: "/blog" },
  relatedTitleLines: ["Derniers", "articles."],
  readingTimeFallback: "3 min de lecture",
  seo: {
    title: "Blog · Eliott Bouquerel",
    description:
      "Articles pour les dirigeants de PME : prix d’un site ou d’un logiciel sur mesure, Excel, Odoo, SaaS, refonte et référencement, calculs à hypothèses affichées.",
  },
} satisfies BlogContent;
