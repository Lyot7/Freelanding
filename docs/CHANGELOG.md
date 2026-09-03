# Changelog

## [2026-08-02] L'aperçu suit la frappe, sans enregistrer

**Type** : Feature
**Fichiers** : `payload/fields.ts`, `payload/collections.ts`, `payload/globals.ts`,
`payload/seed.ts`, `payload/gateway.ts`, `payload/draft.ts`,
`payload/live-preview.ts`, `(site)/api/preview/route.ts`

Enregistrement automatique toutes les 800 ms. Mesuré : l'aperçu affiche le
nouveau libellé **~2 secondes après la frappe, sans un clic**.

**Ce que ça impose, et ce n'est pas un détail.** L'enregistrement automatique
sans brouillon mettrait en ligne chaque frappe intermédiaire — « CRÉNEAUX EN
AOÛ » servi aux visiteurs pendant une seconde. Les brouillons sont donc activés,
et une étape de publication apparaît : le cadre d'aperçu lit le BROUILLON, le
site public sert la dernière version PUBLIÉE. Vérifié dans les deux sens sur la
même page au même instant : aperçu « SEPTEMBRE », visiteur anonyme « AOÛT ».

La bascule passe par le mode brouillon de Next, activé par `/api/preview`. Cette
route exige une session d'admin authentifiée — un brouillon n'est pas public, et
un anonyme y reçoit un 401. Pas de secret dans l'URL : un jeton qui traîne dans
un historique ou un journal de serveur finit par fuiter, et l'admin sait déjà
qui est connecté. Seuls les chemins internes sont acceptés, sans quoi la route
serait un redirecteur ouvert portant le nom de domaine d'Eliott.

**Le piège que ça pose au seed** : un document créé sans `_status` explicite
reste un BROUILLON. Le seed aurait rempli la base pendant que le site public
n'affichait rien, sans la moindre erreur. `seed.ts` publie désormais
explicitement.

**Vérifié après coup, parce que c'était le risque réel** : les pages restent
prérendues. `bun run build` produit les mêmes routes statiques qu'avant — le
mode brouillon les contourne au runtime par cookie, il ne les rend pas
dynamiques.

---

## [2026-08-02] Aperçu en direct, et l'emphase devient un choix

**Type** : Feature
**Fichiers** : `payload.config.ts`, `payload/live-preview.ts`,
`components/preview/LivePreviewBridge.tsx`, `(site)/SiteDocument.tsx`,
`payload/fields.ts`, `ui/AvailabilityMeter.tsx`, `content/site.ts`

**Aperçu en direct.** L'admin affiche le site dans un cadre à côté du
formulaire, avec un sélecteur de largeur (Mobile 390, Tablette 810, Ordinateur
1440, Grand écran 1920, plus une largeur libre au pixel et un zoom). Chaque
contenu pointe vers la page qui le montre : la page « À propos » vers `/about`,
un projet vers sa page, un service ou une question de FAQ vers l'accueil où ils
sont rendus. À l'enregistrement, le cadre se rafraîchit tout seul.

Deux pièges rencontrés, tous deux corrigés :

- l'aperçu montre ce que le SITE sert, pas ce que l'admin contient. Sous
  `CONTENT_SOURCE=file`, on peut éditer, enregistrer, rafraîchir : le cadre ne
  bouge jamais, sans la moindre erreur. Un bandeau le dit désormais dans le
  cadre. `.env.local` est passé à `payload`.
- `serverURL` n'est connu qu'après le montage ; monté avec une chaîne vide, le
  pont échouait sur « Invalid target origin '' » et l'aperçu s'ouvrait sur une
  erreur d'exécution plein cadre.

**L'emphase du libellé de créneaux était devinée.** Le rendu coupait au DERNIER
ESPACE pour mettre le mois en blanc : « CRÉNEAUX EN AOÛT » marchait par
coïncidence, « CRÉNEAUX AOÛT 2026 » aurait mis « 2026 » en blanc. Le choix passe
dans la donnée (`labelHighlights`), avec le mécanisme d'emphase déjà utilisé
partout ailleurs. Le nombre de créneaux gagne ses bornes (0 et 1 minimum).

**Un fragment d'emphase mal recopié ne dit rien.** Une apostrophe droite au lieu
d'une courbe, une majuscule, une espace en trop : le surlignage ne s'applique
pas, le contenu s'enregistre quand même, et rien ne le signale. C'est le défaut
le plus facile à introduire depuis l'admin et le plus difficile à voir. Les neuf
champs d'emphase vérifient maintenant, à la saisie, que chaque fragment existe
dans le texte qu'il vise, et refusent l'enregistrement sinon.

**Vérifié dans l'admin, pas seulement en théorie** : `slotsLeft` passé de 1 à 2,
enregistré, l'aperçu affiche « 2/3 » sans intervention, puis remis à 1. Les
cinq tailles apparaissent bien dans le sélecteur. Parité toujours à 0.

---

## [2026-08-02] Tout le texte du site est éditable depuis l'admin

**Type** : Feature + Bugfix
**Fichiers** : `payload/fields.ts`, `payload/globals.ts`, `payload/map.ts`,
`payload/seed.ts`, `payload/verify-parity.ts`, `src/migrations/`,
`pages/work/WorkNarrative.tsx`, `layout/Footer.tsx`, `content/ui.ts`,
`scripts/hardcoded-text-audit.mjs`

Demande d'Eliott : pouvoir éditer TOUS les textes depuis Payload. Deux fuites
possibles, deux mesures.

**1. Du texte écrit en dur dans les composants** — invisible dans l'admin, et
rien ne le signale : le rendu est correct, les types sont verts. Nouvel audit
`scripts/hardcoded-text-audit.mjs`. Cinq libellés trouvés. Les quatre de la
fiche projet (`Périmètre`, `Livré en`, `Client`, `Année`) sont le cas le plus
sournois : les clés existaient déjà dans `ui.ts`, dans les types, dans Payload
ET dans le map — mais aucun composant ne les lisait. Eliott pouvait les éditer
dans l'admin sans que rien ne change à l'écran. L'audit passe maintenant à zéro.

**2. Du contenu que Payload ne restituait pas.** `verify-parity` comparait 15
méthodes du port sur 17 : `getUiLabels` et `getNotFound` manquaient, c'est-à-dire
précisément les deux qui portent l'essentiel des libellés d'interface (en-tête,
menu, pied de page, dates, formulaires, 404). Ajoutées. Ce qu'elles ont révélé,
plus trois défauts trouvés au passage :

- `shortLabel` (libellé court des liens, ajouté lors de l'audit de débordement)
  n'existait nulle part dans le schéma Payload : les abréviations du pied de
  page n'étaient pas éditables ;
- **collision de colonnes** : le groupe `createdBy` et le champ texte
  `createdByLabel` produisent tous deux `credits_created_by_label`. Les deux
  s'écrasaient, et le pied de page affichait « Par » comme nom d'auteur. Le
  champ Payload est renommé `createdByPrefix` ; le nom du domaine ne bouge pas ;
- **trois champs `required` que le contenu réel ne pouvait pas satisfaire** : le
  téléphone (volontairement vide), le suffixe du logotype (vide depuis que la
  marque porte le nom seul) et le texte alternatif des images. Ce dernier est le
  plus important : un `alt` VIDE est la règle d'accessibilité pour une image
  purement décorative, pas un oubli. Le champ requis rendait ce contenu correct
  impossible à enregistrer, et le seed échouait dessus.

**Migrations réinitialisées.** L'ancienne paire était injouable (base construite
par `push`, schéma divergent, instantané orphelin) et la différence régénérée
plantait — sur SQLite, drizzle recrée la table en copiant des colonnes qui
n'existent pas encore. Remplacée par une migration initiale unique. Sans risque
ici, et seulement ici : aucune donnée n'était saisie à la main. Voir
`docs/PAYLOAD.md`.

**Vérification** : `verify-parity` = **0 divergence** sur les 17 méthodes ;
`bun run build` complet avec `CONTENT_SOURCE=payload` (toutes les routes
prérendues depuis la base) ; et une édition réelle écrite dans Payload puis
relue par le port, avant restauration.

---

## [2026-08-02] Signature manuscrite d'Eliott, en volt

**Type** : Feature
**Fichiers** : `sections/hero/Signature.tsx`, `pages/about/AboutPage.tsx`,
`app/globals.css`, `content/features.ts`

La signature du template épelait le nom de la marque d'origine ; elle était donc
éteinte par drapeau. Remplacée par celle d'Eliott, récupérée depuis Aperçu (les
signatures ne sont plus sur le disque : macOS les a migrées vers le trousseau
iCloud) puis vectorisée. Un flou avant le seuil divise le poids par dix : 2,5 ko
pour un tracé unique, contre 27 sans.

**Trait.** Le tracé vectorisé est un contour rempli : sa graisse suit la taille
du cadre, qui passe de 452 px sur desktop à 165 en mobile — le trait y tombait
sous le pixel. `non-scaling-stroke` fige la largeur du contour en pixels écran :
1,4 px s'ajoutent identiquement aux deux tailles.

**Position.** La signature d'Eliott est plus plate que celle du template (3,86
contre 3,4) : elle s'étale davantage et le calage hérité ne tenait plus. Sur la
home mobile elle traversait « DÉVELOPPEMENT », sur `/contact` mobile
« Développeur freelance », et sur `/about` à 810 elle coupait quatre libellés de
la grille de chiffres. Repositionnée aux trois endroits ; `/about` reçoit un
variant qui l'ancre DANS la photo, support naturel pour une signature.

**Couleur.** Nouveau jeton `--mark`, posé par les mêmes classes de surface que
la sélection : volt sur fond sombre, encre sombre sur fond clair. Sans lui, la
signature héritait du gris clair de `/about` et devenait un fantôme à 1,06:1.
Piège inverse sur la photo : elle ne déclare aucun fond, donc son contenu
héritait de la section claire — d'où `surface-dark` posé explicitement dessus.
Les deux classes de sélection sont renommées `surface-light` / `surface-dark`,
puisqu'elles gouvernent désormais deux choses.

**Réserve, redite ici parce qu'elle engage Eliott** : publier une signature
manuscrite la rend copiable en haute définition par n'importe qui.

---

## [2026-08-02] Le surlignage disparaissait sur la moitié des surfaces

**Type** : Bugfix
**Fichiers** : `app/globals.css`, `layout/Footer.tsx`, `layout/FloatingNav.tsx`,
`sections/FaqSection.tsx`, `pages/work/WorkNarrative.tsx`,
`scripts/selection-contrast-audit.mjs`

Signalé par Eliott sur les sections en aplat volt. La couleur de sélection était
posée UNE fois, globalement, alors que le fond change de section en section. Le
site alterne trois surfaces — le noir `--background`, le gris clair `--muted`
et l'aplat volt `--accent` — et un surlignage volt unique donne, mesuré :

    volt sur --background : 15,24:1  → franc
    volt sur --muted      :  1,06:1  → indiscernable en clarté
    volt sur --accent     :  1,00:1  → strictement invisible

Sur le volt, seule la couleur du texte changeait : l'utilisateur ne voyait plus
du tout ce qu'il avait sélectionné. Sur le gris clair, seule la teinte
distinguait encore le surlignage, ce qui tombe à néant pour un daltonien.

**Le correctif.** La sélection passe en NÉGATIF sur toute surface claire : encre
sombre en fond, volt en texte. Même paire de couleurs, retournée (14,43:1 sur le
volt, 15,56:1 sur le gris). La bascule se fait par deux variables
(`--selection-bg`, `--selection-ink`) redéfinies sur les utilitaires de FOND
eux-mêmes : les propriétés personnalisées héritent jusqu'au pseudo-élément, donc
la sélection suit automatiquement le fond déclaré le plus proche, y compris pour
un bloc sombre imbriqué dans une section claire, et une future section n'a rien
à annoter.

**Ce que la mesure a trouvé en plus.** Quatre familles de surfaces échappaient à
cette mécanique parce qu'elles redéclaraient leur fond au lieu d'employer le
jeton : le pied de page entier en `bg-[#e9e9e9]` (38 éléments), le bouton
flottant en `bg-[#0b0b0b]`, le lien « Poser une question » en style EN LIGNE, et
les blocs blancs en `bg-foreground`. Les deux premières valeurs étaient
strictement identiques à leur jeton et ont été remplacées ; le style en ligne,
qu'aucune classe ne peut accrocher, reçoit la classe explicite
`.selection-dark`.

`bg-black` est volontairement absent des listes : le site ne l'emploie qu'en
VOILE (`bg-black/[0.03]`, `bg-black/20`), donc par-dessus une surface qui reste
claire. L'y inscrire retournerait la sélection à contresens.

**Trouvé au passage.** Les deux pastilles de retour de `/work/[slug]` portaient
une flèche blanche sur fond accent, soit 1,29:1 — invisible. Héritée de l'orange
du template, où le blanc passait encore. Passées à `--accent-ink`.

**Vérification** : `scripts/selection-contrast-audit.mjs`, nouveau. Il lit le
style calculé de `::selection`, empile les fonds semi-transparents jusqu'au
premier fond opaque, et mesure la visibilité du surlignage (seuil 3:1, WCAG
1.4.11 — un surlignage EST un élément graphique) et la lisibilité du texte
(4,5:1, WCAG 1.4.3). Il nomme l'élément qui PORTE le fond, sans quoi le rapport
dirait qu'un surlignage est illisible sans dire où poser le correctif. 47
éléments en défaut sur l'accueil avant, zéro sur les 9 routes après.

---

## [2026-07-31] Le libellé du bouton d'en-tête n'était plus centré

**Type** : Bugfix
**Fichier** : `layout/Header.tsx`

**Régression introduite la veille.** Pour donner de l'air à l'accent de
« DÉMARRER », la hauteur du masque du libellé était passée de 14,4 à 18 px. Or
le bouton centre ce masque verticalement : l'agrandir a remonté le libellé de
1,8 px. Signalé à l'œil par Eliott, confirmé à la mesure.

**Ce qui était faux dans le raisonnement.** La note écrite alors affirmait que
`.accent-room` ne pouvait pas servir ici, parce que son remplissage révélerait la
seconde copie de la permutation. C'est inexact : la marge négative compense le
remplissage, donc la BOÎTE DE MARGE reste à 14,4 px, et c'est elle que le
centrage flex utilise. Le libellé ne bouge pas d'un pixel. Quant à la copie
garée, elle est en absolu à `top: 22px` depuis la boîte de remplissage : elle
reste hors cadre tant que le remplissage est sous 7,6 px, et il vaut 5,12.

**Deuxième piège.** Poser le remplissage en gardant `h-[14.4px]` ne marche pas :
avec `box-sizing: border-box`, le remplissage rentre DANS les 14,4 px, la boîte
de contenu tombe à 9,3 et le bas du libellé est coupé. La hauteur vient donc du
contenu, qui vaut précisément ces 14,4 px.

**Centrage optique, en plus.** Centrer la boîte de ligne ne centre pas le texte :
la boîte réserve la place des jambages, que des capitales n'utilisent pas.
Mesuré, le centre d'encre des capitales tombait 1,26 px au-dessus du centre du
bouton, et 2,37 px avec l'accent. Le décalage existait DÉJÀ sur la source, mais
l'accent le rendait visible. Un `translate-y` de 1,3 px ramène le centre d'encre
des capitales à 45,04 pour un centre de bouton à 45. `translate` et non `margin` :
la correction est visuelle, elle ne doit pas déplacer la boîte.

Accents coupés : de 9 relevés à 1, à 0,7 px, soit la pointe d'un accent à 12 px.

## [2026-07-31] Les accents des capitales n'étaient pas rendus : les masques les coupaient

**Type** : Bugfix
**Nouveau** : `scripts/accent-clip-audit.mjs`
**Modifiés** : `app/globals.css` (utilitaire `.accent-room`), `motion/LineReveal.tsx`,
`layout/Header.tsx`, `layout/Footer.tsx`, `pages/legal/LegalPageView.tsx`,
`sections/AboutSection.tsx`, `WhyUsSection.tsx`, `ShowreelSection.tsx`,
`PricingSection.tsx`, `ArticlesSection.tsx`, `HeroSection.tsx`,
`pages/blog/BlogArticlePage.tsx`, `pages/work/WorkNarrative.tsx`

**Le défaut.** Le grand titre de l'accueil affichait « STRATEGIE », le bouton
d'en-tête « DEMARRER UN PROJET », la ligne du hero « DEVELOPPEMENT ». Ni la
donnée ni la police n'étaient en cause : le DOM contient bien « Stratégie », la
police contient bien le glyphe, `text-transform: uppercase` fait bien son
travail.

Mesuré au canvas dans Geist : à 92 px de corps, l'encre d'un « É » monte à
83,7 px au-dessus de la ligne de base quand celle d'un « E » s'arrête à 65,3.
Or ce site reproduit un template ANGLAIS, dont les titres emploient des
interlignages jusqu'à 0,82em sous un `overflow-hidden` qui sert de masque aux
animations de révélation. La boîte de ligne est donc plus courte que la hauteur
d'une capitale accentuée : l'accent dépasse par le haut, le masque le coupe.

Rien ne le signale. Ni erreur, ni avertissement, ni test rouge. Le mot reste
correct partout sauf à l'écran. C'est l'exemple type de ce que seule une mesure
peut voir : j'avais moi-même écarté deux fois le « DEVELOPPEMENT » du hero en
mettant la faute sur la résolution des captures.

**La détection.** `scripts/accent-clip-audit.mjs` parcourt 8 routes x 3 largeurs.
Pour chaque texte portant une capitale accentuée après `text-transform`, il
compare la montée d'encre réelle (canvas, avec la police, la graisse et la taille
effectives) à la place géométrique disponible entre le bord de coupe du masque et
la ligne de base de la première ligne. Mesure géométrique et non arithmétique :
c'est ce qui lui permet de reconnaître un endroit déjà corrigé.

**La correction.** Un utilitaire `.accent-room` : un remplissage haut qui agrandit
la zone visible du masque, et une marge négative de même valeur qui annule son
effet sur la mise en page. Aucune hauteur ne bouge. Posé dans `LineReveal`, il
couvre d'un coup tous les masques de ligne du site.

Deux pièges rencontrés :
- `em` se résout sur la police de l'élément QUI COUPE, pas sur celle du texte
  coupé. Un conteneur resté à 16 px autour d'un titre de 63 ne gagnait que 5 px.
  La compensation est donc surchargeable en pixels (`[--accent-room:26px]`).
- Un masque de PERMUTATION (deux copies empilées, la seconde garée hors cadre)
  ne peut pas recevoir ce remplissage : il révélerait la copie garée. Le bouton
  d'en-tête se règle en hauteur de masque, sous les 22 px de garage.

De 28 éléments coupés à 9, tous à 0,7 px, soit la pointe d'un accent à 12 px de
corps. Vérifié à l'écran en triple densité : les accents sont rendus.

**Reste.** Sous un interlignage de 0,82, un accent de capitale frôle la ligne du
dessus. C'est une conséquence de l'interlignage serré du template, pensé pour
l'anglais, pas un défaut de rendu. À trancher si la proximité gêne.

## [2026-07-31] Le « B » d'Eliott remplace la marque du template, et le volt reprend sa vraie valeur

**Type** : Feature
**Nouveaux** : `src/app/icon.svg`, `src/app/apple-icon.png`, `public/logo-b.svg`
**Modifiés** : `layout/Logo.tsx`, `app/globals.css`, `src/app/favicon.ico`

**La marque.** Les trois chevrons du template cèdent la place au « B épique »
d'Eliott, repris tel quel de son système d'identité
(`landing/public/_logos/final-B/logo-B.svg`) : hampe inclinée, coupe diagonale
en tête, bulbes pleins. Un seul tracé, en `currentColor`.

Le fichier d'origine laisse 18 % de marge de chaque côté (encre mesurée à
660,6 x 642 dans un cadre de 1024) : rendue à 26 px, la marque n'en aurait fait
que 17 et aurait paru chétive à côté du mot. Le cadre est donc calé sur les
bornes réelles du tracé.

La marque est CARRÉE là où les chevrons faisaient 54 x 26 : le bloc logo perd
28 px, ce qui desserre l'en-tête sous 390 px. Combiné à la forme courte du
bouton, le bord droit de l'en-tête revient à 300 px pour une fenêtre de 320,
exactement comme la source anglaise.

**Le volt reprend sa vraie valeur.** Le jeton avait été posé à `#d2ff37`, la
couleur lue dans la pastille de crédit du pied de page du template : c'était
celle de quelqu'un d'autre. Le système d'identité d'Eliott donne `#c8f24a`.
Contrastes WCAG recalculés sur cette valeur : 15,24:1 avec le noir du site,
1,29:1 avec le blanc. La conclusion ne change pas, les chiffres si.

**Couleur du logo.** Volt, conformément au système (« Couleur du logo = Volt »,
usage primaire « volt sur sombre »). Repasser à `text-current` suffit à le
remettre en blanc.

**Icônes.** `icon.svg` (B volt sur encre, coins arrondis) et `apple-icon.png`
sont générés depuis le tracé. Le `favicon.ico` du template est remplacé. Les
PNG `B-*.png` du dossier d'identité n'ont pas été réutilisés : ils datent d'avant
le choix de couleur et sont dans l'ancien sable.

**Reste du motif d'origine.** `Footer.tsx` porte encore `CardChevrons`, le même
motif à trois chevrons que l'ancien logo, en décor de la carte du pied de page.
Assez abstrait pour ne pas se lire comme une marque, mais c'est bien le motif du
template. À trancher.

## [2026-07-31] Ce que le français fait déborder, et une sélection de texte en volt

**Type** : Bugfix
**Nouveaux** : `components/ui/AvailabilityMeter.tsx`, `scripts/overflow-audit.mjs`
**Modifiés** : `content/site.ts`, `app/globals.css`, `layout/Header.tsx`,
`layout/Footer.tsx`, `sections/HeroSection.tsx`, `sections/FaqSection.tsx`,
`pages/contact/ContactPage.tsx`, `app/(site)/NotFoundView.tsx`,
`lib/content/types.ts`

**Jauge de créneaux.** Trois barres au lieu de cinq, compteur « 1/3 » au lieu de
« 2 restants », et c'est la DEUXIÈME barre qui pulse : la lecture devient
« un créneau pris, un en cours, un libre ». La jauge était écrite en dur dans le
hero (six barres) pendant que la page contact en rendait cinq depuis la donnée :
la même jauge affichait donc deux états différents sur le même site. Source
unique désormais, `AvailabilityMeter`.

Effet de bord mesuré : la jauge perd 72 px, ce qui règle le débordement de la
barre du hero en mobile (à 320 px, la jauge et l'horloge demandaient 335 px pour
280 disponibles).

**Audit de débordement.** `scripts/overflow-audit.mjs` cherche trois familles de
défauts sur 9 routes et jusqu'à 12 largeurs : contenu tronqué par sa propre
boîte, sortie de fenêtre, chevauchement entre frères. Le premier jet remontait
746 relevés dont presque aucun n'était actionnable : ce site emploie beaucoup de
débordements VOLONTAIRES (bandeaux défilants, calques de grain, visuels de
parallaxe sur-cadrés). Après exclusion des calques décoratifs, des éléments
réservés aux lecteurs d'écran et des rectangles trompeurs des éléments en ligne,
il reste 18 relevés, dont 4 réels.

**Trois débordements corrigés, tous dus à la longueur du français.**

1. Titre FAQ : « COMMENCER. » mesure 330 px à 52 px de corps pour une colonne de
   280. Relevé sur 19 largeurs : la colonne vaut 100vw-40 sous 810, 50vw-25
   jusqu'à 1199, 50vw-30 au-delà, et le texte fait toujours 6,35 x le corps. Le
   corps est désormais plafonné par `min()` à colonne/6,5, ce qui conserve
   exactement 52/68/92 px partout où ils tiennent et ne réduit que dans les
   bandes 320-369, 810-913 et 1200-1227.
2. Titre 404 : « INTROUVABLE » sortait de l'écran de 320 à 430 px et emportait
   avec lui la mention « Erreur 404 », relevée 119 px hors cadre. Même plafond.
3. Bouton d'en-tête : « DÉMARRER UN PROJET » porte le bouton à 155 px contre 124
   pour « START A PROJECT », et son bord droit tombait à 357 pour une fenêtre de
   320. Une forme courte (« DÉMARRER ») ne sort que sous 390 px.

**Formes courtes du pied de page.** Les trois liens légaux partagent une ligne :
« Politique de confidentialité » devient « Confidentialité » et « Conditions
générales » devient « CGV » (le document régit une prestation vendue, pas l'usage
du site ; CGPS serait exact mais illisible). Le champ `shortLabel` du modèle
`Link` n'est lu QUE là où la place manque : les pages, le menu flottant et la
mention du formulaire gardent les intitulés complets.

**Sélection de texte en volt.** `--volt` (#d2ff37) devient un jeton : la couleur
existait déjà, écrite en dur dans la pastille de crédit du pied de page. Le texte
sélectionné passe en noir, et ce n'est pas une préférence : le volt a une
luminance relative de 0,855, donc le contraste WCAG vaut 16,96:1 avec le noir du
site contre 1,16:1 avec le blanc, qui serait illisible. Les règles vivent hors de
toute couche CSS, comme `focus.css`, pour battre les utilitaires Tailwind sans
`!important`.

**Reste, non résolu.** Une ligne du chapô des prestations dépasse de 8 px sa
boîte à 320 px, et à 320 seulement. La cause n'est pas établie : le mot fait
288 px pour 280 disponibles, et retirer l'espace finale ne change rien. Aucun
caractère visible ne semble coupé.

## [2026-07-31] Le site passe en français, à la première personne, et devient celui d'Eliott

**Type** : Feature
**Fichiers de contenu** : `site.ts`, `home.ts`, `about.ts`, `contact.ts`,
`work.ts`, `services.ts`, `faq.ts`, `pricing.ts`, `stats.ts`, `testimonials.ts`,
`blog.ts`, `legal.ts`, `not-found.ts`, `ui.ts`, `routes.ts`
**Nouveaux** : `src/content/features.ts`, `src/lib/content/features.ts`,
`src/lib/site-url.ts`
**Composants** : en-tête, pied de page, menu flottant, hero, showreel, sections
« à propos », chiffres, tarifs, prestations, pages projet, blog, contact, légal

**Ce qui a changé.** Le site était une reconstruction fidèle d'un template
d'agence américaine. Il devient le site personnel d'Eliott : tout le texte passe
en français, la voix passe du « nous » d'agence au « je » d'un freelance seul, et
les preuves sociales fabriquées du template disparaissent. La logique de la copy
d'origine est conservée telle quelle, y compris son angle conversion-first : ce
n'est pas une réécriture éditoriale, c'est une traduction et un changement de
locuteur.

**Ce qui a été retiré, et pourquoi.** Le template affichait une ancienneté depuis
2019, 60+ projets livrés, 89 % d'activité par recommandation, une note de 4,9/5
sur Google et Clutch, 24+ projets, 12+ secteurs, un lien Trustpilot, une équipe de
quatre personnes, une adresse à Londres et un numéro américain. L'activité
d'Eliott a démarré le 1er juin 2026 : ces éléments étaient faux et vérifiables.
Ils ont été supprimés, **jamais remplacés par d'autres chiffres inventés**. Là où
un composant exige une valeur numérique, elle porte désormais un engagement au
présent, et chacune est listée dans `docs/ACTIVE.md` pour arbitrage.

**Blog et témoignages masqués.** Eliott n'a ni article ni témoignage réel. Plutôt
que de supprimer le code, `src/content/features.ts` porte deux drapeaux appliqués
par un décorateur posé autour de la couche contenu
(`src/lib/content/features.ts`). Une section éteinte disparaît partout d'un coup :
navigation d'en-tête, menu flottant, navigation de pied de page, ordre des
sections de la home, teaser de la page « à propos », bloc « paroles de client »
des pages projet, sitemap, et route dédiée qui répond alors 404. Le schéma
Payload du blog reste complet et migré : rallumer le drapeau suffit.

Vérifié : `/blog` et `/blog/[slug]` répondent 404, le sitemap ne contient plus
aucune entrée de blog, les autres routes répondent 200.

**Le vrai piège, et la leçon.** Une part importante du texte visiteur était
recopiée EN DUR dans les composants alors que la donnée existait déjà. Traduire
les fichiers de contenu ne changeait donc rien à l'écran. Pire, les tableaux
`highlights` figés en anglais cessaient de correspondre au texte français :
l'emphase visuelle disparaissait **sans aucune erreur TypeScript**, puisqu'une
sous-chaîne qui ne correspond à rien est un cas légitime.

Une quinzaine de doublons ont été supprimés en branchant les composants sur la
donnée : chapô des prestations, sous-titre du hero, phrase manifeste du showreel,
libellés et compteur de la section « à propos », emphase de la baseline
d'en-tête, emphase du sous-texte du pied de page, mention du formulaire, crédits,
libellés de colonnes, portrait, liens du menu flottant, liens légaux, noms de
mois. Ce ne sont pas des traductions oubliées : c'était une seconde source de
vérité, invisible et silencieuse.

**Deux défauts de fond corrigés au passage.**

1. Les filtres du blog et des projets identifiaient l'onglet « tout afficher » par
   son LIBELLÉ (`=== "All"`). Traduire ce libellé en « Tous » vidait la page de
   ses éléments au chargement, sans erreur. L'identification passe désormais par
   l'index, donc le libellé redevient librement traduisible.
2. Trois fichiers déclaraient chacun leur URL de site avec, en valeur de secours,
   l'adresse du site Framer d'origine. Sans variable d'environnement, le site
   publiait donc des URL canoniques, un sitemap et un robots.txt pointant vers le
   template. Centralisé dans `src/lib/site-url.ts`, avec `http://localhost:3000`
   en secours : une valeur fausse de façon évidente vaut mieux qu'une valeur
   plausible.

**Documents légaux réécrits, pas traduits.** Les originaux relevaient du droit
américain. Trois documents français les remplacent, dont des mentions légales
absentes du template et obligatoires en France (LCEN, art. 6-III), avec la
franchise en base de TVA mentionnée. Douze valeurs restent explicitement à
compléter (SIRET, hébergeur, médiateur…). **Ce sont une base de travail, pas des
textes validés par un juriste.**

**Tests.** `src/content/legal.test.mjs` vérifiait la fidélité au texte anglais :
il n'avait plus rien à comparer. Il vérifie désormais les invariants qui comptent,
dont un garde-fou contre un identifiant légal inventé (aucune suite de neuf
chiffres ou plus dans le corps d'un document). Le test du manifeste de routes
n'affirme plus une fidélité au sitemap d'origine, qui n'a plus lieu d'être.

**Signature manuscrite.** Le vecteur orange du hero, de la page « à propos », de
la page contact et de la section tarifs est un tracé SVG qui épelle le nom de la
marque du template : affiché ici, il donnait à lire la signature de quelqu'un
d'autre. Il passe derrière un troisième drapeau (`signature`), éteint. Le tracé
reste en place ; le rallumer suppose de l'avoir remplacé. Le vecteur étant
positionné en absolu, son retrait ne déplace rien.

**Photos.** Trois portraits d'inconnus hérités du template étaient rendus sous le
nom d'Eliott (hero, crédits du pied de page, citations du manifeste). Les champs
`avatar` ont été retirés et les composants rendus tolérants à leur absence :
remettre le champ avec une vraie photo suffit à les réafficher.

**Reste à faire avant mise en ligne** : voir la section « À COMPLÉTER » de
`docs/ACTIVE.md`. Le poste le plus risqué est `src/content/work.ts`, dont les cinq
études de cas et leurs résultats chiffrés sont entièrement fictifs.

## [2026-07-31] Les images passent par l'optimiseur, et les liens permanents cessent de précharger

**Type** : Refactor
**Fichiers** : `cards/ArticleCard.tsx`, `effects/ParallaxCover.tsx`,
`layout/Footer.tsx`, `layout/FloatingNav.tsx`, `sections/ShowreelSection.tsx`,
`sections/WhyUsSection.tsx`, `sections/LogoBandSection.tsx`,
`pages/about/AboutPage.tsx`, `pages/contact/ContactPage.tsx`,
`ui/HoverPrefetchLink.tsx` (nouveau), `ui/index.ts`, `.gitignore`
**Supprimé** : `pages/blog/CopyLinkButton.tsx` (mort)

**Écart traité.** Onze `<img>` bruts ne passaient pas par l'optimiseur de Next,
alors que celui-ci fonctionnait déjà sur treize autres images du projet. La plus
coûteuse : une vignette de 50 × 50 px qui téléchargeait 419 KB de couverture
pleine taille (`ArticleCard`, variante « featured »).

**Mesures, build de PRODUCTION hors projet, port 3211, fenêtre 1440 × 900,
parcours complet à la molette.** Images seules, brutes + optimisées :

| route | avant | après | gain |
|---|---|---|---|
| `/` | 1 452 KB | 900 KB | **-552 KB** |
| `/about` | 1 298 KB | 683 KB | **-615 KB** |
| `/contact` | 203 KB | 81 KB | -122 KB |
| `/blog` | 383 KB | 294 KB | -89 KB |
| `/work` | 508 KB | 419 KB | -89 KB |
| `/legal/*` | 129 KB | 40 KB | -89 KB |

**Géométrie.** Un inventaire DOM avant/après (boîte, `object-fit`, `position`,
`top`, `height` de chaque visuel des huit routes) donne **zéro écart**. C'était
le risque principal : `next/image` recadre autrement dès qu'on lui laisse poser
sa propre boîte.

**Deux calques ne pouvaient pas prendre `next/image`** : le poster du showreel et
la couche de `ParallaxCover` tiennent par un sur-cadrage `top:-N% / height:100%+2N%`
et une valeur de mouvement `y`. Ils passent par `getImageProps`, qui rend `src` et
`srcSet` sans imposer de balise — c'est le motif de la documentation embarquée
(`.../02-components/image.md`, § `getImageProps`).

**Sous-résolution : une seule, mesurée puis corrigée.** La photo de studio
d'`/about` occupe un cadre plus HAUT que large alors que le fichier est presque
carré : `object-fit: cover` y réclame 540 px de large pour un cadre de 345. Le
gabarit par défaut servait 384 px, soit 29 % trop peu. Corrigé par un `sizes`
explicite (640 px servis). Un contrôle systématique compare désormais la largeur
demandée à la largeur qu'exige le recouvrement.

**Écart de pixels ASSUMÉ, pas supposé nul.** Le ré-encodage JPEG → WebP q75
change les valeurs de pixels. Relevé sur les sept fichiers convertis, image
décodée contre image décodée à la même boîte :

| | écart moyen / canal | écart max | texture locale (écart-type 8 × 8) |
|---|---|---|---|
| plage | 0,78 à 6,07 sur 255 | 19 à 79 | **-9 % à +2 %** |

Les deux plus gros écarts moyens sont les vignettes de 50 et 100 px, où le
rééchantillonnage change de main (navigateur → optimiseur). Les calques de GRAIN
du site ne sont pas concernés : ce sont des images de fond CSS
(`rR6HYXBr….png`), jamais converties — `grain-audit` reste à 27/27.

**Préchargement : le gain réel est le quart de celui annoncé.** Les liens de
`FloatingNav` et du pied de page passent par un `HoverPrefetchLink` qui ne
précharge qu'à l'intention. **Piège de version** : sur le routeur d'app de cette
version, `prefetch={false}` veut dire « jamais », survol compris, et non
« seulement au survol » comme sur l'ancien routeur de pages ; un `false` seul
aurait rendu toute navigation froide. Mesure déterministe (chargement, aucun
défilement, 4 s) : **166 KB / 28 requêtes → 122 KB / 19 requêtes, soit -44 KB par
chargement sur les neuf routes**, et non les 168 KB annoncés par l'audit. Les
168 KB étaient le préchargement TOTAL de la page ; ces deux composants n'en
portent que 44. Le reste vient de `Header.tsx`, hors périmètre de ce lot.

**Non-régression** : `audit-live` 390/810/1440 sans hauteur dégradée sur les 9
routes, `grain-audit` 27/27, `motion-sweep` 9/9, `reveal-threshold` 0 hors
tolérance, `parallax-audit` 36/36. `typecheck` 0, `test` 46/46, `lint` 0 erreur.

**Lecons apprises.** `naturalWidth` MENT sur une image à `srcset` en descripteurs
de largeur : le navigateur le divise par la densité qu'il a retenue. Un premier
contrôle bâti dessus a signalé onze fausses sous-résolutions, dont plusieurs
antérieures à ce lot. La seule mesure juste est le paramètre `&w=` réellement
demandé.

## [2026-07-31] Les entrées du hero partent à la première peinture, plus à l'hydratation

**Type** : Feature
**Fichiers** : `motion/appearAnimations.ts` (nouveau), `motion/Reveal.tsx`,
`app/layout.tsx`, `sections/HeroSection.tsx`, `sections/hero/Signature.tsx`,
`layout/Header.tsx`

**Écart traité.** Nos apparitions `appear` démarraient au montage React, donc à
l'hydratation ; la source démarre les siennes au premier `requestAnimationFrame`,
avant tout JavaScript applicatif. Forme et durées étaient déjà identiques, seul
l'instant de départ dépendait d'une chose que la source ne fait pas attendre.

**Mécanisme retenu.** framer-motion sait REPRENDRE une animation déjà commencée :
un élément portant `data-framer-appear-id` interroge à son montage une poignée de
fonctions posées sur `window` (`MotionHasOptimisedAnimation`,
`MotionHandoffAnimation`, …), et si l'une d'elles lui rend l'instant de départ de
l'animation en cours, il démarre la sienne à ce même instant, déjà avancée
d'autant. Ces fonctions `window.*` sont le SEUL point de contact entre le
démarreur inline et le moteur : il n'est donc pas nécessaire d'embarquer
framer-motion dans le script inline, il suffit d'en tenir le contrat.

D'où le partage : la recette de chaque entrée (images-clés CSS, durée, retard,
courbe) est résolue au RENDU SERVEUR par le solveur de framer-motion lui-même —
celui-là même qui animera après l'hydratation, donc le seul qui garantisse un
raccord exact — et sérialisée en `data-appear` ; le script inline, 2,8 ko, n'a
plus qu'à appeler `Element.animate` et poser un instant de départ commun. La
source, elle, inline tout son solveur de ressorts.

Chaque appel porte l'identifiant de l'entrée DANS LA SOURCE (`1lrracs`,
`h0duhu`, `irdhqz`…), repris de son bloc `__framer__appearAnimationsContent` :
chaque apparition se vérifie désormais ligne à ligne contre son original.

**Alternatives écartées.** Inliner un solveur de ressorts, comme Framer : des
kilo-octets de JavaScript avant le premier octet utile, et un second solveur à
tenir en phase avec celui de framer-motion. Un registre central des entrées
sérialisé en un bloc JSON, comme la source : il faudrait que le layout connaisse
des identifiants créés dans des composants clients, alors que l'attribut porté
par l'élément ne peut pas se désynchroniser de lui.

**Preuve** (build de production, 1440×900, 3 passes médianées, repère = première
peinture de chaque côté, superposition par recherche du décalage minimisant
l'écart quadratique). Ordonnée image par image de « design », « development » et
« Marketing » :

| condition | avant | après |
|---|---|---|
| chargement normal (hydratation à +40 ms) | 0 ms, résidu 3,3 px | −35 ms, résidu 3,2 px |
| hydratation forcée à 1,2 s | +800 ms, résidu 23,6 px (59,6 px à décalage nul, écart maximal 100 px) | −35 ms, résidu 2,0 px |

L'entrée ne dépend donc plus des conditions de chargement. Le banc « hydratation
forcée » retarde tous les bundles de 1,2 s des DEUX côtés ; le script de la
source étant inline, elle n'en souffre pas — c'était exactement notre faiblesse.

**Reprise sans couture.** Courbe de référence obtenue en repoussant l'hydratation
au-delà de la fin de l'entrée (aucune reprise), comparée aux courbes où la
reprise a lieu à +40 ms puis en pleine course à +1,2 s : décalage 0 ms, résidu
0,51 à 0,89 px, écart maximal 3,7 à 4,9 px — soit AU NIVEAU du plancher de bruit
mesuré entre deux passes identiques (0,58 à 0,64 px, maximum 4,7 à 5,4 px). Ni
saut de position, ni reprise depuis le début. Sonde posée sur
`window.MotionHandoffAnimation` : 49 reprises sur `/` (15 opacités, 34
transforms), toutes rendant un instant de départ, aucune nulle, 15 identifiants
sur 15 ; 1 sur 1 sur `/about` et `/contact`.

**Détecteur de rejeu** (un texte qui, après s'être posé, s'en éloigne à nouveau
de plus de 2 px) : 0 sur `/`, `/about` et `/contact`, à 1440 comme à 390.

**Filets.** Sous `prefers-reduced-motion: reduce` le script ne fait rien du tout,
ni animation ni fonction posée sur `window` (vérifié : 0 animation en cours,
mots à leur place) ; framer-motion garde la main avec son `reducedMotion="user"`.
Sans JavaScript, les 66 `[data-reveal]` de la home, 30 d'`/about` et 19 de
`/contact` sont tous à l'état visible. Aucun avertissement d'hydratation en dev
ni en production.

**Coût.** +11,5 ko de HTML sur la home (2 % de la page), soit +1,47 ko une fois
compressé.

**Limites restantes.** L'écart de phase de −35 ms est le nôtre : notre document
étant plus léger, son analyse finit plus tôt que celle de la source rapportée à
sa propre première peinture. Pendant l'entrée, l'animation WAAPI écrit tout le
`transform` et couvre donc la parallaxe du bloc hero et de la signature : sans
effet au chargement (défilement nul), visible seulement si le navigateur
restaure une position de défilement — la source a exactement la même propriété.
Sous 810 px, l'écart de LOI de la ligne services déjà consigné subsiste
(décalage 445 ms contre 490 ms avant, résidu inchangé) : il tient à la variante
responsive, pas à l'instant de départ.

## [2026-07-31] La page ne se rejoue plus une seconde après le chargement

**Type** : Bugfix
**Fichiers** : `motion/Reveal.tsx`, `motion/MotionSettings.tsx` (nouveau),
`app/layout.tsx`, `sections/HeroSection.tsx`, `sections/hero/Signature.tsx`,
`layout/Header.tsx`, `motion/LineReveal.tsx`, `sections/AboutSection.tsx`,
`sections/ServicesSection.tsx`, `sections/WhyUsSection.tsx`,
`motion/ParallaxImage.tsx`, `motion/ParallaxBackdrop.tsx`,
`effects/ParallaxCover.tsx`, `pages/blog/BlogFilterGrid.tsx`

**Symptômes.** Deux défauts visibles à l'œil, une seule cause. « La landing
charge deux fois au refresh, une fois sans animation puis une fois avec » ; et
sur la home, le mot « Marketing » et le séparateur qui le précède restaient 20 px
sous leur ligne, décrochés, comme un mot manquant.

**Cause.** `useReveal` rendait l'état FINAL au repos et ne basculait vers l'état
masqué qu'après l'hydratation, via un remontage par `key`. Instrumenté sur la
home à 1440 (observateur de mutations posé avant navigation) : les cinq mots de
la ligne services sont RETIRÉS puis RECRÉÉS en une seule salve à 1017,4 ms, les
retirés portant `transform: none` (état d'arrivée) et les recréés
`translateY(20px)` (état de départ). Trace image par image : 636 à 73 ms, 630 à
203 ms — état final atteint — puis 732 / 746 à 1021 ms, tout repart. La source,
elle, sérialise son état initial dans le HTML
(`style="opacity:1;transform:translateY(20px)"`) et descend d'un seul mouvement.

Le rejeu tardif laissait ensuite deux mots en rade, pour une raison
géométrique : `IntersectionObserver` découpe la boîte de sa cible par les zones
de clip de ses ancêtres, or les cinq mots vivent dans un conteneur
`overflow-hidden` haut d'une ligne et leur `y: 20` de départ les en fait sortir,
tandis que le `rotate: 2` du bloc hero incline la rangée. Hauteurs
d'intersection relevées à l'instant du verdict : 12 · 8 · 6 · 0 · 0 px. Les deux
derniers ne recevaient qu'un seul événement, `isIntersecting: false`, et plus
rien ensuite.

**Correction.** L'état masqué est rendu DÈS LE RENDU SERVEUR et l'animation ne
joue qu'une fois : plus aucun état React ne bascule après l'hydratation, plus
aucune `key` ne change. Le déclencheur devient explicite (`RevealTrigger`) :
`"appear"` pour le hero et le header, qui sont les 22 `appear effects` que la
source démarre au premier `requestAnimationFrame` sans observateur ;
`"viewport"` pour le reste du site. `prefers-reduced-motion` passe par
`<MotionConfig reducedMotion="user">`, et l'absence de JavaScript par une feuille
`<noscript>` qui remet `[data-reveal]` à l'état visible.

**Alternatives écartées.** Décaler les retards sous la coupure : soigne le
symptôme, le remontage se reproduira ailleurs. Porter l'observateur sur le
conteneur non déplacé (le procédé de `LineReveal`) : correct, mais il resterait
un observateur là où la source n'en a aucun.

**Preuve.** Positions au repos, source contre clone : Δy ≤ 1 px sur les cinq
éléments à 390, 810 et 1440. Détecteur de rejeu sur `/`, `/about`, `/work`,
`/contact`, `/blog` : zéro rejeu des deux côtés. Sans JavaScript et sous
`prefers-reduced-motion`, la ligne est visible et en place.

**Limite restante.** Notre entrée démarre à l'hydratation, la source au premier
`requestAnimationFrame`. Décalage MESURÉ, constant, forme et durées identiques :
environ 160 ms sur le build de production, 330 ms sur le serveur de dev. Le
combler suppose de reproduire le démarreur inline de Framer
(`startOptimizedAppearAnimation` + reprise sur `data-framer-appear-id`).

**Écart de fidélité relevé au passage, non corrigé.** Sous 810 px, la source
change la LOI de la ligne services : `opacity 0.001 → 1` et `y: 8 → 0` avec des
retards 1,0 / 1,05 / 1,1 et les séparateurs retirés, là où nous rejouons partout
`y: 20 → 0`, opacité pleine, retards 0,9 → 1,1. Les positions d'arrivée sont
justes, seule la course diffère. Le corriger demande de choisir la variante au
rendu serveur, comme la source le fait avec ses blocs `ssr-variant`.

## [2026-07-30] Permutation des libellés : trois motifs, une seule primitive

**Type** : Bugfix
**Fichiers** : `ui/SwapText.tsx`, `ui/SwapCopies.tsx`, `layout/Footer.tsx`,
`layout/FloatingNav.tsx`, `pages/work/WorkNarrative.tsx`,
`pages/contact/ContactPage.tsx`, `pages/blog/BlogArticlePage.tsx`

**Cause.** `SwapText` déplaçait ses deux copies de 140 % de la hauteur de ligne
sur `300 ms ease-out`. Le pourcentage donnait 20,15 px sur un libellé de 14,4 px
et 21,83 px sur un libellé de 15,59 px, alors que la source ne travaille jamais
en pourcentage.

**Relevé.** Inventaire par structure sur `/live-proxy` (`/`, `/work`,
`/work/box-mode`, `/about`, `/blog`, `/blog/stop-hiding-your-prices`,
`/contact`, à 390 et 1440) puis relevé rAF du survol, trois passes par motif.
La source n'a que TROIS motifs, tous sur `cubic-bezier(0.68,0,0,1)` :

| motif | course | sens | fondu | durée | composant |
|---|---|---|---|---|---|
| bouton du template | 22 px | haut | croisé | 320 ms | `.framer-1sk0ilg` |
| envoi de formulaire | 12 px | bas | croisé | 430 ms | `.framer-yuvr8` |
| crédit du pied | 18 px | bas | AUCUN | 430 ms | `.framer-xh8ae` |

La course ne dépend PAS de la taille du libellé : 22 px pour un texte de
14,41 px, 12 px pour 15,59 px, 18 px pour 13,2 px. Ajustement des moindres
carrés contre huit courbes candidates : `(0.68,0,0,1)` gagne d'un ordre de
grandeur (erreur 0,0026 à 0,0049 de la course contre 0,015 pour la suivante).

**Correction.** `SwapCopies` devient la primitive unique et porte les trois
motifs ; `SwapText` n'est plus que le cadre clippant qui l'enveloppe. Trois
défauts corrigés au passage : le sens du motif à 12 px était inversé (il montait
au lieu de descendre), le crédit du pied faisait un fondu que la source ne fait
pas, et deux cadres clippants étaient trop hauts (pied 16 au lieu de 15,6, menu
flottant 15 au lieu de 14,4).

**Preuve.** Après correction, les huit permutations de chaque page tombent sur
la course, le sens et le cadre de la source à 0,02 px près, à 390 comme à 1440 ;
durées relevées 320/318 ms et 426/428 ms contre 320/316 et 428/430 sur la
source.

## [2026-07-30] Harnais : le gel figeait aussi les apparitions écrites en JS

**Type** : Bugfix
**Fichiers** : `scripts/lib/still.mjs`

**Cause.** `passe()` mettait en pause TOUT `document.getAnimations()` à
`currentTime = 1000`, et l'observateur de mutations le rejouait indéfiniment.
L'entrée du header de la home est, sur la source, une `Animation` nue : elle
était donc épinglée pour de bon à mi-parcours, à l'échelle 1,0529, au repos
comme au défilement. Notre entrée, pilotée par `motion/react`, allait elle
jusqu'à l'échelle 1. D'où un CTA relevé à 130,94 x 31,59 sur la source contre
124,36 x 30 chez nous, soit un rapport de 1,053 sur la largeur, la hauteur ET la
largeur du texte, sur la seule route qui anime son header. Cela ressemblait à
une échelle résiduelle du produit ; c'était le harnais.

**Preuve.** Relevé image par image sans gel : les deux versions descendent de
1,2996 à exactement 1 (124,359 x 30) et n'en bougent plus, ni au repos, ni sur
191 images de défilement, à 390 comme à 1440. Avec l'ancien gel, la source
sautait à 1,0529 vers 825 ms et s'y figeait.

**Correction.** Seules les `Animation` nues à durée finie sont désormais
laissées libres. Les `@keyframes`, les boucles et les TRANSITIONS gardent
exactement l'ancien traitement : `interaction-audit` a besoin que les
transitions soient menées au-delà de leur fin pour lire un état stabilisé, et
une première version qui les libérait aussi faisait apparaître 18 faux états
manquants.

## [2026-07-30] Pages projet : le bloc « approche » est empilé, pas en grille

**Type** : Bugfix
**Fichiers** : `pages/work/WorkNarrative.tsx`, `pages/work/RelatedWork.tsx`

**Cause.** Le bloc « approche » était calqué sur le bloc « résultats » (grille
à deux colonnes, libellé et contenu alignés en haut à partir de 810). Sur la
source il reste EMPILÉ à toutes les largeurs : une colonne flex avec
`gap: 20` sous 810 et `gap: 30` au-dessus, le libellé sur sa propre ligne
pleine largeur et le contenu dans la moitié droite de la ligne suivante. Le
`tablet:mt-0` remontait donc tout son intérieur de 44px, jusqu'à 78 pour le
bouton, pendant que trois valeurs de compensation (`pb-[112px]` sur la section,
`tablet:mt-[107px]` sur le bloc « résultats », `mt-[3px]` sur l'image suivante)
ramenaient la hauteur de page à 4px près avec un intérieur faux.

**Correction.** Toutes les valeurs de la queue du récit viennent maintenant de
la déclaration CALCULÉE de la source, relevée à 320, 390, 600, 809, 811, 1199,
1201, 1440 et 1920. Une seule bascule, à 810, aucune à 1200 : retraits de
section 20/60, écart titre → corps 12/20, chiffre → libellé 10/15,
chiffres → conclusion 30/50, conclusion → image 30/60, image → « résultats »
30/50, libellé → contenu 20/0 (résultats) et 20/30 (approche),
texte → bouton 20/40. Les trois `desktop:` de compensation disparaissent.

**Preuve.** Section « récit » à 0,67px près en sous-pixel à 390, 810 et 1440 ;
positions internes du bloc « approche » identiques à la source (libellé 5977,
titre 6021, corps 6184, bouton 6282 à 1440). Hauteur de document réelle à
0/-2px sur les trois pages projet à 320, 390, 600, 810 et 1440. `geo` de
`audit-live` : 68→22 à 1440, 71→23 à 810.

**Limite connue.** `audit-live` reporte encore -3 à 390 sur les trois pages
alors que la hauteur de document réelle n'y est qu'à -1 : sa métrique
`max(offsetTop + offsetHeight)` accumule l'arrondi entier d'`offsetTop` sur le
DOM très profond de la source. `/work`, considéré juste, y est à -2.

## [2026-07-30] Contrôle à 18 largeurs, et les deux résidus géométriques levés

**Type** : Bugfix + Tests
**Fichiers** : `scripts/breakpoint-bracket.mjs`, `scripts/audit-live.mjs`,
`pages/work/WorkNarrative.tsx`, `sections/TestimonialsSection.tsx`,
`sections/ArticlesSection.tsx`, `pages/about/AboutPage.tsx`

**Contrôle.** `breakpoint-bracket` passe de 4 à 18 largeurs et de 8 à 9 routes,
avec un encadrement à ±2px de CHAQUE bascule (808→812, 1198→1202) et des
largeurs représentatives dans chaque bande. Il ne compare plus seulement la
hauteur : il classe le RÉGIME de chaque bande (FIXE / PALIER / FLUIDE) des deux
côtés et signale un clone figé là où la source est fluide. Une passe de
confirmation re-mesure les cellules qui s'écartent de plus de 10px de la médiane
de leur ligne — sur 162 cellules, deux à quatre sortaient à +40 ou +577 sans
qu'aucune mesure répétée ne les reproduise. `audit-live` accepte `--widths=full`,
`--routes` et `--out` (pour ne plus écraser `audit-report.json`).

**Témoignages.** Le `pr-0` mobile de la colonne citation était faux : la source
pose `padding: 0 40px 0 0` aux 18 largeurs et la variante téléphone ne le remet
jamais à zéro. La citation gagnait une ligne de moins, d'où −25px de page à 320,
360 et 430 sur `/` et `/about`, et zéro à 390 et 600 par coïncidence de repli.

**Fiche projet.** La ligne (`.framer-brobv4`) cumulait quatre défauts pour
+1,59px chacune : `min-h-[52px]` inventé, `py-[16px]` au lieu de 18, valeur en
11px au lieu de 12px/14,4px, et un `border-t` porté par la ligne alors que la
source dessine le filet sur un `::after` absolu qui ne compte pas dans la
hauteur. Ajouté `whitespace-pre` : le préréglage de la source ne se replie
jamais, ce qui explique les 50,40625px constants aux 18 largeurs. Le conteneur
de fiche est un PALIER (`30px 0 10px` puis `40px 0 30px`), le bouton ne prend
aucune marge, et l'écart bouton → image est 20px puis 60px.

**Titre des articles.** Même composant, corps DIFFÉRENT selon la page entre 810
et 1199 : 68px sur la home, 64px sur `/about`. D'où la prop `headingTabletPx`.

**Résultat** : les 9 routes tiennent dans ±4px aux 18 largeurs. `/about` passe de
+7 à 0 dans la bande 810-1199, `/work/box-mode` de −8/−9 à −3/−4, et le même
correctif vaut pour `/work/nomad-stays` et `/work/stackline`.

**Leçons apprises** : une valeur en dur qui donne le bon chiffre à une largeur
est un défaut, pas une correction. Et une cellule isolée dans un grand tableau de
mesures doit être re-mesurée avant d'être lue comme un défaut.

## [2026-07-30] Grain fidèle, focus clavier accessible, seuil de révélation corrigé

**Type** : Feature + Bugfix
**Fichiers** : `effects/Grain.tsx`, `app/focus.css` (nouveau), `motion/Reveal.tsx`,
`motion/LineReveal.tsx`, `ui/ToggleIcon.tsx` (nouveau), `sections/ServicesSection.tsx`,
`layout/FloatingNav.tsx`, `scripts/grain-audit.mjs` et `scripts/reveal-threshold.mjs` (nouveaux)

**Grain.** Inventaire exhaustif des 8 routes, détection par STRUCTURE (fond
répété, motif sous 512px, calque au moins deux fois plus grand que son parent,
opacité sous 1). La source pose 17 calques sur `/`, 11 sur `/blog`, 5 sur
`/contact`, tous en `absolute`, aucun en `fixed`. Notre calque global était une
invention qui doublait le grain de chaque section. 8 calques manquaient, 1 était
inventé, une dizaine d'opacités étaient fausses, et le même balisage était
recopié six fois à la main dont quatre copies FIGÉES (grain du footer immobile
sur les 18 pages). Surface activement animée ramenée de 195 Mpx en permanence à
une médiane de 24 Mpx.

**Focus clavier.** Divergence VOLONTAIRE : la source n'a aucun style de focus.
`app/focus.css` est déclaré HORS COUCHE, donc l'emporte sur les utilitaires
Tailwind (tous dans `@layer utilities`) sans aucun `!important`, et aucun
composant ne peut re-diverger. Double anneau sombre/clair/sombre, contraste
mesuré pixel par pixel sur le fond réel, minimum absolu 4,44:1.

**Seuil de révélation.** `REVEAL_BOTTOM_MARGIN = -100` était faux : le seuil de
la source est le bord bas de la fenêtre, marge nulle, sur 30 éléments de 8
routes et 4 types, tous dans [895, 905).

**Problèmes rencontrés** : `Reveal` posait son observateur sur l'élément
TRANSLATÉ, donc chaque apparition partait en retard de son propre `initialY`,
retard invisible parce qu'il variait d'un appel à l'autre.

**Leçons apprises** : `getBoundingClientRect` renvoie la boîte TRANSFORMÉE, or
c'est l'état masqué qui porte le transform. Mesurer un seuil avec elle disperse
des éléments qui partagent pourtant le même seuil.

---

## [2026-07-30] États d'interaction et apparitions

**Type** : Feature + Bugfix
**Fichiers** : `ui/SwapCopies.tsx`, `layout/FloatingNav.tsx`, `layout/Footer.tsx`,
`sections/*`, `pages/blog/*`, `pages/about/*`, `pages/contact/*`

Survol, focus et activation n'avaient JAMAIS été comparés à la source. Une
quinzaine d'états manquaient. Le glissement des libellés ne bougeait pas du
tout : Tailwind 4 compile `-translate-y-[22px]` en `translate`, jamais en
`transform`, et la liste animée déclarait `transform`. Le menu flottant était
faux sur cinq points, dont l'absence totale du flou plein écran. Toutes les
images d'`/about` entraient sans apparition.

**Retiré comme inventé** : entrée `scale(1.3)` du header sur 17 pages où la
source n'en a aucune, survol des puces de filtre, anneau de focus orange.

**Leçons apprises** : la comparaison VISUELLE d'abord, les scripts ensuite. Les
trois agents ont trouvé leurs vrais défauts à l'oeil, sur vidéo, puis confirmé
par la mesure. Aucun ne les aurait trouvés en partant des outils.

---

## [2026-07-29] Contrôle complet : largeurs, bascules, hauteurs de fenêtre

**Type** : Bugfix
**Fichiers** : `pages/blog/BlogArticlePage.tsx`, `pages/RichText.tsx`,
`pages/contact/ContactPage.tsx`, `pages/about/AboutPage.tsx`, `content/blog.ts`

Grille des articles liés sans plafond 1440 : les cartes étant carrées, elles
s'étiraient sans fin (928px de côté à 1920 au lieu de 718, soit 190px de page en
trop). Corps de l'article en 14px au lieu de 15, ce qui changeait tous les
retours à la ligne (131px manquants à 390). Quatre routes justes à 390 et à 810
mais fausses ENTRE LES DEUX.

**Leçons apprises** : contrôler à trois largeurs de référence ne suffit pas. Un
plafond ne se voit qu'AU-DELÀ de lui, une loi fluide ne se voit qu'ENTRE les
paliers.
