import Image from "next/image";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import type { CreditPhoto, ImageHero } from "@/lib/content/types";

/**
 * Photo de fond d'un héros de prestation, avec les voiles qui gardent le texte
 * blanc lisible par-dessus.
 *
 * MÊME MONTAGE QUE LE HÉROS DE `/a-propos` : l'image en `fill` dans un calque
 * qui dérive au scroll (`0,15 x scrollY`, la loi relevée sur la source pour
 * tous les fonds de héros), le débord absorbé par l'`overflow-hidden` de la
 * section. Deux écarts, voulus :
 *   - le calque n'est PAS `decorative` : la photo porte un texte alternatif,
 *     elle montre la ville dont parle la page ;
 *   - pas de `grayscale` : le contour vert de l'église est le sujet de l'image.
 *
 * LES VOILES. Le titre et le chapô sont posés dans la moitié basse, sur les
 * toits clairs et les façades en pierre de Caen. Le dégradé du bas les ramène
 * au fond du site ; le voile plat atténue le ciel sans éteindre la flèche, et
 * le dégradé du haut, qui descend jusqu'au fil d'Ariane, le détache du ciel et
 * du contour de la flèche. Relevé au rendu le 2026-09-24, texte masqué, pire
 * pixel sous chaque boîte : tous les textes du héros de Caen tiennent l'AA à
 * 375, 810 et 1440 px (titre 5,2:1 au plus bas, pour 3 requis ; fil d'Ariane
 * 5,0:1 ; chapô 5,6:1 ; crédit 6,0:1). À 30 %, le fil tombait à 4,7:1 sur
 * mobile : le voile plat est à 35 % pour garder de la marge. Le titre reste surveillé par
 * `bun run audit:contraste-hero`. Éclaircir un voile, c'est remesurer.
 */
export function HeroPhoto({ image }: { image: ImageHero }) {
  return (
    <>
      <ScrollParallax
        factor={0.15}
        className="pointer-events-none absolute inset-0 z-0 overflow-clip"
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: `${image.cadrage.x}% ${image.cadrage.y}%` }}
        />
      </ScrollParallax>
      <span aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-black/35" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[55%] bg-gradient-to-b from-black/60 via-black/40 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[75%] bg-gradient-to-t from-background via-background/80 to-transparent"
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
export function CreditHeroPhoto({ credit }: { credit: CreditPhoto }) {
  const lien =
    "underline decoration-white/30 underline-offset-2 transition-colors duration-200 hover:text-foreground hover:decoration-foreground";
  return (
    <p className="absolute bottom-[16px] right-[20px] z-[3] text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-white/60 tablet:right-[24px] desktop:right-[30px]">
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
