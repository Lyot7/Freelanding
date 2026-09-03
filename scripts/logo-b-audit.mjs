/**
 * Le monogramme « B » ne doit exister qu'en un seul dessin.
 *
 *   bun run scripts/logo-b-audit.mjs
 *
 * Il vit à deux endroits, par nécessité : `public/logo-b.svg` pour les usages
 * hors React (favicon, image de partage, signature de courriel) et
 * `src/components/brand/BrandB.tsx` pour le rendu du site. Un tracé de 1223
 * caractères se recopie mal : une première insertion à la main n'en avait repris
 * que 685, et le B rendu était tronqué sans que rien ne le signale — ni le
 * build, ni les tests, ni l'œil sur une petite taille.
 *
 * Ce script compare les deux, et échoue si l'un a bougé sans l'autre.
 */
import { readFileSync } from "node:fs";

const tracé = (fichier) => {
  const contenu = readFileSync(fichier, "utf8");
  const paths = [...contenu.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
  return { paths, contenu };
};

const svg = tracé("public/logo-b.svg");
const tsx = tracé("src/components/brand/BrandB.tsx");
let echecs = 0;

for (const [nom, { paths }] of [
  ["public/logo-b.svg", svg],
  ["src/components/brand/BrandB.tsx", tsx],
]) {
  if (paths.length !== 1) {
    echecs += 1;
    console.log(`❌ ${nom} : ${paths.length} tracé(s), attendu 1`);
  }
}

if (echecs === 0) {
  if (svg.paths[0] !== tsx.paths[0]) {
    echecs += 1;
    const commun = [...svg.paths[0]].findIndex((c, i) => c !== tsx.paths[0][i]);
    console.log(
      `❌ les deux tracés divergent : ${svg.paths[0].length} caractères dans le SVG, ` +
        `${tsx.paths[0].length} dans le composant, première différence au caractère ${commun}`,
    );
  } else {
    console.log(`✅ tracé identique des deux côtés (${svg.paths[0].length} caractères)`);
  }
}

process.exit(echecs === 0 ? 0 : 1);
