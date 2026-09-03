/**
 * Fabrique une copie AUTOPORTANTE de la page d'accueil, pour la publier ailleurs.
 *
 *   bun run scripts/artifact-home.mjs [port] [fichier de sortie]
 *
 * POURQUOI. Le site tourne en local ; pour le montrer à quelqu'un, il faut soit
 * le déployer, soit envoyer des captures. Cette copie est un troisième terme :
 * une seule page HTML, sans aucune requête réseau, qui garde le rendu exact et
 * une partie du mouvement.
 *
 * CE QUI SURVIT, et pourquoi. Le script d'apparition du hero et du header
 * (`APPEAR_BOOT_SCRIPT`) est écrit pour tourner AVANT tout JavaScript
 * applicatif : il est autonome, ne dépend d'aucun module, et lit ses images-clés
 * dans les attributs du HTML. Il fonctionne donc à l'identique sans React. Tous
 * les effets de survol sont en CSS pur (`group-hover`), la vidéo de fond est
 * native, le verre dépoli est un `backdrop-filter`. L'essentiel du mouvement de
 * la page tient sans le framework.
 *
 * CE QUI NE SURVIT PAS : ce qui dépend de framer-motion au fil du défilement.
 * Les parallaxes, les compteurs qui s'incrémentent, l'horloge locale, et les
 * apparitions déclenchées à l'entrée dans le viewport. Ces dernières posent un
 * problème particulier : leur état MASQUÉ est sérialisé dans le HTML, et sans
 * React rien ne vient les révéler — la page resterait à moitié vide. On leur
 * applique donc le même filet que la feuille `<noscript>` du site, ciblé sur les
 * seuls éléments qui n'ont pas d'identifiant d'apparition, pour ne pas écraser
 * l'entrée du hero.
 */
import { writeFileSync } from "node:fs";

const PORT = process.argv[2] ?? "3210";
const SORTIE = process.argv[3] ?? "/tmp/accueil.html";
const BASE = `http://localhost:${PORT}`;

/** Types MIME des ressources inlinées, par extension. */
const MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const cache = new Map();
let octets = 0;
/** Ressources qui n'ont pas pu être inlinées : la page publiée ne les aura pas. */
let manquants = 0;

/** Télécharge une ressource et la rend en `data:` URI. Mémorisée. */
async function enDataUri(chemin) {
  if (cache.has(chemin)) return cache.get(chemin);

  /*
   * DEUX CORRECTIONS SUR L'ADRESSE AVANT DE LA DEMANDER.
   *
   * `&amp;` : l'adresse est lue dans du HTML, où les esperluettes sont
   * échappées. Telle quelle, l'optimiseur d'images répond 400 — c'est ce qui
   * faisait tomber six visuels en silence, la page se publiant quand même.
   *
   * `w=3840` : la page n'a plus de réseau, elle embarque UNE seule largeur par
   * image. Demander la plus grande variante double le poids du fichier pour un
   * écran qui ne la montrera jamais. 1920 couvre l'affichage en pleine largeur.
   */
  const adresse = chemin.replace(/&amp;/g, "&").replace(/([?&]w=)3840\b/, "$11920");

  const reponse = await fetch(BASE + adresse);
  if (!reponse.ok) {
    console.warn(`  ⚠ ${reponse.status} sur ${adresse.slice(0, 90)}`);
    cache.set(chemin, null);
    manquants += 1;
    return null;
  }
  const donnees = Buffer.from(await reponse.arrayBuffer());
  const type =
    reponse.headers.get("content-type")?.split(";")[0] ||
    MIME[chemin.slice(chemin.lastIndexOf("."))] ||
    "application/octet-stream";
  const uri = `data:${type};base64,${donnees.toString("base64")}`;
  octets += donnees.length;
  cache.set(chemin, uri);
  return uri;
}

async function texte(chemin) {
  const reponse = await fetch(BASE + chemin);
  return reponse.ok ? reponse.text() : "";
}

/* ------------------------------- 1. le HTML ------------------------------ */

let html = await texte("/");
console.log(`HTML source : ${Math.round(html.length / 1024)} Ko`);

/* ------------------------------- 2. le CSS ------------------------------- */

const feuilles = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g)];
let css = "";
for (const [balise, href] of feuilles) {
  css += await texte(href);
  html = html.replace(balise, "");
}
console.log(`CSS : ${feuilles.length} feuille(s), ${Math.round(css.length / 1024)} Ko`);

// Ressources citées PAR le CSS : polices d'abord, images de fond ensuite.
const refsCss = [...new Set([...css.matchAll(/url\((\/[^)"']+)\)/g)].map((m) => m[1]))];
for (const ref of refsCss) {
  const uri = await enDataUri(ref);
  if (uri) css = css.split(`url(${ref})`).join(`url(${uri})`);
}
console.log(`  ${refsCss.length} ressource(s) citée(s) par le CSS`);

/* ------------------------ 3. images, vidéos, affiches -------------------- */

// `srcset` est retiré plutôt qu'inliné : la page n'a plus de réseau, servir
// cinq largeurs de la même image multiplierait le poids sans rien apporter.
html = html.replace(/\ssrcset="[^"]*"/g, "").replace(/\ssizes="[^"]*"/g, "");

const refsHtml = [
  ...new Set(
    [...html.matchAll(/(?:src|poster)="(\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter((u) => !u.startsWith("/_next/static/chunks")),
  ),
];
for (const ref of refsHtml) {
  const uri = await enDataUri(ref);
  if (uri) html = html.split(`"${ref}"`).join(`"${uri}"`);
}
console.log(`  ${refsHtml.length} média(s) inliné(s)`);

/* ---------------------------- 4. le JavaScript --------------------------- */

// Les paquets de React et du routeur partent : ils chargeraient d'autres
// morceaux par le réseau, que la page publiée ne peut pas atteindre.
const paquets = [...html.matchAll(/<script[^>]+src="\/_next\/[^"]*"[^>]*><\/script>/g)];
for (const [balise] of paquets) html = html.replace(balise, "");

// Le flux de rendu de React ne sert plus à rien sans React, et il pèse lourd.
const flux = [...html.matchAll(/<script>self\.__next_f[\s\S]*?<\/script>/g)];
for (const [balise] of flux) html = html.replace(balise, "");
console.log(`JavaScript : ${paquets.length} paquet(s) et ${flux.length} bloc(s) de flux retirés`);

const garde = html.includes("__appearBoot");
console.log(`  script d'apparition ${garde ? "CONSERVÉ" : "ABSENT (les entrées ne joueront pas)"}`);

/* ------------------------- 5. liens et navigation ------------------------ */

// Un lien interne mènerait à une page qui n'existe pas dans cette copie. Il
// devient inerte, mais reste visible : c'est une page à regarder, pas à parcourir.
const liens = [...html.matchAll(/href="(\/[^"]*)"/g)].length;
html = html.replace(/href="\/[^"]*"/g, 'href="#" data-inerte="1"');
console.log(`Liens internes neutralisés : ${liens}`);

/* --------------------------- 6. assemblage final ------------------------- */

const corps = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
const contenu = corps.slice(corps.indexOf(">") + 1);
const classesBody = /<body[^>]*class="([^"]*)"/.exec(corps)?.[1] ?? "";
const classesHtml = /<html[^>]*class="([^"]*)"/.exec(html)?.[1] ?? "";

const filet = `
/* FILET DES APPARITIONS AU DÉFILEMENT. Leur état masqué est sérialisé dans le
   HTML et c'est framer-motion qui les révèle : sans lui, la moitié de la page
   resterait invisible. On les remet à l'état final, comme le fait la feuille
   <noscript> du site. Ciblé sur les éléments SANS identifiant d'apparition :
   ceux du hero et du header sont animés par le script inline, qui, lui,
   fonctionne toujours. */
[data-reveal]:not([data-framer-appear-id]) {
  opacity: 1 !important;
  transform: none !important;
}
/* Le squelette de la page publiée remplace <html> et <body> : leurs classes de
   police sont reportées ici pour que la typographie reste celle du site. */
html, body { ${classesHtml || classesBody ? "" : ""} }
[data-inerte] { cursor: default; }
`;

const page = `<title>Bouquerel, page d'accueil</title>
<div class="${classesHtml} ${classesBody}" data-copie-accueil>
<style>${css}${filet}</style>
${contenu}
</div>`;

writeFileSync(SORTIE, page);
console.log(
  `\n${manquants === 0 ? "✅" : "❌"} ${SORTIE} — ${(page.length / 1024 / 1024).toFixed(2)} Mo ` +
    `(dont ${(octets / 1024 / 1024).toFixed(2)} Mo de médias avant encodage)`,
);

/*
 * UNE RESSOURCE MANQUANTE FAIT ÉCHOUER LE SCRIPT. Sans ça, la page se
 * fabriquait quand même, à un visuel près, et il fallait le voir à l'œil sur une
 * page de 7 Mo. Un trou dans une copie destinée à être partagée n'est pas un
 * détail : c'est précisément ce que le destinataire remarquera.
 */
if (manquants > 0) {
  console.error(`   ${manquants} ressource(s) absente(s) de la copie.`);
  process.exit(1);
}
