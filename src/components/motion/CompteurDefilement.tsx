"use client";

import { useEffect, useRef } from "react";
import { useProgressionDefilement } from "./useProgressionDefilement";

/**
 * Chiffre qui monte de 0 à sa valeur AU RYTHME DU DÉFILEMENT, et redescend si
 * l'on remonte. Remplace le décompte minuté sur les chiffres de l'accueil
 * (« l'IA fait le sale boulot », « les chiffres ») : même famille de mouvement
 * que la semaine de bureau de la section « temps gagné ».
 *
 * La valeur exacte est rendue d'emblée (serveur, sans JavaScript, animations
 * réduites) et lue telle quelle par les lecteurs d'écran ; seul l'affichage
 * visible compte.
 */
export function CompteurDefilement({
  cible,
  decimales = 0,
  libelle,
  className,
  debut,
  fin,
}: {
  cible: number;
  decimales?: number;
  /** Texte annoncé aux lecteurs d'écran, la valeur finale complète. */
  libelle: string;
  className?: string;
  debut?: number;
  fin?: number;
}) {
  const racine = useRef<HTMLSpanElement>(null);
  const { progression, actif } = useProgressionDefilement(racine, debut, fin);
  const chiffre = useRef<HTMLSpanElement>(null);
  const final = cible.toFixed(decimales);

  // Rien à compter sous 2 : « 0 projet à la fois » serait faux en chemin.
  const compte = actif && cible >= 2;

  /* Le chiffre est écrit directement dans le nœud texte que React a posé, à
     chaque image de défilement, sans repasser par React : un rendu par pixel
     défilé serait du gaspillage. */
  useEffect(() => {
    const texte = chiffre.current?.firstChild;
    if (!texte || !compte) return;
    const poser = (p: number) => {
      texte.nodeValue = (p * cible).toFixed(decimales);
    };
    poser(progression.get());
    const arreter = progression.on("change", poser);
    return () => {
      arreter();
      texte.nodeValue = final;
    };
  }, [compte, cible, decimales, final, progression]);

  return (
    <span ref={racine} className={className} data-compteur={cible}>
      <span className="sr-only">{libelle}</span>
      <span ref={chiffre} aria-hidden className="tabular-nums">
        {final}
      </span>
    </span>
  );
}
