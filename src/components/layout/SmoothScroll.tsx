"use client";

import Lenis, { type LenisOptions } from "lenis";
import { useEffect } from "react";

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
      if (reducedMotion.matches) {
        lenis?.destroy();
        lenis = null;
        return;
      }

      lenis ??= new Lenis(LENIS_OPTIONS);
    };

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);

    return () => {
      reducedMotion.removeEventListener("change", syncMotionPreference);
      lenis?.destroy();
    };
  }, []);

  return null;
}
