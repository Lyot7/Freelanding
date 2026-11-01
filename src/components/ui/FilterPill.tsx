import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * FilterPill — puce de filtre des listings `/work` et `/blog`.
 *
 * La source n'a qu'UN composant pour les deux pages (`.framer-n8xfn3`), d'où
 * cette primitive partagée. Contrat relevé dans le CSS du miroir, sans aucune
 * media-query, donc identique aux trois bandes :
 *
 *   height 30px · padding 10px · gap 10px · width min-content
 *   texte 12px / 500 / -0.01em / 120% / uppercase / white-space:pre
 *   actif   : fond #fff, texte #0b0b0b, bordure rgba(255,255,255,0)
 *   inactif : fond transparent, texte #fff, bordure rgba(255,255,255,0.12)
 *
 * Le filet de 1px est un `::after` en position absolue sur la source : il ne
 * prend PAS de place dans le flux. Le reproduire avec `border` élargirait la
 * puce de 2px, d'où l'ombre interne.
 */
export interface FilterPillProps
  extends Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> {
  children: ReactNode;
  active: boolean;
  className?: string;
}

export function FilterPill({
  children,
  active,
  className,
  ...rest
}: FilterPillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={
        // `cursor-pointer` : sur la source ces puces sont des `div` porteuses de
        // `cursor: pointer` (relevé à 1440 sur /work, où les cinq puces sont en
        // `pointer` côté source et étaient en `default` chez nous). Un `<button>`
        // rend `cursor: default` par défaut, donc le pointeur ne changeait pas
        // de forme au survol d'un filtre alors qu'il change sur la source.
        // La primitive est partagée avec /blog, qui hérite donc du même correctif.
        // Aucun style de focus ici : il est porté par `src/app/focus.css`.
        // Voir en revanche `--focus-shadow-keep` plus bas, indispensable au
        // filet interne de la puce inactive.
        "flex h-[30px] w-min cursor-pointer items-center gap-[10px] whitespace-pre px-[10px] " +
        "text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] " +
        "transition-colors duration-200 motion-reduce:transition-none " +
        // AUCUN état de survol : la source n'en a pas. Deux preuves
        // concordantes. Le CSS de l'archive ne contient qu'une règle pour ce
        // composant (`.framer-2hgsk.framer-n8xfn3`), sans `:hover`. Et la mesure
        // en pixels sur `/live-proxy/blog` à 1440, pointeur amené au centre de
        // chaque puce et chaîne `:hover` vérifiée jusqu'à `.framer-n8xfn3` :
        // 0 % de pixels changés sur quatre puces, 0,64 % sur la cinquième — du
        // bruit. Le filet passait ici de 12 % à 45 % de blanc au survol, un état
        // inventé.
        // `--focus-shadow-keep` recopie le filet interne : l'anneau global
        // remplace `box-shadow` sur l'élément focalisé, et sans cette variable
        // la puce inactive perdrait son contour de 1px pendant le focus. La
        // variable est lue par `:focus-visible` dans `src/app/focus.css`.
        (active
          ? "bg-foreground text-background"
          : "bg-transparent text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] " +
            "[--focus-shadow-keep:inset_0_0_0_1px_rgba(255,255,255,0.12)]") +
        (className ? ` ${className}` : "")
      }
      {...rest}
    >
      {children}
    </button>
  );
}
