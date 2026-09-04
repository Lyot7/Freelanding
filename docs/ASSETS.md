# Assets — provenance et licence

> Registre des visuels servis au visiteur. **Règle : aucun fichier n'est servi
> depuis `public/` sans une ligne ici.** Un visuel dont la licence n'est pas
> traçable ne se voit pas : il s'affiche, il est joli, et rien ne dit qu'il
> appartient à quelqu'un d'autre. Le contrôle automatique correspondant est
> `scripts/template-assets-audit.mjs`.

Dernière revue : **2026-08-26**.

## 1. Photographies d'Eliott — propriété d'Eliott

| Fichier | Ce que c'est | Origine |
| --- | --- | --- |
| `images/eliott-nature-vertical.jpg` | Portrait en situation, 1100 × 1388 (rapport 0,7917, celui du cadre de la couverture À propos) | Photo personnelle `IMG_0738.HEIC`, recadrée |
| `images/eliott-nature-paysage.jpg` | Portrait en situation, 1400 × 931 (rapport 1,504, celui de la carte du pied de page) | Même photo, autre recadrage, sujet décalé à gauche |
| `images/eliott-nature-carte.jpg` | Portrait tête-et-épaules, 680 × 835 (rapport 136/167, celui de la carte du hero Contact) | Même photo, cadrage serré |
| `images/eliott-nature-bloc.jpg` | Portrait pleine cadre, 1035 × 1623 (rapport 0,637584, celui du bloc « Crédible avant tout. » de l'accueil) | Même photo, plan taille resserré (fenêtre 1430 × 2243 à +1439/+1577 sur l'original orienté 4284 × 5712) |
| `images/eliott-portrait-vertical.jpg` | Portrait **détouré** sur aplat accent | Même séance, détourage + chromakey sur `--accent` |
| `images/eliott-portrait-citation.jpg` | Idem, cadrage citation | Idem |
| `images/eliott-portrait-large.jpg` | Idem, cadrage paysage | Idem — **plus servi** depuis le 2026-08-26 |
| `images/eliott-portrait-paysage.jpg` | Idem | Idem — **plus servi** depuis le 2026-08-26 |
| `images/eliott-bouquerel-avatar.jpg` | Vignette ronde 400 × 400 | Idem, recadrage serré sur le visage |
| `images/eliott-bouquerel.jpg` | Source carrée 1200 × 1200 | Idem |

Les deux registres cohabitent **volontairement** : le détourage sur aplat vert
est un signe de marque, il tient sur les petites surfaces (vignette de 40 px,
citation) et à côté des aplats d'accent. Il ne tient pas sur les grands cadres,
où il devient un aplat de couleur avec un buste coupé posé dessus : ceux-là
portent la photo d'origine, en niveaux de gris.

Quatre cadres portent la photo naturelle — couverture d'À propos, carte du pied
de page, carte du hero Contact, bloc « Crédible avant tout. » de l'accueil — et
chacun a son propre recadrage, au rapport exact de son cadre. Aucun n'est le
même fichier redimensionné : à 136 px de large, un plan large rend le visage
illisible.

Le dernier a été converti le 2026-08-27, et pour une raison de fond : ce cadre-là
est posé sur un APLAT accent et porte un calque de grain. Sur un aplat, le bruit
ne se lit plus comme une matière, il dessine un rectangle sale. La source y met
une photographie pleine cadre ; le détourage y était un contresens. Le détourage
vert reste sur la vignette ronde et sur la citation de la section tarifs, où il
fonctionne.

## 2. Assets générés — propriété d'Eliott

| Fichier | Ce que c'est | Origine |
| --- | --- | --- |
| `videos/hero-loop.mp4` · `.webm` | Boucle de fond du hero | Généré (Veo / Nano Banana, 2026-08-10), calibré par `scripts/hero-loop.mjs` |
| `images/mecanisme-large.jpg` · `-carre` · `-bandeau` | Macro d'un mouvement d'horlogerie | Images fixes extraites de la boucle ci-dessus |
| `images/og.jpg` | Image de partage | `scripts/og-image.mjs` |
| `images/grain.png` | Motif de bruit 256 × 256 | Généré |
| `components/layout/SocialGlyph.tsx` | Glyphes du pied de page et du blog | Voir la note ci-dessous |
| `logo-b.svg` | Monogramme | Dessiné par Eliott |
| `logo-bouquerel.svg` | Logotype « Bouquerel », 1808 × 376 | Dessin généré par Gemini (2026-08-27), **vectorisé** ici — voir §5 |

### Affiche de la section « Je construis des sites qui vendent »

| Fichier | Photographe | Licence | Traitement |
| --- | --- | --- | --- |
| `images/escalier-lumiere-paysage.jpg` | Vladimir Khoteev | Unsplash (gratuite, usage commercial autorisé) | Niveaux de gris, contraste sigmoïdal, recadrage 1512 × 960 |

Elle remplace `mecanisme-paysage.jpg` depuis le 2026-08-27, fichier supprimé
faute d'usage restant. L'ancienne affiche était une image fixe de la boucle du
héros : belle, mais elle montrait un rouage sous une phrase qui parle de chemin
évident, et elle redisait le visuel du héros deux écrans plus haut. La nouvelle
montre un escalier de béton vu de face, un rai de lumière posé en son milieu de
la première à la dernière marche : la direction est donnée par la lumière, il
n'y a rien à décider pour savoir où aller.

Vérifié sur la page de la photographie avant téléchargement : « Photo gratuite
sur Unsplash », sans marqueur Unsplash+. Les images servies depuis
`plus.unsplash.com/premium_photo-*` relèvent d'un abonnement payant et ne sont
jamais utilisées ici.

## 3. Captures des pages projet

`work/kpsull/*`, `work/nslysium/*`, `work/wurth/*`. Les trois n'ont PAS le même
statut, et c'est ce qui décide de ce qu'on peut en faire :

| Dossier | Commanditaire | Qui possède ce qu'on voit à l'écran |
| --- | --- | --- |
| `work/kpsull/*` | Aucun. Projet de formation monté par Eliott pour son propre compte | Eliott, conception, design et développement compris |
| `work/nslysium/*` | Workshop d'école, « client » joué par une équipe d'étudiants d'une autre formation | Eliott, pour la page ; le produit présenté n'existe pas |
| `work/wurth/*` | Würth France, en ALTERNANCE, donc en interne et sous contrat de travail | Würth France |

**Les deux premiers ne posent aucune question de droits** : les sites sont
d'Eliott, hébergés sur son propre domaine, et rien de ce qui s'y affiche
n'appartient à un tiers. Ce sont des travaux d'école, ce ne sont pas des
commandes de clients : le site ne doit jamais les présenter comme telles.
`src/content/work.ts` porte cette règle et la formulation retenue.

**Le troisième, si.** Une capture de l'eShop montre le contenu de Würth : sa
marque, ses libellés, son interface. Le travail est celui d'Eliott, ce qu'on voit
à l'écran ne l'est pas, et une alternance n'emporte aucune cession. D'où :

- publier ces captures suppose l'accord de Würth France, à demander et non à
  supposer. Le brouillon est prêt dans `docs/EMAIL-WURTH-AUTORISATION.md`, il
  n'a pas été envoyé ;
- aucun logo de la marque n'est reproduit tant que cet accord manque, ce qui
  tient `formulaire-etape-1.jpg` hors de la galerie ;
- le chiffre de « −92 % » est une mesure interne, il relève du même accord.

Rien ici n'est bloquant, et rien ici n'est automatiquement acquis.

### Glyphes des réseaux sociaux

Les deux fichiers `images/icon-github.svg` et `icon-link.svg` ont été supprimés
le 2026-08-27. Ils étaient servis par une balise `<img>`, donc en document isolé,
donc sans héritage de couleur : leur `currentColor` retombait sur le noir et le
glyphe GitHub sortait **noir sur noir dans le pied de page**. Une couleur écrite
en dur n'aurait pas réglé le cas, les mêmes glyphes servant aussi la pastille
claire du bloc newsletter du blog, où il les faut sombres. Ils sont désormais
rendus en SVG inline par `SocialGlyph`, et héritent de la couleur de leur hôte.

**Provenance des tracés.** GitHub, LinkedIn et Strava sont les logotypes
officiels de ces sociétés, redessinés à l'identique en un chemin sur une grille
de 24. Ils ne sont ni libres de droits ni la propriété d'Eliott : ce sont des
marques déposées, utilisées ici pour ce à quoi les chartes des trois autorisent
leur usage, signaler un lien vers un profil hébergé chez eux. Ils ne sont ni
déformés, ni recolorés hors du monochrome que ces chartes prévoient, et ils ne
servent nulle part d'élément décoratif ni de caution. Le maillon de chaîne du
repli, lui, est un tracé local, sans marque.

### Fonds de hero des pages projet

| Fichier | Origine | Interface retirée |
| --- | --- | --- |
| `work/kpsull/hero-fond.jpg` | Fichier ORIGINAL servi par le site : `kpsull.eliottbouquerel.fr/images/hero-skater.jpg` | Rien à retirer, le fichier ne contenait aucune interface |
| `work/nslysium/hero-fond.jpg` | Capture de `nslysium.eliottbouquerel.fr` à deux fois la densité, interface masquée par CSS, `<canvas>` 3D conservé | En-tête, accroche, paragraphe et boutons |
| `work/wurth/mockup.jpg` | Plateau 3D généré par `scripts/mockup-projets.mjs`, dalle incrustée avec la vraie étape 1 du formulaire | Rien : aucun champ saisi, rien envoyé |
| `work/wurth/formulaire-etape-1.jpg` | Capture de l'étape 1 de `eshop.wurth.fr`, page PUBLIQUE, cookies refusés, formulaire vide | Rien : aucun champ n'a été saisi, rien n'a été envoyé |
| `work/wurth/resultat-92.jpg` | Carte typographique « −92 % », composée pour ce site. **PLUS RENDUE NULLE PART depuis le 2026-09-04** : le chiffre vit en texte dans le bloc « résultats », le republier en image l'écrivait deux fois | — |

**Sur la capture Würth.** Elle a été relevée le 2026-08-27 sur la page
d'inscription publique, atteignable sans compte. Le bandeau de consentement a
été traité par « Tout refuser ». Aucun champ n'a été rempli, aucun formulaire
envoyé, aucun compte créé : il n'y a donc dans ce fichier ni donnée personnelle,
ni donnée d'entreprise. Les six autres captures de la galerie montrent des états
qui n'existent qu'après saisie et envoi ; elles ne peuvent venir que d'Eliott.

### Galerie de la page projet Würth

Sept captures du parcours de création de compte de l'eShop français, prises par
Eliott sur l'interface publique. Les originaux sont conservés dans
`docs/sources/wurth/`, les fichiers servis sont dans `public/work/wurth/`.

**Les numéros de fichier ne sont PAS les rangs du parcours.** Ils suivent l'ordre
dans lequel les captures ont été prises ; le rang réel est porté par `step` dans
`work.ts` et relevé auprès d'Eliott le 2026-09-04 : le mot de passe OUVRE le
formulaire, il ne le termine pas.

| Rang | Fichier | Ce qu'il montre | Donnée sensible |
| --- | --- | --- | --- |
| 01 | `05` + `06` | Les contraintes du mot de passe, puis leur validation (comparateur) | Mot de passe masqué, jamais envoyé |
| 02 | `01-deja-client.png` | L'aiguillage, deux tuiles « déjà cliente » / « pas encore cliente » | Aucune, écran vierge |
| 03 | `02-siren-non-reconnu.png` | Un SIREN refusé et le message de correction | Numéro inexistant, saisi pour la démonstration |
| 04 | `03-siret-adresse-remplie.png` | Un SIRET reconnu qui remplit nom, rue, code postal et ville | SIRET d'une société cotée, publié au registre public |
| 05 | `04-adresse-autocompletion.png` | Le repli : cinq propositions d'adresse au fil de la frappe | Adresses publiques de la Base Adresse Nationale |
| 06 | `07-certification.png` | La case de certification décochée, bouton « Continuer » inactif | Aucune |

Détail par fichier :

| Fichier | Ce qu'il montre | Donnée sensible |
| --- | --- | --- |
| `01-deja-client.png` | L'aiguillage d'entrée, deux tuiles « déjà cliente » / « pas encore cliente » | Aucune, écran vierge |
| `01-deja-client-cover.png` | La même, sur le canevas commun 1600 × 1000, pour la vignette et l'image de partage | Aucune |
| `02-siren-non-reconnu.png` | Un SIREN refusé et le message de correction | Numéro inexistant, saisi pour la démonstration |
| `03-siret-adresse-remplie.png` | Un SIRET reconnu qui remplit nom, rue, code postal et ville | SIRET d'une société cotée, publié au registre public |
| `04-adresse-autocompletion.png` | Cinq propositions d'adresse au fil de la frappe | Adresses publiques de la Base Adresse Nationale |
| `05-mot-de-passe-vide.png` | Les trois contraintes de mot de passe au repos. Rendue par le comparateur avant / après, pas par la galerie | Aucune, champ vide |
| `06-mot-de-passe-valide.png` | Les mêmes contraintes satisfaites, jauge « Fort ». Rendue par le comparateur avant / après, pas par la galerie | Mot de passe masqué, jamais envoyé, compte jamais créé |
| `07-certification.png` | La case de certification décochée, bouton « Continuer » inactif | Aucune |

**Aucune de ces sept captures ne reproduit le logo de Würth.** La marque n'y
apparaît qu'en toutes lettres, dans le texte de l'interface. C'est la condition
posée par la règle 4 de `src/content/work.ts`, et la raison pour laquelle
`formulaire-etape-1.jpg` reste hors de la galerie.

**Deux familles de cadrage depuis le 2026-09-04**, parce que les captures ne
servent plus au même endroit.

*Famille 1, la couverture seule* (`01-deja-client-cover.png`) : canevas commun de
1600 × 1000, le rapport 1,6 de tous les visuels du site. Elle sert de vignette sur `/work` et
d'image de partage, cadres qui la rognent : la carte, en 1,73678, prend 4,3 % en
haut et en bas, sur de la marge blanche. La variante recadrée au contenu, en
2,169, y perdrait 20 % de chaque côté, donc les deux tuiles. Le contenu n'est ni étiré ni rogné, il est
centré sur le blanc du formulaire, dans une zone utile de 1270 × 780. Relevé à
1440 sur la page rendue : le calque rogne jusqu'à 10,1 % de la largeur de chaque
côté sur ces deux cadres, et de 7,8 % à 8,9 % en hauteur, cadre poussé en haut
puis en bas du viewport.

```
sips -z <h_ajustée> <l_ajustée> capture.png    # seulement si la capture dépasse
sips -p 1000 1600 --padColor FFFFFF capture.png
```

L'ajustement vaut `min(1270 / l, 780 / h, 1)`, plafonné à 1 pour ne jamais
agrandir.

*Famille 2, tous les écrans de la séquence* (`01` à `07`) : recadrés SUR LEUR
CONTENU, à leur rapport naturel, avec 3 % de marge blanche. Ils sont rendus par
`BlocEtape` sur la moitié gauche de la page et SANS parallaxe, donc sans marge
de sécurité à réserver. Le canevas commun leur coûtait cher à cette taille : le
contenu d'une capture n'occupe que 70 % de la largeur du fichier, soit 30 % d'un
cadre déjà réduit de moitié, perdus en blanc.

```
python3 -c "from PIL import Image, ImageChops; \
  im=Image.open('src.png').convert('RGB'); \
  b=ImageChops.difference(im, Image.new('RGB', im.size, (255,255,255))).getbbox(); \
  m=round((b[2]-b[0])*0.03); \
  im.crop((b[0]-m, b[1]-m, b[2]+m, b[3]+m)).save('dst.png')"
```

*Exception dans la famille 2* : `05` et `06` alimentent le comparateur
avant / après, et leur cadrage est contraint par une chose que ni le recadrage
ni le choix de la source ne corrigent.

**Les deux états n'ont pas la même mise en page.** Quand le mot de passe est
accepté, « Force du mot de passe : Fort » passe sur deux lignes et pousse ce qui
suit. Mesuré au profil des lignes de contenu : l'étiquette et le champ sont
alignés au pixel, la barre de force descend de 24 px, le bloc des trois
contraintes de 48. C'est le formulaire qui bouge, pas la capture.

Le cadre garde donc l'ensemble — étiquette, champ, barre, contraintes — dans une
boîte identique, `(30, 450) → (1210, 958)`, soit 1180 × 508. Le rideau du
comparateur ne montre jamais qu'un seul état à un endroit donné : le décalage y
se lit comme du contenu qui glisse quand l'état change. Un fondu croisé a été
essayé pour supprimer la couture ; il est pire, les deux jeux de textes décalés
se lisant en même temps à mi-course.

**La source reste celle du dépôt** (1240 px de large), et non les captures
d'écran de navigateur du 2026-09-04 : leur bloc de contraintes ne porte que
188 px de contenu utile contre 376 pour l'original, elles ne réglaient pas le
désalignement — il vient du site — et coûtaient la moitié de la définition.

Contrôle d'alignement, à rejouer si l'une des deux est remplacée : le profil des
lignes de contenu doit être identique sur les deux jusqu'au champ du mot de
passe, et les écarts sous la barre doivent rester ceux mesurés ici.

**Les captures sont affichées en `object-contain`, jamais en `object-cover`.**
Le cadre porte déjà le rapport de l'image, donc les deux rendent pareil tant que
`width` et `height` sont justes. Mais `cover` rogne en silence dès qu'ils se
périment, et ce qu'il rogne sur une capture d'interface est un libellé de champ
ou un message d'erreur. `contain` laisse au pire une bande de fond : un défaut
visible se corrige, une information perdue ne se remarque pas.

`width` et `height` des entrées de galerie de `work.ts` doivent suivre le
fichier : ils fixent le rapport du cadre, et un rapport faux rogne l'image.
Contrôle de la marge blanche réelle :

```
python3 -c "from PIL import Image, ImageChops; im=Image.open('f.png').convert('RGB'); \
  print(ImageChops.difference(im, Image.new('RGB', im.size, (255,255,255))).getbbox())"
```

**Le cache d'images du serveur de développement ment après un remplacement.**
Next garde les versions optimisées dans `.next/dev/cache/images`, indexées sur
l'URL et non sur le contenu du fichier : un asset remplacé continue d'être servi
dans son ancienne version au navigateur, alors qu'un `curl` sans en-tête
`Accept` renvoie déjà la bonne. Relevé le 2026-09-04, trois vérifications
visuelles de suite passées à côté. Après toute substitution d'image :
`trash .next/dev/cache/images`.

**Pourquoi ils existent.** Les `cover.jpg` sont des captures de page d'accueil,
barre de navigation comprise. En vignette c'est ce qu'il faut, on reconnaît un
site. En fond de hero pleine largeur, elles passaient SOUS l'en-tête de ce
site-ci : deux barres de navigation, deux logos, et le titre de la page projet
par-dessus l'accroche du client. Le champ `heroBackground` de `work.ts` ne sert
qu'au hero ; les vignettes gardent la capture.

**Aucun pixel n'est inventé.** Pour Kpsull, c'est le fichier du site tel qu'il le
sert. Pour NSLysium, le fond seul (`/images/ambient/salon.jpg`) ne contenait pas
le diffuseur, qui est un objet 3D rendu dans un `<canvas>` par-dessus : prendre
ce fichier aurait retiré le produit de sa propre page projet. La capture du site
en fonctionnement, interface masquée, garde la scène ET l'objet.

**Statut de droits inchangé** : ce sont des visuels de projets clients, ils
relèvent de la même règle que les captures ci-dessus et ne sont pas libres de
droits.

## 4. Photographies sous licence libre

Les cinq visuels de la section Services, **licence Unsplash** : usage commercial
libre, sans obligation d'attribution, modification autorisée
(<https://unsplash.com/license>). Ils remplacent depuis le 2026-08-26 cinq
photos du template Framer dont la licence n'était pas traçable.

Chaque fichier est livré **en niveaux de gris**, recadré au rapport du cadre
(1,72727) en 1600 × 926, contraste sigmoïdal 3×50 %, qualité 82. Le traitement
n'est pas cosmétique : il aligne les cinq sur la langue visuelle du mécanisme
d'horlogerie du hero, et il évite qu'une couleur de photo vienne concurrencer
l'accent vert du site.

| Fichier | Prestation | Ce que ça dit | Identifiant Unsplash |
| --- | --- | --- | --- |
| `images/services/01-diagnostic.jpg` | 01 Diagnostic | Mesurer ce qui existe, précisément | `photo-1563448448467-7fc866d214bb` |
| `images/services/02-visibilite-locale.jpg` | 02 Site et visibilité locale | Un commerce trouvé dans sa rue | `photo-1775743093239-dbadae7c240a` |
| `images/services/03-outil-metier.jpg` | 03 Outil métier sur mesure | On trace avant de tailler | `photo-1497218770144-3fea6dbc33fe` |
| `images/services/04-logiciel-metier.jpg` | 04 Logiciel métier complet | Le système entier, en prise | `photo-1524514587686-e2909d726e9b` |
| `images/services/05-suivi-evolution.jpg` | 05 Suivi et évolution | Des cadrans qu'on surveille | `photo-1744302570296-d4bcb55b7002` |

L'original de chaque cliché se récupère à
`https://images.unsplash.com/<identifiant>`.

**VÉRIFIÉ le 2026-08-27, et pas seulement déclaré.** Les cinq identifiants ont
été appelés sur le CDN d'Unsplash (HTTP 200 pour les cinq), et chaque original a
été comparé au fichier servi, côte à côte en niveaux de gris. Les cinq
correspondent : même cliché, seuls le recadrage et le contraste diffèrent, comme
documenté ci-dessus. La provenance n'est donc pas une note de confiance, elle se
rejoue en une commande.

## 5. Polices et logotype

`public/fonts/` et `public/fonts.gstatic.com/` — famille **Geist**, SIL Open
Font License 1.1. C'est la seule police chargée par le site.

**Le logotype n'est pas composé, il est tracé.** Le dessin vit dans
`src/components/brand/BouquerelWordmark.tsx` (chemins en ligne, servis dans le
balisage) et dans `public/logo-bouquerel.svg` (fichier autonome, même tracé).
Origine : image générée par Gemini le 2026-08-27, fournie par Eliott, vectorisée
avec potrace 1.16 (source suréchantillonnée ×2, seuil 45 %, alphamax 0,6,
tolérance 0,4). Aucun fichier de police n'intervient, ni au rendu ni à la source.

**Ce que ça a réglé.** Le logotype précédent posait le « B » d'Eliott à côté de
huit lettres composées dans **GC Epic Pro ExtraBold, en version DÉMO**, puis
vectorisées. Cette version-là ne permettait pas la mise en ligne : la licence
(18 $, studio2am.co) restait à acheter. Elle ne l'est plus. Le monogramme
`logo-b.svg`, lui, est un dessin d'Eliott et n'a jamais posé de question.

## 6. Ce qui a été retiré

- **`public/framerusercontent.com/`** (58 Mo, ~735 fichiers) : copie complète des
  assets du template Framer, servie publiquement sous notre origine. Supprimée le
  2026-08-26. L'archive de référence hors ligne reste dans `../site/`, qui n'est
  pas un dossier servi et que les scripts `mirror:framer` / `verify:framer-mirror`
  utilisent déjà (`../site/raw-live`, `../site/offline-next`).
- **Les cinq visuels de la section Services** — remplacés, voir §4.
- **Les deux avatars des témoignages de démonstration** (`testimonials.ts`) :
  portraits d'inconnus servis sous des noms inventés. Retirés, pas remplacés.
- **Les deux glyphes sociaux du bloc newsletter du blog** : remplacés par les
  icônes locales, appariées au réseau et non à son rang (`social-icon-source.ts`).
- **L'attribut `data-source-module`** du canevas `GradientWaveBackdrop` : il
  publiait une adresse du template dans le balisage servi.
- **Les cinq SVG du starter Next** (`next.svg`, `vercel.svg`, `file.svg`,
  `globe.svg`, `window.svg`), supprimés le 2026-08-27. Ils étaient servis
  publiquement et référencés NULLE PART. Deux d'entre eux portent des marques
  déposées qui ne sont pas celles d'Eliott.

## 7. Points ouverts

- `public/audit.html` et `public/compare.html` sont des outils de développement
  servis publiquement. Ils ne portent aucun asset sous licence tierce, mais ils
  n'ont rien à faire dans un `public/` de production.
