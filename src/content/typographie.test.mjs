import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  verifie,
  estTechnique,
  normaliseMdx,
  REGLES_HORS_MDX,
  INSEC,
  FINE,
} from "../../scripts/lib/typo-fr.mjs";

/**
 * La typographie française du contenu, tenue par la suite de tests.
 *
 * POURQUOI UN TEST ET PAS SEULEMENT UN SCRIPT. `bun run scripts/typo-fr.mjs`
 * corrige, mais personne ne le lance avant d'écrire une phrase. Or la classe
 * d'erreur ici est SILENCIEUSE : une espace ordinaire devant « : » compile, se
 * rend, et ne se voit qu'au moment où le navigateur décide de renvoyer les deux
 * points seuls en début de ligne, à une largeur de fenêtre précise. Le seul
 * moment où quelqu'un le remarque, c'est en production.
 *
 * Ce test échoue à la première phrase mal ponctuée ajoutée au contenu. La
 * réparation tient en une commande :
 *
 *     bun run scripts/typo-fr.mjs --fix
 *
 * CE QUI EST COUVERT : `src/content/**` — les littéraux de chaîne des fichiers
 * TypeScript et la prose des articles MDX. Les commentaires du code n'y sont
 * pas : personne ne les lit à l'écran.
 */

const RACINE = path.join(import.meta.dirname);

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


/** Prose d'un article MDX telle que le lecteur la voit (voir `chainesDe`). */
function proseMdx(source) {
  return source
    .replace(/```[\s\S]*?```|`[^`\n]*`/g, "code")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

function chainesDe(fichier) {
  const source = readFileSync(fichier, "utf8");
  if (/\.mdx$/.test(fichier)) {
    // Blocs de code et code en ligne : neutralisés. PAS les balises JSX :
    // `<Steps items={[ "…" ]} />` porte de la prose rendue à l'écran, et la
    // masquer revenait à ne pas vérifier les articles.
    //
    // LES LIENS MARKDOWN SONT RÉDUITS À LEUR LIBELLÉ, et non remplacés par une
    // espace. Le remplacement par une espace fabriquait un défaut à chaque fois
    // qu'un lien fermait une phrase : `…de site](/services/site-vitrine).`
    // devenait `…de site .`, soit une fausse « espace devant un point ». Les
    // articles n'avaient aucun lien tant qu'aucun ne menait vers une page de
    // prestation, ce qui a masqué le défaut du vérificateur lui-même.
    //
    // Réduire au libellé est plus JUSTE et plus SÉVÈRE : le texte du lien est
    // désormais vérifié, et sa jonction avec la ponctuation qui l'entoure aussi.
    // Le code est remplacé par un MOT, pas par une espace, pour la même raison :
    // `` `Offer`, `` deviendrait « ` ,` », soit une fausse espace devant une
    // virgule. Le mot n'est jugé par aucune règle, il tient seulement la place.
    return [proseMdx(source)];
  }
  const arbre = ts.createSourceFile(fichier, source, ts.ScriptTarget.Latest, true);
  const out = [];
  const visite = (n) => {
    const litteral = ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n);
    const morceau =
      ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n);
    if ((litteral || morceau) && n.text && !estTechnique(n.text)) out.push(n.text);
    ts.forEachChild(n, visite);
  };
  visite(arbre);
  return out;
}

/**
 * Prose située HORS de `src/content` : deux fichiers composent du texte à
 * partir de la donnée, avec leurs propres phrases de liaison. `/llms.txt` est
 * servi aux assistants, donc à des lecteurs qui citent.
 */
const HORS_CONTENU = ["app/llms.txt/route.ts", "lib/json-ld.ts"].map((f) =>
  path.join(RACINE, "..", f),
);

const cibles = [
  ...fichiers(RACINE, /\.ts$/).filter((f) => !/\.test\.[jt]s$/.test(f)),
  ...fichiers(RACINE, /\.mdx$/),
  ...HORS_CONTENU,
];

describe("typographie française du contenu", () => {
  test("le corpus n'est pas vide (garde-fou du test lui-même)", () => {
    // Sans cette assertion, une erreur de chemin ferait passer la suite en
    // vérifiant zéro fichier — le pire des faux verts.
    expect(cibles.length).toBeGreaterThan(10);
  });

  for (const fichier of cibles) {
    const nom = path.relative(path.join(RACINE, "../.."), fichier);
    test(nom, () => {
      const ignorer = /\.mdx$/.test(fichier) ? REGLES_HORS_MDX : new Set();
      const defauts = chainesDe(fichier).flatMap((t) => verifie(t, ignorer));
      if (defauts.length > 0) {
        const resume = defauts
          .slice(0, 8)
          .map((d) => `  · [${d.id}] ${d.quoi}\n    ${JSON.stringify(d.extrait)}`)
          .join("\n");
        throw new Error(
          `${defauts.length} défaut(s) de typographie française dans ${nom} :\n${resume}\n` +
            `\nRéparation : bun run scripts/typo-fr.mjs --fix`,
        );
      }
      expect(defauts).toHaveLength(0);
    });
  }
});

/**
 * Le correcteur MDX et ce test doivent juger la même chose. Le 2026-11-02, un
 * article validé échouait à la publication automatique : `--fix` laissait une
 * espace ordinaire devant « : » quand les deux-points suivaient un lien
 * (`[libellé](/page) : suite`), parce qu'il traitait la prose APRÈS le lien
 * sans voir le libellé qui la précède. Ce test-ci, qui réduit le lien à son
 * libellé, refusait le résultat.
 */
describe("correcteur MDX : jonction après un lien ou du code", () => {
  const cas = [
    ["deux-points après un lien", "Voir [la page](/services/site) : tout y est.", `[la page](/services/site)${INSEC}: tout`],
    ["point-virgule après un lien", "Voir [la page](/a) ; puis la suite.", `[la page](/a)${FINE}; puis`],
    ["point d'interrogation collé à un lien", "Avez-vous lu [la page](/a)? Oui.", `[la page](/a)${FINE}? Oui`],
    ["deux-points après du code", "La commande `bun test` : elle suffit.", `\`bun test\`${INSEC}: elle`],
  ];
  for (const [nom, source, attendu] of cas) {
    test(nom, () => {
      const { sortie, defauts } = normaliseMdx(source, true);
      expect(sortie).toContain(attendu);
      expect(defauts).toHaveLength(0);
      expect(verifie(proseMdx(sortie), REGLES_HORS_MDX)).toHaveLength(0);
    });
  }

  test("le défaut est signalé avant correction", () => {
    const { defauts } = normaliseMdx("Voir [la page](/a) : la suite.", false);
    expect(defauts.map((d) => d.id)).toContain("deux-points-espace-secable");
  });

  test("la cible du lien n'est jamais réécrite", () => {
    const source = "Voir [la page](/a?b=1 : c) : la suite.";
    expect(normaliseMdx(source, true).sortie).toContain("(/a?b=1 : c)");
  });
});
