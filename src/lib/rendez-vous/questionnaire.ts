/**
 * Questionnaire de la prise de rendez-vous : tranches de budget, retour « ce
 * que tu peux espérer à ce budget », et mise en forme des notes Cal.com.
 *
 * POURQUOI CE MODULE. Eliott veut recevoir des demandes déjà en partie
 * chiffrées, et le visiteur doit savoir avant l'appel ce que son budget permet.
 * Les deux lisent la MÊME grille, celle de `src/content/offre.ts` : les tranches
 * de budget en sont dérivées, jamais écrites à la main. Un prix qui bouge
 * là-bas déplace les tranches, le retour affiché et les notes reçues, sans
 * qu'une ligne change ici.
 *
 * MODULE PUR, partagé par le navigateur (retour immédiat) et par le serveur
 * (validation en liste fermée, composition des notes). Ni réseau, ni horloge,
 * ni `process.env`.
 */
import { euros, fourchette, prestations } from "@/content/offre";
import type { Pack, Prestation } from "@/content/offre";
import { RDV_PAR_PRESTATION, rendezVousContent } from "@/content/rendez-vous";
import type { IdRendezVous, OptionQuestion } from "@/content/rendez-vous";

const questions = rendezVousContent.questionnaire;
const retour = rendezVousContent.retour;

/** Identifiant de la tranche « je ne sais pas encore », commun à tous les types. */
export const BUDGET_INCONNU = "inconnu";

/**
 * Une tranche de budget, bornes en euros HT.
 *
 * `haut` absent = tranche ouverte vers le haut ; `bas` absent = tranche ouverte
 * vers le bas. Les deux absents : « je ne sais pas encore ».
 */
export interface TrancheBudget extends OptionQuestion {
  readonly bas?: number;
  readonly haut?: number;
}

/**
 * Prestations concernées par un type de rendez-vous.
 *
 * DÉDUIT DE `RDV_PAR_PRESTATION`, pas d'une seconde table : un type vers lequel
 * aucune prestation ne pointe (« decouverte ») les couvre toutes.
 */
export function prestationsDuRendezVous(id: IdRendezVous): readonly Prestation[] {
  const liees = prestations.filter((p) => RDV_PAR_PRESTATION[p.id] === id);
  return liees.length > 0 ? liees : prestations;
}

/**
 * Bornes des tranches, en ordre croissant.
 *
 * UNE PRESTATION : les prix de ses trois forfaits. Chaque tranche tombe alors
 * pile sur un palier, et le retour affiché ne ment sur aucun.
 *
 * PLUSIEURS (le rendez-vous « decouverte ») : le prix d'entrée de chacune,
 * puis les paliers de la plus chère. Reprendre tous les paliers de toutes les
 * prestations donnerait sept tranches, trop pour quelqu'un qui ne sait pas
 * encore ce qu'il cherche ; les entrées disent quelle famille est à portée, et
 * le détail reste là où les écarts se comptent en dizaines de milliers.
 */
export function bornesBudget(id: IdRendezVous): readonly number[] {
  const concernees = prestationsDuRendezVous(id);
  const montants =
    concernees.length === 1
      ? concernees[0].packs.map((pack) => pack.prix)
      : [
          ...concernees.map((p) => entree(p).prix),
          ...plusChere(concernees).packs.map((pack) => pack.prix),
        ];
  return [...new Set(montants)].sort((a, b) => a - b);
}

function entree(p: Prestation): Pack {
  return p.packs.reduce((a, b) => (a.prix <= b.prix ? a : b));
}

function plusChere(liste: readonly Prestation[]): Prestation {
  return liste.reduce((a, b) => (entree(a).prix >= entree(b).prix ? a : b));
}

/** Tranches proposées pour un type de rendez-vous, « je ne sais pas » en dernier. */
export function tranchesBudget(id: IdRendezVous): readonly TrancheBudget[] {
  const bornes = bornesBudget(id);
  const tranches: TrancheBudget[] = [];
  const premiere = bornes[0];
  const derniere = bornes[bornes.length - 1];

  tranches.push({
    id: `moins-${premiere}`,
    libelle: questions.budget.moinsDe(euros(premiere)),
    haut: premiere,
  });
  for (let i = 0; i < bornes.length - 1; i += 1) {
    const bas = bornes[i];
    const haut = bornes[i + 1];
    tranches.push({
      id: `${bas}-${haut}`,
      libelle: questions.budget.entre(euros(bas), euros(haut)),
      bas,
      haut,
    });
  }
  tranches.push({
    id: `plus-${derniere}`,
    libelle: questions.budget.plusDe(euros(derniere)),
    bas: derniere,
  });
  tranches.push({ id: BUDGET_INCONNU, libelle: questions.budget.inconnu });
  return tranches;
}

/** Objectifs proposés pour un type de rendez-vous. */
export function optionsObjectif(id: IdRendezVous): readonly OptionQuestion[] {
  return questions.objectif.options[id];
}

/** Échéances proposées, identiques pour tous les types. */
export const OPTIONS_ECHEANCE: readonly OptionQuestion[] = questions.echeance.options;

/** Une ligne du retour : le forfait le plus haut à portée dans une prestation. */
export interface LigneRetour {
  /** Nom de la prestation, posé seulement quand le retour en compte plusieurs. */
  readonly prestation?: string;
  readonly forfait: string;
  /** « 4 800 € HT », ou « À partir de 36 000 € HT » pour un palier sur mesure. */
  readonly prix: string;
  readonly promesse: string;
  /** Ce qui vient au-delà, quand le forfait est le haut de la grille ferme. */
  readonly complement?: string;
}

export type RetourBudget =
  | { readonly type: "inconnu"; readonly texte: string; readonly reperes: readonly string[] }
  | { readonly type: "aucun"; readonly texte: string }
  | { readonly type: "forfaits"; readonly lignes: readonly LigneRetour[] };

/**
 * Forfait le plus haut à portée d'une tranche, dans une prestation.
 *
 * « À PORTÉE » = PRIX STRICTEMENT SOUS LE HAUT DE LA TRANCHE. Sur les tranches
 * d'une seule prestation, qui tombent pile sur les paliers, cela revient au
 * forfait qui ouvre la tranche : « de 4 800 à 7 200 € » donne Le Site. Sur les
 * tranches larges du rendez-vous « decouverte », c'est ce qu'on peut viser en
 * haut de la tranche, ce qui se dit sans promettre : le prix est affiché.
 */
function forfaitAPortee(p: Prestation, tranche: TrancheBudget): Pack | undefined {
  const { haut } = tranche;
  const candidats = p.packs.filter((pack) => haut === undefined || pack.prix < haut);
  if (candidats.length === 0) return undefined;
  return candidats.reduce((a, b) => (a.prix >= b.prix ? a : b));
}

/** Phrase sur ce qui vient après le forfait retenu, s'il est en haut de la grille ferme. */
function complement(p: Prestation, pack: Pack): string | undefined {
  if (pack.surMesure) return retour.surMesure;
  const suivants = p.packs.filter((autre) => autre.prix > pack.prix);
  if (suivants.length === 0) return retour.horsForfait;
  const suivant = suivants.reduce((a, b) => (a.prix <= b.prix ? a : b));
  return suivant.surMesure
    ? retour.surMesureSuivant(suivant.nom, euros(suivant.prix))
    : undefined;
}

/**
 * Ce que le visiteur peut espérer avec la tranche choisie.
 *
 * `undefined` pour une tranche inconnue de ce type : le composant n'affiche
 * rien plutôt qu'un retour calculé sur une réponse périmée.
 */
export function retourBudget(
  id: IdRendezVous,
  idTranche: string,
): RetourBudget | undefined {
  const tranche = tranchesBudget(id).find((t) => t.id === idTranche);
  if (!tranche) return undefined;
  const concernees = prestationsDuRendezVous(id);

  if (tranche.id === BUDGET_INCONNU) {
    return {
      type: "inconnu",
      texte: retour.inconnu,
      reperes: concernees.map((p) => retour.repere(p.nom, fourchette(p.id))),
    };
  }

  const plusieurs = concernees.length > 1;
  const lignes: LigneRetour[] = [];
  for (const p of concernees) {
    const pack = forfaitAPortee(p, tranche);
    if (!pack) continue;
    // Le complément n'est écrit que pour UNE prestation : sur le rendez-vous
    // « decouverte », deux lignes suivies chacune de leur « au-delà » noyaient
    // l'essentiel, qui est le forfait à portée.
    const suite = plusieurs ? (pack.surMesure ? retour.surMesure : undefined) : complement(p, pack);
    lignes.push({
      ...(plusieurs ? { prestation: p.nom } : {}),
      forfait: pack.nom,
      prix: pack.surMesure
        ? retour.prixPlancher(euros(pack.prix))
        : retour.prixFerme(euros(pack.prix)),
      promesse: pack.promesse,
      ...(suite ? { complement: suite } : {}),
    });
  }

  if (lignes.length === 0) {
    const plancher = Math.min(...concernees.map((p) => entree(p).prix));
    return { type: "aucun", texte: retour.aucun(euros(plancher)) };
  }
  return { type: "forfaits", lignes };
}

/** Réponses validées au questionnaire, telles que le serveur les a acceptées. */
export interface ReponsesQuestionnaire {
  readonly type: IdRendezVous;
  readonly budget: string;
  readonly objectif: string;
  readonly echeance?: string;
  readonly message?: string;
}

function libelle(options: readonly OptionQuestion[], id: string): string {
  return options.find((option) => option.id === id)?.libelle ?? id;
}

/**
 * Texte déposé dans le champ `notes` de la réservation Cal.com.
 *
 * LISIBLE D'UN COUP D'ŒIL DANS UN AGENDA : une réponse par ligne, le forfait à
 * portée déjà calculé, puis le message libre après une ligne vide. Les
 * espaces insécables des montants sont ramenées à des espaces ordinaires :
 * certains clients de messagerie les affichent en `&nbsp;` dans le texte brut.
 */
export function composerNotes(reponses: ReponsesQuestionnaire): string {
  const { notes } = rendezVousContent;
  const retourCalcule = retourBudget(reponses.type, reponses.budget);
  let forfait: string = notes.aCaler;
  if (retourCalcule?.type === "aucun") forfait = notes.aucunForfait;
  if (retourCalcule?.type === "forfaits") {
    forfait = retourCalcule.lignes
      .map((ligne) =>
        `${ligne.prestation ? `${ligne.prestation} : ` : ""}${ligne.forfait}, ${ligne.prix}`,
      )
      .join(" · ");
  }

  const lignes = [
    `${notes.budget} : ${libelle(tranchesBudget(reponses.type), reponses.budget)}`,
    `${notes.forfait} : ${forfait}`,
    `${notes.objectif} : ${libelle(optionsObjectif(reponses.type), reponses.objectif)}`,
  ];
  if (reponses.echeance) {
    lignes.push(`${notes.echeance} : ${libelle(OPTIONS_ECHEANCE, reponses.echeance)}`);
  }
  const texte = lignes.join("\n").replace(/\u00a0|\u202f/gu, " ");
  return reponses.message ? `${texte}\n\n${reponses.message}` : texte;
}
