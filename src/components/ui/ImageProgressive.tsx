"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { urlImageFond } from "@/lib/image-fond";
import {
  DUREE_MIN_PALIER,
  attenteAvantPalier,
  paliersPour,
} from "@/lib/images/paliers";

/**
 * `next/image` qui, la PREMIÈRE fois qu'une image arrive à l'écran, passe par
 * des versions de moins en moins pixelisées (32, 96 puis 384 px) avant la
 * finale. Le temps de téléchargement se lit comme une mise au point.
 *
 * MÊME CONTRAT que `next/image` : on remplace l'import, rien d'autre.
 *
 * LE PALIER EST UN FOND DE L'IMAGE, pas un élément superposé : un `<img>` pas
 * encore chargé peint son `background-image`, puis l'image finale le recouvre.
 * C'est le mécanisme du `placeholder="blur"` de Next. Il marche donc à
 * l'identique en `fill` comme en dimensions fixes, sans conteneur à ajouter.
 * `image-rendering: pixelated` agrandit le palier en gros pixels nets au lieu
 * d'un flou.
 *
 * RIEN À VOIR QUAND C'EST DÉJÀ LÀ. Image en cache, ou préchargée pendant que
 * la page était au repos (`PrechargementDiffere`) : elle est `complete` avant
 * d'entrer dans l'écran, aucun palier ne part. Image prioritaire (héros) :
 * rendue telle quelle, un palier retarderait la plus grande peinture.
 *
 * Mouvement réduit : un seul palier, fixe, jusqu'à l'image finale.
 */
export function ImageProgressive({
  src,
  alt,
  onLoad,
  style,
  className,
  ...rest
}: Omit<ImageProps, "src"> & { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const netteRef = useRef(false);
  const [palier, setPalier] = useState<string | null>(null);
  const [nette, setNette] = useState(false);
  const reduit = useReducedMotion();
  const immediate =
    rest.priority === true || rest.preload === true || rest.loading === "eager";

  useEffect(() => {
    const img = ref.current;
    if (!img || immediate) return;
    const chargee = () =>
      netteRef.current || (img.complete && img.naturalWidth > 0);
    if (chargee()) return;

    let annule = false;
    const minuteries: number[] = [];
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        observateur.disconnect();
        if (chargee()) return;
        const largeurs = paliersPour(
          img.getBoundingClientRect().width * window.devicePixelRatio,
        );
        let dernier = 0;
        let file = Promise.resolve();
        for (const largeur of reduit ? largeurs.slice(0, 1) : largeurs) {
          const url = urlImageFond(src, largeur);
          const pre = new window.Image();
          pre.src = url;
          const decodee = pre.decode().then(
            () => true,
            () => false,
          );
          file = file
            .then(() => decodee)
            .then(
              (ok) =>
                new Promise<boolean>((fin) => {
                  const attente = attenteAvantPalier(
                    performance.now() - dernier,
                    DUREE_MIN_PALIER,
                  );
                  minuteries.push(window.setTimeout(() => fin(ok), attente));
                }),
            )
            .then((ok) => {
              if (!ok || annule || chargee()) return;
              dernier = performance.now();
              setPalier(url);
            });
        }
      },
      { rootMargin: "300px 0px" },
    );
    observateur.observe(img);
    return () => {
      annule = true;
      observateur.disconnect();
      minuteries.forEach((id) => window.clearTimeout(id));
    };
  }, [src, immediate, reduit]);

  const fond =
    palier && !nette
      ? {
          backgroundImage: `url("${palier}")`,
          backgroundSize: /\bobject-contain\b/.test(className ?? "")
            ? "contain"
            : "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated" as const,
        }
      : null;

  return (
    <Image
      {...rest}
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={fond ? { ...style, ...fond } : style}
      onLoad={(event) => {
        netteRef.current = true;
        setNette(true);
        onLoad?.(event);
      }}
    />
  );
}
