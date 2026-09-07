import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Sommaire d'un article : les titres de section, avec leur ancre.
 *
 * LU DANS LE FICHIER, PAS DANS LE RENDU. Le corps d'un article est du MDX
 * compilé par le bundler : au moment où la page s'assemble, ses titres n'existent
 * que dans l'arbre React, et les extraire supposerait de le parcourir. Le fichier
 * source, lui, est un texte : trois lignes de lecture suffisent, côté serveur,
 * sans rien changer au rendu. Ces pages étant prérendues, la lecture a lieu au
 * build et jamais à la requête.
 *
 * L'IDENTIFIANT EST CALCULÉ DES DEUX CÔTÉS PAR LA MÊME FONCTION : ici pour les
 * liens, et dans `src/mdx-components.tsx` pour les `id` posés sur les titres.
 * C'est la seule chose qui garantit qu'un lien du sommaire tombe sur sa section
 * — deux slugifications approchantes donneraient des ancres mortes, sans erreur
 * ni au build ni au rendu.
 */

/** Dossier des corps d'article, relatif à ce module. */
const ARTICLES = join(process.cwd(), "src", "content", "articles");

export interface EntreeSommaire {
  /** Cible de l'ancre, sans le `#`. */
  id: string;
  /** Titre tel qu'il est écrit dans l'article. */
  titre: string;
}

/**
 * Identifiant d'ancre d'un titre.
 *
 * Les accents sont décomposés puis retirés (`NFD`), le reste devient des tirets.
 * Un titre entièrement composé de ponctuation retomberait sur une chaîne vide :
 * il reçoit alors `section`, ce qui vaut mieux qu'un `id` absent.
 */
export function idDeTitre(titre: string): string {
  return (
    titre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

/**
 * Titres de niveau 2 d'un article, dans l'ordre.
 *
 * Seul le niveau 2 entre au sommaire : c'est le découpage en sections. Les
 * niveaux 3 sont des subdivisions internes, et les faire figurer donnerait une
 * liste plus longue que la colonne qui l'accueille.
 *
 * Les titres à l'intérieur d'un bloc de code sont ignorés : un `## ` dans un
 * exemple de markdown n'est pas une section de l'article.
 */
export function sommaireDeLArticle(slug: string): EntreeSommaire[] {
  let source: string;
  try {
    source = readFileSync(join(ARTICLES, `${slug}.mdx`), "utf8");
  } catch {
    return [];
  }

  const entrees: EntreeSommaire[] = [];
  let dansUnBlocDeCode = false;

  for (const ligne of source.split("\n")) {
    if (ligne.startsWith("```")) {
      dansUnBlocDeCode = !dansUnBlocDeCode;
      continue;
    }
    if (dansUnBlocDeCode) continue;

    const titre = /^##\s+(.+?)\s*$/.exec(ligne)?.[1];
    if (titre) entrees.push({ id: idDeTitre(titre), titre });
  }

  return entrees;
}

/**
 * Sommaire d'un document dont le corps est déjà structuré en blocs.
 *
 * POURQUOI IL NE PASSE PAS PAR LE FICHIER, contrairement à `sommaireDeLArticle`.
 * Les pages légales ne sont pas du MDX : leur corps vit dans `content/legal.ts`
 * sous forme d'un tableau de blocs typés, où un titre est déjà un titre. Il n'y
 * a donc rien à analyser, seulement à filtrer — et surtout rien à lire sur le
 * disque, ce qui rend la fonction utilisable partout, y compris là où le système
 * de fichiers n'est pas disponible.
 *
 * MÊME NIVEAU RETENU QUE POUR LES ARTICLES, le 2 : c'est le découpage en
 * sections. Les niveaux 3 subdivisent une section et allongeraient la colonne
 * au-delà de ce qu'elle peut tenir sans défiler pour elle-même.
 */
export function sommaireDesBlocs(
  blocs: readonly { type: string; level?: number; text?: string }[],
): EntreeSommaire[] {
  const entrees: EntreeSommaire[] = [];
  for (const bloc of blocs) {
    if (bloc.type !== "heading" || bloc.level !== 2) continue;
    const titre = (bloc.text ?? "").trim();
    if (!titre) continue;
    entrees.push({ id: idDeTitre(titre), titre });
  }
  return entrees;
}
