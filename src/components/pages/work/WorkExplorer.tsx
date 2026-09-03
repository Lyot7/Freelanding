"use client";

import { useMemo, useState } from "react";
import { WorkCardPin } from "@/components/cards/WorkCardPin";
import { FilterPill } from "@/components/ui";
import type { WorkItem } from "@/lib/content";
import { siteConfig } from "@/content/site";
import { uiLabels } from "@/content/ui";
import { ALL_WORKS, filterWorks } from "./work-filter";

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-[14px] w-[14px] shrink-0"
      fill="none"
    >
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.2 10.2 3 3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

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
  const [query, setQuery] = useState("");
  const visibleWorks = useMemo(
    () => filterWorks(works, activeFilter, query),
    [activeFilter, query, works],
  );

  return (
    <section
      aria-label={uiLabels.filters.workArchiveLabel}
      className="relative bg-background text-foreground"
    >
      {/* La rangée appartient visuellement au hero : sur le live son BAS est
          calé à 20px (mobile) / 30px (dès 810) au-dessus du bas du hero, quelle
          que soit sa hauteur — les puces passent sur deux lignes en dessous de
          1200. Un `top` fixe ne pouvait donc pas suivre : il plaçait la rangée
          31px trop haut en desktop. `bottom-full` + marge négative l'ancre par
          le bas, indépendamment de la hauteur. */}
      <div className="absolute inset-x-0 bottom-full z-[3] mb-[20px] px-[20px] tablet:mb-[30px] tablet:px-[24px] desktop:px-[30px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[24px] tablet:grid tablet:grid-cols-12 tablet:items-end tablet:gap-x-[4px]">
          {/* Rangée : gap 6px sous 810, 10px au-delà (unique rupture du bloc). */}
          <div className="order-2 flex flex-wrap gap-[6px] tablet:order-1 tablet:col-span-6 tablet:gap-[10px]">
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

          {/* LARGEUR FIGÉE À 250 px dès 810, et non une travée fluide de la
              grille : c'est ce que pose la source, aux quatre largeurs
              (250 px à 810, 1200, 1440 et 1920). Notre `col-span-4` la faisait
              enfler avec la fenêtre — 377,3 px à 1200 et 457,3 à 1440 — et le
              filet de saisie s'étirait d'autant.

              AUCUN FILET, d'ailleurs : relevé `border-bottom: 0px none` sur la
              source, sur `.framer-form-text-input`, sur l'`<input>` ET sur son
              `::after`. Le trait que nous tracions sur toute la boîte n'existe
              pas. Le repère de focus reste assuré par `src/app/focus.css`, qui
              vaut pour tout le site. */}
          {/* Sous 810, la recherche et le millésime forment UNE rangée, comme
              sur la source. Dès 810, `display: contents` efface cette enveloppe
              et rend ses deux enfants directement à la grille, qui les place
              elle-même par `col-start`. Une seule structure, deux mises en page,
              sans dupliquer le balisage. */}
          <div className="order-1 flex items-end gap-[9px] tablet:contents">
          <label className="flex min-h-[32px] flex-1 items-center gap-[9px] text-white/60 tablet:order-2 tablet:col-start-7 tablet:w-[250px] tablet:flex-none">
            <SearchIcon />
            <span className="sr-only">{uiLabels.filters.workSearchLabel}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={uiLabels.filters.workSearchPlaceholder}
              // `outline-none` retiré : voir `src/app/focus.css`.
              /* Typographie RELEVÉE sur la source : 16 px à 390 (la valeur qui
                 empêche iOS de zoomer sur un champ au focus), 13 px dès 810,
                 graisse 400, casse d'origine, interligne 1,2. Nous rendions
                 12 px / 500 / capitales / interligne 18 partout. */
              className="h-[32px] min-w-0 flex-1 bg-transparent text-[16px] font-normal leading-[1.2] tracking-[-0.01em] text-white placeholder:text-white/40 tablet:text-[13px]"
            />
          </label>

          {/* Millésime : lu dans la donnée (« 2026© »). Il était figé sur le
              « 2019-26© » du template, qui inventait une ancienneté.

              À 390, il était posé en ABSOLU au-dessus du champ de recherche :
              test de recouvrement positif, `elementFromPoint` renvoyait ce
              `<p>` et non l'`<input>`, donc les deux derniers caractères du
              champ étaient inatteignables au doigt. La source les met côte à
              côte sur une seule ligne (recherche 20 → 304,9, millésime
              312,9 → 370). C'est une rangée, pas une superposition.

              Typographie relevée : 12 px / interligne 14,4 / chasse -0,12,
              contre 11 / 16,5 / -0,11 chez nous. */}
          <p className="shrink-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/60 tablet:order-3 tablet:col-span-2 tablet:text-right">
            {siteConfig.copyright}
          </p>
          </div>
        </div>
      </div>

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
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-[20px] px-[20px] text-center">
          <p className="text-[28px] font-semibold uppercase leading-[0.9] tracking-[-0.04em]">
            {uiLabels.filters.workEmptyLabel}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveIndex(0);
              setQuery("");
            }}
            // Focus : voir `src/app/focus.css` (source de vérité unique).
            className="min-h-[44px] border border-white/20 px-[18px] text-[12px] font-medium uppercase hover:border-white"
          >
            {uiLabels.filters.workResetLabel}
          </button>
        </div>
      )}
    </section>
  );
}
