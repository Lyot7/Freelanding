import type { AboutContent } from "@/lib/content/types";

// Les quatre chiffres du template ("60+ projects shipped since 2019",
// "89% business from referrals", "12 industries served", "100% on-time")
// étaient des preuves sociales fabriquées : activité démarrée le 1er juin 2026,
// aucun historique à afficher. La grille reste (le composant attend quatre
// cellules et une valeur numérique par cellule), mais elle porte désormais des
// ENGAGEMENTS tenables au présent, pas un palmarès.
/*
 * CHIFFRES DE CONFIANCE, refaits le 2026-10-16 à la demande d'Eliott : « un
 * projet à la fois » et l'échéancier de paiement ne donnaient aucune raison
 * de lui faire confiance. Chaque chiffre dit maintenant ce que le client y
 * gagne, et chacun se vérifie : le résultat Würth (`stats.ts`), la cession
 * des droits et l'absence d'abonnement (CGV, `offre.ts`), le délai de réponse
 * (`site.ts`).
 */
const aboutStats = [
  { value: "92 %", label: "D’erreurs en moins sur un parcours d’inscription refait chez Würth France" },
  { value: "100 %", label: "Du code, des accès et des données à votre nom" },
  { value: "0 €", label: "D’abonnement imposé pour utiliser ce que je livre" },
  { value: "24 h", label: "Pour répondre à chaque message, en heures ouvrées" },
] as const;

/**
 * Contenu de la page À propos — structure extraite de about.html (archive
 * Framer), texte réécrit en français à la première personne du singulier.
 * NOTE : le corps du template mentionnait "Matter Studio" alors que la marque
 * était « la marque d'origine » (incohérence d'origine). Sans objet ici : le récit ne porte
 * plus de nom de studio.
 *
 * VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott.
 */
export const aboutContent: AboutContent = {
  hero: {
    /* Rendu DANS le H1, avant « À propos. » : c'est lui qui porte la requête
       « développeur freelance Caen » (carte SEO du 2026-10-15, 89 impressions
       en position 5 pour un clic). */
    eyebrow: "Eliott Bouquerel, développeur freelance à Caen",
    title: "À propos.",
    subtitle:
      "Je construis seul les logiciels métier des entreprises qui veulent reprendre leur temps.",
    // Fragments du sous-titre rendus en blanc plein (le reste est atténué).
    subtitleParagraphs: [
      {
        text: "Je construis seul les logiciels métier des entreprises qui veulent reprendre leur temps.",
        emphasis: ["seul", "veulent reprendre leur temps."],
      },
    ],
  },
  // Surtitre du bloc récit et photo, écrits en dur jusqu'ici.
  storyEyebrow: "Pourquoi je travaille comme ça",
  cover: {
    // Le visuel du template montrait des inconnus présentés comme « l'équipe du
    // studio ». Sur la page qui répond à « qui je suis », c'est le portrait
    // d'Eliott qui a sa place.
    //
    // PHOTO NATURELLE depuis le 2026-08-26. Le fichier servi ici était le
    // portrait DÉTOURÉ sur aplat vert : passé au filtre du cadre
    // (`grayscale` + `contraste .75` + `luminosité 1.8`), l'aplat virait à un
    // jaune-vert délavé qui occupait les deux tiers de l'image, et le buste
    // coupé flottait dessus. C'est le plus grand portrait du site : il porte
    // désormais la photo d'origine, en situation, dont le fond gris du ciel et
    // de l'étang tient tout seul en niveaux de gris. Le détourage vert reste
    // employé là où il fonctionne — la vignette ronde, la citation tarifs et le
    // bloc « à propos » de l'accueil.
    src: "/images/eliott-nature-vertical.jpg",
    alt: "Eliott Bouquerel, au bord d’un étang",
  },
  bodyHighlights: ["Je travaille seul, par choix", "n’avoir aucun regret sur ce que j’ai livré"],
  /*
   * RÉCIT RÉORGANISÉ le 2026-10-16 (Eliott : « retravailler les paragraphes
   * pour une meilleure compréhension », trois paragraphes qui se lisent l'un
   * après l'autre). La phrase d'ouverture reste en grand ; suivent ce que je
   * sais faire, pourquoi seul, puis la part invisible du travail. Le bloc
   * « Qui je suis » et son chapô sont fondus dans ces trois paragraphes.
   */
  body: [
    "Je ne vends pas un logiciel. Je vends une contrainte qui disparaît et du temps qui revient. Le recopiage, les factures, les relances : l’IA et le logiciel font le sale boulot, et votre équipe revient à ce qui la rend indispensable, connaître vos clients et décider.",
    "Je commence par regarder comment vous travaillez vraiment : qui saisit quoi, où ça se recopie, ce qui se perd entre deux outils. Un logiciel qui ne suit pas votre façon de faire finit abandonné au profit du tableur. Celui que je construis part de vos documents, de vos mots et de vos cas particuliers.",
    "Je travaille seul, par choix. Dans une agence, votre projet passe d’un commercial à un chef de projet puis à plusieurs métiers, avec des frais qui courent qu’il avance ou non. Avec moi, vous parlez à celui qui conçoit et qui code, du premier appel à la mise en service, et je tiens le projet d’un bout à l’autre.",
    "Il y a une part du travail que vous ne verrez jamais, et c’est la plus importante : l’architecture décidée avant le premier écran, des outils choisis sur ce qu’ils coûteront à faire vivre, des tests passés avant chaque mise en service, des sauvegardes vérifiées, des pannes qui disent pourquoi elles arrivent, du code documenté pour qu’un autre puisse reprendre. Vous achetez de ne jamais avoir à découvrir ces points-là. Ma barre sur chaque projet : n’avoir aucun regret sur ce que j’ai livré.",
  ],
  // Les quatre membres d'équipe du template (Anna Schneider, Jennifer Peterson,
  // Erik Voss, Liam Torres) sont des personas fictifs : ils n'existent pas et
  // Eliott travaille seul. La grille de portraits reste donc VIDE tant qu'il n'y
  // a personne d'autre à montrer — le titre « Qui je suis. » et le chapô
  // « Seul par choix… » suffisent à porter la section.
  team: [],
  stats: aboutStats,
  /* PARCOURS, ajouté le 2026-09-14. Source : profil LinkedIn, CV et Malt,
     relevés le 2026-08-29 (fiche profil du vault). Würth est un STAGE de
     quatre mois en 2024, jamais une alternance : le site l'a déjà publié faux.
     La nature de chaque ligne est une colonne à part entière, ce qui distingue
     employeur et client sans phrase défensive. */
  parcours: {
    eyebrow: "Expérience et formation",
    titleLines: ["Mon", "parcours."],
    groupes: [
      {
        titre: "Expérience",
        etapes: [
          {
            periode: "Depuis juil. 2026",
            structure: "Indépendant",
            lieu: "Normandie, et à distance",
            role: "Développeur full-stack : logiciels métier sur mesure",
            nature: "Freelance",
          },
          {
            periode: "Sept. 2025 à juil. 2026",
            structure: "MECA SERVICES",
            lieu: "Carantilly",
            role: "Développeur full-stack, responsable e-commerce",
            nature: "Alternance",
          },
          {
            periode: "Sept. 2024 à mai 2025",
            structure: "MeilleursBiens",
            lieu: "Courbevoie",
            role: "Développeur web front-end",
            nature: "Alternance",
          },
          {
            periode: "Mars à juin 2024",
            structure: "Würth France",
            lieu: "Erstein",
            role: "Développeur web front-end",
            nature: "Stage",
            href: "/realisations/wurth-creation-de-compte",
          },
          {
            periode: "Avr. à juin 2023",
            structure: "Mediapilote",
            lieu: "Caen",
            role: "Intégration WordPress",
            nature: "Stage",
          },
        ],
      },
      {
        titre: "Formation",
        /* DÉTAILLÉE LE 2026-10-16 à la demande d'Eliott : un profil complet,
           polyvalent et très spécialisé en développement. Le niveau (Bac+5,
           Bac+3) tient la place de la nature. Périodes déduites des stages et
           des alternances ci-dessus (Médiapilote en 2e année de BUT, Würth en
           3e, MeilleursBiens et MECA SERVICES pendant le MBA). */
        etapes: [
          {
            periode: "2024 à 2026",
            structure: "MyDigitalSchool",
            lieu: "En alternance",
            role: "MBA Développeur Full-Stack, diplômé en juillet 2026",
            nature: "Bac+5",
            apport:
              "Le développement approfondi jusqu’à l’architecture et la mise en production, avec ce qu’il faut pour mener un projet et une entreprise.",
            domaines: [
              "Architecture logicielle",
              "DevOps",
              "Gestion de projet",
              "Entrepreneuriat",
              "Marketing",
            ],
          },
          {
            periode: "2021 à 2024",
            structure: "IUT de Saint-Lô",
            lieu: "Saint-Lô",
            role: "BUT MMI, Métiers du multimédia et de l’internet, parcours développement web",
            nature: "Bac+3",
            apport:
              "Le développement au centre, entouré de tout ce qui fait qu’un outil se comprend et donne envie de s’en servir.",
            domaines: [
              "Développement web",
              "Design et ergonomie",
              "Expérience utilisateur",
              "Communication",
              "Storytelling",
              "Infographie",
              "Photo et vidéo",
            ],
          },
        ],
      },
    ],
  },
  // `testimonial` ABSENT depuis le 2026-09-01. Il portait « Sophie Andersen »,
  // persona du template supprimé de `testimonials.ts` : le champ est optionnel,
  // et le bloc de la page est de toute façon gardé par `siteFeatures.testimonials`.
  seo: {
    // Séparateur et marque alignés sur `siteConfig.meta.titleTemplate`
    // (« %s · Eliott Bouquerel ») : ces titres sont posés en `absolute`, le
    // gabarit ne s'applique donc pas et la marque doit être écrite ici. C'est
    // exactement pourquoi le « ® » y avait survécu au retrait du 2026-08-29 :
    // `brand.mark` ne passe pas par là.
    title: "Eliott Bouquerel, développeur freelance à Caen",
    description:
      "Développeur full stack freelance à Caen, et partout en France à distance. Je construis les logiciels métier qui rendent des heures aux entreprises.",
  },
};

/**
 * Texte alternatif du portrait en fond du héros de `/a-propos`. La photo est
 * le sujet de la page (« qui je suis ») : elle se décrit.
 */
export const aboutHeroImageAlt =
  "Eliott Bouquerel, développeur web freelance, au bord d’un lac au crépuscule";
