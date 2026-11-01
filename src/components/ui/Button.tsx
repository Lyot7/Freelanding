import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Button — CTA anguleux (radius 0) type "START A PROJECT".
 * - `primary` : fond accent orange, texte sombre.
 * - `outline` : bordure hairline, fond transparent.
 * - `ghost`   : sans bordure, hover surface.
 * Rend un <Link> next si `href` est fourni, sinon un <button>.
 * Typo mono uppercase tracking pour l'esthétique CTA du site.
 */
export type ButtonVariant = "primary" | "outline" | "ghost";

// Aucun style de focus ici : il est porté par `src/app/focus.css`, seule source
// de vérité de l'indicateur clavier du site (anneau double clair + sombre).
const BASE =
  "inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-tight " +
  "min-h-[44px] px-6 rounded-none select-none transition-colors duration-200 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-background hover:bg-accent/90",
  outline: "border border-border text-foreground hover:bg-surface-2",
  ghost: "text-foreground hover:bg-surface-2",
};

interface CommonProps {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}

type AsLink = CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >;

type AsButton = CommonProps & { href?: undefined } & Omit<
    ComponentPropsWithoutRef<"button">,
    "className" | "children"
  >;

export type ButtonProps = AsLink | AsButton;

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className ?? ""}`.trim();

  if (rest.href !== undefined) {
    const { href, ...linkRest } = rest as AsLink;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const { type, ...btnRest } = rest as AsButton;
  return (
    <button type={type ?? "button"} className={classes} {...btnRest}>
      {children}
    </button>
  );
}
