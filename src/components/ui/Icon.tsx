import type { ReactNode, SVGProps } from "react";

/**
 * Icon — wrapper SVG minimal, hérite de `currentColor`.
 * Deux usages :
 *  - `name` : puise dans un petit registre (plus, minus, arrow, arrow-up-right, close).
 *  - `children` : SVG paths custom (override le registre si fourni).
 * Décoratif par défaut (aria-hidden). Passer `label` pour une icône porteuse de sens.
 */
export type IconName =
  | "plus"
  | "minus"
  | "arrow"
  | "arrow-up-right"
  | "chevron-down"
  | "check"
  | "close";

const REGISTRY: Record<IconName, ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  // Chevron seul, sans hampe : c'est ce que la source pose dans le select de
  // /contact. Une flèche pivotée de 90° y ajoutait une barre verticale.
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  // Ajoutée le 2026-08-27 pour les listes des pages de prestation. La coche du
  // tableau comparatif supprimé était dessinée en local dans son composant ;
  // elle vit désormais ici, avec les autres.
  check: <path d="m4 12.5 5 5 11-11" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name?: IconName;
  children?: ReactNode;
  /** Taille en px (width = height). Défaut 16. */
  size?: number;
  /** Libellé accessible ; si absent, l'icône est aria-hidden. */
  label?: string;
}

export function Icon({
  name,
  children,
  size = 16,
  label,
  className,
  ...rest
}: IconProps) {
  const content = children ?? (name ? REGISTRY[name] : null);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable={false}
      {...rest}
    >
      {content}
    </svg>
  );
}
