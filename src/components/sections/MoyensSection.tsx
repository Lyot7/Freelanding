"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TitreMasque } from "@/components/motion/TitreMasque";
import { DELAI_MAX } from "@/components/motion/tempo";
import { Trait } from "@/components/motion/Trait";
import { FlecheSortante } from "@/components/ui/FlecheSortante";
import type { MoyensContent } from "@/lib/content/types";

/**
 * LES TROIS MOYENS DE RENDRE DU TEMPS (2026-11-01).
 *
 * Le titre reste fixe pendant que les lignes défilent sous lui : celle du milieu
 * de l'écran passe en encre pleine, les autres s'effacent. La troisième est une
 * option, plus petite et étiquetée : son déroulé vit sur `/services/automatisation`.
 */
/** Les lignes à observer, aucune tant que la liste n'existe pas. */
export function lignesDe(liste: Element | null): Element[] {
  return liste ? [...liste.children] : [];
}

export function MoyensSection({ moyens }: { moyens: MoyensContent }) {
  const [active, setActive] = useState(0);
  const liste = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const lignes = lignesDe(liste.current);
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (entree.isIntersecting) setActive(lignes.indexOf(entree.target));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const ligne of lignes) observateur.observe(ligne);
    return () => observateur.disconnect();
  }, []);

  return (
    <section
      id="moyens"
      data-section="moyens"
      className="relative flex w-full flex-col items-center bg-muted px-[20px] py-[60px] text-background tablet:px-[24px] tablet:py-[120px] desktop:px-[30px]"
    >
      <div className="grid w-full max-w-[1440px] gap-[40px] desktop:grid-cols-12 desktop:gap-x-[20px]">
        <div className="flex flex-col gap-[20px] desktop:sticky desktop:top-[100px] desktop:col-span-5 desktop:self-start">
          <p className="micro m-0 text-background/60">{moyens.eyebrow}</p>
          <TitreMasque lignes={moyens.titleLines} className="titre-marque text-[44px] tablet:text-[60px] desktop:text-[72px]" />
          <p className="m-0 max-w-[40ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70 tablet:text-[18px]">
            {moyens.intro}
          </p>
        </div>

        <ul ref={liste} className="moyens-lignes m-0 list-none p-0 desktop:col-span-6 desktop:col-start-7">
          {moyens.lignes.map((ligne, index) => (
            <li
              key={ligne.titre}
              data-active={active === index}
              className={`moyen-ligne ${ligne.option ? "" : "desktop:min-h-[38vh]"}`}
            >
              <Trait className="bg-black/[0.14]" delai={Math.min(index * 0.08, DELAI_MAX)} />
              <Link href={ligne.lien.href} className="group flex flex-col gap-[10px] py-[24px] no-underline tablet:py-[34px]">
                {ligne.option ? <span className="micro text-background/60">{ligne.option}</span> : null}
                <span className={`moyen-titre font-black uppercase leading-[1.02] tracking-[-0.045em] ${ligne.option ? "text-[24px] tablet:text-[26px]" : "text-[28px] tablet:text-[32px]"}`}>
                  {ligne.titre}
                </span>
                <span className="max-w-[52ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70">
                  {ligne.corps}
                </span>
                <span className="cta-lien mt-[6px] w-fit text-background">
                  {ligne.lien.label}
                  <FlecheSortante />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
