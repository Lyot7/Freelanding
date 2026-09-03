/**
 * Audit des textes ÉCRITS EN DUR dans les composants.
 *
 * Le site est censé lire 100 % de son contenu par le port `ContentRepository`,
 * donc indifféremment depuis `src/content/*.ts` ou depuis Payload. Un texte
 * recopié dans un composant échappe aux deux : il n'apparaît nulle part dans
 * l'admin, et rien ne le signale — le rendu est correct, les types sont verts,
 * seule une relecture ligne à ligne le trouve.
 *
 * C'est exactement ce qui s'était produit au passage au français : une quinzaine
 * de libellés étaient restés en anglais dans le JSX alors que la donnée était
 * traduite.
 *
 * CE QUI EST CHERCHÉ
 *
 *   1. NŒUD DE TEXTE JSX   `<span>Envoyer</span>`
 *   2. ATTRIBUT VISIBLE    `alt=`, `placeholder=`, `title=`, `aria-label=`
 *
 * CE QUI EST ÉCARTÉ, et pourquoi
 *
 *   - les classes utilitaires (`flex items-center`), qui sont des chaînes mais
 *     pas du contenu ;
 *   - la ponctuation seule, les nombres, les entités (`&nbsp;`) ;
 *   - les valeurs techniques (`image/png`, `2026-01-01`, une URL, un sélecteur) ;
 *   - `scripts/`, `src/content/`, `src/lib/` et les tests : le contenu y est à
 *     sa place, et l'outillage n'est pas rendu.
 *
 * Usage :
 *   bun run scripts/hardcoded-text-audit.mjs
 *   bun run scripts/hardcoded-text-audit.mjs --tout   (sans le filtre de bruit)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const RACINES = ["src/components", "src/app"];
const IGNORE = /\.(test|spec)\.[jt]sx?$/;

const tout = process.argv.includes("--tout");

/** Chaînes qui ne sont pas du contenu, quelle que soit leur apparence. */
const TECHNIQUE =
  /^(?:[\d\s.,;:!?—–\-+*/()[\]{}<>|&%$#@^~`'"]*|https?:\/\/\S*|[\w-]+\/[\w-]+|#[\w-]+|@[\w-]+|[\w.-]+\.(?:png|jpe?g|svg|webp|avif|mp4|webm|woff2?|ico|json|css|js|tsx?)|\d{4}-\d{2}-\d{2}.*)$/i;

/** Signature d'une liste de classes utilitaires plutôt que d'une phrase. */
function ressembleADesClasses(texte) {
  if (/[[\]]/.test(texte)) return true;
  const mots = texte.trim().split(/\s+/);
  if (mots.length < 2) return false;
  const utilitaires = mots.filter((m) =>
    /^(?:[a-z0-9]+:)*-?[a-z]+(?:-[a-z0-9./%]+)*$/.test(m) && /-/.test(m),
  );
  return utilitaires.length >= Math.ceil(mots.length / 2);
}

/**
 * Ponctuation qu'on ne trouve JAMAIS dans un libellé rendu, mais partout dans
 * du TypeScript. Sans ce filtre, `Promise<void>` ou `x.slice(cut)` ressortent
 * comme des « nœuds de texte » : le motif `>…<` ne distingue pas un fragment
 * JSX d'un générique, et ces faux positifs noyaient les vrais (39 relevés dont
 * 5 réels).
 */
const CODE = /[;(){}=`|]|=>|\.\w+\(|^\s*,|:\s*$/;

/** Un contenu rédigé porte des lettres et, presque toujours, une espace. */
function ressembleADuContenu(texte) {
  const t = texte.trim();
  if (t.length < 2) return false;
  if (CODE.test(t)) return false;
  if (TECHNIQUE.test(t)) return false;
  if (!/\p{L}/u.test(t)) return false;
  if (ressembleADesClasses(t)) return false;
  // Un identifiant isolé (`sectionOrder`, `data-part`) n'est pas une phrase.
  if (!/\s/.test(t) && /^[a-z][a-zA-Z]*$/.test(t)) return false;
  return true;
}

function fichiers(racine) {
  const out = [];
  const pile = [racine];
  while (pile.length > 0) {
    const courant = pile.pop();
    let entrees;
    try {
      entrees = readdirSync(courant);
    } catch {
      continue;
    }
    for (const nom of entrees) {
      const complet = path.join(courant, nom);
      if (statSync(complet).isDirectory()) {
        pile.push(complet);
      } else if (/\.tsx$/.test(nom) && !IGNORE.test(nom)) {
        out.push(complet);
      }
    }
  }
  return out.sort();
}

/**
 * Retire commentaires et blocs `className` avant l'analyse : un commentaire
 * français ressemble à s'y méprendre à un nœud de texte, et les classes sont
 * la première source de faux positifs.
 */
function nettoyer(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/className=(?:"[^"]*"|\{[^}]*\})/g, "className=…")
    .replace(/class=(?:"[^"]*")/g, "class=…");
}

/**
 * Attributs visibles, sous leurs TROIS formes.
 *
 * Le motif ne couvrait que la première (`attr="…"`). C'est ainsi qu'un
 * `aria-label={`${service.title} — ${open ? "Hide" : "Show"} details`}` est
 * resté en anglais dans `ServicesSection.tsx` jusqu'au 2026-08-27, pendant que
 * cet audit annonçait « aucun texte en dur ». Un audit qui rassure à tort est
 * pire que pas d'audit.
 */
const ATTRIBUTS =
  /\b(alt|placeholder|title|aria-label|label)=(?:"([^"]{2,})"|\{"([^"]{2,})"\}|\{`([^`]{2,})`\})/g;
/** Nœud de texte entre deux balises, sans accolade (donc non dynamique). */
const NOEUD = />([^<>{}\n][^<>{}]{1,120})</g;

const trouves = [];
for (const racine of RACINES) {
  for (const fichier of fichiers(racine)) {
    const brut = readFileSync(fichier, "utf8");
    const source = nettoyer(brut);
    const lignes = brut.split("\n");
    const ligneDe = (index) => source.slice(0, index).split("\n").length;

    for (const m of source.matchAll(ATTRIBUTS)) {
      // Un gabarit mêle littéral et interpolations : seuls les LITTÉRAUX sont
      // du texte en dur. `${service.title}` vient de la donnée et n'a rien à
      // faire ici, alors que le « Show details » qui l'entoure, si.
      const brutAttr = m[2] ?? m[3] ?? m[4] ?? "";
      const morceaux = brutAttr.includes("${")
        ? brutAttr.split(/\$\{[^}]*\}/g)
        : [brutAttr];
      for (const morceau of morceaux) {
        const texte = morceau.replace(/\s+/g, " ").trim();
        if (texte.length < 2) continue;
        if (!tout && !ressembleADuContenu(texte)) continue;
        trouves.push({ fichier, ligne: ligneDe(m.index), genre: m[1], texte });
      }
    }
    for (const m of source.matchAll(NOEUD)) {
      const texte = m[1].replace(/\s+/g, " ").trim();
      if (!tout && !ressembleADuContenu(texte)) continue;
      const ligne = ligneDe(m.index);
      // Une ligne déjà comptée comme attribut ne compte pas deux fois.
      if (trouves.some((t) => t.fichier === fichier && t.ligne === ligne)) continue;
      trouves.push({ fichier, ligne, genre: "texte", texte, source: lignes[ligne - 1] });
    }
  }
}

if (trouves.length === 0) {
  console.log("Aucun texte en dur : tout le contenu rendu passe par la donnée.");
  process.exit(0);
}

const parFichier = new Map();
for (const t of trouves) {
  if (!parFichier.has(t.fichier)) parFichier.set(t.fichier, []);
  parFichier.get(t.fichier).push(t);
}

console.log(`=== TEXTES EN DUR — ${trouves.length} dans ${parFichier.size} fichiers ===\n`);
for (const [fichier, liste] of [...parFichier.entries()].sort(
  (a, b) => b[1].length - a[1].length,
)) {
  console.log(`${fichier}  (${liste.length})`);
  for (const t of liste) {
    console.log(`  ${String(t.ligne).padStart(4)}  ${t.genre.padEnd(11)} « ${t.texte} »`);
  }
  console.log();
}
