import type { HeroComparaison, HomeContent } from "@/lib/content/types";
import { slugsMisEnAvant } from "@/content/blog";
import { faqItems } from "@/content/faq";
import { services } from "@/content/services";
import { euros, prestation, prixPlancher, repereAgenceLogiciel } from "@/content/offre";
import { TACHES_BUREAU } from "@/content/page-automatisation";
import { lienRendezVous } from "@/content/rendez-vous";
import { howWeDoItStats, reputationStats } from "@/content/stats";

const LOGICIEL = prestation("logiciel");

/* LE GAIN DE L'ACCUEIL, dérivé des hypothèses de `page-automatisation.ts`. */
const PART_RELECTURE = 0.2;
const SEMAINES_AN = 45;
const reste = (minutes: number): number => Math.round(minutes * PART_RELECTURE);
const MINUTES_SEMAINE = TACHES_BUREAU.reduce((total, t) => total + t.minutes, 0);
const MINUTES_MAX = Math.max(...TACHES_BUREAU.map((t) => t.minutes));
const MINUTES_RENDUES = MINUTES_SEMAINE - reste(MINUTES_SEMAINE);
const HEURES_RENDUES_AN = Math.round((MINUTES_RENDUES * SEMAINES_AN) / 60);

/** « 2 h 30 », « 36 min », « 11 h » : la durée telle qu'elle s'écrit. */
export function duree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reliquat = minutes % 60;
  if (heures === 0) return `${reliquat}\u00A0min`;
  if (reliquat === 0) return `${heures}\u00A0h`;
  return `${heures}\u00A0h\u00A0${String(reliquat).padStart(2, "0")}`;
}
const ENTREE_LOGICIEL = prixPlancher(LOGICIEL);
const MOYENS_TACHE = { ia: "Outil d’IA", logiciel: "Logiciel" } as const;

/*
 * UNE SEULE OFFRE DEPUIS LE 2026-10-31, décision d'Eliott du 2026-10-30. Ce qui
 * se vend : une contrainte qui disparaît et du temps gagné. Le temps humain
 * revient à ce qui rend la personne indispensable, et l'IA fait le sale boulot.
 *
 * « JUSQU'À DEUX FOIS MOINS CHER » EST PARTI AVEC LE SITE VITRINE : seule sa
 * comparaison le rendait exact (`offre.ts`). Le logiciel se compare à livrable
 * égal, chiffre d'agence écrit à côté du mien.
 */
const POSITIONNEMENT = "Logiciel sur mesure, IA et accompagnement.";

/*
 * LE H1 DE L'ACCUEIL. Depuis le 2026-11-01, décision d'Eliott : le temps gagné
 * d'abord, pour tous les métiers, et le moyen ensuite (logiciel, IA, accompagnement).
 */
const PORTES = [
  {
    lines: ["Je vous rends", "des heures."],
    href: `/services/${LOGICIEL.slug}`,
    price: `dès ${ENTREE_LOGICIEL} HT`,
  },
] as const;

const TITRE_ACCUEIL = PORTES.map((porte) => porte.lines.join(" ")).join(" ");

/** Le message d'Eliott, sous le titre. */
const CE_QUI_DISPARAIT =
  "La tâche qui vous bloque disparaît. L’IA fait le sale boulot, le recopiage et les factures, et votre équipe revient à ce qui la rend indispensable.";

/*
 * LE PRIX D'UNE AGENCE ET LE MIEN, POUR LE MÊME LIVRABLE, décision d'Eliott du
 * 2026-10-16 : un premier outil, des deux côtés. Chiffres et source :
 * `repereAgenceLogiciel`.
 */
function comparaisonAgence(): HeroComparaison {
  const agence = repereAgenceLogiciel;
  return {
    sujet: "Un premier outil métier sur mesure",
    lignes: [
      {
        qui: "En agence",
        prix: `${euros(agence.premierOutilMin).replace(/\s€$/u, "")} à ${euros(agence.premierOutilMax)}`,
      },
      { qui: "Avec moi", prix: `dès ${ENTREE_LOGICIEL}`, fort: true },
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
    // Au-dessus du titre : ce qui est vendu, et ce qui distingue Eliott d'une agence.
    eyebrow: POSITIONNEMENT,
    // LE H1 DE L'ACCUEIL. Le héros rend la porte comme un lien vers l'offre.
    title: TITRE_ACCUEIL,
    titleLines: PORTES.map((porte) => porte.lines.join(" ")),
    doors: PORTES,
    /* Test des visiteurs du 2026-10-31 : une porte pour qui n'est pas prêt à appeler. */
    offerLink: { label: "Voir l’offre et le prix", href: `/services/${LOGICIEL.slug}` },
    subtitle: CE_QUI_DISPARAIT,
    subtitleParagraphs: [{ text: CE_QUI_DISPARAIT }],
    /*
     * UNE SEULE PREUVE DANS LE PREMIER ÉCRAN depuis le 2026-10-16 : le prix
     * d'une agence et le mien, pour le même livrable. Le −92 % de Würth est
     * sorti du héros, décision d'Eliott ; il reste dans la section chiffres.
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
   * LA SECTION NOIRE MONTRE LE LOGICIEL depuis le 2026-10-16, idée d'Eliott.
   * ELLE MONTRE LE GAIN depuis le 2026-11-01, à sa demande : six tâches qui
   * parlent à tous les métiers sans en citer un, leur durée à la main, ce qui
   * reste à relire, et les heures rendues.
   *
   * LA DÉMONSTRATION EST UN EXEMPLE, et le dit : les durées sont les hypothèses
   * affichées de `/services/automatisation`, le total en est dérivé.
   */
  logiciel: {
    eyebrow: "Le temps gagné",
    // Lignes de douze signes au plus : le titre est rendu à 92 px dans une
    // demi-colonne, comme celui du showreel.
    titleLines: ["Vos heures", "valent mieux", "qu’un", "tableur."],
    statement:
      "Trier, recopier, relancer, rapprocher : une semaine de bureau part là-dedans, quel que soit votre métier. Chaque tâche a son remède, un outil d’IA ou un logiciel. L’IA fait le sale boulot, il vous reste à relire, et le temps revient à ce qui vous rend indispensable.",
    statementEmphasis: ["le temps revient à ce qui vous rend indispensable."],
    cta: { label: "Voir comment", href: "#moyens" },
    demo: {
      titre: "Une semaine de bureau, en exemple",
      onglets: { main: "À la main", outil: "Avec moi" },
      taches: TACHES_BUREAU.map((tache) => ({
        libelle: tache.tache,
        moyen: MOYENS_TACHE[tache.moyen],
        part: tache.minutes / MINUTES_MAX,
        main: duree(tache.minutes),
        outil: duree(reste(tache.minutes)),
      })),
      compteur: {
        main: { valeur: duree(MINUTES_SEMAINE), libelle: "de saisie par semaine" },
        outil: { valeur: duree(reste(MINUTES_SEMAINE)), libelle: "de relecture par semaine" },
      },
      gain: {
        valeur: duree(MINUTES_RENDUES),
        avant: duree(0),
        libelle: "rendues chaque semaine",
        detail: `Soit ${HEURES_RENDUES_AN} heures par an pour vos clients, vos décisions et le travail qui demande un humain.`,
      },
      note: `Exemple pour un bureau d’une dizaine de personnes, sur ${SEMAINES_AN} semaines. Il reste un cinquième du temps pour relire. Vos chiffres se mesurent pendant l’appel.`,
    },
  },

  /*
   * LES TROIS MOYENS, décision d'Eliott du 2026-11-01 : ce qu'il ferait pour une
   * entreprise qui veut gagner du temps, sans aucun nom ni donnée d'un prospect.
   * Le prix n'est écrit que pour le logiciel : l'accompagnement se chiffre au devis.
   */
  moyens: {
    eyebrow: "Trois façons de vous rendre ces heures",
    titleLines: ["Le bon remède", "pour chaque", "corvée."],
    intro:
      "Une corvée ne se règle pas toujours avec un logiciel. Je regarde où part votre temps, puis je prends le moyen le plus simple.",
    lignes: [
      {
        titre: "Installer l’IA dans vos outils",
        corps:
          "Mails, comptes rendus, devis simples : vos équipes s’en servent sur leurs vraies tâches, sans rien remplacer.",
        lien: { label: "Voir l’automatisation", href: "/services/automatisation" },
      },
      {
        titre: "Construire le logiciel qui manque",
        corps: `Votre façon de travailler n’entre dans aucun outil du marché : je le construis, et il vous appartient. Dès ${ENTREE_LOGICIEL} HT.`,
        lien: { label: "Voir l’offre et le prix", href: `/services/${LOGICIEL.slug}` },
      },
      {
        titre: "Vous accompagner dans la durée",
        corps:
          "Une réunion par mois pour choisir la prochaine tâche à faire disparaître, et savoir où l’IA n’a rien à faire.",
        lien: { label: "En parler", href: lienRendezVous("decouverte") },
      },
    ],
    titreEtapes: "Comment ça se passe",
    etapes: [
      { titre: "Vous notez", corps: "Pendant trois ou quatre semaines, votre équipe note ce qui lui fait perdre du temps." },
      { titre: "Je trie", corps: "Chaque corvée reçoit son remède : un outil d’IA, un logiciel, ou rien du tout." },
      { titre: "On traite", corps: "On commence par la tâche qui rend le plus d’heures, et vous mesurez le gain." },
      { titre: "On continue", corps: "Chaque mois, on choisit la suivante, à votre rythme." },
    ],
  },

  /*
   * LES RÉALISATIONS, RÉÉCRITES LE 2026-10-31 : « On vous compare avant
   * d'appeler » parlait au client du site vitrine. Ce sont des produits réels,
   * jamais présentés comme des logiciels livrés à un client : la section invite
   * à regarder, elle n'affirme aucune référence.
   *
   * LIGNES DE 12 SIGNES AU PLUS, le titre est rendu à 92 px dans une demi-
   * colonne de 683 px, aligné à droite dès 810.
   */
  showreel: {
    marquee: "Regardez ce que je construis.",
    marqueeLines: ["Regardez", "ce que je", "construis."],
    statement:
      "Avant de me confier votre métier, vous voulez voir du concret. Voici des produits que j’ai développés et mis en service, écran par écran.",
    // Rendue en noir 60 %, ce fragment passe en noir plein.
    statementEmphasis: ["mis en service, écran par écran."],
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
      "Je suis développeur full-stack, installé à Caen, et je travaille seul. Du premier appel à la mise en service, vous parlez à celui qui conçoit et qui code votre logiciel.",
      "Avant de me lancer, j’ai développé chez Médiapilote, Würth France, MeilleursBiens, puis MECA SERVICES, où je tenais aussi la boutique en ligne. J’y ai appris à partir de ce qu’un outil doit rapporter, et à regarder comment les gens travaillent avant d’écrire la première ligne de code.",
      /* LE MESSAGE D'ELIOTT, 2026-10-30 : le temps humain revient à ce qui rend
         la personne indispensable, l'IA fait le sale boulot. */
      "Ma conviction : une machine ne remplace pas la personne qui connaît vos clients, elle la débarrasse de ce qui l’empêche de s’en occuper. Le recopiage et les factures partent au logiciel et à l’IA, et le temps rendu revient à ce qui rend votre équipe indispensable. Chaque détail est décidé, testé et documenté avant de vous être remis : rien n’est laissé au hasard.",
    ],
    // Emphase (source Framer) : ces expressions passent en noir plein au
    // milieu du paragraphe rendu à 70 %.
    highlights: [
      "je travaille seul",
      "vous parlez à celui qui conçoit et qui code votre logiciel",
      "partir de ce qu’un outil doit rapporter",
      "ce qui rend votre équipe indispensable",
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
      "Vous avez tous les accès dès la mise en service, et vous changez de prestataire quand vous voulez.",
    stats: reputationStats,
    // LE RENDEZ-VOUS EST LE CHEMIN PRINCIPAL du site. « Voir les réalisations »
    // est parti : la section des réalisations est juste au-dessus.
    ctas: [{ label: "Réserver un appel", href: lienRendezVous("logiciel") }],
  },

  // section06.ts — prestations en accordéon.
  services: {
    // PAS D'ÉTIQUETTE SUR L'ACCUEIL depuis le 2026-09-24 (phase C) : le chapô
    // et l'accordéon disent d'eux-mêmes ce qu'ils présentent, et le gabarit
    // étiquette / titre / paragraphe revenait cinq fois de suite.
    // IDENTIQUE à `aboutContent.services.intro` : les deux pages rendent le même
    // bloc, et un chapô qui dérive est une page qui ne dit pas la même chose que
    // l’autre sans que personne le remarque.
    intro:
      "Je pars de votre façon de travailler, et je construis le logiciel qui lui correspond : la contrainte disparaît, le temps revient à votre équipe.",
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
   * ORDRE DES SECTIONS : celui de la page d'origine, décision d'Eliott du
   * 2026-11-01. Qui je suis, ce que j'ai construit, les chiffres, puis le
   * logiciel au travail : la section métiers et sa liste sont retirées, l'accueil
   * parle à chaque métier sans le citer.
   *
   * LES DEUX SECTIONS À CARTES NOIRES restent séparées par le logiciel.
   */
  sectionOrder: [
    "hero",
    "about",
    "showreel",
    "works",
    "numbers",
    "logiciel",
    "moyens",
    "whyUs",
    "faq",
    "articles",
  ],

  seo: {
    // Mot-clé en tête, marque en fin.
    title: "Logiciel métier sur mesure · Eliott Bouquerel",
    description:
      "Le logiciel métier qui fait disparaître la tâche qui vous bloque. L’IA fait le sale boulot, votre équipe reprend son temps. Basé à Caen, en visio partout.",
    ogImage: {
      src: "/images/og.jpg",
      alt: "Eliott Bouquerel",
    },
  },
};
