# eliottbouquerel.fr

Site professionnel d'Eliott Bouquerel, développeur web indépendant.
Next.js 16, React 19, TypeScript strict et Tailwind CSS 4.

## Lancer le projet

```bash
bun install
bun run dev
```

Le site reconstruit est disponible sur `http://localhost:3000/`.

## Architecture

- La capture brute, byte-identique au live, vit dans `../site/raw-live/`.
- La copie autonome et réécrite vit dans `../site/offline-next/`.
- Les 20 routes Next utilisent les composants de `src/components/pages/`.
- Les contenus provider-neutral vivent dans `src/content/`.
- `src/lib/content/` expose le port async que pourra implémenter Payload CMS.
- Les règles de reconstruction vérifiées sont documentées dans
  `.claude/HOME-SPEC.md` et `.claude/RECONSTRUCTION-GUIDE.md`.

## Capture et vérification

```bash
bun run mirror:framer
bun run verify:framer-mirror
bun run test
bun run typecheck
bun run lint
bun run build
```

Le crawler refuse d'écraser une capture existante. Une nouvelle capture doit
donc cibler des répertoires vierges avec `--raw-dir` et `--offline-dir`.
