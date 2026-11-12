/**
 * Grille de l'outil de chiffrage : des composants d'un projet à une FOURCHETTE
 * de prix, puis aux deux façons de payer (achat direct, abonnement 12 ou 24 mois).
 *
 * CALCUL DÉTERMINISTE, SEUL. Le modèle d'IA, quand il tourne, ne fait
 * qu'EXTRAIRE des composants (`Composants`) depuis la description ; il ne voit
 * jamais un prix. Sans IA, les boutons seuls donnent des composants par défaut
 * (`composantsParDefaut`) et le flou maximal, donc une fourchette plus large.
 *
 * D'OÙ VIENNENT LES JOURS. Calibrés sur les affaires réellement chiffrées par
 * Eliott (`~/vault/wiki/business/offre-grille-prix.md`) :
 *   - Transports Crouvezier, logiciel, deux processus, une connexion : ~13 j ;
 *   - Bertrand Pneus, logiciel complet, huit modules, trois connexions : ~36 j ;
 *   - Navicom, site avec boutique et accès distributeurs : ~18 j ;
 *   - Normandie Broc, site : 8 j ;
 *   - Aurore André, site simple : ~4,5 j.
 * Les tests de `grille.test.mjs` rejouent ces cinq cas.
 *
 * JAMAIS AFFICHÉS : le taux journalier et les jours. Ils ne sortent pas de ce
 * module (`Estimation` ne les porte pas) : le visiteur voit une fourchette en
 * euros, rien qui permette de remonter au temps passé.
 */

export const TYPES_PROJET = ["logiciel", "site", "ia", "autre"] as const;
export type TypeProjet = (typeof TYPES_PROJET)[number];

export const TAILLES_EQUIPE = ["1-5", "6-20", "21-50", "50+"] as const;
export type TailleEquipe = (typeof TAILLES_EQUIPE)[number];

export const OUTILS_ACTUELS = ["papier", "logiciel", "plusieurs", "rien"] as const;
export type OutilsActuels = (typeof OUTILS_ACTUELS)[number];

export const URGENCES = ["urgent", "trimestre", "libre"] as const;
export type Urgence = (typeof URGENCES)[number];

export const NIVEAUX_FLOU = ["faible", "moyen", "fort"] as const;
export type NiveauFlou = (typeof NIVEAUX_FLOU)[number];

/** Ce que le visiteur choisit par boutons. */
export interface Reponses {
  readonly type: TypeProjet;
  readonly equipe: TailleEquipe;
  readonly outils: OutilsActuels;
  readonly urgence: Urgence;
}

/**
 * Le projet décomposé. C'est la seule forme que l'IA rend, et la seule que la
 * grille lit. Chaque nombre est borné par `bornerComposants`.
 */
export interface Composants {
  /** Pages d'un site (logiciel : écrans publics éventuels, ignorés). */
  readonly pages: number;
  /** Processus ou modules métier d'un logiciel (devis, planning, stock…). */
  readonly modules: number;
  /** Outils externes à relier : comptabilité, API, import de fichiers. */
  readonly connexions: number;
  /** Personnes qui se connectent à l'outil. */
  readonly utilisateurs: number;
  /** Tâches confiées à une IA (lire un document, rédiger, classer…). */
  readonly usagesIA: number;
  /** Boutique en ligne ou paiement. */
  readonly boutique: boolean;
  /** Espace client, espace partenaire ou accès réservé. */
  readonly espacePrive: boolean;
  /** Site ou outil en plusieurs langues. */
  readonly multilingue: boolean;
  /** Part d'inconnu du besoin décrit. */
  readonly flou: NiveauFlou;
}

/* ─── Les constantes de la grille ───────────────────────────────────────── */

/** Prix d'un jour réel, marge comprise : cible proche de 550, jamais sous 400. */
export const TAUX_JOUR = 550;
export const PLANCHER_JOUR = 400;

/** Jours fixes par type : cadrage, base technique, mise en ligne. */
const BASE_JOURS: Readonly<Record<TypeProjet, number>> = {
  logiciel: 4,
  site: 3,
  ia: 2.5,
  autre: 3,
};

const JOURS = {
  /** Page de site au-delà des cinq comprises dans la base. */
  pageSupplementaire: 0.4,
  pagesIncluses: 5,
  /** Module ou processus métier complet (écrans, règles, données). */
  module: 3,
  connexion: 2,
  usageIA: 3,
  boutique: 5,
  espacePrive: 4,
  multilingue: 2,
} as const;

/** Rôles et droits à gérer selon le nombre de personnes connectées. */
function joursUtilisateurs(utilisateurs: number): number {
  if (utilisateurs > 50) return 4;
  if (utilisateurs > 20) return 2;
  if (utilisateurs > 5) return 1;
  return 0;
}

/** Écart de la fourchette autour de l'estimation centrale, selon le flou. */
const ECART: Readonly<Record<NiveauFlou, { readonly bas: number; readonly haut: number }>> = {
  faible: { bas: 0.1, haut: 0.2 },
  moyen: { bas: 0.12, haut: 0.35 },
  fort: { bas: 0.15, haut: 0.6 },
};

/** Un délai de moins d'un mois se paie : d'autres projets attendent. */
const MAJORATION_URGENCE = 0.15;

/** Prix bas minimal par type, sous lequel on ne fait pas de proposition. */
const PRIX_MINIMUM: Readonly<Record<TypeProjet, number>> = {
  logiciel: 4_500,
  site: 1_500,
  ia: 2_000,
  autre: 1_500,
};

/** Au-delà, l'outil n'affiche plus de haut de fourchette : c'est un grand projet. */
export const SEUIL_GRAND_PROJET = 60_000;

/** Bornes de ce que la grille accepte, d'où que viennent les nombres. */
const BORNES = {
  pages: 40,
  modules: 12,
  connexions: 8,
  utilisateurs: 500,
  usagesIA: 5,
} as const;

/* ─── Maintenance et abonnement (grille du 2026-10-05 et du 2026-11-12) ── */

/** Maintenance annuelle en part du prix, et plancher mensuel HT. */
const MAINTENANCE: Readonly<Record<TypeProjet, { readonly taux: number; readonly minimum: number }>> = {
  logiciel: { taux: 0.18, minimum: 125 },
  ia: { taux: 0.18, minimum: 125 },
  autre: { taux: 0.18, minimum: 125 },
  site: { taux: 0.15, minimum: 90 },
};

/**
 * Suivi mensuel d'un abonnement. Logiciel et IA : repères du 2026-11-12 (Outil
 * 6 000 → 190, Logiciel 12 000 → 390), qui comprennent des heures d'évolution
 * chaque mois. Site : la maintenance du site.
 */
const SUIVI_ABONNEMENT: Readonly<Record<TypeProjet, { readonly tauxMensuel: number; readonly minimum: number }>> = {
  logiciel: { tauxMensuel: 0.0325, minimum: 190 },
  ia: { tauxMensuel: 0.0325, minimum: 190 },
  autre: { tauxMensuel: 0.0325, minimum: 190 },
  site: { tauxMensuel: 0.15 / 12, minimum: 90 },
};

/** Mise en route : un tiers de la valeur, jamais moins de 30 %. */
export const PART_MISE_EN_ROUTE = 1 / 3;
export const DUREES_ENGAGEMENT = [12, 24] as const;
export type DureeEngagement = (typeof DUREES_ENGAGEMENT)[number];

/* ─── Résultat ──────────────────────────────────────────────────────────── */

export interface Fourchette {
  readonly bas: number;
  /** `undefined` quand le haut dépasse `SEUIL_GRAND_PROJET`. */
  readonly haut: number | undefined;
}

export interface Abonnement {
  readonly duree: DureeEngagement;
  readonly miseEnRoute: Fourchette;
  /** Mensualité pendant l'engagement, suivi compris. */
  readonly mensualite: Fourchette;
  /** Ce qui reste à payer chaque mois une fois l'engagement fini. */
  readonly suiviApres: Fourchette;
}

export interface Estimation {
  readonly type: TypeProjet;
  readonly prix: Fourchette;
  readonly maintenance: Fourchette;
  readonly abonnements: readonly [Abonnement, Abonnement];
  /** Le besoin est trop flou ou trop gros pour donner un haut de fourchette. */
  readonly grandProjet: boolean;
}

/* ─── Calcul ────────────────────────────────────────────────────────────── */

function entierBorne(valeur: number, max: number): number {
  if (!Number.isFinite(valeur)) return 0;
  return Math.min(max, Math.max(0, Math.round(valeur)));
}

/** Ramène des composants venus d'ailleurs (IA, formulaire) dans les bornes. */
export function bornerComposants(c: Composants): Composants {
  return {
    pages: entierBorne(c.pages, BORNES.pages),
    modules: entierBorne(c.modules, BORNES.modules),
    connexions: entierBorne(c.connexions, BORNES.connexions),
    utilisateurs: entierBorne(c.utilisateurs, BORNES.utilisateurs),
    usagesIA: entierBorne(c.usagesIA, BORNES.usagesIA),
    boutique: c.boutique === true,
    espacePrive: c.espacePrive === true,
    multilingue: c.multilingue === true,
    flou: NIVEAUX_FLOU.includes(c.flou) ? c.flou : "fort",
  };
}

const UTILISATEURS_PAR_EQUIPE: Readonly<Record<TailleEquipe, number>> = {
  "1-5": 4,
  "6-20": 12,
  "21-50": 35,
  "50+": 80,
};

/**
 * Composants supposés quand on n'a que les boutons. Le flou est toujours
 * « fort » : la fourchette s'élargit d'elle-même, ce qui est honnête.
 */
export function composantsParDefaut(r: Reponses): Composants {
  const utilisateurs = UTILISATEURS_PAR_EQUIPE[r.equipe];
  const connexions = r.outils === "plusieurs" ? 2 : r.outils === "logiciel" ? 1 : 0;
  const modulesParEquipe: Readonly<Record<TailleEquipe, number>> = {
    "1-5": 2,
    "6-20": 3,
    "21-50": 4,
    "50+": 5,
  };
  return {
    pages: 6,
    modules: r.type === "logiciel" || r.type === "autre" ? modulesParEquipe[r.equipe] : 0,
    connexions: r.type === "site" ? 0 : connexions,
    utilisateurs,
    usagesIA: r.type === "ia" ? 1 : 0,
    boutique: false,
    espacePrive: false,
    multilingue: false,
    flou: "fort",
  };
}

/**
 * Indices lus dans la description sans IA, par mots-clés. Ils ne font
 * qu'ajouter ce que le visiteur a nommé ; ils ne retirent jamais rien.
 */
export function indicesTexte(description: string, base: Composants): Composants {
  const texte = description.toLowerCase();
  const mentionne = (motif: RegExp) => motif.test(texte);
  return {
    ...base,
    boutique: base.boutique || mentionne(/boutique|e-?commerce|paiement en ligne|vente en ligne|panier/),
    espacePrive:
      base.espacePrive ||
      mentionne(/espace (client|membre|partenaire|pro)|extranet|accès (réservé|distributeur)|connexion client/),
    multilingue: base.multilingue || mentionne(/multilingue|plusieurs langues|en anglais|traduction/),
    usagesIA: Math.max(base.usagesIA, mentionne(/\bia\b|intelligence artificielle|chatgpt|gpt|automatiquement/) ? 1 : 0),
  };
}

/** Jours réels estimés, marge comprise, au centre de la fourchette. */
export function joursEstimes(type: TypeProjet, brut: Composants): number {
  const c = bornerComposants(brut);
  let jours = BASE_JOURS[type];
  if (type === "site") {
    jours += Math.max(0, c.pages - JOURS.pagesIncluses) * JOURS.pageSupplementaire;
  } else {
    jours += c.modules * JOURS.module;
    jours += joursUtilisateurs(c.utilisateurs);
  }
  jours += c.connexions * JOURS.connexion;
  jours += c.usagesIA * JOURS.usageIA;
  if (c.boutique) jours += JOURS.boutique;
  if (c.espacePrive) jours += JOURS.espacePrive;
  if (c.multilingue) jours += JOURS.multilingue;
  return jours;
}

/** Arrondi commercial : à la centaine sous 5 000 €, au demi-millier au-delà. */
function pas(valeur: number): number {
  return valeur < 5_000 ? 100 : 500;
}
const arrondiBas = (v: number) => Math.floor(v / pas(v)) * pas(v);
const arrondiHaut = (v: number) => Math.ceil(v / pas(v)) * pas(v);
const arrondi5 = (v: number) => Math.ceil(v / 5) * 5;
const arrondi10 = (v: number) => Math.ceil(v / 10) * 10;

function mensuel(prix: number, taux: number, minimum: number): number {
  return Math.max(minimum, arrondi5(prix * taux));
}

/**
 * Applique une fonction aux deux bornes d'une fourchette de prix. Un grand
 * projet n'a pas de haut : ni pour le prix, ni pour ce qui en dérive.
 */
function derive(prixBas: number, prixHaut: number, f: (prix: number) => number): Fourchette {
  return { bas: f(prixBas), haut: prixHaut > SEUIL_GRAND_PROJET ? undefined : f(prixHaut) };
}

function abonnement(type: TypeProjet, prixBas: number, prixHaut: number, duree: DureeEngagement): Abonnement {
  const miseEnRoute = (prix: number) => arrondi10(prix * PART_MISE_EN_ROUTE);
  const suivi = (prix: number) =>
    mensuel(prix, SUIVI_ABONNEMENT[type].tauxMensuel, SUIVI_ABONNEMENT[type].minimum);
  return {
    duree,
    miseEnRoute: derive(prixBas, prixHaut, miseEnRoute),
    mensualite: derive(prixBas, prixHaut, (prix) => arrondi10((prix - miseEnRoute(prix)) / duree) + suivi(prix)),
    suiviApres: derive(prixBas, prixHaut, suivi),
  };
}

/**
 * La fourchette complète. `composants` absent = boutons seuls.
 */
export function estimer(reponses: Reponses, composants?: Composants): Estimation {
  const type = reponses.type;
  const c = bornerComposants(composants ?? composantsParDefaut(reponses));
  const urgence = reponses.urgence === "urgent" ? 1 + MAJORATION_URGENCE : 1;
  const centre = joursEstimes(type, c) * urgence;
  const ecart = ECART[c.flou];

  const joursBas = centre * (1 - ecart.bas);
  const joursHaut = centre * (1 + ecart.haut);
  // Le plancher de 400 € par jour s'applique au bas : la cible est au-dessus,
  // mais l'arrondi et le minimum par type ne doivent jamais passer dessous.
  const prixBas = Math.max(
    PRIX_MINIMUM[type],
    arrondiBas(joursBas * TAUX_JOUR),
    arrondiHaut(joursBas * PLANCHER_JOUR),
  );
  const prixHaut = Math.max(prixBas + pas(prixBas), arrondiHaut(joursHaut * TAUX_JOUR));

  const maintenance = (prix: number) => mensuel(prix, MAINTENANCE[type].taux / 12, MAINTENANCE[type].minimum);
  const grandProjet = prixHaut > SEUIL_GRAND_PROJET;

  return {
    type,
    prix: derive(prixBas, prixHaut, (prix) => prix),
    maintenance: derive(prixBas, prixHaut, maintenance),
    abonnements: [abonnement(type, prixBas, prixHaut, 12), abonnement(type, prixBas, prixHaut, 24)],
    grandProjet,
  };
}
