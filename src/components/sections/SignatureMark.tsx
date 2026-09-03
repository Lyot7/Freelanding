/**
 * Le paraphe manuscrit d'Eliott, vectorisé — SOURCE UNIQUE du dessin.
 *
 * POURQUOI CE FICHIER EXISTE : le tracé vivait dans `hero/Signature.tsx`, et la
 * section tarifs en affichait un AUTRE, resté du template (viewBox 452×133,
 * le vecteur Framer d'origine). Le site montrait donc deux paraphes différents,
 * dont un qui n'était pas celui d'Eliott, à deux endroits où le lecteur croit
 * voir la même signature. Rien ne pouvait le signaler : les deux fichiers
 * étaient corrects isolément.
 *
 * Le `transform` du groupe vient de potrace, qui trace en repère mathématique
 * (Y vers le haut) : il remet le dessin dans le repère SVG.
 */

/** Rapport du cadre, utile pour dimensionner sans déformer. */
export const SIGNATURE_VIEWBOX = { width: 1250, height: 324 } as const;
export const SIGNATURE_RATIO =
  SIGNATURE_VIEWBOX.width / SIGNATURE_VIEWBOX.height;

export function SignatureMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIGNATURE_VIEWBOX.width} ${SIGNATURE_VIEWBOX.height}`}
      className={className ?? "block h-full w-full overflow-visible"}
      aria-hidden
    >
      <g
        transform="translate(0,324) scale(0.125,-0.125)"
        fill="var(--mark, var(--accent))"
        stroke="var(--mark, var(--accent))"
        strokeWidth={1.4}
        strokeLinejoin="round"
        /* ÉPAISSISSEMENT du trait, et pourquoi il ne s'échelonne PAS.
           Le tracé vectorisé est un CONTOUR rempli : sa graisse suit la taille
           du cadre. Or le cadre passe de 452 px sur desktop à 165 en mobile,
           donc le trait y tombe sous le pixel et se délave.
           `non-scaling-stroke` fige la largeur du contour en pixels ÉCRAN : les
           1,4 px s'ajoutent identiquement aux deux tailles, ce qui remonte le
           mobile sans alourdir le desktop. */
        vectorEffect="non-scaling-stroke"
      >
        <path d="M4676 2589 c-4 -2 -91 -8 -192 -13 -101 -5 -245 -14 -320 -20 -75 -7 -228 -16 -340 -20 -418 -16 -535 -27 -968 -93 -700 -105 -817 -133 -993 -231 -121 -69 -126 -88 -6 -28 172 87 310 119 915 212 588 90 849 110 468 36 -1543 -298 -2749 -851 -2632 -1205 32 -95 125 -184 280 -267 102 -54 112 -61 97 -71 -6 -4 -107 -37 -224 -73 -389 -120 -716 -231 -740 -251 -99 -79 127 -55 1168 127 l248 44 140 -41 c378 -109 590 -147 1815 -323 323 -46 706 -102 851 -124 1288 -196 2344 -296 2468 -233 49 26 54 36 24 61 -88 74 -317 145 -1545 479 -1009 275 -1245 354 -1326 442 -35 38 -40 61 -20 99 15 30 4 27 260 60 1535 195 2811 276 4356 276 833 0 1089 -18 1470 -102 59 -13 82 -11 65 6 -9 10 -137 39 -292 67 -731 135 -2845 103 -4547 -67 -327 -33 -995 -109 -1158 -132 -16 -2 -31 -1 -34 3 -6 11 135 89 272 151 62 28 182 86 268 127 181 88 119 74 744 171 1190 185 1475 253 1615 387 77 74 65 166 -33 238 -188 137 -735 266 -1246 295 -153 8 -894 19 -908 13z m808 -61 c417 -8 589 -29 890 -108 436 -116 589 -231 466 -354 -129 -129 -470 -207 -1724 -393 -150 -23 -284 -43 -298 -45 -42 -7 -31 9 35 50 298 187 404 334 347 484 -52 137 -313 257 -696 318 -178 29 -174 32 54 44 212 12 491 13 926 4z m-1108 -67 c847 -118 1034 -372 524 -711 -200 -132 -227 -145 -353 -165 -2033 -316 -2580 -420 -3277 -617 -209 -59 -186 -59 -311 5 -158 80 -269 170 -300 241 -170 396 1494 1043 3245 1262 123 15 295 10 472 -15z m124 -933 c-7 -11 -98 -57 -254 -127 -145 -66 -252 -123 -323 -174 -59 -42 -50 -40 -407 -91 -513 -75 -1091 -170 -1856 -307 -240 -43 -240 -43 -340 -8 -187 64 -189 65 -94 94 496 151 1210 294 2470 497 319 51 618 100 664 108 99 17 147 19 140 8z m-695 -434 c-16 -55 -15 -61 13 -100 77 -103 313 -186 1350 -470 474 -130 1159 -326 1288 -369 302 -101 300 -111 -18 -105 -472 10 -1178 88 -2146 238 -88 14 -560 82 -1048 152 -958 137 -1098 159 -1323 209 -240 53 -374 92 -360 106 16 17 2115 354 2214 356 32 1 35 0 30 -17z m-2613 -271 c64 -24 111 -45 110 -50 -4 -10 -242 -54 -752 -141 -342 -57 -370 -61 -362 -49 8 14 838 280 874 281 10 0 68 -19 130 -41z" />
      </g>
    </svg>
  );
}
