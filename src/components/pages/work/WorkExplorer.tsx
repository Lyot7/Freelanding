"use client";

import { useMemo, useState } from "react";
import { WorkCardPin } from "@/components/cards/WorkCardPin";
import { FilterPill } from "@/components/ui";
import type { WorkItem } from "@/lib/content";
import { uiLabels } from "@/content/ui";
import { ALL_WORKS, filterWorks } from "./work-filter";

/**
 * Nombre de projets à partir duquel les filtres par famille s'affichent. Sous
 * ce seuil, trois onglets pour trois projets ajoutaient un choix sans rien
 * trier (audit des parcours, 2026-09-24).
 */
const SEUIL_FILTRES = 6;

export function WorkExplorer({
  filters,
  works,
}: {
  filters: readonly string[];
  works: readonly WorkItem[];
}) {
  // Le filtre actif est repéré par son INDEX, jamais par son libellé : le
  // premier de la liste est le filtre « tout afficher », et son libellé
  // (« All », « Tous »…) est éditorial. Comparer la chaîne affichée figeait la
  // traduction du premier onglet — le traduire vidait la page au chargement.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFilter = activeIndex === 0 ? ALL_WORKS : filters[activeIndex] ?? ALL_WORKS;
  const visibleWorks = useMemo(() => filterWorks(works, activeFilter), [activeFilter, works]);

  return (
    <section
      aria-label={uiLabels.filters.workArchiveLabel}
      className="relative bg-background text-foreground"
    >
      {works.length >= SEUIL_FILTRES ? (
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-[6px] px-[20px] py-[20px] tablet:gap-[10px] tablet:px-[24px] tablet:py-[30px] desktop:px-[30px]">
          {filters.map((filter, index) => (
            <FilterPill
              key={filter}
              active={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              {filter}
            </FilterPill>
          ))}
        </div>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {visibleWorks.length}
        {uiLabels.filters.workCountSuffix}
      </div>

      {visibleWorks.length > 0 ? (
        <div>
          {visibleWorks.map((work) => {
            const originalIndex = works.findIndex(
              (candidate) => candidate.slug === work.slug,
            );
            return (
              // Même mécanique d'épinglage que la home : source unique dans
              // WorkCardPin. La version précédente en différait sur trois points,
              // chacun suffisant à tuer l'effet : `overflow-hidden` (qui capture
              // le sticky), track de 300vh absent (course nulle) et seuil `tablet`
              // au lieu de `desktop`.
              <WorkCardPin
                key={work.slug}
                work={work}
                index={originalIndex + 1}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[calc(60vh/var(--zoom-ecran,1))] flex-col items-center justify-center gap-[20px] px-[20px] text-center">
          <p className="text-[26px] font-semibold uppercase leading-[0.9] tracking-[-0.045em]">
            {uiLabels.filters.workEmptyLabel}
          </p>
          <button
            type="button"
            onClick={() => setActiveIndex(0)}
            // Focus : voir `src/app/focus.css` (source de vérité unique).
            className="min-h-[44px] border border-white/20 px-[18px] micro hover:border-white"
          >
            {uiLabels.filters.workResetLabel}
          </button>
        </div>
      )}
    </section>
  );
}
