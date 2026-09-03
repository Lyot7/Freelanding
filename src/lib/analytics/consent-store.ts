/**
 * Le choix de consentement vu comme un MAGASIN EXTERNE, au sens de
 * `useSyncExternalStore`.
 *
 * POURQUOI PAS UN SIMPLE `useState` + `useEffect`. Le `localStorage` n'existe
 * pas au rendu serveur : le lire dans un effet obligeait à un `setState`
 * synchrone dans le corps de l'effet, ce que la règle
 * `react-hooks/set-state-in-effect` refuse — et à juste titre, puisque cela
 * provoque un rendu en cascade à chaque montage de page. `useSyncExternalStore`
 * est exactement le primitif prévu pour ça : il rend l'INSTANTANÉ SERVEUR
 * pendant l'hydratation, puis bascule sur l'instantané client une fois celle-ci
 * terminée. C'est aussi ce qui garantit l'absence d'écart d'hydratation.
 *
 * L'instantané serveur vaut `CONSENT_UNKNOWN` et non `null` : « je n'ai pas
 * encore lu » et « il n'y a rien à lire » n'entraînent pas la même chose. Le
 * premier n'affiche rien, le second ouvre la bannière. Les confondre ferait
 * rendre la bannière dans le HTML serveur, donc apparaître puis disparaître
 * chez tout visiteur qui a déjà choisi.
 */
import {
  CONSENT_STORAGE_KEY,
  clearConsent,
  parseConsent,
  writeConsent,
  type ConsentChoices,
  type ConsentRecord,
} from "./consent";

/** Sentinelle : le stockage n'a pas encore été lu (rendu serveur, hydratation). */
export const CONSENT_UNKNOWN = Symbol("consent-unknown");
export type ConsentSnapshot =
  | ConsentRecord
  | null
  | typeof CONSENT_UNKNOWN;

const listeners = new Set<() => void>();

/*
 * Mémoire de l'instantané. `useSyncExternalStore` exige qu'un état inchangé
 * rende la MÊME référence : recalculer l'objet à chaque appel produirait un
 * nouvel objet à chaque rendu, donc une boucle de rendu infinie. La clé du
 * cache est la chaîne brute stockée — le seul état qui change réellement.
 *
 * CONSÉQUENCE ASSUMÉE : l'expiration n'est réévaluée qu'au changement de cette
 * chaîne, donc en pratique à chaque chargement de page. Pour une durée de six
 * mois, faire expirer un consentement au milieu d'une visite plutôt qu'au
 * chargement suivant n'a aucune portée.
 */
let cacheRaw: string | null = null;
let cacheRecord: ConsentRecord | null = null;
let cacheValide = false;

function lireBrut(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function stockage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifier(): void {
  cacheValide = false;
  for (const listener of listeners) listener();
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  /* Un choix fait dans un autre onglet doit s'appliquer ici aussi : sinon un
     visiteur peut retirer son consentement dans un onglet et rester mesuré
     dans l'autre. */
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_STORAGE_KEY) notifier();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getConsentSnapshot(): ConsentSnapshot {
  const raw = lireBrut();
  if (!cacheValide || raw !== cacheRaw) {
    cacheRaw = raw;
    cacheRecord = parseConsent(raw, Date.now());
    cacheValide = true;
  }
  return cacheRecord;
}

export function getConsentServerSnapshot(): ConsentSnapshot {
  return CONSENT_UNKNOWN;
}

export function saveConsentChoices(choices: ConsentChoices): void {
  writeConsent(stockage(), choices, Date.now());
  notifier();
}

export function clearConsentChoices(): void {
  clearConsent(stockage());
  notifier();
}
