"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Réglages framer-motion valables pour tout le document.
 *
 * `reducedMotion="user"` remplace la garde JavaScript qui vivait auparavant dans
 * `useEntrance` : les apparitions du site rendent désormais leur état MASQUÉ dès
 * le rendu serveur (cf. l'entête de `@/components/motion/Reveal`), il n'y a donc
 * plus d'état React à basculer après l'hydratation pour honorer
 * `prefers-reduced-motion`. framer-motion s'en charge lui-même : sous cette
 * préférence, il résout les transforms instantanément au lieu de les animer, et
 * ne laisse animer que l'opacité. C'est aussi ce que fait la source, qui passe
 * `matchMedia("(prefers-reduced-motion:reduce)").matches` à son démarreur
 * d'`appear effects`.
 *
 * Composant client dédié : `MotionConfig` pose un contexte React, il ne peut pas
 * être monté depuis le layout serveur sans cette frontière.
 */
export function MotionSettings({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
