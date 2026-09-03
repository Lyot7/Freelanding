import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Badge — pilule (radius 50px) bordée hairline, texte mono xs uppercase.
 * Usage : catégories (WEB DESIGN, DEVELOPMENT…), libellé de disponibilité.
 * Le libellé vient toujours en `children` (pas de texte métier en dur).
 */
export interface BadgeProps
  extends Omit<ComponentPropsWithoutRef<"span">, "className" | "children"> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className, ...rest }: BadgeProps) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-pill border border-border " +
        "px-4 py-1.5 font-mono text-xs uppercase tracking-tight text-foreground " +
        `${className ?? ""}`
      }
      {...rest}
    >
      {children}
    </span>
  );
}
