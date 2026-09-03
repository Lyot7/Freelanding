/**
 * Audit du verre dépoli du hero.
 *
 *   bun run scripts/hero-glass-audit.mjs [largeurs...]
 *
 * Deux régressions possibles, aucune visible autrement qu'à l'œil et au bon
 * moment :
 *
 * 1. LE FLOU NE S'APPLIQUE PLUS PENDANT L'ANIMATION. `backdrop-filter` ne
 *    floute que ce qui est derrière l'élément DANS LE MÊME contexte de
 *    composition. Un ancêtre en `transform`, `filter` ou `opacity < 1` isole le
 *    sous-arbre et le calque n'a plus rien à flouter. C'est exactement ce qui se
 *    passait quand il vivait dans la boîte animée : le flou n'arrivait qu'à la
 *    fin de l'animation d'entrée.
 *
 * 2. LE VERRE NE SUIT PLUS SON CADRE. Sorti du sous-arbre animé, le calque
 *    rejoue l'entrée sur lui-même. Si l'une des deux animations change sans
 *    l'autre, ou si la hauteur relevée sur la boîte se périme, le verre glisse
 *    sous son cadre.
 *
 * PROTOCOLE. La page tient elle-même son journal, une entrée par image, du
 * premier `requestAnimationFrame` à la fin de l'entrée. Un relevé pris à un
 * instant fixe depuis Playwright ne vaut rien ici : selon le temps de
 * compilation du serveur de développement, il tombe tantôt avant la première
 * peinture, tantôt après la fin de l'animation, et il a effectivement fait les
 * deux — un audit vert alors qu'il n'observait qu'une page au repos. Le journal
 * couvre au contraire TOUTE la trajectoire, et le script vérifie chaque image.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const LARGEURS = process.argv.slice(2).map(Number).filter(Boolean);
const CIBLES = LARGEURS.length > 0 ? LARGEURS : [390, 810, 1200, 1440];

/** Durée observée, en ms. L'entrée dure 1,6 s ; on regarde bien au-delà. */
const DUREE = 3000;

/**
 * Tolérance de recouvrement, en pixels. Le verre peut dépasser, jamais manquer.
 * Plus large tant que l'entrée court : l'agrandissement de 1,5 y multiplie tout
 * écart de mise en page, et l'inclinaison de 2° gonfle les deux rectangles
 * englobants d'autant plus qu'ils sont grands.
 */
const marge = (echelle) => (echelle > 1.01 ? 4 : 2);

/** Journal posé AVANT tout script de la page, donc dès la première image. */
const JOURNAL = `(function(){
var t0=performance.now(),j=[];window.__verre=j;
function isolants(el){var n=0,p=el.parentElement;
while(p&&p!==document.body){var c=getComputedStyle(p);
if(c.transform!=="none"||c.filter!=="none"||Number(c.opacity)<1)n++;p=p.parentElement;}
return n;}
function tic(){
var g=document.querySelector('[data-part="hero-glass"]');
var b=document.querySelector('[data-part="hero-box"]');
if(g&&b){
var cs=getComputedStyle(g),tr=cs.transform;
var rg=g.getBoundingClientRect(),rb=b.getBoundingClientRect();
j.push({t:Math.round(performance.now()-t0),
flou:cs.backdropFilter,
echelle:tr==="none"?1:Math.round(new DOMMatrixReadOnly(tr).a*1000)/1000,
opacite:Math.round(Number(cs.opacity)*1000)/1000,
isolants:isolants(g),
ecart:{haut:rg.top-rb.top,bas:rb.bottom-rg.bottom,gauche:rg.left-rb.left,droite:rb.right-rg.right}});}
if(performance.now()-t0<${DUREE})requestAnimationFrame(tic);}
requestAnimationFrame(tic);})();`;

const navigateur = await chromium.launch();
let echecs = 0;

for (const largeur of CIBLES) {
  const prefixe = String(largeur).padStart(4);
  const page = await navigateur.newPage({ viewport: { width: largeur, height: 900 } });
  await page.addInitScript(JOURNAL);
  await page.goto(BASE + "/", { waitUntil: "commit" });
  await page.waitForTimeout(DUREE + 500);
  const journal = await page.evaluate(() => window.__verre ?? []);
  await page.close();

  const anime = journal.filter((i) => i.echelle > 1.05);
  const repos = journal.filter((i) => i.echelle <= 1.001);

  if (anime.length === 0 || repos.length === 0) {
    echecs += 1;
    console.log(
      `${prefixe}  ❌ entrée non observée (${journal.length} images, ${anime.length} animées, ${repos.length} au repos)`,
    );
    continue;
  }

  // 1. Aucun ancêtre isolant, à AUCUNE image : sinon le flou ne s'applique pas.
  const isole = journal.filter((i) => i.isolants > 0);
  const sansFlou = journal.filter((i) => !i.flou.startsWith("blur"));
  if (isole.length || sansFlou.length) {
    echecs += 1;
    if (isole.length)
      console.log(`${prefixe}  ❌ ancêtre isolant sur ${isole.length}/${journal.length} images (dès t=${isole[0].t} ms)`);
    if (sansFlou.length)
      console.log(`${prefixe}  ❌ backdrop-filter absent sur ${sansFlou.length}/${journal.length} images`);
  } else {
    const e = anime[0];
    console.log(
      `${prefixe}  ✅ flou actif dès la 1re image · ${journal.length} images, échelle ${e.echelle} → 1, aucun ancêtre isolant`,
    );
  }

  // 2. Le verre couvre son cadre, à chaque image.
  const glisse = journal.filter((i) =>
    Object.values(i.ecart).some((v) => v > marge(i.echelle)),
  );
  if (glisse.length) {
    echecs += 1;
    const pire = glisse.reduce((a, b) =>
      Math.max(...Object.values(b.ecart)) > Math.max(...Object.values(a.ecart)) ? b : a,
    );
    console.log(
      `${prefixe}  ❌ le verre glisse sous son cadre sur ${glisse.length}/${journal.length} images ` +
        `(pire à t=${pire.t} ms, échelle ${pire.echelle} : ${JSON.stringify(
          Object.fromEntries(Object.entries(pire.ecart).map(([k, v]) => [k, Math.round(v * 10) / 10])),
        )})`,
    );
  } else {
    const pire = Math.max(...journal.flatMap((i) => Object.values(i.ecart)));
    console.log(
      `${prefixe}  ✅ verre solidaire du cadre sur les ${journal.length} images (écart max ${Math.round(pire * 10) / 10} px)`,
    );
  }
}

await navigateur.close();
console.log(echecs === 0 ? "\n✅ verre dépoli conforme" : `\n❌ ${echecs} problème(s)`);
process.exit(echecs === 0 ? 0 : 1);
