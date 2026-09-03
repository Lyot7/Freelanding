"use client";

import { useId, useState } from "react";
import { ToggleIcon } from "./ToggleIcon";

/**
 * Accordion — FAQ dépliable. Client component (état ouvert/fermé).
 * Chaque item bascule indépendamment. Animation de hauteur douce via la
 * technique grid-rows (0fr → 1fr, pas de mesure JS).
 * Libellés 100% en props (aucun texte métier en dur).
 *
 * L'icône vient de `./ToggleIcon`, source unique du plus/moins : elle porte la
 * bascule relevée sur la source (demi-tour de la barre horizontale, barre
 * verticale raccourcie et effacée, ressort commun). Les paires de traits SVG
 * `plus`/`minus` employées ici auparavant échangeaient les deux états d'un coup,
 * ce que la source ne fait pas.
 */
export interface AccordionItem {
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Autoriser plusieurs items ouverts simultanément. Défaut false (un seul). */
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  className,
}: AccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className={`divide-y divide-border border-y border-border ${className ?? ""}`}>
      {items.map((item, index) => {
        const isOpen = open.has(index);
        const headerId = `${baseId}-h-${index}`;
        const panelId = `${baseId}-p-${index}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                // Focus : voir `src/app/focus.css`. La recoloration en accent
                // au focus était le SEUL indicateur de cette FAQ, et une
                // couleur de texte seule n'est pas un indicateur recevable.
                className={
                  "flex w-full min-h-[44px] items-center justify-between gap-6 " +
                  "py-6 text-left text-lg text-foreground transition-colors " +
                  "hover:text-accent"
                }
              >
                <span>{item.question}</span>
                <ToggleIcon open={isOpen} />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className={
                "grid transition-[grid-template-rows] duration-300 ease-out " +
                "motion-reduce:transition-none " +
                (isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
              }
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="pb-6 text-base leading-prose text-text-secondary">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
