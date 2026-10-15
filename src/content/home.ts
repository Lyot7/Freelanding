import type { HeroProof, HomeContent } from "@/lib/content/types";
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

/** La ligne de preuve du héros, tirée du chiffre Würth de `stats.ts`. */
function preuveWurth(): HeroProof | undefined {
  const stat = howWeDoItStats.find((s) => s.label.includes("Würth"));
  if (!stat) return undefined;
  return {
    // Espace fine insécable avant le signe pour cent.
    value: `${stat.prefix ?? ""}${stat.value}\u202F${stat.suffix ?? ""}`,
    label: stat.label,
    href: "/realisations/wurth-creation-de-compte",
  };
}

/*
 * « 50 % DU PRIX D'UNE AGENCE », formulé pour rester vrai : le prix d'entrée
 * du site rapporté à la médiane d'un site de PME relevée sur des budgets
 * d'agences, source liée. Le pourcentage est calculé, jamais tapé : si le
 * plancher ou la médiane bougent, la phrase suit.
 */
function preuveAgence(): HeroProof {
  const part = Math.round((prestation("vitrine").plancher / repereAgenceSite.mediane) * 100);
  return {
    value: `${part}\u202F%`,
    label: `du prix d’un site de PME en agence, médiane ${euros(repereAgenceSite.mediane)}`,
    source: {
      label: `${repereAgenceSite.source.nom}, ${repereAgenceSite.source.releve}`,
      href: repereAgenceSite.source.href,
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
     * DEUX PREUVES DANS LE PREMIER ÉCRAN : le seul résultat mesuré du site,
     * lu dans `stats.ts` pour ne jamais diverger de la section chiffres, puis
     * la comparaison de prix, sourcée. Aucune ne présente une entreprise comme
     * cliente.
     */
    proofs: [preuveWurth(), preuveAgence()].filter(
      (preuve): preuve is HeroProof => preuve !== undefined,
    ),
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
    marquee: "Votre client vous compare avant d’appeler.",
    marqueeLines: ["Votre client", "vous compare", "avant", "d’appeler."],
    statement:
      "Il ouvre votre site puis celui du concurrent, et il appelle celui qui rassure. Regardez ce que j’ai livré.",
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
     * H2 DEPUIS LE 2026-09-24 (phase E). Sa phrase précédente, « Des sites qui
     * amènent des clients, des outils qui te rendent des heures », est devenue
     * le titre du héros et le seul h1 de l'accueil. La répéter un écran plus
     * bas l'aurait affaiblie.
     *
     * LA SECTION RESTE, avec un titre à elle, parce qu'elle porte le seul
     * texte de l'accueil qui dit COMMENT Eliott travaille : il part de ce que
     * le site doit rapporter, et décide de ce qui ne se voit pas avant le
     * code. Le titre donne le point de départ, le corps le développe dessous
     * sans reprendre ses mots.
     *
     * DÉCOUPAGE : trois lignes aux unités de sens. Toutes reçoivent le corps
     * dicté par la plus large (cf. `TitleFitText`).
     */
    title: "Je pars de ce que votre site doit rapporter.",
    titleLines: ["Je pars de ce", "que votre site", "doit rapporter."],
    // FIDÉLITÉ : la section About du source n'a QU'UN paragraphe (cf.
    // framer-html/about.ts, RichText « People decide… »). Les paragraphes
    // précédemment ajoutés provenaient de showreel/numbers → retirés.
    body: [
      "Un site peut impressionner et ne rien rapporter du tout. C’est même devenu courant : une belle carrosserie posée sur un moteur lent, sortie en quelques heures, qui n’a jamais eu à répondre à la question de savoir à quoi elle sert. Je prends le problème dans l’autre sens. Ce que vous voyez est dessiné pour votre métier ; ce que vous ne voyez pas, l’architecture, la vitesse, ce que les moteurs de recherche lisent, est décidé avant la première ligne de code.",
    ],
    // Emphase blanche (source Framer) : ces expressions passent en blanc plein
    // au milieu du paragraphe rendu en blanc 70 %.
    highlights: [
      "une belle carrosserie posée sur un moteur lent",
      "décidé avant la première ligne de code",
    ],
    /*
     * GRILLE D'INFOS, MILLÉSIME ET COMPTEUR VIDÉS le 2026-09-24 (panel design,
     * phase C), comme sur `/a-propos` qui monte la même section sans eux :
     *   - « Lancé en 2026 » se lisait « débutant », sans rien apprendre au
     *     client ;
     *   - « Développeur freelance » redisait la carte fondateur du héros,
     *     un écran plus haut ;
     *   - « 2026© » est déjà le millésime du showreel ;
     *   - « 1 / Projet à la fois » est dit par la section chiffres, « Ton
     *     projet n'attend personne ».
     * Les champs restent dans le type : la section sait encore les rendre.
     */
    cta: { label: "À propos", href: "/a-propos" },
    // PHOTO PLEINE CADRE depuis le 2026-08-27. Ce cadre portait le portrait
    // DÉTOURÉ sur aplat accent, alors que la source y met une photographie qui
    // remplit le cadre bord à bord. Sur un aplat, deux défauts se cumulaient :
    // le sujet flottait (141 px d'aplat vide au-dessus de la tête sur 885, soit
    // 16 % du fichier) et le calque de grain de la section dessinait un
    // rectangle sale sur la couleur unie. Une photographie règle les deux d'un
    // coup, et rend au grain sa raison d'être.
    // Recadrée au rapport 0,637584 du cadre, servie en niveaux de gris par le
    // composant. Le détourage vert reste employé sur la vignette ronde et sur
    // la citation de la section tarifs.
    //
    // CADRAGE RESSERRÉ le 2026-08-27. Le plan précédent descendait au mollet et
    // laissait 12 % de ciel au-dessus de la tête : dans un cadre de 341 px de
    // large au point d'arrêt bureau, le visage tombait à une trentaine de
    // pixels et le sujet devenait indistinct. Nouveau plan taille, coupé au
    // haut du jean : tête à 8 % du bord haut, visage lisible à la taille réelle
    // d'affichage. Recadré depuis l'original `IMG_0738.HEIC` (4284 × 5712 après
    // orientation), fenêtre 1430 × 2243 à +1439/+1577, rééchantillonné en
    // 1035 × 1623 — mêmes dimensions de fichier qu'avant, aucune mise en page
    // ne bouge.
    // Portrait sans nom écrit à côté : c'est une image de contenu, elle porte
    // un texte alternatif (audit du 2026-09-28).
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
    // Mesuré : 3 lignes dans les 560 px du bloc, contre 4 auparavant.
    intro:
      "Je pars de votre façon de travailler, et je construis ce qui lui correspond. Pas de fonctions en trop, rien à contourner.",
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
   * LES TARIFS NE SONT PLUS SUR L'ACCUEIL depuis le 2026-09-07 : chaque page de
   * prestation porte son offre et sa prise de rendez-vous.
   */
  sectionOrder: [
    "hero",
    "about",
    "services",
    "showreel",
    "works",
    "numbers",
    "methode",
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
