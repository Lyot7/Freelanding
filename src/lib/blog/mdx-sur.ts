import type { Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

/**
 * LE CORPS D'UN ARTICLE PAS ENCORE PUBLIÉ, LU COMME DES DONNÉES ET JAMAIS EXÉCUTÉ.
 *
 * Un article publié est compilé par `@next/mdx` au build : il a été validé par
 * Eliott, puis relu par les tests. Un article en attente de validation ne l'est
 * pas, et le MDX peut porter du JavaScript (`{expression}`, `export`, `import`).
 * L'aperçu du cockpit (`app/(apercu)/apercu/blog/[id]`) ne le compile donc
 * jamais : ce module en garde ce que le site sait afficher, et rien d'autre.
 *
 * - Le markdown passe par `mdast-util-from-markdown` et l'extension GFM : le
 *   même analyseur que remark, donc que `@next/mdx`, qui ne rend que des nœuds.
 * - Les blocs de la palette fermée (`components/blog/blocks.tsx`) sont reconnus
 *   par motif en début de ligne, et leurs attributs lus comme des valeurs : une
 *   chaîne, un nombre, un booléen ou un tableau de chaînes. Une expression
 *   reste lettre morte.
 *
 * Tout le reste, balise inconnue, `<script>` ou attribut `onerror` compris,
 * reste du texte, que React échappe. `CorpsSur` rend ces blocs avec les
 * composants de `mdx-components.tsx`, ceux de la page publiée.
 */

export const BLOCS = ["Figure", "Video", "Callout", "Stat", "Steps", "Quote"] as const;
export type NomBloc = (typeof BLOCS)[number];

export type Bloc =
  | { type: "markdown"; racine: Root }
  | { type: "Figure"; src: string; alt: string; caption?: string }
  | { type: "Video"; src: string; poster: string; caption?: string }
  | { type: "Callout"; title?: string; enfants: Bloc[] }
  | { type: "Quote"; author?: string; enfants: Bloc[] }
  | { type: "Stat"; value: string; label: string }
  | { type: "Steps"; items: string[] };

type Valeur = string | number | boolean | string[];
type Attributs = Record<string, Valeur>;

/** Au-delà, un bloc imbriqué reste du texte : un article n'en emboîte jamais autant. */
const PROFONDEUR_MAX = 3;
const OUVERTURE = /^<(Figure|Video|Callout|Stat|Steps|Quote)(?=[\s/>]|$)/;
const CLOTURE_CODE = /^ {0,3}(`{3,}|~{3,})/;
const NOM_ATTRIBUT = /[A-Za-z][\w-]*/y;
const GUILLEMETS = "\"'`";
const PROFONDEUR: Record<string, number> = { "{": 1, "}": -1 };

/**
 * Une adresse de lien sûre : web, courriel, téléphone, ancre ou chemin du site.
 * `javascript:`, `data:` et les adresses sans schéma ne sortent pas.
 */
export function adresseSure(href: string): string | null {
  const h = href.trim();
  if (/^https?:\/\//i.test(h) || /^(mailto|tel):/i.test(h)) return h;
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  if (h.startsWith("#")) return h;
  return null;
}

/** Une image ou une vidéo vient du site ou d'une adresse https, jamais d'un `data:` ni d'un `javascript:`. */
export function mediaSur(src: string): string | null {
  const sure = adresseSure(src);
  if (!sure) return null;
  return sure.startsWith("/") || sure.startsWith("http") ? sure : null;
}

/** Fin de la chaîne ouverte en `debut` (guillemet compris), échappements sautés ; -1 si elle ne ferme pas. */
function finChaine(source: string, debut: number): number {
  const guillemet = source[debut];
  let i = debut + 1;
  while (i < source.length) {
    if (source[i] === "\\") i += 2;
    else if (source[i] === guillemet) return i;
    else i++;
  }
  return -1;
}

/**
 * Position du `>` qui ferme la balise ouverte en `debut`, ou du `}` qui ferme
 * l'accolade ouverte en `debut` : les chaînes et les accolades imbriquées sont
 * sautées, un `>` dans un libellé ne coupe rien.
 */
function finBalise(source: string, debut: number, fermeture: ">" | "}"): number {
  let profondeur = 0;
  let i = debut;
  while (i < source.length) {
    const c = source[i];
    if (GUILLEMETS.includes(c)) {
      const fin = finChaine(source, i);
      if (fin < 0) return -1;
      i = fin + 1;
      continue;
    }
    profondeur += PROFONDEUR[c] ?? 0;
    if (c === fermeture && profondeur === 0) return i;
    i++;
  }
  return -1;
}

/** Une chaîne littérale, échappements JS compris ; brute si elle se lit mal. */
function lireChaine(litteral: string): string {
  if (!litteral.startsWith('"')) return litteral.slice(1, -1);
  try {
    return String(JSON.parse(litteral));
  } catch {
    return litteral.slice(1, -1);
  }
}

/** `[ "a", "b" ]` : un tableau de chaînes et rien d'autre, sinon null. */
export function lireTableau(expression: string): string[] | null {
  const items: string[] = [];
  let i = 1;
  while (i < expression.length - 1) {
    const c = expression[i];
    if (GUILLEMETS.includes(c)) {
      const fin = finChaine(expression, i);
      if (fin < 0) return null;
      items.push(lireChaine(expression.slice(i, fin + 1)));
      i = fin + 1;
    } else if (/[\s,]/.test(c)) i++;
    else return null;
  }
  return items;
}

/** Le contenu d'un `{…}` : nombre, booléen, chaîne ou tableau de chaînes. Une expression reste lettre morte. */
function lireExpression(brute: string): Valeur | null {
  const e = brute.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(e)) return Number(e);
  if (e === "true" || e === "false") return e === "true";
  if (e.startsWith("[") && e.endsWith("]")) return lireTableau(e);
  if (e.length > 1 && GUILLEMETS.includes(e[0]) && finChaine(e, 0) === e.length - 1) return lireChaine(e);
  return null;
}

/** La valeur qui commence en `i` (après le `=`) et l'indice qui la suit ; null si elle se lit mal. */
function lireValeur(texte: string, i: number): { valeur: Valeur | null; suite: number } | null {
  const c = texte[i];
  if (c === '"' || c === "'") {
    const fin = finChaine(texte, i);
    return fin < 0 ? null : { valeur: texte.slice(i + 1, fin), suite: fin + 1 };
  }
  if (c === "{") {
    const fin = finBalise(texte, i, "}");
    return fin < 0 ? null : { valeur: lireExpression(texte.slice(i + 1, fin)), suite: fin + 1 };
  }
  return null;
}

/** Les attributs d'une balise ouvrante, sans son nom : `src="…" items={[…]} priority`. */
export function lireAttributs(texte: string): Attributs | null {
  const attributs: Attributs = {};
  let i = 0;
  while (i < texte.length) {
    if (/\s/.test(texte[i])) {
      i++;
      continue;
    }
    NOM_ATTRIBUT.lastIndex = i;
    const nom = NOM_ATTRIBUT.exec(texte)?.[0];
    if (!nom) return null;
    i += nom.length;
    if (texte[i] !== "=") {
      attributs[nom] = true;
      continue;
    }
    const lu = lireValeur(texte, i + 1);
    if (!lu) return null;
    if (lu.valeur !== null) attributs[nom] = lu.valeur;
    i = lu.suite;
  }
  return attributs;
}

const chaine = (v: Valeur | undefined): string | undefined =>
  typeof v === "string" && v.trim() ? v : undefined;

/** Le bloc tel que le site le rendrait ; null si un attribut requis manque ou ne se lit pas. */
function construire(nom: NomBloc, a: Attributs, enfants: string, profondeur: number): Bloc | null {
  switch (nom) {
    case "Figure": {
      const src = mediaSur(chaine(a.src) ?? "");
      return src ? { type: "Figure", src, alt: chaine(a.alt) ?? "", caption: chaine(a.caption) } : null;
    }
    case "Video": {
      const src = mediaSur(chaine(a.src) ?? "");
      const poster = mediaSur(chaine(a.poster) ?? "");
      return src && poster ? { type: "Video", src, poster, caption: chaine(a.caption) } : null;
    }
    case "Stat": {
      const value = chaine(a.value);
      const label = chaine(a.label);
      return value && label ? { type: "Stat", value, label } : null;
    }
    case "Steps":
      return Array.isArray(a.items) && a.items.length > 0 ? { type: "Steps", items: a.items } : null;
    case "Callout":
      return { type: "Callout", title: chaine(a.title), enfants: decouper(enfants, profondeur + 1) };
    case "Quote":
      return { type: "Quote", author: chaine(a.author), enfants: decouper(enfants, profondeur + 1) };
  }
}

const OUVERTURES = Object.fromEntries(
  BLOCS.map((nom) => [nom, new RegExp(String.raw`<${nom}(?=[\s/>])`, "g")]),
) as Record<NomBloc, RegExp>;

/** Le `</Nom>` qui ferme la balise ouverte avant `depuis`, les balises du même nom imbriquées comptées ; -1 s'il manque. */
function trouverCloture(source: string, nom: NomBloc, depuis: number): number {
  const cloture = `</${nom}>`;
  let profondeur = 1;
  let i = depuis;
  for (;;) {
    const fin = source.indexOf(cloture, i);
    if (fin < 0) return -1;
    profondeur += [...source.slice(i, fin).matchAll(OUVERTURES[nom])].length - 1;
    if (profondeur === 0) return fin;
    i = fin + cloture.length;
  }
}

/** Le bloc qui s'ouvre en `debut`, et où il s'arrête ; null s'il est mal formé, il reste alors du texte. */
function lireBloc(
  source: string,
  debut: number,
  nom: NomBloc,
  profondeur: number,
): { bloc: Bloc; fin: number } | null {
  const finOuverture = finBalise(source, debut, ">");
  if (finOuverture < 0) return null;
  const interieur = source.slice(debut + 1 + nom.length, finOuverture).trimEnd();
  const autoFermant = interieur.endsWith("/");
  const attributs = lireAttributs(autoFermant ? interieur.slice(0, -1) : interieur);
  if (!attributs) return null;
  let fin = finOuverture + 1;
  let enfants = "";
  if (!autoFermant) {
    const position = trouverCloture(source, nom, fin);
    if (position < 0) return null;
    enfants = source.slice(fin, position);
    fin = position + `</${nom}>`.length;
  }
  const bloc = construire(nom, attributs, enfants, profondeur);
  return bloc ? { bloc, fin } : null;
}

/**
 * Du markdown, lu comme MDX le lit : GFM pour les tableaux, et pas de code
 * indenté, que MDX désactive (un paragraphe en retrait reste un paragraphe).
 */
function markdown(texte: string): Bloc[] {
  if (!texte.trim()) return [];
  const racine = fromMarkdown(texte, {
    extensions: [gfm({ singleTilde: false }), { disable: { null: ["codeIndented"] } }],
    mdastExtensions: [gfmFromMarkdown()],
  });
  return [{ type: "markdown", racine }];
}

/**
 * Le corps découpé en blocs : du markdown entre deux composants de la palette.
 * Un composant ne s'ouvre qu'en début de ligne et hors d'un bloc de code,
 * comme dans les articles du site.
 */
export function decouper(source: string, profondeur = 0): Bloc[] {
  const texte = source.replaceAll("\r\n", "\n");
  const blocs: Bloc[] = [];
  let debutMarkdown = 0;
  let position = 0;
  let dansCode = false;
  while (position < texte.length) {
    const saut = texte.indexOf("\n", position);
    const finLigne = saut === -1 ? texte.length : saut;
    const ligne = texte.slice(position, finLigne);
    if (CLOTURE_CODE.test(ligne)) dansCode = !dansCode;
    const nom = !dansCode && profondeur < PROFONDEUR_MAX ? OUVERTURE.exec(ligne)?.[1] : undefined;
    const lu = nom ? lireBloc(texte, position, nom as NomBloc, profondeur) : null;
    if (lu) {
      blocs.push(...markdown(texte.slice(debutMarkdown, position)), lu.bloc);
      position = lu.fin;
      debutMarkdown = position;
    } else {
      position = finLigne + 1;
    }
  }
  blocs.push(...markdown(texte.slice(debutMarkdown)));
  return blocs;
}

/** `<Prix offre="vitrine" suivi />` dans une phrase : l'offre et la forme, ou null si la balise est autre chose. */
export function lirePrix(html: string): { offre: string; suivi: boolean } | null {
  const balise = html.trim();
  if (!balise.startsWith("<Prix") || !balise.endsWith("/>")) return null;
  const interieur = balise.slice("<Prix".length, -2);
  if (interieur && !/^\s/.test(interieur)) return null;
  const attributs = lireAttributs(interieur);
  const offre = chaine(attributs?.offre);
  return offre ? { offre, suivi: attributs?.suivi === true } : null;
}
