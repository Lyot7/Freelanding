import type { HeroComparaison, HomeContent } from "@/lib/content/types";
import { slugsMisEnAvant } from "@/content/blog";
import { faqItems } from "@/content/faq";
import { services } from "@/content/services";
import { euros, repereAgenceLogiciel, SUR_DEVIS } from "@/content/offre";
import { TACHES_BUREAU } from "@/content/page-automatisation";
import { lienRendezVous } from "@/content/rendez-vous";
import { reputationStats } from "@/content/stats";

/* LE GAIN DE L'ACCUEIL, dérivé des hypothèses de `page-automatisation.ts`. */
const PART_RELECTURE = 0.2;
const SEMAINES_AN = 45;
const reste = (minutes: number): number => Math.round(minutes * PART_RELECTURE);
const MINUTES_SEMAINE = TACHES_BUREAU.reduce((total, t) => total + t.minutes, 0);
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

const minutesDe = (...indices: readonly number[]): number =>
  indices.reduce((total, i) => total + TACHES_BUREAU[i].minutes, 0);

/* LA SEMAINE DE LA DÉMONSTRATION : les six tâches de `page-automatisation.ts`, posées sur cinq jours. */
const SEMAINE = [
  { jour: "Lundi", tache: "Mails", taches: [0] },
  { jour: "Mardi", tache: "Commandes", taches: [1] },
  { jour: "Mercredi", tache: "Comptes rendus", taches: [3] },
  { jour: "Jeudi", tache: "Devis", taches: [4] },
  { jour: "Vendredi", tache: "Relances, banque", taches: [2, 5] },
] as const;

const MINUTES_JOUR_MAX = Math.max(...SEMAINE.map((j) => minutesDe(...j.taches)));

const JOURS_BUREAU = SEMAINE.map(({ jour, tache, taches }) => {
  const minutes = minutesDe(...taches);
  return {
    jour,
    tache,
    part: minutes / MINUTES_JOUR_MAX,
    main: duree(minutes),
    rendu: duree(minutes - reste(minutes)),
  };
});

/*
 * UNE SEULE OFFRE DEPUIS LE 2026-10-31, décision d'Eliott du 2026-10-30. Ce qui
 * se vend : une contrainte qui disparaît et du temps gagné. Le temps humain
 * revient à ce qui rend la personne indispensable, et l'IA fait le sale boulot.
 *
 * « JUSQU'À DEUX FOIS MOINS CHER » EST PARTI AVEC LE SITE VITRINE : seule sa
 * comparaison le rendait exact (`offre.ts`). Le héros dit « une fraction » et
 * chiffre ce qu'une agence facture à côté du mien, source écrite.
 */
const POSITIONNEMENT = "Logiciel sur mesure et IA, pour une fraction du prix d’une agence.";

/*
 * LE H1 DE L'ACCUEIL. Depuis le 2026-11-01, décision d'Eliott : le temps gagné
 * d'abord, pour tous les métiers, et le moyen ensuite (logiciel, IA, accompagnement).
 *
 * UN SIMPLE TITRE depuis le 2026-11-01 : il valait « Je vous rends des
 * heures.Sur devis » à la lecture et doublait le lien « Voir une semaine rendue ».
 */
const PORTES = [{ lines: ["Je vous rends", "des heures."] }] as const;

const TITRE_ACCUEIL = PORTES.map((porte) => porte.lines.join(" ")).join(" ");

/** Le message d'Eliott, sous le titre. */
const CE_QUI_DISPARAIT =
  "Mails à trier, commandes à recopier, factures à relancer : je construis le logiciel ou j’installe l’IA qui s’en charge. Vous relisez, et votre équipe revient à ce qui la rend indispensable.";

/*
 * LA DURÉE DE L'APPEL, relevée chez Cal.com le 2026-11-01 : le bouton du héros
 * ouvre le sujet « logiciel », qui propose 30, 45 ou 60 minutes (45 par défaut).
 */
const NOTE_APPEL = "De 30 à 60 minutes en visio, gratuit et sans engagement";

/*
 * CE QU'UNE AGENCE FACTURE, ET LE MIEN SUR DEVIS (décision d'Eliott du
 * 2026-11-01 : aucun montant de sa part). Chiffres et source :
 * `repereAgenceLogiciel`.
 */
function comparaisonAgence(): HeroComparaison {
  const agence = repereAgenceLogiciel;
  return {
    sujet: "Un logiciel métier sur mesure",
    lignes: [
      {
        qui: "En agence",
        prix: `dès ${euros(agence.premierOutilMin)}`,
        detail: `${euros(agence.mediane)} en médiane`,
      },
      {
        qui: "Avec moi",
        prix: SUR_DEVIS,
        detail: "sans chef de projet ni structure à payer",
        fort: true,
      },
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
    // LE H1 DE L'ACCUEIL, un titre et rien d'autre.
    title: TITRE_ACCUEIL,
    titleLines: PORTES.map((porte) => porte.lines.join(" ")),
    doors: PORTES,
    /* Test des visiteurs du 2026-10-31 : une porte pour qui n'est pas prêt à appeler. */
    offerLink: { label: "Voir une semaine rendue", href: "#logiciel" },
    ctaNote: NOTE_APPEL,
    subtitle: CE_QUI_DISPARAIT,
    subtitleParagraphs: [{ text: CE_QUI_DISPARAIT }],
    /*
     * UNE SEULE PREUVE DANS LE PREMIER ÉCRAN depuis le 2026-10-16 : le prix
     * d'une agence, à côté du mien sur devis. Le −92 % de Würth est
     * sorti du héros, décision d'Eliott ; il reste dans la section chiffres.
     */
    comparison: comparaisonAgence(),
    // Fond du hero : macro d'un mouvement d'horlogerie, asset généré et
    // possédé (2026-08-10), calibré sombre par `scripts/hero-loop.mjs`
    // (moyenne 13,7/255) pour porter du texte blanc.
    cadran: {
      depart: MINUTES_SEMAINE,
      arrivee: reste(MINUTES_SEMAINE),
      taches: TACHES_BUREAU.map((tache) => tache.tache),
      gain: { valeur: duree(MINUTES_RENDUES), libelle: "rendues par semaine" },
      exemple: { label: "Exemple, le détail plus bas", href: "#logiciel" },
      exempleCourt: "en exemple",
      phrase: `Exemple : ${duree(MINUTES_SEMAINE)} de saisie par semaine deviennent ${duree(reste(MINUTES_SEMAINE))} de relecture, soit ${duree(MINUTES_RENDUES)} rendues.`,
    },
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
      role: "Développeur à Caen · réponse sous 24 h ouvrées",
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
    eyebrow: "(Le temps gagné)",
    // Lignes de douze signes au plus : le titre est rendu à 92 px dans une
    // demi-colonne, comme celui du showreel.
    titleLines: ["Vos heures", "valent mieux", "qu’un", "tableur."],
    statement:
      "Trier, recopier, relancer, rapprocher : une semaine de bureau part là-dedans, quel que soit votre métier. L’IA fait le sale boulot, vous validez.",
    statementEmphasis: ["vous validez."],
    // Le rendez-vous et non `#moyens` : la section des moyens suit juste après.
    cta: { label: "Chiffrer ma semaine", href: lienRendezVous("logiciel") },
    demo: {
      titre: "Une semaine de bureau, en exemple",
      onglets: { main: "À la main", outil: "Avec moi" },
      jours: JOURS_BUREAU,
      relire: "Relire",
      votreMetier: "Votre métier",
      preuve: "Mes propres mails sont triés de cette façon, chaque jour.",
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
    eyebrow: "(Trois façons de vous rendre ces heures)",
    titleLines: ["Le bon remède", "pour chaque", "corvée."],
    intro:
      "Une corvée ne se règle pas toujours avec un logiciel. Je regarde où part votre temps, puis je prends le moyen le plus simple.",
    lignes: [
      {
        titre: "Installer l’IA dans vos outils",
        corps:
          "Vos journées partent en mails, comptes rendus et devis simples. L’IA s’en charge dans les outils que vous avez déjà, et vos équipes valident.",
        lien: { label: "Voir l’automatisation", href: "/services/automatisation" },
      },
      {
        titre: "Construire le logiciel qui manque",
        corps:
          "Aucun outil du marché ne suit votre façon de travailler. Je construis celui qui la suit, et il vous appartient. Le prix se fixe au devis.",
        lien: { label: "Parler de votre outil", href: lienRendezVous("logiciel") },
      },
      {
        titre: "Si besoin, devenir votre référent",
        option: "(En option)",
        corps:
          "Mes missions sont ponctuelles. Si vous préférez un interlocuteur régulier, je deviens votre référent IA, développement ou R&D.",
        lien: { label: "Voir cette option", href: "/services/automatisation#referent" },
      },
    ],
  },

  /* LES RÉALISATIONS DE L'ACCUEIL : le seul résultat mesuré d'abord, puis le produit mené seul. */
  preuves: {
    eyebrow: "(Réalisations)",
    titleLines: ["Regardez", "ce que je", "construis."],
    statement:
      "Un parcours refait chez Würth France, une marketplace montée seul. Chaque fiche montre le problème de départ et ce que j’ai construit.",
    lien: { label: "Toutes les réalisations", href: "/realisations" },
    projets: [
      {
        slug: "wurth-creation-de-compte",
        titre: "Création de compte, Würth",
        chiffre: "−92 %",
        resume:
          "SIRET vérifié pendant la saisie, adresse tirée du registre : −92 % d’erreurs et de sollicitations du support, mesuré en interne.",
        medias: [
          { src: "/work/wurth/mockup.jpg", alt: "Le parcours de création de compte Würth sur écran" },
          { src: "/work/wurth/03-siret-adresse-remplie.png", alt: "Le SIRET vérifié et l’adresse remplie pendant la saisie" },
          { src: "/work/wurth/resultat-92.jpg", alt: "Le résultat mesuré, moins 92 % d’erreurs" },
        ],
      },
      {
        slug: "kpsull",
        titre: "Kpsull",
        resume: "Une marketplace entière, catalogue, recherche, panier et comptes, conçue et développée en propre.",
        medias: [
          { src: "/work/kpsull/mockup-poster.jpg", video: "/work/kpsull/mockup.mp4", alt: "La marketplace Kpsull en vidéo" },
          { src: "/work/kpsull/catalogue.jpg", alt: "Le catalogue de Kpsull" },
          { src: "/work/kpsull/createurs.jpg", alt: "La page des créateurs de Kpsull" },
        ],
      },
    ],
  },

  /* TITRE CHOISI PAR ELIOTT le 2026-09-24, gardé. */
  confiance: {
    eyebrow: "(Pourquoi moi ?)",
    titleLines: ["Personne", "ne vous tient", "en otage."],
    otage: {
      lignes: ["Le code", "L’hébergement", "Les données"],
      avant: "chez moi",
      apres: "chez vous",
      conclusion: "Tout est à votre nom. Vous changez de prestataire quand vous voulez.",
    },
    tuiles: [
      { chiffre: "0", titre: "intermédiaire", corps: "Ni chef de projet ni structure à payer. C’est de là que vient la fraction." },
      { chiffre: "1", titre: "chantier à la fois", corps: "Votre projet n’attend personne." },
      { chiffre: "24 h", titre: "ouvrées", corps: "Pour répondre à votre message." },
    ],
    verifier: {
      titre: "(Vérifiez avant d’appeler)",
      liens: [
        { label: "Voir le parcours Würth", href: "/realisations/wurth-creation-de-compte" },
        { label: "Voir Kpsull", href: "/realisations/kpsull" },
        { label: "Lire les CGV", href: "/legal/conditions-generales-de-vente" },
      ],
    },
    cta: { label: "Réserver un appel", href: lienRendezVous("logiciel") },
  },

  rencontre: {
    titleLines: ["Moi,", "c’est Eliott."],
    citation: "Si un abonnement à quarante euros règle votre problème, je vous le dirai.",
    paragraphes: [
      "Je suis développeur à Caen et je travaille seul. Du premier appel à la mise en service, vous parlez à celui qui conçoit et qui code votre logiciel.",
      "Avant de me lancer, j’ai développé chez Médiapilote, Würth France, MeilleursBiens et MECA SERVICES. J’y ai appris à regarder comment les gens travaillent avant d’écrire la première ligne de code.",
      "Je vous dis aussi ce que je ne fais pas : je ne reprends pas un logiciel écrit en PHP ou en Laravel, et si votre projet n’est pas pour moi, je vous le dis pendant l’appel.",
    ],
    cta: { label: "Réserver un appel", href: lienRendezVous("logiciel") },
    parcours: { label: "Mon parcours", href: "/a-propos" },
    portrait: { src: "/images/eliott-nature-vertical.jpg", alt: "Eliott Bouquerel, en extérieur" },
    signataire: "Eliott Bouquerel, développeur à Caen",
  },

  /*
   * LE PROFIL TEXTE DES ASSISTANTS (`/llms-full.txt`) ET LE JSON-LD lisent encore
   * ces blocs : aucune section de l'accueil ne les rend depuis le 2026-11-01. Le
   * parcours est celui de `/a-propos` (`about.ts`) : aucun employeur n'est
   * présenté comme client.
   */
  about: {
    title: "Moi, c’est Eliott.",
    body: [
      "Je suis développeur, installé à Caen, et je travaille seul. Du premier appel à la mise en service, vous parlez à celui qui conçoit et qui code votre logiciel.",
      "Avant de me lancer, j’ai développé chez Médiapilote, Würth France, MeilleursBiens, puis MECA SERVICES, où je tenais aussi la boutique en ligne. J’y ai appris à partir de ce qu’un outil doit rapporter, et à regarder comment les gens travaillent avant d’écrire la première ligne de code.",
      /* LE MESSAGE D'ELIOTT, 2026-10-30 : le temps humain revient à ce qui rend
         la personne indispensable, l'IA fait le sale boulot. */
      "Ma conviction : une machine ne remplace pas la personne qui connaît vos clients, elle la débarrasse de ce qui l’empêche de s’en occuper. Le recopiage et les factures partent au logiciel et à l’IA, et le temps rendu revient à vos clients et à vos décisions.",
    ],
  },

  numbers: { title: "Votre projet n’attend personne." },

  whyUs: { stats: reputationStats },

  services: {
    intro:
      "Je pars de votre façon de travailler, et je construis le logiciel qui lui correspond : la contrainte disparaît, le temps revient à votre équipe.",
    items: services,
  },

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
   * TROIS LOGOS, SANS DATE NI MENTION DE STAGE, décision d'Eliott du 2026-09-02 :
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
   * fausse déclaration que le retrait du 2026-08-10 voulait éviter.
   *
   * L'INTITULÉ REVIENT LE 2026-11-01, sans date ni contrat : « J'ai développé
   * chez » referme l'ambiguïté et respecte l'esprit de la décision du 09-02.
   */
  logoBand: {
    title: "J’ai développé chez",
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


  faq: faqItems,

  // Habillage du bloc FAQ (les questions viennent de faq.ts).
  // DÉRIVÉE DU REGISTRE : un article publié arrive ici sans qu'on y pense.
  lectures: {
    titre: "(Pour aller plus loin)",
    tous: "Tous les guides",
    slugs: slugsMisEnAvant.slice(0, 3),
  },

  faqSection: {
    eyebrow: "(FAQ)",
    titleLines: ["Avant de", "commencer."],
    cta: { label: "Poser une question", href: "/contact" },
  },

  /*
   * ORDRE DES SECTIONS du 2026-11-01 : le temps rendu, le moyen, la preuve, la
   * confiance, l'homme, puis les dernières questions. Aucune liste de métiers :
   * l'accueil parle à chacun sans le citer.
   */
  sectionOrder: ["hero", "logiciel", "moyens", "preuves", "confiance", "rencontre", "faq"],

  seo: {
    // Mot-clé en tête, marque en fin.
    title: "Logiciel métier sur mesure · Eliott Bouquerel",
    description:
      "Je construis le logiciel ou j’installe l’IA qui prend en charge vos mails, commandes et factures. Vous relisez, votre équipe reprend son temps. Caen et visio.",
    ogImage: {
      src: "/images/og.jpg",
      alt: "Eliott Bouquerel",
    },
  },
};
