"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { useConsent } from "@/components/consent/ConsentProvider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  capture,
  getAnalyticsServerSnapshot,
  getAnalyticsSnapshot,
  purgePostHogStorage,
  setReplayEnabled,
  startAnalytics,
  stopAnalytics,
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
  const lastReported = useRef<number | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (!analyticsAllowed) {
      stopAnalytics();
      /* Purge de secours : le choix a pu être pris sur une autre page ou dans
         un autre onglet, alors que ce runtime-ci n'avait jamais rien démarré.
         `stopAnalytics` ne nettoierait alors rien. */
      purgePostHogStorage();
      return;
    }

    void startAnalytics({ analytics: analyticsAllowed, replay: replayAllowed });
  }, [analyticsAllowed, ready, replayAllowed]);

  /* Bascule du rejeu sans redémarrer le SDK : décocher la case en cours de
     visite doit arrêter l'enregistrement immédiatement, pas au rechargement. */
  useEffect(() => {
    if (!started) return;
    setReplayEnabled(replayAllowed);
  }, [replayAllowed, started]);

  /* Trace du choix, émise UNE FOIS par décision et seulement quand la mesure
     est autorisée. Un refus ne produit aucun événement : mesurer les refus
     supposerait de mesurer sans consentement. */
  useEffect(() => {
    if (!started || !record) return;
    if (lastReported.current === record.decidedAt) return;
    lastReported.current = record.decidedAt;
    capture(ANALYTICS_EVENTS.consentUpdated, {
      analytics: analyticsAllowed,
      replay: replayAllowed,
      decided_at: new Date(record.decidedAt).toISOString(),
    });
  }, [analyticsAllowed, record, replayAllowed, started]);

  return (
    <>
      <PageAnalytics enabled={started} />
      <GlobalAnalytics enabled={started} />
    </>
  );
}
