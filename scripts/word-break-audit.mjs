/**
 * Audit des MOTS COUPÉS EN DEUX par le retour à la ligne.
 *
 *   bun run scripts/word-break-audit.mjs [largeurs...]
 *
 * `overflow-wrap: break-word` (la classe Tailwind `break-words`) n'agit que
 * lorsqu'un mot ne tient pas sur une ligne — mais quand il agit, il coupe SANS
 * TIRET, à n'importe quelle lettre. Sur un titre de 92 px dans une colonne
 * étroite, « DÉMARRONS » devient « DÉMARRON » puis « S » à la ligne suivante :
 * le lecteur bute, et rien dans le code ne le signale. Le rendu est « correct »
 * au sens du navigateur, les types sont verts, seule une relecture à l'écran le
 * voit. D'où ce script.
 *
 * MÉTHODE : pour chaque mot de chaque nœud de texte, on relève ses rectangles
 * avec un `Range`. Un mot qui tient sur une ligne produit UN rectangle. Un mot
 * réparti sur deux lignes en produit deux, à des hauteurs différentes : il est
 * donc coupé. C'est une mesure du rendu réel, pas une inspection du CSS, ce qui
 * couvre aussi les coupures venues d'ailleurs (`break-all`, `hyphens`, un
 * conteneur trop étroit hérité).
 */
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
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
const WIDTHS = process.argv.slice(2).map(Number).filter(Boolean);
const LARGEURS = WIDTHS.length > 0 ? WIDTHS : [390, 810, 1200, 1440];

const DETECTE = () => {
  const coupes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const texte = node.nodeValue;
    if (!texte || !texte.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    const style = getComputedStyle(parent);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (Number.parseFloat(style.opacity) === 0) continue;

    // Un mot = une suite sans espace. On repère sa position dans le nœud pour
    // pouvoir poser un Range dessus.
    const motif = /\S+/g;
    let m;
    while ((m = motif.exec(texte))) {
      const mot = m[0];
      // Deux caractères ne se coupent pas de façon lisible ; sous ce seuil, le
      // bruit dépasse le signal.
      if (mot.length < 4) continue;
      // Un mot composé se coupe LÉGITIMEMENT sur son trait d'union
      // (« rendez-vous », « e-mail ») : la typographie française l'autorise et
      // le lecteur ne bute pas. On ne signale donc que les mots sans trait
      // d'union, où toute coupure est forcément arbitraire.
      if (mot.includes("-") || mot.includes("\u2011")) continue;
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + mot.length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      if (rects.length < 2) continue;
      // Plusieurs rectangles sur la MÊME ligne (un span imbriqué, une emphase)
      // ne sont pas une coupure : on ne retient que des hauteurs distinctes.
      const lignes = new Set(rects.map((r) => Math.round(r.top)));
      if (lignes.size < 2) continue;
      coupes.push({
        mot,
        balise: parent.tagName.toLowerCase(),
        classes: (parent.className || "").toString().slice(0, 90),
        taille: style.fontSize,
      });
    }
  }
  return coupes;
};

const navigateur = await chromium.launch();
let total = 0;

for (const largeur of LARGEURS) {
  const page = await navigateur.newPage({
    viewport: { width: largeur, height: 900 },
    reducedMotion: "reduce",
  });
  for (const route of ROUTES) {
    // Une route peut rediriger (404) : on laisse la navigation se stabiliser
    // avant de mesurer, sinon le contexte d'exécution meurt sous le script.
    await page.goto(BASE + route, { waitUntil: "load", timeout: 45000 });
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(900);
    const coupes = await page.evaluate(DETECTE).catch(() => []);
    for (const c of coupes) {
      total += 1;
      console.log(`${String(largeur).padStart(4)}  ${route.padEnd(30)} « ${c.mot} »  <${c.balise}> ${c.taille}`);
      console.log(`      ${c.classes}`);
    }
  }
  await page.close();
}

await navigateur.close();
console.log(total === 0 ? "\n✅ aucun mot coupé" : `\n❌ ${total} mot(s) coupé(s)`);
process.exit(total === 0 ? 0 : 1);
