"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { urlImageFond } from "@/lib/image-fond";
import {
  DUREE_ETAPE,
  LARGEUR_ATTENTE,
  etapesAJouer,
  tailleMiniature,
} from "@/lib/images/paliers";

/** Images déjà dépixelisées pendant la visite : l'effet ne se joue qu'une fois. */
const DEJA_VUES = new Set<string>();

const estChargee = (img: HTMLImageElement) =>
  img.complete && img.naturalWidth > 0;

function chargement(img: HTMLImageElement): Promise<void> {
  if (img.complete) return Promise.resolve();
  return new Promise((fin) => {
    img.addEventListener("load", () => fin(), { once: true });
    img.addEventListener("error", () => fin(), { once: true });
  });
}

/** L'image chargée, réduite à `colonnes` colonnes, en PNG. */
function miniature(img: HTMLImageElement, colonnes: number): string {
  const { largeur, hauteur } = tailleMiniature(
    colonnes,
    img.naturalWidth,
    img.naturalHeight,
  );
  const toile = document.createElement("canvas");
  toile.width = largeur;
  toile.height = hauteur;
  toile.getContext("2d")?.drawImage(img, 0, 0, largeur, hauteur);
  return toile.toDataURL();
}

/**
 * `next/image` qui se DÉPIXELISE à sa première apparition à l'écran :
 * 8, 16, 32, 48, 96 puis 128 colonnes, 100 ms par étape, puis l'image nette.
 * Motif de locomotive.ca (`data-depixelate`).
 *
 * MÊME CONTRAT que `next/image` : on remplace l'import, rien d'autre.
 *
 * SANS ÉLÉMENT AJOUTÉ. Chaque étape est une miniature de l'image chargée,
 * posée en `background-image` de l'`<img>` lui-même et agrandie en
 * `image-rendering: pixelated`. Pendant l'effet, `object-position` pousse le
 * contenu de l'image hors de sa boîte : seul le fond se voit. Rien à
 * envelopper, donc identique en `fill` comme en dimensions fixes.
 *
 * IMAGE PAS ENCORE ARRIVÉE à l'entrée dans l'écran : une version de 32 px de
 * l'optimiseur tient lieu d'attente, pixelisée, puis l'effet reprend au-dessus
 * de 32 colonnes. Le préchargement (`PrechargementDiffere`) rend ce cas rare.
 *
 * Pas d'effet : image prioritaire (héros, la plus grande peinture ne doit pas
 * attendre), mouvement réduit, image déjà dépixelisée pendant la visite.
 */
export function ImageProgressive({
  src,
  alt,
  style,
  className,
  ...rest
}: Omit<ImageProps, "src"> & { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [fond, setFond] = useState<string | null>(null);
  const reduit = useReducedMotion();
  const immediate =
    rest.priority === true || rest.preload === true || rest.loading === "eager";

  useEffect(() => {
    const img = ref.current;
    if (!img || immediate || reduit || DEJA_VUES.has(src)) return;

    let annule = false;
    const minuteries: number[] = [];
    const attendre = (ms: number) =>
      new Promise<void>((fin) => {
        minuteries.push(window.setTimeout(fin, ms));
      });

    const jouer = async () => {
      DEJA_VUES.add(src);
      let dejaAffichee: number | null = null;
      if (!estChargee(img)) {
        setFond(urlImageFond(src, LARGEUR_ATTENTE));
        dejaAffichee = LARGEUR_ATTENTE;
        await chargement(img);
      }
      try {
        for (const colonnes of etapesAJouer(dejaAffichee)) {
          if (annule || !estChargee(img)) break;
          setFond(miniature(img, colonnes));
          await attendre(DUREE_ETAPE);
        }
      } catch {
        // Toile illisible (image d'une autre origine) : on montre l'image nette.
      }
      if (!annule) setFond(null);
    };

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        observateur.disconnect();
        void jouer();
      },
      { threshold: 0.15 },
    );
    observateur.observe(img);
    return () => {
      annule = true;
      observateur.disconnect();
      minuteries.forEach((id) => window.clearTimeout(id));
    };
  }, [src, immediate, reduit]);

  const pixelise: CSSProperties | null = fond
    ? {
        backgroundImage: `url("${fond}")`,
        backgroundSize: /\bobject-contain\b/.test(className ?? "")
          ? "contain"
          : "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        objectPosition: "-99999px -99999px",
      }
    : null;

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
