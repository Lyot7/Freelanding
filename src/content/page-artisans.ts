/**
 * PAGE `/services/site-vitrine/artisans` : le site internet d'un artisan.
 *
 * REQUÊTE VISÉE : « création site internet artisan » (+ site vitrine artisan,
 * +250 % sur 12 mois dans Google Trends), intention commerciale. Devant :
 * comdartisans.fr, petitefabrik.fr, capeb.fr. Aucun ne s'appuie sur des
 * chiffres relevés chez les artisans eux-mêmes.
 *
 * L'ÉLÉMENT PROPRE À LA PAGE : les chiffres de l'étude d'Eliott sur 4 895
 * fiches Google Maps d'artisans normands (article
 * `etat-des-sites-des-entreprises-normandes-2026`), et la page lue avec les
 * questions du client sur son téléphone.
 *
 * « DEUX FOIS MOINS » EST EXACT ICI, et seulement pour le site : la médiane
 * d'agence vient de `repereAgenceSite`, le plancher d'`offre.ts`.
 */
import { aPartirDe, euros, prestation, prixPlancher, repereAgenceSite } from "./offre";
import { CHEMIN_ARTISANS, nombre, pourcent, type PageTheme } from "./page-theme";
import { CHEMIN_PAGE_CAEN } from "./page-caen";
import { CHEMIN_PRIX_SITE } from "./page-prix-site";

const VITRINE = prestation("vitrine");
const CHEMIN_PILIER = `/services/${VITRINE.slug}`;
const CHEMIN_ETUDE = "/blog/etat-des-sites-des-entreprises-normandes-2026";
const AGENCE = repereAgenceSite;

/* LES CHIFFRES DE L'ÉTUDE, ligne « Artisans » du tableau par secteur. */
const ETUDE_FICHES = 4895;
const ETUDE_SANS_SITE = 31.52;
const ETUDE_SANS_SITE_PROPRE = 35.57;
const ETUDE_VILLES = 35;

/*
 * HYPOTHÈSES DU CALCUL : un chantier moyen de 3 500 € HT, 30 % de marge. Le
 * nombre de chantiers qui paient le site se calcule depuis le plancher.
 */
const CHANTIER_MOYEN = 3500;
const TAUX_MARGE = 0.3;
const MARGE_CHANTIER = Math.round(CHANTIER_MOYEN * TAUX_MARGE);
const CHANTIERS_POUR_PAYER = Math.ceil(VITRINE.plancher / MARGE_CHANTIER);

/** Exposé pour le test, qui vérifie que le texte suit les hypothèses. */
export const calculArtisans = {
  margeChantier: MARGE_CHANTIER,
  chantiersPourPayer: CHANTIERS_POUR_PAYER,
} as const;

export const pageArtisans: PageTheme = {
  id: "artisans",
  chemin: CHEMIN_ARTISANS,
  seo: {
    titre: "Création de site internet pour artisan · Eliott Bouquerel",
    description: `Création de site internet pour artisan : zone d’intervention, chantiers en photos, numéro qui appelle d’un geste. Textes compris, ${aPartirDe(VITRINE, " HT")}.`,
  },
  h1: "Site internet pour artisans",
  resume: `Votre site doit faire une chose : qu’un client qui cherche votre métier dans sa commune vous appelle, vous plutôt qu’un autre. Je le conçois, je l’écris et je le code avec le soin d’une agence, ${aPartirDe(VITRINE, " HT")}, prix fixé au devis.`,
  prestation: "vitrine",
  offre: VITRINE,
  filAriane: [
    { libelle: "Accueil", href: "/" },
    { libelle: "Prestations", href: "/#services" },
    { libelle: VITRINE.nom, href: CHEMIN_PILIER },
    { libelle: "Artisans" },
  ],
  libelleLien: "site internet pour artisans",
  accroche: "Zone d’intervention, chantiers en photos, appel en un geste.",
  noteLlms:
    "création de site internet pour artisans du bâtiment et du dépannage : zone d’intervention, réalisations, demandes de devis",
  blocs: [
    {
      type: "chiffres",
      id: "etude",
      titre: "En Normandie, un artisan sur trois n’a pas de site à lui",
      paragraphes: [
        `En juillet 2026, j’ai relevé les fiches Google Maps de ${nombre(ETUDE_FICHES)} artisans dans ${ETUDE_VILLES} villes normandes. ${pourcent(ETUDE_SANS_SITE)} n’indiquent aucun site, et ${pourcent(ETUDE_SANS_SITE_PROPRE)} n’ont pas de site à leur nom : rien, ou une page de réseau social.`,
        "Pour votre client, une fiche sans site laisse ses questions sans réponse : intervenez-vous chez lui, pour ce travail-là, et dans quel délai ? Il appelle l’artisan dont le site y répond.",
      ],
      chiffres: [
        { valeur: nombre(ETUDE_FICHES), libelle: "fiches d’artisans relevées en Normandie" },
        { valeur: pourcent(ETUDE_SANS_SITE), libelle: "sans aucun site indiqué" },
        { valeur: pourcent(ETUDE_SANS_SITE_PROPRE), libelle: "sans site à leur nom" },
      ],
      source: {
        libelle: "L’étude complète, méthode comprise",
        href: CHEMIN_ETUDE,
        description: `${nombre(25736)} fiches normandes, onze secteurs, cinq départements.`,
      },
    },
    {
      type: "tableau",
      id: "questions",
      titre: "Ce que votre client cherche sur son téléphone",
      paragraphes: [
        "Votre client vous cherche souvent depuis son téléphone, devant la fuite ou le mur fissuré. La page répond à ses questions dans l’ordre où il se les pose.",
      ],
      legende: "Les questions d’un client qui cherche un artisan, et ce que la page lui montre",
      colonnes: ["Sa question", "Ce que la page lui montre"],
      lignes: [
        [
          "Intervenez-vous chez moi ?",
          "Votre zone d’intervention, commune par commune, dès le haut de la page",
        ],
        [
          "Faites-vous ce travail-là ?",
          "Une page par prestation, dépannage, rénovation ou installation, dans les mots de vos clients",
        ],
        [
          "Est-ce du travail soigné ?",
          "Vos chantiers en photos avant et après, avec la commune et l’année",
        ],
        [
          "Puis-je vous faire confiance ?",
          "Vos qualifications et assurances quand vous en avez, comme RGE, Qualibat ou la décennale, et vos avis Google",
        ],
        [
          "Quand pouvez-vous passer ?",
          "Votre délai habituel de rappel et de devis, écrit noir sur blanc",
        ],
        [
          "Comment vous joindre tout de suite ?",
          "Le numéro qui appelle d’un geste, et un formulaire qui accepte la photo du problème",
        ],
      ],
    },
    {
      type: "section",
      id: "calcul",
      titre: `${CHANTIERS_POUR_PAYER} chantiers paient le site`,
      paragraphes: [
        `Prenons un chantier moyen à ${euros(CHANTIER_MOYEN)} HT, avec ${Math.round(TAUX_MARGE * 100)} % de marge : ${euros(MARGE_CHANTIER)} par chantier. Au plancher de ${prixPlancher(VITRINE)} HT, ${CHANTIERS_POUR_PAYER} chantiers venus du site l’ont remboursé. Les suivants sont du chiffre d’affaires en plus, pendant des années.`,
        `${AGENCE.source.nom} relève une médiane de ${euros(AGENCE.mediane)} pour un site de PME en agence, sur ${nombre(AGENCE.projets)} projets (${AGENCE.source.releve}). Sans structure ni chef de projet à payer, je demande environ deux fois moins pour le même soin.`,
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Le site vitrine en détail",
            href: CHEMIN_PILIER,
            description: "Ce qui est compris, et ce qui fait varier le prix.",
          },
          {
            libelle: "Le prix d’un site internet",
            href: CHEMIN_PRIX_SITE,
            description: "Ce que paie chaque euro, poste par poste.",
          },
          {
            libelle: "Création de site internet à Caen",
            href: CHEMIN_PAGE_CAEN,
            description: "Pour les artisans du Calvados, de la Manche et de l’Orne.",
          },
        ],
      },
      points: [
        {
          titre: `Hypothèse 1 : ${euros(CHANTIER_MOYEN)} HT par chantier`,
          corps:
            "Un dépannage rapporte moins, une rénovation de salle de bains bien plus. Mettez votre panier moyen.",
        },
        {
          titre: `Hypothèse 2 : ${Math.round(TAUX_MARGE * 100)} % de marge`,
          corps:
            "Ce qui reste une fois payés les matériaux, les heures et le véhicule.",
        },
        {
          titre: "Vos textes écrits pour vous",
          corps:
            "Je pars des mots que tapent vos clients et je les écris. Vous relisez, vous corrigez ce qui ne vous ressemble pas.",
        },
        {
          titre: "Le site est à vous",
          corps:
            "Nom de domaine et hébergement à votre nom, sans abonnement pour continuer à l’utiliser.",
        },
      ],
    },
  ],
  titreOffre: "Prix d’un site d’artisan : ce qui le fait varier",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Votre site", "d’artisan."],
    items: [
      {
        question: "Combien coûte un site internet pour un artisan ?",
        answer: `Le site démarre à ${prixPlancher(VITRINE)} HT, textes et photos compris. Le prix monte avec le nombre de pages, par exemple une page par prestation ou par ville, et se fixe au devis. En agence, ${AGENCE.source.nom} relève entre ${euros(AGENCE.soigneMin)} et ${euros(AGENCE.soigneMax)} pour un site vitrine de PME soigné (${AGENCE.source.releve}).`,
      },
      {
        question: "J’ai déjà une page Facebook, est-ce suffisant ?",
        answer:
          "Elle aide vos clients actuels à suivre vos chantiers. Pour être trouvé par un nouveau client sur Google, un site à votre nom fait mieux : il se relie à votre fiche, vous en choisissez le contenu, et personne ne peut le fermer à votre place.",
      },
      {
        question: "Je n’ai pas le temps d’écrire les textes.",
        answer:
          "Je les écris. Un appel en visio pour comprendre votre métier, vos chantiers et votre zone, puis vous relisez.",
      },
      {
        question: "Et ma fiche Google ?",
        answer:
          "Le site se relie à votre fiche Google, qui pèse lourd dans les recherches locales. La remettre d’aplomb, catégories, photos et réponses aux avis, se fait en plus, sur devis.",
      },
    ],
  },
};
