/**
 * Document HTML du site public : `<html>`, `<head>`, `<body>` et l'amorçage des
 * animations. Source unique, partagée par DEUX entrées qui ne se composent pas :
 *
 *   - `(site)/layout.tsx`, le layout racine de toutes les pages du site ;
 *   - `src/app/global-not-found.tsx`, qui doit rendre un document COMPLET parce
 *     que Next court-circuite le rendu normal pour les URL sans aucune route.
 *
 * Sans ce partage, les deux copies divergeraient à la première modification du
 * shell et le 404 cesserait silencieusement de ressembler au site.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { PageTransitions, SkipLink, SmoothScroll } from "@/components/layout";
import { MotionSettings } from "@/components/motion/MotionSettings";
import { APPEAR_BOOT_SCRIPT } from "@/components/motion/appearAnimations";
import { siteConfig } from "@/content/site";
import { GOOGLE_SITE_VERIFICATION } from "@/lib/analytics/config";
import type { SiteConfig } from "@/lib/content/types";
import { SITE_URL } from "@/lib/site-url";


/**
 * Métadonnées communes au site, DÉRIVÉES de la configuration.
 *
 * Elles étaient écrites en dur ici, en anglais et avec une preuve sociale
 * fabriquée (« 60+ projects shipped ») : `site.meta` existait déjà mais n'était
 * lu par personne. Toute modification du titre ou de la description devait donc
 * être faite à deux endroits, et l'un des deux était invisible.
 */
export function buildSiteMetadata(site: SiteConfig): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    /*
     * `absolute` ET NON `default` + `template`.
     *
     * MESURÉ : avec les deux, Next applique le gabarit au titre par défaut
     * lui-même dès qu'aucune page n'en fournit un, c'est-à-dire sur les deux
     * 404 (`/404` et tout slug inconnu). L'onglet affichait
     * « Bouquerel® · Sites web et outils métier sur mesure · Bouquerel® », la
     * marque écrite deux fois.
     *
     * LE GABARIT NE MANQUE À PERSONNE : `pageMetadata` pose `title.absolute`
     * sur TOUTES les pages du site, et les quelques titres écrits à la main
     * portent déjà la marque en toutes lettres. Le gabarit ne s'appliquait donc
     * qu'à l'endroit où il produisait le doublon.
     */
    title: { absolute: site.meta.defaultTitle },
    description: site.meta.description,
    openGraph: {
      type: "website",
      siteName: `${site.brand.name}${site.brand.mark}`,
      locale: site.meta.locale,
    },
    twitter: { card: "summary_large_image" },
    /*
     * PROPRIÉTÉ GOOGLE SEARCH CONSOLE — vide par défaut, donc AUCUNE balise
     * rendue tant qu'Eliott n'a pas collé le jeton fourni par Google. Une
     * `<meta name="google-site-verification">` vide ne vérifie rien et traîne
     * dans le `<head>` de toutes les pages ; l'omission conditionnelle évite
     * les deux. Procédure complète dans `docs/ANALYTICS.md`.
     */
    ...(GOOGLE_SITE_VERIFICATION
      ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

/**
 * Repli synchrone. Partagé pour la même raison que le document :
 * `global-not-found` ne passe par AUCUN layout et ne peut pas attendre la
 * couche contenu, il doit donc redéclarer ces balises, et une copie divergerait
 * (MESURÉ : la première version du 404 global perdait les balises `og:` et
 * `twitter:` de toutes les autres pages).
 *
 * Les pages du site, elles, passent par `(site)/layout.tsx` qui reconstruit ces
 * métadonnées depuis la couche contenu, drapeaux de section compris ; ce repli
 * lit `src/content/site.ts` directement.
 */
export const SITE_METADATA: Metadata = buildSiteMetadata(siteConfig);

export function SiteDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        {/* Filet sans JavaScript. Les apparitions rendent leur état MASQUÉ dès
            le HTML serveur (c'est ce qui évite le rejeu visible après
            hydratation, cf. l'entête de `@/components/motion/Reveal`) : sans
            script pour les animer, cet état resterait posé pour toujours. Cette
            feuille n'existe QUE si le navigateur a le script désactivé. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full bg-background text-foreground">
        {/* Premier nœud du body : le lien d'évitement doit être le tout premier
            élément focusable du document, avant le header de chaque page. */}
        <SkipLink />
        <SmoothScroll />
        {/* Transitions de page via l'API native (voir PageTransitions.tsx et les
            animations `::view-transition-*` dans globals.css). */}
        <PageTransitions />
        <MotionSettings>{children}</MotionSettings>
        {/* Consentement et mesure. Dernier nœud de contenu du document : la
            barre de révocation se pose ainsi sous le pied de page de chaque
            route sans que `layout/Footer.tsx` ait à être touché, et la bannière
            arrive en fin d'ordre de tabulation. Sans clé PostHog configurée,
            l'ensemble ne rend rien et ne pose aucun écouteur. */}
        <SiteAnalytics />
        {/* Démarreur des apparitions, DERNIER nœud du body : il lit les
            éléments animés dans le DOM, ils doivent donc être déjà analysés.
            Script nu et non `next/script` : il ne doit dépendre d'aucun module
            ni d'aucune stratégie de chargement pour tourner avant le JavaScript
            applicatif. Voir `@/components/motion/appearAnimations`. */}
        <script
          id="appear-boot"
          dangerouslySetInnerHTML={{ __html: APPEAR_BOOT_SCRIPT }}
        />
      </body>
    </html>
  );
}
