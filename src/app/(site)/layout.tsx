/**
 * Layout racine du site public.
 *
 * `(site)` est un ROUTE GROUP : les parenthèses n'entrent pas dans l'URL, donc
 * `(site)/about/page.tsx` répond toujours sur `/about`. Le groupe date de la
 * cohabitation avec l'admin Payload, qui exigeait son propre layout racine ;
 * Payload a été retiré le 2026-08-26 mais le groupe reste, parce que le déplacer
 * changerait tous les chemins pour zéro gain. Conséquence à connaître :
 * `src/app/` n'a toujours pas de `layout.tsx`, d'où `global-not-found.tsx`.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";

/* Les feuilles restent à la racine de `src/app` et NON dans `(site)` : elles ne
   sont pas des fichiers de route, et `scripts/extract-fonts.mjs` régénère
   `src/app/fonts.css` (importée par `globals.css`) à cet emplacement exact. Les
   déplacer casserait un contrôle de fidélité pour un gain nul. */
import "../globals.css";
/* Focus clavier — feuille dédiée, importée APRÈS `globals.css` et volontairement
   HORS de toute couche CSS : c'est ce qui lui permet de battre les utilitaires
   Tailwind (tous en `@layer utilities`) sans un seul `!important`. Voir l'entête
   de `focus.css` pour la divergence assumée qu'elle porte. */
import "../focus.css";
import { content } from "@/lib/content";
import { buildSiteMetadata, SiteDocument } from "./SiteDocument";

/**
 * Métadonnées reconstruites à chaque rendu depuis la couche contenu : le titre,
 * la description et le nom de marque suivent donc `src/content/site.ts` sans
 * qu'aucun autre fichier n'ait à être touché.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildSiteMetadata(await content.getSiteConfig());
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <SiteDocument>{children}</SiteDocument>;
}
