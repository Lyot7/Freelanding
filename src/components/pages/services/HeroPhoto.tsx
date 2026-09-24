import type { CSSProperties } from "react";
import Image from "next/image";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import type { CreditPhoto, ImageHero } from "@/lib/content/types";

/**
 * Photo de fond d'un héros de prestation, avec les voiles qui gardent le texte
 * blanc lisible par-dessus.
 *
 * MÊME MONTAGE QUE LE HÉROS DE `/a-propos` : l'image en `fill` dans un calque
 * qui dérive au scroll (`0,15 x scrollY`, la loi relevée sur la source pour
 * tous les fonds de héros), le débord absorbé par l'`overflow-clip` du calque.
 * Deux écarts, voulus :
 *   - le calque n'est PAS `decorative` : la photo porte un texte alternatif,
 *     elle montre la ville dont parle la page ;
 *   - ni `grayscale` ni voile sur toute l'image : le ciel d'été et le contour
 *     vert de l'église sont le sujet, ils gardent leurs couleurs.
 *
 * LES VOILES NE COUVRENT QUE LE TEXTE. Un voile plat assombrissait aussi le
 * ciel et la flèche, qui ne portent aucun texte. Chaque dégradé est donc posé
 * sous une zone de texte précise : la navigation en haut, le fil d'Ariane, la
 * colonne du titre (à partir de 810 px) et le bas du héros, où tombent le
 * chapô, la fourchette et le crédit. Sur mobile, le texte occupe toute la
 * largeur sous la flèche : un seul dégradé monte du bas jusqu'au fil d'Ariane.
 * Le fil, le chapô et la fourchette portent en plus leur propre voile
 * (`VOILE_TEXTE`).
 *
 * MESURÉ AU RENDU le 2026-09-24, texte masqué et sans ombre, pire pixel sous
 * chaque boîte, à 375, 810, 1200 et 1440 px : titre 3,8:1 au plus bas (3 requis
 * pour un grand texte), fil d'Ariane 5,0:1, chapô 6,6:1, fourchette 5,3:1,
 * crédit 6,7:1, en-tête 5,1:1. La flèche tombe à 34 % de la largeur à partir
 * de 810 px. Le titre reste surveillé par `bun run audit:contraste-hero`.
 * Alléger un voile, c'est remesurer.
 *
 * `--elargi` : débord à gauche de l'image à partir de 810 px (voir
 * `ImageHero.elargissement`). `sizes` suit la largeur RÉELLE de l'image, pas
 * celle de l'écran : sur mobile, en `object-cover` dans un cadre plus haut que
 * large, elle est peinte sur environ 1,8 fois la hauteur de l'écran, et un
 * `100vw` y servait une variante de 640 px étirée plus de deux fois.
 */
/**
 * Voile collé à un bloc de texte posé sur la photo : un aplat sombre flouté,
 * en pseudo-élément derrière le texte, qui déborde un peu de sa boîte et
 * s'efface sur les bords. Il suit le bloc à toutes les largeurs, là où un
 * dégradé calé sur le cadre tombait à côté dès que le texte changeait de place.
 * Le bloc doit avoir la largeur de son texte (`w-fit`), sinon le voile couvre
 * toute la colonne, flèche comprise.
 */
export const VOILE_TEXTE =
  "relative w-fit before:pointer-events-none before:absolute before:-inset-x-[44px] before:-inset-y-[26px] before:-z-10 before:bg-black/80 before:blur-[32px] before:content-['']";

export function HeroPhoto({ image }: { image: ImageHero }) {
  const style = {
    "--elargi": `${image.elargissement ?? 0}%`,
  } as CSSProperties;
  return (
    <>
      <ScrollParallax
        factor={0.15}
        className="pointer-events-none absolute inset-0 z-0 overflow-clip"
      >
        <div
          style={style}
          className="absolute inset-y-0 left-0 right-0 tablet:left-[calc(var(--elargi)*-1)]"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            preload
            fetchPriority="high"
            sizes="(min-width: 1200px) 130vw, (min-width: 810px) 150vh, 180vh"
            className="object-cover"
            style={{ objectPosition: `${image.cadrage.x}% ${image.cadrage.y}%` }}
          />
        </div>
      </ScrollParallax>
      {/* Navigation, en haut, sur toutes les largeurs. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[150px] bg-gradient-to-b from-black/60 via-black/30 to-transparent"
      />
      {/* Logo et accroche de l'en-tête, en haut à gauche : du texte à 60 %
          de blanc sur le ciel, que le dégradé du haut ne suffit pas à tenir. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[60px] -top-[30px] z-[1] h-[150px] w-[520px] bg-[radial-gradient(closest-side,rgba(0,0,0,.6),transparent)]"
      />
      {/* Mobile : du bas jusqu'au fil d'Ariane. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_top,#0b0b0b_0%,rgba(11,11,11,.8)_35%,rgba(0,0,0,.5)_58%,transparent_70%)] tablet:hidden"
      />
      {/* À partir de 810 px : le bas (chapô, fourchette, crédit)… */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden bg-[linear-gradient(to_top,#0b0b0b_0%,rgba(11,11,11,.8)_20%,transparent_45%)] tablet:block"
      />
      {/* … et la colonne du titre, à droite, sous le ciel qui reste dégagé. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden bg-[linear-gradient(to_left,rgba(0,0,0,.6)_0%,rgba(0,0,0,.55)_45%,rgba(0,0,0,.4)_52%,transparent_61%)] [mask-image:linear-gradient(to_bottom,transparent_10%,black_30%)] tablet:block"
      />
    </>
  );
}

/**
 * Crédit de la photo, en petit dans le coin bas du héros.
 *
 * Les liens sortent du site : nouvel onglet, comme tout lien externe du site
 * (`bun run audit:liens`).
 */
export function CreditHeroPhoto({
  credit,
  position = "bottom-[16px] right-[20px] tablet:right-[24px] desktop:right-[30px]",
}: {
  credit: CreditPhoto;
  /** Place dans le héros. Un article le remonte : l'encoche claire de son corps
   *  mord de 20 px (30 dès 810) sur la moitié droite du bas du héros. */
  position?: string;
}) {
  const lien =
    "underline decoration-white/30 underline-offset-2 transition-colors duration-200 hover:text-foreground hover:decoration-foreground";
  return (
    <p className={`absolute z-[3] w-fit text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-white/60 ${position}`}>
      {credit.prefixe}{" "}
      <a href={credit.auteur.href} target="_blank" rel="noopener noreferrer" className={lien}>
        {credit.auteur.libelle}
      </a>
      ,{" "}
      <a href={credit.licence.href} target="_blank" rel="noopener noreferrer" className={lien}>
        {credit.licence.libelle}
      </a>
      {credit.modification ? `, ${credit.modification}` : null}
    </p>
  );
}
