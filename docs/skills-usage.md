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
