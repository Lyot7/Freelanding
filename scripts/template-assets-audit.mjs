/**
 * Recense les visuels du TEMPLATE encore servis au visiteur.
 *
 *   bun run scripts/template-assets-audit.mjs [routes...]
 *
 * Le site est une reconstruction d'un template Framer, et son dossier
 * `public/framerusercontent.com` contient encore les centaines de fichiers de
 * l'original : photos de mode, portraits d'inconnus, logos et signature du
 * studio qui l'a publié. Aucun n'a de licence traçable au nom d'Eliott, et
 * plusieurs mettent en scène des personnes réelles.
 *
 * Une référence oubliée ne casse rien et ne se voit pas : l'image s'affiche,
 * elle est jolie, et rien ne dit qu'elle appartient à quelqu'un d'autre. C'est
 * exactement le genre de dette qu'un script doit tenir, pas une mémoire.
 *
 * Le contrôle porte sur ce qui est RÉELLEMENT CHARGÉ par le navigateur, page
 * défilée de bout en bout — pas sur une recherche dans les sources. Une adresse
 * peut rester dans le code sans être servie (repli mort, branche éteinte), et
 * inversement une image peut être injectée par un chemin que la recherche
 * textuelle ne verrait pas.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const ARGS = process.argv.slice(2);
const ROUTES =
  ARGS.length > 0
    ? ARGS
    : [
        "/",
        "/work",
        "/work/kpsull",
        "/work/nslysium",
        "/work/wurth-creation-de-compte",
        "/about",
        "/contact",
        "/legal/mentions-legales",
      ];

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });

/** Fichier du template → routes qui le chargent. */
const restes = new Map();
let routeCourante = "";

page.on("request", (requete) => {
  const url = decodeURIComponent(requete.url());
  if (!url.includes("framerusercontent.com/")) return;
  const fichier = url.split("framerusercontent.com/")[1].split(/[&?]/)[0];
  if (!restes.has(fichier)) restes.set(fichier, new Set());
  restes.get(fichier).add(routeCourante);
});

for (const route of ROUTES) {
  routeCourante = route;
  await page.goto(BASE + route, { waitUntil: "load" });
  // Défilement complet : la moitié des visuels n'est chargée qu'à l'approche.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  await page.waitForTimeout(700);
}

await navigateur.close();

if (restes.size === 0) {
  console.log(`✅ aucun visuel du template servi sur les ${ROUTES.length} routes vérifiées`);
  process.exit(0);
}

console.log(`❌ ${restes.size} visuel(s) du template encore servi(s) :\n`);
for (const [fichier, routes] of [...restes].sort()) {
  console.log(`   ${fichier}`);
  console.log(`      sur ${[...routes].join(", ")}`);
}
process.exit(1);
