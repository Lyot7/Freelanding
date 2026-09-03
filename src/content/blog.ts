import type { BlogContent, BlogPost } from "@/lib/content/types";

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
 */

export const blogPosts: BlogPost[] = [
  {
    slug: "etre-cite-par-chatgpt-et-perplexity",
    title: "Comment être cité par ChatGPT, Perplexity et les Aperçus IA",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "SEO et GEO",
    author: eliott,
    cover: {
      src: "/images/services/01-diagnostic.jpg",
      alt: "Un pied à coulisse posé sur des plans techniques",
      width: 1600,
      height: 926,
    },
    excerpt:
      "Un assistant ne lit pas une page, il en prélève un morceau. Ce qui rend une page citable tient en sept gestes, et aucun d’eux ne demande de changer de plateforme.",
    readingTime: "6 min de lecture",
    tags: ["GEO", "référencement", "e-commerce"],
    seo: {
      title: "Être cité par ChatGPT, Perplexity et les Aperçus IA de Google",
      description:
        "Les sept gestes qui rendent une page citable par un moteur génératif, ce que mesure le papier GEO de KDD 2024, et le test à faire sur ta boutique en deux minutes.",
      ogImage: {
        src: "/images/services/01-diagnostic.jpg",
        alt: "Un pied à coulisse posé sur des plans techniques",
        width: 1600,
        height: 926,
      },
    },
  },

  {
    slug: "seo-et-geo-quelles-differences",
    title: "SEO et GEO : quelles différences, et faut-il choisir",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "SEO et GEO",
    author: eliott,
    cover: {
      src: "/images/mecanisme-large.jpg",
      alt: "Le mouvement d’une montre mécanique, vu de près",
      width: 1920,
      height: 1119,
    },
    excerpt:
      "Le SEO se gagne sur la page entière, le GEO paragraphe par paragraphe. Quatre cinquièmes du travail sont communs ; ce qui reste change la façon d’écrire une fiche produit.",
    readingTime: "7 min de lecture",
    tags: ["GEO", "référencement", "contenu"],
    seo: {
      title: "SEO et GEO : les différences, et ce qu’il faut faire des deux",
      description:
        "Ce que le GEO change vraiment par rapport au référencement classique, ce qu’il faut arrêter, comment mesurer chacun des deux, et pourquoi ça ne mérite pas une ligne de devis à part.",
      ogImage: {
        src: "/images/mecanisme-large.jpg",
        alt: "Le mouvement d’une montre mécanique, vu de près",
        width: 1920,
        height: 1119,
      },
    },
  },

  {
    slug: "experience-utilisateur-boutique-en-ligne",
    title: "Ce que l’expérience utilisateur change au chiffre d’affaires",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Conversion",
    author: eliott,
    cover: {
      src: "/work/kpsull/catalogue.jpg",
      alt: "Le catalogue d’une boutique en ligne et ses filtres par style, genre, taille et prix",
      width: 1600,
      height: 1000,
    },
    excerpt:
      "Une boutique perd des gens à six endroits, toujours les mêmes. Chacun se relève sans refonte, et le calcul de ce qu’un point de conversion vaut chez toi tient en une multiplication.",
    readingTime: "7 min de lecture",
    tags: ["UX", "conversion", "e-commerce"],
    seo: {
      title: "Expérience utilisateur d’une boutique en ligne : ce qu’elle rapporte",
      description:
        "Les six endroits où une boutique perd des visiteurs, comment mesurer avant de redessiner, les corrections qui rendent le plus, et ce qui ne marche pas malgré les apparences.",
      ogImage: {
        src: "/work/kpsull/catalogue.jpg",
        alt: "Le catalogue d’une boutique en ligne et ses filtres",
        width: 1600,
        height: 1000,
      },
    },
  },

  {
    slug: "abandon-de-panier-causes-et-remedes",
    title: "Abandon de panier : les causes réelles, et ce qui les corrige",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Conversion",
    author: eliott,
    cover: {
      src: "/work/kpsull/a-propos.jpg",
      alt: "Le haut d’une boutique en ligne : catalogue, créateurs, panier et connexion",
      width: 1600,
      height: 1000,
    },
    excerpt:
      "Sept paniers sur dix n’aboutissent pas, et c’est normal. Ce qui ne l’est pas, c’est de perdre quelqu’un qui avait décidé d’acheter, pour un prix découvert trop tard.",
    readingTime: "7 min de lecture",
    tags: ["abandon de panier", "tunnel de commande", "conversion"],
    seo: {
      title: "Abandon de panier : causes documentées et corrections concrètes",
      description:
        "Le taux moyen documenté par l’institut Baymard, les motifs réels de renoncement par ordre de poids, les quatre chantiers qui les corrigent, et la limite des e-mails de relance.",
      ogImage: {
        src: "/work/kpsull/a-propos.jpg",
        alt: "Le haut d’une boutique en ligne, avec son panier dans la barre de navigation",
        width: 1600,
        height: 1000,
      },
    },
  },

  {
    slug: "fiche-produit-qui-convertit",
    title: "Fiche produit : la structure qui fait acheter",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Conversion",
    author: eliott,
    cover: {
      src: "/work/nslysium/produit.jpg",
      alt: "La section produit d’un site consacré à un objet unique",
      width: 1600,
      height: 1000,
    },
    excerpt:
      "Quatre questions bloquent l’achat : est-ce bien ça, combien livré, quand, et si ça ne va pas. Tant qu’elles n’ont pas de réponse visible, le reste de la page ne sert à rien.",
    readingTime: "7 min de lecture",
    tags: ["fiche produit", "conversion", "contenu"],
    seo: {
      title: "Écrire une fiche produit qui convertit : la structure complète",
      description:
        "Les quatre questions bloquantes, la structure section par section, ce qui fait le référencement d’une fiche, les erreurs les plus coûteuses, et par où commencer avec mille références.",
      ogImage: {
        src: "/work/nslysium/produit.jpg",
        alt: "La section produit d’un site consacré à un objet unique",
        width: 1600,
        height: 1000,
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
      src: "/work/nslysium/cover.jpg",
      alt: "La page d’accueil d’un site consacré à un seul produit",
      width: 1600,
      height: 1000,
    },
    excerpt:
      "Ce qui décide, c’est d’où vient la personne, pas ce qu’il y a sur la page. Une landing page se justifie dès qu’il y a un budget d’acquisition en face, et se périme avec la campagne.",
    readingTime: "7 min de lecture",
    tags: ["landing page", "acquisition", "conversion"],
    seo: {
      title: "Landing page ou page produit : quand l’une bat l’autre",
      description:
        "Ce qu’une landing page fait de plus, les quatre situations où elle rapporte, la structure section par section, et les erreurs qui gaspillent un budget publicitaire.",
      ogImage: {
        src: "/work/nslysium/cover.jpg",
        alt: "La page d’accueil d’un site consacré à un seul produit",
        width: 1600,
        height: 1000,
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
      src: "/images/services/05-suivi-evolution.jpg",
      alt: "Deux manomètres d’atelier montés sur leur détendeur",
      width: 1600,
      height: 926,
    },
    excerpt:
      "Trois seuils publiés par Google décident si ta boutique est considérée comme rapide. Ils se relèvent gratuitement, et les deux tiers des corrections consistent à retirer.",
    readingTime: "7 min de lecture",
    tags: ["performance", "signaux Web essentiels", "e-commerce"],
    seo: {
      title: "Site e-commerce lent : mesurer les Core Web Vitals et corriger",
      description:
        "Les trois seuils publiés par Google expliqués en français, comment les relever gratuitement en dix minutes, ce qui ralentit réellement une boutique, et dans quel ordre le traiter.",
      ogImage: {
        src: "/images/services/05-suivi-evolution.jpg",
        alt: "Deux manomètres d’atelier montés sur leur détendeur",
        width: 1600,
        height: 926,
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
      src: "/work/kpsull/cover.jpg",
      alt: "La page d’accueil d’une boutique en ligne développée sur mesure",
      width: 1600,
      height: 1000,
    },
    excerpt:
      "Ce qui coûte, c’est l’écart entre ta façon de vendre et ce que la plateforme prévoit. Voici comment mettre un chiffre en face de cet écart.",
    readingTime: "7 min de lecture",
    tags: ["Shopify", "sur mesure", "e-commerce"],
    seo: {
      title: "Shopify ou site sur mesure : les cinq critères qui décident",
      description:
        "Ce que chaque option achète vraiment, le calcul de coût sur trois ans commissions comprises, les trois signaux qui font basculer, et la solution mixte qui convient souvent mieux.",
      ogImage: {
        src: "/work/kpsull/cover.jpg",
        alt: "La page d’accueil d’une boutique en ligne développée sur mesure",
        width: 1600,
        height: 1000,
      },
    },
  },

  {
    slug: "outil-sur-mesure-ou-abonnements-saas",
    title: "Outil sur mesure ou abonnements SaaS : comment décider",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Outils métier",
    author: eliott,
    cover: {
      src: "/images/services/03-outil-metier.jpg",
      alt: "Des ciseaux à bois posés sur un établi tracé au crayon",
      width: 1600,
      height: 926,
    },
    excerpt:
      "Un abonnement achète un droit d’usage, un outil sur mesure achète un actif. Avant de comparer les prix, regarde ce qui, chez toi, ne rentre dans aucune case.",
    readingTime: "7 min de lecture",
    tags: ["outil métier", "SaaS", "coûts"],
    seo: {
      title: "Outil sur mesure ou abonnements SaaS : les critères de décision",
      description:
        "Le calcul de coût que personne ne fait, les cas où l’abonnement reste le bon choix, les trois signaux qui font basculer, et la voie mixte qui rend le plus vite.",
      ogImage: {
        src: "/images/services/03-outil-metier.jpg",
        alt: "Des ciseaux à bois posés sur un établi tracé au crayon",
        width: 1600,
        height: 926,
      },
    },
  },

  {
    slug: "synchroniser-catalogue-stock-et-commandes",
    title: "Pourquoi tes outils ne sont jamais d’accord sur le stock",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Outils métier",
    author: eliott,
    cover: {
      src: "/images/services/04-logiciel-metier.jpg",
      alt: "Les engrenages d’une machine industrielle en prise",
      width: 1600,
      height: 926,
    },
    excerpt:
      "Aucun de tes outils n’a été désigné comme la source de vérité. C’est une décision de gestion, et aucun connecteur ne la prendra à ta place.",
    readingTime: "7 min de lecture",
    tags: ["synchronisation", "catalogue", "outil métier"],
    seo: {
      title: "Synchroniser catalogue, stock et commandes entre ses outils",
      description:
        "Pourquoi les connecteurs du marché finissent par casser, les trois décisions à prendre avant de brancher quoi que ce soit, et les six éléments d’une synchronisation qui tient.",
      ogImage: {
        src: "/images/services/04-logiciel-metier.jpg",
        alt: "Les engrenages d’une machine industrielle en prise",
        width: 1600,
        height: 926,
      },
    },
  },

  {
    slug: "migrer-sa-boutique-sans-perdre-son-referencement",
    title: "Migrer sa boutique sans perdre son référencement",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "SEO et GEO",
    author: eliott,
    cover: {
      src: "/images/services/02-visibilite-locale.jpg",
      alt: "Deux commerces de quartier au coin d’une rue",
      width: 1600,
      height: 926,
    },
    excerpt:
      "Une migration se perd toujours au même endroit : le plan de redirection. Il se prépare avant la bascule, et c’est la seule étape qu’on ne rattrape pas après.",
    readingTime: "7 min de lecture",
    tags: ["migration", "référencement", "e-commerce"],
    seo: {
      title: "Migration de boutique en ligne : garder son référencement",
      description:
        "L’inventaire à faire avant la bascule, les trois règles du plan de redirection, ce qui doit rester identique le jour J, et ce qu’il faut surveiller les deux mois suivants.",
      ogImage: {
        src: "/images/services/02-visibilite-locale.jpg",
        alt: "Deux commerces de quartier au coin d’une rue",
        width: 1600,
        height: 926,
      },
    },
  },

  {
    slug: "accessibilite-boutique-en-ligne-obligation-et-levier",
    title: "Accessibilité d’une boutique en ligne : obligation et levier",
    date: "2026-08-28",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Méthode",
    author: eliott,
    cover: {
      src: "/images/escalier-lumiere-paysage.jpg",
      alt: "Un escalier de béton, un rai de lumière posé de la première à la dernière marche",
      width: 1512,
      height: 960,
    },
    excerpt:
      "Depuis le 28 juin 2025, la directive européenne sur l’accessibilité vise le commerce électronique. Le seuil d’exemption est plus bas qu’on ne le croit, et les corrections font vendre.",
    readingTime: "7 min de lecture",
    tags: ["accessibilité", "conformité", "conversion"],
    seo: {
      title: "Accessibilité e-commerce : ce que l’European Accessibility Act impose",
      description:
        "Le champ de la directive 2019/882, le seuil d’exemption des micro-entreprises, les dix défauts qu’on trouve partout, trois tests gratuits, et ce qu’il ne faut surtout pas faire.",
      ogImage: {
        src: "/images/escalier-lumiere-paysage.jpg",
        alt: "Un escalier de béton, un rai de lumière posé sur les marches",
        width: 1512,
        height: 960,
      },
    },
  },

  {
    slug: "formulaire-inscription-erreurs-saisie",
    title: "Le formulaire qui faisait fuir les clients",
    date: "2026-08-26",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Conversion",
    author: eliott,
    cover: {
      src: "/work/wurth/resultat-92.jpg",
      alt: "Le chiffre de 92 % de réduction des erreurs à la création de compte",
      width: 1200,
      height: 900,
    },
    // Aucun chiffre ici qui ne soit mesuré : seul le −92 % l'est, et il vit
    // dans le corps avec sa source. « Un client sur deux » aurait sonné mieux,
    // et n'aurait été vérifiable nulle part.
    excerpt:
      "Chez un distributeur industriel, les erreurs s’accumulaient à la création de compte. Le relevé des erreurs réelles a montré que le formulaire n’annonçait jamais ce qu’il attendait.",
    readingTime: "5 min de lecture",
    tags: ["formulaire", "conversion", "UX"],
    seo: {
      title: "Pourquoi tes clients abandonnent ton formulaire d’inscription",
      description:
        "Un parcours de création de compte refondu chez un distributeur industriel : 92 % d’erreurs de saisie en moins, en rendant visibles les contraintes au lieu de les révéler à la validation.",
      ogImage: {
        src: "/work/wurth/resultat-92.jpg",
        alt: "92 % d’erreurs en moins à la création de compte",
        width: 1200,
        height: 900,
      },
    },
  },
  /*
   * TROIS ARTICLES AJOUTÉS LE 2026-08-27, et pourquoi ils n'ont pas de chiffre
   * de résultat client.
   *
   * Ce sont des articles de MÉTHODE, pas des études de cas. La règle du blog
   * est qu'aucun chiffre ne s'écrit sans être mesuré : les seuls chiffres qui
   * apparaissent ici sont des valeurs PUBLIÉES et sourcées dans le corps
   * (article 20 du RGPD, seuils des signaux Web essentiels de Google). Le jour
   * où une mission réelle donne un résultat mesuré, elle fera un quatrième type
   * d'article, comme celui de Würth.
   *
   * Les visuels sont les photographies sous licence Unsplash de la section
   * Services (voir `docs/ASSETS.md`) : elles disent déjà ce que dit chaque
   * prestation, et elles raccordent le blog au reste du site.
   */
  {
    slug: "dessiner-avant-de-coder",
    title: "Je dessine l’interface avant d’écrire le code",
    date: "2026-08-27",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Méthode",
    author: eliott,
    cover: {
      src: "/images/services/03-outil-metier.jpg",
      alt: "Des ciseaux à bois posés sur un établi tracé au crayon",
      width: 1600,
      height: 926,
    },
    excerpt:
      "Dessiner un outil métier avant de le construire n’est pas une étape de décoration. C’est l’endroit où les décisions difficiles se prennent pendant qu’elles sont encore gratuites.",
    readingTime: "4 min de lecture",
    tags: ["méthode", "outil métier", "conception"],
    seo: {
      title: "Pourquoi je dessine l’interface avant d’écrire le code",
      description:
        "Un outil métier ne se juge pas sur son apparence mais sur le fait de savoir s’en servir sans formation. Ça se décide au dessin, pas au code, et c’est là que ça ne coûte rien.",
      ogImage: {
        src: "/images/services/03-outil-metier.jpg",
        alt: "Des ciseaux à bois posés sur un établi tracé au crayon",
        width: 1600,
        height: 926,
      },
    },
  },
  {
    slug: "a-qui-appartient-votre-fichier-client",
    title: "À qui appartient ton fichier client ?",
    date: "2026-08-27",
    dateSource: "editorial",
    listedInIndex: true,
    category: "Outils métier",
    author: eliott,
    cover: {
      src: "/images/services/04-logiciel-metier.jpg",
      alt: "Les engrenages d’une machine industrielle en prise",
      width: 1600,
      height: 926,
    },
    excerpt:
      "La question ne se pose jamais au moment de signer un abonnement logiciel. Elle se pose le jour où tu veux partir, et ce jour-là il est trop tard pour la poser.",
    readingTime: "5 min de lecture",
    tags: ["logiciel", "données", "RGPD"],
    seo: {
      title: "Logiciel métier : à qui appartiennent tes données ?",
      description:
        "Export, commission sur ton activité, nom affiché à ton client : les quatre questions à poser avant de confier ton activité à un logiciel du marché, et ce que le RGPD couvre vraiment.",
      ogImage: {
        src: "/images/services/04-logiciel-metier.jpg",
        alt: "Les engrenages d’une machine industrielle en prise",
        width: 1600,
        height: 926,
      },
    },
  },
  {
    slug: "ce-que-google-montre-de-vous",
    title: "Ce que Google montre de toi",
    date: "2026-08-27",
    dateSource: "editorial",
    listedInIndex: true,
    category: "SEO et GEO",
    author: eliott,
    cover: {
      src: "/images/services/02-visibilite-locale.jpg",
      alt: "Deux commerces de quartier au coin d’une rue",
      width: 1600,
      height: 926,
    },
    excerpt:
      "Pour un client qui cherche ton métier près de chez lui, la première vitrine est la fiche que Google affiche, avec tes horaires, tes photos et tes avis.",
    readingTime: "5 min de lecture",
    tags: ["référencement local", "Google", "performance"],
    seo: {
      title: "Visibilité locale : ce que Google montre de toi",
      description:
        "Les trois facteurs du classement local documentés par Google, les seuils publiés des signaux Web essentiels, et ce que tu peux corriger cette semaine sans personne.",
      ogImage: {
        src: "/images/services/02-visibilite-locale.jpg",
        alt: "Deux commerces de quartier au coin d’une rue",
        width: 1600,
        height: 926,
      },
    },
  },
];

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
      "Ce que j’apprends en construisant des boutiques en ligne et les outils qui vont avec.",
    subtitleParagraphs: [
      {
        text: "Ce que j’apprends en construisant des boutiques en ligne et les outils qui vont avec.",
        emphasis: ["Ce que j’apprends", "des boutiques en ligne"],
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
  newsletter: {
    title: "Newsletter",
    body: "Des notes courtes sur les boutiques en ligne, la conversion et les outils qui font gagner des heures.",
    emailLabel: "Adresse e-mail",
    placeholder: "toi@exemple.com",
    submitLabel: "S’inscrire",
  },
  relatedLink: { label: "Tous les articles", href: "/blog" },
  relatedTitleLines: ["Derniers", "articles."],
  readingTimeFallback: "3 min de lecture",
  seo: {
    title: "Blog · Eliott Bouquerel",
    description:
      "Des notes sur les boutiques en ligne : conversion, vitesse, référencement, et les outils sur mesure qui remplacent une pile d’abonnements.",
  },
} satisfies BlogContent;
