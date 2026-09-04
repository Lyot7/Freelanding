"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useReducedMotionAfterMount } from "@/components/motion/reducedMotion";
import { uiLabels } from "@/content/ui";
import type { ImageAsset } from "@/lib/content";

/** Remplace `%1`, `%2` et `%n` dans un gabarit de `uiLabels.work`. */
function remplir(
  gabarit: string,
  avant: string,
  apres: string,
  pourcentage?: number,
): string {
  return gabarit
    .replace("%n", String(pourcentage ?? 0))
    .replace("%1", avant)
    .replace("%2", apres);
}

/**
 * Comparateur avant / après : deux captures superposées, mélangées par un
 * curseur.
 *
 * CE QU'IL REMPLACE, ET POURQUOI. Sur la page Würth, deux captures montraient
 * le même écran à deux instants — les contraintes du mot de passe en rouge
 * avant la frappe, les mêmes en vert une fois le mot de passe accepté. Posées
 * l'une sous l'autre dans la galerie, elles obligeaient le lecteur à retenir la
 * première pour la comparer à la seconde, neuf cents pixels plus bas. La
 * différence était pourtant tout le propos.
 *
 * LES DEUX ÉTATS NE SE SUPERPOSENT PAS AU PIXEL, et c'est la contrainte qui
 * gouverne tout le reste. Quand le mot de passe est accepté, « Force du mot de
 * passe : Fort » passe sur deux lignes et pousse ce qui suit. Mesuré au profil
 * des lignes de contenu sur les captures d'origine : l'étiquette et le champ
 * sont alignés au pixel, la barre de force descend de 24 px, le bloc des trois
 * contraintes de 48. Aucun recadrage ne corrige ça, c'est le formulaire qui
 * bouge.
 *
 * LE RIDEAU EST GARDÉ, LE FONDU A ÉTÉ ESSAYÉ ET REJETÉ. Un fondu croisé semblait
 * la réponse évidente : pas de couture verticale, donc pas de marche. Rendu, il
 * est pire — à mi-course, les deux jeux de textes décalés se lisent EN MÊME
 * TEMPS, chaque ligne doublée douze pixels plus bas, et le cadre devient
 * illisible. Le rideau, lui, ne montre jamais qu'un seul état à un endroit
 * donné : le décalage s'y lit comme ce qu'il est, du contenu qui glisse quand
 * l'état change.
 *
 * IL BOUGE SEUL, PUIS SE TAIT. Un comparateur immobile ressemble à une image
 * fixe : rien n'indique qu'il y a deux états dessous. Il joue donc un
 * aller-retour tant que personne n'y a touché, et s'arrête DÉFINITIVEMENT à la
 * première interaction — souris, tactile ou clavier. Une animation qui reprend
 * la main après un geste de l'utilisateur est une animation qui se bat contre
 * lui.
 *
 * IL NE DÉMARRE QU'À L'ÉCRAN. Un `IntersectionObserver` retient l'animation
 * tant que le bloc n'est pas visible : sinon elle a déjà fait dix allers-retours
 * quand le lecteur arrive dessus.
 *
 * LE CURSEUR EST UN VRAI `<input type="range">`, rendu VISIBLE sous le cadre
 * plutôt que transparent par-dessus les images. Posé sur le cadre, il volait
 * tous les gestes de la zone, y compris le simple survol, et rien n'indiquait
 * qu'on pouvait l'attraper ailleurs que sur la poignée. Sous le cadre, il est
 * ce qu'il est : un rail, entre les deux libellés d'état. C'est aussi ce qui le
 * rend utilisable au clavier (flèches, Origine, Fin) et annonçable par un
 * lecteur d'écran ; les deux `alt` restent portés par les images.
 *
 * SENS DU CURSEUR : à gauche l'AVANT, à droite l'APRÈS, comme les deux libellés
 * et comme l'image sous le rideau. `position` compte donc la part d'APRÈS
 * révélée, et le rognage de l'état avant se fait par la droite.
 */
export function ComparateurAvantApres({
  avant,
  apres,
  libelleAvant,
  libelleApres,
  className = "",
  sizes = "calc(100vw - 40px)",
}: {
  avant: ImageAsset;
  apres: ImageAsset;
  libelleAvant: string;
  libelleApres: string;
  className?: string;
  sizes?: string;
}) {
  const [position, setPosition] = useState(50);
  const [fige, setFige] = useState(false);
  const [visible, setVisible] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionAfterMount();
  const id = useId();

  const figer = useCallback(() => setFige(true), []);

  /* Le bloc n'anime que pendant qu'il est à l'écran. Marge négative de 20 % :
     l'animation démarre quand le comparateur est franchement entré, pas dès que
     son premier pixel affleure le bas de la fenêtre. */
  useEffect(() => {
    const cible = cadre.current;
    if (!cible || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observateur = new IntersectionObserver(
      ([entree]) => setVisible(entree?.isIntersecting ?? false),
      { rootMargin: "-20% 0px -20% 0px" },
    );
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, []);

  /*
   * L'ALLER-RETOUR EST CALCULÉ SUR L'HORLOGE, pas incrémenté image par image.
   * Un compteur qui ajoute un pas à chaque `requestAnimationFrame` va deux fois
   * plus vite sur un écran à 120 Hz que sur un écran à 60, et se décale un peu
   * plus à chaque image sautée. La position se déduit donc du temps écoulé, ce
   * qui donne la même course partout.
   *
   * Course : 15 % à 85 %, sur une sinusoïde de 9 s. Les bords ne sont pas
   * atteints exprès — un comparateur qui va jusqu'à 0 ou 100 montre pendant une
   * seconde une image seule, et le lecteur croit que l'autre a disparu.
   *
   * ELLE DOIT COUVRIR LA ZONE QUI CHANGE, et c'est ce qui a fait passer la
   * course de 22–78 à 15–85. Sur le comparateur de Würth, ce qui change — les
   * trois contraintes — occupe le tiers gauche du cadre, le reste étant le
   * blanc du formulaire, identique des deux côtés. Un curseur qui ne descendait
   * pas sous 22 % ne traversait donc jamais la première puce, et l'animation
   * balayait surtout du vide.
   */
  useEffect(() => {
    if (fige || reduced || !visible) return;
    let image = 0;
    let depart: number | null = null;
    const PERIODE = 9000;
    const tic = (horodatage: number) => {
      if (depart === null) depart = horodatage;
      const phase = ((horodatage - depart) % PERIODE) / PERIODE;
      setPosition(50 + 35 * Math.sin(phase * 2 * Math.PI));
      image = requestAnimationFrame(tic);
    };
    image = requestAnimationFrame(tic);
    return () => cancelAnimationFrame(image);
  }, [fige, reduced, visible]);

  /*
   * `object-contain` ET NON `object-cover`. Le cadre reprend déjà le rapport
   * exact de l'image, donc les deux donneraient le même rendu tant que la
   * donnée est juste. Mais `cover` ROGNE dès que `width`/`height` se périment —
   * un fichier remplacé, un recadrage oublié dans la donnée — et il le fait en
   * silence, en coupant les bords d'une capture d'interface : un message
   * d'erreur, un libellé de champ. `contain` laisse au pire une bande de fond,
   * défaut visible qui se corrige, plutôt qu'une information perdue que
   * personne ne remarque.
   */
  const ratio =
    avant.width && avant.height ? `${avant.width} / ${avant.height}` : "16 / 10";

  return (
    <div ref={cadre} className={className}>
      <div
        className="relative w-full select-none overflow-hidden bg-white"
        style={{ aspectRatio: ratio }}
      >
        {/* État APRÈS en dessous, sur toute la surface. */}
        <Image
          src={apres.src}
          alt={apres.alt}
          fill
          sizes={sizes}
          className="object-contain object-center"
        />
        {/* État AVANT par-dessus, à l'opacité que dit le curseur. `opacity` et
            non `clip-path` : voir la note de tête, les deux états ne se
            superposent pas au pixel. */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${position}% 0 0)` }}
        >
          <Image
            src={avant.src}
            alt={avant.alt}
            fill
            sizes={sizes}
            className="object-contain object-center"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-[2] w-px bg-background"
          style={{ left: `${100 - position}%` }}
        />
      </div>

      {/* Rail du curseur, entre les deux libellés d'état. Il DIT où l'on en
          est : sans ligne de séparation, un fondu sans rail ne laisse rien
          deviner de ce qui le pilote. */}
      <div className="mt-[12px] flex items-center gap-[12px] tablet:mt-[16px]">
        <span className="flex flex-none items-center gap-[8px] text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60 tablet:text-[12px]">
          <span aria-hidden className="h-[8px] w-[8px] flex-none rounded-full bg-background/30" />
          {libelleAvant}
        </span>
        <label htmlFor={id} className="sr-only">
          {remplir(uiLabels.work.compareSliderLabel, libelleAvant, libelleApres)}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={position}
          aria-valuetext={remplir(
            uiLabels.work.compareSliderValueText,
            libelleAvant,
            libelleApres,
            Math.round(100 - position),
          )}
          onChange={(evenement) => {
            figer();
            setPosition(Number(evenement.target.value));
          }}
          onPointerDown={figer}
          onKeyDown={figer}
          className="comparateur-rail h-[20px] min-w-0 flex-1 cursor-ew-resize appearance-none bg-transparent"
        />
        <span className="flex flex-none items-center gap-[8px] text-right text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60 tablet:text-[12px]">
          {libelleApres}
          <span aria-hidden className="h-[8px] w-[8px] flex-none rounded-full bg-accent" />
        </span>
      </div>
    </div>
  );
}
