# Usage des skills design : visuels des articles du blog

Trace tenue à part de `docs/skills-usage.md` (refonte du site, autre chantier
en cours le 2026-10-15) pour ne pas se marcher dessus. Un article par section.

## Le cadre, commun à tous les articles

Demande d'Eliott (2026-10-15) : une image conçue pour chaque article, « avec les
lignes vertes », qui colle au design du site, et un aperçu au cockpit.

- Le rédacteur écrit un SVG `viewBox="0 0 2400 1350"` ; le cockpit le refuse
  hors palette (fond `#0b0b0b`, blancs et gris, volt `#c8f24a`), avec texte,
  style, script ou image étrangère ; `scripts/visuel-article.mjs` le rend en
  héros, vignette (recadrée au centre) et partage.
- Zones relevées sur le site à 1440 × 900 : le titre occupe la moitié droite
  entre 46 et 66 % de la hauteur, l'extrait la bande 32-50 % sous 70 %, un voile
  assombrit la droite et le bas. La carte de l'index ne garde que la bande
  centrale 22-78 % en largeur. Le sujet du visuel vit donc à gauche et au
  centre, entre 15 et 60 % de la hauteur, et peut déborder à gauche et en haut.
- Aperçu de réglage : page qui reprend les voiles et les cotes du site
  (héros 1425 × 810, carte 688 × 688, partage), les mêmes que l'aperçu du
  cockpit (`src/components/apercu-article-site.tsx` du cockpit).

## maintenance-site-internet-prix (2026-10-15)

Captures dans `docs/captures/visuels-blog/maintenance-site-internet-prix/`
(`v1.jpg` à `v6.jpg`, héros, carte et partage côte à côte ; `visuel.svg` retenu).

Idée : le spiral d'une montre, l'organe qu'on révise. Une spire par année ;
l'année 2026 en volt, jalonnée de douze mois (le forfait mensuel) ; une aiguille
qui part du centre et mène l'œil au titre ; les années à venir en pointillé.

### impeccable

Références lues en entier : `brand.md`, `layout.md`, `bolder.md`,
`colorize.md`, `polish.md`, `delight.md`. Registre : brand.

| Sous-commande | Constat sur le rendu capturé | Ce qui a changé |
| --- | --- | --- |
| critique (v1) | Cercles gris à 22 % : une cible de radar, rien ne ressort au plissement d'yeux. Le mois allumé tombait sous le voile du haut. | Abandon du cadran comme porteur du sens. |
| colorize (v2) | Stratégie restreinte du site : le volt seul, sous 10 %. Il était dispersé (arc, graduations, bout de spire). | Le volt porte une seule chose : la spire de 2026. |
| layout (v3) | Spirale centrée dans sa moitié, sage ; elle passait sous l'extrait. | Centre décalé (700, 660), rayon 880 : la spirale déborde en haut et à gauche, le bas droit reste calme pour le titre. |
| bolder (v4) | Aiguille verticale, point à midi : statique, lecture « épingle ». Spires trop serrées, lues comme des cercles. | 6 spires au lieu de 15 (on lit enfin une spirale), aiguille en diagonale qui pointe le titre, douze jalons sur l'année. |
| polish (v5) | Jalons croisés sur la spire : des « + » de viseur. Lignes tremblées à 0 décimale. | Jalons tournés vers l'extérieur seulement, coordonnées à 1 décimale, SVG à 19 Ko. |
| delight (v6) | Les années futures étaient hors cadre. | Une spire à venir en pointillé autour de 2026 : passé plein, futur pointillé. |

### taste-skill

| Règle | Application |
| --- | --- |
| Point focal relié au sujet (règle 7) | Le spiral est l'organe qu'on entretient ; la spire 2026 et ses douze mois disent « prix par mois, cette année ». |
| Anti-centre (variance 8) | Sujet à gauche qui déborde ; le titre à droite reste sur fond calme. |
| Un seul accent, saturation tenue (règle 2) | Volt seul, sur une spire et une aiguille. |
| Hiérarchie par opacité (règle 8) | Volt 100 %, centre à 55 %, spires passées 30 %, futures en pointillé. |

### emil-design-eng

| Avant | Après | Pourquoi |
| --- | --- | --- |
| Jalons en croix sur la spire | Jalons vers l'extérieur, bout arrondi | Une graduation, pas un viseur |
| Coordonnées arrondies à l'entier | 1 décimale | Courbes nettes une fois réduites en vignette |
| Point final de 11 px | 14 px, aiguille 2,4 px | Le point reste lisible à 552 px de large (partage) |
| Virole creuse | Virole pleine du fond, filet à 55 % | L'aiguille part d'un axe, pas d'un trou |
