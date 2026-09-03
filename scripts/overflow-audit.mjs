/**
 * Audit de débordement — ce que le passage au français fait déborder.
 *
 * Le site a été reconstruit au pixel près sur une source ANGLAISE. Le français
 * est structurellement plus long (« Réalisations » contre « Works »,
 * « Politique de confidentialité » contre « Privacy Policy »), et les capitales
 * accentuées ne se comportent pas comme leurs équivalents ASCII. Les boîtes
 * calées sur la longueur anglaise débordent donc silencieusement : rien ne
 * casse, le texte sort simplement de son cadre ou passe sous un voisin.
 *
 * Trois familles de défauts sont cherchées, aucune n'étant détectable en lisant
 * le code :
 *
 *   1. DÉBORDEMENT PROPRE     le contenu dépasse la boîte qui le contient
 *                             (`scrollWidth > clientWidth` sur un conteneur qui
 *                             coupe ou masque son débordement).
 *   2. SORTIE DE FENÊTRE      la boîte dépasse le bord du document.
 *   3. CHEVAUCHEMENT          deux éléments de texte voisins se superposent.
 *
 * Les cas 1 et 2 sont mesurés sur la boîte TRANSFORMÉE, ce qui produirait des
 * faux positifs pendant les animations d'entrée : le script attend donc la fin
 * des apparitions et fige les animations avant de mesurer.
 *
 * Usage :
 *   bun run scripts/overflow-audit.mjs
 *   bun run scripts/overflow-audit.mjs 390 810
 */
import { chromium } from "playwright";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";

/* Routes réellement publiées, blog compris — la liste précédente datait du
   template (`/work/box-mode`, `/404`, `/introuvable-404`) et sautait les
   quatre articles, les pages les plus denses en texte du site. */
const ROUTES = [
  "/",
  "/about",
  "/work",
  "/work/kpsull",
  "/work/nslysium",
  "/work/wurth-creation-de-compte",
  "/blog",
  "/blog/dessiner-avant-de-coder",
  "/blog/ce-que-google-montre-de-vous",
  "/blog/a-qui-appartient-votre-fichier-client",
  "/blog/formulaire-inscription-erreurs-saisie",
  "/contact",
  "/legal/mentions-legales",
  "/legal/politique-de-confidentialite",
  "/legal/conditions-generales-de-vente",
  "/introuvable-page-de-test",
];

/** Largeurs de contrôle : les deux bascules du site, leurs bords, et les extrêmes. */
const WIDTHS = [320, 360, 390, 430, 600, 809, 810, 900, 1199, 1200, 1440, 1920];

/** Tolérance en pixels. En dessous, c'est du bruit d'arrondi. */
const SLOP = 1;

const args = process.argv.slice(2).map(Number).filter(Boolean);
const widths = args.length > 0 ? args : WIDTHS;

/**
 * Relevé exécuté DANS la page.
 *
 * Renvoie les débordements, avec assez de contexte pour retrouver l'élément :
 * son texte, ses classes, et de combien il dépasse.
 */
function collect(slop) {
  /** Chemin lisible depuis `body`, pour retrouver l'élément dans le code. */
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className : "";
    const short = cls.split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    return el.tagName.toLowerCase() + (short ? "." + short : "");
  };

  const label = (el) => (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 70);

  const results = { clipped: [], offscreen: [], overlap: [] };
  const docWidth = document.documentElement.clientWidth;

  /**
   * Élément réservé aux lecteurs d'écran (`sr-only`) : sa boîte fait 1 px et son
   * contenu la dépasse toujours, par construction. Ce n'est pas un défaut de
   * mise en page, c'est le mécanisme même de la classe.
   */
  const lecteurDEcranSeul = (el) => {
    const st = getComputedStyle(el);
    return (
      st.clipPath === "inset(50%)" ||
      st.clip === "rect(0px, 0px, 0px, 0px)" ||
      (el.clientWidth <= 1 && el.clientHeight <= 1)
    );
  };

  /**
   * Calque purement décoratif : grain, bandeau défilant, vecteur. Tous
   * débordent volontairement, aucun ne porte d'information.
   */
  const decoratifPur = (el) => {
    const st = getComputedStyle(el);
    return (
      el.getAttribute("aria-hidden") === "true" ||
      st.pointerEvents === "none" ||
      el.closest("[aria-hidden='true']") !== null ||
      el.namespaceURI === "http://www.w3.org/2000/svg" ||
      el.classList.contains("grain-layer")
    );
  };

  for (const el of document.querySelectorAll("body *")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // 1. Contenu plus large que sa boîte, sur un conteneur qui le coupe.
    //    `visible` est exclu : le texte y déborde sans être tronqué, ce que la
    //    famille 2 attrapera s'il sort vraiment de l'écran.
    //
    //    Ce site emploie BEAUCOUP de débordements volontaires : les bandeaux
    //    défilants doivent déborder pour défiler, les calques de grain sont
    //    plus larges que leur parent par construction, les visuels de parallaxe
    //    sont sur-cadrés. Les compter en défauts noyait le rapport sous 300
    //    relevés dont aucun n'était actionnable.
    //
    //    On ne retient donc que ce qui porte du TEXTE LISIBLE et n'est pas
    //    décoratif : le vrai risque du passage au français est un libellé plus
    //    long que la boîte prévue pour sa version anglaise.
    const clips = /hidden|clip|scroll|auto/.test(style.overflowX);
    const excess = el.scrollWidth - el.clientWidth;
    const texte = label(el);
    const decor =
      el.getAttribute("aria-hidden") === "true" ||
      style.pointerEvents === "none" ||
      texte.length === 0;
    // Feuille de texte : aucun enfant de type bloc. Un conteneur de mise en page
    // hérite du débordement de ses descendants, le signaler ferait doublon.
    const feuilleDeTexte = [...el.children].every((k) =>
      getComputedStyle(k).display.startsWith("inline"),
    );
    if (
      clips &&
      excess > slop &&
      el.clientWidth > 0 &&
      !decor &&
      feuilleDeTexte &&
      !lecteurDEcranSeul(el)
    ) {
      results.clipped.push({
        sel: describe(el),
        texte,
        deborde: excess,
        boite: Math.round(el.clientWidth),
      });
    }

    // 2. Sortie du document. Seules les FEUILLES sont retenues : un ancêtre qui
    //    déborde le fait toujours à cause d'un descendant, et remonter la chaîne
    //    noierait le rapport sous des doublons.
    if (el.children.length === 0) {
      const over = Math.round(rect.right - docWidth);
      const under = Math.round(-rect.left);
      // Les visuels de parallaxe sont VOLONTAIREMENT plus larges que leur cadre
      // (sur-cadrage, puis dérive au scroll). Ils débordent des deux côtés de
      // façon symétrique, et un ancêtre les coupe. Ce n'est pas un défaut de
      // mise en page : c'est l'effet lui-même.
      const symetrique = over > slop && under > slop && Math.abs(over - under) <= 2;
      const decoratif =
        el.tagName === "IMG" &&
        (el.getAttribute("alt") === "" || el.getAttribute("aria-hidden") === "true");
      if (
        (over > slop || under > slop) &&
        !(symetrique && decoratif) &&
        !decoratifPur(el) &&
        !lecteurDEcranSeul(el)
      ) {
        results.offscreen.push({
          sel: describe(el),
          texte: label(el),
          droite: over > slop ? over : 0,
          gauche: under > slop ? under : 0,
        });
      }
    }
  }

  // 3. Chevauchement entre deux éléments de texte FRÈRES. Restreint aux frères
  //    pour ne pas signaler les superpositions voulues (calques, décors).
  const seen = new Set();
  for (const parent of document.querySelectorAll("body *")) {
    const kids = [...parent.children].filter((k) => {
      const st = getComputedStyle(k);
      if (st.display === "none" || st.position === "absolute" || st.position === "fixed") return false;
      // Un élément EN LIGNE qui s'étale sur plusieurs lignes a un rectangle
      // englobant large comme tout le paragraphe : deux `<span>` d'emphase
      // voisins s'y « chevauchent » systématiquement alors qu'ils ne partagent
      // pas un seul pixel. C'est ce qui produisait l'essentiel du bruit.
      if (st.display.startsWith("inline")) return false;
      return (k.textContent ?? "").trim().length > 0;
    });
    for (let i = 0; i < kids.length; i += 1) {
      for (let j = i + 1; j < kids.length; j += 1) {
        const a = kids[i].getBoundingClientRect();
        const b = kids[j].getBoundingClientRect();
        const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (dx > slop && dy > slop) {
          const key = describe(kids[i]) + "|" + describe(kids[j]);
          if (seen.has(key)) continue;
          seen.add(key);
          results.overlap.push({
            a: label(kids[i]) || describe(kids[i]),
            b: label(kids[j]) || describe(kids[j]),
            surface: Math.round(dx) + "x" + Math.round(dy),
          });
        }
      }
    }
  }

  return results;
}

const browser = await chromium.launch();
const findings = [];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const url = BASE + route;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    } catch {
      console.error(`INJOIGNABLE  ${route} @${width}`);
      await page.close();
      continue;
    }

    // Les apparitions déplacent les boîtes : mesurer pendant fausserait tout.
    await page.waitForTimeout(1800);
    await page.evaluate(() => {
      for (const anim of document.getAnimations()) {
        try {
          anim.finish();
        } catch {
          anim.cancel();
        }
      }
    });

    const found = await page.evaluate(collect, SLOP);
    for (const kind of ["clipped", "offscreen", "overlap"]) {
      for (const item of found[kind]) {
        findings.push({ route, width, kind, ...item });
      }
    }
    await page.close();
  }

  await context.close();
}

await browser.close();

/* --------------------------------- Rapport --------------------------------- */

const TITLES = {
  clipped: "CONTENU TRONQUÉ (déborde sa boîte, qui le coupe)",
  offscreen: "SORT DE LA FENÊTRE",
  overlap: "CHEVAUCHEMENT entre frères",
};

if (findings.length === 0) {
  console.log(`Aucun débordement sur ${ROUTES.length} routes x ${widths.length} largeurs.`);
  process.exit(0);
}

for (const kind of ["clipped", "offscreen", "overlap"]) {
  const rows = findings.filter((f) => f.kind === kind);
  if (rows.length === 0) continue;

  console.log(`\n=== ${TITLES[kind]} — ${rows.length} relevés ===`);

  // Un même défaut apparaît à plusieurs largeurs : on regroupe pour que le
  // rapport se lise comme une liste de corrections, pas comme un journal.
  const groups = new Map();
  for (const row of rows) {
    const key = [row.route, row.sel ?? row.a, row.texte ?? row.b].join("|");
    if (!groups.has(key)) groups.set(key, { ...row, widths: [] });
    groups.get(key).widths.push(row.width);
  }

  const sorted = [...groups.values()].sort(
    (a, b) => (b.deborde ?? b.droite ?? 0) - (a.deborde ?? a.droite ?? 0),
  );

  for (const g of sorted) {
    const amount =
      kind === "clipped"
        ? `+${g.deborde}px sur ${g.boite}`
        : kind === "offscreen"
          ? [g.droite ? `droite +${g.droite}px` : "", g.gauche ? `gauche +${g.gauche}px` : ""]
              .filter(Boolean)
              .join(" ")
          : g.surface;
    const who = kind === "overlap" ? `« ${g.a} » ∩ « ${g.b} »` : `« ${g.texte} »`;
    console.log(
      `  ${g.route.padEnd(26)} ${amount.padEnd(22)} ${who}\n` +
        `  ${" ".repeat(26)} ${(g.sel ?? "").padEnd(22)} largeurs ${g.widths.join(", ")}`,
    );
  }
}

console.log(`\nTotal : ${findings.length} relevés sur ${ROUTES.length} routes x ${widths.length} largeurs.`);
