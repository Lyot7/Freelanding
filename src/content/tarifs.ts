/** Adresse du bloc « pourquoi un devis ne tombe jamais pile », sur sa page. */
export const lienDevis = (slug: string): string => `/services/${slug}#devis`;

/**
 * Libellés du bloc de méthode de l'accueil (`MethodeSection`).
 *
 * Ils vivent ici plutôt que dans un fichier neuf : c'est le même bloc, au même
 * endroit de la page, dont seul le propos a changé. L'œil ne dit plus « ma
 * façon de facturer » mais ce qu'il annonce réellement, et la ligne de clôture
 * ne présente plus un tableau de prix, qui a quitté l'accueil.
 */
export const methodeLabels = {
  /** Œil du bloc, moitié gauche, en vis-à-vis de la citation. */
  eyebrow: "Ma façon de travailler",
  /** Ligne de clôture sous la citation, alignée à droite. */
  quoteFooter: "Le détail et les prix, prestation par prestation.",
} as const;
