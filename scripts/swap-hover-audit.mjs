/**
 * Audit des libellés à permutation (`SwapCopies`).
 *
 *   bun run scripts/swap-hover-audit.mjs [routes...]
 *
 * LA RÉGRESSION VISÉE. Ces boutons remplacent leur libellé au survol : la copie
 * visible glisse hors d'un cadre clippant, une copie garée prend sa place. Les
 * deux doivent atterrir AU MÊME PIXEL, sinon le texte saute au passage de la
 * souris. Rien ne le signale : le bouton ne bouge pas, la mise en page ne bouge
 * pas, et l'écart ne se voit qu'à l'instant du survol.
 *
 * Cas réel : le CTA « DÉMARRER UN PROJET » du header porte `.accent-room`, dont
 * le remplissage haut de 0,32em décalait la copie garée de 5,2 px vers le haut,
 * la course étant mesurée depuis la boîte de remplissage et non depuis le texte.
 *
 * Le script survole chaque permutation et compare les deux positions.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const ARGS = process.argv.slice(2);
const ROUTES = ARGS.length > 0 ? ARGS : ["/", "/work", "/about", "/contact"];

/** Tolérance, en pixels. Un demi-pixel passe inaperçu, deux se voient. */
const MARGE = 0.6;

/** Repère les permutations : une copie garée en absolu, jumelle de sa voisine. */
const REPERE = () =>
  [...document.querySelectorAll("span[aria-hidden]")]
    .filter((s) => {
      const frere = s.previousElementSibling;
      if (!frere || !s.textContent?.trim()) return false;
      return (
        getComputedStyle(s).position === "absolute" &&
        frere.textContent === s.textContent
      );
    })
    .map((s, i) => {
      s.setAttribute("data-swap-audit", String(i));
      return { i, texte: s.textContent.trim().replace(/\s+/g, " ").slice(0, 28) };
    });

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
let echecs = 0;
let total = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForTimeout(2600);
  const permutations = await page.evaluate(REPERE);

  for (const { i, texte } of permutations) {
    const cible = `[data-swap-audit="${i}"]`;
    // Position de la copie EN FLUX au repos : c'est la référence.
    await page.evaluate(() =>
      document.querySelectorAll("[data-swap-group]").forEach((n) => n.removeAttribute("data-swap-group")),
    );
    const repos = await page.evaluate((sel) => {
      const garee = document.querySelector(sel);
      const flux = garee.previousElementSibling;
      const r = flux.getBoundingClientRect();
      // Le survol se déclenche sur l'ancêtre `group`, seul porteur de l'état.
      let g = garee.parentElement;
      while (g && !g.className.toString().split(/\s+/).includes("group")) g = g.parentElement;
      if (g) g.setAttribute("data-swap-group", sel.replace(/\D/g, ""));
      // `checkVisibility` couvre `display`, `visibility` ET `opacity: 0` : le
      // menu flottant et les panneaux repliés portent les mêmes boutons, mais
      // ils ne sont pas survolables tant qu'ils ne sont pas ouverts.
      const affiche =
        r.width > 0 &&
        Boolean(g?.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
      // Position RELATIVE au bouton, jamais à la fenêtre : Playwright fait
      // défiler la page pour survoler, et un relevé absolu mesurerait ce
      // défilement au lieu du saut cherché.
      const rg = g?.getBoundingClientRect();
      return {
        x: rg ? r.x - rg.x : 0,
        y: rg ? r.y - rg.y : 0,
        groupe: Boolean(g),
        visible: affiche,
      };
    }, cible);

    if (!repos.visible) continue;
    total += 1;
    if (!repos.groupe) {
      echecs += 1;
      console.log(`${route.padEnd(10)} ❌ « ${texte} » : aucun ancêtre \`group\`, le survol ne peut rien déclencher`);
      continue;
    }

    /*
     * SURVOLER DEUX FOIS, et attendre entre les deux.
     *
     * Playwright fait défiler la page pour amener sa cible à l'écran, ce qui
     * déclenche les apparitions au défilement — et déplace le bouton pendant que
     * le curseur, lui, ne bouge plus. Le survol se perd alors en cours de route.
     * MESURÉ sur le bouton « Envoyer » du pied de page : écart de -3,6 à -7,6 px
     * à 600 ms d'attente (état intermédiaire), et -12 px à 1000 ms, soit
     * exactement la course — le libellé était revenu à son point de départ.
     * Un relevé à la main sur ce même bouton montre pourtant qu'il atterrit au
     * pixel : c'était le test qui mesurait une page au repos.
     *
     * Le second survol a lieu une fois les apparitions terminées, sur la
     * position définitive. La durée d'attente couvre la plus longue course
     * (430 ms) et la queue de sa courbe.
     */
    const groupe = `[data-swap-group="${i}"]`;
    await page.hover(groupe);
    await page.waitForTimeout(700);
    await page.hover(groupe);
    await page.waitForTimeout(700);
    const apres = await page.evaluate((sel) => {
      const garee = document.querySelector(sel);
      const r = garee.getBoundingClientRect();
      const rg = garee.closest("[data-swap-group]").getBoundingClientRect();
      return { x: r.x - rg.x, y: r.y - rg.y };
    }, cible);
    await page.mouse.move(5, 880);
    await page.waitForTimeout(500);
    await page.evaluate(() =>
      document.querySelectorAll("[data-swap-group]").forEach((n) => n.removeAttribute("data-swap-group")),
    );

    const dx = Math.round((apres.x - repos.x) * 10) / 10;
    const dy = Math.round((apres.y - repos.y) * 10) / 10;
    if (Math.abs(dx) > MARGE || Math.abs(dy) > MARGE) {
      echecs += 1;
      console.log(`${route.padEnd(10)} ❌ « ${texte} » saute de ${dx} x ${dy} px au survol`);
    } else {
      console.log(`${route.padEnd(10)} ✅ « ${texte} » (écart ${dx} x ${dy} px)`);
    }
  }
}

await navigateur.close();
console.log(
  echecs === 0
    ? `\n✅ ${total} permutation(s) sans saut`
    : `\n❌ ${echecs} permutation(s) sur ${total} sautent au survol`,
);
process.exit(echecs === 0 ? 0 : 1);
