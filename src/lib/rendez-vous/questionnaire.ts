/**
 * Questionnaire de la prise de rendez-vous : tranches de budget, retour « ce
 * que vous pouvez espérer à ce budget », et mise en forme des notes Cal.com.
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
 * MULTIPLES DU PLANCHER QUI BORNENT LES TRANCHES, depuis le 2026-10-05. Les
 * bornes tombaient sur les prix des trois forfaits ; les forfaits partis, il
 * reste le plancher de chaque offre. Le doubler puis le quadrupler donne trois
 * tranches au-dessus de lui, assez pour qu'Eliott lise le budget avant
 * l'appel, sans qu'aucune ne se présente comme un prix : le prix se fixe au
 * devis.
 */
const MULTIPLES_PLANCHER = [1, 2, 4] as const;

/** Bornes des tranches, en ordre croissant : le plancher, puis ses multiples. */
export function bornesBudget(id: IdRendezVous): readonly number[] {
  const haute = plusChere(offresDuRendezVous(id));
  return MULTIPLES_PLANCHER.map((m) => haute.plancher * m);
}

function plusChere(liste: readonly Offre[]): Offre {
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

/**
 * LES TRANCHES DES FORFAITS À PRIX FERME, publiées jusqu'au 2026-10-05 avec
 * leur borne basse. Un onglet ouvert avant le passage aux planchers les envoie
 * encore, et son ancien bundle ne propose qu'elles : les refuser bloquerait la
 * réservation jusqu'au rechargement. Retirables quand plus aucun onglet de
 * cette époque ne peut être ouvert.
 */
const TRANCHES_RETIREES: Readonly<Record<string, number>> = {
  "3000-4800": 3000,
  "4800-7200": 4800,
  "plus-7200": 7200,
  "6000-18000": 6000,
  "18000-36000": 18000,
  "plus-36000": 36000,
  /*
   * LES TRANCHES DU LOGICIEL À 3 500 € ET CELLES DU SITE, publiées jusqu'au
   * 2026-10-31. « moins-6000 » et « 6000-12000 » restent servies.
   */
  "moins-3000": 0,
  "moins-3500": 0,
  "3000-3500": 3000,
  "3000-6000": 3000,
  "3500-7000": 3500,
  "7000-14000": 7000,
  "plus-14000": 14000,
};

/**
 * Ramène une tranche retirée à la tranche actuelle qui contient sa borne
 * basse. Toute autre valeur revient telle quelle, à valider par la liste.
 */
export function rattacherTranche(id: IdRendezVous, valeur: string): string {
  if (!Object.hasOwn(TRANCHES_RETIREES, valeur)) return valeur;
  const tranches = tranchesBudget(id);
  if (tranches.some((t) => t.id === valeur)) return valeur;
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
export function optionsObjectif(id: IdRendezVous): readonly OptionQuestion[] {
  return questions.objectif.options[id];
}

/** Légende de la question d'objectif. */
export const LEGENDE_OBJECTIF = questions.objectif.legende;

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
  const concernees = offresDuRendezVous(id);

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
  const lignes: string[] = [];
  const retourCalcule = retourBudget(reponses.type, reponses.budget);
  let forfait: string = notes.aCaler;
  if (retourCalcule?.type === "aucun") forfait = notes.aucunForfait;
  if (retourCalcule?.type === "aPortee") {
    forfait = retourCalcule.lignes.map((ligne) => ligne.prestation).join(" · ");
  }
  lignes.push(
    `${notes.budget} : ${libelle(tranchesBudget(reponses.type), reponses.budget)}`,
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
