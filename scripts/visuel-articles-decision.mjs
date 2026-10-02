/**
 * Fabrique les visuels des 4 articles de décision et de prix (lot 4 SEO,
 * 2026-10-02) : héros 2400 × 1350, vignette 1200 × 1114, partage 1200 × 630.
 *
 *   bun run scripts/visuel-articles-decision.mjs
 *
 * POURQUOI DES VISUELS CALCULÉS. Chaque photo de héros ne sert qu'une fois
 * (`heros-pages.test.mjs`), et ces articles parlent de choix d'outils, sans
 * sujet à photographier. Même mécanisme que `visuel-etude-normandie.mjs` :
 * fond du site, points et traits blancs discrets, accent volt, tirage à graine
 * fixe. L'image se refait à l'identique, aucun fichier tiers.
 *
 *   - Odoo ou sur mesure : une grille de modules identiques, et un groupe de
 *     forme libre qui ressort ;
 *   - remplacer Excel : une grille de tableur, une colonne surlignée ;
 *   - refonte : 2 colonnes d'adresses reliées une à une, les redirections ;
 *   - sur mesure ou WordPress : un bloc unique face à une pile de petits blocs.
 */
import sharp from "sharp";

const FOND = "#0b0b0b";
const GRIS = "rgba(255,255,255,0.15)";
const GRIS_FORT = "rgba(255,255,255,0.28)";
const VOLT = "#c8f24a";

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

const cadre = (l, h, corps) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}"><rect width="100%" height="100%" fill="${FOND}"/>${corps}</svg>`;

/** Échelle commune : un motif garde sa densité d'un format à l'autre. */
const unite = (l, h) => Math.min(l, h) / 1350;

/** Odoo ou sur mesure : modules carrés identiques, un groupe organique en volt. */
function odoo(l, h, graine) {
  const u = unite(l, h);
  const pas = 46 * u;
  const cote = 30 * u;
  const colonnes = Math.floor(l / pas);
  const lignes = Math.floor(h / pas);
  const x0 = (l - colonnes * pas) / 2;
  const y0 = (h - lignes * pas) / 2;
  const aleatoire = tirage(graine);
  // Le groupe : un amas autour d'un centre décalé, bord irrégulier.
  const cx = colonnes * 0.3;
  const cy = lignes * 0.5;
  const rayon = Math.min(colonnes, lignes) * 0.26;
  let corps = "";
  for (let i = 0; i < colonnes; i += 1) {
    for (let j = 0; j < lignes; j += 1) {
      const d = Math.hypot((i - cx) * 0.9, j - cy);
      const dedans = d < rayon * (0.75 + aleatoire() * 0.45);
      const x = x0 + i * pas + (pas - cote) / 2;
      const y = y0 + j * pas + (pas - cote) / 2;
      corps += dedans
        ? `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cote.toFixed(1)}" height="${cote.toFixed(1)}" rx="${(4 * u).toFixed(1)}" fill="${VOLT}"/>`
        : `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cote.toFixed(1)}" height="${cote.toFixed(1)}" fill="none" stroke="${GRIS}" stroke-width="${(1.6 * u).toFixed(2)}"/>`;
    }
  }
  return cadre(l, h, corps);
}

/** Remplacer Excel : grille de tableur, cellules remplies au hasard, une colonne en volt. */
function excel(l, h, graine) {
  const u = unite(l, h);
  const largeurCellule = 150 * u;
  const hauteurCellule = 44 * u;
  const colonnes = Math.ceil(l / largeurCellule);
  const lignes = Math.ceil(h / hauteurCellule);
  const colonneVolt = Math.floor(colonnes * 0.3);
  const aleatoire = tirage(graine);
  const trait = (1.4 * u).toFixed(2);
  let corps = "";
  for (let i = 0; i <= colonnes; i += 1) {
    corps += `<line x1="${(i * largeurCellule).toFixed(1)}" y1="0" x2="${(i * largeurCellule).toFixed(1)}" y2="${h}" stroke="${GRIS}" stroke-width="${trait}"/>`;
  }
  for (let j = 0; j <= lignes; j += 1) {
    corps += `<line x1="0" y1="${(j * hauteurCellule).toFixed(1)}" x2="${l}" y2="${(j * hauteurCellule).toFixed(1)}" stroke="${GRIS}" stroke-width="${trait}"/>`;
  }
  // Le contenu des cellules : un trait de longueur variable, comme un texte.
  for (let i = 0; i < colonnes; i += 1) {
    for (let j = 0; j < lignes; j += 1) {
      if (aleatoire() < 0.38) continue;
      const longueur = largeurCellule * (0.25 + aleatoire() * 0.5);
      const x = i * largeurCellule + 14 * u;
      const y = j * hauteurCellule + hauteurCellule / 2;
      const couleur = i === colonneVolt ? VOLT : GRIS_FORT;
      corps += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + longueur).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${couleur}" stroke-width="${(6 * u).toFixed(1)}" stroke-linecap="round"/>`;
    }
  }
  const xv = colonneVolt * largeurCellule;
  corps += `<rect x="${xv.toFixed(1)}" y="0" width="${largeurCellule.toFixed(1)}" height="${h}" fill="none" stroke="${VOLT}" stroke-width="${(3 * u).toFixed(1)}"/>`;
  return cadre(l, h, corps);
}

/** Refonte : anciennes adresses à gauche, nouvelles à droite, reliées une à une. */
function refonte(l, h, graine) {
  const u = unite(l, h);
  const aleatoire = tirage(graine);
  const n = 14;
  const xa = l * 0.2;
  const xb = l * 0.8;
  const marge = h * 0.1;
  const pas = (h - 2 * marge) / (n - 1);
  const ordre = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(aleatoire() * (i + 1));
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  }
  let corps = "";
  for (let i = 0; i < n; i += 1) {
    const ya = marge + i * pas;
    const yb = marge + ordre[i] * pas;
    const dx = (xb - xa) * 0.5;
    corps += `<path d="M${xa.toFixed(1)} ${ya.toFixed(1)} C${(xa + dx).toFixed(1)} ${ya.toFixed(1)} ${(xb - dx).toFixed(1)} ${yb.toFixed(1)} ${xb.toFixed(1)} ${yb.toFixed(1)}" fill="none" stroke="${VOLT}" stroke-opacity="0.7" stroke-width="${(2.4 * u).toFixed(2)}"/>`;
  }
  for (let i = 0; i < n; i += 1) {
    const y = marge + i * pas;
    corps += `<line x1="${(xa - 190 * u).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(xa - 24 * u).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${GRIS_FORT}" stroke-width="${(6 * u).toFixed(1)}" stroke-linecap="round"/>`;
    corps += `<circle cx="${xa.toFixed(1)}" cy="${y.toFixed(1)}" r="${(9 * u).toFixed(1)}" fill="${GRIS_FORT}"/>`;
    corps += `<circle cx="${xb.toFixed(1)}" cy="${y.toFixed(1)}" r="${(9 * u).toFixed(1)}" fill="${VOLT}"/>`;
    corps += `<line x1="${(xb + 24 * u).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(xb + 190 * u).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${GRIS_FORT}" stroke-width="${(6 * u).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return cadre(l, h, corps);
}

/** Sur mesure ou WordPress : un bloc unique, face à une pile de petits blocs. */
function wordpress(l, h, graine) {
  const u = unite(l, h);
  const aleatoire = tirage(graine);
  const base = h * 0.82;
  const xPile = l * 0.72;
  let corps = "";
  let y = base;
  let rang = 0;
  while (y > h * 0.22) {
    const hauteur = (34 + aleatoire() * 26) * u;
    const largeur = (180 + aleatoire() * 220) * u;
    const decalage = (aleatoire() - 0.5) * 120 * u;
    y -= hauteur + 8 * u;
    corps += `<rect x="${(xPile - largeur / 2 + decalage).toFixed(1)}" y="${y.toFixed(1)}" width="${largeur.toFixed(1)}" height="${hauteur.toFixed(1)}" fill="none" stroke="${rang % 4 === 2 ? GRIS_FORT : GRIS}" stroke-width="${(2 * u).toFixed(1)}"/>`;
    rang += 1;
  }
  const cote = base - h * 0.22;
  const xBloc = l * 0.28 - (cote * 0.9) / 2;
  corps += `<rect x="${xBloc.toFixed(1)}" y="${(h * 0.22).toFixed(1)}" width="${(cote * 0.9).toFixed(1)}" height="${cote.toFixed(1)}" fill="none" stroke="${VOLT}" stroke-width="${(4 * u).toFixed(1)}"/>`;
  corps += `<line x1="${(l * 0.08).toFixed(1)}" y1="${(base + 8 * u).toFixed(1)}" x2="${(l * 0.92).toFixed(1)}" y2="${(base + 8 * u).toFixed(1)}" stroke="${GRIS}" stroke-width="${(1.6 * u).toFixed(2)}"/>`;
  return cadre(l, h, corps);
}

const ARTICLES = [
  ["logiciel-sur-mesure-ou-odoo", odoo, 11],
  ["remplacer-excel-par-un-logiciel", excel, 23],
  ["refonte-site-internet-pme", refonte, 37],
  ["site-sur-mesure-ou-wordpress", wordpress, 41],
];

for (const [slug, dessin, graine] of ARTICLES) {
  const sorties = [
    [`public/images/heros/blog-${slug}.jpg`, dessin(2400, 1350, graine)],
    [`public/images/blog/${slug}.jpg`, dessin(1200, 1114, graine)],
    [`public/images/og-blog-${slug}.jpg`, dessin(1200, 630, graine)],
  ];
  for (const [chemin, contenu] of sorties) {
    await sharp(Buffer.from(contenu))
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(chemin);
    console.log(chemin);
  }
}
