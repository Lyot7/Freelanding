# État actuel du projet

**Dernière mise à jour** : 2026-08-27 (offre calculée à trois lignes, pages de prestation, section Tarifs refaite)

## L'offre : un seul curseur, `TJM` dans `src/content/offre.ts`

**Aucun prix n'est écrit à la main sur ce site.** Tous les montants valent
`TJM × jours du pack`. Changer la constante `TJM` reprice l'accordéon de la page
d'accueil, les quatre pages de prestation, la réponse prix de la FAQ, `/llms.txt`
et le JSON-LD, en une ligne.

**Valeur actuelle : 500 €**, le tarif de lancement, appliqué parce qu'aucune
mission n'a encore été livrée. Deux paliers écrits :

| Déclencheur | Nouveau `TJM` |
|---|---|
| Première mission signée | 600 |
| Trois missions livrées avec témoignage écrit | 720 |

**Le taux ne s'affiche nulle part**, et un test le vérifie (`offre.test.mjs`,
« le taux journalier n'est écrit nulle part en clair »). Il reste déductible par
division dès qu'un prix et une durée se touchent : c'est assumé, ce qui est
interdit est de le revendiquer.

**Durées.** Plancher à **cinq** jours ouvrés, et chaque pack ajoute au moins un
quart de jours au précédent. Les deux règles sont testées.

Le plancher est passé de dix à cinq jours après le rapport de marché : à dix
jours, l'entrée de gamme du site vitrine tombait à 5 000 €, au-dessus de la
médiane agence (3 500 € sur 380 budgets réels) et du budget médian d'une TPE
(4 000 €). La marche est exprimée **en proportion** et non en jours absolus :
« au moins cinq jours de plus » imposait de doubler quand le premier pack en fait
cinq. Ce qui compte est qu'un pack se VOIE dans le livrable, sinon c'est une
remise déguisée.

**Trois lignes, plus quatre.** L'Infrastructure a été absorbée par le troisième
périmètre du Logiciel (« L'Écosystème ») : ce n'était pas une autre prestation,
c'était son palier supérieur.

| Ligne | Périmètre 1 | Périmètre 2 | Périmètre 3 |
|---|---|---|---|
| Site vitrine | 5 j · 2 500 € | 8 j · 4 000 € | 12 j · 6 000 € |
| L'Outil | 8 j · 4 000 € | 12 j · 6 000 € | 18 j · 9 000 € |
| Le Logiciel | 20 j · 10 000 € | 40 j · 20 000 € | 60 j · 30 000 € |

**Calage marché, relevé du 2026-08-27.** La grille tient 2 500 € par semaine
livrée, ce qui est exactement le point de convergence des studios français
productisés (2 000 à 3 000 €/semaine). Le vitrine et L'Outil sont confirmés par
le relevé. Le Logiciel a été recalé le même jour : ses périmètres étaient à 20,
30 et 40 jours alors que les durées publiées par les agences pour le même
livrable sont de 2-8 semaines, 6-12 semaines et 2-6 mois. Sous-estimer la durée
d'un forfait, c'est s'engager sur une date intenable.

## Le suivi mensuel : une règle et un plancher

`15 % du prix du projet par an, minimum 90 € par mois.` Les deux constantes
vivent dans `offre.ts` (`TAUX_SUIVI`, `PLANCHER_SUIVI`) et la FAQ en dérive.

Le site annonçait « à partir de 50 € », soit 0,6 % par an sur un logiciel à
10 000 €, contre 15 à 20 % relevés sur le marché français par six sources
indépendantes. Le pourcentage seul ne suffisait pas : 15 % du plus petit site
vitrine font 31 € par mois, parce que le coût fixe d'un suivi ne descend pas avec
la taille du projet. Le plancher mord jusqu'à 7 200 € de projet.

| Projet | Suivi mensuel |
|---|---|
| 2 500 à 6 000 € | 90 € (plancher) |
| 9 000 € | 113 € |
| 10 000 € | 125 € |
| 20 000 € | 250 € |
| 30 000 € | 375 € |

**Clause d'infrastructure**, entrée 07 de la FAQ. Un forfait de suivi engage un
prix sur une charge qui peut bouger : trafic, volume de données, tarifs de
l'hébergeur. Sans clause, la hausse arrive après coup, ce qui est pire que pas de
clause. Celle-ci est bornée par quatre éléments, et un test vérifie qu'ils y sont
tous : un déclencheur nommé, l'annonce AVANT, un montant et une date, et le droit
de refuser. L'hébergement étant au nom du client sur toutes les prestations, la
réponse distingue explicitement sa facture d'hébergement (qui monte chez lui) du
suivi (qui monte parce qu'il y a plus à surveiller). Sans cette distinction, elle
laisserait croire à une refacturation d'un coût qu'Eliott ne supporte pas.

**Il ne s'affiche jamais à côté des prix de prestation.** Le vault écrit que
l'abonnement de suivi « ne se communique jamais, il se propose après une
prestation livrée ». Il reste dans la FAQ.

## Il n'y a plus de section Tarifs : les prix sont dans l'accordéon

Trois tentatives, deux échecs, et la place qui marche.

1. **La matrice comparative** (`pricing`, supprimée) alignait trois paliers d'un
   même produit sur dix lignes de coches. Le site vitrine n'y avait pas sa place,
   donc le visiteur venu pour un site tombait sur un tableau où son cas
   n'existait pas. Et une coche ne dit jamais POURQUOI un périmètre coûte plus
   cher. Couplée à sa ligne « Délai de livraison », elle publiait en prime le
   taux journalier par division.
2. **Une section « Tarifs » pleine largeur** (supprimée le jour même). Contenu
   juste, forme fausse : toutes les sections sombres du site sont bâties sur DEUX
   MOITIÉS que sépare un filet vertical, celle-là s'étalait d'un bord à l'autre
   et se lisait comme une pièce rapportée.
3. **Les périmètres dans le panneau de l'accordéon**, ce qui tourne aujourd'hui.
   Ils apparaissent quand le visiteur ouvre la prestation qui le concerne,
   c'est-à-dire au moment où il demande le détail. Il n'a plus à relier de tête un
   tableau situé deux écrans plus bas, et la grille en deux colonnes de la section
   n'est pas touchée. Libellés dans `src/content/tarifs.ts`.

**L'EXPLICATION vit sur `/services/<slug>`**, une page par prestation, où chaque
périmètre porte sa promesse, son cas d'usage et ce qu'il ajoute au précédent,
plus une section sur ce qui fait bouger un devis. Les routes sont DÉRIVÉES de
`offre.ts` : publier une prestation suffit à publier sa page et à l'annoncer au
sitemap.

**Le Diagnostic** est la première entrée de l'accordéon, sans prix. Il est
compris dans la prestation qui suit, et le mot « gratuit » est volontairement
absent : il attire ceux qui repartent avec la note, alors que « compris » range
le diagnostic du côté de l'achat.

## Développement : le serveur tourne sur webpack, pas sur Turbopack

**`bun run dev` lance `next dev --webpack`.** Ce n'est pas un choix de goût, et
ça n'a pas à être « rétabli au propre » sans mesure.

**LE DÉFAUT.** Avec Turbopack, le moteur par défaut de Next 16, le serveur de
développement de ce projet part en boucle et n'en sort plus. Cinq pages chargées
à la suite suffisent. Ensuite, sans une seule requête, sans un seul fichier
modifié, il occupe sept à huit cœurs en permanence. Rien ne le signale : le site
répond normalement, aucune erreur n'apparaît, seule la machine chauffe — et tout
ce qui tourne à côté ralentit.

**MESURÉ le 2026-08-27**, même machine, même minute, même protocole (démarrage à
froid, cinq pages chargées une par une, puis repos complet) :

| | Turbopack (défaut) | webpack (`--webpack`) |
|---|---|---|
| processeur au repos après 5 pages | **5 min 35 s de CPU en 40 s** (819 %) | 0,89 s en 45 s (0 %) |
| processeur au repos, 60 s de plus | — | **0,06 s** (0,2 %) |
| compilation d'une page à froid | 0,1 à 0,4 s | 0,1 à 0,8 s |
| recompilation après modification | — | 0,18 s |

Le diagnostic vient d'un `sample(1)` du processus : onze `tokio-runtime-worker`
à l'intérieur de `next-swc.darwin-arm64.node`, avec `cthread_yield` et
`swtch_pri` en tête de profil. C'est de la contention entre threads, pas du
travail utile. Le journal du serveur a par ailleurs répété, lors d'un épisode
antérieur, « Compaction failed: Another write batch or compaction is already
active » en boucle.

**CE QUE ÇA COÛTE.** Webpack compile un peu moins vite à froid (0,8 s contre
0,4 s sur la page la plus lourde). C'est tout, à l'usage relevé ici.

**À REVOIR** quand Next corrigera la boucle. Le test tient en trois minutes :
retirer `--webpack` de `package.json`, démarrer, charger cinq pages, laisser au
repos quarante secondes, et comparer le temps processeur consommé
(`ps -o time= -p <pid>`). Si la mesure du repos reste sous la seconde, Turbopack
peut revenir.

**GARDE-FOU ASSOCIÉ.** `bun run build` refuse de démarrer tant qu'un serveur de
développement tourne sur ce dossier (`scripts/assert-no-dev.mjs`) : les deux
écrivent le même cache dans `.next` et s'y disputent le verrou. Pour passer
outre en connaissance de cause : `AUTORISER_BUILD_AVEC_DEV=1 bun run build`.

Et une règle d'usage, pas un garde-fou : **un build n'est pas une vérification de
routine.** `bun run dev` rend déjà toutes les pages. La construction se réserve
aux jalons, avant une mise en ligne.

## Ce qui est prouvé

Cinq contrôles automatisés, tous verts sauf mention :

| contrôle | commande | état |
|---|---|---|
| géométrie au repos | `bun run scripts/audit-live.mjs <largeur>` | hauteur de page entre -9 et +7 sur 9 routes x 4 largeurs |
| bascules à 1px | `bun run scripts/breakpoint-bracket.mjs` | 8 routes sur 8 conformes |
| hauteur de fenêtre | `bun run scripts/viewport-height.mjs` | aucune dépendance qui diffère de la source |
| animations | `bun run scripts/motion-sweep.mjs` | 0 élément de la source sans contrepartie |
| grain | `bun run scripts/grain-audit.mjs` | 23 combinaisons sur 24 |
| seuil de révélation | `bun run scripts/reveal-threshold.mjs` | 0 élément hors tolérance sur 39 |
| interactions | `bun run scripts/interaction-audit.mjs` | voir limite ci-dessous |

## Bugs connus

- `/contact` à 390 : hôte du calque de grain 116x142 sur la source contre
  116x160 chez nous (héros de contact). Seule combinaison en écart sur 24.
- `/about` à 810 et 1199 : +11px, dont le poids est dans `ServicesSection`.
- `/work/box-mode` : -8/-9px à partir de 810, préexistant, non diagnostiqué.

## Pièges de mesure connus

- `still.mjs` mène les TRANSITIONS au-delà de leur fin (`currentTime = 1000`)
  pour donner un état de survol stabilisé. Ne pas l'employer pour relever la
  CHRONOLOGIE d'une transition : il faut alors débrancher `window.__stillObs`,
  comme le fait le relevé rAF des permutations.
- L'opacité d'une copie de permutation est composée : lue à chaque image par
  `getComputedStyle`, elle peut retarder de 0 à 55 ms sur le glissement, de
  façon non reproductible d'une passe à l'autre. Trois passes consécutives ont
  ainsi laissé croire à un retard de fondu authentique sur le motif à 22 px ;
  six autres passes, dont trois sur d'autres boutons du même motif, montrent le
  fondu couplé au glissement. Le glissement, lui, ne bouge jamais : c'est sur
  lui qu'il faut ajuster.

## Écarts d'ANIMATION connus

- Nos entrées `appear` partent désormais à la PREMIÈRE PEINTURE comme celles de
  la source (script inline `@/components/motion/appearAnimations`, reprise par
  framer-motion sur `data-framer-appear-id`). Reste un écart de phase de −35 ms
  sur la home à 1440, repère = première peinture de chaque côté : notre document
  est plus léger, son analyse finit plus tôt. Deux images, sous la tolérance.
- Ligne services du hero sous 810 px : la source y change la loi
  (`opacity 0.001 → 1`, `y: 8 → 0`, retards 1,0 / 1,05 / 1,1, séparateurs
  retirés du DOM) quand nous rejouons partout `y: 20 → 0` à opacité pleine avec
  les retards 0,9 → 1,1. Positions d'arrivée justes des deux côtés, seule la
  course diffère. Corriger demande de choisir la variante AU RENDU SERVEUR,
  comme la source le fait avec ses blocs `ssr-variant`.

## Dette technique

- **Images encore hors de l'optimiseur, et pourquoi.** Trois cas subsistent, tous
  bloqués par autre chose que la volonté :
  - `motion/ParallaxBackdrop.tsx` sert ses visuels en `background-image` CSS.
    C'est le plus gros poste restant : **716 KB sur `/blog/[slug]`** (deux
    couvertures d'articles liés, 419 et 297 KB) et 480 KB sur `/`. La recette
    existe et est documentée (`getImageProps` puis `image-set()`,
    `.../02-components/image.md`, § « Background CSS »).
  - `sections/TestimonialsSection.tsx:159`. Piège : le `<img>` et le
    `ParallaxBackdrop` frère chargent le MÊME fichier (`mORiocPN….jpg`,
    127 KB). Convertir le seul `<img>` ajouterait une requête optimisée SANS
    retirer la brute, donc un poids NET en plus. Les deux doivent basculer
    ensemble.
  - `sections/HeroSection.tsx:142` (`dvRbwMey….jpg`, 26 KB sur `/`).
  - Cas volontairement laissé : les deux icônes sociales du pied de page sont des
    SVG. L'optimiseur les refuse tant que `dangerouslyAllowSVG` est éteint, et
    l'allumer autoriserait l'exécution de scripts embarqués dans une image servie
    sous notre origine. 1 KB chacune : rien à gagner, une surface à ouvrir.
    L'avertissement de lint reste en place, avec sa raison écrite sur place.
- **Préchargement restant : `Header.tsx`.** Après le passage de `FloatingNav` et
  du pied de page en préchargement à l'intention, il reste **122 KB / 19 requêtes
  au repos sur toutes les routes**, et elles viennent de la navigation du header.
  Le même `ui/HoverPrefetchLink` s'y applique tel quel.
- **`ParallaxCover` et `ParallaxBackdrop` restent deux copies du même composant**
  (43 lignes identiques dès la ligne 1). L'encadrement de seuil périmé
  (881/894, protocole de défilement continu abandonné) a été retiré de
  `ParallaxCover` et remplacé par un renvoi vers `motion/mediaReveal.ts`, seule
  source de la loi. La fusion des deux fichiers reste à faire, et elle vaut
  désormais double : elle réglerait aussi le passage de `ParallaxBackdrop` par
  l'optimiseur.
- **Dépendances `@payloadcms/next` et `graphql` : à CONSERVER**, contrairement à
  la recommandation de `docs/AUDIT-STRUCTURE.md`. Vérifié : `graphql` est une
  `peerDependency` de `payload`, qui est utilisé ; `@payloadcms/next` est une
  dépendance de `@payloadcms/richtext-lexical`, qu'importe `src/payload.config.ts`.
  Zéro import direct ne veut pas dire inutilisé, et son entrée dans
  `next.config.ts` (`serverExternalPackages`) est justifiée par ce chargement
  transitif côté serveur.
- **`priority` est DÉPRÉCIÉ dans cette version** (`image.md`, historique v16.0.0,
  remplacé par `preload`). La recommandation « `priority` sur l'image LCP » de
  l'audit est à réécrire avant d'être appliquée.
- `interaction-audit.mjs` apparie par TEXTE : un élément sans texte (image,
  carte, icône) lui est invisible, et deux éléments sans texte s'apparient quels
  qu'ils soient. C'est par cette faille que l'absence d'apparition sur les
  images d'`/about` est passée inaperçue. La sonde par POSITION écrite par un
  agent (`.artifacts/chrome-interaction/hover-geo.mjs`) corrige cela et mérite
  d'être promue dans `scripts/`.
- `not-found.tsx` porte encore un grain statique en `inset-0` : la 404 n'est pas
  dans les 8 routes auditées.
- Payload CMS : adapter livré et vert, mais l'admin n'est pas montée (elle exige
  un route group `(payload)` avec son propre `RootLayout`, donc un déplacement
  des routes du site dans un group `(site)`). SQLite en dev seulement,
  `push: true` non utilisable en production.

## À COMPLÉTER avant la mise en ligne

Le site est passé en français à la première personne, et il est devenu celui
d'Eliott. Le template d'origine portait des preuves sociales fabriquées et des
coordonnées d'une société britannique : elles ont été retirées, PAS remplacées
par d'autres valeurs inventées. Ce qui reste à renseigner est donc volontairement
visible.

### Données personnelles et coordonnées

| Où | Quoi | État |
|---|---|---|
| `src/content/site.ts` | `contact.email` | `contact@eliottbouquerel.fr` — ARRÊTÉ le 2026-08-28, la boîte doit exister avant mise en ligne |
| `src/content/site.ts` | `contact.phone` | vide, aucun numéro publié tant que la décision n'est pas prise |
| `src/content/site.ts` | `socials` | seul GitHub est vérifié ; LinkedIn à ajouter quand l'URL exacte est connue |
| `src/content/site.ts` | `availability` | 2 créneaux sur 5 en août : donnée commerciale, à ajuster ou à retirer |
| `src/content/home.ts` | `hero.person.avatar` | champ retiré, il portait la photo d'un inconnu ; remettre avec une vraie photo |
| `src/content/site.ts` | `credits.createdByAvatar` | idem |
| `src/content/testimonials.ts` | `avatar` des citations d'Eliott | idem, les deux citations du manifeste s'affichent sans portrait |

### Chiffres choisis, à valider

Les compteurs exigent une valeur numérique. Les chiffres du template
(60+ projets, 89 % de recommandation, 4,9/5 sur Google et Clutch, 24+ projets,
12+ secteurs) ont été remplacés par des engagements au présent, pas par un
palmarès. Ils restent des promesses qu'Eliott doit assumer publiquement :

- home, section « comment je travaille » : 3 jalons de validation, 2,5 s de
  chargement visé sur mobile, 48 h de délai de réponse ;
- home, section « pourquoi moi » : 95+ de score de performance visé, 100 % du
  projet réalisé sans sous-traitance ;
- page « à propos » : 1 interlocuteur, 2 h de réponse, 0 frais caché, 100 % de
  code sur mesure ;
- la promesse « réponse sous deux heures ouvrées » apparaît à TROIS endroits
  (`site.ts`, page contact, compteur « à propos ») : la changer implique les
  trois.

### Prix

Grille retenue, à confirmer : stratégie 900 €, design 1 200 €, développement
1 800 €, suivi 90 €/mois, SEO 600 €. Les trois formules valent 2 400 €, 3 600 €
et 4 900 €, facturées **au projet** et non plus au mois (le template facturait
4 800 $/mois une prestation de projet, ce qui était faux).

### Documents légaux

Les trois documents (`mentions-legales`, `privacy-policy`, `terms-of-service`)
ont été RÉÉCRITS pour une micro-entreprise française, pas traduits : les
originaux étaient rédigés en droit américain et n'avaient aucune valeur ici.

**Ce sont une base de travail, pas des textes validés par un juriste.**

Douze valeurs distinctes restent à compléter, toutes marquées `[À COMPLÉTER : …]`
dans `src/content/legal.ts` : numéro SIRET, adresse de l'éditeur, coordonnées de
l'hébergeur, médiateur de la consommation, sous-traitants réels, transferts hors
UE, cookies réellement déposés, validité du devis, acompte, délai de paiement,
juridiction compétente. Un test (`src/content/legal.test.mjs`) vérifie qu'aucune
suite de neuf chiffres ou plus n'apparaît dans ces documents : c'est le garde-fou
contre un SIRET inventé.

### Contenus de démonstration hérités du template

- **`src/content/work.ts`** : les cinq études de cas sont fictives, avec des
  résultats chiffrés inventés (+127 % de conversion, -41 % de rebond, 14 jours de
  délai, client « Stackline inc. », lien vers le site du template). Un bandeau
  d'avertissement en tête de fichier les liste. **À remplacer avant toute mise en
  ligne** : c'est le fichier le plus risqué du site.
- **`src/content/blog.ts`** : articles de démonstration. La section est éteinte.
- **`src/content/testimonials.ts`** : deux témoignages clients fictifs conservés
  pour que la section reste réactivable. Elle est éteinte. Leurs deux portraits
  ont été retirés le 2026-08-26 : c'étaient des photos d'inconnus servies par le
  template sous des noms inventés.
- **Bande de logos de la home** : marques abstraites du template, sans nom ni
  revendication de client. Elle ne ment sur rien, mais elle n'apporte rien non
  plus tant qu'il n'y a pas de vrais logos.

### Jauge de créneaux — mois calculé (2026-08-27)

Le libellé était écrit en dur (« CRÉNEAUX EN AOÛT »). Il porte désormais la
marque `{mois}`, substituée au rendu par `@/lib/availability-month`, avec
**bascule sur le mois suivant à partir du 20** : un créneau annoncé le 27 août ne
se prend plus en août.

Le point délicat est le PRÉRENDU. Les pages sont statiques : un `new Date()`
évalué côté serveur donne la date du BUILD, pas celle de la visite. Un mois
calculé uniquement au serveur serait donc figé au déploiement — le défaut qu'on
corrige, avec un détour en plus. Calculé uniquement au client, il manquerait du
HTML servi et se compléterait après hydratation, au milieu d'une phrase.

La forme retenue : le serveur calcule le mois au build et le passe en `initial`,
le premier rendu client rend la même chose (donc aucun écart d'hydratation
— vérifié), et un effet le recalcule après montage, toutes les heures et au
retour d'onglet. Dans le cas normal les deux coïncident et rien ne bouge ;
quand le build a vieilli, la correction se voit une fois.

Le mois est lu dans le fuseau d'ELIOTT (`siteConfig.contact.timezone`), pas celui
du visiteur — même choix que `LocalClock`. Sept tests couvrent la bascule du 20,
le passage décembre → janvier, les douze mois et la limite de fuseau.

### Serveur de dev à 900 % de processeur — cause et parade (2026-08-27)

**Symptôme.** `next dev` de ce projet tournait à 850-950 % de processeur et 5 à
9 Go de mémoire, **sans aucun client connecté et sans trafic**, avec une mémoire
qui montait sans redescendre. Il mourait tout seul toutes les quelques minutes,
emportant les navigateurs Playwright avec lui (la machine n'avait plus que
100 Mo de libre et entrait en pagination).

**Ce que ce n'était pas**, vérifié : les trois autres `next-server` de la machine
tournaient au même moment à 0,1 % et 2 à 11 Mo — ce n'était donc pas
l'environnement. Aucun fichier du dépôt n'était modifié pendant les mesures :
pas de tempête du surveillant de fichiers. Déplacer `.artifacts` (405 Mo,
1855 fichiers) hors du dossier surveillé n'a rien changé. Fermer tous les
clients non plus.

**La cause.** Le profil du processus (`sample`) montre le thread principal à
100 % dans `v8::internal::Heap::CollectGarbage`, déclenché en boucle depuis un
`ThreadSafeFunction` / `napi_call_function` : le binding NATIF de Turbopack
inondait le JS de rappels. Le cache persistant de Turbopack dans `.next` avait
atteint 545 Mo et était devenu pathologique.

**La parade.** Supprimer `.next` et redémarrer : **0,0 % de processeur et une
mémoire stable**, tenu après compilation de huit routes.

**Comment on y arrive, et la règle qui en découle.** `next dev` (Turbopack) et
`next build` écrivent dans le MÊME `.next`. Lancer un build pendant qu'un serveur
de dev tourne laisse le cache persistant du second dans un état incohérent — et
c'est exactement ce qui a été fait plusieurs fois dans la journée, chaque build
étant suivi de la mort du serveur de dev. [Probable, non prouvé
expérimentalement.] La règle : **arrêter `next dev` avant `bun run build`**, et
si le serveur se met à chauffer, `trash .next` puis redémarrer.

### Passe de fidélité — 2026-08-27

Cinq relevés Playwright contre `/live-proxy` (le site Framer live, servi
same-origin), aux largeurs 390 / 810 / 1200 / 1440 / 1920, un par périmètre :
`/`, `/about`, `/contact`, `/work` + page projet, `/blog` + article + légal.

Deux défauts BLOQUANTS trouvés et corrigés :

- **Vignettes de carte projet à média vidéo** — le `<video>` était dans le flux,
  son `min-height: auto` d'élément flex remontait la hauteur intrinsèque du MP4
  (1152 × 748, soit 1,54011) et écrasait le `aspect-[1.73678]` du cadre. Le
  chemin image y échappait parce que `next/image fill` sort du flux. Corrigé en
  passant la vidéo en `absolute inset-0`.
- **Titre du service ouvert éjecté au fond de son panneau** (`/` et `/about`,
  dès 810) — `tablet:self-stretch` sur un en-tête en `items-end`. Corrigé :
  en-tête mesuré à 690 × 39, identique à la source.

Le reste des corrections est consigné dans les commentaires des composants
touchés, chacun avec les deux valeurs mesurées. **Reste ouvert** :

- l'ancrage du bloc héros de `/blog` (`mb-[170px]` / `tablet:mb-[113px]`) : la
  source tient un écart CONSTANT au haut de la rangée de puces (99 / 70 / 80
  selon la largeur), nous ancrons au bas de la section (140 / 83 / 83) ;
- la rangée de filtres de `/work` : grille de 12 colonnes à gouttière 4 là où la
  source fait un 50/50 sec, d'où 2 px d'écart sur les demi-largeurs ;
- l'étendue du filet central de `WorkNarrative` : la source pose un bloc de
  4899 px fixes, nous prenons toute la section (314 px de trop en haut et 348 en
  bas à 1440) ;
- l'icône de loupe de `/work` (masque 16 × 16 sur la source, SVG tracé 14 × 14
  chez nous) et le `min-w-[170px]` inventé du bloc nom/rôle de `/contact`.

Non couvert par cette passe, sur les cinq périmètres : la **chronologie des
animations**, et la couleur exacte de la bordure des champs de la source, que
Framer n'expose sur aucun ancêtre.

### Visuels — chantier soldé le 2026-08-26

Plus AUCUN asset du template n'est servi au visiteur, sur aucune route :
`scripts/template-assets-audit.mjs` le vérifie en mesurant ce que le navigateur
charge réellement, page défilée de bout en bout. Le dossier
`public/framerusercontent.com` (58 Mo, ~735 fichiers du template servis sous
notre origine) a été supprimé ; l'archive de référence hors ligne reste dans
`../site/`, que les scripts `mirror:framer` et `verify:framer-mirror` utilisaient
déjà. La provenance et la licence de chaque fichier encore servi sont tenues
dans **`docs/ASSETS.md`** : toute image ajoutée à `public/` s'y déclare.

### Décisions ouvertes

- Le `®` de « Bouquerel® » : marque non déposée, donc revendication inexacte.
- Les URL des documents légaux mélangent français et anglais
  (`/legal/mentions-legales` face à `/legal/politique-de-confidentialite`). Rien n'est en
  ligne : les aligner ne coûte rien aujourd'hui, et le modèle de contenu gère
  déjà les `aliases` pour ne casser aucun lien.
- `NEXT_PUBLIC_SITE_URL` doit être renseignée en production. Sans elle, les URL
  canoniques, le sitemap et le robots.txt retombent sur `http://localhost:3000`
  (voir `src/lib/site-url.ts`). L'ancienne valeur de secours pointait vers le
  site Framer d'origine.

## Divergences VOLONTAIRES avec la source

- **Focus clavier** : la source n'en a aucun. Nous ajoutons un double anneau, un
  lien d'évitement et un piège de focus dans le panneau du menu. Demandé
  explicitement, c'est la seule divergence assumée du projet.
- **Sommaire d'article** (`TableOfContents`, colonne gauche des pages
  `/blog/[slug]`) : la source n'en a aucun. Le composant justifie le choix sur
  place, mais il ne figurait pas dans cette liste — d'où des passes de fidélité
  qui le remontaient comme un écart. Ajouté le 2026-08-26.
- **Type des champs** : notre champ e-mail est `type="email"`, la source est en
  `type="text"`. Nous validons donc ce qu'elle ne valide pas.
