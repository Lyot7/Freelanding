/**
 * PAGE `/services/logiciel-metier/maintenance-sav` : la GMAO et le SAV sur
 * mesure pour les PME de maintenance.
 *
 * REQUÊTE VISÉE : « logiciel gmao pme », intention commerciale, devant :
 * appvizer.fr, horneo.fr, corim-solutions.com (comparateurs et éditeurs). La
 * page vise les PME dont le métier est la maintenance chez leurs clients
 * (installateurs, SAV de fabricants), pas la maintenance d'une usine.
 *
 * L'ÉLÉMENT PROPRE À LA PAGE : le lexique du métier, terme par terme, avec ce
 * que l'outil en fait ; et le calcul de l'argent qui attend entre le bon
 * d'intervention papier et la facture. Hypothèses affichées, montants calculés.
 */
import { euros, prestation } from "./offre";
import { CHEMIN_GMAO, nombre, type PageTheme } from "./page-theme";
import { CHEMIN_PRIX_LOGICIEL } from "./pages-secteur";

const LOGICIEL = prestation("logiciel");
const CHEMIN_PILIER = `/services/${LOGICIEL.slug}`;

/*
 * HYPOTHÈSES DU CALCUL : 120 interventions par mois, 280 € HT en moyenne, 15
 * jours entre l'intervention et la facture quand les bons reviennent sur
 * papier, 6 minutes de ressaisie par bon. L'encours est la part du chiffre
 * mensuel qui attend en permanence d'être facturée.
 */
const INTERVENTIONS_MOIS = 120;
const MONTANT_MOYEN = 280;
const DELAI_JOURS = 15;
const JOURS_MOIS = 30;
const MINUTES_RESSAISIE = 6;
const FACTURE_MOIS = INTERVENTIONS_MOIS * MONTANT_MOYEN;
const ENCOURS = Math.round((FACTURE_MOIS * DELAI_JOURS) / JOURS_MOIS);
const HEURES_RESSAISIE_MOIS = (INTERVENTIONS_MOIS * MINUTES_RESSAISIE) / 60;

/** Exposé pour le test, qui vérifie que le texte suit les hypothèses. */
export const calculGmao = {
  factureMois: FACTURE_MOIS,
  encours: ENCOURS,
  heuresRessaisieMois: HEURES_RESSAISIE_MOIS,
} as const;

export const pageGmao: PageTheme = {
  id: "maintenance-sav",
  chemin: CHEMIN_GMAO,
  seo: {
    titre: "Logiciel GMAO pour PME de maintenance · Eliott Bouquerel",
    description: `Logiciel GMAO sur mesure pour votre PME : contrats, préventif, dépannages, bons d’intervention signés sur mobile et facturés le soir, prix fixé au devis.`,
  },
  h1: "Logiciel GMAO et SAV pour PME",
  resume: `Un logiciel de GMAO sur mesure suit votre parc installé, planifie le préventif à partir de vos contrats, envoie les dépannages au bon technicien et fait partir le bon d’intervention signé en facturation le soir même. Le prix se fixe au devis.`,
  prestation: "logiciel",
  offre: LOGICIEL,
  filAriane: [
    { libelle: "Accueil", href: "/" },
    { libelle: "Prestations", href: "/#services" },
    { libelle: LOGICIEL.nom, href: CHEMIN_PILIER },
    { libelle: "GMAO et SAV" },
  ],
  libelleLien: "logiciel GMAO et SAV",
  accroche: "Contrats, préventif, dépannages et bons d’intervention sur mobile.",
  noteLlms:
    "logiciel de GMAO et de SAV sur mesure pour les PME de maintenance et d’installation : parc installé, contrats, préventif, curatif, bons d’intervention",
  blocs: [
    {
      type: "tableau",
      id: "lexique",
      titre: "Votre métier, mot par mot",
      paragraphes: [
        "Installateurs de chauffage ou de froid, ascensoristes, portes automatiques, SAV d’un fabricant de machines : vos journées se jouent chez vos clients, et vos mots disent déjà ce que l’outil doit faire.",
      ],
      legende: "Les termes de la maintenance, et ce que le logiciel en fait",
      colonnes: ["Terme", "Ce que c’est", "Ce que le logiciel en fait"],
      lignes: [
        [
          "Parc installé",
          "Les équipements de vos clients que vous entretenez",
          "Une fiche par équipement : numéro de série, date de pose, historique des passages",
        ],
        [
          "Contrat de maintenance",
          "Ce que vous devez au client, et à quelle fréquence",
          "Les visites préventives se planifient seules à partir du contrat",
        ],
        [
          "Préventif",
          "La visite prévue avant la panne",
          "Le planning sort à l’avance, technicien par technicien, tournée regroupée par secteur",
        ],
        [
          "Curatif",
          "Le dépannage après une panne",
          "L’appel du client crée l’intervention, avec l’historique de l’équipement sous les yeux",
        ],
        [
          "Bon d’intervention",
          "Le compte rendu signé sur place",
          "Rempli sur téléphone, photos et signature comprises, il part en facturation le soir même",
        ],
        [
          "Pièces détachées",
          "Ce que le technicien pose ou commande",
          "Le stock du véhicule et de l’entrepôt se met à jour à la pose",
        ],
        [
          "Astreinte",
          "Qui répond la nuit et le week-end",
          "L’appel arrive au technicien de garde, avec l’adresse et l’équipement",
        ],
        [
          "MTBF et MTTR",
          "Le temps moyen entre deux pannes, et pour réparer",
          "Calculés par équipement, ils montrent ce qu’il vaut mieux remplacer que réparer",
        ],
      ],
    },
    {
      type: "chiffres",
      id: "tresorerie",
      titre: "Le bon papier coûte surtout de la trésorerie",
      paragraphes: [
        `Prenez une PME qui réalise ${INTERVENTIONS_MOIS} interventions par mois, à ${euros(MONTANT_MOYEN)} HT en moyenne. Quand les bons reviennent sur papier en fin de semaine, puis attendent d’être ressaisis, la facture part en moyenne ${DELAI_JOURS} jours après l’intervention.`,
        `Ce délai immobilise en permanence ${euros(ENCOURS)} de travail déjà fait et pas encore facturé, sans compter ${nombre(HEURES_RESSAISIE_MOIS)} heures de ressaisie par mois. Ces chiffres sont des hypothèses : remplacez-les par les vôtres, le calcul reste le même.`,
      ],
      chiffres: [
        { valeur: euros(FACTURE_MOIS), libelle: "d’interventions réalisées chaque mois" },
        { valeur: `${DELAI_JOURS} jours`, libelle: "entre l’intervention et la facture" },
        { valeur: euros(ENCOURS), libelle: "qui attendent en permanence d’être facturés" },
      ],
    },
    {
      type: "section",
      id: "choix",
      titre: "GMAO du marché ou outil à votre main",
      paragraphes: [
        "Les GMAO du marché sont pensées pour la maintenance d’une usine : vos propres machines, vos propres techniciens. Votre cas est différent : les équipements appartiennent à vos clients, et chaque intervention finit en facture.",
        `Quand un logiciel standard vous suit à 80 %, gardez-le et faites développer ce qui manque : l’application du technicien, le lien vers la facturation, le portail où vos clients suivent leurs demandes.`,
      ],
      liens: {
        titre: "Pour aller plus loin",
        items: [
          {
            libelle: "Le logiciel métier en détail",
            href: CHEMIN_PILIER,
            description: "Ce qui est compris, et ce qui fait varier le prix.",
          },
          {
            libelle: "Le prix d’un logiciel sur mesure",
            href: CHEMIN_PRIX_LOGICIEL,
            description: "Ce qui fait monter le devis, poste par poste.",
          },
          {
            libelle: "Outil sur mesure ou abonnements SaaS",
            href: "/blog/outil-sur-mesure-ou-abonnements-saas",
            description: "Comparer un abonnement par technicien et un outil à vous.",
          },
        ],
      },
      points: [
        {
          titre: "Un écran pour le technicien",
          corps:
            "Sur son téléphone : sa tournée, l’historique de l’équipement, le bon à remplir, même sans réseau au sous-sol.",
        },
        {
          titre: "Un écran pour le bureau",
          corps:
            "Le planning de la semaine, les urgences du jour, les bons signés prêts à facturer.",
        },
        {
          titre: "Un écran pour vos clients",
          corps:
            "Leurs équipements, leurs rapports de visite, et un formulaire pour signaler une panne.",
        },
        {
          titre: "Relié à votre facturation",
          corps:
            "Le bon signé devient une facture dans votre logiciel actuel, sans ressaisie.",
        },
      ],
    },
  ],
  titreOffre: "Prix d’une GMAO sur mesure : ce qui le fait varier",
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Votre GMAO", "et votre SAV."],
    items: [
      {
        question: "Combien coûte une GMAO sur mesure ?",
        answer: `Le prix suit le nombre d’écrans (technicien, bureau, clients), les outils à relier et la reprise de votre parc. Je le fixe au devis.`,
      },
      {
        question: "Le technicien peut-il travailler sans réseau ?",
        answer:
          "Oui. L’application garde la tournée et l’historique sur le téléphone, le bon se remplit hors ligne et part dès que le réseau revient.",
      },
      {
        question: "Pouvez-vous reprendre notre parc existant ?",
        answer:
          "Oui, depuis un tableur ou un export de votre logiciel actuel. Les équipements, les contrats et l’historique sont repris avant la mise en service.",
      },
      {
        question: "Avez-vous déjà un client dans la maintenance ?",
        answer:
          "Pas encore. La méthode vient d’ailleurs : chez Würth France, dans la distribution, un parcours refait à partir des erreurs relevées a donné −92 % d’erreurs, mesuré en interne.",
      },
    ],
  },
};
