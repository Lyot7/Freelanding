import { uiLabels } from "@/content/ui";

/**
 * Spinner — loader minimal (anneau en rotation), pour états loading de listes.
 * `role="status"` + label accessible. Respecte prefers-reduced-motion
 * via l'utilitaire `motion-reduce:animate-none`.
 */
export type SpinnerSize = "sm" | "md";

const SIZES: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Libellé accessible (lecteurs d'écran). Défaut `uiLabels.chrome.loadingLabel`. */
  label?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  label = uiLabels.chrome.loadingLabel,
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={
        "inline-block shrink-0 animate-spin rounded-full border-border " +
        "border-t-accent motion-reduce:animate-none " +
        `${SIZES[size]} ${className ?? ""}`
      }
    />
  );
}
