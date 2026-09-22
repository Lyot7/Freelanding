import { fileURLToPath } from "node:url";

/**
 * Existe UNIQUEMENT pour le gate pre-pr-gate (`~/ai-config`), qui rejoue les
 * tests ciblés sous `bunx vitest run --coverage` pour mesurer la couverture du
 * diff (format istanbul, que `bun test --coverage` ne produit pas).
 *
 * Le dépôt écrit et exécute ses tests avec `bun:test` (`bun run test`) : c'est
 * le runtime réel, rapide, sans configuration. Vitest n'intervient jamais en
 * dev ni en CI. L'alias ci-dessous fait tenir les DEUX API sans dupliquer un
 * seul fichier de test : `bun:test` et `vitest` exposent la même surface
 * (describe/it/expect/…), donc rediriger l'import suffit.
 */
const config = {
  resolve: {
    alias: [
      { find: "bun:test", replacement: "vitest" },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    css: false,
    // Worktrees d'agents (.claude/worktrees/**) : des COPIES du dépôt, comme
    // pour eslint.config.mjs. Sans cette ligne, chaque test ciblé tourne une
    // fois par worktree présent en plus de la copie réelle.
    exclude: ["**/node_modules/**", "**/.claude/**"],
    // Même fichier que `bunfig.toml` : voir son en-tête.
    setupFiles: ["./scripts/test-turnstile-env.mjs"],
  },
};

export default config;
