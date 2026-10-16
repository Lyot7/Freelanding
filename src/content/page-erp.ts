/**
 * PAGE `/services/logiciel-metier/erp-sur-mesure` : l'ERP sur mesure pour PME.
 *
 * REQUÊTE VISÉE : « erp sur mesure » (+ logiciel erp sur mesure, création erp
 * sur mesure), intention commerciale, devant : nocodefactory.fr,
 * digitalunicorn.fr, lonestone.io/solutions/creation-erp. Aucun ne montre ce
 * que devient une commande dans l'outil, ni ne dit quand prendre un progiciel.
 *
 * L'ÉLÉMENT PROPRE À LA PAGE : le trajet d'une commande, du devis à
 * l'encaissement, avec ce qui passe d'une étape à l'autre ; puis un tableau
 * progiciel, sur mesure, les deux. Aucune autre page du site ne les porte.
 *
 * Aucun client ERP n'est cité : Eliott n'en a pas. Würth France est présenté
 * pour ce qu'il est, un parcours de création de compte dans la distribution.
 */
import { aPartirDe, euros, prestation, prixPlancher, repereAgenceLogiciel } from "./offre";
import { CHEMIN_ERP, type PageTheme } from "./page-theme";
import { CHEMIN_PRIX_LOGICIEL } from "./pages-secteur";

const LOGICIEL = prestation("logiciel");
const CHEMIN_PILIER = `/services/${LOGICIEL.slug}`;
const AGENCE = repereAgenceLogiciel;

export const pageErp: PageTheme = {
  id: "erp-sur-mesure",
  chemin: CHEMIN_ERP,
  seo: {
    titre: "ERP sur mesure pour PME · Eliott Bouquerel",
    description: `ERP sur mesure pour votre PME : devis, commandes, stock, fabrication et factures dans un seul outil, construit module par module, ${aPartirDe(LOGICIEL, " HT")}.`,
  },
  h1: "ERP sur mesure",
  resume: `Un ERP sur mesure relie vos devis, vos commandes, votre stock, votre production et vos factures dans un seul outil, avec vos règles. Je le construis module par module, en commençant par celui qui vous coûte le plus d’heures. Le premier module démarre ${aPartirDe(LOGICIEL, " HT")}, prix fixé au devis.`,
  prestation: "logiciel",
  offre: LOGICIEL,
  filAriane: [
    { libelle: "Accueil", href: "/" },
    { libelle: "Prestations", href: "/#services" },
    { libelle: LOGICIEL.nom, href: CHEMIN_PILIER },
    { libelle: "ERP sur mesure" },
  ],
  libelleLien: "ERP sur mesure",
  accroche: "Devis, commandes, stock et factures reliés dans un seul outil.",
  noteLlms:
    "ERP sur mesure pour PME, construit module par module : devis, commandes, stock, fabrication, facturation, relances",
  blocs: [
    {
      type: "section",
      id: "symptomes",
      titre: "Cinq outils pour une commande, et vos équipes au milieu",
      paragraphes: [
        "Une PME qui grandit empile ses outils : un logiciel de devis, un tableur de stock, un planning d’atelier, le logiciel du comptable. Chacun fait bien son travail. Entre eux, ce sont vos équipes qui recopient.",
        "Un ERP sur mesure devient le référentiel unique de l’entreprise : un article, un client, une commande n’y existent qu’une fois, et les outils que vous gardez lisent la même donnée.",
      ],
      points: [
        {
          titre: "Le stock du tableur se trompe",
          corps:
            "Une sortie oubliée le vendredi, et le commercial vend le lundi une pièce qui n’est plus en rayon.",
        },
        {
          titre: "Les reliquats se perdent",
          corps:
            "Une commande livrée en deux fois, et le second bon de livraison n’est jamais facturé.",
        },
        {
          titre: "La marge se calcule à la main",
          corps:
            "Les prix d’achat dans un fichier, les prix de vente dans un autre, les remises au cas par cas : la marge réelle par client se découvre au bilan.",
        },
        {
          titre: "Une seule personne sait",
          corps:
            "Le fichier de suivi tient grâce à celle qui l’a construit. Quand elle part en congés, le suivi s’arrête avec elle.",
        },
      ],
    },
    {
      type: "etapes",
      id: "trajet",
      titre: "Le trajet d’une commande dans votre ERP",
      paragraphes: [
        "Voici ce que l’outil fait d’une commande, de la demande du client à l’encaissement. Chaque information est saisie une fois, puis reprise par l’étape suivante.",
      ],
      etapes: [
        {
          titre: "Devis",
          corps:
            "Le devis part de votre catalogue, avec vos tarifs, les remises négociées par client et ses conditions de paiement.",
          passe: "Les lignes, le client, le délai promis.",
        },
        {
          titre: "Commande",
          corps:
            "Le devis accepté devient une commande en un clic. Le stock disponible est réservé, et ce qui manque part en besoin d’achat.",
          passe: "Les quantités réservées, les achats à lancer.",
        },
        {
          titre: "Fabrication ou préparation",
          corps:
            "Si vous fabriquez, l’ordre de fabrication reprend la nomenclature et la gamme de l’article. Sinon, la liste de préparation sort, triée par emplacement.",
          passe: "Les quantités produites ou préparées, le temps passé.",
        },
        {
          titre: "Livraison",
          corps:
            "Le bon de livraison se génère depuis la commande. Une livraison partielle laisse un reliquat visible, qui attend son départ.",
          passe: "Les quantités livrées, le reliquat.",
        },
        {
          titre: "Facture",
          corps:
            "La facture reprend ce qui a été livré, pas ce qui a été commandé. Un avoir se rattache à sa facture d’origine.",
          passe: "Le montant dû, l’échéance.",
        },
        {
          titre: "Encaissement et relance",
          corps:
            "Les échéances dépassées remontent seules, et la relance part avec la bonne facture jointe. Vous lisez votre trésorerie sans attendre le bilan du comptable.",
        },
      ],
    },
    {
      type: "tableau",
      id: "choix",
      titre: "Progiciel, sur mesure, ou les deux",
      paragraphes: [
        "Les ERP du marché couvrent la plupart des métiers, avec un abonnement par utilisateur. Le sur mesure se justifie quand votre façon de travailler fait votre marge et qu’aucun paramétrage ne la reproduit.",
      ],
      legende: "Un ERP du marché, un ERP sur mesure et une solution mixte, critère par critère",
      colonnes: ["Critère", "ERP du marché", "ERP sur mesure", "Les deux"],
      lignes: [
        [
          "Mise en route",
          "Rapide si votre métier tient dans ses écrans",
          "Un module à la fois, le plus coûteux en heures d’abord",
          "Le progiciel pour le standard, un module pour le reste",
        ],
        [
          "Vos règles métier",
          "Adaptées au logiciel, ou développées par un intégrateur",
          "Écrites telles que vous les appliquez",
          "Le cas particulier sort du progiciel et vit à côté",
        ],
        [
          "Coût dans le temps",
          "Un abonnement par utilisateur, qui monte avec l’équipe",
          "Payé une fois, puis un suivi mensuel",
          "L’abonnement, plus un développement ciblé",
        ],
        [
          "Propriété",
          "L’outil reste à l’éditeur",
          "Code et base vous appartiennent",
          "Le progiciel à l’éditeur, le module à vous",
        ],
        [
          "Si le prestataire s’arrête",
          "L’éditeur continue",
          "Le code documenté est dans votre dépôt : un autre développeur reprend",
          "Chacun reprend sa partie",
        ],
      ],
      note: `Pour situer le prix : ${AGENCE.source.nom} relève qu’en agence, un premier outil démarre entre ${euros(AGENCE.premierOutilMin)} et ${euros(AGENCE.premierOutilMax)} (${AGENCE.source.releve}). Chez moi, un premier module démarre à ${prixPlancher(LOGICIEL)} HT.`,
      liens: {
        titre: "Pour trancher",
        items: [
          {
            libelle: "Logiciel sur mesure ou Odoo",
            href: "/blog/logiciel-sur-mesure-ou-odoo",
            description: "Le comparatif avec l’ERP le plus cité par les PME.",
          },
        ],
      },
    },
    {
      type: "section",
      id: "methode",
      titre: "Un ERP qui se construit par morceaux",
      paragraphes: [
        "Un ERP livré d’un bloc après un an de travail arrive souvent décalé de l’entreprise qu’il devait servir. Je commence par le module qui vous coûte le plus d’heures, vos équipes s’en servent, et le suivant s’appuie sur la même base.",
        "Avant chaque module, je relève où l’information se perd. Chez Würth France, sur le parcours de création de compte de l’eShop professionnel, ce relevé a mené à −92 % d’erreurs, mesuré en interne.",
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "La Solution métier en détail",
            href: CHEMIN_PILIER,
            description: "Ce qui est compris, et ce qui fait varier le prix.",
          },
          {
            libelle: "Le prix d’un logiciel sur mesure",
            href: CHEMIN_PRIX_LOGICIEL,
            description: "Ce qui fait monter le devis, poste par poste.",
          },
          {
            libelle: "Le projet Würth France",
            href: "/realisations/wurth-creation-de-compte",
            description: "Un parcours refait à partir des erreurs relevées.",
          },
        ],
      },
      points: [
        {
          titre: "Votre historique repris",
          corps:
            "Clients, articles, commandes passées : la reprise se prépare dès le premier module, pour démarrer avec vos données.",
        },
        {
          titre: "Des droits par rôle",
          corps:
            "Le commercial voit ses clients, l’atelier ses ordres de fabrication, la direction l’ensemble.",
        },
        {
          titre: "Relié à ce que vous gardez",
          corps:
            "Le logiciel du comptable, la banque, la boutique en ligne : l’ERP leur envoie et en reçoit les données, sans ressaisie.",
        },
        {
          titre: "Vos données sortent quand vous voulez",
          corps:
            "Tout ce que contient l’ERP s’exporte en fichier, à tout moment, sans passer par moi.",
        },
      ],
    },
  ],
  titreOffre: "Prix d’un ERP sur mesure : le premier module",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Votre ERP", "sur mesure."],
    items: [
      {
        question: "Combien coûte un ERP sur mesure ?",
        answer: `Le premier module démarre à ${prixPlancher(LOGICIEL)} HT. Le total dépend du nombre de modules, des outils à relier et de la reprise de votre historique, et se fixe au devis. Pour comparer, ${AGENCE.source.nom} relève qu’en agence, un premier outil démarre entre ${euros(AGENCE.premierOutilMin)} et ${euros(AGENCE.premierOutilMax)} (${AGENCE.source.releve}).`,
      },
      {
        question: "Faut-il remplacer tous nos logiciels ?",
        answer:
          "Gardez ce qui marche, comme la paie ou le logiciel du comptable. L’ERP sur mesure prend la place des tableurs et des ressaisies, et se branche sur le reste.",
      },
      {
        question: "Odoo ou un ERP sur mesure ?",
        answer:
          "Si Odoo couvre votre métier avec un paramétrage raisonnable, prenez Odoo. Le sur mesure se justifie quand les développements spécifiques à commander dans Odoo coûtent plus qu’un outil construit pour vous, ou quand vos règles changent souvent.",
      },
      {
        question: "Avez-vous déjà construit un ERP ?",
        answer:
          "Pas sous ce nom. Mes projets touchent les mêmes briques : comptes clients, catalogue, commandes, droits. Chez Würth France, j’ai refait le parcours de création de compte de l’eShop réservé aux professionnels. Le détail est sur la page Réalisations.",
      },
      {
        question: "Que devient l’ERP si vous arrêtez ?",
        answer:
          "Le code et sa documentation sont dans votre dépôt, la base sur votre hébergement. Un autre développeur reprend l’outil sans repartir de zéro.",
      },
    ],
  },
};
