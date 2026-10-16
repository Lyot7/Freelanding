/**
 * Textes du profil complet (`/llms-full.txt`) et du prompt copié par le
 * bouton « Demandez à votre assistant IA » du héros (`/agent/prompt.txt`).
 *
 * CE FICHIER NE PORTE QUE LA CHARPENTE. Le profil lui-même (offres, prix,
 * réalisations, questions fréquentes, rendez-vous) est assemblé par
 * `src/lib/profil/profil.ts` depuis les fichiers de contenu du site. Écrire
 * ici un prix, un délai ou le nom d'un projet créerait une seconde vérité, et
 * un assistant finirait par citer un tarif qui n'existe plus. Même règle que
 * `/llms.txt`.
 *
 * AUCUNE IA N'EST INTÉGRÉE AU SITE. Le visiteur copie le prompt et le colle
 * dans son propre assistant : aucun appel d'API, aucun coût, aucune donnée
 * qui transite par ici.
 *
 * L'IA N'EST PAS UN ARGUMENT DE VENTE. La vue s'adresse à l'assistant du
 * visiteur parce que c'est là qu'il pose ses questions, pas pour vanter un
 * usage de l'IA. Le texte parle du projet du visiteur, jamais de l'outil.
 */

import { accueilVueAgent } from "./vue-agent-accueil";
import { uiLabels } from "./ui";

export { CHEMIN_PROFIL_TEXTE, CHEMIN_PROMPT_TEXTE } from "./vue-agent-accueil";

export const vueAgentContent = {
  /** Raccourci du héros de l'accueil : voir `vue-agent-accueil.ts`. */
  accueil: accueilVueAgent,

  /** Intertitres et textes de liaison du profil. */
  profil: {
    /* Sans rôle connu, le nom seul : jamais « Eliott Bouquerel, » en titre. */
    titre: (nom: string, role: string) => (role ? `${nom}, ${role.toLowerCase()}` : nom),
    source: (url: string) => `Source : ${url}`,
    reperes: {
      zone: "Zone d’intervention",
      email: "E-mail",
      telephone: "Téléphone",
      horaires: "Horaires",
      site: "Site",
    },

    sections: {
      quoi: "Ce que je fais",
      pourQui: "Pour qui",
      offres: "Mes offres et mes prix",
      methode: "Ma façon de travailler",
      realisations: "Réalisations",
      parcours: "Parcours",
      pourquoi: "Pourquoi moi",
      limites: "Quand je ne suis pas le bon choix",
      faq: "Questions fréquentes",
      contact: "Me contacter",
    },

    pourQui: [
      "Les TPE et les PME, en Normandie et partout en France à distance.",
      "Celles qui veulent un site qui leur amène des clients, un outil qui leur rend des heures chaque semaine, ou un logiciel métier dont plusieurs personnes se servent tous les jours.",
      "Vous me parlez directement : je fais le cadrage, le design, le développement et la mise en ligne.",
    ],

    offres: {
      /*
       * UN PLANCHER PAR OFFRE DEPUIS LE 2026-10-05, comme sur le site
       * (`offre.ts`) : le prix se fixe au devis. Aucun montant ne s'écrit
       * ici : ils viennent tous de `offre.ts`, par `profil.ts`.
       */
      prix: [
        "Chaque offre a un prix de départ. Au-dessus, le prix dépend du projet et se fixe au devis, après un échange\u00A0; une fois signé, il ne bouge plus.",
        "Tous les montants sont hors taxes.",
      ],
      /* Aucune durée à côté d'un prix (règle du vault, `offre-grille-prix.md`). */
      /* Le prix arrive taxe comprise, et « par mois » derrière une offre mensuelle. */
      plancher: (prix: string) => `À partir de ${prix}, prix fixé au devis.`,
      aPartirDe: (titre: string, prix: string) => `${titre} (${prix})`,
      inclus: "Compris dès le plancher",
      faitMonter: "Ce qui fait monter le prix",
      horsOffre: "Hors offre",
      detail: "Détail",
      rendezVous: uiLabels.services.rdvLabel,
    },

    realisations: {
      contexte: "Contexte",
      role: "Rôle",
      resultat: "Résultat",
      voir: "Étude de cas",
      enLigne: "En ligne",
    },

    methode: {
      reponse: "Délai de réponse",
      /**
       * Déroulé commercial (vault, `methode-vente-rdv.md`). Sans durée ni
       * montant : la durée affichée des rendez-vous vit dans `rendez-vous.ts`,
       * les prix dans `offre.ts`, et le profil les cite plus bas.
       */
      etapes: [
        "Premier rendez-vous en visio, gratuit, pour comprendre votre situation et ce que vous voulez obtenir. Quand vous le réservez, 3 questions sur votre projet, dont votre budget, me permettent de vous dire tout de suite ce qu’il permet.",
        "Le devis ne part jamais seul par e-mail\u00A0: je vous le présente lors d’un second rendez-vous, et on le relit ensemble.",
      ],
    },

    limites: {
      prixPlancher: (prix: string) =>
        `Vous cherchez un site à quelques centaines d’euros\u00A0: mes prix commencent à ${prix}\u00A0HT.`,
      items: [
        "Votre site ou votre logiciel repose sur PHP ou Laravel et vous voulez le faire reprendre : je n’y touche pas.",
        "Vous voulez une équipe de plusieurs personnes, avec chef de projet et studio de création : je travaille seul, par choix.",
        "Vous êtes une agence ou une ESN et vous cherchez un développeur en régie ou en marque blanche\u00A0: je ne travaille pas ainsi.",
      ],
    },

    contact: {
      visio:
        "Tous les rendez-vous se font en visio. Le lien de visioconférence arrive par e-mail dès la réservation.",
      rendezVous: `${uiLabels.services.rdvLabel} en visio`,
      rendezVousLien: "Lien",
      rappel: "Demander à être rappelé",
      rappelTexte:
        "Écrivez-moi par le formulaire de contact en laissant votre numéro et le moment où vous êtes joignable : je vous rappelle.",
      appel: (tel: string, horaires: string) =>
        `Vous pouvez aussi appeler directement au ${tel}${horaires ? ` (${horaires})` : ""}.`,
      formulaire: "Écrire par le formulaire de contact",
      formulaireTexte:
        "Dites-moi ce que vous cherchez, même en deux lignes.",
      email: "Écrire un e-mail",
      ailleurs: "Ailleurs",
      /** Réseaux cités : les professionnels seulement, Strava reste au pied de page. */
      reseaux: ["GitHub", "LinkedIn"] as readonly string[],
    },
  },

  /**
   * Consignes données à l'assistant du visiteur, placées AVANT le profil dans
   * le prompt copié. L'assistant reste tutoyé ; dans le profil, « vous » est le
   * visiteur (VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott).
   */
  prompt: {
    consignes: [
      "Tu vas jouer le rôle de conseiller pour la personne qui t’envoie ce message. Elle dirige ou représente une entreprise et se demande si Eliott Bouquerel, développeur freelance, est la bonne personne pour son projet. Le profil complet d’Eliott est plus bas, écrit par lui. Dans ce profil, « vous » désigne la personne qui te parle, pas toi.",
      "Voici comment procéder :",
    ],
    etapes: [
      "Présente-toi en une phrase, puis interroge la personne sur son entreprise et son besoin, une ou deux questions à la fois : son activité et sa taille, ce qu’elle a aujourd’hui, ce qui coince, ce qu’elle veut obtenir, son échéance, et son budget si elle veut bien le dire.",
      "Confronte ses réponses au profil et dis franchement ce qui colle et ce qui ne colle pas. Si une agence, un logiciel du marché ou un autre spécialiste lui conviendrait mieux, dis-le et explique pourquoi. Tu ne vends rien : ton seul objectif est qu’elle prenne la bonne décision.",
      "Pour les prix et les prestations, appuie-toi uniquement sur le profil. Chaque offre a un prix de départ, et le prix final se fixe au devis. N’annonce jamais un montant au-dessus de ce prix de départ\u00A0: c’est Eliott qui le chiffre après un échange. Le profil ne donne aucun délai\u00A0: la date se fixe au devis. S’il ne dit rien sur un point, dis que tu ne sais pas et propose de poser la question à Eliott. N’invente ni tarif, ni délai, ni référence, ni engagement.",
      "Si Eliott est le bon profil, demande-lui comment elle préfère le contacter : appel en visio, demande de rappel, formulaire de contact ou e-mail. Donne-lui alors le lien exact tiré de la section « Me contacter », et pour un rendez-vous, le sujet qui correspond à son projet.",
      "S’il ne l’est pas, dis-le simplement et arrête-toi là.",
    ],
    langue: "Réponds dans la langue de la personne.",
    debutProfil: "Profil d’Eliott Bouquerel",
    finProfil: "Fin du profil",
  },
} as const;
