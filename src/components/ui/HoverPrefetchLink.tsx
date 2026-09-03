"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

/**
 * Lien qui ne précharge QU'À L'INTENTION (survol, effleurement, focus clavier).
 *
 * POURQUOI. Le préchargement automatique de `<Link>` se déclenche à l'ENTRÉE
 * DANS LA FENÊTRE, et pour une route statique sans `loading.js` il tire la route
 * ENTIÈRE (`node_modules/next/dist/docs/01-app/02-guides/prefetching.md`,
 * tableau « Automatic prefetch »). Or le pied de page et la navigation flottante
 * sont sur les NEUF routes, et la navigation flottante est en `position: fixed`,
 * donc toujours dans la fenêtre. Chaque visiteur payait ainsi le préchargement
 * de la douzaine de routes du site, sur chaque page qu'il ouvrait.
 *
 * ATTENTION AU PIÈGE DE VERSION. Sur le routeur d'app de cette version,
 * `prefetch={false}` veut dire « JAMAIS », survol compris — et pas « seulement
 * au survol » comme sur l'ancien routeur de pages
 * (`.../03-api-reference/02-components/link.md`, § `prefetch`). Un `false` seul
 * rendrait donc toute navigation froide. D'où la bascule ci-dessous, qui est le
 * motif « Hover-triggered prefetch » de la documentation embarquée :
 * `prefetch={null}` rétablit le comportement par défaut dès que l'intention est
 * manifestée, et la navigation redevient instantanée.
 *
 * ÉCART ASSUMÉ AVEC LA DOCUMENTATION : elle n'écoute que `onMouseEnter`. On y
 * ajoute `onTouchStart` (sans quoi le tactile n'aurait jamais de préchargement)
 * et `onFocus` (parcours clavier), pour ne pas réserver le gain à la souris.
 */
export function HoverPrefetchLink({
  onMouseEnter,
  onTouchStart,
  onFocus,
  ...rest
}: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...rest}
      prefetch={intent ? null : false}
      onMouseEnter={(event) => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
    />
  );
}
