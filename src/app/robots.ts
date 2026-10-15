/**
 * Reste À LA RACINE de `src/app`, hors des groupes `(site)` / `(payload)`.
 *
 * MESURÉ : déplacé dans `(site)`, `/robots.txt` disparaît purement et simplement
 * du build (27 routes au lieu de 28). La doc de cette version est explicite —
 * `robots` n'est reconnu qu'à la racine de `app`, contrairement à `sitemap` qui,
 * lui, survit dans un groupe. `favicon.ico` obéit à la même règle et reste ici.
 */
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";


export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Lien et logo suivis des e-mails de prospection (`src/app/r/[id]`, `src/app/o/[id]`),
      // et l'aperçu des articles montré dans le cockpit (`src/app/(apercu)`).
      disallow: ["/r/", "/o/", "/apercu/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
