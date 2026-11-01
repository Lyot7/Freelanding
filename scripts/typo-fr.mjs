/**
 * Vérifie — et corrige — la typographie française du CONTENU.
 *
 *   bun run scripts/typo-fr.mjs           # vérifie, sort en 1 s'il reste des défauts
 *   bun run scripts/typo-fr.mjs --fix     # applique les corrections automatiques
 *
 * CE QUI EST ANALYSÉ, et pourquoi pas plus.
 *
 *   - `src/content/**\/*.ts` : uniquement les LITTÉRAUX DE CHAÎNE, repérés par
 *     le parseur de TypeScript lui-même. Passer le fichier entier à des
 *     expressions régulières toucherait les commentaires (de la prose française
 *     elle aussi, mais que personne ne lit à l'écran) et surtout le code : une
 *     insécable glissée dans un nom de propriété casse le module sans rien
 *     afficher de compréhensible.
 *   - `src/content/articles/*.mdx` : le corps entier, hors blocs de code, hors
 *     adresses et hors attributs JSX.
 *
 * CE QUI EST ÉCARTÉ À L'INTÉRIEUR MÊME DES CHAÎNES : les adresses, les chemins,
 * les classes utilitaires, les identifiants. Une classe Tailwind est une chaîne
 * comme une autre pour le parseur, et `tablet:w-[378px]` n'a pas à recevoir
 * d'espace insécable.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  normalise,
  verifie,
  estTechnique,
  REGLES_HORS_MDX,
} from "./lib/typo-fr.mjs";

const FIX = process.argv.includes("--fix");
const RACINE = "src/content";


function fichiers(racine, motif) {
  const out = [];
  const pile = [racine];
  while (pile.length > 0) {
    const courant = pile.pop();
    for (const nom of readdirSync(courant)) {
      const complet = path.join(courant, nom);
      if (statSync(complet).isDirectory()) pile.push(complet);
      else if (motif.test(nom)) out.push(complet);
    }
  }
  return out.sort();
}

/** Remplace chaque littéral de chaîne d'un fichier TS par sa version normalisée. */
function traiteTs(fichier) {
  const source = readFileSync(fichier, "utf8");
  const arbre = ts.createSourceFile(fichier, source, ts.ScriptTarget.Latest, true);
  const edits = [];
  const defauts = [];

  const visite = (noeud) => {
    const litteral =
      ts.isStringLiteral(noeud) || ts.isNoSubstitutionTemplateLiteral(noeud);
    const morceauGabarit =
      ts.isTemplateHead(noeud) ||
      ts.isTemplateMiddle(noeud) ||
      ts.isTemplateTail(noeud);
    if (litteral || morceauGabarit) {
      const valeur = noeud.text;
      if (valeur && !estTechnique(valeur)) {
        const corrige = normalise(valeur);
        if (corrige !== valeur) {
          // Bornes du CONTENU, guillemets exclus : on ne réécrit jamais le
          // délimiteur, sous peine de casser un gabarit.
          const debut = noeud.getStart(arbre) + (morceauGabarit ? (ts.isTemplateHead(noeud) ? 1 : 1) : 1);
          const fin = noeud.getEnd() - (morceauGabarit ? (ts.isTemplateTail(noeud) ? 1 : 2) : 1);
          const brut = source.slice(debut, fin);
          // Sécurité : on ne remplace que si le texte source est LITTÉRAL,
          // c'est-à-dire sans séquence d'échappement à réinterpréter.
          if (brut === valeur) edits.push({ debut, fin, texte: corrige });
        }
        // En mode vérification on juge le texte TEL QU'IL EST : un défaut
        // réparable reste un défaut tant que `--fix` n'a pas tourné. En mode
        // correction on ne signale que ce qui RESTE après réparation.
        for (const d of verifie(FIX ? corrige : valeur)) defauts.push({ ...d, fichier });
      }
    }
    ts.forEachChild(noeud, visite);
  };
  visite(arbre);

  if (FIX && edits.length > 0) {
    edits.sort((a, b) => b.debut - a.debut);
    let sortie = source;
    for (const e of edits) sortie = sortie.slice(0, e.debut) + e.texte + sortie.slice(e.fin);
    writeFileSync(fichier, sortie);
  }
  return { corrections: edits.length, defauts };
}

/** MDX : prose entière, blocs de code et adresses préservés. */
function traiteMdx(fichier) {
  const source = readFileSync(fichier, "utf8");
  const zones = [];
  /*
   * NE SONT NEUTRALISÉS QUE : blocs de code, code en ligne, cibles de liens.
   *
   * LES BALISES JSX NE LE SONT PLUS, et c'est le correctif du 2026-08-27. Le
   * motif portait `<[^>]+>`, où `[^>]` avale aussi les retours à la ligne : une
   * balise multiligne comme
   *
   *     <Steps items={[
   *       "La fiche d'établissement d'abord : horaires, catégorie…",
   *     ]} />
   *
   * était donc masquée EN ENTIER, prose comprise. Or ces propriétés sont du
   * texte rendu à l'écran. Résultat : le correcteur les sautait, le
   * vérificateur aussi, et l'outil annonçait « aucun défaut » pendant que les
   * quatre articles affichaient des apostrophes droites et des deux-points sans
   * insécable. Deux fautes de raisonnement pour le prix d'une : masquer plus que
   * nécessaire, et faire juger le résultat par le même motif qui l'a produit.
   *
   * Aucune règle ne touche à la syntaxe JSX elle-même : les noms de balise et
   * d'attribut ne contiennent ni apostrophe, ni ponctuation haute, ni « € ».
   */
  const masque = /```[\s\S]*?```|`[^`\n]*`|\]\([^)]*\)/g;
  let m;
  while ((m = masque.exec(source))) zones.push([m.index, m.index + m[0].length]);
  const protege = (i) => zones.some(([a, b]) => i >= a && i < b);

  let sortie = "";
  let curseur = 0;
  const segments = [];
  for (const [a, b] of zones) {
    if (a > curseur) segments.push([curseur, a, true]);
    segments.push([a, b, false]);
    curseur = b;
  }
  if (curseur < source.length) segments.push([curseur, source.length, true]);

  const defauts = [];
  let corrections = 0;
  for (const [a, b, prose] of segments) {
    const brut = source.slice(a, b);
    if (!prose) {
      sortie += brut;
      continue;
    }
    const corrige = normalise(brut);
    if (corrige !== brut) corrections += 1;
    sortie += corrige;
    for (const d of verifie(FIX ? corrige : brut, REGLES_HORS_MDX))
      defauts.push({ ...d, fichier });
  }
  void protege;
  if (FIX && sortie !== source) writeFileSync(fichier, sortie);
  return { corrections, defauts };
}

/**
 * Fichiers de PROSE situés hors de `src/content`.
 *
 * Le principe du site est que 100 % du texte rendu passe par la couche contenu.
 * Deux fichiers y échappent légitimement : ils COMPOSENT du texte à partir de
 * la donnée, avec leurs propres phrases de liaison. Relevé le 2026-08-27 :
 * `/llms.txt` servait « Zone d'intervention » et « des points d'entrée » avec
 * l'apostrophe droite, et « Contact : » sans insécable. Le fichier est servi
 * aux assistants, c'est-à-dire à des lecteurs qui citent.
 */
const HORS_CONTENU = ["src/app/llms.txt/route.ts", "src/lib/json-ld.ts"];

const cibles = [
  ...fichiers(RACINE, /\.ts$/).filter((f) => !/\.test\.[jt]s$/.test(f)),
  ...fichiers(RACINE, /\.mdx$/),
  ...HORS_CONTENU,
];

let totalCorrections = 0;
const tousDefauts = [];
for (const fichier of cibles) {
  const r = /\.mdx$/.test(fichier) ? traiteMdx(fichier) : traiteTs(fichier);
  totalCorrections += r.corrections;
  tousDefauts.push(...r.defauts);
}

if (FIX) {
  console.log(`${totalCorrections} littéraux normalisés dans ${cibles.length} fichiers.`);
}

if (tousDefauts.length === 0) {
  console.log("✅ Typographie française : aucun défaut résiduel dans le contenu.");
  process.exit(0);
}

const parRegle = new Map();
for (const d of tousDefauts) {
  if (!parRegle.has(d.id)) parRegle.set(d.id, []);
  parRegle.get(d.id).push(d);
}
console.log(`\n⚠️  ${tousDefauts.length} défauts résiduels (correction manuelle) :\n`);
for (const [id, liste] of [...parRegle].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`## ${id} — ${liste.length}`);
  console.log(`   ${liste[0].quoi}`);
  for (const d of liste.slice(0, 10)) {
    console.log(`   · ${d.fichier} — ${JSON.stringify(d.extrait)}`);
  }
  if (liste.length > 10) console.log(`   … et ${liste.length - 10} autres`);
  console.log();
}
process.exit(1);
