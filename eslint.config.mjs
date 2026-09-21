import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored static assets (self-hosted Framer runtime .mjs, images, fonts).
    "public/**",
    // Dev-only extraction tooling (Node .mjs, not part of the app build).
    "scripts/**",
    // Worktrees d'agents : des COPIES du depot, branchees ailleurs. Sans cette
    // ligne, `bun run lint` lint le projet une fois par worktree present et
    // rend 778 erreurs qui n'existent dans aucun fichier de travail.
    ".claude/**",
    // Generated Framer HTML-string modules (port fidele) — not hand-written
    // code; eslint mis-parses the inlined markup as JSX/hooks. Owned by the
    // extraction pipeline, never linted.
    "src/content/framer-html/**",
  ]),
]);

export default eslintConfig;
