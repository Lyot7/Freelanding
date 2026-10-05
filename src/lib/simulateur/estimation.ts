import type { Pack } from "@/content/offre";
import type { Palier, TypeProjet } from "@/content/simulateur";

/**
 * L'ESTIMATION DU SIMULATEUR DE PRIX : un calcul fixe, sans modèle.
 *
 * Chaque question donne un plancher et un plafond de palier : ceux de la
 * réponse choisie, ou, sans réponse, le plus bas et le plus haut de ses
 * options. La fourchette va du plus haut des planchers au plus haut des
 * plafonds. Répondre ne peut donc que la resserrer.
 */
export interface Estimation {
  readonly palierBas: Palier;
  readonly palierHaut: Palier;
  readonly bas: Pack;
  readonly haut: Pack;
  /**
   * Ce que le forfait du palier bas ajoute au précédent, comme sur les pages
   * de prestation : la liste cumulée faisait lire « 1 page longue » puis
   * « 5 à 7 pages » dans le même résultat.
   */
  readonly inclus: readonly string[];
  /** Le forfait précédent, que `inclus` complète. Absent au premier palier. */
  readonly precedent?: Pack;
  /** Les besoins signalés hors forfait, ou à défaut le hors-forfait de la grille. */
  readonly horsForfait: readonly string[];
  /** Questions encore sans réponse. */
  readonly restantes: number;
}

const plafond = (option: { palier: Palier; palierMax?: Palier }): Palier =>
  option.palierMax ?? option.palier;

const plusHaut = (a: Palier, b: Palier): Palier => (a >= b ? a : b);
const plusBas = (a: Palier, b: Palier): Palier => (a <= b ? a : b);

export function estimer(
  type: TypeProjet,
  reponses: Readonly<Record<string, string>>,
): Estimation {
  let palierBas: Palier = 0;
  let palierHaut: Palier = 0;
  let restantes = 0;
  const notes: string[] = [];

  for (const question of type.questions) {
    const choisie = question.options.find((o) => o.id === reponses[question.id]);
    const bas = choisie
      ? choisie.palier
      : question.options.map((o) => o.palier).reduce(plusBas);
    const haut = choisie ? plafond(choisie) : question.options.map(plafond).reduce(plusHaut);
    if (!choisie) restantes += 1;
    if (choisie?.horsForfait) notes.push(choisie.horsForfait);
    palierBas = plusHaut(palierBas, bas);
    palierHaut = plusHaut(palierHaut, haut);
  }

  return {
    palierBas,
    palierHaut,
    bas: type.packs[palierBas],
    haut: type.packs[palierHaut],
    inclus: type.packs[palierBas].ajoute,
    precedent: palierBas > 0 ? type.packs[palierBas - 1] : undefined,
    horsForfait: notes.length > 0 ? notes : [type.horsPack],
    restantes,
  };
}
