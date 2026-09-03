import type { ReactNode } from "react";

/**
 * SwapCopies — les deux copies d'un libellé qui permutent verticalement au
 * survol du parent (`group`). PRIMITIVE UNIQUE de la permutation : `SwapText`
 * n'est plus qu'un adaptateur qui pose le cadre clippant autour d'elle.
 *
 * TROIS MOTIFS, et trois seulement, relevés image par image sur `/live-proxy`
 * (`swap-inv` sur `/`, `/work`, `/work/box-mode`, `/about`, `/blog`,
 * `/blog/stop-hiding-your-prices`, `/contact` à 1440, puis relevé rAF du survol,
 * trois passes par motif) :
 *
 *   22 px vers le HAUT, fondu croisé, 320 ms — `.framer-1sk0ilg`, le bouton
 *     générique du template : CTA « START A PROJECT » du header et du panneau
 *     flottant, « Ask a question », « Get started », « See more »,
 *     « All articles », « Live project ». Copie en attente à `top: 22px`.
 *   12 px vers le BAS, fondu croisé, 430 ms — `.framer-yuvr8`, le bouton
 *     d'envoi de formulaire : « Send message » (contact et pied), « Subscribe ».
 *     Copie en attente à `top: -12px`.
 *   18 px vers le BAS, AUCUN fondu, 430 ms — `.framer-xh8ae`, le crédit du
 *     pied « Built in Framer ». Copie en attente à `top: -18px`, et les DEUX
 *     copies restent à `opacity: 1` du début à la fin : c'est le cadre qui fait
 *     tout le travail. Relevé : 0 % de variation d'opacité sur 800 ms.
 *
 * La course NE DÉPEND PAS de la taille du libellé : 22 px pour un texte de
 * 14,41 px, 12 px pour un texte de 15,59 px, 18 px pour un texte de 13,2 px.
 * C'est une valeur d'auteur par composant Framer, jamais un pourcentage. Le
 * `translate-y-[140%]` employé auparavant par `SwapText` donnait 20,15 px sur
 * un libellé de 14,4 px, soit 1,85 px de trop.
 *
 * Le parent doit porter `group` ainsi qu'une boîte `overflow-hidden` à la
 * hauteur d'une ligne : c'est elle qui masque la copie en attente. Il n'a PAS à
 * être `relative` — la référence de la copie garée est posée ici même, voir
 * ci-dessous.
 *
 * Les classes sont des littéraux et non des calculs : Tailwind ne génère que
 * celles qu'il voit écrites en toutes lettres dans le source.
 */

/**
 * Courbe MESURÉE sur le live, par ajustement des moindres carrés d'un relevé rAF
 * du survol contre huit candidates. Sur les trois motifs et sur toutes les
 * passes, `cubic-bezier(0.68,0,0,1)` gagne d'un ordre de grandeur : erreur
 * quadratique de 0,0026 à 0,0049 de la course, contre 0,015 pour la suivante
 * (0.76,0,0.24,1), 0,020 pour (0.8,0,0.2,1) et 0,033 pour la symétrique
 * (0.44,0,0.56,1). C'est déjà la courbe de l'entrée du header chez Framer.
 * Elle place 50 % de la course à ~39 % du temps, puis étire une longue queue.
 */
const EASE = "ease-[cubic-bezier(0.68,0,0,1)]";

/**
 * Un motif par course : le sens, la durée et la présence du fondu sont dictés
 * par la course elle-même, puisque chaque valeur identifie un composant Framer.
 * Durées relevées, écart type de 2 ms sur trois passes : 320 ms (321 mesuré) et
 * 430 ms (429,5 mesuré). Étalonnage du harnais : notre `duration-300` déjà en
 * place se relit 298 ms par la même chaîne de mesure, le biais est nul.
 */
const TRAVEL = {
  22: {
    shift: "group-hover:-translate-y-[22px]",
    offset: "top-[22px]",
    duration: "duration-[320ms]",
    fade: true,
  },
  12: {
    shift: "group-hover:translate-y-[12px]",
    offset: "top-[-12px]",
    duration: "duration-[430ms]",
    fade: true,
  },
  18: {
    shift: "group-hover:translate-y-[18px]",
    offset: "top-[-18px]",
    duration: "duration-[430ms]",
    fade: false,
  },
} as const;

/** Courses admises, c'est-à-dire les trois motifs relevés sur la source. */
export type SwapTravel = keyof typeof TRAVEL;

export function SwapCopies({
  travel,
  textClassName = "",
  children,
}: {
  /** Course verticale en px, relevée sur le live. Détermine aussi sens et durée. */
  travel: SwapTravel;
  /** Typographie du libellé (taille, graisse, couleur…). */
  textClassName?: string;
  children: ReactNode;
}) {
  const { shift, offset, duration, fade } = TRAVEL[travel];
  // `translate` et NON `transform` dans la liste des propriétés animées.
  // Tailwind 4 compile `-translate-y-[22px]` en `translate: var(--tw-translate-x)
  // var(--tw-translate-y)`, jamais en `transform`. La liste précédente
  // (`transform,opacity`) ne couvrait donc PAS le glissement : relevé image par
  // image sur notre CTA de header, la copie sortante sautait de dy 7,8 à -14,2
  // dès la première image alors que la source parcourt les mêmes 22 px sur toute
  // la durée. Seule l'opacité fondait, d'où un swap sec au lieu d'un glissement.
  const base = `block whitespace-pre transition-[translate,opacity] ${duration} ${EASE} motion-reduce:transition-none ${textClassName}`;
  // Sans fondu (motif du crédit du pied), les deux copies restent opaques : seul
  // le cadre clippant décide de ce qui se voit, exactement comme sur la source.
  const sortante = fade ? "group-hover:opacity-0" : "";
  const entrante = fade ? "opacity-0 group-hover:opacity-100" : "";

  return (
    /*
     * LA RÉFÉRENCE DE LA COPIE GARÉE EST POSÉE ICI, et pas sur le parent.
     *
     * `top: 22px` se mesure depuis la boîte de REMPLISSAGE de l'ancêtre
     * positionné. Tant que le parent n'a pas de remplissage haut, cette boîte
     * commence au haut du texte et les deux copies se superposent exactement
     * après la course. Dès qu'il en a un, la copie garée se gare 22 px sous le
     * haut du REMPLISSAGE alors que la copie en flux, elle, commence après lui :
     * le libellé atterrit donc trop haut de tout le remplissage.
     *
     * MESURÉ sur le CTA « DÉMARRER UN PROJET » du header, qui porte
     * `.accent-room` (remplissage haut de 0,32em, soit 5,12 px à 12 px de
     * corps) : libellé au repos à y = 38,3, libellé après survol à y = 33,1.
     * 5,2 px d'écart, soit exactement ce remplissage — le texte sautait vers le
     * haut au survol et n'était plus centré dans son bouton.
     *
     * L'enveloppe ci-dessous suit le flux, donc son haut coïncide avec le haut
     * du texte quoi que fasse le parent. Elle ne clippe rien : le masque reste
     * le cadre `overflow-hidden` du parent.
     */
    <span className="relative block">
      {/* Copie visible au repos : glisse hors du cadre. */}
      <span className={`${base} ${shift} ${sortante}`}>{children}</span>
      {/* Copie en attente hors du cadre : prend la place laissée libre. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 ${offset} ${base} ${shift} ${entrante}`}
      >
        {children}
      </span>
    </span>
  );
}
