/**
 * Génère `src/app/fonts.css` à partir des `@font-face` du HTML source du live.
 *
 * Pourquoi ne pas utiliser le paquet npm `geist` : le live ne charge PAS la
 * Geist variable de Vercel, il charge les fichiers statiques Geist de Google
 * Fonts (v4 pour 500/700, v5 subsettée pour 400/600/900) plus un fallback
 * `Geist Placeholder` calé sur Arial avec des overrides de métriques précis.
 * Deux fontes au même nom mais aux métriques différentes donnent des largeurs
 * de texte différentes, donc des retours à la ligne différents : c'est la cause
 * de fond des écarts de largeur résiduels.
 *
 * Les woff2 sont déjà rapatriés sous `public/fonts.gstatic.com/`, on réécrit
 * donc simplement l'origine.
 *
 * Usage : bun run scripts/extract-fonts.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "../site/raw-live/routes/index.html";
const OUT = "src/app/fonts.css";
const PUBLIC = "public";

const html = readFileSync(SOURCE, "utf8");
const faces = [...html.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);

const wanted = faces.filter((f) => /font-family:\s*['"]?Geist/i.test(f));

/** Déduplication : le SSR répète les mêmes déclarations sur chaque page. */
const seen = new Set();
const kept = [];
const missing = [];

for (const face of wanted) {
  // Origine → chemin local. Les woff2 sont servis depuis `public/`.
  const local = face.replace(/https:\/\/fonts\.gstatic\.com/g, "/fonts.gstatic.com");
  const url = (local.match(/url\("?([^")]+)/) || [])[1];
  if (url && !existsSync(join(PUBLIC, url))) missing.push(url);

  // Guillemets normalisés pour que la déduplication voie `'Geist'` et `"Geist"`
  // comme une seule et même déclaration.
  const key = local.replace(/['"]/g, '"').replace(/\s+/g, " ").trim();
  if (seen.has(key)) continue;
  seen.add(key);
  kept.push(key);
}

if (missing.length) {
  console.error(`woff2 absents de ${PUBLIC}/ :\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

const header = `/* GÉNÉRÉ par scripts/extract-fonts.mjs — ne pas éditer à la main.
 *
 * Copie fidèle des @font-face du live (${SOURCE}), origine réécrite vers
 * les woff2 rapatriés dans public/. Reproduire ces déclarations à l'identique
 * est ce qui garantit des largeurs de texte, donc des retours à la ligne,
 * identiques à la source. */

`;

writeFileSync(OUT, header + kept.join("\n") + "\n");
console.log(`${kept.length} @font-face écrites dans ${OUT}`);
