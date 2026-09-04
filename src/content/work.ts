import type { WorkContent, WorkItem } from "@/lib/content/types";

/**
 * Études de cas — CONTENU RÉEL depuis le 2026-08-10.
 *
 * Les cinq études héritées du template (Box mode, Nomad Stays, We run brand,
 * Stackline, Johny Nashville) sont SUPPRIMÉES. Elles présentaient des clients
 * inventés et des résultats fabriqués (+127 % de conversion, −41 % de rebond,
 * livraison en 14 jours) sous le nom d'Eliott, dont l'activité a démarré le
 * 1er juin 2026. C'était le risque de crédibilité le plus élevé du site.
 *
 * RÈGLES TENUES ICI, sans exception :
 *
 * 1. Aucun chiffre qui n'ait été mesuré. Kpsull et NSLysium n'en portent AUCUN :
 *    ce sont des projets d'école, ils n'ont ni trafic ni conversion à montrer.
 *    Le contrat rend `results` optionnel exprès, pour ne pas forcer
 *    l'invention.
 * 2. Aucun témoignage. Personne n'en a écrit, `testimonial` reste absent.
 * 3. LE COMMANDITAIRE EST NOMMÉ POUR CE QU'IL EST, sur les trois projets, et
 *    LE LIBELLÉ FAIT LE TRAVAIL, PAS LE TEXTE. Révisé le 2026-09-04.
 *
 *    « Réalisation personnelle » disait vrai sans rien dire : la ligne
 *    « CLIENT » de la fiche affichait une formule qui pouvait se lire comme
 *    une commande reçue. Les deux premiers projets sortent d'une formation.
 *    Ce qui est réel, c'est le travail : conception, design et développement
 *    faits par Eliott, de bout en bout. Ce qui n'existe pas, c'est le client
 *    qui l'aurait payé.
 *
 *      - Kpsull : projet d'école mené comme une création d'entreprise, monté
 *        pour son propre compte. Il n'y a pas de commanditaire.
 *      - NSLysium : workshop d'école, le « client » était une équipe
 *        d'étudiants d'une autre formation. Le produit n'existe pas et le site
 *        ne sera pas lancé. La page, elle, existe et se juge sur pièce.
 *      - Würth : mission réelle, menée chez un industriel réel, en 2024. La
 *        fiche affiche « EMPLOYEUR : WÜRTH FRANCE » (`clientKind: "employer"`).
 *
 *    LA FORME DU CONTRAT N'EST PAS UN TEXTE PUBLIC. Elle a été écrite, puis
 *    retirée, puis réécrite, puis retirée pour de bon : « en stage » figurait
 *    dans la ligne « CLIENT », dans le chapô, dans le rôle, dans le résumé, dans
 *    la description de `/work` et dans le libellé du chiffre de la page
 *    d'accueil. Le motif était toujours le même — empêcher qu'on lise une
 *    prestation facturée en indépendant — et c'est un motif de MISE EN PAGE,
 *    pas de contenu : il se règle par le libellé de la ligne, pas en publiant
 *    six fois une justification que personne n'a demandée. Le raisonnement qui
 *    conduit à une formulation reste dans ces commentaires ; il ne descend
 *    jamais dans le texte rendu.
 *
 * 4. Aucun logo de marque. Würth est NOMMÉ (mention nominative d'une expérience
 *    professionnelle, licite), mais son logo n'est pas reproduit : l'usage
 *    d'une marque déposée demande un accord que je n'ai pas.
 * 5. L'ORDRE DE CE TABLEAU EST L'ORDRE D'AFFICHAGE, partout : la page `/work`
 *    rend `workItems` tel quel (aucun tri dans `WorkExplorer`, le filtre ne
 *    fait que retirer des entrées), et la chaîne `nextProject` suit la même
 *    séquence en boucle fermée.
 *
 *    Würth est en DEUXIÈME position depuis le 2026-08-31, devant NSLysium.
 *    Motif : c'est la seule mission réelle des trois, menée en entreprise sur
 *    un site à fort trafic, et la seule qui porte un résultat mesuré. NSLysium
 *    est un workshop d'école dont le produit n'existe pas. La preuve la plus
 *    solide passe donc devant la démonstration de style. Kpsull garde la
 *    première place : c'est le projet le plus complet et sa vidéo de carte
 *    tient l'ouverture de la page.
 *
 *    Trois listes portent cet ordre et doivent rester d'accord : ce tableau,
 *    `featuredWorkSlugs` dans `home.ts` (sélection de la page d'accueil) et
 *    les routes `kind: "work"` de `routes.ts` (sitemap et `llms.txt`).
 *
 * ASSETS : captures et vidéos produites par Eliott sur ses propres sites, donc
 * sans aucune question de droits.
 *
 * DEUX FAMILLES DE CAPTURES WÜRTH, ET DEUX CADRAGES, depuis le 2026-09-04.
 * Elles ne servent plus au même endroit, il n'y a donc plus de raison de les
 * préparer de la même façon.
 *
 *   1. LES DEUX ÉCRANS NARRATIFS (`01-deja-client`, `02-siren-non-reconnu`)
 *      restent sur le canevas commun de 1600 × 1000, le rapport de tous les
 *      autres visuels du site (1,6). Ils sont rendus PLEINE LARGEUR aux
 *      emplacements du gabarit, dans un cadre à parallaxe : leur calque est
 *      plus grand que le cadre et dérive au défilement, ce qui rogne en
 *      permanence une part du canevas. Marges MESURÉES à 1440 sur la page
 *      rendue, et non déduites du débord nominal : 10,1 % de chaque côté en
 *      largeur (calque 1518 × 1082 pour un cadre 1380 × 863) et de 7,8 à 8,9 %
 *      en hauteur. D'où une zone utile de 1270 × 780, contenu centré sur le
 *      blanc du formulaire, jamais étiré ni rogné.
 *
 *   2. LES ÉCRANS DE LA SÉQUENCE (`03` à `07`) sont recadrés SUR LEUR CONTENU,
 *      à leur rapport naturel, avec 3 % de marge blanche. Ils sont rendus dans
 *      `BlocEtape`, sur la moitié gauche de la page et SANS parallaxe : plus de
 *      calque qui déborde, donc plus de marge de sécurité à réserver. Le
 *      canevas commun leur coûtait cher à cette taille — le contenu d'une
 *      capture n'occupait que 70 % de la largeur du fichier, soit 30 % du cadre
 *      perdus en blanc alors que le cadre venait précisément d'être réduit de
 *      moitié.
 *
 *      `05` et `06` sont un cas à part dans le cas à part : elles
 *      alimentent le comparateur avant / après, et le cadrage y est contraint
 *      par une chose que ni le recadrage ni le choix de la source ne peuvent
 *      corriger.
 *
 *      LES DEUX ÉTATS N'ONT PAS LA MÊME MISE EN PAGE. Quand le mot de passe est
 *      accepté, « Force du mot de passe : Fort » passe sur DEUX lignes, ce qui
 *      pousse tout ce qui suit vers le bas. Mesuré au profil des lignes de
 *      contenu, sur les deux jeux de captures existants : l'étiquette et le
 *      champ sont alignés au pixel, la barre de force descend de 26 px, et le
 *      bloc des trois contraintes descend de 48 px. Un curseur ne peut donc pas
 *      superposer un cadre qui contient à la fois la barre et les contraintes :
 *      quel que soit l'élément sur lequel on aligne, l'autre fait une marche
 *      visible.
 *
 *      LE CADRE NE GARDE DONC QUE LES TROIS CONTRAINTES, la démonstration
 *      elle-même — rouge avant la frappe, vert une fois le mot de passe
 *      accepté. Boîtes `(30, 710) → (454, 914)` pour l'état vide et
 *      `(30, 758) → (454, 962)` pour l'état validé : mêmes dimensions, décalées
 *      des 48 px mesurés, donc superposition au pixel. La barre de force sort du
 *      cadre et vit dans la légende.
 *
 *      LA SOURCE RESTE CELLE DU DÉPÔT, en 1240 px de large, et non les captures
 *      d'écran de navigateur du 2026-09-04. Celles-ci ont été essayées : leur
 *      bloc de contraintes ne porte que 188 px de contenu utile contre 376 pour
 *      l'original, soit un agrandissement de 3,1 fois à l'affichage au lieu de
 *      1,6. Elles ne réglaient pas le désalignement — il vient du site, pas de
 *      la capture — et coûtaient la moitié de la définition.
 *
 * Contrôle de la marge blanche réelle d'un fichier :
 *
 *     python3 -c "from PIL import Image, ImageChops; im=Image.open('f.png').convert('RGB'); \
 *       print(ImageChops.difference(im, Image.new('RGB', im.size, (255,255,255))).getbbox())"
 *
 * Recettes, à rejouer si une capture est remplacée (les originaux sont
 * conservés dans `docs/sources/wurth/`) :
 *
 *     # famille 1 : canevas commun, contenu centré
 *     sips -z <h_ajustée> <l_ajustée> capture.png       # seulement si besoin
 *     sips -p 1000 1600 --padColor FFFFFF capture.png
 *     # où l'ajustement vaut min(1270 / l, 780 / h, 1), plafonné à 1.
 *
 *     # famille 2 : recadrage sur le contenu, marge de 3 %
 *     python3 -c "from PIL import Image, ImageChops; \
 *       im=Image.open('src.png').convert('RGB'); \
 *       b=ImageChops.difference(im, Image.new('RGB', im.size, (255,255,255))).getbbox(); \
 *       m=round((b[2]-b[0])*0.03); \
 *       im.crop((b[0]-m, b[1]-m, b[2]+m, b[3]+m)).save('dst.png')"
 *
 * `width` et `height` de chaque entrée de galerie doivent suivre le fichier :
 * ils fixent le rapport du cadre, et un rapport faux rogne l'image.
 */

const KPSULL_URL = "https://kpsull.eliottbouquerel.fr/";
const NSLYSIUM_URL = "https://nslysium.eliottbouquerel.fr/";
const WURTH_URL =
  "https://eshop.wurth.fr/is-bin/INTERSHOP.enfinity/WFS/3107-B1-Site/fr_FR/-/EUR/ViewRegistration-Step1View#/Step1";

export const workItems: WorkItem[] = [
  {
    slug: "kpsull",
    title: "Kpsull",
    /* Ligne « CLIENT » de la fiche. Elle est en capitales, sur une ligne qui
       ne se replie pas (`white-space: pre`) : à 390 il reste environ 300px
       après le libellé, soit une quarantaine de caractères. « Projet monté en
       propre » en fait 22. */
    client: "Projet monté en propre",
    year: "2026",
    role: "Conception, design et développement",
    categories: ["Web design", "Développement"],
    services: [
      "Architecture de la plateforme",
      "Design d’interface",
      "Développement Next.js",
      "Catalogue et recherche à facettes",
      "Panier et comptes",
    ],
    accent: "#e9e9e9",
    cover: { src: "/work/kpsull/cover.jpg", alt: "Page d’accueil de Kpsull" },
    /*
     * FOND DU HERO : la photographie SEULE, sans l'interface du site.
     *
     * La couverture est une capture de la page d'accueil, barre de navigation
     * comprise. En vignette c'est ce qu'il faut, on reconnaît un site. En fond
     * de hero pleine largeur, elle passait SOUS l'en-tête de ce site-ci :
     * mesuré à 1440, la barre « CATALOGUE / CREATEURS / A PROPOS / PANIER / SE
     * CONNECTER » de Kpsull s'affichait derrière « RÉALISATIONS / BLOG / À
     * PROPOS / CONTACT », le titre « KPSULL » chevauchait le slogan
     * « L'ANTIDOTE A L'UNIFORME » et le résumé recouvrait « PARCOURIR LE
     * CATALOGUE ». Deux sites empilés l'un sur l'autre.
     *
     * Le fichier est l'ORIGINAL servi par le site lui-même
     * (`kpsull.eliottbouquerel.fr/images/hero-skater.jpg`), pas une capture
     * retouchée : aucun pixel n'est inventé.
     */
    heroBackground: {
      src: "/work/kpsull/hero-fond.jpg",
      alt: "Un skateur immobile au milieu d’un passage piéton, la foule filée autour de lui",
    },
    cardMedia: { kind: "video", src: "/work/kpsull/demo.mp4" },
    /* Plateau 3D, écran à droite. Généré par `bun scripts/mockup-projets.mjs`
       à partir de la démonstration ci-dessus : c'est le vrai site qui joue
       dans la dalle. */
    cardMockup: {
      poster: {
        src: "/work/kpsull/mockup-poster.jpg",
        alt: "La page d’accueil de Kpsull affichée sur un portable posé sur un rebord",
      },
      video: { kind: "video", src: "/work/kpsull/mockup.mp4" },
    },
    excerpt:
      "Place de marché reliant des créateurs de mode indépendants à leurs acheteurs.",
    overview:
      "Kpsull est une place de marché qui met en relation des créateurs de mode indépendants et des acheteurs, chaque pièce étant fabriquée puis expédiée par son créateur. Le projet est né en formation et je l’ai mené comme une création d’entreprise : personne ne me l’a commandé, j’en ai fait la conception, le design et le développement, et j’ai visé un e-commerce multi-vendeurs complet plutôt qu’une vitrine.",
    problem: [
      "Un créateur seul n’a ni la vitrine ni la logistique d’une marque.",
      "Il vend sur les réseaux, au message privé, sans catalogue consultable, sans paiement intégré et sans moyen d’être trouvé par quelqu’un qui ne le suit pas déjà. Côté acheteur, le problème est symétrique : rien ne permet de parcourir ce que font les créateurs d’une région et d’acheter sans passer par une conversation.",
    ],
    outcome: [
      "Une place de marché où le créateur gère ses pièces et où l’acheteur parcourt, filtre et commande sans jamais sortir du site.",
    ],
    approach: [
      "Partir du parcours d’achat, pas du catalogue.",
      "La recherche à facettes est le cœur du produit : style, genre, taille et prix se combinent, et l’adresse reflète la sélection en cours, ce qui rend chaque combinaison partageable et indexable. Le reste suit ce principe : fiches produits autonomes, panier persistant, comptes acheteur et créateur séparés, et une grille éditoriale qui laisse la place aux photos plutôt qu’à l’habillage.",
    ],
    body: [
      "Le site est construit en Next.js, avec un rendu serveur sur les pages de catalogue pour qu’elles restent indexables, et un suivi des erreurs en production.",
      "Ce projet est celui qui montre le plus de surface fonctionnelle : c’est un produit complet, avec ses états vides, ses filtres combinés et ses deux profils d’utilisateur, pas une page de présentation.",
    ],
    gallery: [
      { src: "/work/kpsull/catalogue.jpg", alt: "Catalogue de Kpsull avec ses filtres par style, genre, taille et prix" },
      { src: "/work/kpsull/createurs.jpg", alt: "Page des créateurs de Kpsull" },
      { src: "/work/kpsull/a-propos.jpg", alt: "Page À propos de Kpsull" },
    ],
    projectVideoUrl: "/work/kpsull/demo.mp4",
    videoPoster: { src: "/work/kpsull/demo-poster.jpg", alt: "Démonstration de navigation dans Kpsull" },
    /* PAS DE `launched`. Il alimentait la ligne « Durée » de la fiche projet
       (`uiLabels.work.timelineLabel`, « Timeline » dans le gabarit anglais, où
       la valeur était une DURÉE du type « 6 weeks »). Ici il portait une année,
       et la fiche affichait donc « DURÉE : 2026 » juste au-dessus de
       « ANNÉE : 2026 » : un libellé faux, et la même valeur écrite deux fois.
       Le champ reste optionnel dans le type pour le jour où une vraie durée
       sera mesurée. */
    liveUrl: KPSULL_URL,
    nextProject: "wurth-creation-de-compte",
  },
  {
    slug: "wurth-creation-de-compte",
    title: "Création de compte, Würth",
    /*
     * LA FORME DU CONTRAT N'EST PLUS ÉCRITE, ET LE LIBELLÉ LA REMPLACE.
     * Arbitré le 2026-09-04, sur consigne d'Eliott.
     *
     * Le champ a porté « Würth France, en stage », après avoir porté « Würth
     * France » tout court. Les deux étaient mauvais, pour la raison opposée :
     * sous le libellé « CLIENT », sur un site de freelance, « Würth France » se
     * lit comme une prestation facturée en indépendant, et le corriger en
     * écrivant « en stage » dans une ligne publique revient à publier une
     * justification que personne n'a demandée.
     *
     * `clientKind: "employer"` change le LIBELLÉ, pas la valeur : la fiche
     * affiche « EMPLOYEUR : WÜRTH FRANCE ». La relation est nommée pour ce
     * qu'elle est, sans qualifier le contrat.
     *
     * Ce que la donnée retient de la vérification du 2026-08-29 (profil
     * LinkedIn : « Développeur web front-end · Würth France · Stage · mars 2024
     * - juin 2024 · 4 mois · Erstein »), c'est l'ANNÉE, 2024, et rien d'autre.
     * Le site a affirmé une alternance jusqu'en juillet 2026 : faux sur le type
     * de contrat et faux de deux ans. C'est cette date qui devait être corrigée,
     * pas le silence sur le contrat.
     */
    client: "Würth France",
    clientKind: "employer",
    year: "2024",
    role: "Développement front-end, refonte du parcours de création de compte",
    /* La fiche annonçait « Périmètre de la mission : Développement », valeur
       tirée de `categories` — qui sert au filtre de `/work` et range par
       famille de métier, pas par périmètre. */
    scope: "Parcours d’inscription",
    categories: ["Développement"],
    services: [
      "Analyse des erreurs de saisie",
      "Refonte du formulaire",
      "Validation et messages d’erreur",
    ],
    accent: "#c8f24a",
    /*
     * LA COUVERTURE EST LE PREMIER ÉCRAN DU PARCOURS. Arbitré le 2026-08-28.
     *
     * Historique en deux temps. Elle a d'abord porté la carte typographique du
     * résultat : le chiffre est ce que le travail a PRODUIT, pas ce qu'il est,
     * et sur une grille de trois vignettes où les deux autres montrent un
     * écran, celle-ci montrait un slogan. Elle est ensuite passée à
     * `formulaire-etape-1.jpg`, capture de la page publique. Deux défauts y
     * restaient :
     *
     *   1. cette capture REPRODUIT LE LOGO DE WÜRTH, ce que la règle 4 de ce
     *      fichier interdit tant qu'aucun accord n'est donné ;
     *   2. elle montre le milieu du parcours, pas son entrée.
     *
     * `01-deja-client.png` règle les deux : c'est le tout premier écran, avant
     * que le moindre problème de saisie se pose, et la marque n'y apparaît
     * qu'en toutes lettres, dans une question. Son canevas est celui de tout
     * le site, 1600 × 1000, donc la vignette se comporte exactement comme
     * celles de Kpsull et de NSLysium : le cadre de carte, en 1,73678, y rogne
     * 4,3 % en haut et en bas, sur de la marge blanche et sur rien d'autre.
     */
    /* La couverture pointe une VARIANTE au canevas commun 1600 x 1000, et non
       le fichier de la galerie : celui-ci est recadré au plus près de son
       contenu (rapport 2,169), et la vignette de `/work`, en 1,73678, y
       rognerait 20 % de chaque côté, donc les deux tuiles de l'aiguillage. */
    cover: {
      src: "/work/wurth/01-deja-client-cover.png",
      alt: "La première question du parcours Würth : l’entreprise est-elle déjà cliente, ou pas encore ?",
    },
    /*
     * LE HERO PORTE LE PLATEAU 3D DEPUIS LE 2026-09-04, sur demande d'Eliott.
     *
     * Ce qu'il remplace, et pourquoi le remplacement tient. Le fond était la
     * carte typographique « −92 % », choisie faute de mieux : la capture NUE
     * du formulaire est blanche, elle aurait rendu le titre blanc de la page
     * illisible et empilé l'en-tête de Würth sous le nôtre. La carte, elle,
     * était composée pour un cadre 1600 × 1000 fixe et ne survivait pas au
     * plein écran : relevé à 1440 × 810, son libellé de tête « WÜRTH ·
     * FORMULAIRE DE CRÉATION DE COMPTE » passait sous notre barre de
     * navigation, son chiffre était tranché à gauche par le cadrage et sa
     * phrase de pied traversait le titre « CRÉATION DE COMPTE, WÜRTH ». Trois
     * textes empilés sur deux niveaux de lecture, visibles à l'œil nu.
     *
     * `mockup.jpg` règle les trois d'un coup, sans rien inventer : la scène est
     * un rendu 3D produit par `scripts/mockup-projets.mjs`, l'écran incrusté
     * est la vraie première étape du formulaire. Elle est SOMBRE partout sauf
     * sur la dalle, donc le titre blanc reste très au-dessus du plancher WCAG,
     * et son rapport (1376/768 = 1,792) tombe à 0,8 % de celui du hero à 1440
     * (1440/810 = 1,778) : le cadrage ne rogne quasiment rien, là où la carte
     * perdait un tiers de sa composition.
     *
     * LE LOGO DE WÜRTH Y EST VISIBLE, et c'est une entorse ASSUMÉE à la règle 4
     * de ce fichier. Elle ne date pas d'aujourd'hui : ce même fichier sert déjà
     * de plateau à la carte du projet sur `/work` et sur la page d'accueil, le
     * logo est donc publié depuis que les plateaux existent. Le hero ne change
     * pas la nature de l'exposition, il en change l'échelle. À trancher pour de
     * bon quand Würth répondra (`docs/EMAIL-WURTH-AUTORISATION.md`) ; d'ici là
     * la marque n'apparaît que sur un écran de synthèse, jamais comme
     * signature de ce site.
     *
     * LA CARTE « −92 % » N'EST PLUS RENDUE NULLE PART, et c'est voulu. Elle a
     * d'abord été redescendue dans le fil, après le titre de conclusion, puis
     * retirée le même jour sur consigne d'Eliott : « le −92 % doit être du
     * texte uniquement ». Le chiffre vit déjà dans le bloc « résultats », en
     * texte sélectionnable, indexable et lisible par un lecteur d'écran. Le
     * republier en image, c'était l'écrire deux fois et payer mille pixels de
     * page pour la seconde. Le fichier reste sur le disque et dans
     * `docs/ASSETS.md`.
     */
    heroBackground: {
      src: "/work/wurth/mockup.jpg",
      alt: "La première étape du formulaire de création de compte affichée sur un écran, dans une pièce sombre",
    },
    excerpt:
      "Refonte du parcours de création de compte de l’eShop français de Würth.",
    overview:
      "Würth France distribue des fournitures professionnelles aux artisans et aux industriels. Sur l’eShop, j’ai repris le parcours de création de compte : celui par lequel passe tout nouveau client avant de pouvoir commander.",
    problem: [
      "Un formulaire que les gens n’arrivaient pas à remplir.",
      "Les erreurs de saisie s’accumulaient à la création de compte : champs mal compris, contraintes découvertes seulement à la validation, messages qui ne disaient pas quoi corriger. Chaque échec est un client qui abandonne, ou un appel au support.",
    ],
    outcome: [
      "Un parcours où l’erreur est signalée au moment où elle est commise, avec ce qu’il faut faire pour la corriger.",
    ],
    approach: [
      "Regarder ce qui échoue avant de redessiner.",
      "Le point de départ a été le relevé des erreurs réellement commises, pas une opinion sur le formulaire. Les contraintes ont ensuite été rendues visibles avant la saisie plutôt qu’après, la validation déplacée au fil de la frappe, et chaque message réécrit pour dire quoi corriger au lieu de constater un refus. Le tout est construit en surcouche : la plateforme de l’eShop est allemande et son code source n’est pas ouvert à la filiale française, donc le parcours est réécrit par-dessus le formulaire existant, dont les champs superflus sont pilotés et masqués depuis l’extérieur. Les données, elles, viennent de registres publics : un proxy vers l’INSEE pour le SIRET, la Base Adresse Nationale pour la rue, geo.api.gouv.fr pour le code postal.",
    ],
    body: [
      "Le résultat est mesuré en interne sur les erreurs de création de compte, avant et après la refonte.",
      "C’est le projet le moins spectaculaire des trois et le plus représentatif de ce que je fais : un formulaire n’intéresse personne jusqu’au jour où on compte ce qu’il coûte.",
    ],
    results: [
      { label: "d’erreurs à la création de compte, mesuré en interne", value: "−92 %" },
    ],
    /*
     * GALERIE : DEUX ÉCRANS NARRATIFS, PUIS UNE SÉQUENCE NUMÉROTÉE.
     *
     * CE QU'UNE LÉGENDE DOIT DIRE. Pas ce qu'on voit, `alt` s'en charge pour
     * qui ne voit pas l'image. Elle dit le DÉFAUT que l'écran corrige. Une
     * capture de formulaire ne se vend pas toute seule : sans la phrase, un
     * champ pré-rempli n'est qu'un champ pré-rempli.
     *
     * CE QUE LE NUMÉRO AJOUTE, et pourquoi la légende ne suffisait pas.
     * Corrigé le 2026-09-04. Les sept captures montrent LE MÊME formulaire
     * blanc à sept instants différents : à l'échelle d'un cadre de 1380 px de
     * large, elles se ressemblent au point que rien n'indique laquelle précède
     * l'autre. Cinq d'entre elles étaient de plus empilées d'affilée en fin de
     * page, sur plus de 5000 px, sans un mot entre elles. Le lecteur avait sept
     * preuves et aucun parcours.
     *
     * `step` porte le rang dans le PARCOURS DU VISITEUR, et c'est lui qui décide
     * du rendu (voir la note de répartition dans `WorkNarrative`) : une entrée
     * numérotée rejoint la séquence de fin de page, une entrée sans numéro reste
     * un visuel d'ambiance posé à un emplacement narratif. Les deux premières
     * gardent leur emplacement quoi qu'il arrive : ce sont les seuls écrans que
     * le texte de la page commente lui-même.
     *
     * `stepTitle` nomme ce que l'écran FAIT en quelques mots, ce qui donne au
     * lecteur pressé la séquence complète sans lire une seule légende.
     *
     * `05` ET `06` NE SONT PLUS ICI : elles alimentent le comparateur
     * avant / après, déclaré plus bas sous `comparison`. La numérotation reste
     * continue, le comparateur occupant le rang « 05 · 06 ».
     *
     * ORDRE : CELUI DU VISITEUR, PAS CELUI DU DÉPÔT DES FICHIERS. Corrigé le
     * 2026-09-04 : les numéros suivaient jusque-là le nom des fichiers, qui
     * suit l'ordre dans lequel les captures ont été prises, et pas le parcours
     * réel. Relevé auprès d'Eliott, qui l'a écrit :
     *
     *   1. identifiants et mot de passe          (comparateur, `05` + `06`)
     *   2. l'entreprise est-elle déjà cliente    (`01`)
     *   3. SIREN / SIRET vérifié en direct       (`02`)
     *   4. identité et adresse tirées du registre (`03`)
     *   5. repli : autocomplétion de l'adresse   (`04`)
     *   6. certification des informations         (`07`)
     *
     * Le mot de passe OUVRE le parcours, il ne le termine pas : c'est la
     * première étape du formulaire d'inscription, avant même la question sur
     * l'entreprise. Les `step` portent le rang réel, les noms de fichiers
     * gardent le leur — les renommer ferait mentir `docs/sources/wurth/` et le
     * suivi des originaux.
     *
     * Un lecteur doit pouvoir refaire le chemin dans sa tête.
     *
     * `formulaire-etape-1.jpg` A QUITTÉ LA GALERIE. Elle y ouvrait la série et
     * servait de vignette. Deux raisons de la retirer, pas une : elle
     * reproduit le logo de Würth, que la règle 4 de ce fichier proscrit tant
     * qu'aucun accord n'est donné, et elle montre le même écran que
     * `05-mot-de-passe-vide.png`, en plus large et en moins lisible. Le
     * fichier reste sur le disque et dans `docs/ASSETS.md` : il redeviendra
     * utilisable le jour où Würth répondra (voir
     * `docs/EMAIL-WURTH-AUTORISATION.md`).
     */
    gallery: [
      {
        src: "/work/wurth/01-deja-client.png",
        width: 1332,
        height: 614,
        step: "02",
        stepTitle: "Déjà cliente, ou pas encore",
        alt: "L’aiguillage du parcours : entreprise déjà cliente, ou pas encore",
        caption:
          "Une fois les identifiants créés, le parcours demande si l’entreprise est déjà cliente. La réponse décide de tout ce qui suit et évite de redemander à un client existant ce que Würth sait déjà de lui. Les deux branches mènent au même formulaire, dont les champs inutiles se masquent.",
      },
      {
        src: "/work/wurth/02-siren-non-reconnu.png",
        width: 1192,
        height: 595,
        step: "03",
        stepTitle: "Le numéro d’entreprise vérifié en direct",
        alt: "Un numéro SIREN refusé, et le message qui dit quoi vérifier",
        caption:
          "Le SIREN ou le SIRET est confronté au registre INSEE pendant la frappe, pas à l’envoi : un numéro inconnu est signalé sur sa propre ligne, avec ce qu’il faut contrôler. Avant, ce genre d’erreur ne se découvrait qu’une fois tout le formulaire rempli.",
      },
      {
        src: "/work/wurth/03-siret-adresse-remplie.png",
        width: 1192,
        height: 785,
        step: "04",
        stepTitle: "L’identité et l’adresse tirées du registre",
        alt: "Un SIRET reconnu, et l’adresse de l’entreprise remplie automatiquement en dessous",
        caption:
          "Un numéro reconnu remplit seul le nom de l’entreprise, la rue, le code postal et la ville, à partir de ce que le registre en dit. Quatre champs de moins à taper, donc quatre occasions de moins de se tromper, et une adresse conforme au registre plutôt qu’à la mémoire du visiteur.",
      },
      {
        src: "/work/wurth/04-adresse-autocompletion.png",
        width: 1192,
        height: 567,
        step: "05",
        stepTitle: "Le repli quand le registre ne suffit pas",
        alt: "La saisie d’une rue, et cinq adresses proposées au fil de la frappe",
        caption:
          "Numéro non reconnu, adresse à corriger : la rue se complète alors pendant la frappe, à partir de la Base Adresse Nationale et de geo.api.gouv.fr. Le visiteur choisit au lieu d’écrire, ce qui écarte d’un coup les fautes de voie, de code postal et de ville.",
      },
      {
        src: "/work/wurth/07-certification.png",
        width: 1170,
        height: 571,
        step: "06",
        stepTitle: "La certification avant de continuer",
        alt: "La case de certification décochée, et le bouton Continuer grisé",
        caption:
          "Le bouton reste inactif tant que les informations ne sont pas certifiées. L’étape suivante ne s’ouvre jamais sur un dossier incomplet, et le refus n’arrive plus une fois le formulaire envoyé.",
      },
    ],
    /*
     * EN-TÊTE DE LA SUITE D’ÉCRANS. Il n’existe que pour Würth : c’est le seul
     * projet dont la galerie est une DÉMONSTRATION plutôt qu’une série
     * d’ambiances, et le seul dont la pile de fin de page comptait plus d’une
     * image. Kpsull et NSLysium n’ont que trois visuels, leur pile est vide et
     * ce bloc ne s’affiche pas chez eux.
     *
     * L’intro DIT OÙ SONT LES DEUX PREMIERS ÉCRANS. Sans elle, une suite qui
     * démarre à « 03 » laisse croire à deux étapes manquantes.
     */
    walkthrough: {
      label: "Le parcours",
      title: "Le parcours, dans l’ordre où le visiteur le traverse.",
      intro:
        "Six écrans, des identifiants à la certification finale. Chacun retire une occasion de se tromper au moment où elle se présente, plutôt que de la signaler une fois le formulaire envoyé.",
    },
    /*
     * LE MOT DE PASSE EST UN COMPARATEUR, ET NON DEUX CAPTURES DE PLUS.
     * Arbitré le 2026-09-04, sur demande d'Eliott.
     *
     * `05-mot-de-passe-vide.png` et `06-mot-de-passe-valide.png` sont le MÊME
     * écran à deux instants : les trois contraintes en rouge avant la frappe,
     * les mêmes en vert une fois le mot de passe accepté, et la jauge qui se
     * remplit. Empilées, elles demandaient au lecteur de retenir la première
     * pour la comparer à la seconde, neuf cents pixels plus bas ; c'est
     * exactement le trajet de l'oeil que la refonte a supprimé du formulaire.
     * Sous un curseur, la démonstration se fait toute seule.
     *
     * Les deux fichiers ne bougent pas : ce sont les captures d'origine,
     * normalisées sur le même canevas que les autres, donc superposables au
     * pixel sans recalage.
     */
    comparison: {
      step: "01",
      stepTitle: "Les règles du mot de passe, puis leur validation",
      caption:
        "Les trois contraintes sont posées avant la première frappe, et non après le refus. Elles passent au vert une à une à mesure que le mot de passe se remplit, et la jauge annonce « Fort ». Le visiteur sait qu’il a réussi avant de cliquer, au lieu de l’apprendre en échouant.",
      beforeLabel: "Avant la saisie",
      afterLabel: "Mot de passe accepté",
      before: {
        src: "/work/wurth/05-mot-de-passe-vide.png",
        width: 1180,
        height: 508,
        alt: "Les trois contraintes du mot de passe, affichées en rouge avant toute saisie",
      },
      after: {
        src: "/work/wurth/06-mot-de-passe-valide.png",
        width: 1180,
        height: 508,
        alt: "Les mêmes contraintes passées au vert, et la jauge de force remplie",
      },
    },
    /* Le parcours refait en 2024 est toujours en ligne chez Würth : ce lien
       pointe la premiere etape du formulaire d'inscription, celle qui a ete
       reprise. Fourni par Eliott le 2026-09-01. */
    /* Plateau 3D, écran au centre. Würth n'a pas de captation vidéo : c'est la
       première étape du formulaire qui est incrustée, en image fixe. */
    cardMockup: {
      poster: {
        src: "/work/wurth/mockup.jpg",
        alt: "La première étape du formulaire d’inscription Würth affichée sur un portable",
      },
    },
    liveUrl: WURTH_URL,
    nextProject: "nslysium",
  },
  {
    slug: "nslysium",
    title: "NSLysium",
    /* Le commanditaire du workshop était une équipe d'étudiants d'une autre
       formation. L'écrire « CLIENT : ÉTUDIANTS » laisserait croire à une
       commande ; « WORKSHOP D'ÉCOLE » dit d'où vient le projet, ce qui est la
       seule information dont le lecteur a besoin à cet endroit. Le détail est
       dans le chapô. */
    client: "Workshop d’école",
    year: "2026",
    role: "Design et développement",
    categories: ["Web design", "Développement"],
    services: [
      "Direction visuelle",
      "Page produit narrative",
      "Rendu 3D temps réel",
      "Animations au défilement",
    ],
    accent: "#c8b9a0",
    cover: { src: "/work/nslysium/cover.jpg", alt: "Page d’accueil de NSLysium" },
    /*
     * FOND DU HERO : la scène seule, AVEC l'objet 3D.
     *
     * Même défaut que sur Kpsull, même correctif, avec une difficulté en plus.
     * Le fond servi par le site (`nslysium.eliottbouquerel.fr/images/ambient/`,
     * fichier `salon.jpg`) ne contient PAS le
     * diffuseur : c'est un objet 3D rendu par-dessus, dans un `<canvas>`. Prendre
     * le fichier de fond aurait donc retiré le produit de sa propre page projet.
     *
     * Le fichier vient d'une capture de la page réelle à deux fois la densité,
     * interface masquée et canvas conservé : la scène et son objet sont ceux du
     * site en fonctionnement, pas une reconstitution.
     */
    heroBackground: {
      src: "/work/nslysium/hero-fond.jpg",
      alt: "Un salon baigné de lumière, le diffuseur NSLysium posé sur la table basse",
    },
    cardMedia: { kind: "video", src: "/work/nslysium/demo.mp4" },
    /* Plateau 3D, écran à gauche : le cadrage alterne d'un projet à l'autre
       pour que la section ne soit pas trois fois la même image. */
    cardMockup: {
      poster: {
        src: "/work/nslysium/mockup-poster.jpg",
        alt: "La page d’accueil de NSLysium affichée sur un portable posé sur un rebord",
      },
      video: { kind: "video", src: "/work/nslysium/mockup.mp4" },
    },
    excerpt:
      "Page produit pour un assistant vocal qui centralise sport, nutrition et sommeil.",
    overview:
      "NSLysium présente Aether, un assistant vocal qui réunit sport, nutrition et sommeil dans une seule interface, avec un modèle qui tourne localement sur l’appareil. La page vient d’un workshop d’école : le produit n’existe pas, le commanditaire était une équipe d’étudiants d’une autre formation, et rien de tout cela ne sera mis en vente. La page, elle, est réelle et se juge sur pièce, comme l’exercice inverse de Kpsull : peu de fonctions, tout dans la conviction.",
    problem: [
      "Un produit qui n’existe pas encore ne se vend que par la démonstration.",
      "Il n’y a ni captures d’application, ni chiffres d’usage, ni avis. La page doit faire comprendre en quelques secondes ce que fait l’objet, pourquoi la voix change la façon de s’en servir, et pourquoi le traitement local des données est un argument et pas un détail technique.",
    ],
    outcome: [
      "Une page qui déroule une journée entière avec l’objet, du réveil au coucher, et fait exister le produit avant qu’il existe.",
    ],
    approach: [
      "Montrer l’objet plutôt que le décrire.",
      "Le produit est rendu en 3D temps réel et reste présent pendant que le récit avance, ce qui évite la galerie de visuels figés. Les commandes vocales sont mises en scène telles qu’on les prononcerait, et la mention du traitement local est posée à l’endroit exact où la question de la vie privée se pose au lecteur, pas reléguée en pied de page.",
    ],
    body: [
      "L’enjeu technique n’est pas la 3D elle-même mais son coût : la scène doit rester fluide sur une machine ordinaire, et la page doit rester lisible pour qui n’a pas d’accélération matérielle.",
      "C’est le projet qui montre le mieux le versant direction artistique du travail : typographie, rythme des sections, et une animation qui sert le propos au lieu de se montrer.",
    ],
    gallery: [
      { src: "/work/nslysium/voix.jpg", alt: "Section de NSLysium consacrée au pilotage à la voix" },
      { src: "/work/nslysium/journee.jpg", alt: "Rendu 3D du produit dans la section « une journée avec Aether »" },
      { src: "/work/nslysium/produit.jpg", alt: "Section produit de NSLysium" },
    ],
    projectVideoUrl: "/work/nslysium/demo.mp4",
    videoPoster: { src: "/work/nslysium/demo-poster.jpg", alt: "Démonstration de la page NSLysium" },
    liveUrl: NSLYSIUM_URL,
    nextProject: "kpsull",
  },
];

export const workContent: WorkContent = {
  hero: {
    title: "Sélection de projets",
    subtitle:
      "Je construis des sites qui rapportent. Voilà à quoi ça ressemble en pratique.",
    // Le live rend DEUX paragraphes de polarité opposée : le premier atténué
    // avec le verbe en blanc plein, le second en blanc plein avec son amorce
    // redescendue à 60 %. L'espace finale du fragment est significative (elle
    // appartient au span sur le live).
    subtitleParagraphs: [
      { text: "Je construis des sites qui rapportent.", emphasis: ["rapportent"] },
      {
        text: "Voilà à quoi ça ressemble en pratique.",
        emphasis: ["Voilà à quoi ça "],
        inverted: true,
      },
    ],
  },
  // Le premier filtre affiche tout. Il n'est plus identifié par son libellé :
  // `work-filter.ts` expose une sentinelle et `WorkExplorer` suit l'INDEX de
  // l'onglet actif. Les libellés suivants doivent correspondre aux `categories`
  // réellement portées par les projets, sinon un onglet ne renvoie rien.
  filters: ["Tous", "Web design", "Développement"],
  items: workItems,
  seo: {
    // Marque alignée sur `siteConfig.meta.titleTemplate` (« %s · Eliott
    // Bouquerel ») : titre posé en `absolute`, le gabarit ne s'applique pas et
    // la marque est écrite ici. Le « ® » y avait survécu au retrait du
    // 2026-08-29, qui n'avait vidé que `brand.mark`.
    title: "Réalisations · Eliott Bouquerel",
    description:
      "Une refonte du parcours de création de compte de l’eShop de Würth France, et deux projets d’école menés de bout en bout : une place de marché et une page produit 3D.",
  },
};
