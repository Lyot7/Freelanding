/**
 * Rend le visuel d'un article validé dans le cockpit : le SVG que le rédacteur
 * a conçu pour SON sujet (`contexte.article.visuel`), en trois JPG.
 *
 *   - héros 2400 × 1350 : le SVG tel quel ;
 *   - vignette 1200 × 1114 et partage 1200 × 630 : recadrés au centre dans le
 *     héros, comme le cockpit les montre dans son aperçu.
 *
 * Le cockpit a déjà contrôlé le SVG (palette du site, ni script, ni texte, ni
 * image étrangère : `src/lib/visuel-article.ts` du cockpit). Le contrôle
 * ci-dessous redit l'essentiel : sharp ne doit rien charger d'extérieur, même
 * si le cockpit laissait un jour passer un SVG qu'il n'aurait pas dû.
 */
import sharp from "sharp";

const FOND = "#0b0b0b";
const VIEWBOX = 'viewBox="0 0 2400 1350"';

/** Ce qui empêche de rendre le SVG ; `null` s'il peut partir. */
export function refusVisuel(svg) {
  const s = String(svg ?? "").trim();
  if (!/^<svg[\s>]/i.test(s) || !/<\/svg>$/i.test(s)) return "pas un élément <svg>";
  if (!s.slice(0, s.indexOf(">") + 1).includes(VIEWBOX)) return `${VIEWBOX} attendu`;
  if (/<\s*(script|style|text|image|foreignObject|iframe|object|embed)\b/i.test(s)) return "élément interdit";
  if (/\son[a-z]+\s*=|javascript:|data:|<!(ENTITY|DOCTYPE)/i.test(s)) return "contenu exécutable ou embarqué";
  for (const m of s.matchAll(/\b(?:href|xlink:href)\s*=\s*["']([^"']*)["']/gi)) {
    if (!m[1].startsWith("#")) return "lien hors du SVG";
  }
  for (const m of s.matchAll(/url\(\s*([^)]*)\)/gi)) {
    if (!/^["']?#[\w-]+["']?$/.test(m[1].trim())) return "url() hors du SVG";
  }
  return null;
}

/** Les trois formats du site, recadrés au centre du héros. */
const FORMATS = [
  ["heros", 2400, 1350],
  ["vignette", 1200, 1114],
  ["partage", 1200, 630],
];

/** Rend le SVG dans chaque format ; `destination(nom)` donne le fichier écrit. */
async function rendre(svg, destination) {
  const refus = refusVisuel(svg);
  if (refus) throw new Error(`Visuel refusé : ${refus}`);
  const heros = await sharp(Buffer.from(svg.trim()))
    .resize(2400, 1350, { fit: "cover" })
    .flatten({ background: FOND })
    .png()
    .toBuffer();
  const chemins = [];
  for (const [nom, largeur, hauteur] of FORMATS) {
    const chemin = destination(nom);
    await sharp(heros)
      .resize(largeur, hauteur, { fit: "cover", position: "centre" })
      .jpeg({ quality: 84, progressive: true, mozjpeg: true })
      .toFile(chemin);
    chemins.push(chemin);
  }
  return chemins;
}

/** Écrit héros, vignette et image de partage de l'article, depuis `racine` (le dépôt). */
export function rendreVisuel(slug, svg, racine = ".") {
  const fichiers = {
    heros: `${racine}/public/images/heros/blog-${slug}.jpg`,
    vignette: `${racine}/public/images/blog/${slug}.jpg`,
    partage: `${racine}/public/images/og-blog-${slug}.jpg`,
  };
  return rendre(svg, (nom) => fichiers[nom]);
}

/** `bun scripts/visuel-article.mjs <fichier.svg> [dossier]` : rend un SVG hors circuit, pour le régler. */
if (import.meta.main) {
  const [fichier, dossier = "."] = process.argv.slice(2);
  if (!fichier) throw new Error("usage : bun scripts/visuel-article.mjs <fichier.svg> [dossier]");
  for (const chemin of await rendre(await Bun.file(fichier).text(), (nom) => `${dossier}/${nom}.jpg`)) console.log(chemin);
}
