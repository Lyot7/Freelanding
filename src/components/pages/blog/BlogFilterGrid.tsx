"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useParallaxLayerY } from "@/components/motion/ParallaxImage";
import { useReveal } from "@/components/motion/Reveal";
import {
  MEDIA_REVEAL_FROM,
  MEDIA_REVEAL_TRANSITION,
} from "@/components/motion/mediaReveal";
import { Grain } from "@/components/effects/Grain";
import { FilterPill } from "@/components/ui";
import type { BlogPost } from "@/lib/content/types";
import { uiLabels } from "@/content/ui";
import { formatShortDate } from "@/components/format-date";
import {
  ALL_BLOG_CATEGORIES,
  filterBlogPosts,
  type BlogCategoryFilter,
} from "./blog-filter";

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

function BlogIndexCard({ post }: { post: BlogPost }) {
  const coverFrame = useRef<HTMLDivElement>(null);
  // 0.06 : la source pose ces calques en `top:-6%; height:calc(100% + 12%)`.
  const coverY = useParallaxLayerY(coverFrame, 0.06);
  const { reveal } = useReveal();
  const appear = reveal(MEDIA_REVEAL_FROM, MEDIA_REVEAL_TRANSITION);
  return (
    <Link
      href={`/blog/${post.slug}`}
      /* Carte CARRÉE sur la source (367×367 / 372×372 / 680,5×680,5) : c'est un
         `aspect-ratio: 1`, pas une hauteur minimale. La séparation entre cartes
         vient du `gap: 4px` de la grille sur fond clair, pas d'une bordure. */
      className="group relative flex aspect-square overflow-hidden bg-background p-[20px] text-foreground no-underline tablet:p-[30px]"
    >
      {/* Couverture sur-cadrée de 6 % et DÉRIVANTE au scroll, comme la source
          (`top:-6%; height:calc(100% + 12%)` sur les six cartes du listing).
          Elle était posée en `fill` sans sur-cadrage ni mouvement. */}
      <div ref={coverFrame} className="absolute inset-0 overflow-hidden">
      {/* ENTRÉE de la couverture, MANQUANTE jusqu'ici : la source anime bien le
          conteneur d'image de chacune de ses six cartes (fondu + dézoom), voir
          `@/components/motion/mediaReveal`. Le manque est resté invisible parce
          que `scripts/motion-sweep.mjs` apparie par TEXTE et qu'un cadre d'image
          n'en a pas.

          Ce calque est DANS `coverFrame`, jamais à sa place :
            - `coverFrame` reste non transformé, donc `useParallaxLayerY` mesure
              toujours la même boîte (il lit `getBoundingClientRect`, qui rend la
              boîte TRANSFORMÉE : mesuré sur un cadre agrandi de 10 %, la course
              de parallaxe se calait sur 757 px au lieu de 688) ;
            - `overflow-hidden` de `coverFrame` rogne le débord du `scale` avant
              le calcul d'`IntersectionObserver`, ce qui aligne le déclenchement
              sur la position de MISE EN PAGE — exactement ce que fait la source
              avec son conteneur `overflow: clip`. */}
      <motion.div
        {...appear}
        className="absolute inset-0"
      >
      <motion.div
        className="absolute inset-x-0"
        style={{ top: "-6%", height: "112%", ...(coverY ? { y: coverY } : null) }}
      >
      <Image
        src={post.cover.src}
        alt={post.cover.alt}
        fill
        sizes="(min-width: 810px) 50vw, 100vw"
        // La couverture est affichée sur TOUTES les cartes. Une version
        // antérieure la masquait à partir de l'index 2 (`index >= 2 → "hidden"`),
        // ce qui laissait 4 cartes sur 6 en rectangles noirs vides : en
        // `display: none`, la boîte fait 0×0, `sizes` ne se résout pas, l'image
        // n'est jamais chargée. Le live affiche bien une photo sur chacune.
        /* Agrandissement au survol RELEVÉ sur la source, carte 688x688 à 1440 :
           le conteneur de couverture `.framer-1eoqcjj-container` passe de
           `transform: none` à `matrix(1.1, 0, 0, 1.1, 0, 0)`, soit une échelle
           de 1,1 — et non 1,025 comme ici auparavant, quatre fois trop faible.
           Chronométrage image par image après l'entrée du pointeur : départ vers
           47 ms, 1,00124 à 79 ms, 1,05625 à 259 ms, 1,08522 à 336 ms, 1,1 atteint
           à 447 ms. Soit 400 ms de course. Les trois points intermédiaires
           tombent à moins d'un centième de `cubic-bezier(0.44, 0, 0.56, 1)`
           (0,235 attendu / 0,245 mesuré à 34 % du temps ; 0,552 / 0,562 à 53 % ;
           0,849 / 0,852 à 72 %), donc la courbe symétrique de Framer, pas la
           courbe de 700 ms très traînante utilisée avant. */
        className="block object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] group-hover:scale-[1.1] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      </motion.div>
      </motion.div>
      </div>
      <span className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/75" />
      {/* RELEVÉ sur `/blog` : huit cartes, hôte 688 × 688 à 1440, z-3,
          opacité 0,09 (nous étions à 0,08 sans z déclaré). */}
      <Grain opacity={0.09} className="z-[3]" />

      <div className="relative z-[1] mt-auto flex w-full flex-col gap-[18px] tablet:gap-[30px]">
        <h2 className="max-w-[420px] text-[22px] font-medium leading-[1.1] tracking-[-0.01em] tablet:text-[24px] desktop:text-[26px]">
          {post.title}
        </h2>
        {/* COLONNE sous 810, rangée au-dessus — la forme que `RelatedArticle`
            (`BlogArticlePage.tsx`) implémente déjà et que cette carte-ci n'avait
            pas. La source empile l'auteur puis la ligne catégorie/date, écart 40,
            tous deux calés à gauche ; nous les mettions sur une même ligne, la
            méta poussée à droite (x 202 contre 24 à 390), d'où un bloc de texte
            de 97,8 px au lieu de 152,2 et un titre 54 px trop haut.

            À partir de 810, la gouttière repasse à 0 : la source donne à la méta
            sa largeur intrinsèque (179 px) et laisse TOUT le reste à l'auteur
            (`flex: 1 0 0`). Nos 18 px de gouttière inversaient le partage et
            faisaient passer la ligne catégorie/date sur deux lignes à 810. */}
        <div className="flex flex-col items-start gap-[40px] tablet:flex-row tablet:items-end tablet:justify-between tablet:gap-0">
          <div className="flex w-full items-center gap-[8px] tablet:w-px tablet:flex-[1_0_0]">
            {post.author.avatar ? (
              <Image
                src={post.author.avatar.src}
                alt=""
                width={30}
                height={30}
                className="h-[30px] w-[30px] shrink-0 rounded-full object-cover"
              />
            ) : null}
            <div className="flex flex-col items-start">
              <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em]">
                {post.author.name}
              </p>
              {/* Rôle de l'auteur : MESURÉ sur le live en 11 px et SANS capitales
                  (« Lead Developer », `text-transform: none`, largeur 79 px). La
                  version précédente forçait 10 px en capitales (86 px). */}
              <p className="text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-white/60">
                {post.author.role}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-[10px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/60">
            <span>{post.category}</span>
            <span>/</span>
            <time dateTime={post.date}>{formatShortDate(post.date)}</time>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BlogFilterGrid({
  categories,
  posts,
  vintage,
}: {
  categories: readonly string[];
  posts: readonly BlogPost[];
  vintage: string;
}) {
  // Le premier onglet de `blogContent.categories` est le « tout afficher » :
  // il porte la SENTINELLE, pas son libellé. Le repli `?? "All"` qui existait
  // ici figeait l'état initial sur un libellé anglais qui n'existe plus dans la
  // donnée traduite (voir `blog-filter.ts`).
  const [category, setCategory] = useState<BlogCategoryFilter>(
    ALL_BLOG_CATEGORIES,
  );
  const [query, setQuery] = useState("");
  const filteredPosts = useMemo(
    () => filterBlogPosts(posts, category, query),
    [category, posts, query],
  );

  return (
    <section className="relative bg-muted">
      {/* Mesuré sur la source : le bas de la rangée reste à 20px (mobile) / 30px
          (dès 810) au-dessus du haut de la zone claire, que les puces tiennent
          sur une ou deux lignes. Ce n'est donc ni un `top` fixe (la 2e ligne
          descendait de 40px) ni un bas collé (elle collait à la section) : c'est
          un ancrage par le bas AVEC marge. */}
      <div className="absolute inset-x-0 bottom-full z-[3] mb-[20px] px-[20px] text-foreground tablet:mb-[30px] tablet:px-[24px] desktop:px-[30px]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-[30px] tablet:grid tablet:grid-cols-2 tablet:items-end tablet:gap-0">
          <div
            /* `min-w-0` : sans lui, la colonne de grille prend `min-width:auto`
               et s'élargit au-delà de sa moitié plutôt que de laisser les puces
               passer à la ligne. Le wrap de la source à 810 ne se produisait
               alors pas chez nous. */
            className="order-2 flex min-w-0 flex-wrap gap-[6px] tablet:order-1 tablet:gap-[10px]"
            aria-label={uiLabels.filters.blogCategoriesLabel}
          >
            {categories.map((item, index) => {
              // L'onglet d'index 0 réinitialise le filtre : sa VALEUR est la
              // sentinelle, son libellé n'est que du texte affiché.
              const value = index === 0 ? ALL_BLOG_CATEGORIES : item;
              return (
                <FilterPill
                  key={item}
                  active={category === value}
                  onClick={() => setCategory(value)}
                >
                  {item}
                </FilterPill>
              );
            })}
          </div>
          <div className="order-1 flex items-end gap-[8px] tablet:order-2 tablet:h-[30px] tablet:gap-[10px]">
            <label className="flex min-w-0 flex-1 items-center gap-[10px] text-white/60 focus-within:text-foreground tablet:h-[16px] tablet:w-[250px] tablet:flex-none">
              <SearchIcon />
              <span className="sr-only">{uiLabels.filters.blogSearchLabel}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                // Point de suspension U+2026 côté blog, trois points côté
                // projets : l'écart vient de la source et il est conservé dans
                // `uiLabels.filters`.
                placeholder={uiLabels.filters.blogSearchPlaceholder}
                // `outline-none` retiré : voir `src/app/focus.css`.
                /* `uppercase` retiré : la source est en `text-transform: none`, son
                   invite est déjà écrite en capitales dans la donnée. Sans effet
                   sur l'invite, mais ce que le visiteur TAPE était forcé en
                   capitales chez nous. */
                className="w-full bg-transparent text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground placeholder:text-white/50 tablet:text-[13px] tablet:font-normal"
              />
            </label>
            <span className="w-[57.09375px] flex-none text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/60 tablet:mb-[1.6px] tablet:w-auto tablet:flex-1 tablet:text-right">
              {vintage}
            </span>
          </div>
        </div>
      </div>
      <div className="px-[4px] pt-[4px] tablet:px-[24px] desktop:px-[30px]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-[4px] tablet:grid-cols-2">
          {filteredPosts.map((post) => (
            <BlogIndexCard key={post.slug} post={post} />
          ))}
        </div>
        {filteredPosts.length === 0 ? (
          <p className="py-[120px] text-center text-[16px] font-medium text-background/60">
            {uiLabels.filters.blogEmptyLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}
