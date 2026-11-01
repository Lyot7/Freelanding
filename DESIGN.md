# DESIGN — eliottbouquerel.fr

Référence : la carte de visite et les bannières d'Eliott. Le site suit la carte de visite, plus le gabarit d'origine. Aucune section ne reprend la composition de sa voisine.

## Couleurs (jetons de `globals.css`)
- Noir `--background #0b0b0b` · Blanc `--foreground #ffffff`, pour le texte seulement.
- Volt `--accent #c8f24a` · Encre `--accent-ink #10140a`, le texte posé sur le volt.
- Papier `--muted #eff0e9` (texte encre à 16,25:1) · Volt lu sur papier `--volt-texte #55700c` (4,94:1). Le volt pur n'y est jamais lisible.
- Aucune couleur en dur dans un composant.

## Typographie
- Titres : `.titre-marque`, Geist 900, capitales, -0.045em, interligne 0,96 pour laisser passer le É. 0,86 toléré sur un titre sans accent ni Q.
- H2 : `.titre-section`, une seule échelle, `clamp(40px, 12vw, 52px)` sous 810 puis `clamp(48px, 6vw, 92px)`, chaque vw divisé par `--zoom-ecran`.
- Micro-libellés : `.micro`, Geist Mono 500, 11 px, capitales, 0.14em, avec la parenthèse de la carte : « (FAQ) ».
- Texte courant : Geist, casse normale.
- Échelle : 11, 12, 14, 16, 18, 22, 26, 40, 58, 92, plus le clamp du H1. Interlettrage : -0.045em, -0.01em, 0.14em.

## Formes et matière
- Angles droits. Ronds réservés aux avatars et aux flèches.
- Mécanisme d'horlogerie. Grain à deux valeurs : `matiere="photo"` 0.07, noir 0.09.
- Photos et écrans réels uniquement. Interdits : banque d'images, détourage volt, `marque/portrait.png` qui porte le filigrane Gemini.

## Règles d'usage
- Une face volt par page au plus. Ailleurs le volt ponctue. Un seul volt plein par écran.
- `.cta-primaire` : volt sur noir, encre sur papier ou sur volt. `.cta-secondaire` : contour. `.cta-lien` : texte et flèche. Le blanc plein n'est jamais un bouton.
- Traits de coupe hors du héros, au plus deux fois par page.
- Rythme : `--section-y`, 60 px puis 90 px dès 810 ; 30 px seulement là où une bande colorée le justifie.

## Motion
- Motion 12 et CSS, défilement doux Lenis. `prefers-reduced-motion` et `estProfilLeger` sur chaque animation.

## Responsive
- Breakpoints min-width : tablet 810, desktop 1200. Tout se vérifie sur rendu réel à 390.
