/**
 * SvgSprite — définitions SVG partagées, montées une seule fois par document.
 *
 * IL N'EN RESTE QU'UNE. Le sprite reproduisait VERBATIM les 13 symboles cachés
 * du template Framer, référencés par `<use href="#id">` dans les sections. Un
 * seul l'était encore : le bouton de lecture du showreel. Les douze autres
 * étaient morts, et la moitié portait des dessins qui ne sont pas ceux de ce
 * site — le logo Framer à trois parallélogrammes en trois tailles, la signature
 * manuscrite du template, ses marques et ses flèches. Du code mort qui n'aurait
 * rien cassé en restant, mais qui gardait sous la main des dessins dont ce site
 * n'a ni l'usage ni la licence.
 *
 * Ce qui les a remplacés : `@/components/brand/BrandB` pour le monogramme,
 * `@/components/layout/Logo` pour le logotype, `sections/SignatureMark` pour le
 * paraphe d'Eliott, et des icônes redessinées localement pour le reste.
 *
 * `dangerouslySetInnerHTML` est conservé : les attributs restants
 * (`stroke-width`, `stroke-linecap`) sont du HTML, pas du JSX.
 */

const SPRITE_HTML = `
<svg width="28" height="28" viewBox="0 0 28 28" fill="none" id="svg-1811528748_216">
<circle cx="14" cy="14" r="14" fill="#0B0B0B"/>
<path d="M19 14L11.5 18.3301L11.5 9.66987L19 14Z" fill="white"/>
</svg>
`;

export function SvgSprite() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
      }}
      dangerouslySetInnerHTML={{ __html: SPRITE_HTML }}
    />
  );
}
