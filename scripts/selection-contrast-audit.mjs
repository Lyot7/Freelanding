/**
 * Audit du surlignage — la sélection de texte est-elle visible, partout ?
 *
 * LE DÉFAUT, invisible en lisant le code : la couleur de sélection est posée
 * UNE fois, globalement, tandis que le fond, lui, change de section en section.
 * Ce site alterne trois surfaces : le noir `--background`, le gris clair
 * `--muted` (#e9e9e9) et l'aplat volt `--accent` (#c8f24a). Un surlignage volt
 * unique donne alors, mesuré :
 *
 *   volt sur `--background` : 15,24:1  → franc
 *   volt sur `--muted`      :  1,06:1  → indiscernable en clarté
 *   volt sur `--accent`     :  1,00:1  → strictement invisible
 *
 * Rien ne le signale : le CSS est valide, le texte est bien sélectionné, la
 * sélection existe dans le DOM. Elle ne se voit simplement pas.
 *
 * COMMENT LA DÉTECTION FONCTIONNE
 *
 * Pour chaque élément portant du texte, on lit le style calculé du
 * pseudo-élément `::selection` (que `getComputedStyle` expose), on remonte
 * jusqu'au premier ancêtre au fond opaque, et on mesure deux rapports :
 *
 *   - VISIBILITÉ : surlignage contre fond de la section. Seuil 3:1, celui de
 *     WCAG 1.4.11 pour les éléments non textuels — le surlignage EST un
 *     élément graphique, c'est le critère qui lui correspond.
 *   - LISIBILITÉ : texte sélectionné contre son surlignage. Seuil 4,5:1
 *     (WCAG 1.4.3, texte courant).
 *
 * Usage :
 *   bun run scripts/selection-contrast-audit.mjs
 *   bun run scripts/selection-contrast-audit.mjs /about /contact
 */
import { chromium } from "playwright";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";

const ROUTES = [
  "/",
  "/about",
  "/work",
  "/work/box-mode",
  "/contact",
  "/legal/mentions-legales",
  "/legal/politique-de-confidentialite",
  "/legal/conditions-generales-de-vente",
  "/introuvable-404",
];

/** WCAG 1.4.11 : un élément graphique doit contraster à 3:1 avec l'adjacent. */
const SEUIL_VISIBILITE = 3;
/** WCAG 1.4.3 : texte courant. */
const SEUIL_LISIBILITE = 4.5;

const args = process.argv.slice(2).filter((a) => a.startsWith("/"));
const routes = args.length > 0 ? args : ROUTES;

/** Exécuté DANS la page : `evaluate` ne partage pas la portée du script, les
 *  seuils lui sont donc passés en argument. */
function collect({ visibiliteMin, lisibiliteMin }) {
  /** Composantes d'une couleur CSS calculée, alpha compris. */
  const parse = (s) => {
    const n = (s.match(/[\d.]+/g) ?? []).map(Number);
    if (n.length < 3) return null;
    return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
  };

  const lum = (c) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };

  const ratio = (x, y) => {
    const [a, b] = [lum(x), lum(y)].sort((m, n) => n - m);
    return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
  };

  /** Superposition d'une couleur semi-transparente sur son fond. */
  const composite = (dessus, dessous) => ({
    r: dessus.r * dessus.a + dessous.r * (1 - dessus.a),
    g: dessus.g * dessus.a + dessous.g * (1 - dessus.a),
    b: dessus.b * dessus.a + dessous.b * (1 - dessus.a),
    a: 1,
  });

  /**
   * Fond EFFECTIF derrière un élément : on empile les fonds semi-transparents
   * rencontrés en remontant, jusqu'au premier fond opaque. Sans cela, un voile
   * `bg-black/[0.03]` posé sur une section claire serait lu comme du noir.
   */
  const fondEffectif = (el) => {
    const pile = [];
    let porteur = null;
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (!c || c.a === 0) continue;
      pile.push(c);
      if (c.a === 1) {
        // Élément qui PORTE le fond opaque : c'est lui qu'il faudra annoter,
        // pas l'élément de texte. Sans cette information, le rapport dit qu'un
        // surlignage est illisible sans dire où poser le correctif.
        porteur = n;
        break;
      }
    }
    if (pile.length === 0) return { couleur: { r: 255, g: 255, b: 255, a: 1 }, porteur: null };
    let fond = pile[pile.length - 1];
    for (let i = pile.length - 2; i >= 0; i -= 1) fond = composite(pile[i], fond);
    return { couleur: fond, porteur };
  };

  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className : "";
    return (
      el.tagName.toLowerCase() +
      (cls ? "." + cls.split(/\s+/).filter(Boolean).slice(0, 3).join(".") : "")
    );
  };

  const trouves = [];
  for (const el of document.querySelectorAll("body *")) {
    // Feuilles de texte uniquement : un conteneur hérite du texte de ses
    // descendants et produirait des doublons.
    if ([...el.children].some((k) => !getComputedStyle(k).display.startsWith("inline"))) {
      continue;
    }
    const texte = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (texte.length < 3) continue;

    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    // `sr-only` : jamais sélectionnable à la souris.
    if (rect.width <= 1 && rect.height <= 1) continue;

    const sel = getComputedStyle(el, "::selection");
    const selBg = parse(sel.backgroundColor);
    const selFg = parse(sel.color);
    if (!selBg || !selFg) continue;

    const { couleur: fond, porteur } = fondEffectif(el);
    const visibilite = ratio(selBg, fond);
    const lisibilite = ratio(selFg, selBg);

    if (visibilite >= visibiliteMin && lisibilite >= lisibiliteMin) continue;

    trouves.push({
      sel: describe(el),
      texte: texte.slice(0, 40),
      surlignage: sel.backgroundColor,
      fond: `rgb(${Math.round(fond.r)}, ${Math.round(fond.g)}, ${Math.round(fond.b)})`,
      porteur: porteur ? describe(porteur) : "aucun fond opaque",
      visibilite,
      lisibilite,
    });
  }
  return trouves;
}

const browser = await chromium.launch();
const findings = [];

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const route of routes) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30_000 });
  } catch {
    console.error(`INJOIGNABLE ${route}`);
    await page.close();
    continue;
  }
  await page.waitForTimeout(1800);
  const seuils = {
    visibiliteMin: SEUIL_VISIBILITE,
    lisibiliteMin: SEUIL_LISIBILITE,
  };
  for (const f of await page.evaluate(collect, seuils)) findings.push({ route, ...f });
  await page.close();
}
await ctx.close();
await browser.close();

if (findings.length === 0) {
  console.log(
    `Surlignage lisible partout : ${routes.length} routes, seuils ${SEUIL_VISIBILITE}:1 (visibilité) et ${SEUIL_LISIBILITE}:1 (lisibilité).`,
  );
  process.exit(0);
}

// Un même défaut se répète sur des dizaines d'éléments d'une même section : on
// regroupe par couple (surlignage, fond) pour que le rapport tienne en lignes
// actionnables plutôt qu'en journal.
const groupes = new Map();
for (const f of findings) {
  const cle = [f.route, f.surlignage, f.fond, f.porteur].join("|");
  if (!groupes.has(cle)) groupes.set(cle, { ...f, n: 0, exemples: [] });
  const g = groupes.get(cle);
  g.n += 1;
  if (g.exemples.length < 2) g.exemples.push(`${f.sel} « ${f.texte} »`);
}

console.log(`=== SURLIGNAGE ILLISIBLE — ${groupes.size} cas ===\n`);
for (const g of [...groupes.values()].sort((a, b) => a.visibilite - b.visibilite)) {
  console.log(`  ${g.route.padEnd(26)} ${g.n} éléments`);
  console.log(
    `  ${" ".repeat(26)} surlignage ${g.surlignage} sur fond ${g.fond}`,
  );
  console.log(`  ${" ".repeat(26)} fond porté par ${g.porteur}`);
  console.log(
    `  ${" ".repeat(26)} visibilité ${g.visibilite}:1 (seuil ${SEUIL_VISIBILITE}) · lisibilité ${g.lisibilite}:1 (seuil ${SEUIL_LISIBILITE})`,
  );
  for (const e of g.exemples) console.log(`  ${" ".repeat(26)} ${e}`);
  console.log();
}
console.log(`Total : ${findings.length} éléments.`);
