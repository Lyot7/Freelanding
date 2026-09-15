"use client";

import Lenis, { type LenisOptions } from "lenis";
import { useEffect } from "react";
import { estProfilLeger } from "@/lib/profil-appareil";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const LENIS_OPTIONS = Object.freeze({
  smoothWheel: true,
  duration: 0.8,
  infinite: false,
  orientation: "vertical",
  gestureOrientation: "vertical",
  autoRaf: true,
  autoToggle: true,
  anchors: false,
  allowNestedScroll: false,
  syncTouch: false,
  stopInertiaOnNavigate: false,
} satisfies LenisOptions);

export function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let lenis: Lenis | null = null;

    const syncMotionPreference = () => {
      // Profil léger : défilement natif, pas de boucle rAF permanente.
      if (reducedMotion.matches || estProfilLeger()) {
        lenis?.destroy();
        lenis = null;
        return;
      }

      lenis ??= new Lenis(LENIS_OPTIONS);
    };

    // Démarrage APRÈS `load` : la boucle `autoRaf` tourne à chaque image dès sa
    // création. MESURÉ sur l'accueil mobile (CPU ×4) : le module qui la porte
    // cumulait 0,9 s de fil principal pendant le chargement. Avant `load`, le
    // défilement reste natif, sans à-coup à la bascule.
    const demarrer = () => {
      syncMotionPreference();
      reducedMotion.addEventListener("change", syncMotionPreference);
    };
    if (document.readyState === "complete") demarrer();
    else window.addEventListener("load", demarrer, { once: true });

    return () => {
      window.removeEventListener("load", demarrer);
      reducedMotion.removeEventListener("change", syncMotionPreference);
      lenis?.destroy();
    };
  }, []);

  return null;
}
