"use client";

import { useEffect, useState } from "react";
import type { EntreeSommaire } from "@/lib/blog/sommaire";

/**
 * Sommaire de l'article, posé dans la colonne gauche.
 *
 * POURQUOI ICI. Le gabarit compose le corps sur la moitié droite et laisse
 * l'autre moitié vide — 720 px sur une fenêtre de 1440. Le remplir d'images
 * décoratives aurait été le geste rapide et le moins utile : elles ne se lisent
 * pas, elles pèsent, et pour la plupart des articles il n'y a rien de réel à
 * montrer. Un sommaire, lui, sert à quelque chose : il dit à quoi ressemble
 * l'article avant de le lire, il donne des ancres partageables, et il montre où
 * on en est.
 *
 * LA SECTION COURANTE EST CALCULÉE PAR POSITION, et j'ai commencé par le
 * contraire. Un `IntersectionObserver` sur les titres, avec une bande étroite au
 * milieu de la fenêtre, est la solution qu'on lit partout : elle ne réveille le
 * fil principal qu'aux franchissements. MESURÉ ici : après un saut de défilement
 * (clic sur une ancre, molette rapide, `scrollTo`), AUCUNE section n'était
 * marquée — le titre traverse la bande sans que l'observateur ne le voie, et
 * rien ne rattrape le coup. Un sommaire qui n'indique rien dès qu'on saute ne
 * remplit pas son office.
 *
 * Le calcul par position n'a pas ce trou : à tout moment, la section active est
 * la DERNIÈRE dont le titre est passé au-dessus du tiers haut de la fenêtre,
 * qu'on y soit arrivé en défilant ou d'un bond. Le coût est de comparer quelques
 * rectangles, une fois par image au plus (l'écouteur est passif et replié dans
 * un `requestAnimationFrame`), sur une poignée de titres.
 *
 * SANS JAVASCRIPT, le sommaire reste rendu et ses liens fonctionnent : seule la
 * mise en évidence disparaît. C'est le bon ordre de dépendance pour une table
 * des matières.
 */
export function TableOfContents({
  entrees,
  titre,
}: {
  entrees: readonly EntreeSommaire[];
  titre: string;
}) {
  const [actif, setActif] = useState<string | null>(null);

  useEffect(() => {
    if (entrees.length === 0) return;

    let planifie = false;

    const calculer = () => {
      planifie = false;
      // Le tiers haut de la fenêtre : un titre au-dessus de cette ligne est
      // considéré comme lu, donc sa section est celle qu'on parcourt.
      const seuil = window.innerHeight / 3;
      let courant = entrees[0]?.id ?? null;
      for (const { id } of entrees) {
        const cible = document.getElementById(id);
        if (cible && cible.getBoundingClientRect().top <= seuil) courant = id;
      }
      setActif(courant);
    };

    const auDefilement = () => {
      if (planifie) return;
      planifie = true;
      requestAnimationFrame(calculer);
    };

    calculer();
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement, { passive: true });
    return () => {
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
    };
  }, [entrees]);

  if (entrees.length === 0) return null;

  return (
    <nav
      aria-label={titre}
      className="sticky top-[110px] max-w-[320px] pb-[40px]"
    >
      <p className="text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/40">
        {titre}
      </p>
      <ol className="mt-[14px] list-none p-0">
        {entrees.map(({ id, titre: texte }, index) => {
          const courant = actif === id;
          return (
            <li key={id} className="mt-[10px] first:mt-0">
              <a
                href={`#${id}`}
                aria-current={courant ? "true" : undefined}
                className={`flex gap-[10px] text-[13px] font-medium leading-[1.3] tracking-[-0.01em] no-underline transition-colors duration-200 motion-reduce:transition-none ${
                  courant
                    ? "text-background"
                    : "text-background/40 hover:text-background/70"
                }`}
              >
                <span className="shrink-0 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{texte}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
