/**
 * Durées de rendez-vous proposées par un type d'événement Cal.com.
 *
 * CAL.COM EST L'AUTORITÉ, LE SITE SUIT (2026-10-01). Un type d'événement peut
 * proposer plusieurs durées (`lengthInMinutesOptions`) et en désigner une par
 * défaut (`lengthInMinutes`). Le site les lit au lieu de les recopier : changer
 * une durée chez Cal.com change le sélecteur sans déployer.
 *
 * MODULE PUR, importé par le composant client comme par les routes : aucune
 * requête, aucune lecture d'environnement.
 */

export interface Durees {
  /** Durées proposées, en minutes, triées. Contient toujours `defaut`. */
  readonly options: readonly number[];
  /** Durée présélectionnée, en minutes. */
  readonly defaut: number;
}

/** Bornes de bon sens : tout ce qui sort de là est une charge utile fausse. */
const DUREE_MIN = 5;
const DUREE_MAX = 480;

export function estDureePlausible(valeur: unknown): valeur is number {
  return (
    typeof valeur === "number" &&
    Number.isInteger(valeur) &&
    valeur >= DUREE_MIN &&
    valeur <= DUREE_MAX
  );
}

/**
 * Lit des durées sous l'une de leurs deux formes :
 *
 *   - la réponse de `GET /v2/event-types` (`{ data: [{ lengthInMinutes,
 *     lengthInMinutesOptions }] }`), côté serveur ;
 *   - notre propre forme `{ options, defaut }`, côté navigateur, relue depuis
 *     la route des créneaux.
 *
 * `undefined` dès que rien d'exploitable n'en sort : le sélecteur disparaît et
 * Cal.com applique sa durée par défaut, ce qui reste une réservation valable.
 */
export function lireDurees(charge: unknown): Durees | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const objet = charge as Record<string, unknown>;

  if (Array.isArray(objet.options) && estDureePlausible(objet.defaut)) {
    return normaliser(objet.defaut, objet.options);
  }

  const data = objet.data;
  const evenement: unknown = Array.isArray(data) ? data[0] : data;
  if (typeof evenement !== "object" || evenement === null) return undefined;
  const champs = evenement as Record<string, unknown>;
  if (!estDureePlausible(champs.lengthInMinutes)) return undefined;
  const options = Array.isArray(champs.lengthInMinutesOptions)
    ? champs.lengthInMinutesOptions
    : [];
  return normaliser(champs.lengthInMinutes, options);
}

function normaliser(defaut: number, brutes: readonly unknown[]): Durees {
  const options = new Set<number>([defaut]);
  for (const brute of brutes) {
    if (estDureePlausible(brute)) options.add(brute);
  }
  return { options: [...options].sort((a, b) => a - b), defaut };
}

/**
 * Durée à demander à Cal.com pour une valeur reçue du client.
 *
 * Une valeur absente, illisible ou hors des options retombe sur la durée par
 * défaut : un lien partagé avec `?duree=90` ne doit pas produire une erreur,
 * juste la durée prévue. `undefined` quand les durées sont inconnues.
 */
export function resoudreDuree(
  demandee: unknown,
  durees: Durees | undefined,
): number | undefined {
  if (!durees) return undefined;
  const valeur = typeof demandee === "string" ? Number(demandee) : demandee;
  return estDureePlausible(valeur) && durees.options.includes(valeur)
    ? valeur
    : durees.defaut;
}
