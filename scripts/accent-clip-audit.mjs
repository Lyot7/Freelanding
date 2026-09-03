/**
 * Audit de l'encre coupée par les masques d'apparition — LES DEUX BORDS.
 *
 * LE DÉFAUT, mesuré au canvas dans la police du site (Geist, 92 px, graisse 600) :
 *
 *   « E » : encre à 65,3 px au-dessus de la ligne de base
 *   « É » : encre à 83,7 px, soit +18,4 px
 *
 * LE BORD BAS A ÉTÉ AJOUTÉ LE 2026-09-01, et il manquait depuis le premier
 * jour. Cet audit ne regardait que le haut, parce que le défaut qui l'a fait
 * naître était un accent. Or la boîte de ligne trop courte coupe AUSSI par le
 * bas, et ce qui vit sous la ligne de base en français est la ponctuation :
 * la virgule descend de 0,158em, le « ç » de 0,228em. Le titre de la section
 * « à propos » de l'accueil, « Sites, outils, logiciels. », perdait ainsi les
 * deux tiers de chacune de ses virgules — 9,3 px sur 14,5 à 92 px de corps —
 * et l'audit affichait « aucun accent coupé ». Il regardait le bon défaut au
 * mauvais endroit.
 *
 * L'ÉTAT MESURÉ EST L'ÉTAT DE REPOS. Les apparitions du site rendent leur état
 * MASQUÉ dès le serveur (cf. `src/components/motion/Reveal.tsx`) et ne partent
 * qu'à l'entrée dans le viewport. Un titre sous la ligne de flottaison reste
 * donc garé 40 px plus bas pendant tout l'audit, et sa géométrie mesurée n'est
 * celle de rien de ce qu'un lecteur voit : le bord bas y paraissait catastrophé
 * et le bord haut irréprochable, les deux à tort. On pose donc la MÊME feuille
 * que le site sert déjà à `<noscript>` (`SiteDocument.tsx`), qui remet tout
 * `[data-reveal]` à son état final. C'est l'état d'arrivée, celui qui se lit.
 *
 * Ce site reproduit un template ANGLAIS, dont les titres emploient des
 * interlignages très serrés (`leading-[0.82]`, `leading-[0.9]`…) combinés à un
 * `overflow-hidden` qui sert de masque aux animations de révélation ligne par
 * ligne. La boîte de ligne est alors PLUS COURTE que la hauteur d'une capitale
 * accentuée : l'accent dépasse par le haut et le masque le coupe net.
 *
 * Le grand titre de l'accueil affichait ainsi « STRATEGIE » au lieu de
 * « STRATÉGIE ». Ni la donnée ni la police n'y sont pour quelque chose : le DOM
 * contient bien « Stratégie », la police contient bien le glyphe. Rien ne le
 * signale, ni erreur ni avertissement.
 *
 * COMMENT LA DÉTECTION FONCTIONNE
 *
 * Pour chaque élément portant du texte, rendu APRÈS `text-transform`, on
 * compare de part et d'autre de la ligne de base l'encre réelle et la place
 * offerte par le bord de coupe le plus proche :
 *
 *   BORD HAUT — seulement si le texte porte une capitale accentuée.
 *   `inkAscent`, la montée d'encre mesurée au canvas dans la police, la graisse
 *   et la taille effectives, contre la place au-dessus de la ligne de base de
 *   la PREMIÈRE ligne.
 *
 *   BORD BAS — dès que le texte descend sous la ligne de base, ce qui vise en
 *   français la virgule (0,158em), le point-virgule, les parenthèses (0,110em),
 *   la cédille (0,228em, la plus profonde) et les bas-de-casse à jambage.
 *   `inkDescent` contre la place sous la ligne de base de la DERNIÈRE ligne.
 *
 * Si l'encre dépasse la place disponible ET qu'un ancêtre coupe verticalement,
 * le glyphe est rogné. On remonte la chaîne pour nommer le coupable.
 *
 * Usage :
 *   bun run scripts/accent-clip-audit.mjs
 *   bun run scripts/accent-clip-audit.mjs 1440
 */
import { chromium } from "playwright";
import { blogPosts } from "../src/content/blog.ts";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Les routes réellement publiées.
 *
 * La liste précédente datait du template : `/work/box-mode` et
 * `/introuvable-404` n'existent plus, et le blog — les pages les plus denses en
 * texte accentué du site — n'y figurait pas du tout. Un audit qui saute les
 * pages les plus exposées ne prouve rien.
 *
 * LES ARTICLES SONT DÉRIVÉS DU REGISTRE depuis le 2026-08-28, plus écrits à la
 * main. Les cinq slugs étaient en dur : publier un article ne le faisait donc
 * pas auditer, et en retirer un faisait échouer l'audit sur une page 404.
 * `blog.ts` est la seule source qui décide de l'existence d'un article : c'est
 * elle qui décide aussi de ce qui est audité.
 */
const ROUTES = [
  "/",
  "/about",
  "/work",
  "/work/kpsull",
  "/work/nslysium",
  "/work/wurth-creation-de-compte",
  "/blog",
  ...blogPosts.map(({ slug }) => `/blog/${slug}`),
  // Pages de prestation, ajoutées le 2026-08-27 avec la refonte de l'offre.
  "/services/site-vitrine",
  "/services/outil-metier",
  "/services/logiciel-metier",
  "/contact",
  "/legal/mentions-legales",
  "/legal/politique-de-confidentialite",
  "/legal/conditions-generales-de-vente",
  "/introuvable-page-de-test",
];

const WIDTHS = [390, 810, 1440];
const args = process.argv.slice(2).map(Number).filter(Boolean);
const widths = args.length > 0 ? args : WIDTHS;

/** Routes que l'audit n'a pas pu charger : elles invalident son verdict. */
const injoignables = [];

/** Capitales accentuées du français, telles qu'elles sortent d'un `uppercase`. */
const ACCENTS = "ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒ";

/**
 * Marge exigée AU-DESSUS de l'encre de l'accent.
 *
 * PROPORTIONNELLE AU CORPS, pas fixe. Un seuil en pixels absolus se trompe aux
 * deux bouts : à 3 px, un libellé de 11 px offrant 0,6 px d'air était signalé —
 * l'accent y est pourtant entièrement dessiné — pendant qu'un titre de 100 px
 * avec 4 px d'air passait pour confortable alors que son accent frôle le bord.
 *
 * 4 % du corps : 2,7 px à 68, 3,7 px à 92, 4 px à 100. Le plancher de 0,5 px
 * garantit qu'à petite taille l'accent ne soit jamais rasé, sans exiger une
 * marge que la boîte de ligne ne peut pas offrir.
 *
 * CE QUE CE SEUIL TRADUIT. « Aucun accent coupé » ne suffisait pas : un accent
 * entier mais collé au bord de coupe se lit comme un accident d'impression.
 * L'audit exige donc de l'air, pas seulement la survie du glyphe.
 */
const TAUX_MARGE = 0.04;
const PLANCHER_MARGE = 0.5;

function collect([accents, TAUX, PLANCHER]) {
  const canvas = document.createElement("canvas").getContext("2d");
  const found = [];

  /** Texte réellement affiché, casse comprise. */
  const rendered = (el) => {
    const raw = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    const tf = getComputedStyle(el).textTransform;
    if (tf === "uppercase") return raw.toUpperCase();
    if (tf === "lowercase") return raw.toLowerCase();
    if (tf === "capitalize") return raw.replace(/\b\w/g, (c) => c.toUpperCase());
    return raw;
  };

  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className : "";
    return (
      el.tagName.toLowerCase() +
      (cls ? "." + cls.split(/\s+/).filter(Boolean).slice(0, 3).join(".") : "")
    );
  };

  /**
   * Un bord de coupe, et ce qu'il laisse passer.
   *
   * `sens` vaut +1 vers le bas, -1 vers le haut. `baseline` est la ligne de
   * base de la ligne exposée à ce bord : la PREMIÈRE pour le haut (seul un
   * accent y dépasse), la DERNIÈRE pour le bas (seule une descendante y
   * dépasse).
   *
   * MESURE GÉOMÉTRIQUE plutôt qu'arithmétique : la coupe se fait au bord de la
   * boîte de REMPLISSAGE. Un `padding` sur l'élément qui coupe recule donc ce
   * bord et rend de la place, exactement comme `overflow-clip-margin`.
   * Comparer `line-height` et encre sans en tenir compte signalait comme
   * cassés des endroits déjà corrigés.
   *
   * TOUS LES ANCÊTRES QUI COUPENT, et non le premier. Il suffit qu'un masque
   * plus haut dans l'arbre coupe plus court pour que le glyphe disparaisse
   * quand même. Cas relevé le 2026-08-27 sur l'accueil : le mot « Crédible »
   * porte un masque muni de `accent-room` (29,4 px de place, largement assez),
   * l'audit s'y arrêtait et déclarait la page saine, pendant que la colonne du
   * titre, deux niveaux au-dessus, coupait en `overflow: clip` pile au sommet
   * de l'encre. C'est le bord le plus serré qui décide : on les compare tous.
   */
  const analyser = (el, sens, baseline, encre, fontSize, TAUX, PLANCHER) => {
    let coupeur = null;
    let premier = true;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const st = getComputedStyle(n);
      if (!/hidden|clip|scroll|auto/.test(st.overflowY)) continue;
      const nr = n.getBoundingClientRect();
      const marge = parseFloat(st.overflowClipMargin) || 0;
      const bord =
        sens > 0
          ? nr.bottom - parseFloat(st.borderBottomWidth) + marge
          : nr.top + parseFloat(st.borderTopWidth) - marge;
      const place = (bord - baseline) * sens;
      // Copie GARÉE d'une permutation : la seconde copie d'un effet de survol
      // est stationnée entièrement hors du cadre, en attendant son tour. Sa
      // ligne de base est alors au-delà du bord de coupe de SON PROPRE masque.
      // Ce n'est pas un glyphe rogné, c'est le mécanisme même de l'effet.
      if (premier && place <= 0) return null;
      premier = false;
      if (place <= 0) continue;
      // MARGE EXIGÉE, et pas seulement l'absence de coupe. Un glyphe qui
      // affleure le bord est techniquement entier et se lit quand même comme un
      // accident : c'est le « tout petit bout d'accent » relevé le 2026-08-27
      // sur « CRÉDIBLE », où `overflow-clip-margin: 0.25em` laissait passer
      // 4 px sur les 14 nécessaires. Le seuil vaut donc encre + marge.
      const MARGE = Math.max(PLANCHER, fontSize * TAUX);
      if (encre + MARGE > place && (coupeur === null || place < coupeur.place)) {
        coupeur = {
          sel: describe(n),
          propre: n === el,
          place: Math.round(place * 10) / 10,
          debord: Math.round((encre - place) * 10) / 10,
        };
      }
    }
    return coupeur;
  };

  for (const el of document.querySelectorAll("body *")) {
    // Seules les feuilles de texte : un conteneur hérite du texte de ses
    // descendants et produirait des doublons.
    if ([...el.children].some((k) => !getComputedStyle(k).display.startsWith("inline"))) {
      continue;
    }
    const texte = rendered(el);
    if (!texte) continue;

    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const fontSize = parseFloat(cs.fontSize);
    const lineHeight =
      cs.lineHeight === "normal" ? fontSize * 1.2 : parseFloat(cs.lineHeight);

    canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    canvas.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    const m = canvas.measureText(texte);
    const inkAscent = m.actualBoundingBoxAscent;
    const inkDescent = m.actualBoundingBoxDescent;
    const fbAscent = m.fontBoundingBoxAscent;
    const fbDescent = m.fontBoundingBoxDescent;
    if (!Number.isFinite(inkAscent) || !Number.isFinite(fbAscent)) continue;

    // Place au-dessus et au-dessous de la ligne de base DANS la boîte de ligne :
    // le demi-écart (« half-leading ») s'ajoute aux métriques de la police. Il
    // est NÉGATIF dès que l'interlignage passe sous 1,30em, ce qui est le cas de
    // tous les grands titres de ce site (0,82em) : c'est exactement de là que
    // vient la famille de défauts que cet audit surveille.
    const demiEcart = (lineHeight - (fbAscent + fbDescent)) / 2;
    const spaceAbove = demiEcart + fbAscent;

    const padTop = parseFloat(cs.paddingTop);
    const padBottom = parseFloat(cs.paddingBottom);
    const hautContenu = rect.top + parseFloat(cs.borderTopWidth) + padTop;
    const hauteurContenu =
      rect.height -
      parseFloat(cs.borderTopWidth) -
      parseFloat(cs.borderBottomWidth) -
      padTop -
      padBottom;
    // Nombre de lignes rendues. Le bord haut n'expose que la première ligne, le
    // bord bas que la dernière : sur un paragraphe de six lignes, comparer les
    // deux à la même ligne de base se tromperait de cinq interlignes.
    const lignes = Math.max(1, Math.round(hauteurContenu / lineHeight));
    const baselineHaut = hautContenu + spaceAbove;
    const baselineBas = baselineHaut + (lignes - 1) * lineHeight;

    const bords = [];
    // Bord HAUT : seules les capitales accentuées montent plus haut qu'un « E ».
    if ([...texte].some((c) => accents.includes(c))) {
      bords.push({ bord: "haut", sens: -1, baseline: baselineHaut, encre: inkAscent });
    }
    // Bord BAS : dès qu'il y a de l'encre sous la ligne de base. Un point ou un
    // « É » n'en ont pas et ne sont donc jamais examinés ici.
    if (inkDescent > 0) {
      bords.push({ bord: "bas", sens: 1, baseline: baselineBas, encre: inkDescent });
    }

    for (const b of bords) {
      const coupeur = analyser(el, b.sens, b.baseline, b.encre, fontSize, TAUX, PLANCHER);
      if (!coupeur) continue;
      found.push({
        bord: b.bord,
        sel: describe(el),
        texte: texte.slice(0, 46),
        corps: Math.round(fontSize),
        ligne: Math.round(lineHeight),
        encre: Math.round(b.encre * 10) / 10,
        place: coupeur.place,
        debord: coupeur.debord,
        coupeur: coupeur.sel,
        surLuiMeme: coupeur.propre,
      });
    }
  }

  return found;
}

const browser = await chromium.launch();
const findings = [];

for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    try {
      // `domcontentloaded`, PAS `networkidle`. Le hero porte une boucle vidéo
      // qui ne cesse jamais de solliciter le réseau : `networkidle` expirait
      // donc à 30 s sur les seize routes, et l'audit annonçait tout de même
      // « Aucun accent coupé » — un vert obtenu en n'ayant rien regardé.
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60_000 });
    } catch {
      console.error(`INJOIGNABLE ${route} @${width}`);
      injoignables.push(`${route} @${width}`);
      await page.close();
      continue;
    }
    await page.waitForTimeout(2600);
    // ÉTAT DE REPOS FORCÉ. Sans cette feuille, tout ce qui est sous la ligne de
    // flottaison reste garé dans son état initial d'apparition (translation de
    // 20 ou 40 px, opacité 0,001) pendant toute la mesure : l'audit relevait la
    // géométrie d'un état transitoire que personne ne lit. C'est MOT POUR MOT la
    // règle que `SiteDocument.tsx` sert déjà à `<noscript>`, donc l'état de
    // repos officiel du site, celui dont il garantit qu'il est le bon.
    await page.addStyleTag({
      content: "[data-reveal]{opacity:1!important;transform:none!important}",
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.waitForTimeout(150);
    for (const f of await page.evaluate(collect, [ACCENTS, TAUX_MARGE, PLANCHER_MARGE])) {
      findings.push({ route, width, ...f });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

// UNE ROUTE INJOIGNABLE EST UN ÉCHEC, pas une ligne d'information. Sans cette
// sortie en erreur, un serveur éteint produit exactement le même message qu'un
// site irréprochable.
if (injoignables.length > 0) {
  console.error(
    `\n❌ ${injoignables.length} route(s) injoignable(s) — l'audit n'a rien pu vérifier :`,
  );
  for (const r of injoignables) console.error(`   · ${r}`);
  console.error("\nLe serveur est-il démarré ? (bun run dev)");
  process.exit(1);
}

if (findings.length === 0) {
  console.log(
    `Aucune encre coupée, en haut comme en bas, sur ${ROUTES.length} routes x ${widths.length} largeurs.`,
  );
  process.exit(0);
}

// Un même défaut se répète à plusieurs largeurs : on regroupe pour que le
// rapport se lise comme une liste de corrections.
const groups = new Map();
for (const f of findings) {
  const key = [f.route, f.bord, f.sel, f.texte].join("|");
  if (!groups.has(key)) groups.set(key, { ...f, widths: [] });
  groups.get(key).widths.push(f.width);
}

/**
 * DEUX GRAVITÉS, et une seule fait échouer.
 *
 *   COUPÉ    l'encre dépasse le bord de coupe : il manque un morceau du glyphe
 *            à l'écran. C'est le défaut, celui qui fait lire « A QUI » pour
 *            « À QUI ». Sortie en erreur.
 *   À L'ÉTROIT  le glyphe est entier mais il lui manque la marge visée. Ce qui
 *            reste ici sont des masques de PERMUTATION (deux copies empilées,
 *            la seconde garée hors cadre, pour l'effet de survol). Leur agrandir
 *            la zone visible révélerait la copie garée : le remède serait pire.
 *            Signalé, sans échec.
 */
const coupes = [...groups.values()].filter((g) => g.encre > g.place);
const etroits = [...groups.values()].filter((g) => g.encre <= g.place);

const rendre = (liste, titre, verbe) => {
  if (liste.length === 0) return;
  console.log(`=== ${titre} — ${liste.length} éléments ===\n`);
  for (const g of liste.sort((a, b) => b.debord - a.debord)) {
    const air = Math.round((g.place - g.encre) * 10) / 10;
    console.log(
      `  [${g.bord.toUpperCase().padEnd(4)}] ${g.route.padEnd(24)} ${String(air).padStart(6)}px d'air   « ${g.texte} »`,
    );
    console.log(
      `  ${" ".repeat(24)} corps ${g.corps} · ligne ${g.ligne} · encre ${g.encre} · place ${g.place}`,
    );
    console.log(
      `  ${" ".repeat(24)} ${g.sel}\n  ${" ".repeat(24)} ${verbe} ${g.surLuiMeme ? "LUI-MÊME" : g.coupeur} · largeurs ${g.widths.join(", ")}\n`,
    );
  }
};

rendre(coupes, "GLYPHES COUPÉS", "coupé par");
rendre(etroits, "GLYPHES ENTIERS MAIS À L'ÉTROIT (toléré)", "serré par");

console.log(
  `Total : ${coupes.length} coupé(s), ${etroits.length} à l'étroit, sur ${ROUTES.length} routes x ${widths.length} largeurs.`,
);
if (coupes.length > 0) process.exit(1);
process.exit(0);
