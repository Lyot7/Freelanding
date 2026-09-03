import type { CSSProperties, ReactNode } from "react";
import { uiLabels } from "@/content/ui";

/**
 * Marquee — bandeau défilant horizontal en boucle continue.
 * 100% CSS (aucun JS) → composant serveur. Le contenu est dupliqué pour un
 * défilement sans couture (translateX -50%). L'animation est portée par
 * `.marquee-track` dans globals.css et coupée sous prefers-reduced-motion.
 * Les copies sont aria-hidden (contenu lu une seule fois).
 *
 * `repetitions` EXISTE PARCE QUE DEUX COPIES NE SUFFISENT PAS TOUJOURS. Le
 * défilement translate le rail de -50 %, donc d'exactement un groupe : pour
 * qu'aucun bord ne rentre dans le cadre, il faut qu'UN GROUPE soit déjà plus
 * large que le viewport. Mesuré le 2026-09-02 sur la bande des employeurs :
 * trois cellules de 240 px font 720 px, le rail entier tombait à 1 440 px, et
 * à 1 440 px de large la bande se vidait en fin de cycle. Répéter le contenu
 * à l'intérieur de chaque groupe garde le calcul du -50 % juste et remplit le
 * cadre quelle que soit la largeur.
 */
export interface MarqueeProps {
  children: ReactNode;
  /** Durée d'un cycle complet en secondes (plus grand = plus lent). Défaut 20. */
  speed?: number;
  /** Inverse le sens de défilement. */
  reverse?: boolean;
  /**
   * Nombre de fois que `children` est répété DANS chaque groupe. Défaut 1.
   * À monter quand le contenu est plus étroit que le viewport (voir l'entête).
   */
  repetitions?: number;
  className?: string;
}

export function Marquee({
  children,
  speed = 20,
  reverse = false,
  repetitions = 1,
  className,
}: MarqueeProps) {
  const style = { "--marquee-duration": `${speed}s` } as CSSProperties;
  const groupe = Array.from({ length: Math.max(1, repetitions) }, (_, i) => (
    <div key={i} className="flex shrink-0 items-center">
      {children}
    </div>
  ));

  return (
    <div
      className={`overflow-hidden ${className ?? ""}`}
      role="marquee"
      aria-label={uiLabels.chrome.marqueeLabel}
    >
      <div
        className="marquee-track flex w-max items-center"
        data-reverse={reverse}
        style={style}
      >
        <div className="flex shrink-0 items-center">{groupe}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {groupe}
        </div>
      </div>
    </div>
  );
}
