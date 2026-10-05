/**
 * LE SIMULATEUR DE PRIX, `/simulateur-prix` (2026-10-05) : le contenu de la
 * page. Les types de projet, les questions et le calcul sont dans
 * `simulateur.ts`.
 *
 * POURQUOI CETTE PAGE. Un outil gratuit se lie et se cite plus volontiers
 * qu'une page de prix (stratégie SEO, section « Backlinks et citations IA »,
 * levier 6), et ses réponses disent à Eliott quel projet le visiteur porte
 * avant le premier appel.
 *
 * AUCUN MONTANT NE S'ÉCRIT ICI : tout vient d'`offre.ts`.
 */
import { euros, fourchette, integrationIA, prestation, prixPack } from "./offre";
import { pagePrixLogiciel } from "./page-prix-logiciel";
import { CHEMIN_PRIX_SITE } from "./page-prix-site";
import { CHEMIN_PRIX_LOGICIEL, CHEMIN_SIMULATEUR } from "./pages-secteur";
import { delaiEstime, prixEstime, typesProjet } from "./simulateur";

const VITRINE = prestation("vitrine");
const LOGICIEL = prestation("logiciel");
const [OUTIL, LE_LOGICIEL, PLATEFORME] = LOGICIEL.packs;
const SIGNATURE = VITRINE.packs[2];
const [ASSISTANT, INTEGRATION, AUTOMATISATION] = integrationIA.packs;
const CHEMIN_ARTICLE_SAAS = "/blog/outil-sur-mesure-ou-abonnements-saas";

/** « de 2 500 € à 8 000 € HT et plus », dans le format de `fourchette()`. */
const fourchetteIA = prixEstime(ASSISTANT, AUTOMATISATION);

const nombresQuestions = [...new Set(typesProjet.map((t) => t.questions.length))].sort();

const comparaison = pagePrixLogiciel.comparaison;

export const pageSimulateur = {
  chemin: CHEMIN_SIMULATEUR,
  seo: {
    titre: "Simulateur de prix site et logiciel · Eliott Bouquerel",
    description:
      "Estimez en quelques clics le prix de votre site vitrine, logiciel métier, outil interne ou intégration IA : fourchette de prix, contenu inclus et délai.",
  },
  h1: "Simulateur de prix",
  resume: `Site vitrine\u00a0: ${fourchette("vitrine", " HT")}. Logiciel métier ou outil interne\u00a0: ${fourchette("logiciel", " HT")}. Intégration IA\u00a0: ${fourchetteIA}. Réponds à ${nombresQuestions.join(" ou ")} questions pour situer ton projet.`,
  marcheFilAriane: "Simulateur de prix",
  libelleLien: "Simulateur de prix",
  noteLlms: `simulateur de prix pour un site vitrine, un logiciel métier, un outil interne ou une intégration IA dans un outil existant (${fourchetteIA}) : une fourchette tirée des forfaits publiés, le contenu inclus et le délai, par un calcul fixe`,
  pourquoi: {
    id: "pourquoi",
    titre: "Pourquoi ces prix",
    paragraphes: [
      "Un forfait se compare à ce qu’il te rend.",
      `Un exemple, à hypothèses affichées\u00a0: pour ${comparaison.utilisateurs} utilisateurs à ${euros(comparaison.prixParUtilisateur)} HT par mois, un abonnement coûte ${euros(comparaison.coutAbonnement)} HT sur ${comparaison.mois} mois. ${LE_LOGICIEL.nom} et son suivi coûtent ${euros(comparaison.coutSurMesure)} HT sur la même durée. À partir de ${comparaison.seuilUtilisateurs} utilisateurs, le sur mesure revient moins cher, et l’écart grandit chaque année.`,
    ],
    liens: {
      titre: "Le détail",
      items: [
        {
          libelle: "Prix d’un site internet",
          href: CHEMIN_PRIX_SITE,
          description: "Les 3 forfaits du site vitrine, et ce qui fait varier le prix.",
        },
        {
          libelle: "Prix d’un logiciel sur mesure",
          href: CHEMIN_PRIX_LOGICIEL,
          description: "Les 3 forfaits de la solution métier, et le calcul complet face à un abonnement.",
        },
        {
          libelle: "Outil sur mesure ou abonnements SaaS",
          href: CHEMIN_ARTICLE_SAAS,
          description: "La même question, posée en heures de travail gagnées.",
        },
      ],
    },
    points: [
      {
        titre: "Du temps rendu chaque semaine",
        corps: `${OUTIL.nom} fait disparaître une tâche que tu refais à la main. Le temps gagné revient chaque semaine, sans licence à renouveler.`,
      },
      {
        titre: "Des visites que tu sais suivre",
        corps: `${SIGNATURE.nom} installe la mesure\u00a0: tu sais d’où viennent les visites et ce qui déclenche un contact, puis une passe de correction suit les chiffres.`,
      },
      {
        titre: "Aucune licence par utilisateur",
        corps: "Le prix suit le périmètre. Que 5 ou 50 personnes s’en servent, il ne change pas.",
      },
      {
        titre: "Le code à ton nom",
        corps: "Livré dans ton dépôt, avec sa documentation, sur un hébergement à ton nom.",
      },
      {
        titre: "Un prix ferme",
        corps: "Le montant signé ne bouge plus. Si je me trompe sur le temps nécessaire, c’est à moi de l’absorber.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    titleLines: ["Le simulateur", "et tes prix."],
    items: [
      {
        question: "Comment le simulateur calcule-t-il le prix ?",
        answer:
          "Chaque réponse situe ton projet dans un de mes 3 forfaits, aux montants publiés sur mes pages de prix. Une question sans réponse élargit la fourchette, une réponse la resserre.",
      },
      {
        question: "Le prix affiché est-il celui du devis ?",
        answer:
          "C’est une estimation. Le devis fixe le prix ferme après un premier échange en visio, et une fois signé, le montant ne bouge plus.",
      },
      {
        question: "Combien coûte une intégration IA dans un outil existant ?",
        answer: `De ${prixPack(ASSISTANT)} HT pour ${ASSISTANT.nom}, 1 usage dans 1 outil, à ${prixPack(INTEGRATION)} HT pour ${INTEGRATION.nom}, jusqu’à 3 usages avec les règles de ton métier. ${AUTOMATISATION.nom}, qui relie plusieurs outils, démarre à ${prixPack(AUTOMATISATION)} HT, sur devis. ${integrationIA.horsPack}`,
      },
      {
        question: "Combien coûte un outil interne ?",
        answer: `${OUTIL.nom} coûte ${prixPack(OUTIL)} HT\u00a0: 1 tâche répétitive, 1 outil à relier. Dès que plusieurs personnes s’en servent avec des droits différents, ou qu’il couvre jusqu’à 3 tâches, c’est ${LE_LOGICIEL.nom}, à ${prixPack(LE_LOGICIEL)} HT. Au-delà, ${PLATEFORME.nom} se chiffre au devis.`,
      },
      {
        question: "En combien de temps mon projet est-il en ligne ?",
        answer: `${VITRINE.packs[0].nom} se met en ligne en ${delaiEstime(VITRINE.packs[0], VITRINE.packs[0])}, ${LE_LOGICIEL.nom} en ${delaiEstime(LE_LOGICIEL, LE_LOGICIEL)}. La date exacte est écrite au devis, et je ne mène qu’un projet à la fois pour la tenir.`,
      },
    ],
  },
};
