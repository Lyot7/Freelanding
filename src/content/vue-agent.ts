/**
 * Textes de la vue Agent : le sélecteur « Humain / Agent » de l'en-tête, la
 * page `/agent`, les intertitres du profil complet et le prompt à copier.
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

export const CHEMIN_VUE_AGENT = "/agent";
export const CHEMIN_PROFIL_TEXTE = "/llms-full.txt";
export const CHEMIN_PROMPT_TEXTE = "/agent/prompt.txt";

export const vueAgentContent = {
  /** Sélecteur de l'en-tête. */
  toggle: {
    libelle: "Choisir la vue",
    humain: "Humain",
    agent: "Agent",
    /** Préfixe lu par les lecteurs d'écran devant la forme courte. */
    prefixe: "Vue ",
  },

  seo: {
    title: "Profil complet d’Eliott Bouquerel, à lire ou à donner à ton IA",
    description:
      "Tout ce que fait Eliott Bouquerel, développeur freelance, en un seul texte : offres et prix, méthode, réalisations, contact. Et un prompt à coller dans ton assistant pour savoir si Eliott est la bonne personne pour ton projet.",
  },

  hero: {
    /** Dit l'offre avant l'action : qui, quoi, pour qui. */
    surtitre: (nom: string, baseline: string) =>
      `${nom} · ${baseline.toLocaleLowerCase("fr")} pour TPE et PME`,
    titre: "Demande à ton assistant si je suis le bon choix.",
    resume:
      "Tout ce que je fais tient dans ce texte. Copie le prompt et colle-le dans ton assistant habituel : il te pose des questions sur ton projet, puis te dit si je suis la bonne personne.",
  },

  mode: {
    titre: "Comment ça marche",
    etapes: [
      "Copie le prompt. Il contient ce profil en entier.",
      "Colle-le dans ton assistant habituel (ChatGPT, Claude ou un autre).",
      "Il te pose des questions sur ton entreprise et ton besoin, puis te dit si je suis le bon choix. Si c’est le cas, il te donne le lien pour me joindre de la façon qui te va.",
    ],
    voirPrompt: "Lire les consignes données à l’assistant",
    lienTexte: "Version texte brut",
  },

  copier: {
    action: "Copier le prompt",
    fait: "Prompt copié",
    suite: "C’est copié. Colle-le dans ton assistant.",
    echec: "La copie n’a pas marché. Le prompt est dans le cadre ci-dessous, déjà sélectionné.",
    zone: "Prompt complet",
  },

  /**
   * Raccourci de la barre basse du héros de l'accueil : copie le prompt en un
   * clic, sans quitter la page. Écrit comme une ligne de saisie, curseur
   * compris, parce que c'est ce que le visiteur va en faire.
   */
  accueil: {
    invite: ">",
    libelle: "Demande à ton assistant si je suis le bon choix",
    court: "Demande à ton assistant",
    fait: "Copié, colle-le dans ton assistant",
    echec: "Ouverture de la vue agent",
    titre: "Copie un prompt qui contient tout mon profil",
  },

  sommaire: "Sur cette page",

  /** Intertitres et textes de liaison du profil. */
  profil: {
    titre: (nom: string, role: string) => `${nom}, ${role.toLowerCase()}`,
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
      "Tu me parles directement : je fais le cadrage, le design, le développement et la mise en ligne.",
    ],

    offres: {
      prix: "Tous les prix sont hors taxes. Le prix exact est fixé au devis, avant le début du projet, et ne bouge plus ensuite.",
      pack: (nom: string, prix: string, delai: string) =>
        `${nom}\u00A0: ${prix}\u00A0HT, ${delai}.`,
      pourQui: "Pour qui",
      contient: "Contient",
      ajoute: "Ajoute au périmètre précédent",
      horsPack: "Hors périmètre",
      detail: "Détail",
      rendezVous: "En parler",
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
    },

    limites: {
      prixPlancher: (prix: string) =>
        `Tu cherches un site à quelques centaines d’euros : mon premier périmètre commence à ${prix}\u00A0HT.`,
      items: [
        "Ton site ou ton logiciel repose sur PHP ou Laravel et tu veux le faire reprendre : je n’y touche pas.",
        "Tu veux une équipe de plusieurs personnes, avec chef de projet et studio de création : je travaille seul, par choix.",
      ],
    },

    contact: {
      visio:
        "Tous les rendez-vous se font en visio. Le lien de visioconférence arrive par e-mail dès la réservation.",
      rendezVous: "Prendre rendez-vous en visio",
      rendezVousLien: "Réserver",
      rappel: "Demander à être rappelé",
      rappelTexte:
        "Écris-moi par le formulaire de contact en laissant ton numéro et le moment où tu es joignable : je te rappelle.",
      appel: (tel: string, horaires: string) =>
        `Tu peux aussi appeler directement au ${tel}${horaires ? ` (${horaires})` : ""}.`,
      formulaire: "Écrire par le formulaire de contact",
      formulaireTexte:
        "Dis-moi ce que tu cherches, même en deux lignes.",
      email: "Écrire un e-mail",
      ailleurs: "Ailleurs",
      /** Réseaux cités : les professionnels seulement, Strava reste au pied de page. */
      reseaux: ["GitHub", "LinkedIn"] as readonly string[],
    },
  },

  /**
   * Consignes données à l'assistant du visiteur, placées AVANT le profil dans
   * le prompt copié. Tutoiement de l'assistant, comme le reste du site.
   */
  prompt: {
    consignes: [
      "Tu vas jouer le rôle de conseiller pour la personne qui t’envoie ce message. Elle dirige ou représente une entreprise et se demande si Eliott Bouquerel, développeur freelance, est la bonne personne pour son projet. Le profil complet d’Eliott est plus bas, écrit par lui. Dans ce profil, « tu » désigne la personne qui te parle, pas toi.",
      "Voici comment procéder :",
    ],
    etapes: [
      "Présente-toi en une phrase, puis interroge la personne sur son entreprise et son besoin, une ou deux questions à la fois : son activité et sa taille, ce qu’elle a aujourd’hui, ce qui coince, ce qu’elle veut obtenir, son échéance, et son budget si elle veut bien le dire.",
      "Confronte ses réponses au profil et dis franchement ce qui colle et ce qui ne colle pas. Si une agence, un logiciel du marché ou un autre spécialiste lui conviendrait mieux, dis-le et explique pourquoi. Tu ne vends rien : ton seul objectif est qu’elle prenne la bonne décision.",
      "Pour les prix, les délais et les prestations, appuie-toi uniquement sur le profil. S’il ne dit rien sur un point, dis que tu ne sais pas et propose de poser la question à Eliott. N’invente ni tarif, ni référence, ni engagement.",
      "Si Eliott est le bon profil, demande-lui comment elle préfère le contacter : rendez-vous en visio de 30 minutes, demande de rappel, formulaire de contact ou e-mail. Donne-lui alors le lien exact tiré de la section « Me contacter », et pour un rendez-vous, le sujet qui correspond à son projet.",
      "S’il ne l’est pas, dis-le simplement et arrête-toi là.",
    ],
    langue: "Réponds dans la langue de la personne.",
    debutProfil: "Profil d’Eliott Bouquerel",
    finProfil: "Fin du profil",
  },
} as const;
