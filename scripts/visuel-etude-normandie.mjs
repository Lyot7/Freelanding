/**
 * Fabrique les trois visuels de l'étude « sites des entreprises normandes 2026 ».
 *
 *   bun run scripts/visuel-etude-normandie.mjs
 *
 * POURQUOI UN VISUEL CALCULÉ ET NON UNE PHOTO. Chaque photo de héros ne sert
 * qu'une fois (`heros-pages.test.mjs`), et l'étude n'a pas de sujet à
 * photographier : son sujet, ce sont les 25 736 fiches relevées. Le héros en
 * dessine une par point, et colore celles qui n'ont aucun site renseigné.
 * L'image se refait à l'identique : tirage à graine fixe, aucun fichier tiers.
 *
 * Les deux chiffres viennent de `donnees.json` (indicateur
 * `fiches_sans_site_renseigne`) et de l'article. Si l'étude est mise à jour,
 * les changer ici et relancer.
 */
import sharp from "sharp";

const FICHES = 25736;
const SANS_SITE = 7631;
const PART = SANS_SITE / FICHES;

const FOND = "#0b0b0b";
const POINT = "rgba(255,255,255,0.15)";
const POINT_SANS_SITE = "#c8f24a";
const PAS = 11.2;
const RAYON = 2.4;

/** Générateur pseudo-aléatoire à graine (mulberry32) : même image à chaque run. */
function tirage(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function melange(liste, aleatoire) {
  for (let i = liste.length - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatoire() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste;
}

/**
 * `points` : nombre de cases dessinées ; `verts` : combien sont colorées.
 * Les cases de la grille en surplus restent vides, dispersées par le tirage.
 */
function svg(largeur, hauteur, points, verts, graine) {
  const colonnes = Math.floor(largeur / PAS);
  const lignes = Math.ceil(points / colonnes);
  const pasX = largeur / colonnes;
  const pasY = hauteur / lignes;
  const aleatoire = tirage(graine);
  const cases = melange(
    Array.from({ length: colonnes * lignes }, (_, i) => i),
    aleatoire,
  ).slice(0, points);
  const vertes = new Set(cases.slice(0, verts));
  const cercles = cases
    .map((c) => {
      const x = ((c % colonnes) + 0.5) * pasX;
      const y = (Math.floor(c / colonnes) + 0.5) * pasY;
      const couleur = vertes.has(c) ? POINT_SANS_SITE : POINT;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${RAYON}" fill="${couleur}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}"><rect width="100%" height="100%" fill="${FOND}"/>${cercles}</svg>`;
}

/** Remplit le cadre à la densité du héros, à la même proportion de points verts. */
function cadre(largeur, hauteur, graine) {
  const points = Math.floor(largeur / PAS) * Math.floor(hauteur / PAS);
  return svg(largeur, hauteur, points, Math.round(points * PART), graine);
}

const SLUG = "etat-des-sites-des-entreprises-normandes-2026";
const sorties = [
  [`public/images/heros/blog-${SLUG}.jpg`, svg(2400, 1350, FICHES, SANS_SITE, 2026)],
  [`public/images/blog/${SLUG}.jpg`, cadre(1200, 1114, 14)],
  [`public/images/og-blog-${SLUG}.jpg`, cadre(1200, 630, 76)],
];

for (const [chemin, contenu] of sorties) {
  await sharp(Buffer.from(contenu))
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(chemin);
  console.log(chemin);
}
