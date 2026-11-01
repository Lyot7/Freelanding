import type { SiteConfig } from "@/lib/content/types";
import { lienRendezVous, rendezVousContent } from "@/content/rendez-vous";

/**
 * Configuration globale du site.
 *
 * La structure vient de l'archive Framer reconstruite à l'identique ; les textes
 * sont ceux d'Eliott, en français et à la première personne.
 *
 * ⚠️ Valeurs à confirmer avant mise en ligne (elles sont volontairement
 * reconnaissables, jamais inventées de façon plausible) :
 * - `contact.phone` : vide tant qu'Eliott n'a pas tranché s'il publie un numéro.
 * - `contact.email` : dépend du domaine retenu.
 * - `socials` : seul le compte GitHub est vérifié.
 * - `credits.createdByAvatar` : photo héritée du template.
 */
export const siteConfig: SiteConfig = {
  // `mark` VIDE depuis le 2026-08-29, et ce n'est pas un oubli. Le « ® »
  // affirme une marque DEPOSEE. Sans depot INPI, c'est une allegation sur les
  // droits du professionnel, attaquable au titre des articles L121-2 et L121-5
  // du code de la consommation, qui visent aussi les pratiques trompeuses
  // entre professionnels. Le « ™ » a ete ecarte volontairement : il n'a aucune
  // valeur en droit francais et ne fait qu'importer une convention americaine.
  //
  // Le champ reste dans le type : un depot le remplirait en une ligne. Tous les
  // points d'appel concatenent `name + mark`, une chaine vide n'y casse rien.
  brand: { name: "Bouquerel", mark: "", given: "Eliott" },
  /*
   * UNE SEULE OFFRE DEPUIS LE 2026-10-31 : la baseline du logotype est lue sur
   * toutes les pages. LE FRAGMENT DOIT EXISTER DANS `tagline`, sinon `Header`
   * concatène le texte entier et le fragment introuvable.
   */
  tagline: "Logiciel sur mesure et IA",
  taglineEmphasis: ["Logiciel sur mesure"],
  nav: [
    { label: "Comment", href: "/#moyens" },
    { label: "Réalisations", href: "/realisations" },
    { label: "À propos", href: "/a-propos" },
    { label: "Blog", href: "/blog" },
  ],
  // Panneau du menu flottant — ordre source, différent de la nav d'en-tête et
  // de la colonne « Navigation » du pied de page (qui, elle, contient « 404 »).
  menuNav: [
    { label: "Accueil", href: "/" },
    { label: "Réalisations", href: "/realisations" },
    { label: "À propos", href: "/a-propos" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  /*
   * « RÉSERVER UN APPEL » depuis le 2026-09-24 (phase C) : un seul libellé
   * pour le rendez-vous sur tout le site. « Démarrer un projet » menait déjà au
   * même endroit, sujet « découverte », sous un autre nom que le bouton du
   * héros, de l'accordéon et des pages de prestation : le visiteur pouvait y
   * lire deux actions. Écrire reste possible par « Contact » dans le menu et
   * par « Poser une question » sous la FAQ.
   *
   * `shortLabel` ne sort que sous 390 px, où le libellé complet pousse le
   * bouton hors de l'écran.
   */
  primaryCta: {
    label: "RÉSERVER UN APPEL",
    shortLabel: "RÉSERVER",
    href: lienRendezVous("logiciel"),
  },
  contact: {
    // Domaine arrêté : eliottbouquerel.fr (site servi sur
    // https://www.eliottbouquerel.fr). Adresse de contact publiée, reprise
    // telle quelle par le footer, la page contact, les liens `mailto:`, le
    // JSON-LD et les pages légales.
    email: "contact@eliottbouquerel.fr",
    // ARRÊTÉ le 2026-08-28. Ce champ est resté vide longtemps, par prudence.
    // C'était une erreur sur cette cible : l'offre s'adresse à des artisans et
    // des commerçants qui appellent plutôt qu'ils n'écrivent, et une entreprise
    // sans numéro visible se lit comme une entreprise qui n'existe pas. Son
    // absence bloquait aussi la fiche Google Business Profile, qui exige un
    // numéro, donc tout le référencement local — celui-là même qui fait partie
    // de l'offre vendue ici.
    //
    // Écrit au format français, groupé par deux : c'est ce qui s'affiche. Les
    // liens `tel:` en retirent les espaces, et le JSON-LD le republie au format
    // international E.164 (conversion dans `@/lib/json-ld`).
    phone: "06 32 21 37 11",
    // LES TROIS DÉPARTEMENTS, PAS « NORMANDIE ». Alignement NAP du 2026-09-08 :
    // la fiche Google d'Eliott déclare exactement Calvados, Manche et Orne
    // comme zones desservies. Un moteur recoupe le site et la fiche pour
    // décider qu'il s'agit de la même entité ; « Normandie » d'un côté et trois
    // départements de l'autre, c'est un écart qu'il faut lui faire résoudre
    // alors qu'on peut le lui épargner. Les trois noms sont par ailleurs les
    // mots que les gens tapent, là où « Normandie » ne se cherche pas.
    //
    // Le reste de la France suit, à distance, sans se restreindre à une région :
    // c'est le fond de l'activité, et `areaServed` en fait une zone à part
    // entière dans le JSON-LD.
    address: "Calvados, Manche, Orne et France à distance",
    addressLabel: "Zone d’intervention",
    hours: ["Lun. au ven. : 9 h à 18 h"],
    // PAS DE LIENS SEO DANS LE PIED DE PAGE (décision d'Eliott du 2026-10-15) :
    // lister les pages Caen, prix et thématiques sous la zone d'intervention se
    // lisait comme du remplissage pour Google. Elles restent reliées depuis leur
    // pilier (`lienLocalParPrestation`) et entre elles.
    responseTime:
      "Je réponds à chaque message sous 24 h ouvrées.",
    responseTimeLabel: "Délai de réponse",
    localTimeLabel: "Heure locale",
    timezone: "Europe/Paris",
    // Interlocuteur mis en avant dans le pied de page : Eliott, qui est seul.
    person: {
      name: "Eliott Bouquerel",
      role: "Développeur à Caen",
      note: "C’est moi qui lis votre message, et moi qui vous réponds.",
      // Portrait réel, lu par les données structurées (`Person.image`).
      avatar: {
        src: "/images/eliott-bouquerel-avatar.jpg",
        alt: "",
        width: 400,
        height: 400,
      },
    },
  },
  /*
   * Colonne « Navigation » du pied de page.
   *
   * « 404 » A ÉTÉ RETIRÉ le 2026-09-01. Le template exposait sa page d'erreur
   * dans son propre pied de page, un clin d'œil de studio qui se montre. Sur un
   * site qui vend une prestation, c'est un lien vers une page d'erreur offert à
   * un visiteur venu chercher un prestataire : au mieux il ne le clique pas, au
   * pire il en tire la seule conclusion possible, que quelque chose est cassé.
   * La page existe toujours et reste servie sur une URL inconnue, elle n'est
   * simplement plus annoncée.
   */
  footerNav: [
    { label: "Accueil", href: "/" },
    { label: "Réalisations", href: "/realisations" },
    { label: "À propos", href: "/a-propos" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  /*
   * RÉSEAUX DU PIED DE PAGE.
   *
   * RÈGLE : aucune URL n'est devinée. Un lien social mort dans un pied de page
   * est exactement le genre de détail qui coûte la crédibilité que le reste de
   * la page essaie de construire. Chaque entrée ci-dessous a une source.
   *
   * L'ORDRE EST INTENTIONNEL : la preuve technique d'abord, le professionnel
   * ensuite, l'humain en dernier. Il se lit de gauche à droite dans le pied de
   * page.
   */
  socials: [
    { label: "GitHub", href: "https://github.com/Lyot7", external: true },
    {
      // PROFIL PERSONNEL, donné par Eliott le 2026-08-27. Il remplace la page
      // entreprise (`/company/eliott-bouquerel`), qui était la seule URL
      // attestée jusque-là. Sur le pied de page d'un indépendant, c'est le
      // profil qu'on attend : la page entreprise d'un solo renvoie une image de
      // structure qu'il n'a pas, et elle est moins vivante.
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/eliott-bouquerel",
      external: true,
    },
    {
      // Donné par Eliott le 2026-08-27. Un profil Strava porte un identifiant
      // numérique, jamais un nom : il ne se déduit d'aucune convention et il ne
      // se devine pas.
      //
      // POURQUOI IL EST LÀ, alors que c'est un site professionnel : justement
      // parce que ce n'en est pas un signe. Le reste de la page vend de la
      // méthode, des garanties et des dates ; il manque une preuve qu'il y a
      // quelqu'un derrière. Un lien qui ne sert à rien commercialement est
      // précisément celui qui le prouve.
      label: "Strava",
      href: "https://www.strava.com/athletes/164480283",
      external: true,
    },
  ],
  // Les formes courtes ne sont utilisées QUE dans le pied de page, où les trois
  // liens partagent une seule ligne. Les pages elles-mêmes, le menu flottant et
  // la mention du formulaire gardent les intitulés complets.
  legalLinks: [
    /* UN SEUL LIEN VERS LE HUB, pour Google : une page sans lien entrant ne s'indexe pas. */
    { label: "Par besoin", href: "/logiciel-metier" },
    { label: "Mentions légales", shortLabel: "Mentions légales", href: "/legal/mentions-legales" },
    {
      label: "Politique de confidentialité",
      shortLabel: "Confidentialité",
      href: "/legal/politique-de-confidentialite",
    },
    {
      label: "Conditions générales de vente",
      // CGV plutôt que CGU : le document régit une prestation vendue, pas
      // l'usage du site. Le titre complet est celui de la page ; le pied de
      // page, lui, n'a de place que pour le sigle.
      shortLabel: "CGV",
      href: "/legal/conditions-generales-de-vente",
    },
  ],
  copyright: "2026©",
  copyrightLong: "© 2026 Eliott Bouquerel",
  // Titres des deux colonnes du pied de page (habillage, pas de l'éditorial).
  footerColumnLabels: { contact: "Contact", navigation: "Navigation" },
  footerCta: {
    heading: "Montrez-moi ce qui vous bloque.",
    lettre: {
      portrait: { src: "/images/eliott-nature-vertical.jpg", alt: "Eliott Bouquerel, en extérieur" },
      texte:
        "Dites-moi quelle tâche vous prend le plus de temps. Je vous réponds moi-même sous 24 h ouvrées, et si je ne suis pas la bonne personne, je vous le dis.",
      signataire: "Eliott Bouquerel, développeur à Caen",
    },
    /*
     * LA PHRASE DISCRÈTE, décision d'Eliott du 2026-10-30 : une seule offre,
     * « en restant ouvert aux propositions ». Pas de bloc d'offre : une autre
     * demande se dit ici, sur toutes les pages, et nulle part ailleurs.
     */
    subtext:
      "Une tâche à faire disparaître : écrivez-moi deux lignes, ou réservez un appel en visio. Une autre demande ? Dites-la quand même, je vous réponds franchement.",
    subtextEmphasis: ["réservez un appel en visio."],
  },
  footerForm: {
    modes: {
      label: "Comment me contacter",
      message: { titre: "Deux lignes par écrit", detail: "Réponse sous 24 h ouvrées" },
      rendezVous: {
        titre: "30 minutes en visio",
        prochain: "Prochain créneau :",
        promesse: "Vous repartez avec un ordre de grandeur et une prochaine étape.",
      },
    },
    messageLabel: "La tâche qui vous prend du temps, en deux lignes",
    messagePlaceholder: "Chaque semaine, je recopie les commandes dans un tableur.",
    emailLabel: "Votre adresse e-mail",
    emailPlaceholder: "exemple@email.com",
    nameLabel: "Nom",
    namePlaceholder: "Alex Dupont",
    /* LE FORMULAIRE NE LES DEMANDE PLUS depuis le 2026-11-01 : le serveur les
       accepte encore, un onglet resté ouvert les envoie. */
    selectOptions: [
      "Un logiciel métier",
      "Je ne sais pas encore",
      "Une autre demande",
    ],
    /* Facultatifs, repliés : le site promet deux lignes, pas un questionnaire. */
    precisions: {
      ouvrir: "Ajouter un budget ou une échéance",
      budget: {
        label: rendezVousContent.questionnaire.budget.legende,
        placeholder: "Choisissez une tranche",
      },
      echeance: {
        label: rendezVousContent.questionnaire.echeance.legende,
        placeholder: "Choisissez une échéance",
      },
    },
    delaiReponse: "Réponse sous 24 h ouvrées.",
    submitLabel: "Envoyer à Eliott",
    disclaimer:
      "En envoyant ce formulaire, vous acceptez mes conditions générales et ma politique de confidentialité.",
    // Le texte est rendu en trois morceaux autour de ses deux liens.
    disclaimerPrefix: "En envoyant ce formulaire, vous acceptez mes ",
    disclaimerJoiner: "et ma ",
    disclaimerSuffix: ".",
    disclaimerLinks: [
      {
        label: "conditions générales",
        href: "/legal/conditions-generales-de-vente",
      },
      {
        label: "politique de confidentialité",
        href: "/legal/politique-de-confidentialite",
      },
    ],
  },
  // La source distingue la casse du bouton flottant de celle de la nav.
  floatingCta: { label: "Réserver un appel", href: lienRendezVous("logiciel") },
  meta: {
    // « ® » RETIRÉ DES TITRES le 2026-09-01. Le symbole avait été vidé de
    // `brand.mark` le 2026-08-29 pour la raison écrite en tête de ce fichier :
    // sans dépôt INPI, il affirme une marque déposée qui n'existe pas. Il avait
    // SURVÉCU ici, dans les seules chaînes que `brand.mark` ne traverse pas,
    // c'est à dire les titres écrits à la main. Ce sont pourtant les plus
    // exposées de tout le site : elles sortent dans l'onglet du navigateur et
    // dans chaque résultat Google, là où la fausse allégation se lit le plus.
    // Le retrait n'était donc pas fait, il était seulement invisible à l'écran.
    defaultTitle: "Eliott Bouquerel · Logiciel métier sur mesure",
    // GABARIT DOCUMENTAIRE, plus branché sur `Metadata` depuis le
    // 2026-08-28 : toutes les pages posent leur titre en `absolute`
    // (`pageMetadata`), et le laisser déclaré dans le layout faisait écrire la
    // marque DEUX FOIS sur les deux 404. Il reste ici comme convention de
    // séparateur, celle que suivent les titres écrits à la main.
    titleTemplate: "%s · Eliott Bouquerel",
    description:
      "Le logiciel métier qui fait disparaître la tâche qui vous bloque. L’IA fait le sale boulot, votre équipe reprend son temps. Basé à Caen, en visio partout en France.",
    ogImage: {
      src: "/images/og.jpg",
      alt: "Eliott Bouquerel",
    },
    locale: "fr_FR",
  },
};
