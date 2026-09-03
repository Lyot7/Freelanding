import Link from "next/link";
import { ArticleCard } from "@/components/cards/ArticleCard";
// Ce fichier est un composant SERVEUR : il peut rendre `Reveal` (composant
// client) mais pas lui passer une transition construite par `framerTween`, qui
// est une fonction client. D'où `duration` et `delay`, qui sont des valeurs.
import { LineReveal } from "@/components/motion/LineReveal";
import { SwapCopies } from "@/components/ui/SwapCopies";
import { homeContent } from "@/content/home";
import type { BlogPost } from "@/lib/content/types";

/**
 * ArticlesSection — section "Articles" de la home Framer ("News and updates.").
 *
 * Reproduction fidèle (markup: content/framer-html/articles.ts, CSS:
 * framer-home.css `.framer-rngvmt` + framer-global.css). Fond clair (--muted
 * #e9e9e9). Composition :
 *   - Header : bouton du bloc (→ /blog) à gauche, titre géant en deux lignes à
 *     droite (empilés en mobile, titre au-dessus du bouton). Libellé, lignes et
 *     destination viennent de `homeContent.articles`.
 *   - Grille asymétrique 4 colonnes (≥810) : [couverture] [carte "Selected"
 *     blanche] [couverture ×2 sur 2 colonnes]. En mobile, tout s'empile.
 *   - Filet vertical central (noir 8%).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base = mobile (≤809.98) · tablet: ≥810 · desktop: ≥1200
 *
 * La section affiche les 4 premiers articles : posts[0] et posts[2..3] en cartes
 * "cover", posts[1] en carte "featured" (position "Selected" du layout source).
 */

// Stack littérale Framer (cf. StatsSection / ArticleCard).
const FONT = "[font-family:var(--font-sans)]";

/**
 * Bouton du bloc (`.framer-1sk0ilg`) : pilule sombre 30px, texte blanc 12px.
 * Libellé et destination viennent de `articles.cta` : le « See more » anglais
 * était figé ici, donc la traduction de la donnée restait invisible.
 */
function SeeMoreButton({ cta }: { cta?: { label: string; href: string } }) {
  return (
    // framer-e71z8o-container : conteneur hauteur réservée 30px
    <div className="relative h-[30px] w-auto">
      <Link
        href={cta?.href ?? "/blog"}
        className="group relative flex h-[30px] w-min items-center justify-center gap-[10px] overflow-hidden border border-transparent bg-background p-[10px] no-underline"
      >
        {/* framer-12ut4h8 / framer-1e6ynpd.
            Le libellé permute VERS LE HAUT. Relevé sur le live : la copie
            visible monte de 22 px (408 → 386) en s'effaçant de 1 à 0, la copie
            en attente est posée 22 px PLUS BAS (430) et remonte à sa place en
            apparaissant — 5 % de la course à 60 ms, 27 % à 90 ms, 68 % à 120 ms,
            91 % à 160 ms, terminé vers 220 ms. `SwapText` faisait l'inverse :
            descente de 140 % de la ligne (19,6 px mesurés chez nous : 408 → 428)
            sur une courbe `ease-out` qui part vite. Même composant Framer
            `.framer-1sk0ilg` que le CTA du header, donc même primitive. */}
        <div className="relative flex w-min items-center justify-center gap-[10px]">
          <span className="relative block h-[14.4px] overflow-hidden">
            <SwapCopies
              travel={22}
              textClassName="whitespace-pre text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground"
            >
              {cta?.label}
            </SwapCopies>
          </span>
        </div>
      </Link>
    </div>
  );
}

/**
 * Corps du titre géant dans la bande 810-1199, qui DÉPEND DE LA PAGE.
 *
 * Relevé sur `/live-proxy` aux 18 largeurs de contrôle, pour la même section :
 * 52px sous 810 et 92px à partir de 1200 sur les deux pages, mais 68px sur la
 * home contre 64px sur `/about` entre 810 et 1199. Les deux littéraux sont
 * écrits ici pour que Tailwind les génère.
 */
const HEADING_TABLET = {
  68: "tablet:text-[68px]",
  64: "tablet:text-[64px]",
} as const;

export type ArticlesHeadingTabletPx = keyof typeof HEADING_TABLET;

/**
 * Titre géant du bloc (`.framer-jfbt41` h2, 92/68 ou 64/52px), en deux lignes
 * masquées. Les lignes viennent de `articles.titleLines` : elles étaient
 * recopiées en anglais dans le JSX.
 */
function Heading({
  tabletPx,
  lines,
}: {
  tabletPx: ArticlesHeadingTabletPx;
  lines: readonly string[];
}) {
  // `block` est déjà posé par `LineReveal` sur chaque ligne.
  const lineClass =
  "accent-room descender-room w-full overflow-hidden text-left leading-[0.82]";
  return (
    // framer-jfbt41-container
    <div className="relative h-auto w-full flex-[1_0_0] tablet:w-px">
      {/* Chaque ligne monte derrière son masque, décalée de 100 ms, depuis un
          déclencheur UNIQUE sur le `h2`. L'observateur posé sur chaque ligne
          raisonnait sur sa boîte translatée de 40 px et clippée par le masque :
          mesuré par saut direct puis attente de 1,7 s à 1440x900, « News and »
          restait masqué à 807 et se révélait à 757, alors que la source le
          révèle dès 899 (masqué à 948) ; « updates. » partait 216 px trop tard,
          alors que la source déclenche les deux lignes au MÊME défilement
          (3948 → 3957). La marge basse nulle est désormais celle de TOUT le
          site et n'a plus à être demandée ici : cf. `REVEAL_BOTTOM_MARGIN`. */}
      <LineReveal
        as="h2"
        lines={[...lines]}
        className={`relative m-0 flex w-full flex-col justify-center p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-background desktop:text-[92px] ${HEADING_TABLET[tabletPx]}`}
        lineClassName={lineClass}
      />
    </div>
  );
}

export function ArticlesSection({
  posts,
  compactTop = false,
  headingTabletPx = 68,
  titleLines = homeContent.articles.titleLines ?? [],
  cta = homeContent.articles.cta,
}: {
  posts: BlogPost[];
  /** Deux lignes exactement : leur concaténation redonne le titre du bloc. */
  titleLines?: readonly string[];
  /** Bouton du bloc (« Voir plus » → /blog). */
  cta?: { label: string; href: string };
  /**
   * Corps du titre entre 810 et 1199. 68px sur la home, 64px sur `/about`
   * (mesuré des deux côtés à 810, 1024 et 1199 : la ligne fait 55,76px de haut
   * en 68px contre 52,48px en 64px, soit 6,5px sur les deux lignes du titre —
   * exactement le résidu de +7 que traînait `/about` dans cette bande).
   */
  headingTabletPx?: ArticlesHeadingTabletPx;
  /**
   * Retrait haut réduit en MOBILE (sous 810).
   *
   * La source ne donne PAS le même retrait à cette section selon la page :
   * MESURÉ `padding: 40px 20px 20px` sur la home à 390, 600 et 809, mais
   * `30px 20px 20px` sur `/about` aux mêmes largeurs. À partir de 810 les deux
   * pages retombent sur `120px … 90px`, d'où un décalage qui n'existait que
   * dans la bande mobile.
   */
  compactTop?: boolean;
}) {
  /*
   * QUATRE CARTES, DEUX FORMES, EN ALTERNANCE : image, blanche, image, blanche.
   *
   * La source Framer donnait la carte blanche à la seule colonne 2 et la carte
   * image aux trois autres. Sur une rangée de quatre, l'oeil lisait donc trois
   * couvertures sombres et un accident au milieu. La quatrième colonne passe en
   * blanc : la rangée alterne, et les deux formes se répondent au lieu que l'une
   * ait l'air d'un trou dans l'autre.
   *
   * Les deux formes ne portent pas la même image ni la même quantité de texte :
   * la carte blanche réduit la couverture à une vignette ronde de 50 px en
   * niveaux de gris. C'est aussi ce qui la rend utilisable pour un article dont
   * la couverture ne raconte rien.
   */
  const items = posts.slice(0, 4);
  const [cover0, featured1, cover2, featured3] = items;

  return (
    // framer-rngvmt : section (fond clair, padding responsive)
    <section
      data-section="articles"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-[10px] overflow-hidden bg-muted " +
        (compactTop ? "pt-[30px] " : "pt-[40px] ") +
        "pr-[20px] pb-[20px] pl-[20px] " +
        "tablet:pt-[120px] tablet:pr-[24px] tablet:pb-[90px] tablet:pl-[24px] " +
        "desktop:pr-[30px] desktop:pl-[30px]"
      }
    >
      {/* framer-464a9g : container (max 1440) */}
      <div className="relative flex w-full max-w-[1440px] flex-col items-start gap-[20px] tablet:gap-[50px]">
        {/* framer-19pghni : header (empilé mobile → rangée dès 810) */}
        <div className="relative flex w-full flex-col gap-[20px] tablet:flex-row tablet:items-start tablet:justify-center tablet:gap-0">
          {/* framer-1ee0eyw : bloc "See more" (order 1 mobile, sous le titre) */}
          <div className="relative order-1 flex w-full flex-col items-start gap-[8px] tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:flex-row tablet:gap-[10px]">
            <SeeMoreButton cta={cta} />
          </div>
          {/* framer-6tyelc : bloc titre (order 0 mobile, au-dessus) */}
          <div className="accent-clip-titre relative order-0 flex w-full flex-row items-start overflow-clip tablet:order-none tablet:w-px tablet:flex-[1_0_0]">
            <Heading tabletPx={headingTabletPx} lines={titleLines} />
          </div>
        </div>

        {/* framer-1gmjmnv : grille (flex col mobile → grid 4 col dès 810) */}
        <div className="relative z-[1] flex w-full flex-col items-start gap-[20px] tablet:grid tablet:grid-cols-[repeat(4,minmax(50px,1fr))] tablet:grid-rows-[repeat(1,minmax(0,1fr))] tablet:auto-rows-[minmax(0,1fr)] tablet:justify-center tablet:gap-x-[4px] tablet:gap-y-0">
          {/* framer-rve0l3 : colonne 1 — carte couverture */}
          {cover0 ? (
            <div className="relative flex w-full flex-col items-start self-start">
              <ArticleCard post={cover0} variant="cover" />
            </div>
          ) : null}

          {/* framer-1m3gej5 : colonne 2 — carte "Selected" (featured) */}
          {featured1 ? <ArticleCard post={featured1} variant="featured" /> : null}

          {/* framer-1hh7l9j : colonnes 3-4 — couverture puis carte blanche
              (grille 2 col imbriquée). La source y mettait deux couvertures. */}
          {(cover2 || featured3) && (
            <div className="relative flex w-full flex-col gap-[20px] tablet:col-span-2 tablet:grid tablet:grid-cols-[repeat(2,minmax(50px,1fr))] tablet:auto-rows-[minmax(0,1fr)] tablet:justify-center tablet:self-start tablet:gap-x-[4px] tablet:gap-y-0">
              {cover2 ? (
                <div className="relative h-auto w-full self-start">
                  <ArticleCard post={cover2} variant="cover" />
                </div>
              ) : null}
              {featured3 ? (
                <div className="relative h-auto w-full self-start">
                  <ArticleCard post={featured3} variant="featured" />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* framer-1ogjggt : filet vertical central (noir 8%) */}
      <div className="absolute left-[calc(50%-0.5px)] top-0 z-0 h-full w-px bg-background opacity-[0.08]" />
    </section>
  );
}
