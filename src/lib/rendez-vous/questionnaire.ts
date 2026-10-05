/**
 * Questionnaire de la prise de rendez-vous : tranches de budget, retour « ce
 * que tu peux espérer à ce budget », et mise en forme des notes Cal.com.
 *
 * POURQUOI CE MODULE. Eliott veut recevoir des demandes déjà en partie
 * chiffrées, et le visiteur doit savoir avant l'appel ce que son budget permet.
 * Les deux lisent les MÊMES planchers, ceux de `src/content/offre.ts` : les
 * tranches de budget en sont dérivées, jamais écrites à la main. Un plancher
 * qui bouge là-bas déplace les tranches, le retour affiché et les notes
 * reçues, sans qu'une ligne change ici.
 *
 * MODULE PUR, partagé par le navigateur (retour immédiat) et par le serveur
 * (validation en liste fermée, composition des notes). Ni réseau, ni horloge,
 * ni `process.env`.
 */
import { aPartirDe, euros, prestations } from "@/content/offre";
import type { Prestation } from "@/content/offre";
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
 * MULTIPLES DU PLANCHER QUI BORNENT LES TRANCHES, depuis le 2026-10-05. Les
 * bornes tombaient sur les prix des trois forfaits ; les forfaits partis, il
 * reste le plancher de chaque offre. Le doubler puis le quadrupler donne trois
 * tranches au-dessus de lui, assez pour qu'Eliott lise le budget avant
 * l'appel, sans qu'aucune ne se présente comme un prix : le prix se fixe au
 * devis.
 */
const MULTIPLES_PLANCHER = [1, 2, 4] as const;

/**
 * Bornes des tranches, en ordre croissant.
 *
 * UNE PRESTATION : son plancher, puis ses multiples.
 *
 * PLUSIEURS (le rendez-vous « decouverte ») : le plancher de chacune, puis les
 * multiples de la plus chère. Ce qui dit quelle famille est à portée, sans
 * multiplier les tranches.
 */
export function bornesBudget(id: IdRendezVous): readonly number[] {
  const concernees = prestationsDuRendezVous(id);
  const haute = plusChere(concernees);
  const montants = [
    ...concernees.map((p) => p.plancher),
    ...MULTIPLES_PLANCHER.map((m) => haute.plancher * m),
  ];
  return [...new Set(montants)].sort((a, b) => a - b);
}

function plusChere(liste: readonly Prestation[]): Prestation {
  return liste.reduce((a, b) => (a.plancher >= b.plancher ? a : b));
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

/** Une ligne du retour : une prestation dont le plancher tient dans le budget. */
export interface LigneRetour {
  readonly prestation: string;
  /** « À partir de 3 000 € HT ». */
  readonly prix: string;
  readonly texte: string;
}

export type RetourBudget =
  | { readonly type: "inconnu"; readonly texte: string; readonly reperes: readonly string[] }
  | { readonly type: "aucun"; readonly texte: string }
  | { readonly type: "aPortee"; readonly lignes: readonly LigneRetour[] };

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
      reperes: concernees.map((p) => retour.repere(p.nom, aPartirDe(p, " HT"))),
    };
  }

  /*
   * « À PORTÉE » = PLANCHER STRICTEMENT SOUS LE HAUT DE LA TRANCHE, comme
   * avant avec les forfaits. Sur la tranche ouverte vers le haut, le texte dit
   * que le budget laisse de la place ; sinon, que le plancher est couvert et
   * que le reste se voit à l'appel.
   */
  const { haut } = tranche;
  const lignes: LigneRetour[] = concernees
    .filter((p) => haut === undefined || p.plancher < haut)
    .map((p) => ({
      prestation: p.nom,
      prix: retour.prixPlancher(euros(p.plancher)),
      texte: haut === undefined ? retour.large : retour.aPortee,
    }));

  if (lignes.length === 0) {
    const plancher = Math.min(...concernees.map((p) => p.plancher));
    return { type: "aucun", texte: retour.aucun(euros(plancher)) };
  }
  return { type: "aPortee", lignes };
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
 * LISIBLE D'UN COUP D'ŒIL DANS UN AGENDA : une réponse par ligne, ce qui est
 * à portée déjà calculé, puis le message libre après une ligne vide. Les
 * espaces insécables des montants sont ramenées à des espaces ordinaires :
 * certains clients de messagerie les affichent en `&nbsp;` dans le texte brut.
 */
export function composerNotes(reponses: ReponsesQuestionnaire): string {
  const { notes } = rendezVousContent;
  const retourCalcule = retourBudget(reponses.type, reponses.budget);
  let forfait: string = notes.aCaler;
  if (retourCalcule?.type === "aucun") forfait = notes.aucunForfait;
  if (retourCalcule?.type === "aPortee") {
    forfait = retourCalcule.lignes
      .map((ligne) => ligne.prestation)
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
