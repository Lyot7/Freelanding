import { getImageProps } from "next/image";

/**
 * Adresse OPTIMISÉE d'une image posée en `background-image`.
 *
 * Les calques dérivants du site portent leur visuel en fond CSS, pas en `img`
 * (voir `ParallaxBackdrop`). Un `url(/images/x.jpg)` contourne l'optimiseur de
 * Next : le JPEG d'origine partait tel quel, 1600 px et 230 Ko pour une vignette
 * de 690 px. Relevé Lighthouse du 2026-09-14 : 818 Ko d'images servies sans
 * format moderne sur la page d'accueil.
 *
 * `getImageProps` construit l'adresse de l'optimiseur (AVIF ou WebP selon
 * l'en-tête `Accept`, redimensionné, mis en cache) en respectant la
 * configuration `images` de `next.config.ts`. On garde la variante 1x : pour une
 * largeur demandée de 1200, c'est la taille autorisée la plus proche au-dessus.
 */
export function urlImageFond(src: string, largeur = 1200): string {
  const { src: repli, srcSet } = getImageProps({
    src,
    alt: "",
    width: largeur,
    height: largeur,
  }).props;
  return srcSet?.split(", ")[0]?.split(" ")[0] ?? repli ?? src;
}
