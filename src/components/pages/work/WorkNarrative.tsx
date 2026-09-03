import Link from "next/link";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { ParallaxBackdrop } from "@/components/motion/ParallaxBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { Icon, SwapText } from "@/components/ui";
import type { ImageAsset, WorkItem } from "@/lib/content";
import type { WorkDetailContent } from "./work-detail-content";
import { uiLabels } from "@/content/ui";

const LABEL =
  "text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/60";
/*
 * Échelle typographique MESURÉE sur la source aux trois largeurs. Le chapô
 * (`overview`) et les titres de section ne partagent PAS la même : 22/26/32
 * pour le premier, 22/24/26 pour les seconds. Nous appliquions 28/34/38 aux
 * deux, ce qui allongeait la page de plus de 500px en tablette et en mobile.
 */
const OVERVIEW =
  "text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-background tablet:text-[26px] tablet:tracking-[-0.01em] desktop:text-[32px]";
const TITLE =
  "text-[22px] font-medium leading-[1.1] tracking-[-0.01em] text-background tablet:text-[24px] desktop:text-[26px]";
/*
 * Titre d'affichage de section (« Le problème. »). Il est CALÉ À DROITE de la
 * moitié gauche à partir de 810 et plafonné à 320 / 400 / 570 : sa position
 * horizontale se déduit donc de la largeur du conteneur, pas d'un palier.
 * Vérifié à 17 largeurs, dont 1190 (x=195) et 1600 (x=230).
 */
/*
 * VIGNETTE DE LA VIDÉO PROJET : elle vient de la DONNÉE, `work.videoPoster`.
 *
 * Elle était codée en dur, dans une table associant deux images du template aux
 * slugs du template — dont un, `box-mode`, qui n'existe plus depuis que les
 * études de cas inventées ont été remplacées par les vraies. Les trois études
 * réelles affichaient donc toutes la même photo de mode, sans licence traçable,
 * alors que `work.videoPoster` portait déjà la capture du projet et que le
 * champ existait dans le modèle de contenu.
 *
 * Repli sur la couverture de l'étude : c'est le visuel du même projet, jamais
 * celui d'un autre. La vignette n'est de toute façon rendue que lorsque
 * l'étude porte une vidéo.
 */

/*
 * `w-full` + `tablet:text-right` : MESURÉ sur le live, ce titre est calé à
 * DROITE de la moitié gauche dès 810 (boîte 381 à x=24 pour une médiane à 405,
 * boîte 570 à x=150 pour une médiane à 720) et à gauche en dessous (boîte 320 à
 * x=20). Deux corrections en une : le `text-right` manquait — nos deux lignes
 * partaient du bord gauche, celle du live finit sur la médiane, soit 394px
 * d'écart sur « The » à 1440 ; et sans `w-full` le `ml-auto` faisait
 * rétrécir la boîte à son max-content (430 au lieu de 570 une fois le titre
 * découpé en lignes), ce qui déplaçait la seconde ligne de 140px.
 */
const DISPLAY =
  "w-full text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-background " +
  "max-w-[320px] tablet:ml-auto tablet:max-w-[400px] tablet:text-right tablet:text-[68px] desktop:max-w-[570px] desktop:text-[92px]";
const BODY =
  "text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60";

/**
 * Transition des survols de cette page : 300 ms sur la courbe en S de Framer
 * `cubic-bezier(0.68,0,0,1)`, la même que les permutations de libellés du site.
 * Elle reproduit le relevé du lien « Back to projects », dont la largeur passe
 * de 143,3 à 140,3 px en franchissant la moitié de sa course vers 130 ms, soit
 * environ 40 % du temps — signature d'une courbe asymétrique, pas d'un
 * `ease-out` qui partirait vite.
 */
const HOVER_300 =
  "transition-all duration-300 ease-[cubic-bezier(0.68,0,0,1)] motion-reduce:transition-none";
const DOT_SWAP = HOVER_300;

/**
 * Ligne de fiche projet (`.framer-brobv4`), relevée sur `/live-proxy/work/box-mode`.
 *
 * Contrat FIXE, identique aux 18 largeurs de contrôle (320 → 1920) :
 *   `padding: 18px 0`, `position: relative`, `overflow: clip`,
 *   `justify-content: space-between`, `align-items: center`, gap 0,
 *   libellé ET valeur en 12px / 14,4px / 500 / -0,12em / capitales.
 * Hauteur qui en découle : 18 + 14,40625 + 18 = 50,40625 px, mesurée telle
 * quelle aux 18 largeurs. Aucune hauteur minimale sur la source.
 *
 * Trois défauts cumulés ici, +1,59px par ligne soit +6,4px sur les quatre :
 *   - `min-h-[52px]` : une hauteur en dur que la source ne pose nulle part ;
 *   - `py-[16px]` au lieu de 18 ;
 *   - valeur en 11px/13,2px au lieu de 12px/14,4px (les deux textes partagent
 *     le même préréglage `wwtw0z` sur la source, seule la couleur diffère).
 * Et le filet : la source le dessine sur un `::after` en `position:absolute;
 * inset:0; border-top:1px solid rgba(0,0,0,.1)`, donc il ne compte PAS dans la
 * hauteur. Un `border-t` posé sur la ligne elle-même en ajoutait un quatrième.
 */
function FactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center justify-between overflow-clip py-[18px] after:pointer-events-none after:absolute after:inset-0 after:border-t after:border-black/10 after:content-['']">
      {/* `whitespace-pre` des deux côtés : le préréglage de texte de la source
          est en `white-space: pre`, c'est pour ça que la ligne mesure 50,40625
          aux 18 largeurs sans jamais se replier, et que le débordement est
          simplement clippé par la ligne. Sans lui, à 320 la ligne « Scope of
          work » de `/work/nomad-stays` dépassait de 0,1px (96,3 + 183,8 pour
          280 de large), repliait ses DEUX colonnes et prenait 64,78 au lieu de
          50,39, soit les +16 que la page traînait à cette seule largeur. */}
      <dt className={`${LABEL} whitespace-pre`}>{label}</dt>
      <dd className="m-0 whitespace-pre text-right text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background">
        {children}
      </dd>
    </div>
  );
}

/**
 * Bouton « Live project » (`.framer-1sk0ilg`). Contrat relevé dans le CSS de la
 * source, sans media-query : hauteur 30px, padding 10px, gap 10px,
 * `width: min-content`, fond accent, overflow clippé, texte 12px/600/-0.01em.
 *
 * LE LIBELLÉ EST EN CAPITALES. Les deux `<p class="framer-text">` de la source
 * portent `--framer-text-transform:uppercase` dans leur attribut `style`, sur
 * les TROIS pages projet et sur les TROIS variantes de largeur (6 occurrences
 * par page, soit 3 préréglages × 2 copies du swap). Un commentaire antérieur
 * affirmait l'inverse ; c'est faux, relevé fait sur `/live-proxy`.
 *
 * Au survol, deux copies s'échangent vers le HAUT : la copie de repos passe à
 * `top:-22px` et la copie masquée, posée à `bottom:-22px`, remonte en place.
 * La version précédente n'avait pas ce swap, était trop haute (34), trop
 * rembourrée (12), trop petite (11px) et virait à l'accent au survol au lieu de
 * l'avoir en fond permanent.
 *
 * LES 16px MANQUANTS VENAIENT DE LÀ, pas d'une boîte mal dimensionnée. Le
 * bouton mesurait 85,83 chez nous contre 102,09 sur la source, à TOUTES les
 * largeurs (390, 809, 810, 1440) et non seulement à 390 : l'écart est constant
 * parce qu'il n'a jamais dépendu d'un préréglage. Rembourrage (10), écart
 * interne (10), `white-space:pre`, taille (12px), graisse (600), interlettrage
 * (-0,12px) et interligne (14,4px) étaient déjà identiques des deux côtés ; la
 * seule propriété qui divergeait était `text-transform`, `uppercase` sur la
 * source contre `none` chez nous. Relevé par caractère qui l'établit : sur la
 * source « v » occupe 8,11px et « r » 7,98px (glyphes V et R), chez nous 6,58
 * et 4,33px (glyphes v et r minuscules). Total du texte 82,09 contre 65,83,
 * soit les 16,26px, que les deux rembourrages de 10 portent à 102,09 / 85,83.
 * Le diagnostic antérieur mesurait la police au canvas avec la chaîne
 * « Live project » telle quelle, donc en minuscules des deux côtés : il
 * concluait à des métriques identiques et manquait la transformation.
 *
 * `uppercase` est posé sur le lien et non sur chaque copie : il se propage aux
 * DEUX copies du swap, exactement comme la source le fait sur ses deux `<p>`.
 * Une largeur en dur aurait figé 102,09 pour ce seul libellé alors que la loi
 * est la casse, qui suit n'importe quel libellé.
 *
 * `href` : la source pointe vers `../contact` (le template de démo n'a pas de
 * vrai projet à montrer). On garde `liveUrl`, qui est la donnée utile pour une
 * base rebrandable et ne change aucun pixel.
 */
function ProjectButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Focus : voir `src/app/focus.css` (source de vérité unique).
      className="group flex h-[30px] w-min items-center justify-center gap-[10px] overflow-hidden bg-background p-[10px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-white no-underline"
    >
      {/* Motif `.framer-1sk0ilg` : 22 px vers le haut, fondu croisé, 320 ms. */}
      <SwapText travel={22}>{uiLabels.work.liveProjectLabel}</SwapText>
    </a>
  );
}

/**
 * Image de galerie au rapport NATUREL : la source ne recadre pas le CADRE de ses
 * visuels de page projet, elle le pose à la proportion d'origine. Les valeurs
 * fixes (`aspect-[1.9]`, `aspect-[2.1]`) qui la remplaçaient rognaient jusqu'à
 * 378px de hauteur sur une seule image. Vérifié : nos cadres mesurent 690×518,
 * 1380×883 et 1380×1035 à 1440, soit exactement les cadres de la source.
 *
 * PARALLAXE. À l'intérieur du cadre, la source pose un calque sur-dimensionné
 * qu'elle déplace au scroll. Le débord N'EST PAS uniforme, et l'ordre relevé sur
 * le live est le même sur les CINQ pages projet, sans exception :
 *
 *     problème -7 %  ·  vignette vidéo -6 %  ·  résultat -7 %  ·  suivantes -10 %
 *
 * Une valeur unique de 7 % était appliquée partout, ce qui écrasait les images
 * de fin de page. L'amplitude (`start end → end start`) a été relevée sur le
 * live et vaut le débord lui-même, en plus ou en moins.
 * Mesurer ce calque au lieu du cadre donne 690×590 et fait croire à un cadre
 * trop court : le cadre, lui, est exact.
 */
function GalleryImage({
  image,
  className,
  imageClassName,
  sizes = "calc(100vw - 40px)",
  overshoot,
  reveal = false,
}: {
  image: ImageAsset;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  overshoot?: number;
  /**
   * Apparition fondu + dézoom. DEUX cadres seulement en portent une sur les
   * pages projet, et c'est la source qui le dit : relevé d'état au chargement
   * sur `/live-proxy/work/box-mode`, sans défilement, exactement deux calques y
   * sont à `opacity: 0` et `scale(1.1)` — le cadre 1380 × 862 de la section
   * « Project details » (762 × 476 à 810, 350 × 219 à 390) et le cadre
   * 690 × 518 du bloc résultat (381 × 286 à 810, 350 × 263 à 390). Les deux
   * cadres suivants (1380 × 883 et 1380 × 1035 à 1440) n'en ont AUCUNE, il ne
   * faut donc surtout pas généraliser.
   */
  reveal?: boolean;
}) {
  const cadre = (
    <ParallaxImage
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      overshoot={overshoot}
      reveal={reveal}
      className={image.caption ? "w-full" : `w-full ${className ?? ""}`}
      imgClassName={imageClassName ?? ""}
    />
  );

  if (!image.caption) return cadre;

  /*
   * `<figure>` + `<figcaption>` plutôt qu'un paragraphe posé dessous : c'est le
   * seul balisage qui ATTACHE la légende à l'image. Un lecteur d'écran annonce
   * alors « figure » puis la légende avec l'image, au lieu de lire un texte
   * orphelin trois cadres plus loin.
   *
   * `m-0` : le style d'agent utilisateur pose 40px de marge horizontale sur
   * `figure`, ce qui rentrerait le cadre par rapport aux images sans légende de
   * la même page.
   */
  return (
    <figure className={`m-0 ${className ?? ""}`}>
      {cadre}
      <figcaption className={`${BODY} mt-[12px] max-w-[520px] tablet:mt-[20px]`}>
        {image.caption}
      </figcaption>
    </figure>
  );
}

/*
 * La grille du récit est un simple 50/50 SANS gouttière : le libellé occupe la
 * moitié gauche, le contenu la moitié droite. Une grille de 12 colonnes avec
 * 4px de gouttière plaçait la colonne 7 à 722px au lieu de 720 à 1440, soit 2px
 * d'erreur constants à toutes les largeurs.
 */
export function WorkNarrative({
  detail,
  work,
}: {
  detail: WorkDetailContent;
  work: WorkItem;
}) {
  const [problemImage, resultImage, approachImage, ...remainingImages] =
    detail.gallery;

  return (
    /* Retraits verticaux de la section : PALIER unique à 810, relevé sur la
       déclaration calculée de la source (`padding: 20px 0` de 320 à 809,
       `30px 0 60px` de 811 à 1920). Le `pb-[112px]` posé ici ne venait
       d'aucune mesure : il compensait le bloc « approche » trop court de
       52px. Les deux erreurs se soldaient en 4px sur la hauteur de page. */
    <section className="relative overflow-hidden bg-muted px-[20px] pb-[20px] pt-[20px] text-background tablet:px-[24px] tablet:pb-[60px] tablet:pt-[30px] desktop:px-[30px]">
      {/* Cache clair au-dessus de la section. PALIER À 390 : la source pose
          20 px de haut à 10 px au-dessus de la section (y 790, h 20), nous
          posions 32 px à 30 au-dessus (y 780, h 32). Au-delà de 810 les deux
          coïncident. */}
      <div
        aria-hidden
        /* `z-[2]` : cette encoche de raccord est peinte APRÈS le hero dans le
          document, mais le calque de grain du hero est posé à `z-[1]` et la
          section, en `position: relative` sans `z-index`, ne crée AUCUN contexte
          d'empilement — ce grain remonte donc dans le contexte racine et se
          peignait par-dessus l'encoche. Résultat visible : la moitié qui se
          termine plus tôt sortait grenue là où le reste de la section est plat,
          ce qui se lit comme un voile flou au bas du hero.
          `FaqSection` porte déjà ce `z-[2]` et rend propre : c'est la même
          correction, sur les trois autres encoches du site. */
        className="absolute right-0 top-[-10px] z-[2] h-[20px] w-1/2 bg-muted tablet:top-[-30px] tablet:h-[32px]"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 hidden w-px bg-black/[0.08] tablet:block"
      />

      <div className="relative mx-auto w-full max-w-[1440px]">
        <div className="grid grid-cols-1 tablet:grid-cols-2">
          {/* MESURÉ sur le live : boîte de 143,3 × 20, texte 12px, pastille
              accent de 20px contenant une flèche de 10px en trait de 3.
              `self-start` est indispensable : la grille est en
              `align-items: normal`, donc les éléments s'étirent — sans lui ce
              lien mesurait 414px de haut. `col-span-2` lui rend la place
              nécessaire : cantonné à une seule colonne de 110px, le `w-fit`
              écrasait la flèche à 16px de large. */}
          {/* SURVOL, relevé sur le live (largeur 1440, lien à x=30) : la
              pastille accent n'est pas UNE pastille qui glisse, c'en est DEUX
              qui permutent, exactement comme les libellés à swap du site.
                repos  : pastille A en flux, 20×20, opacité 1, à x=30 ;
                         pastille B absolue, `scale(0.4)`, opacité 0, boîte à
                         x=54 — soit +18 px une fois la mise à l'échelle défaite.
                survol : A part à `scale(0.4)` + opacité 0, boîte à x=18 (donc
                         -18 px), et B revient à `scale(1)` + opacité 1 à x=30.
              L'écart du lien se resserre en même temps de 10 px à 7 px, ce qui
              ramène la largeur totale de 143,3 à 140,3 px et décale le libellé
              de 60 à 57. Course mesurée à environ 300 ms en courbe en S :
              143,2 à 40 ms, 143,0 à 80 ms, 141,1 à 130 ms, 140,4 à 200 ms,
              140,3 à 300 ms.
              Nous n'avions qu'UNE pastille translatée de -4 px, sans fondu, sans
              mise à l'échelle et sans resserrement de l'écart. */}
          <Link
            href="/work"
            className={`group flex h-[20px] w-fit items-center gap-[10px] self-start text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background ${DOT_SWAP} hover:gap-[7px]`}
          >
            <span className="relative block h-[20px] w-[20px] flex-none">
              {/* Pastille A : visible au repos, sort par la gauche en rétrécissant. */}
              <span
                className={`absolute inset-0 flex items-center justify-center rounded-full bg-accent text-accent-ink ${DOT_SWAP} group-hover:-translate-x-[18px] group-hover:scale-[0.4] group-hover:opacity-0`}
              >
                <Icon size={10} strokeWidth={3}>
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </Icon>
              </span>
              {/* Pastille B : en attente à droite, rétrécie et invisible. */}
              <span
                aria-hidden
                className={`absolute inset-0 flex translate-x-[18px] scale-[0.4] items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 ${DOT_SWAP} group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100`}
              >
                <Icon size={10} strokeWidth={3}>
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </Icon>
              </span>
            </span>
            <span className="whitespace-pre">{uiLabels.work.backToProjectsLabel}</span>
          </Link>

          {/* Le chapô suit la largeur du conteneur JUSQU'À un plafond de 570px
              (mesuré : 320 à 360px de fenêtre, 560 à 600, puis 570 constant).
              Sans ce plafond il occupait 688px à 1440 et perdait deux lignes. */}
          {/* Retrait haut de la colonne : PALIER, 0 sous 810 puis 30px à partir
              de 810 (`.framer-157qs6g`, `padding: 30px 0 0`). Le 27px posé ici
              plaçait le chapô à 867 là où la source le pose à 870, à toutes les
              largeurs ≥ 810 ; sous 810 les deux tombent à 871, d'où le mt-21
              conservé. */}
          <div className="mt-[21px] tablet:col-start-2 tablet:mt-[30px]">
            <Reveal initialOpacity={0.001} initialY={20}>
              <p className={`${OVERVIEW} max-w-[570px]`}>{detail.overview}</p>
            </Reveal>
            {/* Le conteneur de la fiche (`.framer-1k3ca07`) est un PALIER, pas
                une valeur fluide : `padding: 30px 0 10px` de 320 à 809, puis
                `40px 0 30px` de 810 à 1920 (relevé aux 18 largeurs, hauteur
                totale 241,63 puis 271,63 pour 4 × 50,40625 de lignes). Le
                retrait BAS manquait entièrement des deux côtés de la bascule. */}
            <dl className="mt-[30px] pb-[10px] tablet:mt-[40px] tablet:pb-[30px]">
              <FactRow label={uiLabels.work.scopeLabel}>
                {/* Pas de repli : la source pose la liste des catégories dans
                    un seul `<p>` en `white-space: pre`. */}
                <span className="flex flex-nowrap justify-end gap-x-[10px]">
                  {work.categories.map((category, index) => (
                    <span key={category}>
                      {category}
                      {index < work.categories.length - 1 ? (
                        <span className="ml-[10px] text-background/20">/</span>
                      ) : null}
                    </span>
                  ))}
                </span>
              </FactRow>
              {work.launched ? (
                <FactRow label={uiLabels.work.timelineLabel}>{work.launched}</FactRow>
              ) : null}
              {work.client ? <FactRow label={uiLabels.work.clientLabel}>{work.client}</FactRow> : null}
              {work.year ? <FactRow label={uiLabels.work.yearLabel}>{work.year}</FactRow> : null}
            </dl>
            {/* AUCUNE marge au-dessus du bouton : sur la source il suit la fiche
                sans espace, c'est le retrait BAS du conteneur de fiche (10px
                sous 810, 30px au-dessus) qui fait tout l'écart. Mesuré à 1440 :
                fiche 976→1248, bouton 1247→1277 ; à 390 : fiche 944→1186,
                bouton 1185→1215. Le `mt-[20px]` posé ici décalait le bouton de
                20px à toutes les largeurs, et avec lui la fin de la colonne. */}
            {work.liveUrl ? (
              <div>
                <ProjectButton href={work.liveUrl} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Première image de galerie : PLEINE LARGEUR et au rapport naturel sur
            la source, posée AVANT le bloc « problème ». Elle était rendue en
            vignette de 342px recadrée en 1,7 dans une colonne de la grille. */}
        {/* Écart bouton → image : PALIER de 20px sous 810 et 60px à partir de
            810 (c'est le `padding-bottom` de `.framer-hwsewk`, relevé à 20 puis
            60). Mesuré, fin du bouton → haut de l'image : 1239→1259 à 320,
            1215→1235 à 390, 1191→1211 à 600 et 809, 1286→1346 à 810,
            1277→1337 à 1440. Le 2px/62px posé ici décalait tout ce qui suit de
            18px sous 810 et de 2px au-dessus. */}
        {problemImage ? (
          /* La source fait ENTRER ce visuel : cadre 1380 × 862 à 1440 (762 × 476
             à 810, 350 × 219 à 390), un seul calque masqué à `opacity: 0` et
             `scale(1.1)` dans le conteneur `.framer-58hosr-container` de la
             section « Project details ». Il était posé à plat chez nous. */
          <GalleryImage
            image={problemImage}
            className="mt-[20px] tablet:mt-[60px]"
            reveal
          />
        ) : null}

        {/* Titre d'affichage de la section, ABSENT de notre rendu jusqu'ici : la
            source l'expose en 52 / 68 / 92px sur deux lignes, dans la moitié
            gauche, 30px sous l'image en mobile et 60 au-dessus. */}
        <div className="mt-[30px] grid grid-cols-1 tablet:mt-[60px] tablet:grid-cols-2">
          {/* APPARITION ligne par ligne, comme la source : `motion-sweep`
              relevait deux SPAN animés sur le live (« The » puis « problem. »)
              sans équivalent chez nous — notre titre était statique.
              Découpage porté par la DONNÉE (`uiLabels.work.problemTitleLines`,
              deux entrées) et non par la largeur de la fenêtre : le titre tient
              sur deux lignes à toutes les largeurs (52 / 68 / 92px dans une
              boîte plafonnée à 320 / 400 / 570). Il était écrit en dur, en
              anglais. Le span externe sert de masque, l'interne glisse de 40px
              vers le haut.
              Composant SERVEUR : `duration` / `delay` (valeurs) et non
              `transition={framerTween(...)}` (fonction client). */}
          <h2 className={DISPLAY}>
            {uiLabels.work.problemTitleLines.map((line, i) => (
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

        <div className="mt-[30px] grid grid-cols-1 tablet:grid-cols-2">
          <div className="tablet:col-start-2">
            <Reveal initialOpacity={0.001} initialY={24}>
              {/* Mêmes plafonds que le bloc « approche » : 570 pour le titre,
                  520 pour le corps. Ce sont des largeurs FLUIDES plafonnées, pas
                  des paliers : le texte suit la colonne jusqu'à cette borne. */}
              <h2 className={`${TITLE} max-w-[570px]`}>{detail.problemTitle}</h2>
              {/* Écart titre → corps : PALIER 12 / 20 à 810 (`gap` déclaré du
                  groupe de texte sur la source, identique dans le bloc
                  « approche »). Le 18px unique posé ici valait +6 sous 810 et
                  -2 au-dessus. */}
              <p className={`${BODY} mt-[12px] max-w-[520px] tablet:mt-[20px]`}>{detail.problemBody}</p>
            </Reveal>
          </div>
        </div>

        {/* Bloc vidéo, ABSENT de notre rendu jusqu'ici. Structure MESURÉE : la
            vignette suit la largeur du contenu jusqu'à un plafond de 378px et
            se cale à droite de la moitié gauche à partir de 810 — même règle que
            le titre d'affichage. Rapport 378/269 constant à toutes les largeurs.
            Le libellé est aligné sur le bord droit de la vignette au-dessus de
            810, à gauche en dessous. */}
        {detail.projectVideoUrl ? (
          /* Écart corps du problème → bloc vidéo : 30px CONSTANT, c'est le
             `gap` du conteneur de la section « problème » sur la source, le
             même qui sépare tous ses blocs (relevé à 320, 390, 600, 809, 811,
             1199, 1201, 1440 et 1920). Le 26/33 posé ici compensait le retard
             de 6px que l'écart titre → corps introduisait sous 810. */
          <div className="mt-[30px] grid grid-cols-1 tablet:grid-cols-2">
            <a
              href={detail.projectVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              /* RESTÉ EN ANGLAIS jusqu'au 2026-08-27 : « Play the Kpsull
                 project video on YouTube », annoncé tel quel par les lecteurs
                 d'écran sur un document `lang="fr"`. Les trois fragments
                 existaient déjà en français dans `uiLabels.work`, personne ne
                 les lisait. */
              aria-label={`${uiLabels.work.videoAriaPrefix}${work.title}${uiLabels.work.videoAriaSuffix}`}
              className="group block w-full text-background no-underline tablet:ml-auto tablet:w-[378px]"
            >
              {/* La vignette DÉBORDE de son emplacement : l'emplacement occupe
                  378×240 dans le flux, l'image y est centrée sur 378×269 et
                  déborde donc de ~14px en haut et en bas. C'est ce décalage
                  entre boîte de flux et boîte peinte qui donnait une hauteur de
                  bloc apparemment incohérente (47px de chrome en mobile, 58
                  au-dessus, pour un libellé de 28). */}
              <div className="relative w-full" style={{ aspectRatio: "378 / 240" }}>
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden"
                  style={{ aspectRatio: "378 / 269" }}
                >
                  {/* Calque dérivant à 6 %, comme la source : cette vignette est
                      le seul emplacement de parallaxe de la page à ce débord. */}
                  <ParallaxBackdrop
                    src={work.videoPoster?.src ?? work.cover.src}
                    overshoot={0.06}
                    label={`${work.title}${uiLabels.work.videoPosterSuffix}`}
                  />
                </div>
              </div>
              {/* SURVOL, relevé sur le live : la pastille de lecture GROSSIT de
                  10 % (boîte 28×28 → 30,8×31, `scale(1.1)`) et l'écart au
                  libellé s'ouvre de 10 px à 14 px, ce qui élargit le bloc de
                  104,6 à 108,6 px — aligné à droite, il gagne donc 4 px vers la
                  gauche. Course d'environ 300 ms : 28,0 à 40 ms, 28,7 à 80 ms,
                  29,9 à 130 ms, 30,7 à 200 ms, 30,8 à 300 ms. Notre bloc était
                  entièrement immobile. */}
              {/* Vignette → libellé : `gap` déclaré du bloc vidéo, 20 sous 810
                  et 30 à partir de 810. Le 19px valait 1px de retard en
                  mobile. */}
              <span className={`mt-[20px] flex items-center gap-[10px] tablet:mt-[30px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] tablet:justify-end ${HOVER_300} group-hover:gap-[14px]`}>
                {uiLabels.work.playVideoLabel}
                <svg
                  aria-hidden
                  viewBox="0 0 28 28"
                  className={`h-[28px] w-[28px] flex-none ${HOVER_300} group-hover:scale-110`}
                  fill="none"
                >
                  <circle cx="14" cy="14" r="14" fill="#0B0B0B" />
                  <path d="M19 14L11.5 18.3301L11.5 9.66987L19 14Z" fill="white" />
                </svg>
              </span>
            </a>
          </div>
        ) : null}

        {/* Deuxième image : MOITIÉ DROITE à partir de 810 (pleine largeur en
            mobile), toujours au rapport naturel, et posée entre le bloc
            « problème » et le bloc « résultats ». */}
        {/* UNE CAPTURE LÉGENDÉE RESTE EN PLEINE LARGEUR, et c'est la seule
            entorse au gabarit. La demi-largeur convient à une capture
            d'ambiance, où l'on reconnaît une page sans la lire. Elle ne
            convient pas à un détail d'interface : à 810, la moitié droite
            mesure 381px, soit 27 % de l'échelle d'origine d'une capture de
            1256px de large. Le message d'erreur, la jauge de mot de passe et
            les libellés de champ y descendent sous 7px, illisibles. Une image
            qu'on prend la peine de légender est une image qu'on demande au
            lecteur de lire. */}
        {resultImage ? (
          resultImage.caption ? (
            <GalleryImage
              image={resultImage}
              className="mt-[30px] tablet:mt-[50px]"
              reveal
            />
          ) : (
            <div className="mt-[30px] tablet:ml-auto tablet:mt-[50px] tablet:w-1/2">
              <GalleryImage
                image={resultImage}
                sizes="(min-width: 810px) 50vw, calc(100vw - 40px)"
                /* Deuxième et DERNIER cadre à apparaître sur une page projet :
                   690 × 518 à 1440 (381 × 286 à 810, 350 × 263 à 390), un seul
                   calque masqué dans `.framer-ac29h-container`. */
                reveal
              />
            </div>
          )
        ) : null}

        {/* Écart image → bloc « résultats » : le `gap` de la section
            « problème » vaut 30 à toutes les largeurs, et le conteneur du bloc
            ajoute `padding-top: 20px` à partir de 810 seulement. D'où 30 puis
            50, et non le trio 16/107/49 qui n'existe nulle part sur la source :
            le 107 valait +57 à 810, exactement ce que le `mt-[3px]` de l'image
            suivante reprenait plus bas. */}
        <div className="mt-[30px] grid grid-cols-1 tablet:mt-[50px] tablet:grid-cols-2">
          <p className={`${LABEL}`}>{uiLabels.work.resultsLabel}</p>
          {/* Libellé → contenu : le bloc est empilé sous 810 (`gap: 20`) et
              devient une grille à deux colonnes alignées en haut à partir de
              810. Le 36px posé ici valait +16 en mobile. */}
          <div className="mt-[20px] tablet:col-start-2 tablet:mt-0">
            {/* Gouttière NULLE entre les deux colonnes de chiffres. Écart
                nombre → libellé : PALIER 10 / 15 à 810, et non 15 partout. */}
            <div className="grid grid-cols-2 gap-0">
              {detail.metrics.map((metric) => (
                <div key={`${metric.value}-${metric.label}`} className="flex flex-col gap-[10px] tablet:gap-[15px]">
                  {/* Alignés à GAUCHE, comme leur libellé : `text-right`
                      poussait les deux nombres au bord droit de leur colonne,
                      donc décalés de toute la largeur du bloc par rapport à la
                      source. Visible à l'écran, pas seulement à la mesure. */}
                  <p className="text-[39px] font-medium leading-[1.2] tracking-[-0.03em] text-background tablet:text-[52px] desktop:text-[56px]">
                    {metric.value}
                  </p>
                  <p className={`${LABEL} max-w-[150px]`}>
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
            {/* Chiffres → titre de conclusion : `gap` de la colonne de contenu,
                PALIER 30 / 50 à 810. Le 50px unique valait +20 en mobile. */}
            <Reveal initialOpacity={0.001} initialY={22}>
              <h2 className={`${TITLE} mt-[30px] max-w-[570px] tablet:mt-[50px]`}>{detail.outcomeTitle}</h2>
            </Reveal>
          </div>
        </div>

        {/* Écart titre de conclusion → image suivante : c'est le
            `padding-bottom` du conteneur de la section « problème », PALIER
            30 / 60 à 810 (30 de 320 à 809, 60 de 811 à 1920). Le 3/61 posé ici
            reprenait à 810 les 57px que le `mt-[107px]` du bloc « résultats »
            avait ajoutés : deux fautes de signe opposé qui laissaient la
            hauteur de page presque juste avec un intérieur faux. */}
        {approachImage ? (
          <GalleryImage
            image={approachImage}
            className="mt-[30px] tablet:mt-[60px]"
            overshoot={0.1}
          />
        ) : null}

        {/* Écart de la pile de fin : 20/30 sans légende, comme la source, mais
            40/60 dès qu'une légende s'intercale. Sans cela le texte d'une
            figure se retrouve à 20px du cadre suivant et à 12px du sien : il se
            lit comme le titre de l'image du dessous, pas comme la légende de
            celle du dessus. Les deux autres projets n'ont que trois visuels,
            donc aucune image dans cette pile : le changement ne les touche
            pas. */}
        {remainingImages.map((image) => (
          <GalleryImage
            key={image.src}
            image={image}
            className={
              image.caption
                ? "mt-[40px] tablet:mt-[60px]"
                : "mt-[20px] tablet:mt-[30px]"
            }
            overshoot={0.1}
          />
        ))}

        {/* Le bloc « approche » vient APRÈS les deux dernières images sur la
            source ; il était placé avant.

            STRUCTURE, et c'est là qu'était le défaut de fond : contrairement au
            bloc « résultats » — une grille à deux colonnes dont le libellé et
            le contenu partagent le même haut à partir de 810 —, ce bloc reste
            EMPILÉ à toutes les largeurs. Son conteneur est une colonne avec
            `gap: 20` sous 810 et `gap: 30` au-dessus : le libellé occupe sa
            propre ligne pleine largeur, la ligne suivante porte le contenu dans
            la moitié droite. Relevé sur la source à 320, 390, 600, 809, 811,
            1199, 1201, 1440 et 1920 : le libellé est à y5977 et le titre à
            y6021 à 1440, soit 14,4 de libellé plus 30 de `gap`.
            Le calquer sur le bloc « résultats » (`tablet:mt-0`) remontait tout
            son intérieur de 44px, jusqu'à 78 pour le bouton. */}
        <div className="mt-[30px]">
          <p className={`${LABEL}`}>{uiLabels.work.approachLabel}</p>
          <div className="mt-[20px] tablet:ml-auto tablet:mt-[30px] tablet:w-1/2">
            <Reveal initialOpacity={0.001} initialY={22}>
              {/* Le bloc « approche » est plafonné (570 / 520) sur la source :
                  sans ces bornes le texte occupe les 688px de la colonne et
                  perd deux lignes, soit 113px sur la hauteur de page. */}
              <h2 className={`${TITLE} max-w-[570px]`}>{detail.approachTitle}</h2>
              {/* Même `gap` de groupe de texte que le bloc « problème » :
                  12 sous 810, 20 au-dessus. */}
              <p className={`${BODY} mt-[12px] max-w-[520px] tablet:mt-[20px]`}>{detail.approachBody}</p>
            </Reveal>
            {/* Texte → bouton : `gap` de la colonne de contenu, PALIER 20 / 40
                à 810 (mesuré 6242 → 6282 à 1440, 4873 → 4913 à 810,
                3683 → 3703 à 390). Le 16/30 laissait le bouton 4 puis 10px
                trop haut EN PLUS du décalage de structure. */}
            {work.liveUrl ? (
              <div className="mt-[20px] tablet:mt-[40px]">
                <ProjectButton href={work.liveUrl} />
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </section>
  );
}
