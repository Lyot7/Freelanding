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
