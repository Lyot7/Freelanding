/**
 * Questionnaire de la prise de rendez-vous : tranches de budget, retour « ce
 * que vous pouvez espérer à ce budget », et mise en forme des notes Cal.com.
 *
 * POURQUOI CE MODULE. Eliott veut recevoir des demandes déjà cadrées, et le
 * visiteur doit savoir avant l'appel à quoi s'attendre. Depuis le 2026-11-01, le
 * site ne cite plus aucun prix d'Eliott : les tranches posent la question du
 * budget du visiteur sans laisser deviner un plancher, et aucun retour ne le
 * nomme. Le seuil de `BORNES_BUDGET` reste interne : il classe la demande dans
 * les notes qu'Eliott lit dans son agenda.
 *
 * MODULE PUR, partagé par le navigateur (retour immédiat) et par le serveur
 * (validation en liste fermée, composition des notes). Ni réseau, ni horloge,
 * ni `process.env`.
 */
import { euros, prestations } from "@/content/offre";
import type { Offre } from "@/content/offre";
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
 * Offres concernées par un type de rendez-vous : un type vers lequel aucune
 * offre ne pointe (« decouverte ») couvre toutes les prestations.
 */
export function offresDuRendezVous(id: IdRendezVous): readonly Offre[] {
  const liees: Offre[] = prestations.filter((p) => RDV_PAR_PRESTATION[p.id] === id);
  return liees.length > 0 ? liees : prestations;
}

/**
 * BORNES DES TRANCHES, en euros HT, décorrélées de tout prix d'Eliott depuis le
 * 2026-11-01 : le visiteur situe son budget, et aucune borne ne se lit comme un
 * tarif. La première sert de seuil interne (`RetourBudget`, notes de l'agenda).
 */
export const BORNES_BUDGET = [5000, 10000, 25000] as const;

/** Tranches proposées, identiques pour tous les sujets, « je ne sais pas » en dernier. */
export function tranchesBudget(): readonly TrancheBudget[] {
  const bornes = BORNES_BUDGET;
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

/**
 * LES TRANCHES RETIRÉES, et leur borne basse. Un onglet ouvert avant un changement
 * de tranches les envoie encore, et son ancien bundle ne propose qu'elles : les
 * refuser bloquerait la réservation jusqu'au rechargement. Retirables quand plus
 * aucun onglet de cette époque ne peut être ouvert.
 */
const TRANCHES_RETIREES: Readonly<Record<string, number>> = {
  "3000-4800": 3000,
  "4800-7200": 4800,
  "plus-7200": 7200,
  "6000-18000": 6000,
  "18000-36000": 18000,
  "plus-36000": 36000,
  "moins-3000": 0,
  "moins-3500": 0,
  "3000-3500": 3000,
  "3000-6000": 3000,
  "3500-7000": 3500,
  "7000-14000": 7000,
  "plus-14000": 14000,
  /* Les tranches servies jusqu'au 2026-11-01. */
  "moins-6000": 0,
  "6000-12000": 6000,
  "12000-24000": 12000,
  "plus-24000": 24000,
};

/**
 * Ramène une tranche retirée à la tranche actuelle qui contient sa borne
 * basse. Toute autre valeur revient telle quelle, à valider par la liste.
 */
export function rattacherTranche(valeur: string): string {
  if (!Object.hasOwn(TRANCHES_RETIREES, valeur)) return valeur;
  const tranches = tranchesBudget();
  const montant = TRANCHES_RETIREES[valeur];
  const tranche = tranches.find(
    (t) => t.id !== BUDGET_INCONNU && (t.bas ?? 0) <= montant && (t.haut === undefined || montant < t.haut),
  );
  return tranche?.id ?? valeur;
}

/**
 * LES OBJECTIFS RETIRÉS LE 2026-10-31 avec le site et le CTO. Un onglet ouvert
 * avant le déploiement les envoie encore : les refuser ferait perdre le
 * rendez-vous ou le message. Ils se rangent sous « Autre chose ». « ia » est
 * revenu le 2026-11-01 : installer l'IA est l'un des trois moyens de l'accueil.
 */
const OBJECTIFS_RETIRES: readonly string[] = [
  "google",
  "demandes",
  "concurrents",
  "remplacer",
  "mails",
  "saisie",
  "redaction",
  "documents",
  "decisions",
  "devis",
  "equipe",
];

/** Ramène un objectif retiré sur « autre » ; toute autre valeur revient telle quelle. */
export function rattacherObjectif(valeur: string): string {
  return OBJECTIFS_RETIRES.includes(valeur) ? "autre" : valeur;
}

/** Objectifs proposés pour un type de rendez-vous. */
export function optionsObjectif(id: IdRendezVous): readonly OptionQuestion[] {
  return questions.objectif.options[id];
}

/** Légende de la question d'objectif. */
export const LEGENDE_OBJECTIF = questions.objectif.legende;

/** Échéances proposées, identiques pour tous les types. */
export const OPTIONS_ECHEANCE: readonly OptionQuestion[] = questions.echeance.options;

/**
 * Le retour affiché sous la question du budget.
 *
 * `serre` : sous le seuil interne, jamais nommé au visiteur. `large` : la tranche
 * ouverte vers le haut. Aucun texte ne porte de montant : le prix se fixe au devis.
 */
export interface RetourBudget {
  readonly type: "inconnu" | "serre" | "aPortee" | "large";
  readonly texte: string;
}

/**
 * Ce que le visiteur peut attendre avec la tranche choisie.
 *
 * `undefined` pour une tranche inconnue : le composant n'affiche rien plutôt
 * qu'un retour calculé sur une réponse périmée.
 */
export function retourBudget(idTranche: string): RetourBudget | undefined {
  const tranche = tranchesBudget().find((t) => t.id === idTranche);
  if (!tranche) return undefined;
  if (tranche.id === BUDGET_INCONNU) return { type: "inconnu", texte: retour.inconnu };
  if (tranche.haut === undefined) return { type: "large", texte: retour.large };
  if (tranche.haut <= BORNES_BUDGET[0]) return { type: "serre", texte: retour.serre };
  return { type: "aPortee", texte: retour.aPortee };
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
  const lignes: string[] = [];
  const retourCalcule = retourBudget(reponses.budget);
  let forfait: string = offresDuRendezVous(reponses.type).map((p) => p.nom).join(" · ");
  if (!retourCalcule || retourCalcule.type === "inconnu") forfait = notes.aCaler;
  if (retourCalcule?.type === "serre") forfait = notes.aucunForfait;
  lignes.push(
    `${notes.budget} : ${libelle(tranchesBudget(), reponses.budget)}`,
    `${notes.forfait} : ${forfait}`,
  );
  lignes.push(
    `${notes.objectif} : ${libelle(optionsObjectif(reponses.type), reponses.objectif)}`,
  );
  if (reponses.echeance) {
    lignes.push(`${notes.echeance} : ${libelle(OPTIONS_ECHEANCE, reponses.echeance)}`);
  }
  const texte = lignes.join("\n").replace(/\u00a0|\u202f/gu, " ");
  return reponses.message ? `${texte}\n\n${reponses.message}` : texte;
}

/**
 * Type de projet du formulaire de contact → questionnaire du rendez-vous.
 *
 * Le formulaire de `/contact` pose les mêmes questions que la prise de
 * rendez-vous (budget, objectif, échéance), avec les mêmes listes : Eliott lit
 * des demandes écrites comme ses réservations. « Je ne sais pas encore », et
 * toute valeur absente d'ici, retombent sur le rendez-vous « decouverte », qui
 * couvre toutes les prestations.
 */
const RDV_PAR_TYPE_PROJET: Readonly<Record<string, IdRendezVous>> = {
  "Un logiciel métier": "logiciel",
  /* Un onglet ouvert avant le 2026-10-31 envoie encore l'ancien libellé. */
  "Une solution métier": "logiciel",
};

export function rendezVousDuTypeProjet(typeProjet: string): IdRendezVous {
  return Object.hasOwn(RDV_PAR_TYPE_PROJET, typeProjet)
    ? RDV_PAR_TYPE_PROJET[typeProjet]
    : "decouverte";
}

/** Libellé d'une réponse, ou `undefined` si l'identifiant n'est pas dans la liste. */
export function libelleOption(
  options: readonly OptionQuestion[],
  id: string,
): string | undefined {
  return options.find((option) => option.id === id)?.libelle;
}
