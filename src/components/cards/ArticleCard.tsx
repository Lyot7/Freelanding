import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { Grain } from "@/components/effects/Grain";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { formatShortDate } from "@/components/format-date";
import type { BlogPost } from "@/lib/content/types";

/**
 * ArticleCard — carte d'article réutilisable (home "Articles" + page /blog).
 *
 * Reproduction fidèle des cartes de la section "Articles" de la home Framer
 * (markup: content/framer-html/articles.ts, CSS: framer-global.css scope
 * `.framer-Lihuv` / `.framer-pK5Ni`). Deux variantes :
 *
 *   - "cover" (défaut) — carte image de couverture + titre + date. Classe source
 *     `.framer-ee18h2` (variants Desktop/Tablet/Phone = un seul composant
 *     responsive). C'est l'unité qui se répète sur /blog.
 *   - "featured" — carte "Selected" à fond blanc (`.framer-1m3gej5`) : vignette
 *     ronde 50px en niveaux de gris + flèche, titre + date poussés en bas.
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, logique INVERSÉE) :
 *   base   = mobile   (max-width 809.98px)   [variant Phone  / hidden-3h40ll]
 *   tablet = 810-1199 (min-width 810)         [variant Tablet / ujbit7]
 *   desktop= ≥1200    (min-width 1200)        [variant Desktop/ 72rtr7]
 *
 * Fidélité : la section source rend uniquement image + titre + date (aucune
 * catégorie ni reading time visibles). `post.category` / `post.readingTime`
 * restent disponibles pour d'autres surfaces mais ne sont pas affichés ici.
 * Le parallaxe d'image et le survol (swap "See more") sont l'état FINAL (statique) ;
 * les animations GSAP sont câblées dans un lot séparé (data-part="cover-image").
 */

// Stack littérale Framer, résolue à l'identique (geist enregistre une famille hashée).
const FONT = "[font-family:var(--font-sans)]";

/**
 * Ligne de date (preset wwtw0z : 12px uppercase, noir 60%).
 *
 * Le tableau de mois anglais recopié ici a été retiré au profit de
 * `@/components/format-date`, seule source des noms de mois (alimentée par
 * `uiLabels.dates`). Le format reste celui du blog : mois abrégé, rendu en
 * capitales par la classe `uppercase` ci-dessous.
 */
function ArticleDate({ iso }: { iso: string }) {
  return (
    <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-[rgba(11,11,11,0.6)]">
      <time dateTime={`${iso}T00:00:00.000Z`}>{formatShortDate(iso)}</time>
    </p>
  );
}

/** Titre (preset htsnb8 : 16px, poids 500, noir #0b0b0b). */
function ArticleTitle({ children }: { children: string }) {
  return (
    <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background">
      {children}
    </p>
  );
}

/** Variante "cover" — image de couverture + titre + date (`.framer-ee18h2`). */
function CoverCard({ post }: { post: BlogPost }) {
  return (
    // framer-ee18h2 : lien carte (mobile: items-start gap16 ; ≥810: gap16 items-center ; ≥1200: gap20)
    <Link
      href={`/blog/${post.slug}`}
      data-part="article-card"
      className={
        FONT +
        " group relative flex w-full flex-col items-start gap-[16px] no-underline " +
        "tablet:items-center desktop:gap-[20px]"
      }
    >
      {/* framer-1j3k91u : conteneur image (clip). La hauteur = aspect naturel du
          fichier (via ParallaxImage `aspect-ratio`), fidèle au spacer Framer.
          framer-ikpxhu-container « Parallax image » : dérive Y subtile au scroll. */}
      <div className="relative z-[2] w-full">
        <ParallaxImage
          src={post.cover.src}
          alt={post.cover.alt}
          width={post.cover.width}
          height={post.cover.height}
          className="w-full"
          // Cartes empilées sur mobile, en rangée de 4 dès `tablet` (mesuré :
          // 338px de large pour un viewport de 1440, soit ~23.5vw).
          sizes="(min-width: 810px) 25vw, 100vw"
        />
        {/* framer-30jb7g : grain de la couverture. RELEVÉ sur `/` et `/about`
            (section « Articles », calques 342 × 440 / 517 / 302 à 1440) : z-3,
            opacité 0,08, et DÉRIVANT — il était posé en `inset-0` figé, donc
            invisible en tant que grain et absent de l'inventaire animé. */}
        <Grain opacity={0.08} className="z-[3]" />
      </div>

      {/* framer-1n68hzi : bloc texte (mobile: pr16 ; ≥810: px16 ; ≥1200: px20) */}
      <div className="flex w-full flex-col items-start gap-[6px] pr-[16px] tablet:px-[16px] desktop:px-[20px]">
        {/* framer-1fo0jyi : titre (max 300px) */}
        <div className="relative h-auto w-full max-w-[300px] whitespace-pre-wrap break-words">
          <ArticleTitle>{post.title}</ArticleTitle>
        </div>
        {/* framer-xpx1j4 : date */}
        <div className="relative h-auto w-full whitespace-pre-wrap break-words">
          <ArticleDate iso={post.date} />
        </div>
      </div>
    </Link>
  );
}

/** Variante "featured" — carte "Selected" fond blanc (`.framer-1m3gej5`). */
function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    // framer-1m3gej5 : boîte blanche (mobile h340 p20 ; ≥810 h320 p20 ; ≥1200 p22)
    <div
      data-part="article-card-featured"
      className={
        FONT +
        " relative flex h-[340px] w-full flex-col items-center justify-center self-start " +
        "overflow-hidden bg-foreground p-[20px] tablet:h-[320px] desktop:p-[22px]"
      }
    >
      {/* framer-x24nol */}
      <div className="relative flex w-full flex-1 flex-col items-start gap-[20px]">
        {/* framer-1b26u1w : lien (col, justify-between → vignette en haut, texte en bas) */}
        <Link
          href={`/blog/${post.slug}`}
          className="relative flex h-full w-full flex-1 flex-col items-start justify-between no-underline"
        >
          {/* framer-fy5a6k : rangée vignette + flèche */}
          <div className="flex w-full flex-row items-start justify-between overflow-hidden">
            {/* framer-bgrttd : vignette 50px ronde, niveaux de gris */}
            <div className="relative aspect-square h-[50px] w-[50px] shrink-0 overflow-hidden rounded-[50px] grayscale">
              {/* La vignette fait 50 × 50 : `width`/`height` sont les dimensions
                  D'AFFICHAGE, jamais celles du fichier. Sans elles l'optimiseur
                  aurait servi la couverture pleine taille — 419 KB relevés dans
                  un cadre de 50 px. `object-cover` recadre comme avant : Next ne
                  redimensionne que la largeur, il ne recadre pas. */}
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                width={50}
                height={50}
                className="block h-full w-full object-cover object-center"
              />
            </div>
            {/* framer-1bd664u : flèche 20px (fill #0b0b0b) */}
            <Icon name="arrow-up-right" size={20} className="shrink-0 text-background" />
          </div>

          {/* framer-1lkljdd : titre + date (mobile gap12 ; ≥810 gap10 ; ≥1200 gap12) */}
          <div className="flex w-full flex-col items-start gap-[12px] overflow-hidden tablet:gap-[10px] desktop:gap-[12px]">
            {/* framer-1u8l6cy : titre (max 260px) */}
            <div className="relative h-auto w-full max-w-[260px] whitespace-pre-wrap break-words">
              <ArticleTitle>{post.title}</ArticleTitle>
            </div>
            {/* framer-1c16tab : date */}
            <div className="relative h-auto w-full whitespace-pre-wrap break-words">
              <ArticleDate iso={post.date} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function ArticleCard({
  post,
  variant = "cover",
}: {
  post: BlogPost;
  variant?: "cover" | "featured";
}) {
  return variant === "featured" ? (
    <FeaturedCard post={post} />
  ) : (
    <CoverCard post={post} />
  );
}
