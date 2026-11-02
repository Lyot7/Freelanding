/**
 * Règles de typographie française — module partagé.
 *
 * POURQUOI CE FICHIER EXISTE. Ce site reproduit un template ANGLAIS. L'anglais
 * ne met aucune espace devant `: ; ! ?`, ignore les guillemets `« »` et écrit
 * l'apostrophe droite. Le français fait l'inverse sur les quatre points, et
 * aucun de ces manquements ne produit d'erreur : les types restent verts, la
 * page s'affiche, seul un typographe le voit. D'où ce module.
 *
 * CE QUE ÇA CORRIGE VRAIMENT, et ce n'est pas cosmétique. Une espace ORDINAIRE
 * devant « : » est sécable : le navigateur a le droit de renvoyer les deux
 * points seuls en début de ligne. Idem pour « 3 000 € », qui peut se couper
 * entre « 3 » et « 000 », et pour « 92 % ». L'insécable est la seule chose qui
 * l'interdise.
 *
 * QUELLE ESPACE, ET POURQUOI DEUX. La convention de l'Imprimerie nationale
 * distingue l'espace mot insécable (U+00A0) devant les deux-points, et l'espace
 * FINE insécable (U+202F) devant `; ! ?` et à l'intérieur des guillemets.
 * MESURÉ dans Geist à 100 px : espace ordinaire 29,56 px, U+00A0 29,56 px,
 * U+202F 14,78 px — exactement la moitié. La fine est donc un vrai glyphe de la
 * police, pas un caractère absent rendu en tofu (le carré .notdef mesure
 * 79,79 px dans la même police). Les deux espaces sont employées.
 *
 * CE QUI N'EST PAS TRAITÉ ICI. L'orthographe : elle est vérifiée séparément par
 * `scripts/orthographe.mjs`, qui interroge le dictionnaire français de macOS.
 */

/** Espace mot insécable — U+00A0. */
export const INSEC = " ";
/** Espace fine insécable — U+202F. */
export const FINE = " ";

const TOUTE_INSEC = `[${INSEC}${FINE}]`;

/**
 * Règles de VÉRIFICATION.
 *
 * Chaque règle porte un identifiant stable (repris par les tests), une
 * expression et une explication. `corrige` est facultatif : une règle sans
 * `corrige` signale un défaut qu'une machine ne doit pas réparer toute seule
 * (une phrase à réécrire, un mot anglais à traduire).
 */
export const REGLES = [
  {
    id: "apostrophe-droite",
    quoi: "apostrophe droite ' au lieu de l'apostrophe typographique ’",
    re: /(\p{L})'(?=\p{L})/gu,
    corrige: (t) => t.replace(/(\p{L})'(?=\p{L})/gu, "$1’"),
  },
  {
    id: "points-de-suspension",
    quoi: "trois points au lieu du caractère … (U+2026)",
    re: /\.\.\./g,
    corrige: (t) => t.replace(/\.\.\./g, "…"),
  },
  {
    id: "deux-points-espace-secable",
    quoi: "espace sécable devant « : » — les deux-points peuvent partir seuls à la ligne",
    // AUCUNE condition sur ce qui SUIT. La première version exigeait une espace
    // après, et laissait donc passer tout ce que le Markdown colle derrière la
    // ponctuation : `payer ?**`, `export »`, `simple :*`. Trois occurrences des
    // articles MDX étaient ainsi déclarées conformes à tort par le vérificateur
    // ET ignorées par le correcteur, qui partagent ces expressions.
    re: /\S[ \t]+:/g,
    corrige: (t) => t.replace(/(\S)[ \t]+:/g, `$1${INSEC}:`),
  },
  {
    id: "ponctuation-haute-espace-secable",
    quoi: "espace sécable devant ; ! ou ?",
    re: /\S[ \t]+[;!?]/g,
    corrige: (t) => t.replace(/(\S)[ \t]+([;!?])/g, `$1${FINE}$2`),
  },
  {
    id: "ponctuation-haute-collee",
    quoi: "; ! ou ? collé au mot précédent — il faut une fine insécable",
    re: /\p{L}[;!?]/gu,
    corrige: (t) => t.replace(/(\p{L})([;!?])/gu, `$1${FINE}$2`),
  },
  {
    id: "guillemet-ouvrant",
    quoi: "« non suivi d'une insécable",
    re: new RegExp(`«(?!${TOUTE_INSEC})`, "g"),
    corrige: (t) => t.replace(new RegExp(`«[ \t]*(?!${TOUTE_INSEC})`, "g"), `«${FINE}`),
  },
  {
    id: "guillemet-fermant",
    quoi: "» non précédé d'une insécable",
    re: new RegExp(`(?<!${TOUTE_INSEC})»`, "g"),
    corrige: (t) => t.replace(new RegExp(`[ \t]*(?<!${TOUTE_INSEC})»`, "g"), `${FINE}»`),
  },
  {
    id: "guillemet-droit",
    quoi: 'guillemet droit " au lieu de « … »',
    re: /"/g,
  },
  {
    id: "pourcent-espace-secable",
    quoi: "espace sécable devant % — « 92 » et « % » peuvent se retrouver sur deux lignes",
    re: /\d[ \t]+%/g,
    corrige: (t) => t.replace(/(\d)[ \t]+%/g, `$1${FINE}%`),
  },
  {
    id: "pourcent-colle",
    quoi: "% collé au nombre",
    re: /\d%/g,
    corrige: (t) => t.replace(/(\d)%/g, `$1${FINE}%`),
  },
  {
    id: "euro-espace-secable",
    quoi: "espace sécable devant € — le montant peut se couper avant sa devise",
    re: /\d[ \t]+€/g,
    corrige: (t) => t.replace(/(\d)[ \t]+€/g, `$1${INSEC}€`),
  },
  {
    id: "millier-espace-secable",
    quoi: "séparateur de milliers sécable — « 3 000 » peut se couper en « 3 » et « 000 »",
    re: /\d[ \t]\d{3}(?!\d)/g,
    corrige: (t) => t.replace(/(\d)[ \t](\d{3})(?!\d)/g, `$1${INSEC}$2`),
  },
  {
    id: "cadratin",
    quoi: "tiret cadratin — ou demi-cadratin – : proscrit sur ce site",
    // AUCUNE CORRECTION AUTOMATIQUE. Un cadratin remplit deux offices que la
    // machine ne sait pas distinguer :
    //   - séparateur de titre (« À propos — Bouquerel® »), qui se remplace par
    //     un point médian ;
    //   - incise dans une phrase, qui se réécrit avec des virgules ou des
    //     parenthèses, et seule une relecture sait laquelle.
    // Substituer à l'aveugle produirait « À propos, Bouquerel® » ou une phrase
    // à deux virgules de trop.
    re: /[—–]/g,
  },
  {
    id: "ligature-oe",
    quoi: "« oe » non ligaturé — le français écrit œ",
    re: /(coeur|oeuvre|soeur|oeil|voeu|noeud|oeuf|boeuf|oesoph|coex|foetus)/gi,
    // Pas de correction automatique : « coexistence » est correct, « coeur » ne
    // l'est pas, et seule une relecture les distingue.
  },
  {
    id: "ordinal-mal-abrege",
    quoi: "ordinal mal abrégé — le français écrit 1er, 1re, 2e, 3e (jamais 2ème)",
    re: /\b\d+(ème|eme|ieme|iere)\b/gi,
  },
  {
    id: "espace-avant-virgule",
    quoi: "espace devant une virgule ou un point",
    re: /\s[,.](?=\s|$)/g,
    corrige: (t) => t.replace(/[ \t]+([,.])(?=\s|$)/g, "$1"),
  },
  {
    id: "double-espace",
    quoi: "espace double à l'intérieur d'une phrase",
    re: /\S {2,}\S/g,
    corrige: (t) => t.replace(/(\S) {2,}(\S)/g, "$1 $2"),
  },
];

/**
 * Règles inapplicables au MDX.
 *
 * `guillemet-droit` cherche le caractère `"`. Dans un article MDX, ce caractère
 * est aussi le DÉLIMITEUR des attributs JSX (`<Callout title="…">`) et des
 * chaînes d'un tableau passé en propriété. Le signaler y produirait cinquante
 * fausses alertes qui noieraient les vraies. Les fichiers TypeScript, eux,
 * restent couverts : le parseur leur rend le CONTENU des chaînes, où un `"`
 * ne peut être qu'un vrai guillemet.
 */
export const REGLES_HORS_MDX = new Set(["guillemet-droit"]);

/**
 * Une chaîne qui n'est pas de la prose : adresse, chemin, classe, identifiant.
 *
 * SOURCE UNIQUE, importée par `scripts/typo-fr.mjs` ET par le test
 * `src/content/typographie.test.mjs`. Les deux en portaient une copie, et une
 * copie qui dérive est une garantie qui ment.
 *
 * DEUX ERREURS DE CLASSEMENT y ont été corrigées le 2026-08-27, l'une et
 * l'autre repérées sur le texte RENDU, pas sur la source :
 *
 *   1. « aucune lettre » ne suffit pas à écarter une chaîne. « 100% », « −92 % »
 *      et « 3 000 € » n'ont pas une lettre et sont pourtant de la typographie
 *      française à part entière. La condition ne vaut plus que si la chaîne n'a
 *      NI lettre NI chiffre.
 *   2. « tous les mots ressemblent à une classe utilitaire » attrapait
 *      « Votre message ici... », dont les trois mots satisfont le motif des
 *      classes Tailwind. Une vraie liste de classes contient toujours au moins
 *      un séparateur (`-`, `:` ou `/`) : c'est désormais exigé.
 */
export function estTechnique(texte) {
  const t = texte.trim();
  if (t.length < 2) return true;
  if (!/[\p{L}\d]/u.test(t)) return true;
  if (/^(https?:|mailto:|tel:|data:|\/|#|@)/.test(t)) return true;
  if (/^[\w.-]+\.(ts|tsx|js|mjs|json|svg|jpe?g|png|webp|mp4|webm|woff2?|css|mdx)$/i.test(t)) {
    return true;
  }
  if (/[[\]]/.test(t) && !/[À-ÿ]/.test(t)) return true;
  // Type MIME et valeur d'en-tête : « text/plain; charset=utf-8 » porte un
  // point-virgule qui n'est pas de la ponctuation française.
  if (/^[\w.+-]+\/[\w.+-]+(?:\s*;\s*[\w-]+=[\w"'-]+)*$/.test(t)) return true;
  const mots = t.split(/\s+/);
  const motClasse = /^(?:[a-z0-9]+:)*-?[a-z0-9]+(?:[-/.][a-z0-9%.[\]]+)*$/i;
  if (
    mots.length > 1 &&
    mots.some((m) => /[-:/]/.test(m)) &&
    mots.every((m) => motClasse.test(m))
  ) {
    return true;
  }
  // Identifiant isolé : `sectionOrder`, `data-part`, `image/png`. Un mot seul
  // accentué ou apostrophé est de la prose, un mot seul chiffré aussi.
  if (!/\s/.test(t) && !/[À-ÿ’%€]/.test(t) && !/\d/.test(t)) return true;
  return false;
}

/** Applique toutes les corrections automatiques disponibles. */
export function normalise(texte) {
  let sortie = texte;
  for (const regle of REGLES) {
    if (regle.corrige) sortie = regle.corrige(sortie);
  }
  return sortie;
}

/**
 * Liste les infractions d'un texte.
 *
 * @returns {{id: string, quoi: string, motif: string, extrait: string, index: number}[]}
 */
export function verifie(texte, ignorer = new Set()) {
  const trouvailles = [];
  for (const regle of REGLES) {
    if (ignorer.has(regle.id)) continue;
    regle.re.lastIndex = 0;
    let m;
    while ((m = regle.re.exec(texte))) {
      trouvailles.push({
        id: regle.id,
        quoi: regle.quoi,
        motif: m[0],
        index: m.index,
        extrait: texte
          .slice(Math.max(0, m.index - 40), m.index + m[0].length + 40)
          .replace(/\s+/g, " ")
          .trim(),
      });
      if (m[0].length === 0) regle.re.lastIndex += 1;
    }
  }
  return trouvailles;
}

/**
 * Normalise et vérifie la prose d'un article MDX.
 *
 * NE SONT NEUTRALISÉS QUE : blocs de code, code en ligne, cibles de liens.
 *
 * LES BALISES JSX NE LE SONT PAS (correctif du 2026-08-27). Le motif portait
 * `<[^>]+>`, où `[^>]` avale aussi les retours à la ligne : une balise
 * multiligne comme `<Steps items={[ "…" ]} />` était masquée EN ENTIER, prose
 * comprise, alors que ces propriétés sont du texte rendu à l'écran. Aucune
 * règle ne touche à la syntaxe JSX elle-même : les noms de balise et
 * d'attribut ne contiennent ni apostrophe, ni ponctuation haute, ni « € ».
 *
 * LA JONCTION APRÈS UNE ZONE NEUTRALISÉE (correctif du 2026-11-02). La prose
 * est traitée par segments entre les zones. Le segment qui suit
 * `[libellé](/page)` commençait donc par « : », sans le caractère qui précède
 * l'espace : la règle `\S[ \t]+:` ne pouvait pas l'atteindre, et le correcteur
 * laissait une espace ordinaire que le test (qui réduit le lien à son libellé)
 * refuse. Un article validé échouait ainsi à la publication automatique. Le
 * segment est désormais jugé AVEC le caractère que le lecteur voit juste avant :
 * la fin du libellé d'un lien, ou un mot pour du code, comme le fait le test.
 *
 * @param {string} source
 * @param {boolean} fix - juger le texte corrigé (true) ou tel quel (false)
 * @returns {{sortie: string, corrections: number, defauts: ReturnType<typeof verifie>}}
 */
export function normaliseMdx(source, fix) {
  const zones = [];
  const masque = /```[\s\S]*?```|`[^`\n]*`|\]\([^)]*\)/g;
  let m;
  while ((m = masque.exec(source))) zones.push([m.index, m.index + m[0].length]);

  const segments = [];
  let curseur = 0;
  for (const [a, b] of zones) {
    if (a > curseur) segments.push([curseur, a, true]);
    segments.push([a, b, false]);
    curseur = b;
  }
  if (curseur < source.length) segments.push([curseur, source.length, true]);

  /** Caractère vu par le lecteur juste avant un segment de prose. */
  const contexte = (i) => {
    const zone = segments[i - 1];
    if (!zone || zone[2]) return "";
    if (source[zone[0]] === "]") {
      const avant = source[zone[0] - 1];
      return avant && avant !== "[" ? avant : "x";
    }
    return "e";
  };

  let sortie = "";
  let corrections = 0;
  const defauts = [];
  segments.forEach(([a, b, prose], i) => {
    const brut = source.slice(a, b);
    if (!prose) {
      sortie += brut;
      return;
    }
    let prefixe = contexte(i);
    let corrige = normalise(prefixe + brut);
    // Le préfixe ne sert que de contexte : si une règle l'a modifié, on
    // retombe sur le segment seul plutôt que de réécrire ce qui précède.
    if (!corrige.startsWith(prefixe)) {
      prefixe = "";
      corrige = normalise(brut);
    }
    corrige = corrige.slice(prefixe.length);
    if (corrige !== brut) corrections += 1;
    sortie += corrige;
    const juge = prefixe + (fix ? corrige : brut);
    // Un défaut contenu tout entier dans le préfixe appartient au segment
    // précédent, déjà jugé : seul compte ce qui touche ce segment-ci.
    for (const d of verifie(juge, REGLES_HORS_MDX)) {
      if (d.index + d.motif.length > prefixe.length) defauts.push(d);
    }
  });
  return { sortie, corrections, defauts };
}
