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
 * 3. LE COMMANDITAIRE EST NOMMÉ POUR CE QU'IL EST, sur les trois projets.
 *    Révision du 2026-08-28, sur consigne d'Eliott.
 *
 *    « Réalisation personnelle » disait vrai sans rien dire : la ligne
 *    « CLIENT » de la fiche affichait une formule qui pouvait se lire comme
 *    une commande reçue. Les deux premiers projets sortent d'une formation.
 *    Ce qui est réel, c'est le travail : conception, design et développement
 *    faits par Eliott, de bout en bout. Ce qui n'existe pas, c'est le client
 *    qui l'aurait payé. Les deux se disent, dans la fiche ET dans le chapô,
 *    sans excuse et sans emphase.
 *
 *      - Kpsull : projet d'école mené comme une création d'entreprise, monté
 *        pour son propre compte. Il n'y a pas de commanditaire.
 *      - NSLysium : workshop d'école, le « client » était une équipe
 *        d'étudiants d'une autre formation. Le produit n'existe pas et le site
 *        ne sera pas lancé. La page, elle, existe et se juge sur pièce.
 *      - Würth : mission RÉELLE, chez un industriel réel, en STAGE (4 mois,
 *        mars a juin 2024).
 *        La forme du contrat est de nouveau écrite, après l'avoir été puis
 *        retirée le 2026-08-27. Motif du retour : sur un site de freelance,
 *        une ligne « CLIENT : WÜRTH » sans autre précision se lit comme une
 *        prestation indépendante facturée. Le contexte manquant y était donc
 *        lu comme une affirmation, ce qui est exactement le défaut qu'on
 *        corrige ailleurs. Un stage chez Würth France n'a rien à cacher.
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
 * sans aucune question de droits. La composition typographique « −92 % » sert
 * de fond de hero. Avant, à défaut d'accès aux écrans, on montrait le
 * résultat, pas une reconstitution d'interface qui laisserait croire à une
 * capture réelle.
 *
 * LES SEPT CAPTURES WÜRTH SONT NORMALISÉES sur un canevas de 1600 × 1000, le
 * même rapport que tous les autres visuels du site (1,6). Elles arrivaient en
 * sept rapports différents, de 1,069 à 2,494 : empilées dans une galerie qui
 * respecte le rapport naturel, elles donnaient des cadres de 553 à 1291px de
 * haut à 1440, sans cadence lisible. Le contenu n'est ni étiré ni rogné, il
 * est CENTRÉ sur un fond blanc, celui-là même du formulaire de Würth ; les
 * deux captures verticales (mot de passe) sont réduites pour tenir dans la
 * zone utile, les cinq autres gardent leur taille d'origine.
 *
 * LA ZONE UTILE MESURE 1270 × 780, et ces marges ne sont pas décoratives : le
 * calque de parallaxe est plus grand que le cadre et dérive au défilement, il
 * rogne donc en permanence une part du canevas. Valeurs RELEVÉES à 1440, sur la
 * page rendue, et non déduites du débord nominal :
 *
 *   - latéralement, 8,3 % de chaque côté sur les cinq cadres de fin de page
 *     (calque 1380 × 1035 pour un cadre 1380 × 863), et 10,1 % sur les deux
 *     premiers, dont le calque déborde AUSSI en largeur (1518 × 1082) ;
 *   - verticalement, de 7,8 % à 8,9 %, mesuré en poussant un cadre en haut puis
 *     en bas du viewport. L'amplitude nominale du calque vaut le double, mais
 *     elle ne s'exprime qu'une fois le cadre hors écran, là où plus personne ne
 *     le regarde.
 *
 * D'où la marge de 165 px en largeur et 110 px en hauteur, qui couvre le pire
 * cas relevé avec une réserve. Un commentaire antérieur annonçait 6,1 % et une
 * zone utile de 1400 × 840 : ces chiffres venaient du débord nominal de 7 %,
 * qui n'est ni celui des cinq derniers cadres (10 %) ni celui des deux premiers.
 *
 * Les sept captures actuelles tiennent toutes dans cette zone sans retouche : la
 * plus large porte 1256 px de contenu, la plus haute 767. Contrôle de la marge
 * blanche réelle d'un fichier, avant de le déclarer bon :
 *
 *     python3 -c "from PIL import Image, ImageChops; im=Image.open('f.png').convert('RGB'); \
 *       print(ImageChops.difference(im, Image.new('RGB', im.size, (255,255,255))).getbbox())"
 *
 * Recette, à rejouer à l'identique si une capture est remplacée (les originaux
 * sont conservés dans `docs/sources/wurth/`) :
 *
 *     sips -z <h_ajustée> <l_ajustée> capture.png       # seulement si besoin
 *     sips -p 1000 1600 --padColor FFFFFF capture.png
 *
 * où l'ajustement est le facteur `min(1270 / l, 780 / h, 1)`, plafonné à 1
 * pour ne jamais agrandir une capture.
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
    /* LA FORME DU CONTRAT EST ÉCRITE. Voir la note 3 en tête de fichier : sur
       un site de freelance, « CLIENT : WÜRTH » tout court se lit comme une
       prestation facturée en indépendant. Ce n'en était pas une. La ligne
       tient sans repli à 390 (26 caractères pour environ 40 disponibles). */
    /* STAGE, PAS ALTERNANCE. Releve sur le profil LinkedIn d'Eliott le
       2026-08-29 : « Developpeur web front-end · Würth France · Stage ·
       mars 2024 - juin 2024 · 4 mois · Erstein, Grand Est · Sur site ».
       Le site affirmait une alternance jusqu'en juillet 2026 : faux sur le
       type de contrat ET sur les dates, de deux ans. */
    client: "Würth France, en stage",
    year: "2024",
    role: "Stagiaire développeur front-end, refonte du parcours de création de compte",
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
    cover: {
      src: "/work/wurth/01-deja-client.png",
      alt: "La première question du parcours Würth : l’entreprise est-elle déjà cliente, ou pas encore ?",
    },
    /*
     * LE HERO GARDE LA CARTE « −92 % », et ce n'est pas un lot de consolation.
     *
     * La capture du formulaire est BLANCHE et porte l'en-tête de Würth. En fond
     * de hero pleine largeur, elle referait les deux défauts corrigés le même
     * jour sur Kpsull et NSLysium : le logo et le fil d'étapes du client
     * passeraient sous l'en-tête de ce site-ci, et le titre blanc de la page
     * deviendrait illisible sur un formulaire blanc.
     *
     * La carte typographique, elle, est sombre, porte le volt de la charte et a
     * été dessinée pour cet usage. Chaque image sert là où elle est bonne : le
     * formulaire en vignette, le chiffre en fond.
     *
     * ELLE EST UTILISÉE ENTIÈRE, ET C'EST UN COMPROMIS ASSUMÉ. Une version
     * recadrée sur le seul chiffre a été essayée pour écarter son libellé de
     * tête, qui vient se placer sous l'en-tête du site : le recadrage a tranché
     * les libellés de pied en plein milieu d'un mot, ce qui se lit comme un
     * défaut alors que la superposition, elle, se lit comme une texture. Une
     * carte composée pour un cadre fixe ne survit pas au plein écran ; la
     * refaire pour cet usage est un chantier à part.
     */
    heroBackground: {
      src: "/work/wurth/resultat-92.jpg",
      alt: "92 % d’erreurs en moins à la création de compte, mesuré en interne après la refonte",
    },
    excerpt:
      "Refonte du parcours de création de compte de l’eShop français, en stage chez Würth France.",
    overview:
      "Würth France distribue des fournitures professionnelles aux artisans et aux industriels. J’y ai travaillé en stage, sur l’eShop, et j’ai repris le parcours de création de compte : celui par lequel passe tout nouveau client avant de pouvoir commander. C’est une mission menée en interne, salariée, et non une prestation en indépendant.",
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
     * GALERIE : SEPT ÉCRANS, SEPT LÉGENDES, UN SEUL CADRE.
     *
     * Ce qu'elle corrigeait le 2026-08-28, et ce n'était pas une préférence.
     * Les captures arrivaient à leur rapport naturel dans une galerie qui le
     * respecte : les cadres allaient de 553 à 1291px de haut à 1440, et la
     * page se lisait comme un empilement d'écrans sans cadence ni commentaire.
     * Le canevas commun (voir la note ASSETS en tête de fichier) leur rend un
     * cadre identique, celui de tout le site, et chaque entrée porte
     * désormais une LÉGENDE : `caption` est rendue dans un `<figcaption>`
     * attaché à l'image, sous le cadre.
     *
     * CE QU'UNE LÉGENDE DOIT DIRE. Pas ce qu'on voit, `alt` s'en charge pour
     * qui ne voit pas l'image. Elle dit le DÉFAUT que l'écran corrige. Une
     * capture de formulaire ne se vend pas toute seule : sans la phrase, un
     * champ pré-rempli n'est qu'un champ pré-rempli.
     *
     * ORDRE : celui du client, pas celui du dépôt des fichiers. Aiguillage,
     * identité de l'entreprise, adresse, mot de passe, certification finale.
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
        width: 1600,
        height: 1000,
        alt: "Le premier écran du parcours : entreprise déjà cliente, ou pas encore",
        caption:
          "Le parcours s’ouvre sur un aiguillage : l’entreprise est-elle déjà cliente ? La réponse décide de tout ce qui suit et évite de redemander à un client existant ce que Würth sait déjà de lui. Les deux branches mènent en réalité au même formulaire, dont les champs inutiles se masquent.",
      },
      {
        src: "/work/wurth/02-siren-non-reconnu.png",
        width: 1600,
        height: 1000,
        alt: "Un numéro SIREN refusé, et le message qui dit quoi vérifier",
        caption:
          "La vérification se fait au fil de la saisie, pas à l’envoi : un numéro d’entreprise inconnu est signalé sur sa propre ligne, avec ce qu’il faut contrôler. Avant, ce genre d’erreur ne se découvrait qu’une fois tout le formulaire rempli.",
      },
      {
        src: "/work/wurth/03-siret-adresse-remplie.png",
        width: 1600,
        height: 1000,
        alt: "Un SIRET reconnu, et l’adresse de l’entreprise remplie automatiquement en dessous",
        caption:
          "Un SIRET reconnu remplit seul le nom de l’entreprise, la rue, le code postal et la ville, en interrogeant le registre INSEE par un proxy. Quatre champs de moins à taper, donc quatre occasions de moins de se tromper, et une adresse conforme au registre plutôt qu’à la mémoire du visiteur.",
      },
      {
        src: "/work/wurth/04-adresse-autocompletion.png",
        width: 1600,
        height: 1000,
        alt: "La saisie d’une rue, et cinq adresses proposées au fil de la frappe",
        caption:
          "L’adresse se complète pendant la frappe, à partir de la Base Adresse Nationale et de geo.api.gouv.fr. Le visiteur choisit au lieu d’écrire, ce qui écarte d’un coup les fautes de voie, de code postal et de ville.",
      },
      {
        src: "/work/wurth/05-mot-de-passe-vide.png",
        width: 1600,
        height: 1000,
        alt: "Les trois contraintes du mot de passe, affichées en rouge avant toute saisie",
        caption:
          "Les trois contraintes du mot de passe sont posées avant la première frappe, et non après le refus. Personne n’a plus à deviner ce que le formulaire attend pour accepter un mot de passe.",
      },
      {
        src: "/work/wurth/06-mot-de-passe-valide.png",
        width: 1600,
        height: 1000,
        alt: "Les mêmes contraintes passées au vert, et la jauge de force remplie",
        caption:
          "Les mêmes contraintes passent au vert à mesure que le mot de passe se remplit, et la jauge annonce « Fort ». Le visiteur sait qu’il a réussi avant de cliquer, au lieu de l’apprendre en échouant.",
      },
      {
        src: "/work/wurth/07-certification.png",
        width: 1600,
        height: 1000,
        alt: "La case de certification décochée, et le bouton Continuer grisé",
        caption:
          "Le bouton reste inactif tant que les informations ne sont pas certifiées. L’étape suivante ne s’ouvre jamais sur un dossier incomplet, et le refus n’arrive plus une fois le formulaire envoyé.",
      },
    ],
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
      "Une refonte de parcours de création de compte menée en stage chez Würth France, et deux projets d’école menés de bout en bout : une place de marché et une page produit 3D.",
  },
};
