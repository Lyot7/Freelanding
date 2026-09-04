/**
 * Modèle de contenu — source unique, typée, externalisée.
 * Objectif : les composants ne contiennent AUCUN texte/image en dur.
 * Tout vient d'ici → un CMS pourra alimenter ces mêmes structures plus tard.
 */

/* ----------------------------- Primitives ----------------------------- */

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /**
   * Légende VISIBLE, rendue sous le cadre dans un `<figcaption>`.
   *
   * Elle ne remplace pas `alt` et ne le double pas : `alt` décrit ce que
   * l'image montre pour qui ne la voit pas, la légende dit ce que le lecteur
   * doit en comprendre. Une galerie de captures d'interface sans légende est
   * une suite d'écrans que seul son auteur sait relier.
   *
   * Facultative : les captures d'ambiance (page d'accueil, rendu 3D) se
   * passent de commentaire, et une légende creuse vaut moins que rien.
   */
  caption?: string;
  /**
   * Numéro d'étape affiché AU-DESSUS du cadre, « 01 », « 02 »…
   *
   * Il n'est PAS l'index du tableau, et c'est tout l'intérêt : une séquence
   * d'écrans se lit dans l'ordre du visiteur, pas dans celui du dépôt des
   * fichiers, et deux de ses étapes peuvent être posées ailleurs dans la page
   * que le reste de la suite. Écrire le numéro dans la donnée garde la
   * numérotation continue quel que soit l'emplacement de rendu.
   *
   * Réservé aux captures qui forment un PARCOURS. Une capture d'ambiance n'a
   * pas de rang, et lui en donner un ferait croire à une étape.
   */
  step?: string;
  /**
   * Titre court de l'étape, rendu à droite du numéro. Il nomme ce que l'écran
   * FAIT, en trois ou quatre mots ; la démonstration, elle, reste dans
   * `caption`.
   */
  stepTitle?: string;
}

export interface VideoAsset {
  kind: "video";
  src: string;
}

export interface Link {
  label: string;
  /**
   * Forme courte, employée là où la place manque : bouton d'en-tête sous 390 px,
   * liens légaux du pied de page.
   *
   * Le français est nettement plus long que l'anglais de la source
   * (« DÉMARRER UN PROJET » fait 155 px contre 124 pour « START A PROJECT »,
   * « Politique de confidentialité » 168 px contre 89 pour « Privacy Policy »),
   * et les boîtes du template sont calées sur la version anglaise. Plutôt que de
   * raccourcir le libellé partout, on garde la forme complète là où elle tient
   * et on ne bascule sur celle-ci que là où elle déborde.
   */
  shortLabel?: string;
  href: string;
  external?: boolean;
}

export interface Person {
  name: string;
  role?: string;
  avatar?: ImageAsset;
  company?: string;
}

/**
 * Texte dont certains fragments basculent dans la polarité opposée.
 *
 * Le template alterne DEUX polarités sur une même pile de paragraphes : le
 * paragraphe « normal » est atténué (60 %) et met quelques mots en couleur
 * pleine, le paragraphe `inverted` fait l'exact contraire. Modéliser la
 * polarité plutôt que la couleur garde la donnée indépendante du thème.
 *
 * Les fragments d'`emphasis` doivent être des sous-chaînes EXACTES de `text`,
 * espaces compris : le rendu les recherche littéralement.
 */
export interface EmphasizedText {
  text: string;
  /** Fragments rendus dans la polarité opposée à celle du paragraphe. */
  emphasis?: readonly string[];
  /** `true` : paragraphe en couleur pleine dont les fragments passent à 60 %. */
  inverted?: boolean;
}

/**
 * Bandeau de disponibilité du hero et de la page contact.
 *
 * LA JAUGE EST OPTIONNELLE DEPUIS LE 2026-09-01, et c'est le point important.
 * `slotsLeft` était obligatoire : le type exigeait donc un chiffre de créneaux
 * pris pour pouvoir afficher un bandeau de disponibilité, et ce chiffre était
 * écrit à la main. Le site annonçait « 2/4 », c'est à dire deux projets en
 * cours, alors qu'Eliott n'avait aucun client. Un type qui rend une affirmation
 * publique obligatoire fabrique la fausse déclaration tout seul.
 *
 * Sans `slotsLeft`, le bandeau ne rend QUE son libellé : une phrase vraie, sans
 * décompte. Le jour où des créneaux réels sont tenus quelque part, remplir les
 * deux champs rallume la jauge sans toucher au composant.
 */
export interface Availability {
  label: string;
  /**
   * Fragments du libellé rendus en BLANC PLEIN, le reste restant en gris.
   *
   * Sans cette donnée, le rendu déduisait l'emphase du DERNIER ESPACE du
   * libellé : « CRÉNEAUX EN AOÛT » mettait « AOÛT » en blanc par coïncidence,
   * mais « CRÉNEAUX AOÛT 2026 » aurait mis « 2026 ». Le choix appartient à
   * l'éditeur, pas à une règle typographique devinée.
   *
   * Vide : tout le libellé est rendu d'un seul ton.
   */
  labelHighlights?: readonly string[];
  /**
   * Créneaux ENCORE LIBRES. Absent : aucune jauge, aucun décompte, seul le
   * libellé est rendu. Un chiffre ici est une affirmation publique sur le plan
   * de charge : il n'a sa place que s'il est tenu ailleurs que dans ce fichier.
   */
  slotsLeft?: number;
  /** Nombre total de segments de la jauge. */
  totalSlots?: number;
}

/** Identité de contenu indépendante de la source (fichiers, MDX, futur CMS). */
export interface SluggedContent {
  slug: string;
  /** Slugs historiques ou externes qui doivent résoudre vers le même contenu. */
  aliases?: readonly string[];
}

/** Blocs riches sérialisables sans dépendre du format d'un CMS particulier. */
export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; style: "ordered" | "unordered"; items: readonly string[] };

/* --------------------------- Config globale --------------------------- */

/**
 * Sections du site qu'on peut éteindre sans supprimer ni leur contenu, ni leur
 * code.
 *
 * Une section éteinte disparaît PARTOUT en même temps : navigation, ordre des
 * sections de la home, blocs équivalents des autres pages, sitemap, et route
 * dédiée quand elle en a une (qui répond alors 404). Le contenu reste en base
 * et dans les fichiers : rallumer le drapeau suffit à tout faire réapparaître.
 *
 * Voir `src/content/features.ts` pour l'état courant et la marche à suivre.
 */
export interface SiteFeatures {
  /**
   * Blog : index `/blog`, articles `/blog/[slug]`, section « actualités » de la
   * home, entrée « Blog » des trois navigations.
   */
  blog: boolean;
  /**
   * Témoignages clients : carrousel de la home, bloc de la page « à propos », et
   * bloc « paroles de client » des pages projet. Ne couvre PAS les citations
   * signées par Eliott lui-même (ouverture de la section tarifs, encart de la
   * section « comment je travaille ») : ce sont des phrases de manifeste, pas
   * des preuves sociales.
   */
  testimonials: boolean;
  /**
   * Signature manuscrite du hero, de la page « à propos », de la page contact et
   * de la section tarifs. Le tracé livré avec le template épelle le nom de la
   * marque d'origine : il ne peut pas rester. Rallumer ce drapeau suppose
   * d'avoir remplacé le tracé par la vraie signature d'Eliott.
   */
  signature: boolean;
}

export interface SiteConfig {
  /**
   * `given` est le PRÉNOM, affiché à droite du logotype dans le hero et repris
   * dans son nom accessible. Il était écrit en dur dans `HeroSection.tsx`, à
   * deux endroits : le seul mot du site qui échappait encore à la donnée.
   */
  brand: { name: string; mark: string; given: string }; // "Bouquerel", "®", "Eliott"
  tagline: string; // "Conversion-first design & dev studio"
  /** Fragments de la baseline mis en emphase dans l'en-tête. */
  taglineEmphasis?: readonly string[]; // ["design & dev"]
  nav: Link[];
  /** Liens du panneau de menu flottant — distincts de la nav d'en-tête. */
  menuNav?: Link[];
  primaryCta: Link; // "START A PROJECT"
  contact: {
    email: string;
    phone: string;
    address: string; // "124 City Road, London, EC1V 2NX"
    responseTime?: string;
    responseTimeLabel?: string; // libellé du bloc "Response Time"
    timezone?: string; // pour "LOCAL TIME"
    localTimeLabel?: string; // libellé du bloc "Local time"
    addressLabel?: string; // "Visit Us"
    /** Horaires d'ouverture (bloc footer). */
    hours?: string[]; // ["Mon–Fri: 09:00 – 18:00", "Sat: 10:00 – 16:00"]
    /** Interlocuteur mis en avant dans le footer (avec note perso). */
    person: Person & { note?: string };
  };
  /** Nav du footer (colonne « Navigation ») — distincte de la nav principale. */
  footerNav?: Link[];
  socials: Link[];
  legalLinks: Link[];
  copyright: string; // "2019-26©"
  /** Copyright long du footer. Ex. « © 2026 la marque d'origine. All rights reserved. » */
  copyrightLong?: string;
  availability?: Availability;
  /** Titres des colonnes du footer (« Contact », « Navigation »). */
  footerColumnLabels?: { contact: string; navigation: string };
  /** Bloc CTA du footer (« Start a project. » + sous-texte). */
  footerCta?: {
    heading: string;
    subtext?: string;
    /** Fragments du sous-texte rendus en blanc plein. */
    subtextEmphasis?: readonly string[];
    cta?: Link;
  };
  /** Formulaire de contact du footer (labels, options, disclaimer). */
  footerForm?: {
    nameLabel: string;
    namePlaceholder?: string;
    emailLabel: string;
    emailPlaceholder?: string;
    selectLabel: string;
    selectOptions: string[];
    submitLabel: string;
    disclaimer: string;
    /** Découpage du disclaimer autour de ses deux liens. */
    disclaimerPrefix?: string; // "By submitting, you agree to our "
    disclaimerJoiner?: string; // "and "
    disclaimerSuffix?: string; // "."
    disclaimerLinks?: Link[];
  };
  floatingCta?: Link; // bouton flottant / sticky
  credits?: {
    builtWith?: string;
    /** Libellé précédant l'outil (« Built in »). */
    builtWithLabel?: string;
    createdBy?: Link;
    /** Libellé précédant l'auteur (« Created by »). */
    createdByLabel?: string;
    /** Portrait affiché à côté de l'auteur. */
    createdByAvatar?: ImageAsset;
    /**
     * Libellé du bouton « source préférée » de Google. Le lien lui-même n'est
     * pas dans la donnée : il se déduit du domaine du site, et une adresse
     * saisie à la main serait une occasion de plus de se tromper.
     */
    preferredSourceLabel?: string;
  };
  meta: {
    defaultTitle: string;
    titleTemplate: string; // "%s — le studio d'origine"
    description: string;
    ogImage?: ImageAsset;
    locale: string;
  };
}

/* ------------------------------ Entités ------------------------------- */

export interface Testimonial {
  quote: string;
  author: Person;
  /** Fragments de la citation rendus en couleur pleine. */
  highlights?: readonly string[];
}

/** Résultat chiffré d'un case study (bloc "Results"). */
export interface Metric {
  label: string;
  value: string;
}

export interface WorkItem extends SluggedContent {
  title: string;
  client?: string;
  /**
   * Libellé de la ligne `client` de la fiche.
   *
   * « CLIENT » est juste quand quelqu'un a commandé le travail. Il ne l'est pas
   * pour une mission menée DANS une entreprise : sur un site de freelance, la
   * ligne « CLIENT : WÜRTH FRANCE » se lit comme une prestation facturée en
   * indépendant, ce que ce projet n'était pas. « EMPLOYEUR » nomme la relation
   * pour ce qu'elle est, sans avoir à écrire la forme du contrat dans un texte
   * public.
   *
   * Absent, la fiche affiche « CLIENT », ce qui convient aux deux autres
   * projets.
   */
  clientKind?: "client" | "employer";
  /**
   * Contenu de la ligne « Périmètre de la mission », quand les catégories ne
   * le disent pas.
   *
   * La fiche y rendait `categories`, qui sert AUSSI au filtre de `/work` : ses
   * valeurs sont donc des familles de métier (« Développement », « Web
   * design »), pas des périmètres. Sur Würth, la fiche annonçait « Périmètre de
   * la mission : Développement », ce qui ne dit rien de ce qui a été fait.
   * Absent, le comportement d'origine est conservé.
   */
  scope?: string;
  year?: string;
  role?: string; // rôle du studio sur le projet
  categories: string[]; // WEB DESIGN | DEVELOPMENT | BRANDING | SEO
  services?: string[];
  cover: ImageAsset;
  /**
   * Fond du hero de la page projet, quand la couverture ne peut pas y servir.
   *
   * POURQUOI CE CHAMP EXISTE. `cover` est une CAPTURE du site client : elle
   * porte sa barre de navigation, son logo, son slogan et ses boutons. En
   * vignette c'est exactement ce qu'il faut, on reconnaît un site. En fond de
   * hero pleine largeur, la capture passe SOUS l'en-tête et le titre de ce
   * site-ci : deux barres de navigation se superposent, deux logos, deux
   * accroches, et les boutons du client sortent derrière le texte de la page.
   * Mesuré sur `/work/kpsull` : « KPSULL » chevauchait « L'ANTIDOTE A
   * L'UNIFORME » et le résumé recouvrait « PARCOURIR LE CATALOGUE ».
   *
   * Ce champ reçoit l'image de fond SEULE, sans interface. Absent, le hero
   * retombe sur `cover` : aucun projet n'est cassé par son absence.
   */
  heroBackground?: ImageAsset;
  /** Média animé de la carte. La cover reste le poster et le fallback no-JS. */
  cardMedia?: VideoAsset;
  /**
   * Média de la carte projet, posé dans le plateau 3D commun à la home et à
   * `/work`. Fabriqué par `scripts/mockup-projets.mjs` : la scène est générée,
   * l'écran ne l'est pas, c'est le `demo.mp4` ou la capture du projet qui y est
   * incrusté en perspective.
   *
   * POURQUOI IL DOUBLE `cardMedia` AU LIEU DE LE REMPLACER. `cover` et
   * `cardMedia` servent aussi ailleurs : vignette de `/work`, affiche de la
   * page projet, image de partage. Y écrire le composite mettrait un portable
   * en perspective là où on attend une capture lisible. Ce champ ne parle que
   * de la carte ; absent, la carte retombe sur le comportement d'origine et
   * aucun projet n'est cassé par son absence.
   */
  cardMockup?: { poster: ImageAsset; video?: VideoAsset };
  accent?: string; // couleur de vignette (portée par la donnée, pas le thème)
  excerpt?: string;
  overview: string;
  problem: readonly string[];
  outcome: readonly string[];
  approach: readonly string[];
  body: readonly string[];
  /**
   * Résultats chiffrés. OPTIONNELS depuis le 2026-08-10 : un projet réel n'a
   * pas toujours de métrique publiable (accord du client, mesure jamais faite,
   * projet personnel). Les rendre obligatoires forçait à en inventer, ce qui est
   * précisément ce qu'on retire du site.
   */
  results?: readonly Metric[];
  /** Témoignage client. Optionnel pour la même raison : on n'en fabrique pas. */
  testimonial?: Testimonial;
  testimonialFollowUp?: string;
  gallery: readonly ImageAsset[];
  /**
   * En-tête de la suite d'écrans de fin de page.
   *
   * POURQUOI CE CHAMP EXISTE. Le gabarit de page projet vient d'un template de
   * studio : trois visuels d'AMBIANCE répartis dans le récit, puis une pile
   * pour le reste. Sur Kpsull et NSLysium, trois images suffisent et la pile
   * reste vide. Sur Würth, la galerie est d'une autre nature : sept captures
   * du MÊME formulaire, qui ne se distinguent qu'au détail et ne valent que
   * dans leur ordre. Empilées sans en-tête, elles se lisaient comme sept
   * versions de la même page, et le lecteur n'avait aucun moyen de savoir
   * laquelle vient avant l'autre ni pourquoi elle existe.
   *
   * Présent, il pose un titre et une phrase d'introduction au-dessus des
   * images restantes, qui deviennent une séquence annoncée. Absent, la pile se
   * comporte comme avant : aucun projet n'est cassé par son absence.
   */
  walkthrough?: {
    label: string;
    title: string;
    intro: string;
  };
  /**
   * Comparateur avant / après, inséré DANS la suite d'écrans à son rang.
   *
   * POURQUOI IL N'EST PAS DEUX IMAGES DE PLUS. Certaines paires de captures ne
   * se distinguent que par un état : sur Würth, la liste des contraintes du mot
   * de passe est la MÊME image à deux instants, rouge puis verte. Posées l'une
   * sous l'autre, elles obligent le lecteur à faire l'aller-retour de l'œil
   * entre deux cadres séparés de 900px, et la moitié de la démonstration se
   * perd dans le trajet. Superposées sous un curseur, la différence est le
   * mouvement lui-même.
   *
   * `step` le range dans la séquence : le comparateur est trié avec les images
   * qui l'entourent, il n'est pas collé en fin de liste.
   */
  comparison?: {
    step: string;
    stepTitle: string;
    caption: string;
    before: ImageAsset;
    after: ImageAsset;
    /** Libellés des deux états, rendus de part et d'autre du curseur. */
    beforeLabel: string;
    afterLabel: string;
  };
  /** Démonstration vidéo liée au premier média narratif. */
  projectVideoUrl?: string;
  /** Vignette de la vidéo projet (elle diffère d'un projet à l'autre). */
  videoPoster?: ImageAsset;
  launched?: string;
  liveUrl: string; // lien vers le site livré
  nextProject: string; // slug du projet suivant
}

export interface BlogPost extends SluggedContent {
  title: string;
  /** Date de publication ISO. */
  date: string;
  /** Provenance de la date lorsque le provider ne publie pas de date éditoriale. */
  dateSource: "editorial" | "provider-release";
  /** Indique si l'article apparaît dans la grille `/blog`. */
  listedInIndex: boolean;
  category: string;
  author: Person;
  cover: ImageAsset;
  excerpt: string;
  readingTime?: string;
  tags?: string[];
  related?: string[]; // slugs d'articles liés
  /*
   * PAS DE CORPS ICI. Le texte de l'article vit dans
   * `src/content/articles/<slug>.mdx`, chargé par la page `blog/[slug]`. Le
   * champ portait auparavant un tableau de `ContentBlock` (paragraphe, titre,
   * liste) : trois formes, aucune image dans le fil, aucune vidéo, aucun bloc
   * propre à l'article. Le MDX lève cette limite sans ouvrir la porte à
   * n'importe quoi, la palette de blocs étant fermée (`components/blog/blocks`).
   */
  seo?: PageSeo;
}

export interface Stat {
  value: string; // "60+"
  label: string; // "projects shipped"
  /** Caractère affiché AVANT le chiffre (« / » des cartes « Why us? »). */
  prefix?: string;
  suffix?: string; // "+", "s", "%" — pour un compteur animé
  format?: "integer" | "decimal";
  /** Expressions du label mises en emphase (blanc plein sur fond blanc 70 %). */
  highlights?: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TeamMember extends Person {
  bio?: string;
}

/* --------------------------- Contenu de page -------------------------- */

/** Un paragraphe de sous-titre de hero, avec ses fragments en emphase. */
export type HeroSubtitleParagraph = EmphasizedText;

export interface HeroContent {
  eyebrow?: string;
  title: string;
  /**
   * Découpage du titre en lignes typographiques. Le template révèle chaque
   * ligne séparément : le découpage appartient donc au contenu, pas au rendu.
   */
  titleLines?: readonly string[];
  titleHighlight?: string;
  subtitle?: string;
  /**
   * Découpage du sous-titre en paragraphes distincts. Quand il est absent, le
   * rendu retombe sur `subtitle` en un seul paragraphe atténué.
   */
  subtitleParagraphs?: readonly HeroSubtitleParagraph[];
  media?: { kind: "video" | "image"; src: string; poster?: string };
  /** Mot posé à droite du logotype (« studio »). */
  wordmarkCaption?: string;
  /** Prestations listées sous le logotype (« design / development / Marketing »). */
  serviceWords?: readonly string[];
  /** Séparateur inséré entre ces mots. */
  serviceWordsSeparator?: string;
  /** Personne mise en avant à côté du sous-titre (carte fondateur). */
  person?: Person;
}

/** Bloc « Showreel » — marquee défilant + phrase manifeste + millésime. */
export interface ShowreelContent {
  /** Texte du marquee défilant (répété dans l'UI). Ex. « We build websites. » */
  marquee: string;
  /**
   * Découpage du titre en LIGNES, une entrée par ligne.
   *
   * Le titre était découpé automatiquement à chaque espace : un mot par ligne.
   * La phrase anglaise de la source en compte trois, la française sept, et le
   * bloc rendait « JE / CONSTRUIS / DES / SITES / ET / DES / OUTILS. » — quatre
   * lignes d'un ou deux caractères dans un corps de 92 px. Le découpage est une
   * décision de mise en page, elle appartient donc à la donnée, comme
   * `hero.titleLines` ou `about.teamTitleLines`. Sans ce champ, le composant
   * retombe sur l'ancien comportement mot à mot.
   */
  marqueeLines?: readonly string[];
  /** Phrase manifeste sous le marquee. */
  statement: string;
  /** Fragments de la phrase manifeste rendus en noir plein. */
  statementEmphasis?: readonly string[];
  /** Millésime affiché à côté du marquee. Ex. « 2019-26© ». */
  vintage: string;
  /** Lien d'appel (« ↓ SEE THE WORK »). */
  cta?: Link;
  /** Caractère précédant le libellé du lien (« ↓ »). */
  ctaPrefix?: string;
  /** Affiche figée de la vidéo. */
  poster?: ImageAsset;
}

/** Une prestation (bloc accordéon « Services », section06). */
export interface ServiceItem {
  /** Numéro d'ordre affiché (« 01 »…« 05 »). */
  number: string;
  title: string;
  /** Prix affiché tel quel (« Dès 5 000 € »), préfixe compris. */
  price?: string;
  /** Corps long (un ou plusieurs paragraphes). */
  body: string[];
  image?: ImageAsset;
  /**
   * Lien vers la page dédiée de la prestation.
   *
   * IL N'Y EN AVAIT AUCUN, et c'était le défaut de conversion le plus cher du
   * site : sur les 12 600 px de la page d'accueil, les seuls boutons rattachés
   * à un prix vivaient dans la grille tarifaire, dont aucune colonne ne parlait
   * de site vitrine. Un visiteur venu pour un site n'avait pas un seul point
   * d'arrivée à sa mesure.
   */
  cta?: Link;
  /**
   * Point d'arrivée DIRECT sur la prise de rendez-vous, sujet présélectionné.
   *
   * IL N'Y EN AVAIT AUCUN NON PLUS, et c'était pire que l'absence de page
   * dédiée : la prise de rendez-vous existait, fonctionnait, affichait les vrais
   * créneaux Cal.com, et aucun lien du site n'y menait. Le seul chemin était
   * d'ouvrir `/contact` et de descendre 2 300 px en traversant un formulaire de
   * contact complet, qui est son concurrent direct.
   *
   * SEULE L'ADRESSE EST PORTÉE ICI. Le libellé vient de `uiLabels.services`,
   * une seule fois pour les cinq lignes : voir la note qui l'accompagne.
   */
  rdvHref?: string;
}

/**
 * Ce qu'Eliott sait faire au-delà du catalogue chiffré.
 *
 * IL N'Y A NI PRIX NI DÉLAI DANS CE TYPE, et c'est délibéré. Ces sujets
 * n'existent pas dans `offre.ts` : leur donner un champ `prix` ouvrirait la
 * porte à un montant écrit à la main, hors de la seule source qui en connaisse
 * la règle de construction.
 */
export interface HorsCatalogue {
  titre: string;
  intro: string;
  items: readonly { readonly nom: string; readonly corps: string }[];
  cta: Link;
}

/** Section « Services » : intro + liste de prestations (accordéon). */
export interface ServicesSection {
  eyebrow?: string; // « Services »
  intro?: string; // « Every project starts with understanding… »
  items: ServiceItem[];
  /**
   * Bloc « et aussi », posé SOUS l'accordéon. Optionnel : la page « à propos »
   * monte le même accordéon et n'a pas à répéter ce que la page d'accueil dit
   * déjà, deux écrans avant les tarifs.
   */
  horsCatalogue?: HorsCatalogue;
}

/**
 * Section de chiffres réutilisable (« How we do it » = numbers.ts,
 * « Built on reputation » = number.ts). Peut embarquer un témoignage
 * (Quote Stack) et des CTA contextuels.
 */
export interface StatsSection {
  eyebrow?: string; // « How we do it » | « Why us? »
  title?: string; // « Built on reputation »
  stats: Stat[];
  /** Témoignage intégré à la section (référencé depuis testimonials.ts). */
  testimonial?: Testimonial;
  /** CTA de la section (« Our Reviews », « Start a Project »…). */
  ctas?: Link[];
}

/**
 * Une cellule de la bande défilante (section11).
 *
 * `image` EST OPTIONNELLE depuis le 2026-09-01. Le type l'exigeait, donc la
 * bande ne pouvait exister qu'en reproduisant des marques figuratives de tiers.
 * Reproduire le logo d'une entreprise sans son accord est une contrefaçon de
 * marque (art. L713-2 du code de la propriété intellectuelle) doublée d'une
 * reproduction d'œuvre graphique ; CITER SON NOM pour dire qu'on y a travaillé
 * ne l'est pas, c'est un fait vérifiable et une référence nécessaire
 * (art. L713-6). Une cellule sans image rend donc `name` et `detail` en texte,
 * ce qui est à la fois le chemin sans risque et le plus lisible.
 */
export interface LogoItem {
  name?: string;
  /** Fichier du logo. Absent : la cellule est rendue en texte. */
  image?: ImageAsset;
  /**
   * Seconde ligne de la cellule : la NATURE et la DATE du lien. Sur un site de
   * prestataire, un nom d'entreprise seul se lit « mon client » ; c'est cette
   * ligne qui dit « alternance 2025-2026 » et referme l'ambiguïté.
   */
  detail?: string;
}

/** Bande défilante (marquee) de références. */
export interface LogoBand {
  /**
   * Intitulé posé AU-DESSUS de la bande, et il n'est pas décoratif : sans lui,
   * une file d'entreprises sur un site de prestataire s'entend « voici mes
   * clients ». Il doit nommer la relation réelle.
   */
  title?: string;
  logos: LogoItem[];
}

/** Section « Témoignages » (carrousel « What our clients say », section10). */
export interface TestimonialsSection {
  eyebrow?: string; // « Client stories »
  title: string; // « What our clients say. »
  /** Découpage du titre en lignes révélées séparément. */
  titleLines?: readonly string[];
  intro?: string; // « We let the results speak… »
  /** Fragments de l'intro rendus en noir plein. */
  introEmphasis?: readonly string[];
  items: Testimonial[];
}

/** Section « FAQ » : surtitre, titre en lignes, lien d'appel. */
export interface FaqSection {
  eyebrow?: string; // « FAQ »
  /** Découpage du titre en lignes (« Before we » / « get started. »). */
  titleLines?: readonly string[];
  cta?: Link; // « Ask a question »
}

/** Section « Articles » de la home (référence des articles depuis blog.ts). */
export interface ArticlesSection {
  eyebrow?: string; // « News and updates. »
  /** Découpage du grand titre en lignes (« News and » / « updates. »). */
  titleLines?: readonly string[];
  cta?: Link; // « See more »
  /** Slugs des articles mis en avant sur la home (ordre d'affichage). */
  featuredSlugs: string[];
}

export interface PageSeo {
  title: string;
  description: string;
  ogImage?: ImageAsset;
}

/** Bloc « Strategy before pixels. » de la home (section About). */
export interface HomeAboutSection {
  title: string;
  /**
   * Découpage du titre en LIGNES, une entrée par ligne.
   *
   * Sans ce champ le rendu retombe sur UN MOT PAR LIGNE, le découpage du
   * template anglais. Il tenait tant que le titre valait trois mots ; il
   * fabrique une colonne d'une ligne par mot dès qu'il en porte une phrase.
   * Le découpage d'un titre est une décision de mise en page, elle appartient
   * donc à la donnée, comme `hero.titleLines`, `showreel.marqueeLines` ou
   * `about.teamTitleLines`.
   *
   * Chaque ligne est ensuite AJUSTÉE À LA LARGEUR du cadre (cf.
   * `src/lib/ajustement-titre.ts`) : la longueur d'une ligne décide de sa
   * taille de corps, elle ne peut plus la faire déborder.
   */
  titleLines?: readonly string[];
  body: string[];
  /** Fragments des paragraphes rendus en blanc plein. */
  highlights?: string[];
  /** Libellé de gauche de la grille d'infos (« Launched »). */
  launchedLabel?: string;
  /** Libellé de droite de la grille d'infos (« 24+ projects »). */
  projectsLabel?: string;
  /** Millésime affiché au-dessus du titre (« 2019-26© »). */
  vintage?: string;
  /** Compteur du coin inférieur droit (« 12+ » + légende). */
  counter?: { value: string; suffix?: string; caption?: string };
  /** Lien de bas de colonne (« About us »). */
  cta?: Link;
  /** Photo de la colonne droite. */
  image?: ImageAsset;
}

export interface HomeContent {
  hero: HeroContent;
  showreel: ShowreelContent;
  about: HomeAboutSection;
  /** Projets mis en avant sur la home, dans l'ordre éditorial. */
  featuredWorkSlugs: readonly string[];
  /** « How we do it » — grille de chiffres + témoignage intégré (numbers.ts). */
  numbers: StatsSection;
  /** « Built on reputation » — bloc « Why us? » (number.ts). */
  whyUs: StatsSection;
  /** Prestations en accordéon (section06). */
  services: ServicesSection;
  /** Carrousel témoignages (section10). */
  testimonials: TestimonialsSection;
  /** Bande de logos (section11). */
  logoBand?: LogoBand;
  /** Articles mis en avant (référence blog.ts). */
  articles: ArticlesSection;
  faq?: FaqItem[];
  /** Habillage de la section FAQ (surtitre, titre, lien d'appel). */
  faqSection?: FaqSection;
  seo: PageSeo;
  /**
   * Ordre d'affichage des sections de la home — source unique de la composition.
   * Valeurs : hero | about | showreel | works | whyUs | services | numbers |
   * faq | testimonials | logoBand | articles.
   */
  sectionOrder: string[];
}

export interface AboutContent {
  hero: HeroContent;
  body: string[];
  /** Fragments des paragraphes du récit rendus en blanc plein. */
  bodyHighlights?: readonly string[];
  /** Surtitre du bloc récit (« Contact us »). */
  storyEyebrow?: string;
  /** Photo du studio, à droite du récit. */
  cover?: ImageAsset;
  team: TeamMember[];
  /** Découpage du titre de la section équipe (« The » / « team. »). */
  teamTitleLines?: readonly string[];
  stats: readonly Stat[];
  services: ServicesSection;
  /**
   * Témoignage de la page « à propos ». OPTIONNEL depuis le 2026-09-01 : le
   * champ était obligatoire, donc la page ne pouvait pas compiler sans citer
   * quelqu'un, et c'est ce qui maintenait en vie le persona « Sophie Andersen »
   * du template. Un type qui exige une parole de client en fabrique une.
   */
  testimonial?: Testimonial;
  articles: ArticlesSection;
  seo: PageSeo;
}

export interface ContactFieldContent {
  label: string;
  placeholder: string;
}

export interface ContactFormContent {
  name: ContactFieldContent;
  email: ContactFieldContent;
  projectType: ContactFieldContent & { options: readonly string[] };
  message: ContactFieldContent;
  submitLabel: string;
  disclaimer: { text: string; links: readonly Link[] };
}

export interface ContactCardContent {
  person: Person & { note?: string };
  email: string;
  phone: string;
  address: string;
  /** Libellé au-dessus de l'adresse postale (« Address »). */
  addressLabel?: string;
  /** Libellé au-dessus du téléphone (« Phone »). */
  phoneLabel?: string;
  availability?: Availability;
}

export interface ContactContent {
  hero: HeroContent;
  intro: readonly string[];
  /** Surtitre du bloc coordonnées (« Contact us »). */
  detailsEyebrow?: string;
  /** Photo du studio, à gauche des coordonnées. */
  cover?: ImageAsset;
  form: ContactFormContent;
  contactCard: ContactCardContent;
  faq: FaqItem[];
  seo: PageSeo;
}

/** Bloc d'inscription à la newsletter, en pied d'article. */
export interface NewsletterContent {
  title: string; // « Newsletter »
  body: string; // « Short notes on conversion… »
  emailLabel: string; // libellé lu par les lecteurs d'écran
  placeholder: string; // « your@email.com »
  submitLabel: string; // « Subscribe »
}

export interface BlogContent {
  hero: HeroContent;
  categories: readonly string[];
  posts: readonly BlogPost[];
  /** Bloc newsletter affiché sous chaque article. */
  newsletter?: NewsletterContent;
  /** Lien au-dessus des articles liés (« All articles »). */
  relatedLink?: Link;
  /** Découpage du titre des articles liés (« Latest » / « articles. »). */
  relatedTitleLines?: readonly string[];
  /** Durée de lecture affichée quand un article n'en déclare pas. */
  readingTimeFallback?: string;
  seo: PageSeo;
}

export interface WorkContent {
  hero: HeroContent;
  filters: readonly string[];
  items: readonly WorkItem[];
  /*
   * `faq` A ÉTÉ RETIRÉ le 2026-09-03, avec le bloc qu'il alimentait. Les mêmes
   * dix questions étaient rendues sur dix adresses ; sur `/work` elles pesaient
   * 866 mots contre 33 pour le reste de la page. Le champ est sorti du CONTRAT
   * et pas seulement du rendu : un champ optionnel que rien ne lit se remplit
   * de nouveau tout seul, six mois plus tard, sans que personne s'en aperçoive.
   */
  seo: PageSeo;
}

export interface LegalDocument extends SluggedContent {
  title: string;
  summary: string;
  lastUpdated: string;
  body: readonly ContentBlock[];
  seo: PageSeo;
}

/** Page 404 — même statut éditorial qu'une page publique. */
export interface NotFoundContent {
  /** Message court, une ligne par entrée. */
  messageLines: readonly string[];
  /** Découpage du grand titre (« Page » / « not found »). */
  titleLines: readonly string[];
  /** Mention du code d'erreur (« 404 error »). */
  errorLabel: string;
  /** Lien de retour (« Back to homepage »). */
  backLink: Link;
}

/**
 * Libellés d'interface — tout le texte de « chrome » du site.
 *
 * Ce sont les mots qui habillent la donnée éditoriale : intitulés de colonnes,
 * séparateurs, textes d'état vide, mentions d'accessibilité, noms de mois. Ils
 * ne varient pas d'une page à l'autre, d'où un modèle unique et partagé.
 */
export interface UiLabels {
  /** En-tête, menu, pied de page et mentions d'accessibilité globales. */
  chrome: {
    skipToContent: string; // « Skip to content »
    mainNavLabel: string;
    /** Nom accessible de la navigation du pied de page. */
    footerNavAriaLabel: string; // lecteur d'écran, nav de l'en-tête
    navSeparator: string; // « / » entre deux entrées de nav
    floatingNavLabel: string; // lecteur d'écran, nav flottante
    menuDialogLabel: string; // lecteur d'écran, panneau de menu
    openMenuLabel: string;
    closeMenuLabel: string;
    menuColumnLabel: string; // « Menu »
    contactColumnLabel: string; // « Contact »
    navigationColumnLabel: string; // « Navigation »
    logoHomeSuffix: string; // suffixe du libellé du logo
    wordmarkSuffix: string; // suffixe du libellé du logotype du hero
    socialLinkPrefix: string; // « Link to »
    marqueeLabel: string; // lecteur d'écran, bandeau défilant
    loadingLabel: string; // lecteur d'écran, indicateur de chargement
  };
  /** Formats de date. Les composants passent en capitales si le rendu l'exige. */
  dates: {
    monthsAbbreviated: readonly string[]; // 12 entrées, « Jan »…« Dec »
    monthsFull: readonly string[]; // 12 entrées, « January »…« December »
    lastUpdatedLabel: string; // « Last updated: »
  };
  /** Listes filtrables du blog et des projets. */
  filters: {
    allLabel: string; // « All »
    categorySeparator: string; // « / » entre catégorie et date
    blogCategoriesLabel: string;
    /** Intitulé du sommaire d'article, dans la colonne de gauche. */
    blogTableOfContentsLabel: string;
    blogSearchLabel: string;
    blogSearchPlaceholder: string;
    blogEmptyLabel: string;
    workArchiveLabel: string;
    workSearchLabel: string;
    workSearchPlaceholder: string;
    workCountSuffix: string; // « projects shown »
    workEmptyLabel: string;
    workResetLabel: string;
  };
  /** Formulaires (contact et pied de page). */
  forms: {
    requiredMarker: string; // « * » accolé aux libellés obligatoires
  };
  /** Accordéon des prestations. */
  services: {
    priceLabel: string; // « Prix : » — le préfixe vient du prix lui-même
    toggleShowLabel: string; // « Show »
    toggleHideLabel: string; // « Hide »
    toggleSuffix: string; // « details »
    /**
     * Bouton de prise de rendez-vous, IDENTIQUE sur les cinq lignes.
     *
     * Il vit ici et non dans chaque entrée de `services.ts` pour que
     * l'uniformité soit structurelle : une ligne ne peut pas dériver toute
     * seule vers « Rendez-vous à 3 000 € », qui se lirait comme un prix arrêté
     * pour le projet alors que ce n'est qu'un plancher de périmètre.
     */
    rdvLabel: string;
    /** Préfixe du nom accessible, complété par le nom de la prestation. */
    rdvAriaPrefix: string;
  };
  /** Carrousel de témoignages. */
  testimonials: {
    quoteOpen: string;
    quoteClose: string;
    roleSuffix: string;
  };
  /** Pages projet et archive des projets. */
  work: {
    portfolioLabel: string; // « Portfolio »
    liveProjectLabel: string; // « Live project »
    backToProjectsLabel: string; // « Back to projects »
    scopeLabel: string; // « Scope of work »
    scopeSeparator: string; // « / » entre deux prestations
    timelineLabel: string; // « Timeline »
    clientLabel: string;
    /** Variante employée quand la mission a été menée dans l'entreprise. */
    employerLabel: string; // « Client »
    yearLabel: string; // « Year »
    problemTitleLines: readonly string[]; // « The » / « problem. »
    resultsLabel: string; // « The results »
    approachLabel: string; // « The approach »
    playVideoLabel: string; // « Play video »
    videoAriaPrefix: string; // « Play the »
    videoAriaSuffix: string; // « project video on YouTube »
    videoPosterSuffix: string; // description de la vignette vidéo
    testimonialEyebrow: string; // « Testimonial »
    testimonialTitleLines: readonly string[]; // « Client » / « words. »
    quoteOpen: string;
    quoteClose: string;
    nextProjectLabel: string; // « Next project »
    /** Libellé du curseur d'un comparateur avant / après (`%1`, `%2`). */
    compareSliderLabel: string;
    /** Valeur annoncée par ce curseur (`%n` en plus de `%1` et `%2`). */
    compareSliderValueText: string;
  };
}

export type ContentRouteKind =
  | "page"
  | "work"
  | "post"
  | "legal"
  /** Page dédiée d'une prestation, sous `/services/`. */
  | "service";

/** Route publique issue du sitemap live, sans hypothèse sur le routeur entrant. */
export interface ContentRoute {
  pathname: string;
  kind: ContentRouteKind;
  contentSlug?: string;
  /**
   * Date ISO de dernière modification, publiée dans `<lastmod>` du sitemap.
   *
   * OPTIONNELLE, ET C'EST VOULU. Elle n'est posée que là où une vraie date
   * existe — les articles, qui la portent dans `src/content/blog.ts`, et
   * l'index du blog, qui vaut la plus récente d'entre elles. Inventer une date
   * pour les autres routes serait pire que de n'en publier aucune : Google
   * compare la `<lastmod>` déclarée à ce qu'il constate en explorant, et cesse
   * de la lire quand elle ment. Un signal de fraîcheur faux est un signal
   * perdu, pas un signal neutre.
   */
  lastModified?: string;
}
