/**
 * AUDIT DES FICHIERS : tout média cité par le contenu existe-t-il sur le disque ?
 *
 * POURQUOI. Une image manquante ne casse RIEN de visible côté outillage. Les
 * types sont verts, le composant rend une balise `<img>`, Next renvoie un 404
 * sur le fichier, et la page s'affiche avec un cadre vide. Ni `tsc`, ni les
 * tests, ni le lint ne la voient. Seul un oeil sur la page la trouve, et
 * seulement si on pense à ouvrir celle-là.
 *
 * C'est la situation dans laquelle on se met dès qu'on écrit une entrée de
 * galerie avant d'avoir le fichier, ce qui est le sens normal du travail :
 * on décide du contenu, puis on fournit les captures. Ce script rend l'attente
 * explicite au lieu de la laisser silencieuse.
 *
 * CE QU'IL VÉRIFIE :
 *   1. tout chemin de média cité dans `src/content/**` existe dans `public/` ;
 *   2. il n'est pas vide (un fichier de 0 octet passe un test d'existence et
 *      s'affiche comme une image cassée).
 *
 * Il liste aussi, à titre indicatif et SANS faire échouer, les fichiers de
 * `public/work/` et `public/images/` que plus rien ne cite : c'est une aide au
 * ménage, pas une règle. Un fichier peut être cité depuis un MDX, un script ou
 * une feuille de style, et ce balayage ne les lit pas.
 *
 * Usage : `bun run audit:fichiers`. Aucun serveur requis.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

// `fileURLToPath` et non `.pathname` : le projet vit dans un dossier dont le
// nom contient une espace, que l'URL encode en « %20 ». Le chemin brut ne
// résolvait donc aucun fichier.
const RACINE = fileURLToPath(new URL("..", import.meta.url));
const CONTENU = join(RACINE, "src/content");
const PUBLIC = join(RACINE, "public");

/** Extensions considérées comme des fichiers servis depuis `public/`. */
const MEDIAS = /\.(jpe?g|png|webp|avif|gif|svg|mp4|webm|mov|pdf|ico|woff2?)$/i;

function fichiersDe(dossier, filtre = () => true) {
  const out = [];
  const parcours = (d) => {
    for (const entree of readdirSync(d, { withFileTypes: true })) {
      const chemin = join(d, entree.name);
      if (entree.isDirectory()) parcours(chemin);
      else if (filtre(chemin)) out.push(chemin);
    }
  };
  parcours(dossier);
  return out;
}

/**
 * Chemins de média cités par le contenu.
 *
 * On lit les fichiers en TEXTE plutôt que d'importer les modules : un chemin
 * peut être écrit dans un commentaire, une constante ou un gabarit, et ce qui
 * compte est qu'aucune chaîne ressemblant à un média ne pointe dans le vide.
 * Les gabarits interpolés (`${slug}`) sont ignorés, ils ne sont pas résolubles
 * sans exécuter le code.
 */
const cites = new Map();
for (const fichier of fichiersDe(CONTENU, (f) => /\.(ts|tsx|mjs|mdx)$/.test(f))) {
  const texte = readFileSync(fichier, "utf8");
  for (const m of texte.matchAll(/["'`](\/[^"'`\s${}]+)["'`]/g)) {
    const chemin = m[1];
    if (!MEDIAS.test(chemin)) continue;
    if (!cites.has(chemin)) cites.set(chemin, new Set());
    cites.get(chemin).add(relative(RACINE, fichier));
  }
}

const manquants = [];
const vides = [];
for (const [chemin, sources] of cites) {
  const surDisque = join(PUBLIC, chemin);
  try {
    if (statSync(surDisque).size === 0) vides.push({ chemin, sources });
  } catch {
    manquants.push({ chemin, sources });
  }
}

// Fichiers présents que plus rien ne cite. Indicatif seulement.
const surveilles = ["work", "images"].flatMap((d) => {
  try {
    return fichiersDe(join(PUBLIC, d), (f) => MEDIAS.test(f));
  } catch {
    return [];
  }
});
const orphelins = surveilles
  .map((f) => `/${relative(PUBLIC, f)}`)
  .filter((c) => !cites.has(c));

if (manquants.length > 0) {
  console.error(`\n❌ FICHIERS CITÉS PAR LE CONTENU ET ABSENTS DU DISQUE — ${manquants.length}`);
  for (const { chemin, sources } of manquants) {
    console.error(`  public${chemin}`);
    console.error(`     attendu par ${[...sources].join(", ")}`);
  }
}

if (vides.length > 0) {
  console.error(`\n❌ FICHIERS PRÉSENTS MAIS VIDES — ${vides.length}`);
  for (const { chemin, sources } of vides) {
    console.error(`  public${chemin} — cité par ${[...sources].join(", ")}`);
  }
}

if (orphelins.length > 0) {
  console.log(`\nℹ️  ${orphelins.length} fichier(s) que le contenu ne cite plus (indicatif) :`);
  for (const c of orphelins) console.log(`  public${c}`);
  console.log(
    "  Un MDX, un script ou une feuille de style peut les citer : vérifier avant de supprimer.",
  );
}

if (manquants.length > 0 || vides.length > 0) {
  console.error(`\nTotal : ${manquants.length + vides.length} défaut(s) sur ${cites.size} média(s) cité(s).`);
  process.exit(1);
}

console.log(`✅ Les ${cites.size} médias cités par le contenu existent tous.`);
