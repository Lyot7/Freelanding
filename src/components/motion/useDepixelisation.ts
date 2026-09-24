"use client";

import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { useReducedMotion } from "motion/react";
import { urlImageFond } from "@/lib/image-fond";
import {
  DUREE_ETAPE,
  LARGEUR_ATTENTE,
  LARGEUR_MIN_EFFET,
  etapesAJouer,
  tailleMiniature,
} from "@/lib/images/paliers";

/** Images déjà dépixelisées pendant la visite : l'effet ne se joue qu'une fois. */
const DEJA_VUES = new Set<string>();

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
 * Dépixelisation d'une image à sa première apparition à l'écran : 8, 16, 32,
 * 48, 96 puis 128 colonnes, 100 ms par étape. Motif de locomotive.ca
 * (`data-depixelate`), qui joue l'effet APRÈS le chargement.
 *
 * Rend l'étape courante (une miniature en `data:` ou, si l'image n'est pas
 * encore arrivée, sa version de 32 px servie par l'optimiseur), ou `null`
 * quand il n'y a rien à montrer d'autre que l'image elle-même. Le composant la
 * pose en fond pixelisé (`image-rendering: pixelated`).
 *
 * `charger` rend l'image décodée, `null` en cas d'échec ; `estChargee` dit si
 * elle l'est déjà, auquel cas toutes les étapes se jouent sans attente.
 *
 * Pas d'effet : `actif` faux, mouvement réduit, cible de moins de 80 px de
 * large, image déjà dépixelisée pendant la visite.
 */
export function useDepixelisation({
  cible,
  src,
  actif,
  estChargee,
  charger,
}: {
  cible: RefObject<HTMLElement | null>;
  src: string;
  actif: boolean;
  estChargee: () => boolean;
  charger: () => Promise<HTMLImageElement | null>;
}): string | null {
  const [etape, setEtape] = useState<string | null>(null);
  const reduit = useReducedMotion();

  useEffect(() => {
    const element = cible.current;
    if (!element || !actif || reduit || DEJA_VUES.has(src)) return;

    let annule = false;
    const minuteries: number[] = [];
    const attendre = (ms: number) =>
      new Promise<void>((fin) => {
        minuteries.push(window.setTimeout(fin, ms));
      });

    const jouer = async () => {
      DEJA_VUES.add(src);
      let dejaAffichee: number | null = null;
      if (!estChargee()) {
        setEtape(urlImageFond(src, LARGEUR_ATTENTE));
        dejaAffichee = LARGEUR_ATTENTE;
      }
      const img = await charger();
      try {
        if (img) {
          for (const colonnes of etapesAJouer(dejaAffichee)) {
            if (annule) break;
            setEtape(miniature(img, colonnes));
            await attendre(DUREE_ETAPE);
          }
        }
      } catch {
        // Toile illisible (image d'une autre origine) : on montre l'image nette.
      }
      if (!annule) setEtape(null);
    };

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        observateur.disconnect();
        if (element.getBoundingClientRect().width < LARGEUR_MIN_EFFET) return;
        void jouer();
      },
      { threshold: 0.15 },
    );
    observateur.observe(element);
    return () => {
      annule = true;
      observateur.disconnect();
      minuteries.forEach((id) => window.clearTimeout(id));
    };
    // `estChargee` et `charger` sont lus au moment du jeu, pas suivis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cible, src, actif, reduit]);

  return etape;
}

/** `<img>` chargée et décodable. */
export const imgChargee = (img: HTMLImageElement | null) =>
  img !== null && img.complete && img.naturalWidth > 0;

/** Attend le chargement d'un `<img>` ; `null` s'il échoue. */
export function chargementImg(
  img: HTMLImageElement | null,
): Promise<HTMLImageElement | null> {
  if (!img || imgChargee(img)) return Promise.resolve(img);
  return new Promise((fin) => {
    img.addEventListener("load", () => fin(img), { once: true });
    img.addEventListener("error", () => fin(null), { once: true });
  });
}

/**
 * Style d'un `<img>` pendant l'effet : l'étape en fond pixelisé, et le contenu
 * de l'image poussé hors de sa boîte par `object-position` pour que seul le
 * fond se voie. `null` hors effet.
 */
export function styleEtape(
  etape: string | null,
  className: string | undefined,
): CSSProperties | null {
  if (!etape) return null;
  return {
    backgroundImage: `url("${etape}")`,
    backgroundSize: /\bobject-contain\b/.test(className ?? "")
      ? "contain"
      : "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    objectPosition: "-99999px -99999px",
  };
}
