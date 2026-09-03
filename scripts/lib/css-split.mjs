/**
 * CSS splitter for content-addressed Framer CSS.
 *
 * Framer scopes every page-section rule under the page-root hash
 * (e.g. `.framer-pK5Ni .framer-lotasx{...}`), while shared "chrome"
 * components are scoped under their own top-level hash
 * (`.framer-EGNs3 ...` for the header, `.framer-Rrp39 ...` for the footer).
 * Base rules / presets / @font-face / breakpoint media queries carry no
 * page-root hash.
 *
 * Therefore the split is purely mechanical and lossless:
 *   - PAGE   = every rule whose selector references `.framer-<rootHash>`
 *   - GLOBAL = everything else (base, presets, fonts, chrome components…)
 *
 * @media / @supports / @container blocks are recursed into and split so
 * that shared media rules stay global and page media rules move to the page
 * file. The union of {global, page} is byte-equivalent (rule-for-rule) to the
 * input — no declaration is ever dropped.
 */

const AT_WITH_NESTED_RULES = /^@(media|supports|container)\b/i;

/**
 * Tokenize a CSS string into top-level chunks, preserving comments/whitespace
 * as their own tokens so nothing is lost when we re-serialize.
 * @param {string} css
 * @returns {Array<{type:'rule'|'at-block'|'at-statement'|'raw', prelude?:string, body?:string, text:string}>}
 */
export function tokenizeTopLevel(css) {
  const tokens = [];
  let i = 0;
  const n = css.length;
  let preludeStart = 0;

  const readString = (quote, from) => {
    let j = from + 1;
    while (j < n) {
      const c = css[j];
      if (c === "\\") j += 2;
      else if (c === quote) return j + 1;
      else j++;
    }
    return n;
  };
  const readComment = (from) => {
    const end = css.indexOf("*/", from + 2);
    return end === -1 ? n : end + 2;
  };

  while (i < n) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      i = readComment(i);
      continue;
    }
    if (c === '"' || c === "'") {
      i = readString(c, i);
      continue;
    }
    if (c === ";") {
      // top-level at-statement (e.g. @import ...;) or stray semicolon
      const text = css.slice(preludeStart, i + 1);
      if (text.trim()) tokens.push({ type: "at-statement", text });
      i++;
      preludeStart = i;
      continue;
    }
    if (c === "{") {
      const prelude = css.slice(preludeStart, i);
      // find matching close brace, respecting strings/comments/nesting
      let depth = 1;
      let j = i + 1;
      while (j < n && depth > 0) {
        const d = css[j];
        if (d === "/" && css[j + 1] === "*") {
          j = readComment(j);
          continue;
        }
        if (d === '"' || d === "'") {
          j = readString(d, j);
          continue;
        }
        if (d === "{") depth++;
        else if (d === "}") depth--;
        j++;
      }
      const body = css.slice(i + 1, j - 1);
      const text = css.slice(preludeStart, j);
      const isAt = prelude.trimStart().startsWith("@");
      tokens.push({ type: isAt ? "at-block" : "rule", prelude, body, text });
      i = j;
      preludeStart = i;
      continue;
    }
    i++;
  }
  const tail = css.slice(preludeStart);
  if (tail.trim()) tokens.push({ type: "raw", text: tail });
  return tokens;
}

/**
 * Split a CSS string into { global, page } by page-root hash.
 * @param {string} css
 * @param {string} rootHash  bare hash, e.g. "pK5Ni"
 * @returns {{global:string, page:string}}
 */
export function splitCssByRootHash(css, rootHash) {
  const needle = `.framer-${rootHash}`;
  const tokens = tokenizeTopLevel(css);
  const globalParts = [];
  const pageParts = [];

  for (const t of tokens) {
    if (t.type === "raw" || t.type === "at-statement") {
      globalParts.push(t.text);
      continue;
    }
    if (t.type === "rule") {
      (t.prelude.includes(needle) ? pageParts : globalParts).push(t.text);
      continue;
    }
    // at-block
    if (AT_WITH_NESTED_RULES.test(t.prelude.trimStart())) {
      const inner = splitCssByRootHash(t.body, rootHash);
      if (inner.page.trim()) pageParts.push(`${t.prelude}{${inner.page}}`);
      if (inner.global.trim()) globalParts.push(`${t.prelude}{${inner.global}}`);
    } else {
      // @font-face / @keyframes / @page … — never page-scoped
      globalParts.push(t.text);
    }
  }
  return { global: globalParts.join(""), page: pageParts.join("") };
}
