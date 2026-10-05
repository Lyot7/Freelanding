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
 * UN OUTIL DE CADRAGE DEPUIS LE 2026-10-05 : le résultat donne le plancher
 * du type de projet et ce qui fera monter le prix, jamais une fourchette ni
 * un délai. La FAQ et « Pourquoi ces prix » le disent sans chiffre de
 * résultat client.
 *
 * AUCUN MONTANT NE S'ÉCRIT ICI : tout vient d'`offre.ts`, et l'exemple face à
 * un abonnement vient de `page-prix-logiciel.ts`, qui le calcule.
 */
import { aPartirDe, euros, integrationIA, prestation, prixPlancher } from "./offre";
import { pagePrixLogiciel } from "./page-prix-logiciel";
import { CHEMIN_PRIX_SITE } from "./page-prix-site";
import { CHEMIN_PRIX_LOGICIEL, CHEMIN_SIMULATEUR } from "./pages-secteur";
import { typesProjet } from "./simulateur";

const VITRINE = prestation("vitrine");
const LOGICIEL = prestation("logiciel");
const CHEMIN_ARTICLE_SAAS = "/blog/outil-sur-mesure-ou-abonnements-saas";

const nombresQuestions = [...new Set(typesProjet.map((t) => t.questions.length))].sort();

const comparaison = pagePrixLogiciel.comparaison;

export const pageSimulateur = {
  chemin: CHEMIN_SIMULATEUR,
  seo: {
    titre: "Simulateur de prix site et logiciel · Eliott Bouquerel",
    description:
      "Estimez le prix de votre site vitrine, logiciel métier, outil interne ou intégration IA : le prix de départ, ce qui est inclus et ce qui fait varier le devis.",
  },
  h1: "Simulateur de prix",
  resume: `Site vitrine\u00a0: ${aPartirDe(VITRINE, " HT")}. Logiciel métier ou outil interne\u00a0: ${aPartirDe(LOGICIEL, " HT")}. Intégration IA\u00a0: ${aPartirDe(integrationIA, " HT")}. Réponds à ${nombresQuestions.join(" ou ")} questions : tu vois ce qui fera monter le prix, et le devis le fixe.`,
  marcheFilAriane: "Simulateur de prix",
  libelleLien: "Simulateur de prix",
  noteLlms: `simulateur de prix pour un site vitrine, un logiciel métier, un outil interne ou une intégration IA dans un outil existant (${aPartirDe(integrationIA, " HT")}) : le prix de départ publié, le contenu inclus et ce qui fera monter le prix selon les réponses, par un calcul fixe`,
  pourquoi: {
    id: "pourquoi",
    titre: "Pourquoi ces prix",
    paragraphes: [
      "Un prix se compare à ce qu’il te rend.",
      `Un exemple, à hypothèses affichées\u00a0: pour ${comparaison.utilisateurs} utilisateurs à ${euros(comparaison.prixParUtilisateur)} HT par mois, un abonnement coûte ${euros(comparaison.coutAbonnement)} HT sur ${comparaison.mois} mois. Un projet sur mesure jusqu’à ${euros(comparaison.budgetEquivalent)} HT, suivi compris, revient moins cher sur la même durée, et l’écart grandit chaque année.`,
    ],
    liens: {
      titre: "Le détail",
      items: [
        {
          libelle: "Prix d’un site internet",
          href: CHEMIN_PRIX_SITE,
          description: "Ce que comprend le site vitrine, et ce qui fait varier le prix.",
        },
        {
          libelle: "Prix d’un logiciel sur mesure",
          href: CHEMIN_PRIX_LOGICIEL,
          description: "Ce qui fait varier le prix, et le calcul complet face à un abonnement.",
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
        corps:
          "Un outil sur mesure fait disparaître une tâche que tu refais à la main. Le temps gagné revient chaque semaine, sans licence à renouveler.",
      },
      {
        titre: "Des visites que tu sais suivre",
        corps:
          "Avec la mesure installée, tu sais d’où viennent les visites et ce qui déclenche un contact, puis une passe de correction suit les chiffres.",
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
        titre: "Un prix ferme au devis",
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
          "Il part du prix de départ publié pour ton type de projet, et chaque réponse ajoute, ou non, un point qui fera monter le prix. Il ne donne pas de montant final : le périmètre exact se chiffre au devis.",
      },
      {
        question: "Le prix affiché est-il celui du devis ?",
        answer:
          "C’est le prix de départ : aucun projet de ce type ne coûte moins. Le devis fixe le prix ferme après un premier échange en visio, et une fois signé, le montant ne bouge plus.",
      },
      {
        question: "Combien coûte une intégration IA dans un outil existant ?",
        answer: `Une intégration IA démarre à ${prixPlancher(integrationIA)} HT, pour 1 usage dans 1 outil que tu utilises déjà. Le prix monte avec le nombre d’usages, les règles de ton métier et le nombre d’outils à relier. ${integrationIA.horsOffre}`,
      },
      {
        question: "Combien coûte un outil interne ?",
        answer: `Un outil interne se chiffre comme la solution métier, à partir de ${prixPlancher(LOGICIEL)} HT. Le prix monte quand il remplace plusieurs tâches, quand il relie plusieurs logiciels, ou quand plusieurs personnes s’en servent avec des droits différents.`,
      },
      {
        question: "En combien de temps mon projet est-il en ligne ?",
        answer:
          "La date de mise en ligne est écrite au devis, avec le prix. Elle dépend de ce que ton projet demande et de la rapidité de tes retours. Je ne mène qu’un projet à la fois pour la tenir.",
      },
    ],
  },
};
