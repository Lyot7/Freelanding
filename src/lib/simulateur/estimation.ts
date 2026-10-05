import type { TypeProjet } from "@/content/simulateur";

/**
 * LE CADRAGE DU SIMULATEUR DE PRIX : un relevé fixe, sans modèle.
 *
 * Depuis le 2026-10-05, il ne calcule plus de fourchette : le prix part du
 * plancher de l'offre et se fixe au devis. Chaque réponse ajoute, ou non, ce
 * qui fera monter le prix (`facteur`) et ce qui sort de l'offre
 * (`horsForfait`). Les listes suivent l'ordre des questions.
 */
export interface Estimation {
  /** Ce qui fera monter le prix au-dessus du plancher, selon les réponses. */
  readonly facteurs: readonly string[];
  /** Les besoins signalés hors de l'offre, ou à défaut le hors-offre de l'offre. */
  readonly horsForfait: readonly string[];
  /** Questions encore sans réponse. */
  readonly restantes: number;
}

export function estimer(
  type: TypeProjet,
  reponses: Readonly<Record<string, string>>,
): Estimation {
  const facteurs: string[] = [];
  const notes: string[] = [];
  let restantes = 0;

  for (const question of type.questions) {
    const choisie = question.options.find((o) => o.id === reponses[question.id]);
    if (!choisie) {
      restantes += 1;
      continue;
    }
    if (choisie.facteur && !facteurs.includes(choisie.facteur)) facteurs.push(choisie.facteur);
    if (choisie.horsForfait) notes.push(choisie.horsForfait);
  }

  return {
    facteurs,
    horsForfait: notes.length > 0 ? notes : [type.offre.horsOffre],
    restantes,
  };
}
