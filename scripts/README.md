# Framer static-port scripts

Outillage de dev (jamais execute au runtime) pour porter les pages du site
Framer archive (`../site/le-site-d-origine/*.html`) dans l'app Next.js, a
l'identique de la home. Necessite la devDependency `node-html-parser`.

## Vue d'ensemble

| Fichier | Role |
|---|---|
| `lib/framer-rewrite.mjs` | Rewrites partages : strip `<script>`, `https://framerusercontent.com` -> `/framerusercontent.com`, `https://fonts.gstatic.com` -> `/fonts.gstatic.com`, strip des query strings d'assets. Serialisation `export const html = "..."`. |
| `lib/css-split.mjs` | Tokenizer CSS + split par hash racine de page (rules scopees `.framer-<rootHash>` = page ; le reste = global). Recurse dans `@media/@supports`. Lossless. |
| `extract-framer-page.mjs` | Extracteur principal : une page HTML -> fragments HTML par section + CSS specifique + `_meta.json`. |
| `split-framer-css.mjs` | Bootstrap one-shot : decoupe `framer.css` (home) en `framer-global.css` + `framer-home.css`. Deja execute. |

## Typographie et orthographe francaises

Ce site reproduit un template ANGLAIS. Trois classes de defauts en decoulent, et
aucune ne produit d'erreur : les types restent verts, la page s'affiche.

| Fichier | Role |
| --- | --- |
| `lib/typo-fr.mjs` | Les regles (apostrophe typographique, insecables devant `: ; ! ?`, guillemets `« »`, `%`, `€`, milliers, points de suspension). Source unique, partagee par le script et le test. |
| `typo-fr.mjs` | Verifie `src/content/**` (litteraux TypeScript via le parseur TS, prose MDX). `--fix` applique les corrections. |
| `accent-clip-audit.mjs` | Accents de capitales ROGNES par les masques d'apparition. La faute se voit a l'ecran (« A QUI » pour « À QUI ») et nulle part ailleurs. |
| `word-break-audit.mjs` | Mots coupes en deux par `break-words`. |

```sh
bun run scripts/typo-fr.mjs           # verifie
bun run scripts/typo-fr.mjs --fix     # corrige
bun run scripts/accent-clip-audit.mjs # exige le serveur de dev
```

Le premier est double par `src/content/typographie.test.mjs`, qui echoue a la
premiere phrase mal ponctuee ajoutee au contenu : personne ne lance un script
avant d'ecrire une phrase, tout le monde lance `bun test`.

L'orthographe, elle, n'est pas couverte par ces outils. Elle a ete verifiee le
2026-08-27 contre le dictionnaire francais de macOS (`NSSpellChecker`) sur le
texte rendu des seize routes : zero faute, les seuls signalements etant des noms
propres (Kpsull, NSLysium, Aether) et des mots absents du dictionnaire mais
corrects (precontractuelles, retirable, indexable).

## Modele d'architecture (rappel)

- **CSS content-addressed** : chaque hash (`framer-XXXXX`) porte les memes regles
  partout, sans collision. Les sections d'une page sont scopees sous le hash
  racine de la page (`.framer-pK5Ni` pour la home, `.framer-WEpYk` pour about...),
  tandis que le chrome (header `EGNs3`, footer `Rrp39`...) est scope sous son
  propre hash, identique sur les 18 pages.
- Donc : **CSS de page = regles referencant `.framer-<rootHash>`** ; **global =
  tout le reste** (fonts, reset, tokens, presets, breakpoint, chrome, override POC).
- Le chrome est monte une seule fois via `<FramerShell>` (voir
  `src/components/framer/FramerShell.tsx`) ; chaque page ne fournit que ses sections
  + son `rootClassName`/`mainClassName`.

## Porter une nouvelle page (ex : `about`)

```bash
cd web
node scripts/extract-framer-page.mjs \
  --in ../site/le-site-d-origine/about.html \
  --page about
# ou --dry pour juste voir le plan de decoupage
```

Produit :

- `src/content/framer-html/about/section-01.ts … section-NN.ts`
  (un fragment par section = enfant direct de `<main>` ; les variantes
  responsive `ssr-variant` consecutives d'un meme composant sont regroupees).
  Chaque fichier exporte `export const html = "..."` (rewrites deja appliques,
  commentaires `<!--$-->` preserves).
- `src/content/framer-html/about/_meta.json` : `rootHash`, `rootClass`,
  `mainClass`, `componentHashes`, et la liste des sections (index, hash de
  composant, `data-framer-name`, nb de variantes) pour mapper les fragments.
- `src/app/framer-about.css` : CSS specifique a la page (regles `.framer-WEpYk`).

### Cablage manuel (ce que le script ne fait pas)

1. Creer les composants de section (sur le modele de
   `src/components/framer/HeroSection.tsx` : `dangerouslySetInnerHTML` +
   `display:contents`), un par `section-NN.ts` — ou les regrouper/renommer selon
   `_meta.json`.
2. Creer `src/app/about/page.tsx` :
   ```tsx
   import { FramerShell } from "@/components/framer/FramerShell";
   import "../framer-about.css"; // apres framer-global.css (importe au layout)
   // ...imports des sections
   export default function About() {
     return (
       <FramerShell rootClassName={/* _meta.json rootClass */} mainClassName={/* _meta.json mainClass */}>
         {/* <Section01/> ... */}
       </FramerShell>
     );
   }
   ```
3. Verifier le rendu contre la source (`site/…` ouverte en local) aux 3 breakpoints.

## Pieges connus (voir aussi la note de livraison)

- **Nav "page courante"** : header/footer embarquent un marqueur Framer
  `data-framer-page-link-current` fige sur la home. Sur les autres pages, l'etat
  actif de la nav sera faux tant qu'il n'est pas ajuste par page.
- **Reveal des animations d'apparition** : l'override global ne revele que
  `[style*="opacity:0.001"]`. Certaines pages (ex : hero d'about) demarrent a
  `opacity:0` — il faudra etendre l'override (ou neutraliser ces styles inline)
  au portage de ces pages.
- **Composants standalone nouveaux** : un composant Framer scope sous son propre
  hash (pas sous le hash racine) part dans le CSS *global* seulement s'il etait
  deja present a la home. Un composant inedit d'une nouvelle page apparaitra dans
  le `framer-<page>.css` uniquement s'il est scope sous le hash racine ; sinon
  ajouter ses regles a `framer-global.css`. `_meta.json.componentHashes` aide a
  reperer ces cas.

## Grain — inventaire compare source / clone

```bash
bun run scripts/grain-audit.mjs            # 8 routes x 3 largeurs
bun run scripts/grain-audit.mjs 1440       # une largeur
bun run scripts/grain-audit.mjs 1440 /contact
bun run scripts/grain-audit.mjs --json     # ecrit grain-report.json (gitignore)
```

Detecte les calques de grain **par structure** (image de fond repetee, motif
< 512px, calque au moins 2x plus grand que son parent, opacite < 1), jamais par
nom de fichier ni par classe, et compare les deux cotes : calques manquants, en
trop, et ecarts d'opacite / z-index / mix-blend-mode / taille de motif / taille
d'hote. Sort en code 1 des qu'un ecart subsiste.

Ni `audit-live` (qui ne releve que les conteneurs de TEXTE) ni `motion-sweep`
(qui exclut par construction ce qui bouge page immobile) ne voient le grain :
sans ce script, un calque pouvait manquer sur quatre pages ou etre pose deux
fois sans qu'aucune mesure ne s'en apercoive.

## Seuil de declenchement des apparitions

```bash
bun run scripts/reveal-threshold.mjs                       # source, 8 routes
bun run scripts/reveal-threshold.mjs --target=local
bun run scripts/reveal-threshold.mjs --route=/about --levels=960,930,905,895,870
```

Encadre des DEUX cotes le `vpTop` auquel une apparition part : on SAUTE a une
position, on ATTEND 1,7 s, puis on regarde. Le protocole precedent, en
defilement continu, repliait le DELAI de l'animation dans le seuil et le
sous-estimait systematiquement (d'ou un ancien `-100px` errone).

Deux precautions sans lesquelles la mesure ment :
- les ordonnees viennent de la chaine `offsetTop`, jamais de
  `getBoundingClientRect` : l'etat masque porte justement un transform
  (`translateY(60)`, `scale(1.1)`), et la boite transformee decale la mesure de
  plusieurs dizaines de pixels, dans un sens qui depend du type d'element ;
- un bloc echelonne (lignes d'un titre) est rapporte a son CONTENEUR, seul
  porteur du declencheur.

Signale tout element hors de `--expect` +/- `--tol` (900 +/- 30 par defaut) et
sort en code 1. Un niveau de controle tres a l'interieur de la fenetre distingue
les elements INERTES (calques de survol, etats alternatifs) des vrais ecarts.

## Cout des animations pendant le defilement

```bash
bun run scripts/motion-perf.mjs                 # / et /about
bun run scripts/motion-perf.mjs /work /contact
```

Releve, par le protocole Chrome DevTools : images par seconde sur un parcours
complet a la MOLETTE (le seul mode qui traverse le lisseur de defilement),
temps de script / de style / de mise en page, nombre d'`IntersectionObserver` et
de `ResizeObserver` construits avec leurs jeux d'options, elements portant
encore un `will-change` a la fin, fuites au demontage (cibles encore observees
alors qu'elles sont DETACHEES du document) et tenue de
`prefers-reduced-motion` avec le mouvement normal pour temoin.
