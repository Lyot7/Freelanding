/**
 * Résolution de slug, partagée par tout adapter du port.
 *
 * La normalisation et la prise en compte des `aliases` font partie du contrat du
 * port : elles doivent se comporter à l'identique quelle que soit la source.
 */
import type { SluggedContent } from "./types";

/** Nettoie un slug entrant (slashes, encodage). `null` si inexploitable. */
export function normalizeSlug(slug: string): string | null {
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) {
    return null;
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return null;
  }
}

/** Retrouve une entité par slug canonique ou par alias. */
export function findBySlug<T extends SluggedContent>(
  entries: readonly T[],
  requestedSlug: string,
): T | null {
  const slug = normalizeSlug(requestedSlug);
  if (!slug) {
    return null;
  }

  return (
    entries.find(
      (entry) => entry.slug === slug || entry.aliases?.includes(slug) === true,
    ) ?? null
  );
}
