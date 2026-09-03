/**
 * LOGIQUE DE CONSENTEMENT — pure, sans DOM, donc testable.
 *
 * Tout ce qui décide « le traceur a-t-il le droit de partir » vit ici, et
 * NULLE PART ailleurs. C'est délibéré : une régression sur ce fichier ne se
 * voit pas à l'écran (le site s'affiche exactement pareil), elle se voit
 * seulement dans l'onglet réseau d'un contrôleur. Les fonctions sont donc
 * pures, prennent l'horloge en paramètre, et sont couvertes par
 * `consent.test.mjs`.
 *
 * CE QUI EST STOCKÉ, ET POURQUOI CE N'EST PAS UN COOKIE. Le choix est écrit
 * dans le `localStorage` de l'origine. La CNIL classe l'enregistrement du choix
 * parmi les traceurs EXEMPTÉS de consentement (délibération n° 2020-091,
 * art. 5) : il est strictement nécessaire à la fourniture du service demandé,
 * puisque sans lui la bannière se rouvrirait à chaque page. Aucun identifiant
 * n'y est écrit, seulement deux booléens et une date.
 *
 * DURÉE. Six mois pour l'ACCEPTATION comme pour le REFUS. La CNIL recommande
 * six mois pour le consentement ; garder le refus aussi longtemps est le
 * pendant obligatoire — redemander à un visiteur qui vient de refuser est le
 * dark pattern le plus courant, et il est expressément proscrit.
 */

/** Clé unique du choix. Versionnée : changer les catégories force un nouveau choix. */
export const CONSENT_STORAGE_KEY = "eb-consent";

/**
 * Version du schéma. À INCRÉMENTER dès qu'une finalité est ajoutée ou que le
 * périmètre d'une catégorie change : un consentement donné pour deux finalités
 * ne vaut pas pour une troisième, et un enregistrement d'une autre version est
 * traité comme absent (la bannière se rouvre).
 */
export const CONSENT_VERSION = 1;

/** Six mois, en jours puis en millisecondes. */
export const CONSENT_TTL_DAYS = 183;
export const CONSENT_TTL_MS = CONSENT_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Tolérance d'horloge. Un enregistrement daté du futur vient d'une horloge
 * système faussée (ou d'une falsification) : au-delà d'un jour d'avance, il est
 * refusé, sinon il pourrait prolonger indéfiniment un consentement périmé.
 */
const CLOCK_SKEW_TOLERANCE_MS = 24 * 60 * 60 * 1000;

/** Finalités distinctes présentées au visiteur. */
export type ConsentCategory = "necessary" | "analytics" | "replay";

/** Les seules sur lesquelles il y a un choix : « necessary » est toujours actif. */
export const OPTIONAL_CONSENT_CATEGORIES = ["analytics", "replay"] as const;
export type OptionalConsentCategory =
  (typeof OPTIONAL_CONSENT_CATEGORIES)[number];

export type ConsentChoices = Readonly<
  Record<OptionalConsentCategory, boolean>
>;

export interface ConsentRecord {
  readonly version: number;
  /** Horodatage du choix, en millisecondes epoch. */
  readonly decidedAt: number;
  readonly choices: ConsentChoices;
}

export const CONSENT_ALL_DENIED: ConsentChoices = {
  analytics: false,
  replay: false,
};

export const CONSENT_ALL_GRANTED: ConsentChoices = {
  analytics: true,
  replay: true,
};

/** Interface minimale de stockage — `window.localStorage` la satisfait. */
export interface ConsentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isConsentExpired(record: ConsentRecord, now: number): boolean {
  return now - record.decidedAt >= CONSENT_TTL_MS;
}

/**
 * Lit une chaîne stockée et n'en retourne un enregistrement QUE s'il est
 * intégralement valide. Tout le reste — absent, illisible, d'une autre version,
 * daté du futur, périmé — retourne `null`, ce qui rouvre la bannière.
 *
 * Le narrowing part de `unknown` : `JSON.parse` rend `any`, et lui faire
 * confiance ferait passer un `{choices: "oui"}` pour un consentement.
 */
export function parseConsent(
  raw: string | null | undefined,
  now: number,
): ConsentRecord | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecordLike(parsed)) return null;
  if (parsed.version !== CONSENT_VERSION) return null;

  const decidedAt = parsed.decidedAt;
  if (typeof decidedAt !== "number" || !Number.isFinite(decidedAt)) return null;
  if (decidedAt > now + CLOCK_SKEW_TOLERANCE_MS) return null;

  const choices = parsed.choices;
  if (!isRecordLike(choices)) return null;
  // `analytics` est obligatoire et doit être un vrai booléen : c'est lui qui
  // porte la décision. `replay` est optionnel et retombe sur le refus, de sorte
  // qu'un enregistrement partiel n'accorde jamais plus que ce qui est écrit.
  if (typeof choices.analytics !== "boolean") return null;
  const replay = choices.replay === true;

  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    decidedAt,
    choices: { analytics: choices.analytics, replay },
  };

  return isConsentExpired(record, now) ? null : record;
}

export function serialiseConsent(choices: ConsentChoices, now: number): string {
  return JSON.stringify({
    version: CONSENT_VERSION,
    decidedAt: now,
    choices: { analytics: choices.analytics, replay: choices.replay },
  });
}

/**
 * Réponse à « ai-je le droit de faire X ? ».
 *
 * `necessary` est toujours vrai : c'est la catégorie exemptée, elle n'est
 * jamais soumise à un choix.
 *
 * `replay` est SUBORDONNÉ à `analytics`. L'enregistrement de session passe par
 * le même SDK que la mesure d'audience : accepter le replay en refusant la
 * mesure n'a aucune traduction technique honnête, et laisser l'interface le
 * suggérer serait mentir. L'interface désactive donc l'interrupteur replay
 * quand la mesure est refusée, et cette règle est doublée ici pour que le
 * stockage ne puisse pas contourner l'interface.
 */
export function consentAllows(
  record: ConsentRecord | null,
  category: ConsentCategory,
): boolean {
  if (category === "necessary") return true;
  if (record === null) return false;
  if (category === "analytics") return record.choices.analytics;
  return record.choices.analytics && record.choices.replay;
}

/** Choix effectifs, après application de la subordination du replay. */
export function effectiveChoices(record: ConsentRecord | null): ConsentChoices {
  return {
    analytics: consentAllows(record, "analytics"),
    replay: consentAllows(record, "replay"),
  };
}

export function readConsent(
  storage: ConsentStorage | null | undefined,
  now: number,
): ConsentRecord | null {
  if (!storage) return null;
  try {
    return parseConsent(storage.getItem(CONSENT_STORAGE_KEY), now);
  } catch {
    // Navigation privée verrouillée, quota, stockage désactivé : on retombe sur
    // « pas de choix », c'est-à-dire sur le refus par défaut.
    return null;
  }
}

export function writeConsent(
  storage: ConsentStorage | null | undefined,
  choices: ConsentChoices,
  now: number,
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    decidedAt: now,
    choices: { analytics: choices.analytics, replay: choices.replay },
  };
  if (storage) {
    try {
      storage.setItem(CONSENT_STORAGE_KEY, serialiseConsent(choices, now));
    } catch {
      // Le choix vaut pour la session en cours même s'il ne peut pas être écrit.
    }
  }
  return record;
}

/** Révocation : efface le choix. La bannière se rouvre, tout repart du refus. */
export function clearConsent(storage: ConsentStorage | null | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* voir writeConsent */
  }
}
