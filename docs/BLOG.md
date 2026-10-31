# Le blog

## Où vivent les choses

| Quoi | Où |
|---|---|
| Métadonnées d'un article | `src/content/blog.ts`, tableau `blogPosts` |
| Corps d'un article | `src/content/articles/<slug>.mdx` |
| Blocs utilisables dans un corps | `src/components/blog/blocks.tsx` |
| Habillage du markdown | `src/mdx-components.tsx` |
| Gabarit de la page | `src/components/pages/blog/BlogArticlePage.tsx` |
| Contrôles automatiques | `src/content/blog.test.mjs` |

Le partage entre les deux premiers n'est pas arbitraire. Les métadonnées sont
**typées** : un article auquel il manque une description, une couverture ou une
date ne compile pas. Mises en frontmatter YAML dans le MDX, elles n'auraient
aucun contrôle — et les articles sont rédigés par un agent, pour qui le
compilateur est le relecteur le plus fiable. Le registre se lit aussi sans
compiler le moindre MDX, ce dont se servent l'index, le sitemap et les tests.

## Publier un article

1. Ajouter une entrée dans `blogPosts` (`src/content/blog.ts`).
2. Créer `src/content/articles/<slug>.mdx` avec le corps.
3. `bun run test` — l'audit vérifie la correspondance et les métadonnées.
4. Relire le rendu sur `/blog/<slug>`.

Le `slug` de l'entrée et le nom du fichier doivent coïncider : c'est ce que
vérifie le premier test, et c'est par le slug que la page charge le corps.

## Publier un article validé dans le cockpit : c'est automatique

Depuis le 2026-10-15, la routine du blog rédige, Eliott lit l'article dans le
cockpit (hub Blog, `admin.eliottbouquerel.fr/revue/blog`) et le valide. **Sa
validation vaut feu vert** : personne n'a de PR à ouvrir ni de bouton à pousser.

### Ce qui se passe après la validation

Le travail planifié `.github/workflows/publier-article.yml` tourne du lundi au
vendredi, chaque heure de 8 h à 18 h (heure de Paris en été), sur un runner
hébergé par GitHub, gratuit pour un dépôt public. Il lance
`bun scripts/publier-articles.ts --auto` (`scripts/publication.ts`), qui :

1. marque « Publié » au cockpit tout article récent du registre qui répond en
   ligne sans l'avoir encore été ;
2. s'arrête le week-end, et dès qu'un article est déjà parti aujourd'hui :
   **un article par jour ouvré**, le plus anciennement validé d'abord ;
3. écrit l'article dans le site : `src/content/articles/<slug>.mdx`, son entrée
   dans `src/content/articles-cockpit.json`, et son visuel (le SVG que le
   rédacteur a conçu et qu'Eliott a vu dans l'aperçu) rendu en trois JPG par
   `scripts/visuel-article.mjs` : héros 2400 × 1350, vignette 1200 × 1114,
   partage 1200 × 630. Un article sans visuel attend son visuel ;
4. passe les contrôles du site, du moins cher au plus cher :
   `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build` ;
5. pousse un commit sur `main`. Coolify déploie seul à chaque poussée ;
6. attend que `https://eliottbouquerel.fr/blog/<slug>` réponde 200 (20 minutes
   au plus, un relevé toutes les 10 secondes), puis marque l'article « Publié »
   au cockpit avec son adresse, et le signale à IndexNow.

Il faut au dépôt un seul secret, `COCKPIT_BLOG_TOKEN` : le jeton `blog` du
cockpit, limité à deux routes (`GET /api/agents/articles`,
`POST /api/agents/articles/:id/publication`). Il ne lit ni mails ni messages.

### Quand ça échoue

**Le site en ligne ne casse jamais.** Un contrôle rouge à l'étape 4 : rien
n'est poussé, le dossier revient à son état, l'article reste « Validé » et sa
carte au cockpit affiche le motif (la commande et ses dernières lignes). Il
repart dès qu'Eliott corrige son texte, sinon le lendemain, et il ne bloque pas
les articles suivants. Un build Coolify en échec à l'étape 6 laisse le site sur
sa version précédente ; la carte le dit, et l'article est marqué publié dès que
sa page répond. Chaque exécution reste lisible dans l'onglet Actions du dépôt.

### À la main, pour rejouer une étape

- `bun scripts/publier-articles.ts --max 1` écrit l'article validé le plus
  ancien, sans contrôle ni poussée.
- `bun scripts/publier-articles.ts --confirmer` marque publiés ceux du registre
  qui répondent en ligne.
- Onglet Actions, « Publier l'article validé », « Run workflow » : la chaîne
  complète, sans attendre l'heure suivante.
- Régler un SVG hors circuit : `bun scripts/visuel-article.mjs <fichier.svg> <dossier>`.

### Après la publication

Le sitemap (`src/app/(site)/sitemap.ts`) se régénère à chaque build : l'article
y entre avec sa date. IndexNow prévient Bing, Yandex et les autres moteurs qui
le lisent. Google n'a pas d'API d'indexation pour un article ordinaire (son
Indexing API ne vaut que pour les offres d'emploi et les diffusions en direct) :
il découvre l'article par le sitemap. Une demande d'indexation à la main dans
la Search Console reste possible, jamais nécessaire.

## L'aperçu dans le cockpit

La carte d'un article au cockpit montre la page telle qu'elle sera publiée,
rendue par le site lui-même : `/apercu/blog/<id>` (`src/app/(apercu)`), avec
`BlogArticlePage`, les composants de `mdx-components.tsx`, les blocs de
`blocks.tsx` et le sommaire. Seul le chemin du corps change.

**Un article non validé n'est jamais compilé.** Le MDX peut porter du
JavaScript ; l'aperçu lit donc le corps comme des données
(`src/lib/blog/mdx-sur.ts` : l'analyseur markdown de remark, et les six blocs
reconnus par motif, attributs lus comme des valeurs) et le rend avec les mêmes
composants (`src/components/blog/CorpsSur.tsx`). `CorpsSur.test.mjs` prouve
l'équivalence : chaque article du site rendu ainsi donne le même HTML, à
l'octet près, que sa compilation MDX.

Le site ne détient aucun secret : le cockpit signe l'adresse (dix minutes de
validité), le site transmet la signature au cockpit qui la vérifie et rend
l'article. La page n'est pas indexable (`robots`, `X-Robots-Tag`, `robots.txt`)
et ne s'affiche en cadre que dans `admin.eliottbouquerel.fr`
(`Content-Security-Policy: frame-ancestors`, `next.config.ts`). Ni bannière de
consentement ni mesure d'audience n'y tournent.

## Ce qu'un article peut contenir

Du markdown (titres, paragraphes, listes, gras, liens, code), plus **six blocs**
disponibles sans aucun `import` :

| Bloc | Usage |
|---|---|
| `<Figure src alt caption>` | image légendée, servie par l'optimiseur |
| `<Video src poster caption>` | démonstration muette en boucle |
| `<Callout title>` | remarque détachée du fil, filet d'accent |
| `<Stat value label>` | un chiffre mesuré, avec ce qu'il mesure |
| `<Steps items={[…]}>` | suite d'étapes numérotées |
| `<Quote author>` | citation, débordant dans la marge |

`![alt](chemin)` fonctionne aussi : la syntaxe markdown est redirigée vers
`Figure`, pour qu'aucune image n'échappe au format optimisé.

**Cette palette est fermée.** Un article ne peut rien importer d'autre, et
l'audit le vérifie. Trois raisons : une mise en page qui varie d'un article à
l'autre se lit comme du bricolage ; un article capable d'importer n'importe quoi
est un article capable de casser le build ; et un agent à qui on laisse une
liberté totale invente une structure par article, sans raison. La liberté porte
sur *quels blocs et dans quel ordre*.

Ajouter un bloc est un acte délibéré : on l'écrit dans `blocks.tsx`, on l'expose
dans `mdx-components.tsx`, et il est revu comme du code.

## Ce que l'audit vérifie

`src/content/blog.test.mjs`, à chaque `bun run test` :

- tout article listé a son corps, tout corps est listé ;
- les catégories du filtre correspondent à des articles publiés ;
- la description tient entre 70 et 200 caractères ;
- couverture et image de partage existent réellement dans `public/`, avec un
  texte de remplacement ;
- aucun visuel hérité du template ;
- aucun `#` de niveau 1 dans un corps (le h1 de la page est le titre) ;
- aucune image markdown sans texte de remplacement ;
- aucun `import` dans un corps ;
- un corps non vide.

C'est un test et non un script à lancer à la main : ce qu'on ne vérifie pas
automatiquement finit publié.

## Écrire un article qui serve à quelque chose

Le format ne fait pas le trafic. Google déclasse le contenu généré en volume, et
les assistants citent ce qui est spécifique et vérifiable.

Ce qui fonctionne ici est ce que personne d'autre ne peut écrire : une mission
réelle, un chiffre mesuré avec sa source, une erreur commise et ce qu'elle a
coûté. Un article par mois qui raconte un cas réel bat quinze articles sur
« pourquoi votre TPE a besoin d'un site ».

La règle du site s'applique au blog sans exception : **aucun chiffre qui ne soit
mesuré**. Un « un client sur deux » qui sonne bien et ne s'appuie sur rien vaut
moins que pas de chiffre du tout.

## Historique

Le blog est passé au MDX le 2026-08-26, en même temps que la suppression de
Payload. Avant : 26 articles de démonstration hérités du template, personas
fictifs, chiffres inventés dans les titres, et le même corps pour les 26. Le
corps d'article était un tableau de blocs typés (paragraphe, titre, liste) —
trois formes, aucune image dans le fil, aucune vidéo.

Payload aurait été le choix d'un CMS si les articles étaient écrits dans une
interface. Ils sont écrits par un agent qui a accès au disque : le formulaire
devenait un obstacle, et un schéma de collection interdisait la mise en page
variable qu'on cherchait.

## Les pages par métier

`/logiciel-metier` (le hub) et `/logiciel-metier/<metier>`. Une page est une entrée
de `src/content/metiers.json`, relue par `src/content/metiers.ts` : ajouter l'entrée
suffit à la publier sur le hub, au sitemap, à `llms.txt` et dans le maillage.

Le visuel : un SVG dans la même grammaire que ceux du blog (`docs/visuels-metiers/`),
rendu par `rendreVisuelMetier` de `scripts/visuel-article.mjs`. Le sujet du dessin se
place à gauche : le titre occupe la moitié droite du héros.

**Une page n'est publiée que si son contenu est propre au métier.** `motifsDeRefus`
refuse moins de quatre blocs, une seule nature de bloc, moins de six mots du métier,
un mot du lexique absent du texte, un paragraphe repris, le même enchaînement de
blocs qu'une autre page, plus de 5 % de suites de trois mots communes avec une autre.
`metiers.test.mjs` fait rougir `bun run test` dès qu'une entrée est refusée.

Le maillage se calcule : `themes` donne les voisins et les articles. Une page ne
cite jamais une autre page à la main. Aucun montant dans le fichier : le prix vient
d'`offre.ts` au rendu.

Le branchement au circuit de publication (cockpit, `routine-blog`) n'est pas fait :
il attend la décision d'Eliott (`~/vault/wiki/business/metiers-file-editoriale.md`).
