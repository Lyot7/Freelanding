import type { UiLabels } from "@/lib/content/types";

/**
 * Libellés d'interface — le texte de « chrome » du site.
 *
 * Le site est en FRANÇAIS. Ces chaînes provenaient du template anglophone et
 * ont été traduites ; celles qui étaient déjà en français (mentions
 * d'accessibilité de la source reconstruite) sont conservées telles quelles.
 *
 * NOTE BRANCHEMENT :
 * Ces libellés sont désormais LUS par les composants de rendu. Ils portaient
 * auparavant chacun leur propre copie en dur, en anglais, ce qui rendait ce
 * fichier inopérant : le traduire ne changeait rien à l'écran. Quatre
 * composants embarquaient même leur propre tableau de noms de mois ; le
 * formatage des dates est maintenant centralisé dans
 * `src/components/format-date.ts`, alimenté par `months` ci-dessous.
 *
 * NOTE FIDÉLITÉ :
 * - Les noms de mois sont stockés en casse de titre. Les emplacements qui les
 *   affichent en capitales (blog, pages légales) appliquent la transformation
 *   au rendu : « Janv » → « JANV », « Janvier » → « JANVIER ». Les accents
 *   survivent à `text-transform: uppercase` (« FÉVRIER », « DÉCEMBRE »).
 * - Deux champs de recherche portaient un point de suspension différent dans la
 *   source : « … » (U+2026) côté blog, « ... » (trois points) côté projets.
 *   L'écart n'est plus conservé : sur un site français les deux emploient le
 *   caractère unique …, qui est ce que la typographie appelle des points de
 *   suspension. Trois points collés sont un dépannage de machine à écrire.
 * - Les guillemets des blocs citation étaient DROITS côté carrousel (") et
 *   COURBES ANGLAIS côté pages projet (“ ”). Les deux venaient du template
 *   anglophone, et les deux se voyaient à l'écran. TRANCHÉ le 2026-08-27 : les
 *   deux emplacements passent aux guillemets français « … », avec l'espace fine
 *   insécable (U+202F) à l'intérieur, comme le veut l'usage. C'était le choix
 *   de typographie laissé en suspens ici.
 */
export const uiLabels: UiLabels = {
  chrome: {
    skipToContent: "Aller au contenu",
    mainNavLabel: "Navigation principale",
    footerNavAriaLabel: "Navigation du pied de page",
    navSeparator: "/",
    floatingNavLabel: "Navigation flottante",
    menuDialogLabel: "Menu de navigation",
    openMenuLabel: "Ouvrir le menu",
    closeMenuLabel: "Fermer le menu",
    menuColumnLabel: "Menu",
    contactColumnLabel: "Contact",
    navigationColumnLabel: "Navigation",
    // VIRGULE et non tiret cadratin : ce suffixe complète le nom accessible du
    // logotype (« Bouquerel®, accueil »). Un lecteur d'écran prononce le
    // cadratin — « tiret » — au milieu du premier élément de chaque page.
    logoHomeSuffix: ", accueil",
    // Le template suffixait la marque par « Studio ». Eliott travaille seul :
    // plus de suffixe, le logotype porte son nom seul (défini dans site.ts).
    wordmarkSuffix: "",
    socialLinkPrefix: "Lien vers ",
    marqueeLabel: "Contenu défilant",
    loadingLabel: "Chargement",
  },

  dates: {
    monthsAbbreviated: [
      "Janv",
      "Févr",
      "Mars",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Août",
      "Sept",
      "Oct",
      "Nov",
      "Déc",
    ],
    monthsFull: [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ],
    lastUpdatedLabel: "Dernière mise à jour : ",
  },

  filters: {
    // Le filtre « tout afficher » n'est plus identifié par son libellé :
    // `blog-filter.ts` et `work-filter.ts` utilisent une sentinelle et les
    // explorateurs suivent l'index de l'onglet actif. Ce libellé est donc
    // librement traduisible.
    // NOTE : au rendu, le premier onglet affiche `workContent.filters[0]` et
    // `blogContent.categories[0]`, pas cette valeur. Les trois doivent rester
    // cohérentes tant que ce doublon existe.
    allLabel: "Tous",
    categorySeparator: "/",
    blogCategoriesLabel: "Catégories d’articles",
    blogTableOfContentsLabel: "Dans cet article",
    blogSearchLabel: "Rechercher un article",
    blogSearchPlaceholder: "RECHERCHE PAR NOM…",
    blogEmptyLabel: "Aucun article ne correspond à cette recherche.",
    workArchiveLabel: "Archive des projets",
    workSearchLabel: "Rechercher un projet par nom ou par prestation",
    workSearchPlaceholder: "RECHERCHE PAR NOM…",
    workCountSuffix: " projets affichés",
    workEmptyLabel: "Aucun projet ne correspond.",
    workResetLabel: "Réinitialiser les filtres",
  },

  forms: {
    requiredMarker: " *",
  },

  services: {
    priceLabel: "Prix :",
    toggleShowLabel: "Afficher",
    toggleHideLabel: "Masquer",
    toggleSuffix: " le détail",
    /*
     * AUCUN MONTANT DANS CE LIBELLÉ, jamais, et c'est une contrainte d'Eliott
     * avant d'être un choix de mise en page. « Rendez-vous à 3 000 € » se lit
     * comme un prix arrêté pour LE projet, alors que le montant affiché juste
     * au-dessus est un plancher de périmètre. Sa crainte, mot pour mot :
     * « y'a écrit ça sur le site alors que j'suis pas au courant ».
     *
     * Le contexte passe donc par le nom accessible, jamais par l'étiquette :
     * cinq boutons qui disent tous la même chose à l'écran, et cinq noms
     * distincts pour qui navigue au lecteur d'écran ou à la liste des liens.
     */
    rdvLabel: "Prendre rendez-vous",
    rdvAriaPrefix: "Prendre rendez-vous à propos de : ",
  },

  testimonials: {
    // Guillemets DROITS dans le carrousel de la home, courbes sur les pages
    // projet : l'écart vient de la source et se voit à l'écran.
    quoteOpen: "« ",
    quoteClose: " »",
    roleSuffix: " chez",
  },

  work: {
    portfolioLabel: "Portfolio",
    liveProjectLabel: "Projet en ligne",
    backToProjectsLabel: "Retour aux réalisations",
    scopeLabel: "Périmètre de la mission",
    scopeSeparator: "/",
    timelineLabel: "Durée",
    clientLabel: "Client",
    yearLabel: "Année",
    problemTitleLines: ["Le", "problème."],
    resultsLabel: "Les résultats",
    approachLabel: "L’approche",
    playVideoLabel: "Lire la vidéo",
    videoAriaPrefix: "Lire la vidéo du projet ",
    videoAriaSuffix: " sur YouTube",
    videoPosterSuffix: ", aperçu de la vidéo projet",
    testimonialEyebrow: "Témoignage",
    testimonialTitleLines: ["Paroles", "de client."],
    quoteOpen: "« ",
    quoteClose: " »",
    nextProjectLabel: "Projet suivant",
  },
};
