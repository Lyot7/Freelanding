"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  EVENEMENT_PRECHARGEMENT,
  reseauEconome,
  routesAPrecharger,
  type Connexion,
} from "@/lib/prechargement";

/**
 * Une fois la page chargée et le navigateur au repos, charge d'avance tout ce
 * que la visite va demander ensuite :
 *  - les images encore en `loading="lazy"` de la page, passées en `eager`, et
 *    celles des calques de fond (`EVENEMENT_PRECHARGEMENT`) : le défilement ne
 *    rencontre plus d'image vide ;
 *  - les pages internes liées depuis celle-ci, par `router.prefetch` : le clic
 *    affiche la page sans aller-retour réseau.
 *
 * APRÈS LE `load` ET AU REPOS, JAMAIS AVANT. C'est ce qui le distingue du
 * préchargement automatique de `<Link>` que `HoverPrefetchLink` écarte : lui
 * part à l'entrée dans la fenêtre, pendant le chargement de la page, et
 * dispute la bande passante à la première peinture. Ici, la page est finie.
 *
 * Rien sur un réseau économe (`reseauEconome`). Rejoué à chaque navigation :
 * la nouvelle page a ses propres images et ses propres liens.
 */
export function PrechargementDiffere() {
  const router = useRouter();
  const chemin = usePathname();

  useEffect(() => {
    const { connection } = navigator as Navigator & { connection?: Connexion };
    if (reseauEconome(connection)) return;

    let annule = false;
    const precharger = () => {
      if (annule) return;
      document
        .querySelectorAll<HTMLImageElement>('img[loading="lazy"]')
        .forEach((img) => {
          img.loading = "eager";
        });
      window.dispatchEvent(new Event(EVENEMENT_PRECHARGEMENT));
      const hrefs = Array.from(document.querySelectorAll("a[href]"), (lien) =>
        lien.getAttribute("href"),
      );
      for (const route of routesAPrecharger(hrefs, chemin)) {
        router.prefetch(route);
      }
    };
    // Safari n'a pas `requestIdleCallback` : un délai court en tient lieu.
    const auRepos = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(precharger, { timeout: 3000 });
      } else {
        globalThis.setTimeout(precharger, 300);
      }
    };

    if (document.readyState === "complete") auRepos();
    else window.addEventListener("load", auRepos, { once: true });
    return () => {
      annule = true;
      window.removeEventListener("load", auRepos);
    };
  }, [chemin, router]);

  return null;
}
