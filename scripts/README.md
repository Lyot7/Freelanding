# Outillage de developpement

Scripts jamais executes au runtime : audits lances contre le serveur de dev, et
fabricants d'assets. Aucun n'est necessaire pour construire ou servir le site.

## Le portage depuis Framer est termine

Ce site a d'abord ete un portage fidele d'un template Framer, puis d'un site
SvelteKit. Les cinq extracteurs de cette epoque (`extract-framer-page.mjs`,
`split-framer-css.mjs`, `css-source.mjs`, `extract-fonts.mjs`,
`template-assets-audit.mjs`) et leurs deux librairies ont ete **supprimes le
2026-09-21** : leur entree commune, le miroir hors ligne `../site/`, n'existe
plus, et les sorties qu'ils fabriquaient (`src/content/framer-html/`,
`src/app/framer*.css`, `public/framerusercontent.com/`) non plus. Ils restent
lisibles dans l'historique git.

Les commentaires `Source : markup content/framer-html/<page>.ts` que portent
encore les composants de section designent cette archive disparue : ils disent
d'ou vient le dessin d'un bloc, pas un fichier a ouvrir.

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
`prefers-reduced-motion` avec le mouvement normal pour temoin.\n