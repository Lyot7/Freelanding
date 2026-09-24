"use client";

import Image, { type ImageProps } from "next/image";
import { useRef } from "react";
import {
  chargementImg,
  imgChargee,
  styleEtape,
  useDepixelisation,
} from "@/components/motion/useDepixelisation";

/**
 * `next/image` qui se DÉPIXELISE à sa première apparition à l'écran (voir
 * `useDepixelisation`). MÊME CONTRAT que `next/image` : on remplace l'import,
 * rien d'autre, et le chargement reste différé (`loading="lazy"` par défaut).
 *
 * SANS ÉLÉMENT AJOUTÉ. Chaque étape est posée en `background-image` de
 * l'`<img>` lui-même, agrandie en `image-rendering: pixelated`. Pendant
 * l'effet, `object-position` pousse le contenu de l'image hors de sa boîte :
 * seul le fond se voit. Rien à envelopper, donc identique en `fill` comme en
 * dimensions fixes.
 *
 * Image prioritaire (héros) : rendue telle quelle, la plus grande peinture ne
 * doit pas attendre.
 */
export function ImageProgressive({
  src,
  alt,
  style,
  className,
  ...rest
}: Omit<ImageProps, "src"> & { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const etape = useDepixelisation({
    cible: ref,
    src,
    actif: !(
      rest.priority === true ||
      rest.preload === true ||
      rest.loading === "eager"
    ),
    estChargee: () => imgChargee(ref.current),
    charger: () => chargementImg(ref.current),
  });

  const pixelise = styleEtape(etape, className);

  return (
    <Image
      {...rest}
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={pixelise ? { ...style, ...pixelise } : style}
    />
  );
}
