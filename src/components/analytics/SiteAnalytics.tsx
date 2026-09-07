"use client";

import { AnalyticsRuntime } from "@/components/analytics/AnalyticsRuntime";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ConsentProvider } from "@/components/consent/ConsentProvider";

/**
 * Point de montage UNIQUE de la mesure et du consentement, posé en dernier nœud
 * du document par `SiteDocument`.
 *
 * L'ORDRE DE RENDU N'EST PAS ANODIN. La barre de révocation est un élément de
 * FLUX : rendue ici, elle se pose sous le pied de page de chaque route, sur les
 * dix-huit pages et sur le 404, sans que le pied de page ait à être modifié. La
 * bannière, elle, est en position fixe : sa place dans l'arbre ne change rien à
 * son rendu, mais la mettre en dernier la met aussi en dernier dans l'ordre de
 * tabulation, ce qui est correct — elle ne doit pas s'interposer devant le
 * contenu au clavier tant qu'elle n'est pas un dialogue.
 */
export function SiteAnalytics() {
  return (
    <ConsentProvider>
      <AnalyticsRuntime />
      <ConsentBanner />
    </ConsentProvider>
  );
}
