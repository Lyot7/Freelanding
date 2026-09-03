"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  ANALYTICS_EVENTS,
  pageTypeFromPathname,
  slugFromPathname,
  viewEventForPageType,
} from "@/lib/analytics/events";
import { capture } from "@/lib/analytics/posthog";

/**
 * MESURE À L'ÉCHELLE D'UNE PAGE : vue, sortie, profondeur de défilement,
 * sections réellement atteintes, progression de lecture d'un article, temps
 * passé ACTIF.
 *
 * POURQUOI TOUT EST DANS UN SEUL EFFET. Ces mesures ne sont pas indépendantes :
 * l'événement de sortie doit rapporter la profondeur maximale et le temps actif
 * accumulés depuis l'entrée sur CETTE page. Les répartir entre plusieurs
 * composants obligerait à un état partagé mutable, et c'est exactement le genre
 * de couplage qui finit par rapporter les chiffres de la page précédente.
 * L'effet est donc rejoué à chaque changement d'URL, et son nettoyage émet la
 * sortie : la fenêtre de mesure et la durée de vie de l'effet sont la même
 * chose, par construction.
 *
 * POURQUOI LA VUE EST MANUELLE. L'App Router ne recharge pas le document : la
 * capture automatique de PostHog ne verrait qu'une seule page par session. Le
 * couple `usePathname` + `useSearchParams` est la seule source qui suit
 * réellement la navigation cliente, et `useSearchParams` impose sa frontière
 * `Suspense` — sans elle, Next bascule toute la page en rendu dynamique.
 */

/** Paliers de défilement rapportés, en pourcentage de la hauteur utile. */
const DEPTH_MARKS = [25, 50, 75, 100] as const;

/**
 * Sections qui affichent un PRIX. Ouvrir l'une d'elles est, commercialement,
 * l'événement le plus intéressant du site : c'est le moment où le visiteur
 * confronte son budget au chiffre.
 */
const PRICING_SECTIONS = new Set(["services", "packs"]);

function PageAnalyticsInner({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    if (!enabled) return;

    const pageType = pageTypeFromPathname(pathname);
    const contentSlug = slugFromPathname(pathname);
    const url = window.location.href;
    const base = {
      page_type: pageType,
      page_path: pathname,
      content_slug: contentSlug,
    };

    const enteredAt = Date.now();
    /* Temps ACTIF : l'onglet en arrière-plan ne compte pas. Un onglet oublié
       pendant deux heures rapporterait sinon deux heures de lecture. */
    let activeMs = 0;
    let activeSince = document.visibilityState === "visible" ? enteredAt : null;
    let maxDepth = 0;
    const depthsSent = new Set<number>();
    const sectionsSeen: string[] = [];
    let leaveSent = false;

    capture(ANALYTICS_EVENTS.pageView, { ...base, $current_url: url });
    const viewEvent = viewEventForPageType(pageType);
    if (viewEvent) capture(viewEvent, base);

    /* ------------------------------ défilement ---------------------------- */
    const currentDepth = (): number => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // Page plus courte que la fenêtre : elle est vue en entier d'emblée.
      if (scrollable <= 0) return 100;
      const ratio = (window.scrollY || doc.scrollTop) / scrollable;
      return Math.max(0, Math.min(100, Math.round(ratio * 100)));
    };

    const onScroll = () => {
      const depth = currentDepth();
      if (depth > maxDepth) maxDepth = depth;
      for (const mark of DEPTH_MARKS) {
        if (depth < mark || depthsSent.has(mark)) continue;
        depthsSent.add(mark);
        capture(ANALYTICS_EVENTS.scrollDepthReached, { ...base, depth: mark });
        if (pageType === "article") {
          capture(ANALYTICS_EVENTS.articleReadProgress, {
            ...base,
            article_slug: contentSlug,
            depth: mark,
          });
          if (mark === 100) {
            capture(ANALYTICS_EVENTS.articleCompleted, {
              ...base,
              article_slug: contentSlug,
            });
          }
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    /* ------------------------------- sections ----------------------------- */
    /* `rootMargin` négatif haut et bas plutôt qu'un `threshold` : une section
       plus haute que la fenêtre n'atteint JAMAIS 40 % de visibilité, elle ne
       serait donc jamais comptée. Ici une section est « vue » quand elle
       recouvre la bande centrale de la fenêtre, ce qui vaut pour une bande de
       80 px comme pour un hero de 2 000. */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = entry.target;
          if (!(node instanceof HTMLElement)) continue;
          const name = node.dataset.section ?? node.id;
          if (!name || sectionsSeen.includes(name)) continue;
          sectionsSeen.push(name);
          observer.unobserve(node);
          capture(ANALYTICS_EVENTS.sectionViewed, {
            ...base,
            section: name,
            position: sectionsSeen.length,
            time_to_view_ms: Date.now() - enteredAt,
          });
          if (PRICING_SECTIONS.has(name)) {
            capture(ANALYTICS_EVENTS.pricingViewed, {
              ...base,
              section: name,
              trigger: "section_visible",
            });
          }
        }
      },
      { threshold: 0, rootMargin: "-20% 0px -20% 0px" },
    );
    for (const node of document.querySelectorAll<HTMLElement>(
      "[data-section]",
    )) {
      observer.observe(node);
    }

    /* -------------------------------- visibilité -------------------------- */
    const onVisibility = () => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        activeSince = now;
        return;
      }
      if (activeSince !== null) {
        activeMs += now - activeSince;
        activeSince = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* --------------------------------- sortie ----------------------------- */
    const leave = (reason: "navigation" | "unload") => {
      if (leaveSent) return;
      leaveSent = true;
      if (activeSince !== null) {
        activeMs += Date.now() - activeSince;
        activeSince = null;
      }
      const payload = {
        ...base,
        $current_url: url,
        active_seconds: Math.round(activeMs / 1000),
        total_seconds: Math.round((Date.now() - enteredAt) / 1000),
        max_scroll_depth: maxDepth,
        sections_viewed: sectionsSeen.length,
        sections: sectionsSeen,
        leave_reason: reason,
      };
      capture(ANALYTICS_EVENTS.pageLeave, payload);
      capture(ANALYTICS_EVENTS.pageEngagement, payload);
    };

    /* `pagehide` et non `beforeunload` : c'est le seul qui se déclenche aussi
       sur mobile (fermeture d'onglet, bascule d'application) et qui laisse la
       page éligible au cache retour/avant. */
    const onPageHide = () => leave("unload");
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      leave("navigation");
    };
  }, [enabled, pathname, query]);

  return null;
}

export function PageAnalytics({ enabled }: { enabled: boolean }) {
  return (
    <Suspense fallback={null}>
      <PageAnalyticsInner enabled={enabled} />
    </Suspense>
  );
}
