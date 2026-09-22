/**
 * Préchargé avant les tests, par `bun test` (`bunfig.toml`, `[test].preload`)
 * et par `bunx vitest` (`vitest.config.mts`, `test.setupFiles`).
 *
 * `src/components/forms/turnstile.ts` lit `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en
 * PORTÉE MODULE, une seule fois au premier import : quel que soit le fichier
 * de test qui l'importe (transitivement, parfois — `Footer.tsx` en dépend via
 * `FooterContactForm`), la valeur se fige pour tout le process. Sans ce
 * préchargement, `useEnvoiFormulaire.test.mjs` verrait la protection
 * configurée ou non selon l'ordre — hors de son contrôle — dans lequel les
 * fichiers de test s'exécutent.
 */
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||= "test-site-key-pre-pr-gate";
