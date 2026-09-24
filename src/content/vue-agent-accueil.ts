/**
 * Raccourci de la vue Agent dans la barre basse du héros de l'accueil, et les
 * chemins de la vue.
 *
 * FICHIER À PART, et pour une raison de poids : `DemanderAssistant` est un
 * composant client de la page la plus surveillée du site. Importer l'objet
 * complet de `vue-agent.ts` embarquait dans son JavaScript les consignes du
 * prompt, l'intégralité des textes de `/agent` et du profil, alors que le
 * prompt est justement servi à part (`/agent/prompt.txt`) pour ne rien ajouter
 * à l'accueil. `vue-agent.ts` réexporte tout ce qui est ici.
 */

export const CHEMIN_VUE_AGENT = "/agent";
export const CHEMIN_PROFIL_TEXTE = "/llms-full.txt";
export const CHEMIN_PROMPT_TEXTE = "/agent/prompt.txt";

/**
 * Copie le prompt en un clic, sans quitter la page. Écrit comme une ligne de
 * saisie, curseur compris, parce que c'est ce que le visiteur va en faire.
 */
export const accueilVueAgent = {
  invite: ">",
  libelle: "Demande à ton assistant si je suis le bon choix",
  court: "Demande à ton assistant",
  fait: "Copié, colle-le dans ton assistant",
  /** Entre 810 et 1199 px : la forme longue débordait sur « Prendre rendez-vous ». */
  faitCourt: "Prompt copié",
  echec: "Ouverture de la vue agent",
  titre: "Copie un prompt qui contient tout mon profil",
} as const;
