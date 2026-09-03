/**
 * Preuve de NEUTRALITÉ GÉOMÉTRIQUE de la couche de focus.
 *
 * POURQUOI CE SCRIPT EN PLUS DE `audit-live`.
 * `audit-live` compare notre rendu au miroir de la source. C'est le bon outil
 * quand le dépôt est stable, mais il ne sait pas ISOLER une modification : si
 * quelqu'un d'autre touche `globals.css`, un composant partagé ou le pied de
 * page pendant la mesure, l'écart relevé n'appartient plus à personne. Ici tout
 * est mesuré dans la même page, dans la même session, à quelques
 * millisecondes d'intervalle : le résultat n'appartient qu'à la couche de focus.
 *
 * La couche de focus ne peut modifier la mise en page que par deux voies, et le
 * script les teste toutes les deux :
 *
 *   A. LE NŒUD AJOUTÉ. Le lien d'évitement est le seul élément que la couche
 *      ajoute au document. On relève la page, on le retire, on relève à nouveau.
 *      Étant en `position: fixed`, il ne doit rien déplacer, mais on le prouve
 *      au lieu de l'affirmer.
 *
 *   B. L'ANNEAU LUI-MÊME. Toutes les autres règles ne s'appliquent qu'à l'état
 *      `:focus-visible`, donc à rien tant qu'aucun élément n'a le focus. On
 *      tabule alors sur TOUTES les cibles de la page et on vérifie qu'à chaque
 *      arrêt la hauteur et la largeur du document sont rigoureusement celles de
 *      la page au repos. C'est le test qui échouerait immédiatement si l'anneau
 *      était dessiné avec `border`, `margin`, `padding` ou `width` au lieu de
 *      `outline` et `box-shadow`.
 *
 * ERREUR À NE PAS REFAIRE. Une première version neutralisait la couche en
 * supprimant du CSSOM toute règle contenant `:focus-visible`. En Tailwind v4 les
 * utilitaires vivent dans de vraies couches CSS, et le `cssText` d'un bloc
 * `@layer` contient TOUTES ses règles : le filtre supprimait donc la couche
 * `utilities` entière, ce qui démolissait la page et produisait des écarts de
 * plusieurs milliers de pixels. On ne touche plus au CSSOM.
 *
 * Usage : bun run scripts/focus-layout-neutral.mjs
 */

import { chromium } from "playwright";
import { freezeCssAnimationsOnLoad } from "./lib/still.mjs";

const LOCAL = "http://localhost:3000";
const PAGES = [
  "/",
  "/work",
  "/work/box-mode",
  "/about",
  "/blog",
  "/blog/stop-hiding-your-prices",
  "/contact",
  "/legal/politique-de-confidentialite",
  "/legal/conditions-generales-de-vente",
];
const MAX_TABS = 90;

/* Arguments optionnels, même convention que les autres scripts du dossier :
   une largeur, puis une route.  bun run scripts/focus-layout-neutral.mjs 1440 /work */
const ARGS = process.argv.slice(2);
const WIDTHS = ARGS.find((a) => /^\d+$/.test(a))
  ? [Number(ARGS.find((a) => /^\d+$/.test(a)))]
  : [390, 810, 1440];
const ROUTES = ARGS.find((a) => a.startsWith("/"))
  ? [ARGS.find((a) => a.startsWith("/"))]
  : null;

/** Hauteur, largeur et empreinte des boîtes, en coordonnées DOCUMENT. */
const SNAPSHOT = () => {
  const boxes = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.classList?.contains?.("skip-link")) continue;
    if (el.tagName.toLowerCase() === "nextjs-portal") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    boxes.push(
      `${Math.round(r.x)},${Math.round(r.y + window.scrollY)},${Math.round(r.width)},${Math.round(r.height)}`,
    );
  }
  return {
    height: document.documentElement.scrollHeight,
    width: document.documentElement.scrollWidth,
    boxes,
  };
};

const SIZE = () => ({
  height: document.documentElement.scrollHeight,
  width: document.documentElement.scrollWidth,
});

async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 700));
  });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
let worstSkip = 0;
let worstFocus = 0;
const failures = [];

for (const width of WIDTHS) {
  for (const path of ROUTES ?? PAGES) {
    const page = await ctx.newPage();
    await page.setViewportSize({ width, height: 900 });
    // Sans ce gel, les deux relevés du test A sont pris à 200 ms d'intervalle
    // pendant que les rubans, le ticker et le grain défilent : des dizaines de
    // boîtes diffèrent pour une raison qui n'a rien à voir avec le focus.
    await freezeCssAnimationsOnLoad(page);
    await page.goto(`${LOCAL}${path}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(900);
    await settle(page);

    /* --- A. Le lien d'évitement déplace-t-il quoi que ce soit ? --- */
    const avec = await page.evaluate(SNAPSHOT);
    await page.evaluate(() => document.querySelector(".skip-link")?.remove());
    await page.waitForTimeout(200);
    const sans = await page.evaluate(SNAPSHOT);
    const dH = avec.height - sans.height;
    const dW = avec.width - sans.width;
    const moved =
      avec.boxes.length === sans.boxes.length
        ? avec.boxes.filter((b, i) => b !== sans.boxes[i]).length
        : `compte ${avec.boxes.length}≠${sans.boxes.length}`;
    worstSkip = Math.max(worstSkip, Math.abs(dH), Math.abs(dW));

    /* --- B. L'anneau occupe-t-il de la place, à chaque arrêt ? --- */
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await settle(page);
    const ref = await page.evaluate(SIZE);
    let stops = 0;
    let maxDelta = 0;
    for (let i = 0; i < MAX_TABS; i += 1) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(45);
      const now = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        if (el.tagName.toLowerCase() === "nextjs-portal") return null;
        return {
          height: document.documentElement.scrollHeight,
          width: document.documentElement.scrollWidth,
        };
      });
      if (!now) break;
      stops += 1;
      const d = Math.max(
        Math.abs(now.height - ref.height),
        Math.abs(now.width - ref.width),
      );
      if (d > maxDelta) maxDelta = d;
    }
    worstFocus = Math.max(worstFocus, maxDelta);
    await page.close();

    const line =
      `${path}@${width}  lien d'évitement → dH:${dH} dL:${dW} boîtes déplacées:${moved}  ·  ` +
      `anneau sur ${stops} cibles → écart max:${maxDelta}px`;
    console.log(line);
    if (dH !== 0 || dW !== 0 || moved !== 0 || maxDelta !== 0) failures.push(line);
  }
}

await browser.close();
console.log(
  failures.length === 0
    ? `\nAucune page, aucune largeur, aucune cible ne bouge d'un pixel. La couche de focus n'occupe aucune place.`
    : `\n${failures.length} cas non nuls :\n` + failures.join("\n"),
);
