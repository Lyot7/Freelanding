"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  formatCounterValue,
  nextCounterValue,
  parseCounterValue,
} from "./animated-counter";
import { inViewOnce } from "./inViewOnce";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface AnimatedCounterProps {
  value: string;
  suffix?: string;
  speedMs?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix,
  speedMs = 10,
  className,
}: AnimatedCounterProps) {
  const definition = useMemo(
    () => parseCounterValue(value, suffix),
    [suffix, value],
  );
  const [displayValue, setDisplayValue] = useState(definition.end);
  const rootRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let stopObserving: (() => void) | null = null;
    let timer: number | null = null;
    let completed = false;

    const clearMotion = () => {
      stopObserving?.();
      stopObserving = null;
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const finish = () => {
      completed = true;
      clearMotion();
      setDisplayValue(definition.end);
    };

    const count = () => {
      stopObserving?.();
      stopObserving = null;
      let current = 0;

      timer = window.setInterval(() => {
        current = nextCounterValue(
          current,
          definition.end,
          definition.increment,
          definition.precision,
        );
        setDisplayValue(current);
        if (current >= definition.end) {
          finish();
        }
      }, speedMs);
    };

    const arm = () => {
      if (completed || reducedMotion.matches) {
        finish();
        return;
      }

      setDisplayValue(0);

      if (!rootRef.current || !("IntersectionObserver" in window)) {
        finish();
        return;
      }

      // Observateur PARTAGÉ et marge commune du site (bord bas de la fenêtre,
      // seuil mesuré sur la source). Chaque compteur instanciait auparavant son
      // propre `IntersectionObserver`, aux options par défaut : autant
      // d'observateurs que de chiffres à l'écran, et un déclenchement qui ne
      // suivait pas celui des révélations voisines.
      stopObserving = inViewOnce(rootRef.current, count);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        finish();
      }
    };

    arm();
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      completed = true;
      reducedMotion.removeEventListener("change", handleMotionPreference);
      clearMotion();
    };
  }, [
    definition.end,
    definition.increment,
    definition.precision,
    speedMs,
  ]);

  return (
    <span
      ref={rootRef}
      className={className}
      aria-label={value}
      data-counter-value={value}
    >
      <span aria-hidden>
        {formatCounterValue(displayValue, definition.precision)}
      </span>
      {definition.suffix ? (
        <span aria-hidden>{definition.suffix}</span>
      ) : null}
    </span>
  );
}
