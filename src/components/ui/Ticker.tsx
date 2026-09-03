"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "motion/react";

// useLayoutEffect côté client (avant paint), useEffect côté serveur (no-op SSR).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Ticker — bandeau de texte défilant à VITESSE CONSTANTE, reproduisant le
 * composant Framer Ticker des cartes projet (`.framer-1i699rn` > `<ul>`).
 *
 * Spec MESURÉE sur le live (Chrome réel, rAF actif, 3 instances) :
 *   - vitesse -110 px/s EXACTEMENT (relevés sur intervalles d'1,000 s :
 *     -110.011, -110.000, -110.022 px), vers la GAUCHE ;
 *   - `gap: 14px`, wrap modulo `largeurItem + 14` (période mesurée : 512.203 /
 *     670.828 / 735.453 px pour des items de 498.203 / 656.828 / 721.453 px) ;
 *   - `ty = 0` et `scale = 1` en permanence ;
 *   - nombre de copies = `ceil((largeurBande + largeurItem) / (largeurItem + gap))`,
 *     ce qui redonne les 4 / 4 / 3 enfants observés ;
 *   - GELÉ hors viewport, et reprise SANS rattrapage depuis la valeur figée
 *     (mesuré : 1,85 px de dérive sur 1502 ms d'absence, soit une seule frame,
 *     contre 165 px si l'animation avait continué).
 *
 * Pourquoi une animation CSS et non une boucle rAF comme Framer : la vitesse est
 * constante et le wrap strictement périodique, donc une keyframe linéaire de
 * période `largeurItem + gap` produit exactement le même rendu, tout en étant
 * composée par le GPU sans réveiller le thread principal à chaque frame. La mise
 * en pause hors écran passe par `animation-play-state`, qui fige la position
 * courante et reprend sans rattrapage — précisément le comportement mesuré.
 *
 * La largeur de l'item dépend du texte ET de la fonte chargée : elle est donc
 * mesurée au runtime (`ResizeObserver`), ce qui fixe la période et la durée
 * (`période / 110`). Aucune valeur en dur.
 *
 * REPOS (SSR, no-JS, `prefers-reduced-motion`) : le texte est rendu, immobile et
 * lisible. Rien n'est jamais masqué si l'animation ne tourne pas.
 */

/** Vitesse de défilement mesurée sur le live, en px/s. */
const SPEED_PX_PER_S = 110;
/** Gouttière entre deux copies, mesurée sur le live. */
const GAP_PX = 14;

export function Ticker({
  text,
  className = "",
  itemClassName = "",
}: {
  text: string;
  className?: string;
  itemClassName?: string;
}) {
  const bandRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLLIElement>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [bandWidth, setBandWidth] = useState(0);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();

  // Mesure de la bande et d'une copie.
  //
  // La mesure initiale est SYNCHRONE (`useLayoutEffect`) et ne dépend donc pas
  // du `ResizeObserver` : celui-ci est livré via les étapes de rendu, gelées
  // dans un document caché (onglet en arrière-plan), ce qui laisserait le
  // bandeau non initialisé. Le RO ne sert qu'aux changements ULTÉRIEURS
  // (redimensionnement), et `document.fonts.ready` déclenche une re-mesure car
  // la largeur du texte dépend de la fonte réellement chargée : mesurée avec la
  // fonte de repli, elle serait fausse de plusieurs pourcents.
  useIsoLayoutEffect(() => {
    const band = bandRef.current;
    const item = itemRef.current;
    if (!band || !item) return;

    const measure = () => {
      setBandWidth(band.getBoundingClientRect().width);
      setItemWidth(item.getBoundingClientRect().width);
    };
    measure();

    let cancelled = false;
    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }

    const ro = new ResizeObserver(measure);
    ro.observe(band);
    ro.observe(item);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, []);

  // Gel hors viewport (équivalent du `useInView` de Framer, rootMargin 100px).
  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    io.observe(band);
    return () => io.disconnect();
  }, []);

  const period = itemWidth + GAP_PX;
  // Copies nécessaires pour couvrir la bande sans jamais découvrir de vide.
  const copies =
    itemWidth > 0 && bandWidth > 0
      ? Math.ceil((bandWidth + itemWidth) / period)
      : 1;
  const animated = !reduced && itemWidth > 0;

  const trackStyle: CSSProperties = animated
    ? ({
        "--ticker-shift": `${period}px`,
        animation: `ticker-scroll ${period / SPEED_PX_PER_S}s linear infinite`,
        animationPlayState: inView ? "running" : "paused",
        willChange: "transform",
      } as CSSProperties)
    : {};

  return (
    <div
      ref={bandRef}
      // Décoratif : le titre du projet est déjà exposé en texte par la carte,
      // laisser lire les copies serait une répétition parasite.
      aria-hidden
      /* `accent-room` : le ruban COUPAIT les accents des capitales. Relevé au
         2026-08-27 sur la carte Würth, à 100 px de corps : l'encre d'un « É »
         ou d'un « Ü » monte à 91 px au-dessus de la ligne de base pour 77 px
         de place dans la boîte de ligne, soit 14 px de débord — le titre se
         lisait « CREATION DE COMPTE, WURTH ». Les capitales sans accent, elles,
         tiennent (65,3 px) : le ruban n'est pas une tranche voulue, il est
         calibré au ras de la capitale anglaise.

         `overflow-clip-margin` et non `accent-room` : la marge de coupe
         n'existe qu'au rendu, elle ne déplace rien. Un `padding` compensé par
         une marge négative, lui, remonte réellement un élément flex dans sa
         ligne — c'est ce qui a fait sortir un autre titre du fond de sa
         section, où son accent, noir sur noir, a disparu.

         22 px À TOUTES LES LARGEURS, et non la classe `accent-clip-titre` :
         celle-ci suit l'échelle 52/68/92 des grands titres, alors que ce ruban
         garde un corps FIXE de 100 px du mobile au bureau. Ses 12 px de mobile
         ne suffisaient pas aux 14 px de débord, et l'accent repartait coupé
         sous 1200 px. 22 px laissent 8 px d'air partout. Le remplissage remonte la limite de coupe, la marge négative de
         même valeur annule son effet sur la position du ruban : rien ne bouge
         à l'écran, sauf l'accent qui réapparaît. */
      className={
        "[overflow-clip-margin:22px] pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 " +
        "overflow-clip rounded-[10px] " +
        className
      }
    >
      <ul
        // Le ruban APPARAÎT EN FONDU à l'entrée dans le viewport, en plus de
        // défiler : sur le live cet élément voit son opacité ET son transform
        // varier, chez nous seul le transform bougeait. L'observateur qui gèle
        // déjà le défilement hors écran sert aussi de déclencheur, sans en
        // ajouter un second.
        className={
          "m-0 flex w-full list-none flex-row items-center justify-start p-0 " +
          "transition-opacity duration-700 ease-out motion-reduce:transition-none " +
          // `animated` sert de garde-fou : il vaut faux tant que la largeur
          // d'un item n'a pas été mesurée côté client, donc en rendu serveur et
          // sans JS. L'état de repos reste ainsi l'état final VISIBLE, et le
          // ruban ne peut pas rester masqué pour toujours si rien ne tourne.
          (!animated || inView ? "opacity-100" : "opacity-0")
        }
        style={{ gap: `${GAP_PX}px`, ...trackStyle }}
      >
        {Array.from({ length: copies }, (_, i) => (
          <li
            key={i}
            ref={i === 0 ? itemRef : undefined}
            className="h-fit w-fit flex-none"
          >
            <p
              className={
                "m-0 whitespace-pre p-0 text-right text-[100px] font-semibold " +
                "uppercase leading-[82px] tracking-[-0.04em] text-foreground " +
                itemClassName
              }
            >
              {text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
