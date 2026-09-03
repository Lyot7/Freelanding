import type { NotFoundContent } from "@/lib/content/types";

/**
 * Page 404.
 *
 * Le message court est rendu sur deux lignes séparées par un saut forcé, et le
 * titre également : le découpage appartient donc au contenu, pas au composant.
 * Le nombre de lignes est structurel (deux et deux) et ne doit pas bouger.
 *
 * NOTE : `NotFoundView.tsx` recopie encore ces quatre chaînes en dur, en
 * anglais. Cette donnée alimente le repository ; le rendu ne s'y
 * branchera qu'une fois le composant mis à jour.
 */
export const notFoundContent: NotFoundContent = {
  messageLines: ["Le lien que vous avez suivi", "ne mène nulle part."],
  titleLines: ["Page", "introuvable"],
  errorLabel: "Erreur 404",
  backLink: { label: "Retour à l’accueil", href: "/" },
};
