/**
 * extract-framer-page.mjs — reusable extractor for the Framer static port.
 *
 * Given one archived Framer page (`site/le-site-d-origine/<page>.html`) and a
 * page name, it produces the raw material needed to wire that page into the
 * Next.js app, applying the exact same rewrites that produced the home:
 *
 *   1. HTML fragments, one per section (direct children of <main>, with
 *      consecutive responsive `ssr-variant` siblings of the same component
 *      merged) ->  src/content/framer-html/<page>/section-NN.ts
 *   2. The page-specific CSS (rules scoped under the page-root hash), rewritten
 *      ->  src/app/framer-<page>.css
 *   3. A _meta.json describing the page root, <main> class, and each section
 *      (index, primary component hash, data-framer-name) so the human can map
 *      section-NN files onto components.
 *
 * The shared chrome (header/footer/floating/shells/smooth-scroll) and all shared
 * CSS already live once in the layout + framer-global.css, so they are NOT
 * re-emitted here — only the page's own content and delta CSS.
 *
 * Usage:
 *   node scripts/extract-framer-page.mjs \
 *     --in ../site/le-site-d-origine/about.html \
 *     --page about \
 *     [--out .]            # project root (default: cwd)
 *     [--dry]              # print plan, write nothing
 *
 * NOT part of the runtime build. Requires the `node-html-parser` devDependency.
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { rewriteAssets, toHtmlModule } from "./lib/framer-rewrite.mjs";
import { splitCssByRootHash } from "./lib/css-split.mjs";

function parseArgs(argv) {
  const args = { out: process.cwd(), dry: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--in") args.in = argv[++i];
    else if (a === "--page") args.page = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--dry") args.dry = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (!args.in || !args.page) {
    throw new Error("Required: --in <source.html> --page <name>");
  }
  return args;
}

/** Bare hashes (e.g. "pK5Ni") of the top-level Framer components on this page. */
function readComponentHashes(root) {
  const styleEl = root.querySelector("style[data-framer-css-ssr-minified]");
  const attr = styleEl?.getAttribute("data-framer-components") ?? "";
  return attr
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => c.startsWith("framer-") && !c.startsWith("framer-lib-"))
    .map((c) => c.slice("framer-".length));
}

/** First component hash (from the known page component set) present in a subtree. */
function primaryComponent(el, componentSet) {
  for (const node of [el, ...el.querySelectorAll("*")]) {
    for (const cls of node.classNames.split(/\s+/)) {
      if (cls.startsWith("framer-")) {
        const bare = cls.slice("framer-".length);
        if (componentSet.has(bare)) return bare;
      }
    }
  }
  return null;
}

function isSsrVariant(el) {
  return el.classNames.split(/\s+/).includes("ssr-variant");
}

/**
 * Group <main>'s direct element children into logical sections:
 *  - a run of consecutive ssr-variant siblings sharing one primary component
 *    is one section (Desktop/Tablet/Phone variants of the same block);
 *  - any other child is its own section.
 */
function groupSections(mainEl, componentSet) {
  const kids = mainEl.childNodes.filter((n) => n.nodeType === 1);
  const groups = [];
  let i = 0;
  while (i < kids.length) {
    const el = kids[i];
    if (isSsrVariant(el)) {
      const sig = primaryComponent(el, componentSet);
      const run = [el];
      let j = i + 1;
      while (
        j < kids.length &&
        isSsrVariant(kids[j]) &&
        primaryComponent(kids[j], componentSet) === sig
      ) {
        run.push(kids[j]);
        j++;
      }
      groups.push({ nodes: run, component: sig });
      i = j;
    } else {
      groups.push({ nodes: [el], component: primaryComponent(el, componentSet) });
      i++;
    }
  }
  return groups;
}

function main() {
  const args = parseArgs(process.argv);
  const srcHtml = fs.readFileSync(args.in, "utf8");
  const root = parse(srcHtml, {
    comment: true, // keep <!--$--> SSR markers
    blockTextElements: { script: true, style: true, pre: true, code: true },
  });

  const rootDiv = root.querySelector("[data-framer-root]");
  if (!rootDiv) throw new Error("No [data-framer-root] element found.");
  const rootClass = rootDiv.getAttribute("class") ?? "";
  const rootHash = rootClass
    .split(/\s+/)
    .map((c) => c.replace(/^framer-/, ""))
    .find((h) => /^[A-Za-z0-9]{5}$/.test(h) && /[A-Z]/.test(h)); // page-root hashes are 5-char mixed-case
  if (!rootHash) {
    throw new Error(`Could not infer page-root hash from: ${rootClass}`);
  }

  const mainEl = rootDiv.querySelector("main");
  if (!mainEl) throw new Error("No <main> element inside the page root.");
  const mainClass = mainEl.getAttribute("class") ?? "";

  const componentSet = new Set(readComponentHashes(root));
  const groups = groupSections(mainEl, componentSet);

  // --- CSS: concatenate the font/breakpoint/ssr style blocks, rewrite, split.
  const fontCss = root.querySelector("style[data-framer-font-css]")?.text ?? "";
  const bpCss = root.querySelector("style[data-framer-breakpoint-css]")?.text ?? "";
  const ssrCss = root.querySelector("style[data-framer-css-ssr-minified]")?.text ?? "";
  const fullCss = rewriteAssets([fontCss, bpCss, ssrCss].join("\n"));
  const { page: pageCss } = splitCssByRootHash(fullCss, rootHash);

  // --- Emit plan
  const htmlDir = path.join(args.out, "src", "content", "framer-html", args.page);
  const cssPath = path.join(args.out, "src", "app", `framer-${args.page}.css`);
  const sections = groups.map((g, idx) => {
    const name = g.nodes[0].getAttribute("data-framer-name") ?? null;
    const html = rewriteAssets(g.nodes.map((n) => n.outerHTML).join(""));
    return {
      index: idx + 1,
      file: `section-${String(idx + 1).padStart(2, "0")}.ts`,
      component: g.component,
      framerName: name,
      variants: g.nodes.length,
      html,
    };
  });

  const meta = {
    page: args.page,
    source: path.relative(args.out, path.resolve(args.in)),
    rootHash,
    rootClass,
    rootStyle: rootDiv.getAttribute("style") ?? null,
    mainClass,
    mainStyle: mainEl.getAttribute("style") ?? null,
    mainFramerName: mainEl.getAttribute("data-framer-name") ?? null,
    componentHashes: [...componentSet],
    sectionCount: sections.length,
    sections: sections.map(({ html, ...rest }) => rest),
    cssBytes: pageCss.length,
  };

  console.log(`[extract] page=${args.page} rootHash=${rootHash} sections=${sections.length} pageCssBytes=${pageCss.length}`);
  for (const s of sections) {
    console.log(`  ${s.file}  component=${s.component ?? "?"}  name=${s.framerName ?? "-"}  variants=${s.variants}`);
  }

  if (args.dry) {
    console.log("[extract] --dry: nothing written.");
    return;
  }

  fs.mkdirSync(htmlDir, { recursive: true });
  for (const s of sections) {
    fs.writeFileSync(path.join(htmlDir, s.file), toHtmlModule(s.html));
  }
  fs.writeFileSync(path.join(htmlDir, "_meta.json"), JSON.stringify(meta, null, 2) + "\n");
  fs.mkdirSync(path.dirname(cssPath), { recursive: true });
  fs.writeFileSync(cssPath, pageCss);
  console.log(`[extract] wrote ${sections.length} fragments + _meta.json to ${htmlDir}`);
  console.log(`[extract] wrote page CSS to ${cssPath}`);
}

main();
