/**
 * Shared rewrite helpers for the Framer static-port pipeline.
 * Identical logic to what produced the home fragments (`src/content/framer-html/*.ts`)
 * and `src/app/framer.css`, so every ported page stays consistent.
 */

/**
 * Apply the asset/url rewrites used across the port:
 *  - remove <script> tags (we do not ship Framer's runtime JS)
 *  - `https://framerusercontent.com` -> `/framerusercontent.com` (self-hosted under public/)
 *  - `https://fonts.gstatic.com`     -> `/fonts.gstatic.com`
 *  - strip query strings on those assets (`...jpg?scale-down-to=512` -> `...jpg`)
 * Works on HTML *and* CSS strings (covers src, srcset, and url()).
 * @param {string} input
 * @returns {string}
 */
export function rewriteAssets(input) {
  let out = input;
  // Drop Framer's runtime scripts (both paired and self-closing forms).
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<script\b[^>]*\/>/gi, "");
  // Self-host the two external asset origins.
  out = out.split("https://framerusercontent.com").join("/framerusercontent.com");
  out = out.split("https://fonts.gstatic.com").join("/fonts.gstatic.com");
  // Strip query strings on self-hosted assets (delimiters: quote, space, comma, ), backslash).
  out = out.replace(
    /(\/(?:framerusercontent\.com|fonts\.gstatic\.com)\/[^\s"'),\\]*)\?[^\s"'),\\]*/g,
    "$1",
  );
  return out;
}

/**
 * Serialize an HTML string into a `export const html = "..."` TS module.
 * JSON.stringify yields a valid double-quoted TS string literal (escapes
 * quotes/backslashes/newlines/control chars, keeps UTF-8 literals).
 * @param {string} html
 * @returns {string}
 */
export function toHtmlModule(html) {
  return `export const html = ${JSON.stringify(html)};\n`;
}
