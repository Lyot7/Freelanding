/**
 * Contraste du titre sur le fond des heros de page projet.
 *
 *   bun run scripts/hero-contraste.mjs [largeurs...]
 *
 * POURQUOI CE SCRIPT EXISTE. Le fond d'un hero de projet est une PHOTOGRAPHIE
 * ou un rendu, choisi pour ce qu'il montre, et le titre est posé dessus en
 * blanc. Rien dans la chaîne ne s'oppose à ce qu'une zone claire passe sous les
 * lettres : les types sont verts, la page s'affiche, et le défaut ne se voit
 * qu'à l'œil, sur la bonne machine, au bon moment de l'animation.
 *
 * Il a d'ailleurs été servi. Relevé du 2026-09-04, avant correction, sur les
 * trois pages projet : 2,58 pour Kpsull, 2,38 pour NSLysium et 2,02 pour Würth,
 * là où WCAG 1.4.3 demande 3:1 pour du grand texte. Le dégradé de lisibilité
 * du hero était pourtant réputé les corriger tous les trois.
 *
 * CE QU'IL MESURE, et pourquoi sur l'image rendue et non sur le fichier source.
 * Recomposer le fond hors du navigateur (redimensionnement `cover`, voile plat,
 * dégradé) donne un chiffre proche mais faux : il ignore le grain, le filet
 * central, le parallaxe qui a déjà déplacé le calque au moment du relevé, et le
 * rééchantillonnage de `next/image`. Le script prend donc une capture de la
 * page telle qu'elle est peinte, en MASQUANT le texte du titre, et cherche le
 * pixel le plus clair sous la boîte que ce titre occupe. Le masquage est
 * indispensable : sans lui, le pixel le plus clair trouvé serait une lettre.
 *
 * SORTIE. Une ligne par page et par largeur, le pire rapport de contraste et le
 * point où il est atteint. Sortie 1 dès qu'une ligne passe sous le plancher.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const LARGEURS = process.argv.slice(2).map(Number).filter(Boolean);
const CIBLES = LARGEURS.length > 0 ? LARGEURS : [390, 810, 1440];

/** Pages à vérifier. Toute page projet porte le même hero. */
const PAGES = [
  "/work/kpsull",
  "/work/wurth-creation-de-compte",
  "/work/nslysium",
];

/**
 * Plancher WCAG 1.4.3 pour du GRAND texte (≥ 24px, ou ≥ 18,66px en gras). Le
 * H1 du hero fait 63px au plus étroit : il est grand partout, et le plancher de
 * 4,5:1 des textes courants ne s'y applique pas.
 */
const PLANCHER = 3;

/** Luminance relative sRGB, telle que définie par WCAG. */
function luminance(r, v, b) {
  const canal = (x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b);
}

const navigateur = await chromium.launch();
let echecs = 0;

for (const largeur of CIBLES) {
  for (const chemin of PAGES) {
    const page = await navigateur.newPage({
      viewport: { width: largeur, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
    // L'entrée du titre dure 0,8 s ; le fond est en place bien avant, mais on
    // laisse la page se poser pour que le parallaxe ait pris sa valeur au repos.
    await page.waitForTimeout(1200);

    const boite = await page.evaluate(() => {
      const h1 = document.querySelector("main h1");
      if (!h1) return null;
      const r = h1.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (!boite || boite.height === 0) {
      console.error(`✖ ${chemin} @${largeur} : aucun H1 mesurable`);
      echecs += 1;
      await page.close();
      continue;
    }

    // Le TEXTE disparaît, sa boîte reste : on mesure le fond, pas les lettres.
    await page.addStyleTag({ content: "main h1 { visibility: hidden; }" });
    await page.waitForTimeout(100);

    /*
     * LE DÉCODAGE DU PNG EST RENDU AU NAVIGATEUR, et c'est le seul point de
     * technique du script. Décoder la capture côté Node demanderait une
     * dépendance d'image (`pngjs`, `sharp`) que ce dépôt n'a pas en direct ;
     * Chrome, lui, sait déjà lire un PNG. La capture repart donc dans la page
     * en data-URL, passe par un `<canvas>` et ressort en pixels bruts.
     */
    const capture = await page.screenshot({ clip: boite });
    const pixels = await page.evaluate(async (donnees) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${donnees}`)).blob(),
      );
      const toile = document.createElement("canvas");
      toile.width = bitmap.width;
      toile.height = bitmap.height;
      const ctx = toile.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      return {
        largeur: bitmap.width,
        hauteur: bitmap.height,
        donnees: Array.from(image.data),
      };
    }, capture.toString("base64"));

    let pire = null;
    for (let y = 0; y < pixels.hauteur; y += 1) {
      for (let x = 0; x < pixels.largeur; x += 1) {
        const i = (pixels.largeur * y + x) << 2;
        const L = luminance(
          pixels.donnees[i],
          pixels.donnees[i + 1],
          pixels.donnees[i + 2],
        );
        const rapport = 1.05 / (L + 0.05);
        if (pire === null || rapport < pire.rapport) {
          pire = { rapport, x, y };
        }
      }
    }

    const vert = pire.rapport >= PLANCHER;
    if (!vert) echecs += 1;
    console.log(
      `${vert ? "✅" : "✖"} ${chemin.padEnd(30)} @${String(largeur).padStart(4)} ` +
        `${pire.rapport.toFixed(2)}:1 (point le plus clair à x${Math.round(boite.x) + pire.x} y${Math.round(boite.y) + pire.y})`,
    );
    await page.close();
  }
}

await navigateur.close();

if (echecs > 0) {
  console.error(
    `\n✖ ${echecs} relevé(s) sous le plancher de ${PLANCHER}:1. Assombrir le dégradé de WorkDetailHero.tsx, ou changer le fond.`,
  );
  process.exit(1);
}
console.log(`\n✅ Tous les titres de hero tiennent le plancher de ${PLANCHER}:1.`);
