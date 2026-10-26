import * as executeur from "bun:test";

/*
 * Importé EN PREMIER par `AnalyticsRuntime.test.mjs` : le bandeau ne s'affiche
 * que si une clé PostHog existe. Clé de test, publique par nature, qui
 * n'atteint aucun serveur (le SDK est remplacé par un faux dans le test).
 *
 * Deux exécuteurs, deux chemins. `bunx vitest` isole chaque fichier : poser la
 * variable avant le premier chargement de `config.ts` suffit. `bun test`
 * partage les modules entre fichiers, `config.ts` a souvent déjà été chargé
 * sans clé : `mock.module` le remplace alors en place.
 */
process.env.NEXT_PUBLIC_POSTHOG_KEY ||= "phc_test";

if (typeof executeur.mock?.module === "function") {
  const reel = await import("@/lib/analytics/config");
  executeur.mock.module("@/lib/analytics/config", () => ({
    ...reel,
    POSTHOG_KEY: "phc_test",
    isAnalyticsConfigured: () => true,
  }));
}
