/**
 * Lecture et mise en forme des créneaux Cal.com.
 *
 * MODULE PUR : aucune requête, aucune horloge globale. L'instant courant est
 * toujours injecté. C'est ce qui rend `creneaux.test.mjs` possible sans réseau
 * et sans dépendre du jour où les tests tournent.
 *
 * TOUT EST À L'HEURE DE PARIS, et c'est un choix, pas un oubli. Le fuseau du
 * visiteur serait plus poli, mais il fait diverger ce que le prospect voit de
 * ce qu'Eliott lit dans son agenda, et une réservation prise « à 15 h » qui
 * tombe à 9 h chez l'un des deux est une réunion manquée. Le fuseau est donc
 * fixe et ANNONCÉ à l'écran (`rendezVousContent.noteFuseau`).
 *
 * DEUX FORMES DE RÉPONSE sont acceptées par `lireCreneaux`, parce que l'API v2
 * en a servi deux selon la version d'en-tête :
 *
 *   { "2026-09-01": [{ "start": "2026-09-01T15:00:00.000+02:00" }] }
 *   { "2026-09-01": ["2026-09-01T15:00:00.000+02:00"] }
 *
 * Tout ce qui n'entre dans ni l'une ni l'autre est IGNORÉ silencieusement au
 * niveau du créneau, jamais du jour entier : une entrée mal formée ne doit pas
 * effacer les vingt qui l'entourent.
 */
/**
 * Fuseau de référence de TOUTE la prise de rendez-vous.
 *
 * Il vit ici et non dans `config.ts` pour une raison de graphe de modules : ce
 * fichier est importé par le composant CLIENT, `config.ts` lit `process.env`.
 * Faire dépendre l'un de l'autre embarquerait la lecture d'environnement dans
 * le paquet du navigateur.
 */
export const FUSEAU = "Europe/Paris";

/** Un créneau réservable, à son instant de début. */
export interface Creneau {
  /** Instant ISO 8601 tel que servi par Cal.com. */
  readonly debut: string;
  /** Heure affichable, à l'heure de Paris (« 15:00 »). */
  readonly heure: string;
  /**
   * Jour et heure en une phrase (« lundi 1 septembre à 15:00 »).
   *
   * Calculé ici et non dans le composant : une fois choisi, le créneau est
   * affiché HORS de sa colonne de jour, dans le résumé de l'étape. Sans cette
   * phrase, le résumé dirait « 15:00 » sans dire quel jour, ce qui est
   * exactement l'information qui manque au moment de confirmer.
   */
  readonly resume: string;
}

export interface JourDeCreneaux {
  /** Jour civil parisien, `AAAA-MM-JJ`. */
  readonly jour: string;
  /** Jour affichable (« mardi 1er septembre »). */
  readonly libelle: string;
  /** Jour abrégé (« mar. 1er »), pour la bande de sélection. */
  readonly libelleCourt: string;
  readonly creneaux: readonly Creneau[];
}

/** Largeur de la fenêtre interrogée, en jours. Une semaine, bornes comprises. */
export const JOURS_PAR_FENETRE = 7;

/**
 * Horizon maximal de réservation, en jours.
 *
 * Il n'a rien d'esthétique : sans borne, un client pourrait faire pagineter la
 * route jusqu'en 2050 et transformer notre serveur en marteau sur l'API
 * publique de Cal.com.
 */
export const HORIZON_JOURS = 120;

const MOTIF_JOUR = /^\d{4}-\d{2}-\d{2}$/;

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Jour civil PARISIEN d'un instant, en `AAAA-MM-JJ`.
 *
 * Passe par `formatToParts` et non par `toISOString().slice(0, 10)` : ce
 * dernier donne le jour UTC, qui est le mauvais jour tous les soirs entre 22 h
 * et minuit en heure d'été.
 */
export function jourParis(instant: Date): string {
  const parties = new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const lire = (type: Intl.DateTimeFormatPartTypes): string =>
    parties.find((partie) => partie.type === type)?.value ?? "";
  return `${lire("year")}-${lire("month")}-${lire("day")}`;
}

/** Vrai si la chaîne est un jour civil bien formé ET réel (pas de 31 février). */
export function estJourValide(valeur: unknown): valeur is string {
  if (typeof valeur !== "string" || !MOTIF_JOUR.test(valeur)) return false;
  const instant = new Date(`${valeur}T00:00:00Z`);
  if (Number.isNaN(instant.getTime())) return false;
  return instant.toISOString().slice(0, 10) === valeur;
}

/**
 * Décale un jour civil de `n` jours.
 *
 * L'arithmétique se fait en UTC sur une date à minuit : aucun changement
 * d'heure ne peut donc faire « sauter » ou « répéter » un jour, ce qui
 * arriverait avec une addition de 24 h sur un instant local.
 */
export function ajouterJours(jour: string, n: number): string {
  const base = new Date(`${jour}T00:00:00Z`).getTime();
  return new Date(base + n * MS_PAR_JOUR).toISOString().slice(0, 10);
}

/** Nombre de jours entiers de `depuis` à `jusqua`, négatif si `jusqua` précède. */
export function ecartEnJours(depuis: string, jusqua: string): number {
  const a = new Date(`${depuis}T00:00:00Z`).getTime();
  const b = new Date(`${jusqua}T00:00:00Z`).getTime();
  return Math.round((b - a) / MS_PAR_JOUR);
}

export interface Fenetre {
  readonly debut: string;
  readonly fin: string;
}

/**
 * Fenêtre d'une semaine, BORNÉE des deux côtés.
 *
 * Le jour demandé vient du client : il est donc traité comme une suggestion.
 * Antérieur à aujourd'hui, il est ramené à aujourd'hui ; au-delà de l'horizon,
 * il y est ramené aussi. Rien ne remonte tel quel jusqu'à l'API de Cal.com.
 */
export function fenetreSemaine(jourDemande: string, maintenant: Date): Fenetre {
  const aujourdHui = jourParis(maintenant);
  const dernier = ajouterJours(aujourdHui, HORIZON_JOURS);
  let debut = estJourValide(jourDemande) ? jourDemande : aujourdHui;
  if (ecartEnJours(aujourdHui, debut) < 0) debut = aujourdHui;
  if (ecartEnJours(debut, dernier) < 0) debut = dernier;
  return { debut, fin: ajouterJours(debut, JOURS_PAR_FENETRE - 1) };
}

/** Vrai quand la semaine affichée est la première : pas de « précédente ». */
export function estPremiereSemaine(debut: string, maintenant: Date): boolean {
  return ecartEnJours(jourParis(maintenant), debut) <= 0;
}

/** Vrai quand reculer d'une semaine sortirait de l'horizon autorisé. */
export function estDerniereSemaine(debut: string, maintenant: Date): boolean {
  const suivante = ajouterJours(debut, JOURS_PAR_FENETRE);
  return ecartEnJours(jourParis(maintenant), suivante) > HORIZON_JOURS;
}

const FORMAT_HEURE = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  hour: "2-digit",
  minute: "2-digit",
});

const FORMAT_SEMAINE = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  weekday: "long",
});

const FORMAT_SEMAINE_COURT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  weekday: "short",
});

const FORMAT_MOIS = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  month: "long",
});

const FORMAT_MOIS_COURT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  month: "short",
});

/**
 * Instant de MIDI UTC d'un jour civil.
 *
 * Midi et non minuit : à minuit, un jour civil parisien appartient déjà au
 * lendemain UTC en heure d'été, et tout libellé calculé dessus afficherait la
 * veille. Midi est à douze heures de chacun des deux bords, aucun fuseau
 * terrestre ne l'en fait sortir.
 */
function instantDeJour(jour: string): Date {
  return new Date(`${jour}T12:00:00Z`);
}

/**
 * Quantième du mois, à la française.
 *
 * Le premier du mois s'écrit « 1er », les autres en cardinaux. `Intl` ne le
 * sait pas pour le français (il rend « 1 septembre »), et `scripts/typo-fr.mjs`
 * ne le voit pas non plus : il vérifie le contenu, pas une date calculée à
 * l'exécution. C'est donc ici, et nulle part ailleurs, que ça se règle.
 */
function quantieme(jour: string): string {
  const numero = Number(jour.slice(8, 10));
  return numero === 1 ? "1er" : String(numero);
}

export function formaterHeure(instantIso: string): string {
  return FORMAT_HEURE.format(new Date(instantIso));
}

/** Jour en toutes lettres (« mardi 1er septembre »). */
export function formaterJour(jour: string): string {
  const instant = instantDeJour(jour);
  return `${FORMAT_SEMAINE.format(instant)} ${quantieme(jour)} ${FORMAT_MOIS.format(instant)}`;
}

/** Jour abrégé (« mar. 1er »), pour la bande de sélection des jours. */
export function formaterJourCourt(jour: string): string {
  return `${FORMAT_SEMAINE_COURT.format(instantDeJour(jour))} ${quantieme(jour)}`;
}

/** Libellé d'une fenêtre (« 31 août au 6 sept. »), pour l'en-tête de semaine. */
export function formaterFenetre(fenetre: Fenetre): string {
  const mois = (jour: string): string =>
    FORMAT_MOIS_COURT.format(instantDeJour(jour));
  return `${quantieme(fenetre.debut)} ${mois(fenetre.debut)} au ${quantieme(fenetre.fin)} ${mois(fenetre.fin)}`;
}

/** Extrait l'instant de début d'une entrée de créneau, sous ses deux formes. */
function lireDebut(entree: unknown): string | undefined {
  if (typeof entree === "string") return entree;
  if (typeof entree !== "object" || entree === null) return undefined;
  const start = (entree as Record<string, unknown>).start;
  return typeof start === "string" ? start : undefined;
}

/**
 * Convertit la charge utile de `GET /v2/slots` en jours affichables.
 *
 * @param charge Corps JSON déjà analysé, jamais typé d'office.
 * @param maintenant Instant courant : les créneaux déjà passés sont retirés.
 *   Cal.com les filtre normalement lui-même, mais une fenêtre demandée le matin
 *   et affichée le soir garderait sinon des heures mortes cliquables.
 */
export function lireCreneaux(
  charge: unknown,
  maintenant: Date,
): readonly JourDeCreneaux[] {
  if (typeof charge !== "object" || charge === null) return [];
  const data = (charge as Record<string, unknown>).data;
  if (typeof data !== "object" || data === null || Array.isArray(data)) return [];

  const seuil = maintenant.getTime();
  const jours: JourDeCreneaux[] = [];

  for (const [jour, brut] of Object.entries(data as Record<string, unknown>)) {
    if (!estJourValide(jour) || !Array.isArray(brut)) continue;

    const libelle = formaterJour(jour);
    const creneaux: Creneau[] = [];
    for (const entree of brut) {
      const debut = lireDebut(entree);
      if (!debut) continue;
      const instant = new Date(debut);
      if (Number.isNaN(instant.getTime()) || instant.getTime() <= seuil) continue;
      const heure = FORMAT_HEURE.format(instant);
      creneaux.push({ debut, heure, resume: `${libelle} à ${heure}` });
    }

    // Un jour sans créneau utile ne se rend pas : une colonne vide se lit comme
    // un défaut d'affichage, pas comme une absence de disponibilité.
    if (creneaux.length === 0) continue;
    creneaux.sort((a, b) => a.debut.localeCompare(b.debut));
    jours.push({ jour, libelle, libelleCourt: formaterJourCourt(jour), creneaux });
  }

  jours.sort((a, b) => a.jour.localeCompare(b.jour));
  return jours;
}

/** Fenêtre telle que la route la renvoie, avec ses libellés déjà calculés. */
export interface FenetreAffichee extends Fenetre {
  readonly libelle: string;
  /** Vrai quand il n'y a pas de semaine antérieure atteignable. */
  readonly premiere: boolean;
  /** Vrai quand il n'y a pas de semaine ultérieure atteignable. */
  readonly derniere: boolean;
}

export interface ReponseCreneaux {
  readonly fenetre: FenetreAffichee;
  readonly jours: readonly JourDeCreneaux[];
}

function lireJourDeCreneaux(entree: unknown): JourDeCreneaux | undefined {
  if (typeof entree !== "object" || entree === null) return undefined;
  const objet = entree as Record<string, unknown>;
  if (
    typeof objet.jour !== "string" ||
    typeof objet.libelle !== "string" ||
    typeof objet.libelleCourt !== "string"
  ) {
    return undefined;
  }
  if (!Array.isArray(objet.creneaux)) return undefined;
  const creneaux: Creneau[] = [];
  for (const brut of objet.creneaux) {
    if (typeof brut !== "object" || brut === null) continue;
    const creneau = brut as Record<string, unknown>;
    if (
      typeof creneau.debut !== "string" ||
      typeof creneau.heure !== "string" ||
      typeof creneau.resume !== "string"
    ) {
      continue;
    }
    creneaux.push({
      debut: creneau.debut,
      heure: creneau.heure,
      resume: creneau.resume,
    });
  }
  return {
    jour: objet.jour,
    libelle: objet.libelle,
    libelleCourt: objet.libelleCourt,
    creneaux,
  };
}

/**
 * Relit la réponse de `GET /api/rendez-vous/creneaux` côté NAVIGATEUR.
 *
 * Oui, cette route est la nôtre. Non, ce n'est pas une raison pour lui faire
 * confiance en aveugle : entre elle et le composant il y a un réseau, un
 * mandataire d'entreprise, un portail Wi-Fi qui renvoie sa page de connexion en
 * 200, et un déploiement où l'un des deux côtés est plus vieux que l'autre.
 * `undefined` déclenche l'état d'erreur, ce qui vaut mieux qu'un `.map` sur
 * `undefined` au milieu du rendu.
 */
export function lireReponseCreneaux(charge: unknown): ReponseCreneaux | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const objet = charge as Record<string, unknown>;
  const fenetre = objet.fenetre;
  if (typeof fenetre !== "object" || fenetre === null) return undefined;
  const f = fenetre as Record<string, unknown>;
  if (
    typeof f.debut !== "string" ||
    typeof f.fin !== "string" ||
    typeof f.libelle !== "string" ||
    typeof f.premiere !== "boolean" ||
    typeof f.derniere !== "boolean"
  ) {
    return undefined;
  }
  if (!Array.isArray(objet.jours)) return undefined;

  const jours: JourDeCreneaux[] = [];
  for (const entree of objet.jours) {
    const jour = lireJourDeCreneaux(entree);
    if (jour && jour.creneaux.length > 0) jours.push(jour);
  }

  return {
    fenetre: {
      debut: f.debut,
      fin: f.fin,
      libelle: f.libelle,
      premiere: f.premiere,
      derniere: f.derniere,
    },
    jours,
  };
}
