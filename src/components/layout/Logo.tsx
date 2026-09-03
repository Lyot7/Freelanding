import Link from "next/link";
import { BouquerelWordmark } from "@/components/brand/BouquerelWordmark";
import { uiLabels } from "@/content/ui";
import type { SiteConfig } from "@/lib/content/types";

interface LogoProps {
  brand: SiteConfig["brand"];
  className?: string;
}

/**
 * Logotype « Bouquerel » du chrome — en-tête et pied de page.
 *
 * CE QU'IL REMPLACE. Le dessin précédent composait un B tracé par Eliott avec
 * huit lettres de GC Epic Pro ExtraBold, en version DÉMO : sa mise en ligne
 * exigeait l'achat de la licence. Le tracé actuel (cf. `BouquerelWordmark`)
 * n'est dérivé d'aucun fichier de police, la question de la licence tombe.
 *
 * Le dessin vit dans `BouquerelWordmark`. Ici on ne décide QUE de sa taille et
 * de sa couleur, pour que le chrome et le hero puissent diverger sans dupliquer
 * 6 Ko de chemins.
 *
 * BLANC ici, volt dans le hero. Le chrome est le repère neutre, présent sur
 * toutes les pages et sur des fonds variables ; l'accent est réservé au seul
 * endroit où le nom EST le sujet de la page.
 *
 * Le ® reste un nœud de texte à part : il vient de la donnée (`brand.mark`), il
 * n'a pas à être gravé dans le dessin, et Eliott peut le retirer sans toucher au
 * logotype. Le nom accessible vient lui aussi de la donnée.
 */
export function Logo({ brand, className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${brand.name}${brand.mark}${uiLabels.chrome.logoHomeSuffix}`}
      aria-current="page"
      className={`relative flex flex-none flex-row items-start justify-start gap-[3px] overflow-visible no-underline ${className ?? ""}`}
    >
      {/* Hauteur de BOÎTE, pas de capitale. La capitale vaut 63,6 % de la
          boîte (cf. `BouquerelWordmark`) : 24 px de boîte donnent 15,25 px de
          capitale, soit la hauteur exacte du logotype précédent, entièrement en
          capitales. Le mot occupe 115 px de large, contre 164 avant : le
          dessin est plus compact à hauteur d'œil égale. */}
      <BouquerelWordmark className="block h-[24px] w-auto flex-none text-foreground" />
      {/* 4 px de retrait haut sur le ® : la boîte du logotype commence au
          sommet de l'ASCENDANTE (le « l »), la capitale ne débute qu'à 66/376
          de la boîte, soit 4,2 px à 24 px de haut. Sans ce retrait le ® flotte
          au-dessus de la ligne de capitale au lieu de s'y aligner, comme il le
          faisait sur le logotype tout en capitales. */}
      {brand.mark ? (
        <span
          aria-hidden
          className="relative mt-[4px] block text-[9px] font-bold leading-none text-foreground"
        >
          {brand.mark}
        </span>
      ) : null}
    </Link>
  );
}
