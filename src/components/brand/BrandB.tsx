/**
 * Monogramme « B » d'Eliott — SOURCE UNIQUE du tracé.
 *
 * Le même dessin vit dans `public/logo-b.svg` (fichier autonome, servi tel quel
 * aux usages hors React : favicon, partage, courriel). Le tracé ci-dessous en
 * est la copie exacte, vérifiée caractère par caractère : `scripts/logo-b-audit.mjs`
 * échoue si les deux divergent. Un précédent copier-coller à la main n'avait
 * repris que 685 des 1223 caractères, et le B rendu était tronqué sans que rien
 * ne le signale.
 *
 * DEUX CADRAGES, un seul tracé :
 *  - `padded` (défaut) — le carré de 1024 du fichier, marges comprises (environ
 *    18 % de chaque côté). C'est le cadrage à employer quand le B est posé dans
 *    une pastille ou un cercle, qui ont besoin de cette respiration.
 *  - `tight` — la boîte d'encre seule, mesurée sur le tracé : x 182,6 · y 191 ·
 *    660,6 × 642, soit un rapport de 1,029. C'est le cadrage des usages où la
 *    géométrie est commandée par le voisinage (un coin, une ligne de texte), et
 *    où des marges invisibles fausseraient l'alignement.
 *
 * La couleur vient de `currentColor` : le composant ne décide jamais de sa
 * teinte, c'est le contexte qui la porte.
 */

/** Boîte d'ENCRE du tracé, en coordonnées du viewBox. Mesurée par `getBBox`. */
const ENCRE = "183 191 661 642";

export function BrandB({
  className = "",
  cadrage = "padded",
  title,
}: {
  className?: string;
  /** `tight` cadre sur l'encre, `padded` garde le carré du fichier. */
  cadrage?: "tight" | "padded";
  /** Nom accessible. Sans lui, la marque est purement décorative. */
  title?: string;
}) {
  return (
    <svg
      viewBox={cadrage === "tight" ? ENCRE : "0 0 1024 1024"}
      className={className}
      fill="currentColor"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <g transform="translate(0,1024) scale(0.1,-0.1)">
        <path d="M1850 8315 l-12 -15 119 -142 c65 -79 238 -287 383 -463 145 -176 316 -382 378 -457 l115 -138 1686 0 c1015 0 1724 -4 1781 -10 139 -14 223 -36 327 -86 l93 -44 59 -58 c65 -64 102 -128 126 -223 l17 -64 -5 -135 -5 -135 -22 -65 c-107 -314 -343 -492 -740 -559 l-123 -21 -622 0 -623 0 -11 -13 c-10 -13 -51 -141 -84 -267 -8 -30 -58 -206 -112 -390 -139 -480 -133 -458 -122 -469 8 -8 217 -11 651 -11 353 0 725 -5 827 -10 l185 -10 95 -24 c235 -59 369 -174 420 -361 l22 -80 -6 -115 c-20 -415 -264 -672 -740 -777 l-122 -27 -1098 -3 -1099 -4 6 18 c3 10 17 59 31 108 44 150 191 661 285 985 80 277 200 692 300 1035 21 72 90 310 154 530 63 220 142 492 175 605 l60 205 -12 12 -12 13 -679 0 -680 1 -16 -18 c-10 -10 -22 -36 -27 -58 -6 -22 -67 -233 -136 -470 -69 -236 -223 -765 -342 -1175 -119 -410 -247 -851 -285 -980 -37 -129 -96 -332 -130 -450 -34 -118 -117 -404 -185 -635 -67 -231 -155 -534 -196 -673 l-73 -253 15 -14 15 -15 1973 0 1973 0 142 16 c543 60 1040 238 1406 503 435 315 699 764 776 1316 l16 120 -5 190 -5 190 -21 85 c-65 258 -156 427 -315 585 -79 79 -204 175 -298 229 -27 16 -48 31 -48 34 1 4 42 31 93 60 504 290 800 721 873 1272 l16 125 -6 137 c-11 251 -57 433 -157 628 -256 501 -808 830 -1535 915 l-129 15 -2371 0 -2372 0 -12 -15z" />
      </g>
    </svg>
  );
}
