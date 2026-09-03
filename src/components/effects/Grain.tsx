"use client";

import { useEffect, useRef } from "react";

// Texture generee par nos soins (bruit gaussien 256x256, graine fixe). Le
// fichier du template faisait le meme travail, mais sa licence n'etait pas
// tracable et du bruit aleatoire ne merite pas qu'on la cherche.
const TEXTURE = "/images/grain.png";

/**
 * SEUL calque de grain du site. Il n'existe AUCUN grain global : la source pose
 * tous ses calques en `position: absolute` à l'intérieur d'une section, d'une
 * carte ou du footer (relevé : 5 calques sur `/contact`, 17 sur `/` à 1440).
 * Le calque `fixed` que nous posions en plus peignait une seconde fois par
 * dessus chaque section — sur le héros de `/contact`, 0,07 de section PLUS 0,05
 * de calque global là où la source n'a que 0,05.
 *
 * DEUX COUCHES. L'enveloppe `inset-0` clippe, la couche interne surdimensionnée
 * porte la dérive : on ne peut pas translater une couche `inset-0` sans
 * découvrir un bord. Géométrie et loi de mouvement sont dans `globals.css`
 * (`.grain-layer` / `.grain-drift`), avec le détail des mesures.
 *
 * HORLOGE PARTAGÉE. Sur la source, les cinq calques de `/contact` affichent au
 * même instant exactement le même déplacement (-14,00 % / +11,50 % sur des
 * calques de 544, 1380, 2760 et 5760 px) : une seule horloge les pilote. Une
 * animation CSS, elle, démarre au moment où l'élément est rendu ; nos calques
 * montés par une révélation démarraient donc déphasés, et deux d'entre eux
 * (footer) ne démarraient jamais. On recale la phase sur l'origine de la
 * timeline du document, ce qui remet tous les calques d'accord sans rien coûter
 * par image.
 *
 * MISE EN PAUSE HORS CHAMP. Un calque hors écran continue d'être recomposé à
 * chaque image. La home en compte dix-sept, dont un à quatre seulement sont
 * visibles à un instant donné : la surface réellement animée tombe de 184 Mpx à
 * 4-62 Mpx (médiane 24), soit 13 % du total. Mesure A/B sur la home à 1440,
 * défilement scripté de 4 s, trois passes, médiane : temps de tâche 1,21 s sans
 * la pause contre 1,07 s avec (-12 %), recalcul de style 0,13 s contre 0,10 s
 * (-23 %).
 *
 * C'est ce levier, et le retrait du calque global, qui portent le gain : le
 * rétrécissement du calque (240 % × 260 % au lieu de 400 %) valait 53 % de
 * texture composée en moins mais faisait sortir `audit-live` à -1052 px de
 * hauteur sur les neuf routes, voir le commentaire de `globals.css`.
 */

const MARGE = "300px";

let observateur: IntersectionObserver | null = null;

function reduitLeMouvement() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function obtenirObservateur() {
  if (observateur) return observateur;
  if (typeof IntersectionObserver === "undefined") return null;
  observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        // On OBSERVE l'enveloppe (exactement la surface granulée) mais on AGIT
        // sur la couche interne. Observer la couche elle-même reviendrait à
        // tester une boîte de 400 % × 400 %, qui croise la fenêtre bien avant et
        // bien après sa section : sur la home, elle restait « visible » sur
        // plus de 1500 px de chaque côté, ce qui annulait l'essentiel de la
        // mise en pause (six calques actifs au lieu de deux).
        const el = entree.target.firstElementChild as HTMLElement | null;
        if (!el) continue;
        for (const anim of el.getAnimations()) {
          if (entree.isIntersecting) {
            anim.play();
            // Recalage de phase : `startTime = 0` ancre l'animation sur
            // l'origine de la timeline du document, la même pour tous.
            try {
              anim.startTime = 0;
            } catch {
              /* Une timeline non résolue refuse l'écriture : sans gravité. */
            }
          } else {
            anim.pause();
          }
        }
        // `will-change` retiré hors champ : c'est lui qui maintient la texture
        // promue même quand l'animation est en pause.
        el.style.willChange = entree.isIntersecting ? "transform" : "auto";
      }
    },
    { rootMargin: MARGE },
  );
  return observateur;
}

export function Grain({
  opacity = 0.08,
  className = "",
}: {
  /** Opacité RELEVÉE sur la source pour ce calque précis, jamais choisie. */
  opacity?: number;
  /** Empilement de l'enveloppe (`z-[n]`), relevé lui aussi sur la source. */
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduitLeMouvement()) return;
    const obs = obtenirObservateur();
    if (!obs) return;
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 select-none overflow-hidden ${className}`}
    >
      <span
        className="grain-layer grain-drift block"
        style={{ backgroundImage: `url('${TEXTURE}')`, opacity }}
      />
    </span>
  );
}
