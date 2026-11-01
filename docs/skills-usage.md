# Usage des skills design — passage à une seule offre, 2026-10-31

Demande d'Eliott : le site vend à 100 % le logiciel métier ; hub et pages par métier.
Travail visuel public fait par l'agent principal ; seuls la relève de matière métier,
le relevé Search Console et Semrush et la mise à jour des tests ont été délégués.

Captures, 1440 × 900 et 390 × 844, bandeau cookies fermé, pli et pleine hauteur :

- `docs/captures/2026-10-31/avant/` : treize pages en ligne avant le changement.
- `docs/captures/2026-10-31/apres/` : les mêmes écrans, plus le hub et les trois pages.
- `docs/visuels-metiers/` : les sources SVG.

## impeccable

Références lues : `SKILL.md`, `brand.md`, `critique.md`, début de `layout.md` et de
`polish.md`. Registre : brand. Contexte : `PRODUCT.md` du dossier principal, périmé
(il décrit encore la reconstruction du gabarit) ; `DESIGN.md` annonce un accent
`#ff4500` alors que `globals.css` porte `#c8f24a`, seule valeur retenue.

Écart assumé : la critique demande deux évaluations isolées par sous-agents et une
question à Eliott. Elle a été faite sur le rendu réel par l'agent principal, seul,
pour ne pas multiplier les contextes ; `visiteurs` fait ensuite un jugement extérieur.

| Sous-commande | Constat sur le rendu capturé | Ce qui a changé |
| --- | --- | --- |
| critique | Héros : le numéro « 01 » et la colonne de porte n'ont plus de sens avec une seule offre. | Numéro retiré, titre élargi de 80 à 108 px : la phrase unique prend le poids des deux portes. |
| critique | Page métier : le carré volt du dessin tombait sous le H1. | Sujet des trois SVG déplacé à gauche, au-dessus du chapô : le titre reste net. |
| layout | Bande claire au bas de la section logiciel, héritée de l'ancien ordre : elle pointait vers une section devenue noire. | Bande retirée. |
| layout | Hub : des cartes auraient répété icône, titre, texte. | Liste en lignes, nom du métier en grand, ce que la page couvre à côté, sur la grille à filet central du site. |
| typeset | Veuves dans les titres de blocs (« LE CAMION QUI ROULE POUR / RIEN »). | `text-balance` sur les h2 des blocs. |
| polish | Le pied de page coupait son sous-texte après le fragment en emphase : la phrase discrète n'apparaissait pas. | Le reste de la phrase est rendu. |

## taste-skill

| Règle | Application |
| --- | --- |
| Point focal relié au produit (règle 7) | Chaque page métier a son dessin tiré du métier : façade et travée, sculpture et pain de gomme, réseau et tournée. Un seul élément volt par dessin. |
| Anti-3 colonnes, anti-cartes (règle 4, section 7) | Hub et accueil en lignes séparées par des filets. |
| Hiérarchie par opacité (règle 8) | Nom à 100 %, description à 60 ou 70 %. |
| Anti-centre (règle 3) | Héros de métier asymétrique, dessin à gauche, titre à droite. |

## emil-design-eng

| Point | Application |
| --- | --- |
| Courbe | `cubic-bezier(0.23, 1, 0.32, 1)` sur le survol des lignes, 200 ms ; propriétés nommées, jamais `transition: all`. |
| Réponse à l'appui | `active:translate-y-[1px]` en 150 ms sur chaque ligne. |
| Survol sur tactile | Variante `hover:` de Tailwind 4, déjà limitée aux pointeurs qui survolent. Aucune animation ajoutée au chargement : la liste se revoit à chaque visite. |

## visiteurs (30 visiteurs simulés, `--rapide`, deux passages en ligne)

| Chiffre | Premier passage | Après corrections |
| --- | --- | --- |
| Compris en 5 s | 97 % | 90 % |
| Restent | 87 % | 90 % |
| Trouvent le bouton | 50 % | 60 % |
| Passeraient à l'action, cible | 17 % | 22 % |

Corrigé : métiers nommés au premier écran, lien vers l'offre à côté du bouton,
« il vous appartient » à la place de « sans agence » (lu comme un discours de
concurrent), bandeau cookies raccourci. Écart sur 30 visiteurs : indicatif, pas une mesure.
Faux signaux écartés : contraste du bouton volt (texte sombre sur volt, l'outil lit
mal les deux couches), lien La Fabrique du Net (403 aux robots seulement).

## Reprise du 2026-11-01, demande d'Eliott

| Constat | Ce qui a changé |
| --- | --- |
| « Votre projet n'attend personne » remontée : l'ordre d'origine cassé. | Ordre d'origine rétabli. |
| Liste des métiers au héros : infinie à mesure des publications. | Retirée du héros et de l'accueil ; le hub reste au menu. L'accueil parle à chaque métier sans le citer. |
| Démonstration en étapes : elle disait qui fait quoi, jamais ce qu'on gagne. | Une semaine de bureau : six tâches, barres qui se rétractent au cinquième, total qui baisse, 8 h 48 rendues en aplat volt, 396 heures par an. Hypothèses affichées. Barres en `transform`, 700 ms, courbe d'Emil, décalage de 60 ms, coupées en mouvement réduit. |

---

# Usage des skills design — refonte du 2026-10-15

Demande d'Eliott : positionnement « qualité d'agence, jusqu'à deux fois moins
cher », vouvoiement, héros refait, pied de page revu, audit de toutes les pages.
Le travail visuel public a été fait par l'agent principal ; seuls les textes
(vouvoiement, corrections SEO de la carte de mots-clés) ont été délégués.

Captures, toutes en 1440 × 900 et 390 × 844, bandeau cookies fermé :

- `docs/captures/2026-10-15/avant/` : les 16 pages en ligne avant la refonte,
  pleine hauteur (26 sur 32 : six captures du site en ligne ont expiré).
- `docs/captures/2026-10-15/avant-pli/` : premier écran de l'accueil, de Caen,
  du contact et du site vitrine, en ligne.
- `docs/captures/2026-10-15/apres/` : les 16 pages après, pleine hauteur.
- `docs/captures/2026-10-15/apres-pli/` : premier écran des pages corrigées.

## impeccable

Références lues en entier : `brand.md`, `critique.md`, `audit.md`,
`typeset.md`, `layout.md`, `animate.md`, `polish.md`, `bolder.md`.
Registre : brand (site vitrine d'un indépendant). `PRODUCT.md` réécrit : il
décrivait encore la reconstruction du gabarit Framer d'origine.

| Sous-commande | Constat sur le rendu capturé | Ce qui a changé |
| --- | --- | --- |
| critique | Héros : six éléments avant l'action (logotype géant qui redit l'en-tête, prénom, titre, paraphe, mots de métier, cadre à coins avec verre flouté). Le h1 n'avait pas le premier rang de lecture. Glassmorphism décoratif (interdit absolu). | Héros reconstruit autour du h1 : les deux portes. Verre, cadre, paraphe, logotype et mots de métier retirés. |
| audit | Détecteur (`impeccable detect`) sur `src/components` et `src/app` : 10 relevés. 9 « overused-font » (Geist) et 1 « broken-image » dans un commentaire (faux positif). | Geist gardé : c'est l'identité installée du site, la règle d'impeccable laisse l'identité existante primer. Corrigés à côté : titre 404 coupé à 1440, tréma de « WÜRTH » qui faisait lire « DE.COMPTE », « Votre projet » qui débordait sa colonne à 92 px après le passage au vous, avertissement React du bandeau défilant (`animation` mêlée à `animationPlayState`), identifiants dupliqués de la réservation quand deux instances cohabitent. |
| typeset | Hiérarchie plate dans l'ancien héros (titre 48 px sous un logotype de 113 px). | Portes en `clamp(46px, 5.6vw, 80px)` au-dessus de 810, amorce de chaque porte à 60 % et chute à 100 % (hiérarchie par opacité), positionnement 22 px, corps 17 px plafonné à 46ch. |
| layout | Centre de gravité au milieu d'un cadre qui centrait tout. | Composition asymétrique : texte sur la moitié gauche, mécanisme horloger visible à droite, filet central de la grille du site gardé, preuves en pied de héros sur un filet. |
| bolder | Le seul aplat fort du héros était le logotype volt. | Le volt passe sur l'action (bouton, flèche de la porte survolée, pastille du positionnement) ; les deux portes portent le poids typographique. |
| animate | Entrée au ressort JS, pilotée par le fil principal pendant l'hydratation. | Une entrée orchestrée en CSS : filets tracés de gauche à droite, chaque ligne monte de son masque (980 ms, ease-out-expo, 90 ms entre lignes), preuves en dernier. Fondu seul en mouvement réduit. |
| polish | États d'interaction incomplets sur les portes ; pied de page qui coupait sa ligne de crédits ; « Cookies » en minuscules au milieu de liens en capitales. | Survol, focus clavier et appui sur les portes et les onglets ; ligne du bas réduite au copyright ; « Cookies » en capitales. |

## taste-skill

| Règle | Application |
| --- | --- |
| Anti-centre (variance 8) | Héros aligné à gauche, asymétrique, plus de cadre centré. |
| Hiérarchie par opacité (règle 8) | Amorce des portes à 60 %, chute à 100 %, texte d'appui à 60 %. |
| Point focal relié au produit (règle 7) | Les deux portes sont les deux offres ; le mécanisme horloger du fond (« l'outil qui tourne derrière ») reste le seul visuel. |
| Interactivité isolée | Animations en CSS ; la bascule du pied de page est un composant client isolé (`FooterContact`). |
| Pas de chiffre décoratif | Les deux preuves sont réelles : −92 % mesuré chez Würth France, 50 % calculé depuis la médiane sourcée, lien vers la source. |
| `min-h-[100dvh]` | Héros en `100dvh` (et 720 px minimum dès 810). |

## emil-design-eng

| Avant | Après | Pourquoi |
| --- | --- | --- |
| Entrée au ressort JS (motion) | Keyframes CSS hors fil principal | L'entrée reste fluide pendant l'hydratation |
| Pas d'état `:active` sur le bouton | `scale(0.97)` à l'appui | Le bouton répond au doigt |
| Survol actif sur écran tactile | Survol limité à `(hover: hover) and (pointer: fine)` | Pas de faux survol au toucher |
| Deux fonds d'onglet qui s'échangent | Une pastille déplacée en `transform`, 280 ms, `cubic-bezier(0.23, 1, 0.32, 1)` | Une seule forme qui glisse, interruptible |
| Panneau qui apparaît sec | Fondu et 14 px de montée, 360 ms | Le changement d'onglet se lit |
| Mouvement continu absent ou partout | Un seul : la pastille volt du positionnement respire (2,8 s) | Une vie discrète, pas de fatigue |

## Liste « Par besoin » du hub (2026-11-01)

Aucune forme neuve : la liste reprend `ListeMetiers`, et son titre celui de « Votre métier n'est pas dans la liste ? ». Un hub long se lit d'un mot à l'autre (`impeccable`, couper plutôt que décorer). Captures : `docs/captures/2026-11-01b`.

## Trois moyens sur l'accueil (2026-11-01)

`impeccable` : des lignes plutôt que trois cartes (grilles identiques bannies), des étapes numérotées parce qu'elles se suivent. `emil-design-eng` : le remède de chaque tâche apparaît en fondu de 300 ms avec le gain, aucune bascule de mise en page. `taste-skill` : le hub passe en plan compact, sa taille ne dépend plus du nombre de pages. Captures : `docs/captures/2026-11-01c`.

## Une tâche de A à Z dans la démonstration (2026-11-01)

Quatre pistes maquettées et capturées avant le code. `emil-design-eng` : la validation reste un vrai bouton avec retour à l'appui, et le parcours finit seul pour qui regarde sans toucher. `impeccable` : les heures rendues ne passent en volt qu'une fois la tâche finie, un seul point focal à la fois. `taste-skill` : le hub ne garde que le plan par besoin.

## Ce qui n'a pas été changé, et pourquoi

- La police Geist et la palette volt sur noir : identité installée du site.
- Les héros photo des pages intérieures (sujet détouré en volt) : cohérents
  entre eux et lisibles, rien à corriger au rendu.
- Les logos d'employeurs sans intitulé dans le héros : décision d'Eliott du
  2026-09-02.

# Reprise de l'accueil et grands écrans — 2026-10-16

Demande d'Eliott : comparaison de prix à livrable égal, −92 % Würth hors du
héros, vraie section « à propos », plus d'accordéon qui redit le héros, une
section noire qui montre le logiciel, fil d'Ariane qui ne double plus le menu,
rendu correct jusqu'en 4K. Travail visuel fait par l'agent principal, sur la
direction fixée le 2026-10-15 (Geist, volt sur noir, grille à filet central) :
les règles de la passe précédente ont été reprises, aucun skill rechargé.

Captures avant et après, 390 × 844, 1024 × 768, 1440 × 900, 1920, 2240 et
3840 de large, pleine page pour les grands écrans.

| Règle reprise | Constat sur le rendu | Ce qui a changé |
| --- | --- | --- |
| impeccable · critique (une preuve, lisible en premier) | « 50 % du prix d'un site de PME en agence, médiane 6 000 € » se lisait plancher contre moyenne | Sujet nommé d'abord (« un site vitrine soigné, design et ergonomie compris »), puis « en agence 5 000 à 8 000 € » à 60 %, « avec moi dès 3 000 € » seul en volt |
| impeccable · layout | Moitié gauche de l'à-propos vide sur 200 px, colonne droite vide à côté du portrait | Grille d'infos (métier, lieu) en tête, compteur « 4 entreprises » au pied du portrait |
| impeccable · layout | L'accordéon répétait les deux portes du héros et leur chapô | Accordéon retiré de l'accueil ; une section par offre (vitrine : « On vous compare… » + réalisations ; logiciel : section noire) |
| taste · point focal relié au produit | La section noire portait une citation sans rien montrer | Fenêtre d'outil : la même commande traitée à la main (5 étapes pour vous) puis par l'outil (1 étape), bascule seule une fois visible |
| emil · une forme qui glisse | Onglets de la démo | Pastille déplacée en `transform` 280 ms `cubic-bezier(0.23, 1, 0.32, 1)`, étapes en fondu décalé 70 ms, rien en mouvement réduit |
| impeccable · polish | Fil d'Ariane en capitales et barres obliques sous le menu en capitales et barres obliques | En pied de page, casse normale, chevrons, sur le fond clair de la FAQ |
| impeccable · responsive | En 4K, héros à 22 px dans 3840, cartes projet de 2000 px de haut, logo et menu à 1 200 px du texte | `zoom` par paliers de 160 à 320 px au-delà de 2048 (rendu 1920 net en 4K), unités d'écran compensées, en-tête calé sur la colonne de 1440 |
