import type { HomeContent } from "@/lib/content/types";
import { slugsMisEnAvant } from "@/content/blog";
import { faqItems } from "@/content/faq";
import { services } from "@/content/services";
import { packEntree, prixPack } from "@/content/offre";
import { lienRendezVous } from "@/content/rendez-vous";
import { howWeDoItStats, reputationStats } from "@/content/stats";

const ENTREE_VITRINE = prixPack(packEntree("vitrine"));
const ENTREE_LOGICIEL = prixPack(packEntree("logiciel"));
const ACCROCHE_HERO = `Je conçois et je code ton site vitrine, à partir de ${ENTREE_VITRINE} HT, ou ta solution métier, à partir de ${ENTREE_LOGICIEL} HT. Le prix est fixé avant de commencer.`;

/*
 * LE TITRE DU HÉROS, ET LE SEUL H1 DE L'ACCUEIL, depuis le 2026-09-24 (phase E).
 * Eliott : « ton titre, ce serait bien que ce soit ce qu'on a ensuite ». La
 * phrase était le h1 de la section About, un écran plus bas ; elle monte dans
 * le cadre du héros et About passe à un h2 qui lui est propre.
 */
const TITRE_ACCUEIL =
  "Des sites qui amènent des clients, des outils qui te rendent des heures.";

/*
 * LA LIGNE « POUR QUI », SANS PRIX, depuis la même date. « Prix ferme dès
 * 3 000 € HT » est parti : il affirmait un prix ferme pour toute l'offre alors
 * que La Plateforme et ce qui dépasse les forfaits se chiffrent sur mesure. Les
 * prix restent dans l'accordéon et sur les pages de prestation.
 */
const POUR_QUI_HERO = "Sites vitrines et solutions métier pour les TPE et les PME.";

/** La ligne de preuve du héros, tirée du chiffre Würth de `stats.ts`. */
function preuveWurth(): HomeContent["hero"]["proof"] {
  const stat = howWeDoItStats.find((s) => s.label.includes("Würth"));
  if (!stat) return undefined;
  return {
    // Espace fine insécable avant le signe pour cent.
    value: `${stat.prefix ?? ""}${stat.value}\u202F${stat.suffix ?? ""}`,
    label: stat.label,
    href: "/realisations/wurth-creation-de-compte",
  };
}

/**
 * Contenu de la page d'accueil — recomposé fidèlement à partir des sections de
 * l'archive Framer (src/content/framer-html/*.ts). Chaque section pointe vers sa
 * source unique (faq / stats / pricing / services / testimonials) : aucune
 * duplication de texte.
 *
 * TRADUCTION FR : la copy passe à la première personne du singulier (Eliott
 * travaille seul) et toutes les preuves sociales fabriquées du template
 * (ancienneté 2019, 24+ projets, 12+ secteurs, 60+ projets livrés, 89 % de
 * recommandation, 4.9/5 Google & Clutch, lien Trustpilot) sont retirées.
 *
 * TUTOIEMENT depuis le 2026-09-02, décision d'Eliott. Il travaille seul, et
 * c'est là son écart avec les agences : le vouvoiement faisait parler un
 * cabinet, le tutoiement fait parler une personne. Il tient sur TOUT le texte
 * visible du site ; les documents contractuels (`legal.ts`) restent au
 * vouvoiement, parce qu'un contrat ne se tutoie pas.
 *
 * CE QUE LA BASCULE N'A PAS FAIT : elle n'a introduit aucune promesse, aucun
 * chiffre et aucun délai neufs. Chaque phrase touchée dit exactement ce qu'elle
 * disait la veille, à la personne près, et reste adossée à
 * `vault/wiki/business/copy-matiere-brute.md`.
 */
export const homeContent: HomeContent = {
  hero: {
    /*
     * L'EYEBROW PORTE LA ZONE, plus le millésime, décision d'Eliott du
     * 2026-09-02. « (Depuis 2026, version 1.0.4) » occupait la ligne la plus
     * haute de la page pour dire deux choses coûteuses : que l'activité est
     * neuve, et que le site est un produit versionné, donc un gabarit.
     *
     * La zone est le seul élément du hero qui n'apparaît nulle part ailleurs :
     * le métier est déjà dit par le H1, par « Développeur freelance » sous la
     * photo et par les trois disciplines en pied de cadre. Un prospect normand
     * cherche du local, et rien ne le lui disait.
     */
    eyebrow: "Sur mesure, depuis la Normandie, partout en France",
    // LE H1 DE L'ACCUEIL, rendu dans le cadre du héros sous le mot-symbole.
    // Voir `TITRE_ACCUEIL` plus haut.
    title: TITRE_ACCUEIL,
    // Coupure à la virgule dès 1360 px, où les deux moitiés tiennent chacune
    // sur une ligne (voir `HeroSection`).
    titleLines: [
      "Des sites qui amènent des clients,",
      "des outils qui te rendent des heures.",
    ],
    // `subtitle` est la copy de repli, non affichée ici : le hero rend le
    // paragraphe de `subtitleParagraphs`. Les deux disent désormais la même
    // chose, il n'y a plus de raison qu'elles divergent.
    subtitle: ACCROCHE_HERO,
    /*
     * SOUS LE TITRE, LA CIBLE ET LES DEUX PRESTATIONS, en corps de lecture et
     * sans prix (voir `POUR_QUI_HERO`). Le détail des forfaits est dans
     * l'accordéon, un clic plus bas.
     */
    subtitleParagraphs: [{ text: POUR_QUI_HERO }],
    offerLink: { label: "↓ Voir les prestations", href: "#services" },
    /*
     * LA PREUVE DANS LE PREMIER ÉCRAN depuis le 2026-09-24 (phase D). La bande
     * des logos commençait sous la ligne de flottaison : à 1440 × 900, le
     * visiteur ne voyait ni les logos ni un seul résultat avant de défiler.
     * La ligne reprend le seul résultat mesuré du site, lu dans `stats.ts`
     * pour ne jamais diverger de la section chiffres, et mène à l'étude de
     * cas qui le détaille. Elle dit « chez Würth France » : rien n'y présente
     * une entreprise comme cliente.
     */
    proof: preuveWurth(),
    // Fond du hero. Remplace le plan de pilote du template, dont la licence
    // n'était pas traçable, par un asset généré et possédé (Veo/Nano Banana,
    // 2026-08-10) : macro d'un mouvement d'horlogerie, qui dit « l'outil qui
    // tourne derrière » sans l'illustrer.
    //
    // La boucle est produite par `scripts/hero-loop.mjs`, qui la CALIBRE sur le
    // profil lumineux relevé du fond d'origine (moyenne 17/255, aucun pixel
    // au-dessus de 200) et échoue si la cible n'est pas atteinte. Ce n'est pas
    // une coquetterie : ce fond porte le wordmark blanc, et un aplat clair
    // mouvant sous le texte le trouerait par intermittence.
    // Mesuré ici : moyenne 13,7 · max 114 · p99 93 · 0,000 % au-dessus de 200.
    media: {
      kind: "video",
      src: "/videos/hero-loop.mp4",
      // Première image de la boucle, 14 Ko. Sans affiche, l'élément LCP du
      // mobile était la vidéo elle-même, peinte à 8,8 s sur réseau bridé.
      poster: "/videos/hero-loop-poster.webp",
    },
    // Mot posé à droite du logotype dans la source. Le hero reconstruit affiche
    // « Eliott » en dur : ce champ n'est plus lu par le rendu.
    wordmarkCaption: "freelance",
    // Mots volontairement COURTS (contrainte de largeur du hero) : mesurés à
    // 18 px, séparateurs et gouttières compris, 449 px dans une rangée de 678.
    //
    // CES TROIS MOTS-LÀ depuis le 2026-08-29. La bande répétait « sites /
    // outils / logiciels », c’est-à-dire les trois mots du H1 posé cent pixels
    // plus haut : un bégaiement. Elle dit désormais ce que je FAIS, le H1 disant
    // ce qu’il en SORT.
    serviceWords: ["design", "développement", "référencement"],
    serviceWordsSeparator: "/",
    // Carte « fondateur » du template : la persona Anna Schneider (CEO) n'existe
    // pas, le champ porte la seule identité réelle du site.
    //
    // PHOTO RÉELLE depuis le 2026-08-10 (fournie par Eliott). Le portrait du
    // template, la photo d'une inconnue rendue sous le nom d'Eliott, est
    // définitivement écarté.
    //
    // Le fond d'origine du fichier était un vert citron `#cdff00`, plus saturé
    // que l'accent du site. Il a été remplacé par `--accent` (#c8f24a) au
    // chromakey, sinon la vignette posait un vert étranger à la palette juste à
    // côté des aplats accent. Recadrage serré sur le visage : la vignette fait
    // 40 px de côté, un plan buste s'y lirait comme un aplat vert.
    //
    // `alt` VIDE et non « Eliott Bouquerel » : le nom est déjà rendu en texte à
    // deux centimètres de là. Le répéter ferait dire deux fois la même chose à
    // un lecteur d'écran, la vignette est donc décorative au sens WCAG.
    person: {
      name: "Eliott Bouquerel",
      role: "Développeur freelance",
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
    marquee: "Ton client te compare avant d’appeler.",
    marqueeLines: ["Ton client", "te compare", "avant", "d’appeler."],
    statement:
      "Il ouvre ton site puis celui du concurrent, et il appelle celui qui rassure. Regarde ce que j’ai livré.",
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
    title: "Je pars de ce que ton site doit rapporter.",
    titleLines: ["Je pars de ce", "que ton site", "doit rapporter."],
    // FIDÉLITÉ : la section About du source n'a QU'UN paragraphe (cf.
    // framer-html/about.ts, RichText « People decide… »). Les paragraphes
    // précédemment ajoutés provenaient de showreel/numbers → retirés.
    body: [
      "Un site peut impressionner et ne rien rapporter du tout. C’est même devenu courant : une belle carrosserie posée sur un moteur lent, sortie en quelques heures, qui n’a jamais eu à répondre à la question de savoir à quoi elle sert. Je prends le problème dans l’autre sens. Ce que tu vois est dessiné pour ton métier ; ce que tu ne vois pas, l’architecture, la vitesse, ce que les moteurs de recherche lisent, est décidé avant la première ligne de code.",
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
    image: {
      src: "/images/eliott-nature-bloc.jpg",
      alt: "",
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
    title: "Ton projet n’attend personne.",
    titleLines: ["Ton projet", "n’attend", "personne."],
    intro:
      "Je ne mène qu’un chantier à la fois, alors ton message a sa réponse sous 24 h ouvrées.",
    stats: howWeDoItStats,
  },

  // number.ts — « Pourquoi moi ? » : une carte chiffrée + appel.
  whyUs: {
    eyebrow: "Pourquoi moi ?",
    // TITRE ET SOUS-TITRE CHOISIS PAR ELIOTT le 2026-09-24 (remplacent « Ce
    // qui est vérifiable. »). La carte porte le chiffre qui le prouve.
    title: "Personne ne te tient en otage.",
    titleLines: ["Personne", "ne te tient", "en otage."],
    intro:
      "Tu as tous les accès dès la mise en ligne, et tu changes de prestataire quand tu veux.",
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
      "Je pars de ta façon de travailler, et je construis ce qui lui correspond. Pas de fonctions en trop, rien à contourner.",
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
   * prestation porte ses forfaits et sa prise de rendez-vous.
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
    title: "Eliott Bouquerel, développeur web freelance pour TPE et PME",
    description:
      "Sites rapides, référencement local et outils métier sur mesure : prise de rendez-vous, suivi client, devis. Développeur freelance en Normandie, et partout en France à distance.",
    ogImage: {
      src: "/images/og.jpg",
      alt: "Eliott Bouquerel",
    },
  },
};
