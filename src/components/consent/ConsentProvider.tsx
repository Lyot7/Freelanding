"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { isAnalyticsConfigured } from "@/lib/analytics/config";
import {
  CONSENT_ALL_DENIED,
  CONSENT_ALL_GRANTED,
  effectiveChoices,
  type ConsentChoices,
  type ConsentRecord,
} from "@/lib/analytics/consent";
import {
  CONSENT_UNKNOWN,
  clearConsentChoices,
  getConsentServerSnapshot,
  getConsentSnapshot,
  saveConsentChoices,
  subscribeConsent,
} from "@/lib/analytics/consent-store";

/**
 * ÉTAT DU CONSENTEMENT, partagé par la bannière, le lien de révocation et le
 * démarreur de la mesure.
 *
 * DEUX BOOLÉENS QU'IL NE FAUT PAS CONFONDRE :
 *   - `ready` : le stockage a été lu. FAUX pendant le rendu serveur ET pendant
 *     l'hydratation, parce qu'aucun des deux n'a accès au `localStorage`. C'est
 *     ce qui évite l'écart d'hydratation : le premier rendu client est
 *     identique à celui du serveur, c'est-à-dire vide.
 *   - `panelOpen` : le panneau « Personnaliser » est déplié. Il est le seul
 *     état modal de la bannière.
 */
interface ConsentContextValue {
  ready: boolean;
  /** `null` = aucun choix valide en mémoire, la bannière doit s'ouvrir. */
  record: ConsentRecord | null;
  choices: ConsentChoices;
  /** Vrai quand une clé PostHog est configurée. Sinon il n'y a rien à consentir. */
  configured: boolean;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choices: ConsentChoices) => void;
  revoke: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

/** Événement `window` qui rouvre le panneau depuis n'importe quel code. */
export const CONSENT_OPEN_EVENT = "eb:consent:open";

export function ConsentProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const ready = snapshot !== CONSENT_UNKNOWN;
  const record = ready ? snapshot : null;

  const [panelOpen, setPanelOpen] = useState(false);

  const commit = useCallback((choices: ConsentChoices) => {
    saveConsentChoices(choices);
    setPanelOpen(false);
  }, []);

  /**
   * POINT D'ENTRÉE SANS COUPLAGE, pour le reste du site.
   *
   * N'importe quel élément portant `data-consent-open` rouvre le panneau, et
   * l'événement `eb:consent:open` fait la même chose depuis du code hors React.
   * C'est ce qui permettra au pied de page — édité par un autre chantier — de
   * porter le lien de révocation sans importer ce contexte ni devenir un
   * composant client.
   */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-consent-open]")) return;
      event.preventDefault();
      setPanelOpen(true);
    };
    const onOpen = () => setPanelOpen(true);
    document.addEventListener("click", onClick);
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
    };
  }, []);

  const value = useMemo<ConsentContextValue>(() => {
    return {
      ready,
      record,
      choices: effectiveChoices(record),
      configured: isAnalyticsConfigured(),
      panelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
      acceptAll: () => commit(CONSENT_ALL_GRANTED),
      rejectAll: () => commit(CONSENT_ALL_DENIED),
      save: commit,
      /**
       * Révocation COMPLÈTE : le choix est effacé, pas remplacé par un refus.
       * La bannière se rouvre donc au prochain rendu et le visiteur reprend la
       * décision à zéro, ce qui est ce qu'on attend d'un « revenir sur mon
       * choix ». L'arrêt effectif de la mesure et la purge des cookies sont
       * faits par `AnalyticsRuntime`, qui observe cet état.
       */
      revoke: () => {
        clearConsentChoices();
        setPanelOpen(true);
      },
    };
  }, [commit, panelOpen, ready, record]);

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (!value) {
    throw new Error("useConsent doit être appelé sous <ConsentProvider>.");
  }
  return value;
}
