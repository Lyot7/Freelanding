import type { Link } from "@/lib/content/types";

/**
 * Glyphes des réseaux sociaux, en SVG INLINE.
 *
 * POURQUOI INLINE, ET PAS UN FICHIER SERVI PAR `<img>`. C'est la correction d'un
 * défaut visible en production : le glyphe GitHub sortait NOIR SUR NOIR dans le
 * pied de page. Les fichiers étaient dessinés en `fill="currentColor"`, ce qui
 * est juste, mais un SVG chargé par `<img>` est un document isolé : il n'hérite
 * d'aucune couleur de la page, et `currentColor` y retombe sur le noir par
 * défaut. Sur un pied de page presque noir, l'icône disparaissait.
 *
 * CE QU'UNE COULEUR ÉCRITE EN DUR N'AURAIT PAS RÉGLÉ. Les mêmes glyphes servent
 * à deux endroits aux fonds opposés : le pied de page, sombre, où il les faut
 * clairs, et la pastille ronde du bloc newsletter du blog, en `rgb(245,245,245)`,
 * où il les faut sombres. Un `fill="#fff"` dans le fichier aurait déplacé le
 * défaut au lieu de le supprimer. Inline, `currentColor` fonctionne : chaque
 * hôte pose sa couleur de texte et le glyphe suit.
 *
 * Effet de bord favorable : deux requêtes HTTP en moins, et la règle
 * `@next/next/no-img-element` cesse d'être enfreinte à cet endroit.
 *
 * PROVENANCE DES TRACÉS. Les marques GitHub, LinkedIn et Strava sont les
 * logotypes officiels de ces sociétés, redessinés à l'identique en un seul
 * chemin sur une grille de 24. Ils sont utilisés ici pour ce à quoi ils servent,
 * signaler un lien vers le profil d'Eliott sur ces plateformes, ce que les
 * chartes des trois autorisent. Ils restent leur propriété, ils ne sont ni
 * modifiés ni recolorés hors du monochrome que ces chartes prévoient.
 */

/** Un tracé par réseau, apparié au LABEL du lien et jamais à son rang. */
const TRACES: Record<string, string> = {
  GitHub:
    "M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z",
  LinkedIn:
    "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0Z",
  /*
   * LES DEUX CHEVRONS SONT UN SEUL CHEMIN, ET LE SECOND N'EST PAS FERMÉ.
   * Une première version terminait le grand chevron par un `Z` : le tracé se
   * refermait sur lui-même et la forme sortait PLEINE au lieu d'être évidée,
   * ce qui donnait un triangle massif à la place de la marque. Invisible à
   * 14 px, flagrant à 48. Vérifié par comparaison côte à côte avec le
   * logotype officiel avant d'être posé ici.
   */
  Strava:
    "M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169",
};

/**
 * Repli : un maillon de chaîne.
 *
 * Il est volontaire et il le reste. Il évite d'avoir à réunir la marque de
 * chaque réseau qu'Eliott ajouterait ensuite, et surtout d'aller la chercher là
 * où sa licence n'est pas claire. Un lien sans glyphe dédié sort avec un
 * maillon, ce qui reste lisible.
 */
const REPLI = [
  "M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5",
  "M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5",
];

export function SocialGlyph({
  social,
  className,
}: {
  social: Link;
  className?: string;
}) {
  const trace = TRACES[social.label];

  if (!trace) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden
        className={className}
      >
        {REPLI.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={trace} />
    </svg>
  );
}
