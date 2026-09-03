import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
// Ce fichier est un composant SERVEUR : il peut rendre `Reveal` et
// `ParallaxImage` (composants clients) mais pas leur passer une transition
// construite par `framerTween`, qui est une fonction client. D'où `duration` et
// `delay`, qui sont de simples valeurs.
import { Reveal } from "@/components/motion/Reveal";
import { ParallaxBackdrop } from "@/components/motion/ParallaxBackdrop";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import type { BlogPost, SiteConfig } from "@/lib/content/types";
import { Grain } from "@/components/effects/Grain";
import { TableOfContents } from "@/components/blog/TableOfContents";
// Le bloc newsletter est un composant CLIENT (soumission, état d'envoi) ; cette
// page reste serveur. Voir l'en-tête de `NewsletterForm.tsx`.
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import type { EntreeSommaire } from "@/lib/blog/sommaire";
import { formatShortDate } from "@/components/format-date";
// La page appelante (`src/app/(site)/blog/[slug]/page.tsx`) ne charge que
// l'article, ses voisins et la configuration du site : le contenu de section du
// blog (newsletter, lien et titre des articles liés) est lu directement ici,
// comme `BlogIndexPage` le fait déjà pour `@/content/faq`.
import { blogContent } from "@/content/blog";
import { uiLabels } from "@/content/ui";

/**
 * Dégradé de lisibilité posé sur la photo (`.framer-15cbb0e`, style INLINE du
 * miroir SSR) : `linear-gradient(0deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,.6)
 * 41.355222409909906%, rgb(0,0,0) 100%)`. `0deg` part du BAS : la photo n'est
 * donc qu'à 40 % d'alpha derrière le texte, et pleine en haut de la carte.
 * Le composite `add` de la source n'a qu'une seule couche : c'est le défaut CSS,
 * il n'y a rien à déclarer de plus.
 */
const RELATED_MASK =
  "linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 41.355222409909906%, rgb(0, 0, 0) 100%)";

/**
 * Carte « articles liés » du pied de page d'article (`.framer-tze68n`).
 *
 * Elle rendait une boîte noire nue : la PHOTO manquait purement et simplement.
 * Le miroir SSR la pose dans un calque `.framer-15cbb0e` en `position:absolute;
 * inset:0; z-index:1`, masqué par le dégradé ci-dessus, et contenant le calque
 * de parallaxe standard du site — un div à `background-image` sur-cadré
 * `top:-6%; bottom:-6%; height:calc(100% + 12%)`, soit un débord de 6 %
 * (relevé dans le SSR ; mesuré sur le live : calque de 688 × 771 dans un cadre
 * de 688 × 688, et 771 / 688 = 1.12 ✓). Le grain vit À L'INTÉRIEUR de ce calque
 * masqué, à `z-index:3` et opacité 0.09 (et non 0.08 comme chez nous).
 *
 * Géométrie mesurée sur le live à 1440 / 1000 / 390 :
 *   carte 688 × 688 (`aspect-ratio: 1`), padding 30 px ≥ 810, 20 px en dessous ;
 *   bloc texte `z-index:2`, gap 30 px ≥ 810 / 18 px en dessous ;
 *   rangée auteur/méta en ligne, `justify-between`, `items-end` ≥ 810 ;
 *   en colonne `items-start gap-40` en dessous de 810 ;
 *   titre max-width 420 px, 26 px ≥ 1200 / 24 px 810-1199 / 22 px < 810,
 *   interligne 1.1, interlettrage -0.01em ;
 *   avatar 30 × 30 (et non 34), nom 14/1.3 blanc, rôle 11/1.2 blanc 60 %,
 *   catégorie et date 12/1.2 majuscules blanc 60 %, séparateur « / » à 20 %.
 */
function RelatedArticle({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      // `aspect-square` remplace le `min-h-[470px]/[700px]` inventé : la source
      // impose `aspect-ratio:1` sur le conteneur de carte (`.framer-1im2v7x-container`),
      // d'où 688 × 688 à 1440 une fois la gouttière de 4 px du grid déduite.
      // La bordure de 3 px qui simulait cette gouttière disparaît au profit du
      // vrai `gap-[4px]` posé sur la grille.
      className="group relative flex aspect-square w-full flex-col items-start justify-end gap-[10px] overflow-clip bg-background p-[20px] text-foreground no-underline tablet:p-[30px]"
    >
      {/* `.framer-15cbb0e` — cadre de la photo, sous le texte (z-1), masqué. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-clip"
        style={{ maskImage: RELATED_MASK, WebkitMaskImage: RELATED_MASK }}
      >
        {/* Débord 6 % lu dans le SSR (`top:-6%; bottom:-6%`).
            AGRANDISSEMENT AU SURVOL, absent jusqu'ici : ces cartes liées sont le
            même composant Framer que celles du listing (`.framer-Sr4oS`, cadre
            de couverture `.framer-1eoqcjj-container`). Sonde de survol sur
            `/live-proxy/blog/stop-hiding-your-prices` à 1440, carte 688x688 : le
            cadre passe de `transform: none` à `matrix(1.1, 0, 0, 1.1, 0, 0)`,
            quand le nôtre ne bougeait pas d'un pixel (0 % de pixels changés).
            Durée et courbe relevées sur la carte identique du listing : 400 ms,
            `cubic-bezier(0.44, 0, 0.56, 1)`. Le zoom est porté par le cadre du
            calque et non par le masque au-dessus, comme sur la source. */}
        <ParallaxBackdrop
          src={post.cover.src}
          overshoot={0.06}
          /* ENTRÉE de la couverture, MANQUANTE jusqu'ici. Inventaire des calques
             masqués sur `/live-proxy/blog/stop-hiding-your-prices` à 1440 x 900 :
             les DEUX cartes liées portent le même conteneur 688 × 688 à
             `opacity: 0` / `scale(1.1)` que les six cartes du listing, avec un
             seul calque et non deux. Loi et chiffres dans
             `@/components/motion/mediaReveal`. */
          reveal
          className="transition-transform duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] group-hover:scale-[1.1] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        >
          {/* `.framer-30jb7g-container` : grain z-3, opacité 0.09 sur le live. */}
          <Grain opacity={0.09} className="z-[3]" />
        </ParallaxBackdrop>
      </div>

      {/* `.framer-1ok5z9n` — bloc texte, au-dessus de la photo. */}
      <div className="relative z-[2] flex w-full flex-col items-start gap-[18px] tablet:gap-[30px]">
        <h2 className="m-0 max-w-[420px] p-0 text-[22px] font-medium leading-[1.1] tracking-[-0.01em] tablet:text-[24px] desktop:text-[26px]">
          {post.title}
        </h2>
        {/* `.framer-1hvs5m` — colonne gap 40 sous 810, ligne alignée bas au-dessus. */}
        <div className="flex w-full flex-col items-start gap-[40px] tablet:flex-row tablet:items-end tablet:justify-between tablet:gap-0">
          {/* `.framer-1jh566n` — auteur, gap 8. */}
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
              <p className="text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-white/60">
                {post.author.role}
              </p>
            </div>
          </div>
          {/* `.framer-1vp0sjr` — catégorie / date, gap 10, séparateur à 20 %. */}
          <div className="flex shrink-0 items-center gap-[10px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]">
            <span className="text-white/60">{post.category}</span>
            <span className="text-white opacity-20">/</span>
            <time
              dateTime={`${post.date}T00:00:00.000Z`}
              className="text-white/60"
            >
              {formatShortDate(post.date)}
            </time>
          </div>
        </div>
      </div>
    </Link>
  );
}


export function BlogArticlePage({
  post,
  related,
  site,
  sommaire,
  children,
}: {
  post: BlogPost;
  related: readonly BlogPost[];
  site: SiteConfig;
  /** Titres de section de l'article, extraits de son fichier MDX. */
  sommaire: readonly EntreeSommaire[];
  /** Corps MDX de l'article, compilé et fourni par la page. */
  children: ReactNode;
}) {
  return (
    <>
      <SvgSprite />
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        {/* MESURÉ sur le live : le héros n'a pas de hauteur fixe, il vaut
            `height: 90vh` avec un plancher `min-height: 600px`. Vérifié en
            faisant varier la hauteur de fenêtre à 1440 de large : 700 → 630,
            900 → 810, 1000 → 900, soit exactement 90 % à chaque fois. Nos
            `min-h-[760px]` / `min-h-[900px]` inventés valaient 50 px de trop à
            390 et 90 px de trop à toutes les largeurs supérieures, soit le
            premier poste d'écart de hauteur de la page.
            Rembourrage relevé sur la même sonde : 0 en haut / 60 en bas sous
            810, 60 en haut / 90 en bas au-dessus. */}
        <section className="relative flex h-[90vh] min-h-[600px] items-end overflow-hidden bg-background px-[20px] pb-[60px] pt-0 text-foreground tablet:px-[24px] tablet:pb-[90px] tablet:pt-[60px] desktop:px-[30px]">
          {/* framer-14e0onr « BG » : le fond du hero DÉRIVE au scroll sur la
              source, il était posé fixe. Relevé sur
              `/live-proxy/blog/stop-hiding-your-prices` à 1440, par sauts de
              scroll : translateY = 57,15 px à 381 · 114,30 à 762 · 171,45 à
              1143 · 228,60 à 1524, soit `0,150 x scrollY` à la troisième
              décimale et sans borne — la même loi que le fond du hero de la home,
              d'`/about` et du média d'une page projet. Le débord est absorbé par
              l'`overflow-hidden` de la section. */}
          <ScrollParallax
            factor={0.15}
            decorative
            className="pointer-events-none absolute inset-0 z-0 overflow-clip"
          >
            <Image
              src={post.cover.src}
              alt={post.cover.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </ScrollParallax>
          <span className="absolute inset-0 bg-black/20" />
          {/* RELEVÉ sur `/blog/stop-hiding-your-prices` : hôte 1440 × 810,
              z-1, opacité 0,09 (nous étions à 0,08 sans z). */}
          <Grain opacity={0.09} className="z-[1]" />
          {/* RANGÉES : la source en pose TROIS, séparées de 30 px exactement
              (h1 469,7→581,2 · chapô 611,2→640 · bloc auteur 670→720 à 1440),
              le bloc auteur venant se caler sur 720, soit 810 moins ses 90 px de
              retrait. Nous n'en avions que deux, à 16 px, avec le chapô et
              l'auteur cohabitant sur la seconde : le bas du chapô tombait à 720
              au lieu de 640.
              GOUTTIÈRE HORIZONTALE NULLE : la source fait un 50/50 sec. Nos
              40 px décalaient le h1 de 20 px à droite (x 740 pour 670 de large,
              contre 720 pour 690) et rentraient le chapô de 20 px à gauche de la
              médiane. `LegalPageView` fait déjà le 50/50 et le documente. */}
          <div className="relative mx-auto grid w-full max-w-[1440px] gap-[30px] tablet:grid-cols-2 tablet:items-end tablet:gap-x-0">
            <Reveal
              initialOpacity={0.001}
              initialY={70}
              duration={1.1}
              /* `accent-room` : ce masque de révélation COUPAIT les accents des
                 capitales du titre. Relevé au 2026-08-27 sur
                 `/blog/a-qui-appartient-votre-fichier-client`, le H1 affichait
                 « A QUI APPARTIENT VOTRE FICHIER CLIENT ? » — le À amputé de sa
                 barre, aux trois largeurs. Idem pour le É de « JE DESSINE
                 L'INTERFACE AVANT D'ÉCRIRE LE CODE ».

                 Les valeurs viennent de `accent-room-titre` (globals.css), la
                 dose commune aux grands titres du site. Elles étaient d'abord
                 posées ici au plus juste — 7/10/12 px pour 6/8,6/10,4 px de
                 débord — ce qui ne laissait que 1 à 2 px d'air au-dessus de
                 l'accent : entier, mais rasant le bord. La classe partagée en
                 met 12/16/22. */
              className="accent-clip-titre order-1 overflow-clip tablet:col-start-2 tablet:row-start-1"
            >
              {/* Échelle RELEVÉE sur la source aux 5 largeurs : 40 / 56 / 68 px,
                  interligne ×0,82, chasse -0,05em — la même chasse que les six
                  autres H1 du site. Nous rendions 48 / 64 / 72 en ×0,84 et
                  -0,055em. Le plafond `max-w-[780px]` est retiré : la colonne
                  n'excède jamais 690 px, il n'a jamais rien borné. */}
              <h1 className="text-[40px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[56px] desktop:text-[68px]">
                {post.title}
              </h1>
            </Reveal>
            {/* MESURÉ sur le live aux 5 largeurs : 12px, interligne 1,2,
                interlettrage -0,01em, blanc PLEIN (et non à 80 %), et une
                largeur de 250px constante quelle que soit la fenêtre. Nous
                étions à 11px sans interlettrage dans une boîte de 340. */}
            <p className="order-2 max-w-[250px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white tablet:col-start-1 tablet:row-start-2 tablet:justify-self-end tablet:self-end tablet:text-right">
              {post.excerpt}
            </p>
            {/* TROISIÈME rangée, et non la seconde partagée avec le chapô.
                Écart avatar → texte : 16 px sur la source, nous posions 10. */}
            <div className="order-3 flex items-center gap-[16px] tablet:col-start-2 tablet:row-start-3">
              {post.author.avatar ? (
                /* 44 px à 390 et 50 dès 810, relevés sur la source ; nous
                   servions 42 partout. `width`/`height` portent la plus grande
                   des deux tailles : c'est la boîte d'AFFICHAGE qui décide de la
                   variante servie, et il ne faut pas sous-résoudre à 810. */
                <Image
                  src={post.author.avatar.src}
                  alt=""
                  width={50}
                  height={50}
                  className="h-[44px] w-[44px] rounded-full object-cover tablet:h-[50px] tablet:w-[50px]"
                />
              ) : null}
              {/* MESURÉ sur le live : ce bloc est en `text-transform: none`
                  (« Liam Torres », pas « LIAM TORRES ») et compte TROIS lignes,
                  la marque fermant le bloc. La ligne de marque était absente. */}
              {/* Les trois lignes ont chacune leur taille sur la source — 14 /
                  11 / 13, exactement l'échelle du bloc auteur de
                  `WorkTestimonial` — et non un 10px uniforme. L'interlettrage
                  est posé sur CHAQUE ligne : en `em`, il se résout à la taille
                  de police de l'élément qui le DÉCLARE, donc sur le conteneur
                  les trois lignes hériteraient toutes de la même valeur en px. */}
              <div className="font-medium">
                <p className="text-[14px] leading-[1.3] tracking-[-0.01em]">
                  {post.author.name}
                </p>
                {/* Opacités EFFECTIVES relevées sur la source : le rôle est à
                    70 % et la marque à 100 %. Les deux étaient à 60 % ici. */}
                <p className="text-[11px] leading-[1.2] tracking-[-0.01em] text-white/70">
                  {post.author.role}
                </p>
                <p className="text-[13px] leading-[1.2] tracking-[-0.01em] text-white">
                  {`${site.brand.name}${site.brand.mark}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Rembourrages MESURÉS sur le live : 20 en haut / 10 en bas à 390,
            30 en haut / 0 en bas au-dessus de 810. Nous étions à 42/70 et
            32/100, soit jusqu'à 100 px de page en trop en bas d'article.
            L'encoche de raccord (`before:`) fait la moitié de la FENÊTRE des
            deux côtés (195 à 390, 405 à 810, 720 à 1440) et non 180 px fixes,
            et déborde de 20 px à 390 contre 30 px au-dessus.
            `before:z-[2]` : sans lui, le calque de grain du hero (posé à
            `z-[1]` dans une section qui ne crée aucun contexte d'empilement) se
            peint PAR-DESSUS l'encoche, qui sort alors grenue là où le reste de
            la section est plat — l'effet de voile flou au bas du hero. */}
        <article className="relative bg-muted px-[20px] pb-[10px] pt-[20px] text-background before:absolute before:right-0 before:top-[-20px] before:z-[2] before:h-[20px] before:w-1/2 before:bg-muted tablet:px-[24px] tablet:pb-0 tablet:pt-[30px] tablet:before:top-[-30px] tablet:before:h-[32px] desktop:px-[30px]">
          <span className="absolute inset-y-0 left-1/2 hidden w-px bg-background/10 tablet:block" />
          <div className="relative mx-auto max-w-[1440px]">
            {/* 12px / interligne 1 / -0,01em sur la source, et non 10px.
                La boîte est AJUSTÉE AU TEXTE sur le live (69,9 px à 810,
                74,2 px à 1440) et non étalée sur la demi-colonne : elle est
                poussée à droite sous 810 et calée à gauche au-dessus. */}
            <p className="ml-auto w-fit text-[12px] font-medium uppercase leading-[1] tracking-[-0.01em] text-background/60 tablet:ml-0">
              {post.readingTime ?? blogContent.readingTimeFallback}
            </p>
            {/* Rembourrage bas du bloc « temps de lecture » relevé sur le live :
                12 px à 390, 30 px au-dessus de 810 (nous mettions 24 partout).
                La demi-colonne n'a AUCUN rembourrage sur la source : seul le
                corps de l'article en porte un (voir plus bas), l'image et la
                grille d'intro occupent bien les 381 / 690 px pleins. */}
            {/* DEUX COLONNES À PARTIR DE 810, en grille et non plus en simple
                `ml-auto w-1/2`. La moitié gauche restait vide sur toute la
                hauteur de l'article, soit 720 px sur une fenêtre de 1440 : elle
                accueille désormais le sommaire.
                Le découpage en RANGÉES est ce qui rend la chose possible. Le
                chapô occupe la rangée 1 de la colonne droite, d'où il déborde
                vers la gauche comme sur la source ; le sommaire n'entre qu'à la
                rangée 2, donc SOUS lui, sans que rien n'ait à deviner sa
                hauteur. */}
            <div className="mt-[12px] tablet:mt-[30px] tablet:grid tablet:grid-cols-2">
              <div className="tablet:col-start-2 tablet:row-start-1">
                {/* Paragraphe d'accroche, entièrement REMESURÉ sur le live.
                  Taille : 22px à 390, 26px de 810 à 1199, 32px au-delà — nous
                  étions à 24 / 28 / 32, donc l'hypothèse d'un décalage constant
                  de 2px était fausse au-dessus de 1200. Interligne 1,1 (24,2 /
                  28,6 / 35,2 relevés) et non 1,08 ; interlettrage -0,02em à 390
                  (-0,44px) puis -0,01em au-dessus (-0,26px à 26, -0,32px à 32),
                  et non -0,04em partout.
                  Largeur : le bloc vaut 75 % du conteneur, aligné à DROITE sur
                  son bord (x/largeur relevés : 214,5/571,5 à 810, 311,8/863,3 à
                  1199, 375/900 à 1440, 600/900 à 1920), avec un plafond de
                  900px. Exprimé depuis la demi-colonne qui l'héberge, cela fait
                  exactement -50 % de marge gauche et 150 % de largeur. Le
                  `-ml-[350px]` / `max-w-[940px]` précédent débordait de 139 px à
                  810 et faisait tenir le texte sur une ligne de moins. */}
                {/* CHAPÔ. Il vient de `post.excerpt`, l'accroche déjà écrite
                  pour l'index et pour le partage : une seule phrase à tenir à
                  jour au lieu de deux.
                  Il était pris sur le PREMIER BLOC du corps, avec les deux
                  suivants en colonnes et le quatrième en liaison — un découpage
                  par index hérité du template, qui imposait à tout article
                  d'avoir au moins quatre blocs dans le bon ordre pour ne pas
                  sortir déformé. Le corps est maintenant un flux MDX que
                  l'article structure lui-même ; ces trois zones ont disparu. */}
                <p className="text-[22px] font-medium leading-[1.1] tracking-[-0.02em] tablet:-ml-[50%] tablet:w-[150%] tablet:max-w-[900px] tablet:text-[26px] tablet:tracking-[-0.01em] desktop:text-[32px]">
                  {post.excerpt}
                </p>
              </div>
              {/* Colonne gauche. `self-stretch` est indispensable : une cellule
                  de grille se réduit à son contenu par défaut, et un enfant
                  `sticky` n'a alors aucune course sur laquelle se déplacer. */}
              <aside className="hidden tablet:col-start-1 tablet:row-start-2 tablet:block tablet:self-stretch tablet:pr-[40px]">
                <TableOfContents
                  entrees={sommaire}
                  titre={uiLabels.filters.blogTableOfContentsLabel}
                />
              </aside>
              <div className="tablet:col-start-2 tablet:row-start-2">
                <div className="mt-[20px] tablet:mt-[40px] tablet:pr-[20px] desktop:pr-[60px]">
                  {/* LE CORPS DE L'ARTICLE, rendu par la page depuis
                    `src/content/articles/<slug>.mdx`. Le gabarit ne connaît ni
                    sa structure ni ses blocs : il lui prête sa colonne, et rien
                    de plus. Habillage du markdown et palette autorisée :
                    `src/mdx-components.tsx`. */}
                  {children}
                </div>
                <NewsletterForm
                  newsletter={blogContent.newsletter}
                  socials={site.socials}
                  emailContact={site.contact.email}
                />
              </div>
            </div>
          </div>
        </article>

        {/* MESURÉ sur le live : la section des articles liés ouvre sur une
            RANGÉE bouton + titre géant — lien « All articles » 100×30 à gauche
            (x 30), titre `h2` 690×151 à droite (x 720), 92 px / interligne 0.82
            / -0.05em en capitales, noir #0b0b0b — puis la grille 50 px plus bas.
            Chez nous le lien pendait en fin d'article et le titre manquait
            COMPLÈTEMENT : ses deux lignes étaient 2 des 9 éléments animés du
            live absents du clone (`TO SPAN "Latest"`, `TO SPAN "articles."`).
            Le lien est donc remonté ici, à sa place de source.
            Le découpage en deux lignes reste un choix de mise en page, mais les
            mots eux-mêmes viennent de `blogContent.relatedTitleLines` : ils
            étaient recopiés en dur en anglais. Même chose pour le libellé et la
            cible du lien (`blogContent.relatedLink`). */}
        {/* Rembourrage haut MESURÉ sur le live : 30 px à 390, 100 px de 810 à
            1199, 120 px au-delà de 1200. Nous étions à 40 et 120, soit 10 px de
            trop en mobile et 20 px de trop entre 810 et 1199. Les 50 px qui
            séparent la rangée de titre de la grille et le rembourrage bas
            (20 / 24 / 30) étaient déjà justes. */}
        {/* MASQUÉE QUAND ELLE EST VIDE. Le bloc rendait son titre géant
            « Derniers articles. » et son bouton même sans un seul article à
            montrer : sur un blog qui démarre, la page se terminait donc sur une
            promesse suivie de rien. La grille en dessous se sert de `related`,
            c'est donc lui qui commande l'affichage de la section entière. */}
        {related.length > 0 ? (
          <>
            <section className="bg-muted px-[20px] pb-[20px] pt-[30px] tablet:px-[24px] tablet:pb-[50px] tablet:pt-[100px] desktop:px-[30px] desktop:pt-[120px]">
              <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[20px] tablet:flex-row tablet:items-start tablet:gap-0">
                <div className="order-1 flex w-full items-start tablet:order-none tablet:w-px tablet:flex-[1_0_0]">
                  <Link
                    href={blogContent.relatedLink.href}
                    className="inline-flex h-[30px] items-center bg-background px-[10px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground no-underline"
                  >
                    {blogContent.relatedLink.label}
                  </Link>
                </div>
                {/* Chaque ligne monte derrière son propre masque, décalée de 100 ms
                — motif identique au titre de `ArticlesSection`. */}
                <h2 className="order-0 m-0 flex w-full flex-col p-0 text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-background tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:text-[64px] desktop:text-[92px]">
                  {blogContent.relatedTitleLines.map((line, i) => (
                    <span
                      key={line}
                      className="accent-room descender-room block w-full overflow-hidden leading-[0.82]"
                    >
                      <Reveal
                        as="span"
                        className="inline-block whitespace-pre-wrap"
                        initialOpacity={0.001}
                        initialY={40}
                        duration={0.8}
                        delay={0.1 + i * 0.1}
                      >
                        {line}
                      </Reveal>
                    </span>
                  ))}
                </h2>
              </div>
            </section>

            {/* `.framer-1zqk55` : grille 2 colonnes `minmax(50px,1fr)` avec une
            gouttière de 4 px (1 colonne sous 810). La gouttière était simulée
            par une bordure de 3 px sur chaque carte, ce qui donnait 690 px de
            large au lieu des 688 px mesurés sur le live à 1440
            ((1440 - 2×30 - 4) / 2 = 688). Padding latéral et bas repris de
            `.framer-1c2z2dn` : 20 px sous 810, 24 px de 810 à 1199, 30 px
            au-delà — nous étions à 4 px de côté en mobile et à 20 px en bas
            partout. */}
            {/* La grille est PLAFONNÉE à 1440, comme toutes les autres sections du
            site, et non posée à même la `<section>`. La distinction ne se voit
            pas à 1440 — la fenêtre y est plus étroite que le plafond — mais
            au-delà : les cartes étant CARRÉES, une grille sans plafond les
            étire indéfiniment. Mesuré à 1920 sur la source, la grille reste à
            1440 et la carte à 718 ; sans plafond nous montions à 928, soit
            190 px de page en trop. C'est le genre d'écart qu'un contrôle mené
            uniquement aux trois largeurs de référence ne peut pas voir. */}
            <section className="bg-muted px-[20px] pb-[20px] tablet:px-[24px] tablet:pb-[24px] desktop:px-[30px] desktop:pb-[30px]">
              <div className="mx-auto grid w-full max-w-[1440px] gap-[4px] tablet:grid-cols-2">
                {related.slice(0, 2).map((item) => (
                  <RelatedArticle key={item.slug} post={item} />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
