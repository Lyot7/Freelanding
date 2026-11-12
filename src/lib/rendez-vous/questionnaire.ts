/**
 * Ce que la prise de rendez-vous et le formulaire de contact se partagent : les
 * tranches de budget, l'objectif et l'échéance du contact, et la mise en forme
 * des notes d'un rendez-vous.
 *
 * LA RÉSERVATION NE POSE PLUS DE QUESTIONNAIRE depuis le 2026-11-12 : sujet,
 * créneau, coordonnées, une ligne libre. Le cadrage en dix questions de
 * 2026-11-10 est retiré, il décourageait la prise de rendez-vous.
 *
 * Aucun prix d'Eliott ici : les tranches posent la question du budget du
 * visiteur sans laisser deviner un plancher.
 *
 * MODULE PUR, partagé par le navigateur et par le serveur. Ni réseau, ni
 * horloge, ni `process.env`.
 */
import { euros } from "@/content/offre";
import { rendezVousContent } from "@/content/rendez-vous";
import type { IdObjectif, IdRendezVous, OptionQuestion } from "@/content/rendez-vous";

const questions = rendezVousContent.questionnaire;

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
 * LES OBJECTIFS RETIRÉS LE 2026-10-31 avec le site, l'IA et le CTO. Un onglet
 * ouvert avant le déploiement les envoie encore : les refuser ferait perdre le
 * rendez-vous ou le message. Ils se rangent sous « Autre chose ».
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
  "ia",
  "equipe",
];

/** Ramène un objectif retiré sur « autre » ; toute autre valeur revient telle quelle. */
export function rattacherObjectif(valeur: string): string {
  return OBJECTIFS_RETIRES.includes(valeur) ? "autre" : valeur;
}

/** Objectifs proposés pour un type de rendez-vous. */
export function optionsObjectif(id: IdObjectif): readonly OptionQuestion[] {
  return questions.objectif.options[id];
}

/** Légende de la question d'objectif. */
export const LEGENDE_OBJECTIF = questions.objectif.legende;

/** Longueur maximale de la ligne libre de la réservation. */
export const LONGUEUR_LIGNE_MAX = 1_500;

/** Échéances proposées par le formulaire de contact. */
export const OPTIONS_ECHEANCE: readonly OptionQuestion[] = questions.echeance.options;

/** Ce qu'une réservation transmet à Eliott, tel que le serveur l'a validé. */
export interface ReponsesReservation {
  readonly type: IdRendezVous;
  /** Absent pour un rendez-vous de client, qui n'a pas à le donner. */
  readonly telephone?: string;
  /** La ligne libre : le projet en une phrase, facultative. */
  readonly message?: string;
}

/**
 * Intitulé de la ligne du téléphone. Écrit ici et non dans le contenu : la
 * ligne n'est lue que par Eliott, dans son agenda.
 */
export const LIBELLE_NOTE_TELEPHONE = "Téléphone";

/**
 * Réponses en clair pour le cockpit (`reponses` de la réservation).
 *
 * `coince` est la clé que le cockpit reprend dans le mail de confirmation
 * (`src/lib/rdv/textes.ts` du cockpit) : la ligne libre y porte. Ne pas la
 * renommer d'un seul côté.
 */
export function reponsesLisibles(reponses: ReponsesReservation): Record<string, string> {
  const lisibles: Record<string, string> = {};
  if (reponses.message) lisibles.coince = reponses.message.replace(/\s+/gu, " ");
  return lisibles;
}

/**
 * Texte déposé dans le champ `notes` de la réservation (cockpit, puis Google
 * Agenda) : le téléphone en tête, c'est la seule coordonnée que l'événement
 * ne porte pas déjà, puis la ligne libre.
 */
export function composerNotes(reponses: ReponsesReservation): string {
  const lignes: string[] = [];
  if (reponses.telephone) lignes.push(`${LIBELLE_NOTE_TELEPHONE} : ${reponses.telephone}`);
  if (reponses.message) lignes.push(...(lignes.length > 0 ? [""] : []), reponses.message);
  return lignes.join("\n");
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
const RDV_PAR_TYPE_PROJET: Readonly<Record<string, IdObjectif>> = {
  "Un logiciel métier": "logiciel",
  /* Un onglet ouvert avant le 2026-10-31 envoie encore l'ancien libellé. */
  "Une solution métier": "logiciel",
};

export function rendezVousDuTypeProjet(typeProjet: string): IdObjectif {
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
