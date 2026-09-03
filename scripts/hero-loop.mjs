/**
 * hero-loop — fabrique la boucle de fond du hero à partir d'une source
 * quelconque (image fixe ou rush vidéo), et GARANTIT par la mesure qu'elle
 * respecte le profil lumineux du hero.
 *
 *   bun run scripts/hero-loop.mjs <source> [sortie.mp4]
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * Le fond du hero porte le wordmark blanc, le paragraphe et la signature. Un
 * seul aplat clair mouvant sous ces textes les troue par intermittence, ce qui
 * est pire qu'un fond raté fixe. Le fond d'origine (le pilote du template) n'est
 * donc pas « sombre » au jugé, il tient un profil précis, RELEVÉ :
 *
 *   moyenne 17,2/255 · max 153 · p99 101 · p99,9 125 · 0,00 % au-dessus de 200
 *
 * Aucune source générée ou filmée ne sort à ce profil : elle arrive exposée pour
 * être belle seule. Un réglage d'assombrissement FIXE ne marche pas non plus,
 * puisqu'il dépend entièrement de l'exposition d'entrée. Le script cherche donc
 * le réglage par DICHOTOMIE, en mesurant le rendu réel à chaque essai, et il
 * échoue bruyamment si la cible n'est pas atteinte.
 *
 * Les tolérances sont larges sur la moyenne (le grain du hero et le calque de
 * bruit du site ajoutent leur propre variance) et dures sur le haut de la
 * distribution, qui est le seul endroit où la lisibilité se joue.
 */
import { spawn } from "node:child_process";
import { statSync } from "node:fs";

/** Profil relevé sur le fond d'origine, cible à tenir. */
const TARGET = {
  meanMin: 13,
  meanMax: 21,
  maxMax: 160,
  p99Max: 112,
};

/** Géométrie du hero (1756 x 1180 dans la source, rapport 1,488). */
const OUT_W = 1756;
const OUT_H = 1180;
const RATIO = OUT_W / OUT_H;

/**
 * Durée de boucle et longueur du fondu de raccord, en secondes.
 *
 * Pour une source VIDÉO, la durée est relevée sur le fichier : rogner un rush de
 * 4 s à une fenêtre de 8 s produirait une boucle figée sur sa dernière image.
 * Pour une image fixe, la valeur par défaut sert de durée de dérive.
 *
 * Le fondu vaut un quart de la boucle, borné : trop court il laisse voir le
 * raccord, trop long il mange la matière utile.
 */
const DEFAULT_LOOP_SECONDS = 8;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

async function probeDuration(file) {
  return new Promise((resolve) => {
    const child = spawn("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", file,
    ]);
    let out = "";
    child.stdout.on("data", (c) => (out += c));
    child.on("close", () => {
      const d = Number.parseFloat(out.trim());
      resolve(Number.isFinite(d) && d > 0 ? d : null);
    });
  });
}

function run(args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      stdio: ["ignore", capture ? "pipe" : "ignore", "pipe"],
    });
    const chunks = [];
    let err = "";
    if (capture) child.stdout.on("data", (c) => chunks.push(c));
    child.stderr.on("data", (c) => (err += c));
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error(`ffmpeg (${code}) : ${err.slice(-600)}`)),
    );
  });
}

/** Statistiques de luminance sur le rendu réel du filtre, pas sur une théorie. */
async function measure(source, filters) {
  const raw = await run(
    [
      "-v", "error",
      "-i", source,
      "-vf", `${filters},scale=160:-1,format=gray`,
      "-f", "rawvideo", "-",
    ],
    { capture: true },
  );
  const n = raw.length;
  if (n === 0) throw new Error("mesure vide : le filtre n'a rien produit");
  const hist = new Uint32Array(256);
  let sum = 0;
  for (const v of raw) {
    hist[v] += 1;
    sum += v;
  }
  let seen = 0;
  let p99 = 0;
  let max = 0;
  for (let v = 0; v < 256; v += 1) {
    if (hist[v] === 0) continue;
    max = v;
    seen += hist[v];
    if (p99 === 0 && seen >= n * 0.99) p99 = v;
  }
  const over200 = hist.slice(201).reduce((a, b) => a + b, 0);
  return { mean: sum / n, max, p99, over200Pct: (over200 / n) * 100 };
}

/**
 * Chaîne de rendu. `gamma` < 1 assombrit ; la courbe finale est un PLAFOND dur
 * qui borne le blanc quoi qu'il arrive en amont, la dichotomie ne peut donc
 * jamais faire remonter le haut de la distribution au-dessus de la cible.
 */
function grade(gamma) {
  return [
    "format=gray",
    `eq=gamma=${gamma.toFixed(4)}`,
    // Le dernier point est un PLAFOND sur le blanc. À 0,58 la moyenne se tenait
    // mais le p99 restait 20 points au-dessus de la référence, et le gamma
    // saturait sans pouvoir compenser : c'est le haut de la courbe qu'il faut
    // comprimer, pas l'exposition globale. Le haut est donc abaissé, et les
    // points intermédiaires resserrés pour garder du modelé dans les gris.
    "curves=all='0/0 0.25/0.02 0.5/0.09 0.75/0.26 1/0.45'",
  ].join(",");
}

/**
 * Grain, appliqué APRÈS la calibration et juste avant l'encodage.
 *
 * Ce n'est pas une coquetterie : à ce niveau d'exposition, tout le signal vit
 * dans les vingt premières valeurs de la rampe, et h264 y produit un BANDING
 * vertical franc, mesuré sur le premier rendu. Un bruit temporel léger casse les
 * plages plates et rend la compression propre. Il coûte du débit, d'où le CRF
 * abaissé en compensation. Le fond d'origine tient sa propreté de la même façon,
 * par le grain du capteur.
 */
const GRAIN = "noise=alls=7:allf=t+u";

/** Recadrage au rapport du hero, sans déformation, puis mise à l'échelle. */
const GEOMETRY = [
  `crop='if(gt(iw/ih,${RATIO}),ih*${RATIO},iw)':'if(gt(iw/ih,${RATIO}),ih,iw/${RATIO})'`,
  `scale=${OUT_W}:${OUT_H}`,
].join(",");

async function calibrate(source, prelude) {
  let lo = 0.05;
  let hi = 6;
  let best = null;
  for (let i = 0; i < 14; i += 1) {
    const gamma = (lo + hi) / 2;
    const stats = await measure(source, `${prelude},${grade(gamma)}`);
    const ok =
      stats.mean >= TARGET.meanMin &&
      stats.mean <= TARGET.meanMax &&
      stats.max <= TARGET.maxMax &&
      stats.p99 <= TARGET.p99Max;
    process.stdout.write(
      `  essai ${String(i + 1).padStart(2)} gamma=${gamma.toFixed(4)} ` +
        `moyenne=${stats.mean.toFixed(1)} max=${stats.max} p99=${stats.p99}` +
        `${ok ? "  ✓" : ""}\n`,
    );
    if (ok) return { gamma, stats };
    if (!best || Math.abs(stats.mean - 17) < Math.abs(best.stats.mean - 17)) {
      best = { gamma, stats };
    }
    // Moyenne trop haute → il faut assombrir → baisser gamma.
    if (stats.mean > TARGET.meanMax) hi = gamma;
    else lo = gamma;
  }
  return best;
}

const [source, output = "public/videos/hero-loop.mp4"] = process.argv.slice(2);
if (!source) {
  console.error("usage : bun run scripts/hero-loop.mjs <source> [sortie.mp4]");
  process.exit(1);
}

const isStill = /\.(png|jpe?g|webp)$/i.test(source);

// Durée réelle de la source, arrondie vers le bas : la dernière fraction
// d'image d'un rush est souvent incomplète.
const sourceDuration = isStill ? null : await probeDuration(source);
const LOOP_SECONDS = isStill
  ? DEFAULT_LOOP_SECONDS
  : Math.max(2, Math.floor((sourceDuration ?? DEFAULT_LOOP_SECONDS) * 10) / 10);
const XFADE_SECONDS = clamp(LOOP_SECONDS / 4, 0.5, 1.5);

/**
 * DÉRIVE, pour une source fixe.
 *
 * Une image immobile en fond de hero se lit comme un fond raté : l'oeil attend
 * un signe de vie. Le fond d'origine en donne à peine plus, une lente translation
 * de lumière, mais il en donne un.
 *
 * Le mouvement est une SINUSOÏDE d'un cycle complet sur la durée de boucle :
 * l'échelle revient exactement à sa valeur de départ à la dernière image, donc
 * le raccord est parfait par construction et ne demande aucun fondu. Amplitude
 * 3 %, soit environ 50 px de course sur 1756 : perceptible sans être lisible
 * comme un zoom.
 */
const DRIFT_FRAMES = DEFAULT_LOOP_SECONDS * 24;
const drift =
  `scale=${Math.round(OUT_W * 1.08)}:-1,` +
  `zoompan=z='1.04+0.03*sin(2*PI*on/${DRIFT_FRAMES})'` +
  `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'` +
  `:d=1:s=${OUT_W}x${OUT_H}:fps=24`;

// Un rush garde sa VITESSE RÉELLE. Le ralenti de moitié appliqué auparavant
// convenait à une matière abstraite ; sur un mécanisme, il donne un balancier
// qui traîne, c'est-à-dire un mécanisme qui a l'air cassé.
const prelude = isStill
  ? `${GEOMETRY},${drift}`
  : `${GEOMETRY},fps=24`;

console.log(`source : ${source}`);
console.log(`cible  : moyenne ${TARGET.meanMin}-${TARGET.meanMax}, max <= ${TARGET.maxMax}, p99 <= ${TARGET.p99Max}`);
console.log("calibration :");

const found = await calibrate(source, prelude);
if (!found) {
  console.error("échec : aucun réglage n'atteint la cible");
  process.exit(1);
}

// Raccord de boucle : la queue est fondue par-dessus la tête, ce qui supprime le
// saut visible d'une boucle vidéo brute.
const head = isStill ? LOOP_SECONDS : LOOP_SECONDS - XFADE_SECONDS;
const loopFilter = isStill
  ? `[0:v]${prelude},${grade(found.gamma)},trim=0:${LOOP_SECONDS},setpts=PTS-STARTPTS,${GRAIN},format=yuv420p[out]`
  : `[0:v]${prelude},${grade(found.gamma)},trim=0:${LOOP_SECONDS},setpts=PTS-STARTPTS[v];` +
  `[v]split[body][tail];` +
  `[tail]trim=${head}:${LOOP_SECONDS},setpts=PTS-STARTPTS,format=yuva420p,` +
  `fade=in:st=0:d=${XFADE_SECONDS}:alpha=1,setpts=PTS+${head}/TB[ovl];` +
  `[body][ovl]overlay,trim=0:${head},${GRAIN},format=yuv420p[out]`;

const common = ["-filter_complex", loopFilter, "-map", "[out]", "-an"];
await run([
  "-v", "error", "-y",
  ...(isStill ? ["-loop", "1", "-t", String(LOOP_SECONDS)] : []),
  "-i", source,
  ...common,
  "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-tune", "grain",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  output,
]);

const webm = output.replace(/\.mp4$/, ".webm");
await run([
  "-v", "error", "-y",
  ...(isStill ? ["-loop", "1", "-t", String(LOOP_SECONDS)] : []),
  "-i", source,
  ...common,
  "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1",
  webm,
]);

// Vérification sur le FICHIER FINAL, pas sur le filtre : l'encodage lui-même
// peut déplacer la distribution.
const final = await measure(output, "null");
const pass =
  final.mean >= TARGET.meanMin &&
  final.mean <= TARGET.meanMax &&
  final.max <= TARGET.maxMax &&
  final.p99 <= TARGET.p99Max;

console.log("\nfichier final :");
for (const file of [output, webm]) {
  console.log(`  ${file}  ${(statSync(file).size / 1024).toFixed(0)} Ko`);
}
console.log(
  `  moyenne ${final.mean.toFixed(1)}/255  max ${final.max}  p99 ${final.p99}  ` +
    `>200 ${final.over200Pct.toFixed(3)} %`,
);
console.log(pass ? "\n✅ profil conforme au hero" : "\n❌ HORS CIBLE");
process.exit(pass ? 0 : 1);
