"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { motionValue, type MotionValue } from "motion/react";

/**
 * Progression 0 → 1 d'un élément à travers l'écran, LIÉE AU DÉFILEMENT.
 *
 * Demande d'Eliott du 2026-11-02 : les sections « temps gagné », « le bon
 * remède », « l'IA fait le sale boulot » et « les chiffres » s'animent au
 * scroll. Une seule famille de mouvement pour les quatre : c'est le pouce qui
 * fait avancer la démonstration ou le compteur, et remonter la page le fait
 * reculer. Correspondance linéaire, sans courbe : une courbe décrocherait la
 * page du doigt.
 *
 * `debut` et `fin` sont des fractions de la hauteur d'écran : la progression
 * vaut 0 quand le HAUT de l'élément passe à `debut`, 1 quand son BAS passe à
 * `fin`. Avec 0.85 et 0.55, l'animation commence quand l'élément entre par le
 * bas et finit quand il est posé au milieu de l'écran.
 *
 * `actif` vaut faux côté serveur, et tant que le visiteur demande moins
 * d'animations : la progression reste alors à 1, l'état final, qui est aussi
 * celui rendu sans JavaScript.
 *
 * Un écouteur `scroll` passif, regroupé par image : Lenis fait défiler la
 * fenêtre elle-même, l'événement suit donc le défilement lissé.
 */
export function useProgressionDefilement(
  cible: RefObject<HTMLElement | null>,
  debut = 0.85,
  fin = 0.55,
): { progression: MotionValue<number>; actif: boolean } {
  const [progression] = useState(() => motionValue(1));
  const actif = useSyncExternalStore(suivrePreference, mouvementPermis, () => false);

  useEffect(() => {
    if (!actif) {
      progression.set(1);
      return;
    }

    let image: number | null = null;
    const mesurer = () => {
      image = null;
      const element = cible.current;
      if (!element) return;
      const boite = element.getBoundingClientRect();
      const ecran = window.innerHeight;
      const depart = ecran * debut;
      const parcours = depart - (ecran * fin - boite.height);
      const brute = parcours > 0 ? (depart - boite.top) / parcours : 1;
      progression.set(Math.min(1, Math.max(0, brute)));
    };
    const demander = () => {
      if (image === null) image = window.requestAnimationFrame(mesurer);
    };

    mesurer();
    window.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    return () => {
      window.removeEventListener("scroll", demander);
      window.removeEventListener("resize", demander);
      if (image !== null) window.cancelAnimationFrame(image);
    };
  }, [actif, cible, debut, fin, progression]);

  return { progression, actif };
}

const REDUIT = "(prefers-reduced-motion: reduce)";

function mouvementPermis(): boolean {
  return !window.matchMedia?.(REDUIT).matches;
}

/** Préférence changée en cours de visite : `actif` suit, l'état final revient. */
function suivrePreference(rappel: () => void): () => void {
  const requete = window.matchMedia?.(REDUIT);
  requete?.addEventListener?.("change", rappel);
  return () => requete?.removeEventListener?.("change", rappel);
}

/** Avancement d'une tranche `[de, a]` de la progression, ramené à 0 → 1. */
export function tranche(progression: number, de: number, a: number): number {
  if (a <= de) return progression >= a ? 1 : 0;
  return Math.min(1, Math.max(0, (progression - de) / (a - de)));
}
