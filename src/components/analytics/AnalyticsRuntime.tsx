"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { useConsent } from "@/components/consent/ConsentProvider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  capture,
  getAnalyticsServerSnapshot,
  getAnalyticsSnapshot,
  getRegimeServerSnapshot,
  getRegimeSnapshot,
  setReplayEnabled,
  startAnalytics,
  subscribeAnalytics,
} from "@/lib/analytics/posthog";
import { GlobalAnalytics } from "./GlobalAnalytics";
import { PageAnalytics } from "./PageAnalytics";

/**
 * COURROIE ENTRE LE CONSENTEMENT ET LE SDK.
 *
 * C'est le seul endroit du site qui appelle `startAnalytics()`, et il ne le
 * fait que sur un `choices.analytics === true` venu du stockage relu par
 * `ConsentProvider`. Les deux trackers ne sont armés (`enabled`) qu'une fois le
 * SDK réellement chargé : tant qu'il ne l'est pas, `capture()` est une fonction
 * vide, et aucun écouteur global n'est même posé.
 *
 * LE CHEMIN DU REFUS EST AUSSI TRAITÉ, et c'est celui qu'on oublie : refuser
 * après avoir accepté doit couper l'émission, jeter l'identifiant anonyme ET
 * retirer les cookies `ph_…` déjà posés. Un « je refuse » qui laisse le cookie
 * en place n'est pas un refus, c'est une case décorative.
 *
 * L'état « le SDK tourne » vient du SDK lui-même (`useSyncExternalStore`), pas
 * d'un `setState` dans un effet : le démarrage est asynchrone, et c'est le
 * module qui sait quand il a abouti.
 */
export function AnalyticsRuntime() {
  const { ready, record, choices } = useConsent();
  const analyticsAllowed = choices.analytics;
  const replayAllowed = choices.replay;

  const started = useSyncExternalStore(
    subscribeAnalytics,
    getAnalyticsSnapshot,
    getAnalyticsServerSnapshot,
  );
  const regime = useSyncExternalStore(
    subscribeAnalytics,
    getRegimeSnapshot,
    getRegimeServerSnapshot,
  );
  const lastReported = useRef<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    /* Toujours démarrée : sans accord, en comptage sans cookie ;
       `startAnalytics` bascule de régime et purge sur un refus. */
    void startAnalytics({ analytics: analyticsAllowed, replay: replayAllowed });
  }, [analyticsAllowed, ready, replayAllowed]);

  /* Bascule du rejeu sans redémarrer le SDK : décocher la case en cours de
     visite doit arrêter l'enregistrement immédiatement, pas au rechargement. */
  useEffect(() => {
    if (!started) return;
    setReplayEnabled(replayAllowed);
  }, [replayAllowed, started]);

  /* Trace du choix, émise UNE FOIS par décision. Un refus part aussi, en
     comptage sans cookie : c'est ce qui donne la part d'acceptation. */
  useEffect(() => {
    if (!started || !record) return;
    if (lastReported.current === record.decidedAt) return;
    /* Choix fait sur une page précédente : déjà compté là-bas. Sans cette
       garde, chaque rechargement renverrait la décision et la part
       d'acceptation compterait des pages, pas des visiteurs. */
    if (record.decidedAt < performance.timeOrigin) {
      lastReported.current = record.decidedAt;
      return;
    }
    lastReported.current = record.decidedAt;
    capture(ANALYTICS_EVENTS.consentUpdated, {
      analytics: analyticsAllowed,
      replay: replayAllowed,
      decided_at: new Date(record.decidedAt).toISOString(),
    });
  }, [analyticsAllowed, record, replayAllowed, started]);

  return (
    <>
      {/* Remontée au changement de régime : un visiteur qui accepte sur sa
          page d'arrivée (là où s'affiche le bandeau) voit sa vue réémise sous
          la mesure complète, sinon les entonnoirs perdraient leur entrée. La
          clé suit le régime publié par le SDK, pas le choix : voir `Regime`. */}
      <PageAnalytics key={regime} enabled={started} />
      <GlobalAnalytics enabled={started} />
    </>
  );
}
