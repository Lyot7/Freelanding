#!/usr/bin/env node
/**
 * mockup-projets — incruste le média réel de chaque projet dans un plateau 3D.
 *
 * CE QUE ÇA FABRIQUE. Les cartes projet de la home montraient la capture du
 * site à plat, plein cadre. Trois captures plein cadre à la suite, c'est trois
 * fois la même image de navigateur : rien ne distingue un projet du suivant au
 * défilement. Ce script pose chaque média dans une scène de studio.
 *
 * TROIS SCÈNES RÉELLEMENT DIFFÉRENTES, et cette exigence a coûté une première
 * série. La version du 2026-09-01 au matin gardait un décor unique (un portable
 * sur un rebord, un ruban par-dessus l'arête) et ne déplaçait que l'écran, à
 * droite, au centre puis à gauche. Au défilement, ça ne se lit pas comme trois
 * visuels : ça se lit comme une seule image qui glisse, soit exactement le
 * défaut qu'on prétendait corriger, avec un décor plus flatteur. Les trois
 * scènes changent donc d'APPAREIL et de POINT DE VUE : un portable vu en
 * plongée, un moniteur vu en contre-plongée, une tablette à plat vue du dessus.
 * Ce qui reste commun est la palette, jamais le mobilier. Le ruban a été
 * supprimé : il était décoratif, il n'affichait rien de réel, et c'est lui qui
 * rendait les trois plateaux jumeaux.
 *
 * POURQUOI LE MÉDIA RESTE VRAI. La scène est générée, l'écran ne l'est pas :
 * ce qui s'affiche sur la dalle est le fichier du projet, `demo.mp4` ou la
 * capture, sans retouche. Une scène entièrement générée aurait mis un faux
 * écran sur un site dont tout le chantier consiste à retirer ce qui est faux.
 *
 * COMMENT LA DALLE EST TROUVÉE. Les plateaux de `docs/mockups-sources/` ont été
 * générés avec un écran en MAGENTA PUR (#FF00FF), couleur qui n'existe nulle
 * part ailleurs dans la scène : elle sert de repère pour relever les quatre
 * coins, et rien d'autre.
 *
 * UN MASQUE POLYGONAL, ET NON `colorkey`, et c'est une correction du même jour.
 * La première version rendait le magenta transparent et glissait le média
 * dessous. Ça marche tant qu'aucun autre pixel de la scène ne ressemble au
 * magenta. Or un écran magenta ÉCLAIRE ce qui l'entoure : sur la scène du
 * portable, il déposait un reflet rose sur le repose-poignet argenté, ces
 * pixels passaient sous le seuil, et la page apparaissait par-dessus le
 * clavier. Le masque, lui, ne peut pas fuir : il est dessiné à partir des
 * quatre coins et ne laisse passer le média nulle part ailleurs.
 *
 * LE MASQUE EST DILATÉ de neuf pixels vers l'extérieur. Sans cette marge, les pixels
 * du bord de dalle (magenta mêlé au noir du châssis par l'anticrénelage)
 * restent visibles : il subsiste un liseré rose d'un pixel tout autour de
 * l'écran. Deux pixels de média en plus les recouvrent.
 *
 * `-t` PLUTÔT QUE `-shortest`, et c'est mesuré : `-loop 1` sur le plateau
 * produit un flux infini, et `-shortest` ne l'a pas borné (fichier à 22 Mo et
 * toujours en croissance après deux minutes). La durée explicite en entrée
 * coupe net. `shortest=1` sur `overlay` est gardé en second filet.
 *
 * Usage : bun scripts/mockup-projets.mjs [slug…]
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLATEAUX = join(RACINE, "docs", "mockups-sources");
const PUBLIC = join(RACINE, "public");
/* Les masques sont dérivés des coins : ils se regénèrent à chaque exécution et
   n'ont donc rien à faire dans le dépôt. */
const TRAVAIL = join(RACINE, ".next", "cache", "mockups");

/** Dimensions des plateaux générés. Les coins ci-dessous sont dans ce repère. */
const PLATEAU_LARGEUR = 1376;
const PLATEAU_HAUTEUR = 768;

/**
 * Coins de la dalle magenta, relevés sur chaque plateau (haut-gauche,
 * haut-droite, bas-droite, bas-gauche, dans l'ordre horaire du CONTENU et non
 * de l'image).
 *
 * RELEVÉ PAR ENVELOPPE CONVEXE, et pas par les extrema de x+y et x-y comme la
 * première version. Ce raccourci marche tant que le rectangle est à peu près
 * droit ; la tablette est posée en diagonale à 25 degrés, et il désignait alors
 * deux fois le même sommet. La méthode retenue prend l'enveloppe convexe du
 * masque, garde les quatre sommets qui maximisent l'aire, puis les range par
 * angle autour du centre : celui qui pointe vers 135 degrés est le haut-gauche
 * du contenu, quelle que soit l'inclinaison de l'appareil.
 *
 * Les plateaux étant figés dans le dépôt, ces valeurs le sont aussi ; les
 * recalculer n'a de sens qu'après avoir regénéré une scène.
 */
const PLATEAUX_DALLES = {
  "portable-plongee": [
    [242, 251],
    [729, 39],
    [891, 349],
    [443, 627],
  ],
  "moniteur-contre-plongee": [
    [421, 307],
    [1002, 128],
    [1052, 484],
    [361, 543],
  ],
  "tablette-a-plat": [
    [364, 309],
    [858, 110],
    [999, 446],
    [499, 648],
  ],
};

/**
 * Un plateau par projet. L'attribution suit le média : le formulaire Würth est
 * une page dense qui gagne à être vue en grand, il prend le moniteur ; les deux
 * démonstrations filmées prennent le portable et la tablette.
 */
const PROJETS = [
  { slug: "kpsull", plateau: "portable-plongee", source: "work/kpsull/demo.mp4" },
  {
    slug: "wurth-creation-de-compte",
    plateau: "moniteur-contre-plongee",
    source: "work/wurth/formulaire-etape-1.jpg",
    dossier: "work/wurth",
  },
  { slug: "nslysium", plateau: "tablette-a-plat", source: "work/nslysium/demo.mp4" },
];

/**
 * Écarte les quatre coins de quelques pixels vers l'extérieur, le long de la
 * diagonale qui part du centre.
 *
 * EN PIXELS ET NON EN POURCENTAGE, et l'écart se voyait. Un facteur
 * proportionnel donne une marge qui dépend de la taille de la dalle à l'écran :
 * les 1,5 % qui suffisaient au portable ne couvraient plus le bord de la
 * tablette, plus grande dans le cadre et posée en diagonale, et il restait un
 * liseré rose le long de son bord gauche. Le défaut à masquer, lui, fait
 * toujours la même chose : un ou deux pixels d'anticrénelage. La marge doit
 * donc être constante.
 */
function dilater(coins, pixels = 9) {
  const cx = coins.reduce((somme, [x]) => somme + x, 0) / coins.length;
  const cy = coins.reduce((somme, [, y]) => somme + y, 0) / coins.length;
  return coins.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const norme = Math.hypot(dx, dy) || 1;
    return [
      Math.round(x + (dx / norme) * pixels),
      Math.round(y + (dy / norme) * pixels),
    ];
  });
}

/**
 * `perspective` attend ses points dans l'ordre haut-gauche, haut-droite,
 * BAS-GAUCHE, bas-droite : le troisième et le quatrième sont inversés par
 * rapport à la lecture horaire d'un quadrilatère. Les intervertir donne une
 * image pliée en sablier, symptôme facile à reconnaître.
 */
function filtrePerspective(coins) {
  const [hg, hd, bd, bg] = coins;
  return `perspective=${hg[0]}:${hg[1]}:${hd[0]}:${hd[1]}:${bg[0]}:${bg[1]}:${bd[0]}:${bd[1]}:sense=destination`;
}

/**
 * Dessine le masque de la dalle : blanc dans le quadrilatère, noir partout
 * ailleurs. `alphamerge` lit ce blanc comme l'opacité du média, ce qui borne
 * l'incrustation au seul écran, quoi que fasse la lumière du reste de la scène.
 */
function dessinerMasque(chemin, coins) {
  mkdirSync(dirname(chemin), { recursive: true });
  const polygone = coins.map(([x, y]) => `${x},${y}`).join(" ");
  execFileSync("magick", [
    "-size",
    `${PLATEAU_LARGEUR}x${PLATEAU_HAUTEUR}`,
    "xc:black",
    "-fill",
    "white",
    "-draw",
    `polygon ${polygone}`,
    chemin,
  ]);
}

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
}

function duree(fichier) {
  const sortie = execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    fichier,
  ]);
  return Number.parseFloat(String(sortie).trim());
}

function composer(projet) {
  const plateau = join(PLATEAUX, `${projet.plateau}.png`);
  const source = join(PUBLIC, projet.source);
  if (!existsSync(plateau)) throw new Error(`plateau absent : ${plateau}`);
  if (!existsSync(source)) throw new Error(`média absent : ${source}`);

  const dossier = join(PUBLIC, projet.dossier ?? `work/${projet.slug}`);
  mkdirSync(dossier, { recursive: true });

  const coins = dilater(PLATEAUX_DALLES[projet.plateau]);
  const dalle = filtrePerspective(coins);
  const echelle = `scale=${PLATEAU_LARGEUR}:${PLATEAU_HAUTEUR}:flags=lanczos`;
  /* UN ÉCRAN ALLUMÉ ÉMET DE LA LUMIÈRE, la scène n'en reçoit pas. Sans ce
     gain, un média déjà sombre (NSLysium, dont la page d'accueil est un
     intérieur en pénombre) se fond dans le plateau noir : la dalle disparaît
     et la carte n'affiche plus qu'un portable éteint. Le gain est léger, il
     ne change pas les couleurs du site, il le décolle de son fond. */
  const luminosite = "eq=brightness=0.08:contrast=1.08:saturation=1.05";

  const masque = join(TRAVAIL, `${projet.plateau}-masque.png`);
  dessinerMasque(masque, coins);

  const estVideo = projet.source.endsWith(".mp4");
  const posterJpg = join(dossier, "mockup-poster.jpg");

  if (estVideo) {
    const secondes = duree(source);
    const sortie = join(dossier, "mockup.mp4");
    ffmpeg([
      "-t",
      String(secondes),
      "-loop",
      "1",
      "-i",
      plateau,
      "-i",
      source,
      "-i",
      masque,
      "-filter_complex",
      `[1:v]fps=30,${echelle},${luminosite},${dalle},format=rgba[ecran];` +
        `[2:v]${echelle},format=gray[alpha];` +
        `[ecran][alpha]alphamerge[dalle];` +
        `[0:v][dalle]overlay=0:0:format=auto:shortest=1,format=yuv420p`,
      "-c:v",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      "-an",
      sortie,
    ]);
    /* Le poster est une image du composite, pas la capture d'origine : un
       poster à plat suivi d'une vidéo en perspective ferait sauter la carte
       au premier tour de lecture. */
    ffmpeg(["-i", sortie, "-vf", "select=eq(n\\,90)", "-vframes", "1", "-q:v", "4", posterJpg]);
    console.log(`✅ ${projet.slug} → mockup.mp4 + mockup-poster.jpg`);
    return;
  }

  const sortie = join(dossier, "mockup.jpg");
  ffmpeg([
    "-i",
    plateau,
    "-i",
    source,
    "-i",
    masque,
    "-filter_complex",
    `[1:v]${echelle},${luminosite},${dalle},format=rgba[ecran];` +
      `[2:v]${echelle},format=gray[alpha];` +
      `[ecran][alpha]alphamerge[dalle];` +
      `[0:v][dalle]overlay=0:0:format=auto`,
    "-q:v",
    "4",
    sortie,
  ]);
  console.log(`✅ ${projet.slug} → mockup.jpg`);
}

const demandes = process.argv.slice(2);
const cibles = demandes.length
  ? PROJETS.filter((projet) => demandes.includes(projet.slug))
  : PROJETS;

if (cibles.length === 0) {
  console.error(`Aucun projet ne correspond. Connus : ${PROJETS.map((p) => p.slug).join(", ")}`);
  process.exit(1);
}

for (const projet of cibles) composer(projet);
