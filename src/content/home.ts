import type { HeroComparaison, HomeContent } from "@/lib/content/types";
import { slugsMisEnAvant } from "@/content/blog";
import { faqItems } from "@/content/faq";
import { services } from "@/content/services";
import { euros, prestation, prixPlancher, repereAgenceSite } from "@/content/offre";
import { lienRendezVous } from "@/content/rendez-vous";
import { howWeDoItStats, reputationStats } from "@/content/stats";

const ENTREE_VITRINE = prixPlancher(prestation("vitrine"));
const ENTREE_LOGICIEL = prixPlancher(prestation("logiciel"));

/*
 * LE POSITIONNEMENT D'ELIOTT, décision du 2026-10-15 : « je fais le travail
 * d'une agence pour deux fois moins cher ». « Jusqu'à » le garde vrai sur les
 * deux offres : le site d'entrée vaut la moitié de la médiane d'un site de PME
 * en agence (preuve chiffrée plus bas), le logiciel s'en rapproche sans
 * l'atteindre sur un premier outil. Chiffres et source : `offre.ts`.
 */
const POSITIONNEMENT = "La qualité d’une agence, jusqu’à deux fois moins cher.";

/*
 * LES DEUX PORTES, qui forment ensemble le seul h1 de l'accueil. Mots
 * d'Eliott du 2026-10-15 : « un site qui vous ramène des clients, un outil
 * qui vous rend des heures ». Chaque porte mène à sa prestation et porte son
 * prix d'entrée.
 */
const PORTES = [
  {
    lines: ["Un site qui vous", "ramène des clients."],
    href: `/services/${prestation("vitrine").slug}`,
    price: `dès ${ENTREE_VITRINE} HT`,
  },
  {
    lines: ["Un outil qui vous", "rend des heures."],
    href: `/services/${prestation("logiciel").slug}`,
    price: `dès ${ENTREE_LOGICIEL} HT`,
  },
] as const;

const TITRE_ACCUEIL = PORTES.map((porte) => porte.lines.join(" ")).join(" ");

/** Ce qui explique le prix, en une phrase, sous les deux portes. */
const POURQUOI_CE_PRIX =
  "Je conçois et je code moi-même, sans chef de projet ni structure à payer : votre budget va au produit.";

/*
 * LE PRIX D'UNE AGENCE ET LE MIEN, POUR LE MÊME SITE, décision d'Eliott du
 * 2026-10-16. Le « 50 % du prix d'un site de PME en agence » rapportait mon
 * plancher à la MÉDIANE des agences : un visiteur y lisait « son prix le plus
 * bas contre leur prix moyen, forcément moitié moins, mais pour quelle
 * qualité ? ». La comparaison se fait donc à livrable égal : la fourchette
 * qu'une agence facture un site vitrine soigné, design et ergonomie compris,
 * contre ce que coûte le mien, qui comprend la même chose (`offre.ts`).
 * Chiffres et source : `repereAgenceSite`.
 */
function comparaisonAgence(): HeroComparaison {
  const agence = repereAgenceSite;
  return {
    sujet: "Un site vitrine soigné, design et ergonomie compris",
    lignes: [
      { qui: "En agence", prix: `${euros(agence.soigneMin).replace(/\s€$/u, "")} à ${euros(agence.soigneMax)}` },
      { qui: "Avec moi", prix: `dès ${ENTREE_VITRINE}`, fort: true },
    ],
    source: {
      label: `${agence.source.nom}, ${agence.source.releve}`,
      href: agence.source.href,
    },
  };
}

/**
 * Contenu de la page d'accueil. Chaque section pointe vers sa source unique
 * (faq / stats / services / offre) : aucune duplication de texte.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott : il parle en « je », le
 * visiteur est « vous » sur tout le texte visible du site.
 */
export const homeContent: HomeContent = {
  hero: {
    // Au-dessus des deux portes : ce qui distingue Eliott d'une agence.
    eyebrow: POSITIONNEMENT,
    // LE H1 DE L'ACCUEIL : les deux portes mises bout à bout. Le héros rend
    // chaque porte comme un lien vers sa prestation.
    title: TITRE_ACCUEIL,
    titleLines: PORTES.map((porte) => porte.lines.join(" ")),
    doors: PORTES,
    subtitle: POURQUOI_CE_PRIX,
    subtitleParagraphs: [{ text: POURQUOI_CE_PRIX }],
    /*
     * UNE SEULE PREUVE DANS LE PREMIER ÉCRAN depuis le 2026-10-16 : le prix
     * d'une agence et le mien, pour le même site. Le −92 % de Würth est sorti
     * du héros, décision d'Eliott ; il reste dans la section chiffres.
     */
    comparison: comparaisonAgence(),
    // Fond du hero : macro d'un mouvement d'horlogerie, asset généré et
    // possédé (2026-08-10), calibré sombre par `scripts/hero-loop.mjs`
    // (moyenne 13,7/255) pour porter du texte blanc.
    media: {
      kind: "video",
      src: "/videos/hero-loop.mp4",
      // Première image de la boucle, 14 Ko : sans affiche, l'élément LCP du
      // mobile était la vidéo elle-même.
      poster: "/videos/hero-loop-poster.webp",
    },
    // PHOTO RÉELLE d'Eliott (fournie le 2026-08-10). `alt` vide : le nom est
    // rendu en texte juste à côté, la vignette est décorative au sens WCAG.
    person: {
      name: "Eliott Bouquerel",
      role: "Développeur à Caen",
      avatar: {
        src: "/images/eliott-bouquerel-avatar.jpg",
        alt: "",
        width: 400,
        height: 400,
      },
    },
  },

  /*
   * LA SECTION NOIRE MONTRE LE LOGICIEL depuis le 2026-10-16, idée d'Eliott :
   * « On vous compare avant d'appeler » parle au client du site vitrine, il
   * en fallait une pour celui de l'outil. Elle remplace la prise de parole
   * sur la méthode, dont elle garde la citation, qui parle de logiciel.
   *
   * LA DÉMONSTRATION EST UN EXEMPLE, et le dit : une tâche que la plupart des
   * PME refont à la main, découpée en étapes, sans durée inventée. Ce qui
   * change entre les deux onglets se compte : qui fait chaque étape.
   */
  logiciel: {
    eyebrow: prestation("logiciel").nom,
    // Lignes de douze signes au plus : le titre est rendu à 92 px dans une
    // demi-colonne, comme celui du showreel.
    titleLines: ["Vos heures", "valent mieux", "qu’un", "tableur."],
    statement:
      "Une commande arrive par mail, vous la recopiez dans un tableur, vous vérifiez le stock, puis vous retapez le devis. Je construis l’outil qui enchaîne ces étapes à votre place : il vous reste à relire et à envoyer.",
    statementEmphasis: ["il vous reste à relire et à envoyer."],
    cta: {
      label: "Voir La Solution métier",
      href: `/services/${prestation("logiciel").slug}`,
    },
    demo: {
      titre: "Exemple : une commande reçue par mail",
      onglets: { main: "À la main", outil: "Avec l’outil" },
      acteurs: { vous: "Vous", outil: "Automatique" },
      main: [
        { libelle: "Lire la commande dans le mail", auto: false },
        { libelle: "Recopier chaque ligne dans le tableur", auto: false },
        { libelle: "Vérifier le stock article par article", auto: false },
        { libelle: "Retaper le devis dans un document", auto: false },
        { libelle: "Envoyer le devis et noter de relancer", auto: false },
      ],
      outil: [
        { libelle: "La commande est lue dès son arrivée", auto: true },
        { libelle: "Les lignes entrent dans votre base", auto: true },
        { libelle: "Le stock est vérifié, les manques signalés", auto: true },
        { libelle: "Le devis est prêt, à vos prix", auto: true },
        { libelle: "Vous relisez et vous envoyez", auto: false },
      ],
      bilan: {
        main: "Cinq étapes pour vous, à chaque commande.",
        outil: "Une étape pour vous : relire et envoyer.",
      },
    },
  },

  // showreel.ts — titre + phrase d'appui + affiche + lien vers les réalisations.
  showreel: {
    /*
     * TITRE ET PHRASE CHOISIS PAR ELIOTT le 2026-09-24. « Je construis des
     * outils qu'on garde » et « Où avancer semble évident… » parlaient d'Eliott
     * et de style ; la section annonce les réalisations, elle dit donc pourquoi
     * le client doit les regarder : son propre client compare avant d'appeler.
     *
     * LIGNES DE 12 SIGNES AU PLUS, le titre est rendu à 92 px dans une demi-
     * colonne de 683 px, aligné à droite dès 810.
     */
    marquee: "On vous compare avant d’appeler.",
    // Dix signes au plus par ligne : « vous compare » débordait sa colonne
    // de 12 à 17 px entre 810 et 1200 (relevé du 2026-10-15).
    marqueeLines: ["On vous", "compare", "avant", "d’appeler."],
    statement:
      "Votre client ouvre votre site puis celui du concurrent, et il appelle celui qui rassure. Regardez ce que j’ai livré.",
    // Rendue en noir 60 %, ce fragment passe en noir plein.
    statementEmphasis: ["il appelle celui qui rassure."],
    vintage: "2026©",
    /*
     * SEUL CONTRÔLE DE LA SECTION depuis le 2026-08-27, et il est enfin
     * cliquable. Le bouton « Showreel » qui l'accompagnait a été supprimé : il
     * n'avait aucun gestionnaire et venait du template, où le studio d'origine
     * avait une bande démo à ouvrir. `playLabel` a disparu avec lui.
     */
    cta: { label: "VOIR LES RÉALISATIONS", href: "/realisations" },
    ctaPrefix: "↓ ",
    /*
     * AFFICHE DE LA SECTION, REMPLACÉE LE 2026-09-24 (phase E).
     *
     * L'ESCALIER DE BÉTON illustrait l'ancien titre (« où avancer semble
     * évident »). Sous « Ton client te compare avant d'appeler », il ne disait
     * plus rien. Eliott : « la photo n'est pas hyper pertinente ».
     *
     * CE QUI LA REMPLACE montre la scène du titre : quelqu'un tient son
     * téléphone devant son ordinateur ouvert, deux écrans côte à côte. Le
     * téléphone et l'ordinateur sont détourés en lignes volt, comme les sujets
     * des héros du blog et de la page Caen ; le reste de la photo est
     * légèrement assombri.
     *
     * Photographie Alejandro Escamilla, CC0 (Wikimedia Commons, publiée à
     * l'origine sur Unsplash). Provenance et traitement dans `docs/ASSETS.md`.
     *
     * 1512 × 960, le double de la boîte de mise en page (378 × 240 dès 1200).
     */
    poster: {
      src: "/images/telephone-et-ordinateur.jpg",
      alt: "Une personne tient son téléphone devant son ordinateur portable ouvert",
      width: 1512,
      height: 960,
    },
  },

  about: {
    /*
     * UNE VRAIE SECTION « À PROPOS » depuis le 2026-10-16, demande d'Eliott :
     * le héros dit ce que je fais, la deuxième section dit qui le fait. Eliott
     * est seul : c'est son argument face aux agences, et le visiteur doit
     * savoir à qui il parle avant de lire les offres.
     *
     * L'ancien titre, « Je pars de ce que votre site doit rapporter », parlait
     * de méthode ; l'idée reste, en fin de récit.
     *
     * DÉCOUPAGE : deux lignes aux unités de sens. Toutes reçoivent le corps
     * dicté par la plus large (cf. `TitleFitText`).
     */
    title: "Moi, c’est Eliott.",
    titleLines: ["Moi,", "c’est Eliott."],
    /*
     * LE PARCOURS EST CELUI DE `/a-propos` (`about.ts`), relevé sur LinkedIn,
     * le CV et Malt : Médiapilote et Würth France en stage, MeilleursBiens et
     * MECA SERVICES en alternance. Aucun n'est présenté comme client.
     */
    body: [
      "Je suis développeur full-stack, installé à Caen, et je travaille seul. Du premier appel à la mise en ligne, vous parlez à celui qui conçoit et qui code votre projet.",
      "Avant de me lancer, j’ai développé chez Médiapilote, Würth France, MeilleursBiens, puis MECA SERVICES, où je tenais aussi la boutique en ligne. J’y ai appris à partir de ce qu’un site ou un outil doit rapporter, et à décider avant la première ligne de code de ce qui ne se voit pas : la vitesse, l’architecture, ce que lisent les moteurs de recherche.",
      /* LA VISION D'ELIOTT, ajoutée le 2026-10-16 à sa demande : du premium,
         fini, rien au hasard, et le prix qui va avec. « Jusqu'à » garde la
         phrase vraie, comme le positionnement du héros. */
      "Je livre des sites et des outils finis. Chaque détail est décidé, testé et documenté avant de vous être remis : rien n’est laissé au hasard, et rien n’est bâclé pour tenir une date. C’est le niveau qu’une entreprise attend d’une agence, pour un prix jusqu’à deux fois moins élevé, parce qu’il ne paie que le travail.",
    ],
    // Emphase (source Framer) : ces expressions passent en noir plein au
    // milieu du paragraphe rendu à 70 %.
    highlights: [
      "je travaille seul",
      "vous parlez à celui qui conçoit et qui code votre projet",
      "partir de ce qu’un site ou un outil doit rapporter",
      "rien n’est laissé au hasard",
    ],
    /*
     * GRILLE D'INFOS ET COMPTEUR RENDUS le 2026-10-16 : Eliott trouvait la
     * section vide de repères. Ils disent ce qu'aucune autre section ne dit,
     * le métier, le lieu et le parcours ; « 1 projet à la fois » reste à la
     * section chiffres.
     */
    launchedLabel: "Développeur full-stack",
    projectsLabel: "Caen, et en visio",
    counter: {
      value: "4",
      caption: "entreprises où j’ai développé avant de me lancer",
    },
    cta: { label: "Mon parcours", href: "/a-propos" },
    image: {
      src: "/images/eliott-nature-bloc.jpg",
      alt: "Portrait d’Eliott Bouquerel, développeur web freelance, au bord d’un lac",
    },
  },

  featuredWorkSlugs: ["kpsull", "wurth-creation-de-compte", "nslysium"],

  // numbers.ts — 3 chiffres sur fond accent.
  numbers: {
    // SANS ÉTIQUETTE depuis le 2026-09-24 (phase C) : le titre suffit, et
    // « Comment je travaille » redisait l'étiquette de la méthode, qui suit.
    /*
     * TITRE ET SOUS-TITRE CHOISIS PAR ELIOTT le 2026-09-24. « Pas de maquettes
     * à valider. Une adresse en ligne qui avance. » parlait de la méthode ; le
     * titre dit ce que le client y gagne. La phrase d'Eliott qui suivait (« Je
     * ne cherche pas le volume… ») est sortie : elle redisait « 1 projet à la
     * fois » avec d'autres mots.
     */
    title: "Votre projet n’attend personne.",
    // « Votre projet » déborde la colonne à 92 px (1 338 px pour 1 313) :
    // le possessif prend sa ligne.
    titleLines: ["Votre", "projet", "n’attend", "personne."],
    intro:
      "Je ne mène qu’un chantier à la fois, alors votre message a sa réponse sous 24 h ouvrées.",
    stats: howWeDoItStats,
  },

  // number.ts — « Pourquoi moi ? » : une carte chiffrée + appel.
  whyUs: {
    eyebrow: "Pourquoi moi ?",
    // TITRE ET SOUS-TITRE CHOISIS PAR ELIOTT le 2026-09-24 (remplacent « Ce
    // qui est vérifiable. »). La carte porte le chiffre qui le prouve.
    title: "Personne ne vous tient en otage.",
    titleLines: ["Personne", "ne vous tient", "en otage."],
    intro:
      "Vous avez tous les accès dès la mise en ligne, et vous changez de prestataire quand vous voulez.",
    stats: reputationStats,
    // LE RENDEZ-VOUS EST LE CHEMIN PRINCIPAL du site. « Voir les réalisations »
    // est parti : la section des réalisations est juste au-dessus.
    ctas: [{ label: "Réserver un appel", href: lienRendezVous("decouverte") }],
  },

  // section06.ts — prestations en accordéon.
  services: {
    // PAS D'ÉTIQUETTE SUR L'ACCUEIL depuis le 2026-09-24 (phase C) : le chapô
    // et l'accordéon disent d'eux-mêmes ce qu'ils présentent, et le gabarit
    // étiquette / titre / paragraphe revenait cinq fois de suite.
    // IDENTIQUE à `aboutContent.services.intro` : les deux pages rendent le même
    // bloc, et un chapô qui dérive est une page qui ne dit pas la même chose que
    // l’autre sans que personne le remarque.
    // Élargi le 2026-10-16 aux quatre offres de l'accordéon : du site à
    // l'outil, de l'IA au pilotage technique (`services.ts`).
    intro:
      "Du site qui vous amène des clients à l’outil qui vous rend des heures, de l’IA dans vos logiciels au pilotage technique de votre entreprise. Je pars de votre façon de travailler, et je construis ce qui lui correspond.",
    items: services,
  },

  // SECTION TÉMOIGNAGES RETIRÉE le 2026-09-24 : son tableau était vide et le
  // composant ne rendait rien. Elle reviendra avec un vrai client (le type la
  // rend optionnelle, `HomePage` la compose si elle est présente).

  // section11.ts — bande défilante. RETIRÉE le 2026-08-10, RÉTABLIE le
  // 2026-09-01 sous une forme qui ne dit plus la même chose.
  //
  // CE QUI AVAIT MOTIVÉ LE RETRAIT reste vrai mot pour mot : « une bande de
  // logos sur un site de prestataire se lit comme voici mes clients, et
  // l'afficher sans client réel est une fausse déclaration ». Les six marques du
  // template portaient des noms lisibles à l'écran (PictelAI, Watchtower…) et
  // aucune ne correspondait à quoi que ce soit.
  //
  // CE QUI A CHANGÉ, c'est que quatre entreprises réelles peuvent être nommées,
  // et qu'aucune n'est un client : ce sont les EMPLOYEURS d'Eliott, deux
  // alternances et deux stages. Le piège est donc intact et il s'est seulement
  // déplacé : la même file de noms, sous un intitulé du genre « ils m'ont fait
  // confiance », transformerait quatre employeurs en quatre clients. Deux
  // garde-fous, l'un dans le titre, l'autre dans chaque cellule :
  //
  //   `title`  nomme la relation AVANT que la file ne soit lue ;
  //   `detail` la redit sur chaque entreprise, avec sa date.
  //
  // Le lecteur n'a rien à déduire, et un lecteur pressé qui ne verrait que les
  // cellules y lit encore « alternance » ou « stage ».
  //
  // PAS DE LOGOS, ET C'EST DÉLIBÉRÉ. Reproduire la marque figurative d'un tiers
  // sans son accord écrit est une contrefaçon (art. L713-2 CPI) ; citer son nom
  // pour dire qu'on y a travaillé est un fait vérifiable et une référence
  // nécessaire (art. L713-6). Eliott attend au même moment l'autorisation de
  // Würth pour publier une étude de cas : afficher le logo de Würth en
  // attendant cette autorisation-là serait incohérent autant qu'exposé.
  // `LogoItem.image` reste dans le type et la branche de rendu est intacte :
  // une autorisation écrite suffit à passer une cellule en logo, une par une.
  //
  // ORDRE CHRONOLOGIQUE, du plus ancien au plus récent : la bande se lit alors
  // comme un parcours, pas comme un palmarès rangé par prestige.
  /*
   * TROIS LOGOS, SANS INTITULÉ NI DATE, décision d'Eliott du 2026-09-02 :
   * « retire les mentions de en alternance ou en stage chez, retire les
   * années, je veux juste les logos ».
   *
   * MSSHOP EST SORTI de la bande (« ça fait un peu tache ») : mascotte en
   * dégradé bleu et orange au milieu de trois logotypes typographiques sobres,
   * c'est lui qu'on regardait, et pour la mauvaise raison. MECA SERVICES reste
   * dans le parcours d'Eliott, il n'est simplement plus affiché ici.
   *
   * CE QUE LE RETRAIT DU LIBELLÉ COÛTE, et c'est écrit ici pour que personne ne
   * le redécouvre plus tard : « En alternance et en stage chez » et les dates
   * disaient la NATURE du lien. Sans elles, trois logos alignés sur un site de
   * prestataire se lisent comme une page de références clients. Ce sont des
   * employeurs, Eliott n'a aucun client à ce jour, et c'est exactement la
   * fausse déclaration que le retrait du 2026-08-10 voulait éviter. Le
   * `logoBand.title` reste dans le type et le composant sait le rendre :
   * remettre une ligne suffit à refermer l'ambiguïté.
   */
  logoBand: {
    logos: [
      {
        name: "Médiapilote",
        image: {
          src: "/logos/mediapilote.png",
          alt: "Médiapilote",
          width: 138,
          height: 44,
        },
      },
      {
        name: "Würth France",
        image: { src: "/logos/wurth.png", alt: "Würth", width: 149, height: 31 },
      },
      {
        name: "MeilleursBiens",
        image: {
          src: "/logos/meilleursbiens.png",
          alt: "MeilleursBiens",
          width: 196,
          height: 23,
        },
      },
    ],
  },


  // articles.ts — « Actualités et nouveautés. » : 4 articles mis en avant
  // (source blog.ts). L'archive home affiche les 4 premiers articles.
  articles: {
    eyebrow: "Actualités et nouveautés.",
    titleLines: ["Actualités et", "nouveautés."],
    cta: { label: "Voir plus", href: "/blog" },
    // DÉRIVÉE DU REGISTRE depuis le 2026-08-28, plus écrite à la main.
    //
    // Cette liste portait quatre slugs recopiés, et la MÊME liste vivait dans
    // `about.ts`. Elle se périmait à chaque publication (un article nouveau
    // n'arrivait jamais sur l'accueil sans qu'on y pense, dans deux fichiers),
    // et elle pouvait pointer vers des slugs disparus — ce qui s'est produit au
    // passage au MDX : la sélection ne trouvait plus rien, et la section rendait
    // un titre, un bouton et RIEN entre les deux, ici comme sur `/about`.
    //
    // `slugsMisEnAvant` prend les quatre articles publiés les plus récents. Le
    // choix éditorial n'est pas perdu pour autant : `sort` étant stable, l'ordre
    // du registre tranche à date égale (cf. l'en-tête de `blog.ts`).
    featuredSlugs: slugsMisEnAvant,
  },

  faq: faqItems,

  // Habillage du bloc FAQ (les questions viennent de faq.ts).
  faqSection: {
    eyebrow: "FAQ",
    titleLines: ["Avant de", "commencer."],
    cta: { label: "Poser une question", href: "/contact" },
  },

  /*
   * ORDRE DES SECTIONS, refait le 2026-09-24 (phase B, puis phase C).
   *
   * L'OFFRE SUIT `about` (phase B) : l'accordéon des prestations vient juste
   * après, au lieu de trois sections plus bas. Le h1 est dans le héros depuis
   * la phase E.
   *
   * LES LOGOS SONT ENTRÉS DANS LE HÉROS (phase D), après être remontés sous
   * lui en phase C : sous la ligne de flottaison, ils n'étaient pas vus avant
   * de défiler. `logoBand` n'est donc plus une section de l'accueil ; la
   * donnée reste ici, lue par le héros et par `/a-propos`. Toujours sans
   * intitulé : rien ne présente ces entreprises comme des clients.
   *
   * LES CHIFFRES PASSENT AVANT LA MÉTHODE, « POURQUOI MOI » APRÈS (phase C).
   * Les deux sections à cartes noires se suivaient et se lisaient comme une
   * seule, deux fois plus longue. La méthode les sépare, et « Pourquoi moi »
   * finit sur le rendez-vous juste avant la FAQ.
   *
   * L'ACCORDÉON DES PRESTATIONS A QUITTÉ L'ACCUEIL le 2026-10-16 : ses deux
   * offres, leurs prix et leurs liens sont déjà les deux portes du héros, et
   * son chapô (« Je pars de votre façon de travailler… ») redisait le sous-
   * titre. Chaque offre a désormais sa section : le site vitrine avec « On
   * vous compare avant d'appeler » et les réalisations, le logiciel avec la
   * section noire qui le montre au travail. `home.services` reste dans la
   * donnée : la section sait toujours le rendre.
   *
   * LES TARIFS NE SONT PLUS SUR L'ACCUEIL depuis le 2026-09-07 : chaque page de
   * prestation porte son offre et sa prise de rendez-vous.
   */
  sectionOrder: [
    "hero",
    "about",
    "showreel",
    "works",
    "numbers",
    "logiciel",
    "whyUs",
    "faq",
    "articles",
  ],

  seo: {
    // Mot-clé en tête, marque en fin. « Développeur web freelance » portait
    // une intention emploi (carte SEO du 2026-10-15) : le titre nomme les
    // deux offres.
    title: "Site internet et logiciel sur mesure à Caen · Eliott Bouquerel",
    description:
      "Sites internet et logiciels métier sur mesure à Caen. La qualité d’une agence, jusqu’à deux fois moins cher. En visio partout en France.",
    ogImage: {
      src: "/images/og.jpg",
      alt: "Eliott Bouquerel",
    },
  },
};
