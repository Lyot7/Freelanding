/**
 * Source de vérité CSS : sort les règles que le LIVE applique réellement à un
 * élément, lues dans le HTML du miroir brut (`../site/raw-live/routes/`).
 *
 * Mesurer le DOM dit CE QUE ÇA VAUT à une largeur donnée ; ce script dit
 * POURQUOI, donc si la valeur est un palier de media-query ou une expression
 * qui suit le conteneur (%, vw, calc, minmax). C'est la différence entre
 * répliquer une intention et figer un instantané.
 *
 * Usage :
 *   bun run scripts/css-source.mjs /blog "All"
 *   bun run scripts/css-source.mjs / "Showreel" --depth 3
 *   bun run scripts/css-source.mjs /blog --class framer-1abc2de
 */

import { readFileSync } from "node:fs";
import { parse } from "node-html-parser";

// Les drapeaux sont cherchés dans TOUS les arguments : `--class` s'utilise sans
// texte cible, il occuperait sinon la position de `target`.
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const route = argv[0];
const depth = Number(flag("--depth")) || 2;
const directClass = flag("--class");
const target = argv[1]?.startsWith("--") ? null : argv[1];

/** Le miroir range les routes en `routes/<segments>/index.html`. */
const file = route === "/"
  ? "../site/raw-live/routes/index.html"
  : `../site/raw-live/routes${route.replace(/\/$/, "")}/index.html`;

const html = readFileSync(file, "utf8");

/* ------------------------------- Feuilles ---------------------------------- */

/** Concatène tous les <style> du document : le CSS Framer est inline. */
const sheets = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map((m) => m[1])
  .join("\n");

/**
 * Découpe en règles de premier niveau en suivant les accolades, pour garder
 * les blocs `@media` entiers avec leur condition.
 */
function topLevelRules(css) {
  const out = [];
  let depthCount = 0, start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === "{") { if (depthCount === 0) start = i; depthCount++; }
    else if (css[i] === "}") {
      depthCount--;
      if (depthCount === 0) {
        const head = css.slice(out.at(-1)?.end ?? 0, start);
        out.push({ sel: head.trim(), body: css.slice(start + 1, i), end: i + 1 });
      }
    }
  }
  return out;
}

const RULES = topLevelRules(sheets);

/** Toutes les règles ciblant l'une des classes, media-queries incluses. */
function rulesFor(classes) {
  const hit = (sel) => classes.some((c) => sel.includes("." + c));
  const found = [];
  for (const r of RULES) {
    if (r.sel.startsWith("@media") || r.sel.startsWith("@supports")) {
      for (const inner of topLevelRules(r.body)) {
        if (hit(inner.sel)) found.push({ cond: r.sel, sel: inner.sel, body: inner.body });
      }
    } else if (hit(r.sel)) {
      found.push({ cond: null, sel: r.sel, body: r.body });
    }
  }
  return found;
}

/* -------------------------------- Cible ------------------------------------ */

let classes;
if (directClass) {
  classes = [directClass];
} else {
  const doc = parse(html);
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const node = doc.querySelectorAll("*").filter((e) => norm(e.textContent) === target).pop();
  if (!node) {
    console.error(`Texte introuvable dans ${file} : ${JSON.stringify(target)}`);
    process.exit(1);
  }
  // On remonte de `depth` niveaux : le padding/gap qui produit une hauteur vit
  // presque toujours sur un ancêtre, pas sur le nœud de texte.
  const chain = [];
  let n = node;
  for (let i = 0; i <= depth && n; i++) { chain.push(n); n = n.parentNode; }
  // `framer-text` et les presets de style sont des classes utilitaires portées
  // par des centaines de règles génériques : elles noieraient le layout, qui est
  // ce qu'on cherche. Elles restent accessibles via `--class`.
  const GENERIC = /^(framer-text|framer-styles-preset-.*)$/;
  classes = [...new Set(chain.flatMap((e) => (e.getAttribute?.("class") || "").split(/\s+/)))]
    .filter((c) => c && c.startsWith("framer-") && !GENERIC.test(c));
  console.log(`Chaîne (${chain.length} niveaux) → classes : ${classes.join(" ")}\n`);
}

/* ------------------------------ Restitution -------------------------------- */

const found = rulesFor(classes);
if (!found.length) console.log("Aucune règle trouvée.");

// Groupées par condition : lire les paliers dans l'ordre mobile → desktop rend
// immédiatement visible ce qui est un palier et ce qui ne l'est pas.
const byCond = new Map();
for (const r of found) {
  const k = r.cond ?? "(base, sans media-query)";
  if (!byCond.has(k)) byCond.set(k, []);
  byCond.get(k).push(r);
}
for (const [cond, rs] of byCond) {
  console.log(`\n### ${cond}`);
  for (const r of rs) {
    const body = r.body.replace(/\s+/g, " ").trim();
    if (!body) continue;
    console.log(`  ${r.sel.replace(/\s+/g, " ").trim()}`);
    console.log(`    ${body}`);
  }
}
