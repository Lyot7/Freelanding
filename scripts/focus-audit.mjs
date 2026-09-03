/**
 * Audit du focus clavier — ordre de tabulation, contraste RÉEL, planches de vignettes.
 *
 * Ce que le script prouve, et pourquoi chaque preuve est nécessaire :
 *
 * 1. ORDRE DE TABULATION. On appuie réellement sur Tab, page par page, et on
 *    enregistre l'élément qui reçoit le focus à chaque frappe. Lire le DOM ne
 *    suffirait pas : `display:none`, `visibility:hidden`, `tabindex` négatif et
 *    conteneurs `inert` changent l'ordre effectif sans changer l'ordre source.
 *
 * 2. ÉLÉMENTS INVISIBLES OU HORS ÉCRAN. Pour chaque cible on relève sa boîte
 *    APRÈS le défilement automatique du navigateur. Un bouton qui reste sous le
 *    bord bas, ou de taille nulle, est un piège : l'utilisateur ne voit plus où
 *    il est. C'est exactement ce que faisait la pastille du menu flottant avant
 *    d'être révélée.
 *
 * 3. CONTRASTE MESURÉ, PAS DÉCLARÉ. L'anneau est un double anneau clair+sombre
 *    précisément parce qu'aucune couleur unique ne tient sur les fonds du site.
 *    Le vérifier « à l'œil » ne veut rien dire sur une photo. On capture donc la
 *    zone de l'anneau AVANT le focus (donc le fond réel, photo comprise), on
 *    décode les pixels dans un canvas, et on exige que pour CHAQUE pixel du
 *    pourtour, au moins un des deux tons atteigne 3:1. C'est le critère WCAG
 *    1.4.11 appliqué au pire pixel, pas à une moyenne.
 *
 * 4. ZÉRO DÉCALAGE. La boîte de l'élément et la hauteur du document sont
 *    relevées avant et après focus. `outline` et `box-shadow` sont hors flux :
 *    tout écart signalerait une propriété qui occupe de la place.
 *
 * 5. PLANCHES DE VIGNETTES. Chaque cible focalisée est recadrée, puis les
 *    vignettes sont assemblées en une planche HTML rendue par le navigateur.
 *    C'est le seul moyen de VOIR qu'un anneau n'est pas rogné par un
 *    `overflow: hidden` ou noyé dans une image.
 *
 * Usage :
 *   bun run scripts/focus-audit.mjs            # 8 routes × 1440 et 390
 *   bun run scripts/focus-audit.mjs 1440 /work # une largeur, une route
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { freezeCssAnimationsOnLoad } from "./lib/still.mjs";

const LOCAL = "http://localhost:3000";
const OUT = resolve(process.cwd(), ".artifacts/focus");

/**
 * Les 9 routes du site. Les deux pages légales partagent leur gabarit, mais pas
 * leur contenu : l'ordre de tabulation suit les liens du corps de texte, qui
 * diffèrent d'un document à l'autre. Ne contrôler qu'une des deux laissait donc
 * la moitié du parcours clavier hors mesure.
 */
const ROUTES = [
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

const WIDTHS = [1440, 390];
const HEIGHT = 900;

/** Nombre maximal de frappes Tab par page — garde-fou contre un piège réel. */
const MAX_TABS = 90;
/** Marge autour de la cible dans la vignette (l'anneau déborde de 8px). */
const CROP_PAD = 22;

/* --------------------------------- Outils --------------------------------- */

const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";

/* --------------------------- Relevé dans la page --------------------------- */

/** Signature de l'élément focalisé : identité + géométrie + visibilité. */
const DESCRIBE = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  // `<nextjs-portal>` est la surcouche d'erreurs du serveur de DEV : elle est
  // focusable, elle n'existe pas en production, et elle fausserait le verdict
  // « hors écran ». On l'ignore.
  if (el.tagName.toLowerCase() === "nextjs-portal") return null;
  // IDENTITÉ STABLE. Une clé fabriquée à partir du libellé et de la position
  // écran ne tient pas : la page défile pendant la tabulation, donc le même
  // élément change de `y`, et deux boutons de même libellé peuvent se
  // confondre. On marque donc chaque cible une fois pour toutes. L'attribut est
  // inerte pour la mise en page.
  if (!el.dataset.focusAuditId) {
    window.__focusAuditSeq = (window.__focusAuditSeq || 0) + 1;
    el.dataset.focusAuditId = String(window.__focusAuditSeq);
  }
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const label = (
    el.getAttribute("aria-label") ||
    el.textContent ||
    el.getAttribute("placeholder") ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return {
    id: el.dataset.focusAuditId,
    tag: el.tagName.toLowerCase(),
    type: el.getAttribute("type") || "",
    href: el.getAttribute("href") || "",
    cls: (el.getAttribute("class") || "").slice(0, 40),
    label,
    rect: {
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
    },
    hidden:
      cs.visibility === "hidden" ||
      cs.display === "none" ||
      Number(cs.opacity) === 0,
    outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor} / off ${cs.outlineOffset}`,
    shadow: cs.boxShadow.slice(0, 90),
    docHeight: document.documentElement.scrollHeight,
    scrollY: window.scrollY,
  };
};

/**
 * Analyse du pourtour : pour chaque pixel de la couronne où l'anneau sera peint,
 * on calcule le contraste du ton CLAIR et du ton SOMBRE contre ce pixel de fond,
 * et on garde le meilleur des deux. Le verdict de la cible est le PIRE de ces
 * meilleurs : c'est le pixel le plus défavorable de tout le pourtour.
 */
const RING_CONTRAST = async ({ dataUrl, box, halo }) => {
  // Luminance relative et rapport de contraste WCAG 1.4.11, définis ici même :
  // la fonction est sérialisée puis évaluée dans la page, elle ne peut donc
  // référencer aucune aide déclarée côté Node.
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return (hi + 0.05) / (lo + 0.05);
  };

  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const LIGHT = 1; // luminance du blanc
  const DARK = 0.00335; // luminance de #0b0b0b

  let worst = Infinity;
  let worstPx = null;
  let lightMin = Infinity;
  let darkMin = Infinity;
  let samples = 0;

  const inside = (x, y) =>
    x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;

  for (let y = Math.max(0, box.y - halo); y < Math.min(canvas.height, box.y + box.h + halo); y += 1) {
    for (let x = Math.max(0, box.x - halo); x < Math.min(canvas.width, box.x + box.w + halo); x += 1) {
      // Couronne uniquement : on ignore l'intérieur de l'élément.
      if (inside(x, y)) continue;
      const i = (y * canvas.width + x) * 4;
      const l = lum(px[i], px[i + 1], px[i + 2]);
      const cl = ratio(LIGHT, l);
      const cd = ratio(DARK, l);
      lightMin = Math.min(lightMin, cl);
      darkMin = Math.min(darkMin, cd);
      const best = Math.max(cl, cd);
      if (best < worst) {
        worst = best;
        worstPx = [px[i], px[i + 1], px[i + 2]];
      }
      samples += 1;
    }
  }
  // BANDE INTÉRIEURE. Quand la cible occupe toute la fenêtre (cartes projet
  // épinglées, 1440 × 900), il n'existe aucun pixel de pourtour à échantillonner
  // et le verdict serait « non mesuré ». C'est précisément le cas où l'anneau
  // est dessiné vers l'intérieur : on mesure alors la bande INTERNE, sur la
  // même épaisseur.
  let mode = "exterieur";
  if (samples === 0) {
    mode = "interieur";
    const x0 = Math.max(0, box.x);
    const x1 = Math.min(canvas.width, box.x + box.w);
    const y0 = Math.max(0, box.y);
    const y1 = Math.min(canvas.height, box.y + box.h);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const nearEdge =
          x - box.x < halo ||
          box.x + box.w - x <= halo ||
          y - box.y < halo ||
          box.y + box.h - y <= halo;
        if (!nearEdge) continue;
        const i = (y * canvas.width + x) * 4;
        const l = lum(px[i], px[i + 1], px[i + 2]);
        const cl = ratio(LIGHT, l);
        const cd = ratio(DARK, l);
        lightMin = Math.min(lightMin, cl);
        darkMin = Math.min(darkMin, cd);
        const best = Math.max(cl, cd);
        if (best < worst) {
          worst = best;
          worstPx = [px[i], px[i + 1], px[i + 2]];
        }
        samples += 1;
      }
    }
  }

  return {
    mode,
    samples,
    worstBest: worst,
    worstPx,
    lightMin: lightMin === Infinity ? null : lightMin,
    darkMin: darkMin === Infinity ? null : darkMin,
  };
};

/* ------------------------------- Parcours ---------------------------------- */

async function auditRoute(context, route, width) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: HEIGHT });
  await freezeCssAnimationsOnLoad(page);

  await page.goto(`${LOCAL}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const steps = [];
  let trapped = null;
  let stuck = 0;

  // Le focus part de la barre d'adresse : le premier Tab doit tomber sur le
  // lien d'évitement, sinon il n'est pas le premier nœud du document.
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });

  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press("Tab");
    // 220 ms : au-delà de la transition de 140 ms du lien d'évitement, sinon on
    // le relèverait encore hors champ, à mi-course de sa révélation.
    await page.waitForTimeout(220);
    const info = await page.evaluate(DESCRIBE);
    if (!info) {
      // Sortie du document (barre du navigateur) : le cycle est bouclé.
      break;
    }
    const previous = steps[steps.length - 1];
    // Cycle bouclé : on revient sur le tout premier arrêt (le lien d'évitement).
    if (steps.length > 2 && info.id === steps[0].id) break;
    // PIÈGE : Tab ne bouge plus. Deux frappes consécutives sur le même élément
    // suffisent à le prouver, sans dépendre du libellé ni de la position.
    if (previous && previous.id === info.id) {
      stuck += 1;
      if (stuck >= 2) {
        trapped = info;
        break;
      }
      continue;
    }
    stuck = 0;
    steps.push({ ...info, index: i });
  }

  await page.close();
  return { route, width, steps, trapped };
}

/* --------------------------- Captures + contraste -------------------------- */

async function captureRoute(context, route, width) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: HEIGHT });
  await freezeCssAnimationsOnLoad(page);

  await page.goto(`${LOCAL}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const shots = [];
  const contrasts = [];

  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });

  const docBefore = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );

  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(220);
    const info = await page.evaluate(DESCRIBE);
    if (!info) break;
    if (info.rect.w <= 0 || info.rect.h <= 0) continue;

    const clip = {
      x: Math.max(0, Math.round(info.rect.x - CROP_PAD)),
      y: Math.max(0, Math.round(info.rect.y - CROP_PAD)),
      width: Math.min(width, Math.round(info.rect.w + CROP_PAD * 2)),
      height: Math.min(HEIGHT, Math.round(info.rect.h + CROP_PAD * 2)),
    };
    if (clip.x + clip.width > width) clip.width = width - clip.x;
    if (clip.y + clip.height > HEIGHT) clip.height = HEIGHT - clip.y;
    if (clip.width <= 2 || clip.height <= 2) continue;

    // --- Contraste : on capture le MÊME cadre sans l'anneau, pour obtenir le
    // fond réel sur lequel il sera peint (photo, dégradé, aplat).
    const bg = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      el.setAttribute("data-focus-audit-off", "");
      return true;
    });
    if (bg) {
      await page.addStyleTag({
        content:
          "[data-focus-audit-off]:focus-visible{outline:none !important;box-shadow:none !important}",
      });
      await page.waitForTimeout(30);
      const plain = await page.screenshot({ clip });
      const measured = await page.evaluate(RING_CONTRAST, {
        dataUrl: `data:image/png;base64,${plain.toString("base64")}`,
        box: {
          x: Math.round(info.rect.x) - clip.x,
          y: Math.round(info.rect.y) - clip.y,
          w: Math.round(info.rect.w),
          h: Math.round(info.rect.h),
        },
        halo: 9,
      });
      contrasts.push({ label: info.label, tag: info.tag, ...measured });
      await page.evaluate(() =>
        document.activeElement?.removeAttribute("data-focus-audit-off"),
      );
      await page.evaluate(() => {
        for (const s of document.querySelectorAll("style")) {
          if (s.textContent?.includes("data-focus-audit-off")) s.remove();
        }
      });
      await page.waitForTimeout(30);
    }

    const buf = await page.screenshot({ clip });
    shots.push({
      label: `${i + 1}. ${info.tag}${info.type ? `[${info.type}]` : ""} ${info.label || info.href}`,
      data: buf.toString("base64"),
      contrast: contrasts[contrasts.length - 1]?.worstBest ?? null,
    });
  }

  const docAfter = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  await page.close();
  return { shots, contrasts, docBefore, docAfter };
}

/* ------------------------------ Planche HTML ------------------------------- */

async function buildSheet(context, title, shots, file) {
  const cells = shots
    .map(
      (s) => `
      <figure>
        <img src="data:image/png;base64,${s.data}" alt="">
        <figcaption>${s.label.replace(/[<&]/g, "")}${
          s.contrast != null ? ` — ${s.contrast.toFixed(2)}:1` : ""
        }</figcaption>
      </figure>`,
    )
    .join("");
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#3a3a3a;color:#fff;font:13px/1.4 ui-sans-serif,system-ui}
    h1{font-size:16px;margin:0 0 18px}
    .grid{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
    figure{margin:0;background:#181818;padding:8px;max-width:320px}
    img{display:block;max-width:300px;height:auto;image-rendering:pixelated}
    figcaption{font-size:11px;color:#bbb;margin-top:6px;word-break:break-word}
  </style><h1>${title}</h1><div class="grid">${cells}</div>`;
  const page = await context.newPage();
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}

/* ---------------------------------- Main ----------------------------------- */

async function main() {
  const args = process.argv.slice(2);
  const widths = args.find((a) => /^\d+$/.test(a))
    ? [Number(args.find((a) => /^\d+$/.test(a)))]
    : WIDTHS;
  const routes = args.find((a) => a.startsWith("/"))
    ? [args.find((a) => a.startsWith("/"))]
    : ROUTES;

  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const report = [];

  for (const width of widths) {
    for (const route of routes) {
      const order = await auditRoute(context, route, width);
      const cap = await captureRoute(context, route, width);
      const name = `${slug(route)}-${width}`;
      const sheet = `${OUT}/${name}.png`;
      await buildSheet(context, `${route} @ ${width}`, cap.shots, sheet);

      const offscreen = order.steps.filter(
        (s) =>
          s.hidden ||
          s.rect.w === 0 ||
          s.rect.h === 0 ||
          s.rect.y + s.rect.h < 0 ||
          s.rect.y > HEIGHT,
      );
      const worst = cap.contrasts.reduce(
        (acc, c) => (c.worstBest < acc.worstBest ? c : acc),
        { worstBest: Infinity },
      );

      report.push({
        route,
        width,
        stops: order.steps.length,
        trapped: order.trapped ? order.trapped.label : null,
        offscreen: offscreen.map((s) => `${s.tag} "${s.label}" y=${Math.round(s.rect.y)}`),
        docHeightBefore: cap.docBefore,
        docHeightAfter: cap.docAfter,
        worstContrast: Number.isFinite(worst.worstBest)
          ? Number(worst.worstBest.toFixed(2))
          : null,
        worstTarget: worst.label ?? null,
        below3: cap.contrasts
          .filter((c) => c.worstBest < 3)
          .map((c) => `${c.tag} "${c.label}" ${c.worstBest.toFixed(2)}:1`),
        sheet,
        order: order.steps.map(
          (s) => `${s.tag}${s.type ? `[${s.type}]` : ""} ${s.label || s.href}`,
        ),
      });

      const r = report[report.length - 1];
      console.log(
        `${route} @${width} — ${r.stops} arrêts · pire contraste ${r.worstContrast}:1 · ` +
          `hors écran ${r.offscreen.length} · piège ${r.trapped ?? "aucun"}`,
      );
      if (r.offscreen.length) console.log(`   hors écran : ${r.offscreen.join(" | ")}`);
      if (r.below3.length) console.log(`   sous 3:1 : ${r.below3.join(" | ")}`);
    }
  }

  await context.close();
  await browser.close();
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  console.log(`\nPlanches et rapport : ${OUT}`);
}

main();
