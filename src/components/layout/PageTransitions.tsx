"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * PageTransitions — transitions de page via l'API native View Transitions,
 * reproduisant le comportement MESURÉ du live.
 *
 * Le live appelle `document.startViewTransition` autour de son changement de
 * route, sans rideau ni overlay, et n'anime que la RACINE : aucun
 * `view-transition-name` n'a été relevé sur un autre élément, donc aucun morph
 * d'élément partagé, sur les 7 trajets testés. Les animations elles-mêmes vivent
 * dans `globals.css` (`::view-transition-old(root)` / `new(root)`), avec les
 * durées et easings mesurés.
 *
 * Pourquoi l'API native et non le composant `<ViewTransition>` de React : ce
 * dernier exige une version canary de React (l'export est absent de la 19.2.4
 * installée) et nomme les pseudo-éléments, alors que le live cible `root`. Passer
 * par l'API directement évite un changement de dépendance ET colle à la mesure.
 *
 * Deux détails repris du live, tous deux mesurés :
 *   - la remise à zéro du scroll se fait DANS le callback et sans `behavior`,
 *     donc instantanée et masquée par le snapshot de l'ancienne page ;
 *   - sur retour arrière, on ne touche PAS au scroll : le live laisse la
 *     restauration native opérer (aucun `scrollTo` relevé dans son journal).
 *
 * Dégradation : si le navigateur n'expose pas l'API (Safari et Firefox à ce
 * jour), on ne fait rien et la navigation Next normale s'applique, sans
 * animation. C'est exactement ce que fait le live.
 */

/** `startViewTransition` n'est pas encore dans les types DOM standard. */
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => unknown;
};

/**
 * Garde-fou : si la navigation n'aboutit pas, la promesse de transition ne se
 * résoudrait jamais et la page resterait gelée sous le snapshot. Le live monte à
 * ~1,4 s sur une route froide, ce plafond laisse donc largement la marge.
 */
const NAVIGATION_TIMEOUT_MS = 3000;

/**
 * Plafond BEAUCOUP plus court sur retour arrière : le rendu y est déjà en cours
 * quand on installe l'attente, donc le risque de la manquer existe. Si on la
 * manque, mieux vaut une coupe sèche quasi immédiate qu'un gel de plusieurs
 * secondes sous l'instantané.
 */
const POPSTATE_TIMEOUT_MS = 500;

export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const pendingResolve = useRef<(() => void) | null>(null);
  // Dernier chemin RENDU par React, à distinguer de `location.pathname` qui, sur
  // retour arrière, vaut déjà la nouvelle valeur avant que React n'ait re-rendu.
  const renderedPath = useRef(pathname);

  // La nouvelle route est rendue : on libère la transition en attente.
  useEffect(() => {
    renderedPath.current = pathname;
    const resolve = pendingResolve.current;
    if (resolve) {
      pendingResolve.current = null;
      resolve();
    }
  }, [pathname]);

  // Retour / avance navigateur : le live joue la MÊME transition (non inversée)
  // et laisse la restauration NATIVE du scroll opérer — aucun `scrollTo` n'a été
  // relevé dans son journal. On capture donc l'instantané dès `popstate`, avant
  // que React n'ait re-rendu, et on ne touche pas au scroll.
  useEffect(() => {
    const doc = document as DocumentWithViewTransition;
    const start = doc.startViewTransition;
    if (typeof start !== "function") return;

    const onPopState = () => {
      // Même route (changement d'ancre, état poussé sans navigation) : rien à faire.
      if (window.location.pathname === renderedPath.current) return;

      start.call(doc, () => {
        const rendered = new Promise<void>((resolve) => {
          pendingResolve.current = resolve;
        });
        const safety = new Promise<void>((resolve) => {
          window.setTimeout(resolve, POPSTATE_TIMEOUT_MS);
        });
        return Promise.race([rendered, safety]).then(() => {
          pendingResolve.current = null;
        });
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const doc = document as DocumentWithViewTransition;
    const start = doc.startViewTransition;
    if (typeof start !== "function") return;

    const onClick = (event: MouseEvent) => {
      // Laisser passer tout ce qui n'est pas un clic gauche simple : ouverture
      // dans un nouvel onglet, clic milieu, raccourcis, handler déjà traité.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      // Interne uniquement : exclut http(s) externe, mailto:, tel:, et #ancre.
      if (!href || !href.startsWith("/")) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Même route : pas de transition (le live n'en joue pas non plus).
      if (url.pathname === window.location.pathname) return;

      // Capture + arrêt de la propagation : le handler de `next/link` ne doit PAS
      // s'exécuter, sinon il navigue de son côté et la navigation serait double.
      // C'est aussi la raison de l'écoute en capture — en bulle, `next/link` a
      // déjà appelé `preventDefault` et le garde ci-dessus nous ferait sortir,
      // donc la transition ne se déclencherait jamais.
      event.preventDefault();
      event.stopPropagation();

      start.call(doc, () => {
        const navigated = new Promise<void>((resolve) => {
          pendingResolve.current = resolve;
          router.push(href);
        });
        const safety = new Promise<void>((resolve) => {
          window.setTimeout(resolve, NAVIGATION_TIMEOUT_MS);
        });
        return Promise.race([navigated, safety]).then(() => {
          pendingResolve.current = null;
          window.scrollTo(0, 0);
        });
      });
    };

    doc.addEventListener("click", onClick);
    return () => doc.removeEventListener("click", onClick);
  }, [router]);

  return null;
}
