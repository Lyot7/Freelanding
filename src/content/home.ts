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
    // PLUS DE H1 DANS LE HERO depuis le 2026-08-31 : retour au gabarit d'avant
    // le 2026-08-29, où cette section était une SIGNATURE DE MARQUE (millésime,
    // logotype, sous-accroche, carte fondateur, métiers) et rien d'autre.
    //
    // POURQUOI IL EN SORT. Le logotype « Bouquerel » est déjà un bloc
    // typographique plein cadre. Un titre de 48 px posé vingt pixels dessous
    // dressait un second pavé de densité comparable, et les deux se
    // concurrençaient : le regard ne savait plus lequel des deux était le sujet
    // de la page. Mot d'Eliott le 2026-08-31, « le design était mieux ordonné
    // avant ». Aucun rythme vertical ne rattrape deux masses de même poids
    // empilées.
    //
    // OÙ LE H1 EST PARTI. Sur la première section de contenu, `about`, dont le
    // titre est rendu en 92 px et n'a aucun voisin typographique. Il y porte les
    // mêmes mots-clés (sites, outils, logiciels, sur mesure) au lieu de les
    // dupliquer ici.
    //
    // `title` RESTE RENSEIGNÉ parce que `HeroContent` l'exige et que les autres
    // pages (contact, à propos, blog, réalisations) rendent le leur. Celui-ci
    // n'est plus lu par aucun rendu : `HeroSection` n'affiche plus de titre.
    title: "Sites, outils et logiciels sur mesure",
    // `subtitle` est la copy de repli, non affichée ici : le hero rend le
    // paragraphe de `subtitleParagraphs`. Les deux disent désormais la même
    // chose, il n'y a plus de raison qu'elles divergent.
    subtitle: ACCROCHE_HERO,
    /*
     * LE HERO NOMME L'OFFRE depuis le 2026-09-24 (audit des parcours, phase B).
     * Il ne disait ni ce qui se vend ni à quel prix : le visiteur devait
     * descendre trois sections pour l'apprendre. La phrase nomme les deux
     * prestations et leur prix d'entrée, lus dans `offre.ts` pour ne jamais
     * diverger de l'accordéon. Corps 16 px en casse normale : c'est un texte
     * qu'on lit, pas une étiquette.
     *
     * `inverted: true` ATTÉNUE les fragments listés : la seconde phrase passe à
     * 60 %, l'offre reste en blanc plein.
     */
    subtitleParagraphs: [
      {
        text: ACCROCHE_HERO,
        emphasis: ["Le prix est fixé avant de commencer."],
        inverted: true,
      },
    ],
    offerLink: { label: "↓ Voir les prestations", href: "#services" },
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
     * AFFICHE DE LA SECTION.
     *
     * C'ÉTAIT LE MÉCANISME D'HORLOGERIE, une image fixe extraite de la boucle du
     * héros. Elle était belle et elle ne disait rien d'ici : la section annonce
     * « je construis des outils qu'on garde, où avancer semble évident et ne
     * laisse aucune place à l'hésitation », et montrait un rouage. Un rouage
     * parle de mécanique interne, pas de chemin évident, et il redisait en plus
     * le visuel du héros deux écrans plus haut.
     *
     * CE QUI LA REMPLACE dit exactement la phrase : un escalier de béton vu de
     * face, avec un rai de lumière posé en son milieu, de la première marche à
     * la dernière. La direction est donnée par la lumière, pas par une flèche,
     * et il n'y a rien à décider pour savoir où aller. Frontale et symétrique,
     * elle se lit comme une intention et non comme une image d'ambiance.
     *
     * Photographie Vladimir Khoteev, licence Unsplash, passée en niveaux de gris
     * et contrastée pour rejoindre le traitement des autres photos du site.
     * Provenance et traitement dans `docs/ASSETS.md`.
     *
     * 1512 × 960, soit le double de la boîte de mise en page : l'affiche
     * précédente faisait 756 × 480 et n'avait donc aucune réserve pour un écran
     * à haute densité.
     */
    poster: {
      src: "/images/escalier-lumiere-paysage.jpg",
      alt: "Un escalier de béton vu de face, un rai de lumière posé en son milieu de la première à la dernière marche",
      width: 1512,
      height: 960,
    },
  },

  about: {
    // H1 DE LA PAGE D'ACCUEIL depuis le 2026-08-31, et seul h1 du document.
    // Le hero n'en porte plus (cf. le bloc `hero` plus haut) : ce titre est le
    // premier bloc de contenu de la page et le plus gros caractère du document,
    // il est le titre de premier niveau naturel.
    //
    // « LE MOTEUR COMPTE. » EST RETIRÉ. C'était une métaphore posée en titre,
    // et une métaphore n'annonce rien : elle illustre. Mot d'Eliott le
    // 2026-08-31, « dis un truc plus clair avec ce que je vends ». L'image de
    // la belle carrosserie et du moteur lent reste, mais dans le CORPS du texte,
    // juste dessous, où elle a sa place et où elle est déjà écrite.
    //
    // « SITES, OUTILS, LOGICIELS. » EST RETIRÉ le 2026-09-01. Mot d'Eliott :
    // « c'est pas assez pour un H1 ». Il a raison, et le défaut est mesurable :
    // trois noms communs sans verbe, sans cible et sans lieu, sur la balise la
    // plus lourde du document. Elle ne portait aucune requête qu'un client tape
    // vraiment — personne ne cherche « sites outils logiciels », on cherche un
    // développeur, pour un besoin, dans une zone.
    //
    // CE QU'IL DIT, ET POURQUOI IL A RACCOURCI LE 2026-09-02.
    //
    // Le titre précédent empilait le métier, la cible et la zone en quinze
    // mots : « Sites, outils et logiciels sur mesure pour les entreprises sans
    // équipe technique, en Normandie et partout en France. » Chaque morceau se
    // défendait, l'ensemble se lisait comme un paragraphe. Rendu, ça faisait
    // six lignes pleines qu'Eliott a arrêtées net (« c'est quoi ce pavé de
    // texte illisible »). Un titre a une seconde pour être lu, pas trois.
    //
    // Il nomme donc le RÉSULTAT, dans les mots du vault
    // (`copy-matiere-brute.md`) : des sites qui amènent des clients, des outils
    // qui rendent des heures. Le corps de section, juste en dessous, explique
    // comment on y arrive ; les pages de service détaillent quoi.
    //
    // LE TUTOIEMENT est une décision d'Eliott du 2026-09-02 : il travaille
    // seul, c'est son écart avec les agences, et le vouvoiement le faisait
    // sonner comme un cabinet. Il tient sur tout le site sauf les documents
    // contractuels.
    //
    // LA ZONE ET LA CIBLE NE DISPARAISSENT PAS : elles vivent dans le titre de
    // la page, dans la description SEO et dans `businessSchema.areaServed`,
    // c'est-à-dire là où les moteurs les lisent, sans coûter la lisibilité de
    // la première seconde.
    //
    // TEST ANTI-BULLSHIT D'ELIOTT (« si le contraire est absurde, la phrase ne
    // dit rien ») : le contraire est un site qui impressionne sans rien
    // rapporter et un outil qui fait perdre du temps. Ce n'est pas absurde,
    // c'est le cas COURANT, et `body` le dit deux lignes plus bas.
    title:
      "Des sites qui amènent des clients, des outils qui te rendent des heures.",
    // DÉCOUPAGE EXPLICITE, une entrée par ligne rendue. Il est ici et pas dans
    // le composant parce qu'il coupe aux unités de sens, ce qu'aucune règle
    // automatique ne sait faire : « sur mesure » et « sans équipe technique » ne
    // se coupent pas en deux.
    //
    /*
     * SIX LIGNES SONT DEVENUES QUATRE, le 2026-09-02, et le titre a changé de
     * nature.
     *
     * CE QU'IL DISAIT : « Sites, outils et logiciels sur mesure pour les
     * entreprises sans équipe technique, en Normandie et partout en France. »
     * Correct sur le fond, illisible à l'écran : six lignes pleines, quinze
     * mots, un pavé qu'on lit comme un paragraphe et pas comme un titre. Eliott
     * l'a arrêté net (« c'est quoi ce pavé de texte illisible »).
     *
     * CE QU'IL DIT MAINTENANT est dans ses mots, repris de
     * `vault/wiki/business/copy-matiere-brute.md` : des sites qui amènent des
     * clients, des outils qui rendent des heures. Le titre nomme le RÉSULTAT,
     * le corps de section juste en dessous explique comment on l'obtient. Son
     * contraire n'est pas une évidence : un site qui impressionne sans rien
     * rapporter est le cas courant, et c'est exactement ce que dit `body`.
     *
     * LE TUTOIEMENT vient d'une décision d'Eliott du même jour : il est seul,
     * c'est son écart avec les agences, et le vouvoiement le faisait sonner
     * comme un cabinet. « Te rendent des heures » plutôt que « vous rendent ».
     *
     * LA ZONE ET LA CIBLE NE SONT PAS PERDUES : elles vivent dans le `title` de
     * la page, la description SEO, et le sous-titre du hero. Un h1 qui les
     * empilait toutes tenait le référencement et perdait le lecteur.
     *
     * DÉCOUPAGE : quatre lignes de 13 à 20 signes. Toutes reçoivent le corps
     * dicté par la plus large (cf. `TitleFitText`), les plus courtes laissent
     * du blanc à droite.
     */
    titleLines: [
      "Des sites qui",
      "amènent des clients,",
      "des outils qui te",
      "rendent des heures.",
    ],
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
    // Habillage de la section (grille d'infos, millésime, compteur, lien,
    // photo). Le « 24+ projects » et le compteur « 12+ industries » du template
    // étaient fabriqués : remplacés par des mentions vérifiables.
    launchedLabel: "Lancé en 2026",
    projectsLabel: "Développeur freelance",
    vintage: "2026©",
    // « 1 INTERLOCUTEUR » RETIRÉ le 2026-09-24 : il ne disait rien d'utile au
    // client. Le compteur garde sa place dans la grille (photo | chiffre) et
    // porte la règle de travail qu'Eliott a choisie.
    counter: {
      value: "1",
      caption: "Projet à la fois",
    },
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
    eyebrow: "Comment je travaille",
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
    eyebrow: "Services",
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
   * ORDRE DES SECTIONS, refait le 2026-09-24 (audit des parcours, phase B).
   *
   * L'OFFRE MONTE JUSTE SOUS LE H1. L'accordéon des prestations arrivait après
   * le showreel, les réalisations et « Pourquoi moi » : le visiteur lisait
   * trois sections avant d'apprendre ce qui se vend et à quel prix. Il suit
   * maintenant `about`, qui porte le h1.
   *
   * PUIS LA PREUVE, DU CONCRET AU CHIFFRÉ : les réalisations (annoncées par le
   * showreel), « Pourquoi moi », les chiffres, la méthode, la FAQ.
   *
   * La bande des employeurs reste après la FAQ et avant les articles : ce sont
   * des employeurs, pas des clients, et une file d'entreprises en tête de page
   * se lirait comme un mur de références commerciales.
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
    "whyUs",
    "numbers",
    "methode",
    "faq",
    "logoBand",
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
