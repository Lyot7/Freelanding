"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import type { AboutContent, HomeContent } from "@/lib/content/types";
import {
  framerSpring as spring,
  framerTween as tween,
  useReveal,
  Reveal,
} from "@/components/motion/Reveal";
import { useParallaxLayerY } from "@/components/motion/ParallaxImage";
import { Grain } from "@/components/effects/Grain";
import { Highlighted } from "@/components/ui";
import { facteurDeChasse } from "@/lib/ajustement-titre";

/**
 * AboutSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de la
 * section "About" de la page d'accueil d'origine.
 *
 * Source : markup content/framer-html/about.ts (section `.framer-zwvlfw`,
 * data-framer-name="About"), CSS framer-home.css (scopé `.framer-pK5Ni`) +
 * framer-global.css (presets `wwtw0z` 12px/uppercase, `1hgnchr` 13px, bouton
 * `.framer-LXztY`). Valeurs lues, pas devinées.
 *
 * Périmètre RÉEL de la section source (tous les éléments reproduits, aucun
 * retiré/ajouté) :
 *   - Top : grille d'infos [ "Launched" | "24+ projects" ] + [ "2019-26©" +
 *     titre H1 fit-text aligné à droite ].
 *   - Bas : colonne gauche (paragraphe(s) + lien "About us" à flèche) | colonne
 *     droite (image + grain, compteur "12+" + libellé "Industries…").
 *   - Filet vertical central (blanc 18 %, pleine hauteur).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, logique INVERSÉE) :
 *   base   = mobile   (max-width 809.98px)
 *   tablet = 810-1199 (min-width 810)
 *   desktop= ≥1200    (min-width 1200)
 *
 * Contenu / props :
 *   - `about.title` / `about.titleLines` → titre H1 fit-text (lignes empilées,
 *     ajustées à la largeur du cadre, slide-up masqué).
 *   - `about.body[]` → paragraphe(s) de la colonne gauche (preset wwtw0z,
 *     12px uppercase, blanc 70 %). Le modèle `homeContent.about.body` recompose
 *     3 paragraphes (about.ts + showreel.ts + numbers.ts) ; ils sont tous rendus
 *     dans le slot paragraphe. La source Framer n'en portait qu'UN ("People
 *     decide…") — voir rapport de fidélité.
 *   - Habillage de la section (libellés de la grille d'infos, millésime,
 *     compteur + légende, lien de bas de colonne) : TOUT vient de la donnée
 *     (`about.launchedLabel`, `projectsLabel`, `vintage`, `counter`, `cta`).
 *     Ces six chaînes étaient recopiées en dur, en anglais, dont deux preuves
 *     sociales fabriquées (« 24+ projects » et le compteur « 12+ industries ») :
 *     la donnée traduite les a neutralisées, le branchement les fait disparaître.
 *
 * Reveals ROBUSTES (progressive enhancement) via la primitive
 * `@/components/motion/Reveal` : l'état de REPOS (SSR, no-JS, onglet caché,
 * prefers-reduced-motion) est TOUJOURS l'état final VISIBLE. Reproduits du
 * source : fondu de section (opacity 0.001→1), slide-up des mots du titre
 * (translateY 40px, opacity 0→1), scale de l'image (scale 1.1→1, opacity 0→1).
 * Valeurs de spring/tween alignées sur le reste de la reconstruction (le JSON
 * `appear` exact de cette section n'est pas présent dans l'archive).
 */

/** Preset wwtw0z (framer-global) : 12px, 500, uppercase, ls -0.01em, lh 1.2. */
const PRESET_WWTW0Z =
  "text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]";
/** Preset 1hgnchr (framer-global) : 13px, 500, casse normale, ls -0.01em, lh 1.2. */
const PRESET_1HGNCHR =
  "text-[13px] font-medium leading-[1.2] tracking-[-0.01em]";

/**
 * Titre fit-text : une ligne par entrée, masquée en overflow, slide-up.
 *
 * `h1` DE NOUVEAU depuis le 2026-08-31, et seul h1 de la page d'accueil. Il
 * l'était déjà avant le 2026-08-29 ; il était redescendu en `h2` le jour où un
 * titre est apparu dans le hero, et il remonte le jour où ce titre en repart
 * (cf. l'en-tête de `HeroSection`). Cette section est le premier bloc de contenu
 * de la page, son titre est le plus gros caractère du document, et il porte
 * maintenant ce qui est vendu : c'est le titre de premier niveau naturel.
 *
 * IL AJUSTE ENFIN, depuis le 2026-09-01. Il portait le nom du composant Framer
 * « fit text » et posait une taille FIXE — 52 / 68 / 92 px selon le point
 * d'arrêt — sur un découpage UN MOT PAR LIGNE. Rien n'était ajusté à rien.
 * MESURÉ la veille sur `/` : « logiciels. » occupait 327,9 px des 341
 * disponibles au point d'arrêt tablette, le plus étroit des trois. Le titre
 * était donc borné à des mots de neuf caractères, ce qui interdisait
 * mécaniquement tout h1 qui dise le métier, la cible et la zone — et c'est
 * exactement le reproche d'Eliott au titre précédent, « c'est pas assez pour
 * un H1 ».
 *
 * COMMENT, EN CSS SEUL. Le `h1` devient un conteneur de requête
 * (`container-type: inline-size`) et chaque ligne pose
 *
 *     font-size: min(var(--fit-plafond), calc(100cqw / facteur))
 *
 * où `facteur` est le nombre de fois que la ligne tient dans son propre corps,
 * calculé par `facteurDeChasse` sur les chasses réelles de Geist 600 relevées au
 * canvas (cf. `src/lib/ajustement-titre.ts`). La ligne remplit donc son cadre à
 * la largeur près, à toute largeur de fenêtre, sans un octet de JavaScript :
 * pas d'écart entre le HTML du serveur et celui du client, pas de saut au
 * chargement, pas d'écouteur de redimensionnement, rien à désarmer sous
 * `prefers-reduced-motion`. La voie JavaScript aurait été plus exacte de deux
 * pour cent et aurait apporté ces quatre problèmes.
 *
 * `--fit-plafond` GARDE LES TAILLES DU TEMPLATE (52 / 68 / 92) comme PLAFOND :
 * une ligne courte ne devient pas démesurée, elle s'arrête là où le gabarit
 * s'arrêtait.
 *
 * LES MARGES D'ENCRE SUIVENT. `accent-room` (0,32em) et `descender-room`
 * (0,24em) sont posées sur la ligne, qui porte sa taille en propre : elles se
 * résolvent donc sur le corps rendu et non sur celui, plus grand, du `h1`.
 *
 * DÉCOUPAGE EN LIGNES : `about.titleLines` quand la donnée le porte, un mot par
 * ligne sinon (le comportement du template). Le découpage coupe aux unités de
 * sens, ce qu'aucune règle automatique ne sait faire : il appartient donc à la
 * donnée, comme `hero.titleLines` ou `showreel.marqueeLines`.
 */
function TitleFitText({
  title,
  lines,
}: {
  title: string;
  lines?: readonly string[];
}) {
  const { reveal } = useReveal();
  const lignes = lines?.length ? [...lines] : title.split(/\s+/).filter(Boolean);
  /* La ligne la plus large décide du corps de TOUTES les lignes : plus le
     facteur est grand, plus la ligne est longue, donc plus le corps est petit.
     Prendre le maximum garantit qu'aucune ligne ne déborde du cadre. */
  const facteurMax = Math.max(...lignes.map((l) => facteurDeChasse(l))).toFixed(3);
  return (
    // framer-17vvig5-container : titre (code-component), aligné à droite.
    // Les `text-[…]` restent : ils donnent le corps hérité si une ligne ne
    // portait pas le sien, et l'em de référence du reste de la boîte.
    <h1 className="relative m-0 flex w-full flex-col justify-center p-0 text-right text-[52px] font-semibold uppercase leading-[0.95] tracking-[-0.05em] text-accent-ink [--fit-plafond:52px] [container-type:inline-size] tablet:text-[68px] tablet:[--fit-plafond:68px] desktop:text-[92px] desktop:[--fit-plafond:92px]">
      {lignes.map((ligne, i) => (
        <span
          key={ligne + i}
          /* HAUTEUR DU MASQUE : `pt` + `-mt` de même valeur. `accent-room`
             ouvre vers le haut, `descender-room` vers le bas. Les deux restent
             NÉCESSAIRES à `leading-[0.95em]` : la boîte de ligne offre 0,835em
             au-dessus de la ligne de base pour une capitale accentuée qui monte
             à 0,910, et 0,115em en dessous pour une virgule qui descend à 0,158.
             Sans eux, le masque rase l'accent par le haut — le titre affichait
             « STRATEGIE » — et rogne les deux tiers de la virgule par le bas —
             il affichait « SITES. OUTILS. LOGICIELS. » là où la donnée écrit des
             virgules. Le remplissage agrandit la zone visible du masque, la
             marge négative de même valeur annule son effet sur la mise en page :
             aucune hauteur ne bouge, l'encre réapparaît.

             INTERLIGNE 0,95em ET NON 0,82, la valeur du template. Ce sont deux
             défauts distincts : ces classes empêchent le masque de COUPER
             l'encre, l'interligne décide de l'endroit où cette encre ATTERRIT.
             Tant que les lignes étaient raguées, la virgule d'une ligne tombait
             dans le vide laissé par la suivante ; remplies, il n'y a plus de
             vide. MESURÉ au premier rendu ajusté, à 0,82em et 1440 px : la
             virgule de « SITES, » descendait 5,1 px DANS les capitales de
             « LOGICIELS », qui se lisait « LOGICIEĽS ». La valeur tenable se
             calcule (cf. `src/lib/ajustement-titre.ts`) : 0,910 pour l'encre
             d'un « É », plus les 4 % de marge qu'exige l'audit des accents. */
          /* `tracking-[-0.05em]` EST REPOSÉ ICI, alors qu'il est déjà sur le
             `h1`. Ce n'est pas une redite : `letter-spacing` en `em` se résout
             une seule fois, sur le corps de l'élément qui le DÉCLARE, puis
             s'hérite en pixels. Déclaré sur le `h1` à 92 px, il valait -4,6 px
             pour toutes les lignes, y compris celle rendue à 48 px, qui aurait
             dû recevoir -2,4. MESURÉ avant correction : « logiciels sur mesure »
             occupait 523,8 px sur les 570 calculés, soit 40 px de manque, et le
             défaut allait dans le pire sens typographique — plus le texte est
             petit, plus il était resserré. Redéclaré sur la ligne, il se résout
             sur le corps de la ligne. */
          className="accent-room descender-room block w-full overflow-hidden text-right leading-[0.95em] tracking-[-0.05em]"
          /* LA TAILLE EST PORTÉE PAR LA LIGNE, pas par le `h1`. C'est ce qui
             permet à `leading`, `tracking`, `accent-room` et `descender-room`,
             tous en em, de suivre le corps de CETTE ligne. */
          /* UN SEUL CORPS POUR TOUT LE TITRE, celui que dicte la ligne la plus
             large. La première version ajustait CHAQUE ligne à la largeur du
             cadre : les six lignes se retrouvaient à six corps différents, de
             48 à 76 px, et le titre se lisait comme un pavé justifié dont la
             taille change à chaque retour à la ligne. Eliott, le 2026-09-02 :
             « c'est quoi ce pavé de texte illisible, pourquoi il y a des
             changements de taille ». Un titre garde un corps, et ce sont les
             lignes courtes qui laissent du blanc à droite. C'est le
             comportement typographique normal. */
          style={{
            fontSize: `min(var(--fit-plafond), calc(100cqw / ${facteurMax}))`,
          }}
        >
          <motion.span
            /* `whitespace-pre` et non `pre-wrap` : la ligne est déjà découpée par
               la donnée et dimensionnée pour tenir. Autoriser le repli
               fabriquerait une seconde ligne à l'intérieur d'un masque haut
               d'une seule, donc du texte invisible — un défaut muet. */
            className="inline-block whitespace-pre"
            {...reveal({ y: 40, opacity: 0.001 }, spring(199, i * 0.08))}
          >
            {ligne}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

/** Compteur (framer-1g6xokw-container) : 78/52/44px, ls -0.07em, blanc.
 *  Valeur et suffixe viennent de la donnée (`about.counter`) : le « 12+ » du
 *  template était une preuve sociale fabriquée écrite en dur. */
function Counter({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <div className="relative flex items-center gap-0 text-[44px] font-semibold tracking-[-0.07em] leading-[normal] text-accent-ink tablet:text-[52px] desktop:text-[78px]">
      <span>{value}</span>
      {suffix ? <span>{suffix}</span> : null}
    </div>
  );
}

/**
 * Transition du swap de ce lien, RELEVÉE image par image sur le live (course de
 * 14 px, échantillons à 30/60/90 ms après l'entrée du pointeur) :
 *   30 ms → 6 px (43 %) | 60 ms → 12 px (86 %) | 90 ms → 14 px (100 %)
 * soit environ 105 ms. Nous étions à 300 ms : au même instant de 90 ms notre
 * copie n'avait parcouru que 8 px sur 14 (57 %), et la permutation se terminait
 * trois fois trop tard. C'est le même composant Framer que le lien de
 * WhyUsSection, mesuré à la même valeur.
 */
const SWAP_TRANSITION =
  "transition-all duration-[105ms] ease-out motion-reduce:transition-none";

/** Lien de bas de colonne (bouton framer-LXztY) : 2 couches texte (swap au
 *  survol) + flèche. Libellé et cible viennent de la donnée (`about.cta`). */
function AboutUsLink({ label, href }: { label: string; href: string }) {
  return (
    // framer-19qt3v8 : flex row, align center, gap 4, overflow clip, w-min
    <a
      href={href}
      data-framer-name="About us"
      className="group relative flex w-min cursor-pointer flex-row items-center justify-end gap-[4px] overflow-hidden no-underline"
    >
      {/* framer-1headui : couche visible au repos */}
      <span
        className={`relative block whitespace-pre text-accent-ink ${SWAP_TRANSITION} group-hover:translate-y-[14px] ${PRESET_1HGNCHR}`}
      >
        {label}
      </span>
      {/* framer-1et5oru : couche de survol (opacity 0 au repos, au-dessus) */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 top-[-14px] whitespace-pre text-accent-ink opacity-0 ${SWAP_TRANSITION} group-hover:top-0 group-hover:opacity-100 ${PRESET_1HGNCHR}`}
      >
        {label}
      </span>
      {/* framer-1ijauur : flèche 15px, stroke 2, blanc. Le sprite Framer
          #2430009286 EST présent (SvgSprite), mais son tracé porte sa couleur
          via des variables CSS propres au runtime Framer
          (`stroke="var(--18mrqx2, rgb(0,0,0))"`), donc noir hors de ce runtime.
          On redessine donc le même glyphe en héritant de `currentColor`.
          Le tracé est DIAGONAL sur la source (équerre haut-droite + diagonale),
          pas une flèche droite : `M5 12h14M13 6l6 6-6 6` donnait « → » au lieu
          de « ↗ ».
          La flèche S'ESTOMPE au survol : relevé sur le live, son opacité passe
          de 1 à 0,75 à 30 ms, 0,56 à 60 ms puis 0,50 à 90 ms, et y reste tant
          que le pointeur est là. La nôtre restait à 1. Même comportement que la
          flèche du lien de WhyUsSection, qui l'avait déjà. */}
      <svg
        className={`aspect-square h-[15px] w-[15px] flex-none text-accent-ink ${SWAP_TRANSITION} group-hover:opacity-50`}
        role="presentation"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17 17 7M7 7h10v10" />
      </svg>
    </a>
  );
}

/** Image (framer-18dve3e-container) + grain, scale-in au reveal. */
function AboutImage({ src }: { src?: string }) {
  const { reveal } = useReveal();
  const parallaxFrame = useRef<HTMLDivElement>(null);
  // 0.06 : la source pose ce calque en `top:-6%; height:calc(100% + 12%)`.
  const parallaxY = useParallaxLayerY(parallaxFrame, 0.06);
  return (
    // framer-18dve3e-container : aspect-ratio 0.637584, largeur pleine, z-1.
    // Le ref de parallaxe est posé ICI, sur le cadre : à l'intérieur, le wrapper
    // de révélation porte un `scale`, et mesurer la progression du scroll sur un
    // descendant transformé la renvoyait bloquée à 1 (image figée en butée).
    <div
      ref={parallaxFrame}
      className="relative z-[1] aspect-[0.637584] w-full self-start overflow-hidden"
    >
      {/* framer-1ambeg8-container : wrapper animé (scale 1.1 → 1, opacity 0 → 1) */}
      <motion.div
        className="relative h-full w-full"
        {...reveal({ opacity: 0.001, scale: 1.1 }, tween(1.4, 0))}
      >
        {/* Calque sur-cadré de 6 % qui DÉRIVE au scroll. Le sur-cadrage était
            déjà là, le mouvement non : l'image restait figée alors que la source
            la fait glisser de -6 % à +6 % de la hauteur du cadre pendant qu'il
            traverse le viewport. */}
        {/* `grayscale` : la section est un aplat accent et le reste du site est
            monochrome. Une photo de fin de journée en couleur y ferait entrer
            une seconde famille chromatique juste à côté du volt. Même traitement
            que la carte du pied de page et celle du hero contact ; le fichier
            reste en couleur sur le disque. */}
        <div className="absolute inset-0 overflow-hidden grayscale">
          <motion.div
            className="absolute bottom-[-6%] left-0 right-0 top-[-6%] h-[calc(100%+12%)] w-full bg-cover bg-center"
            /* L'ADRESSE VIENT DE LA DONNÉE, `about.image`, et non plus d'une
               chaîne écrite ici. Le champ existait déjà et portait la MÊME
               image du template : le composant en gardait donc une seconde
               copie, que le remplacement du visuel aurait laissée derrière lui
               sans que rien ne le signale. */
            style={{
              backgroundImage: src ? `url(${src})` : undefined,
              ...(parallaxY ? { y: parallaxY } : null),
            }}
          />
        </div>
        {/* framer-30jb7g-container. RELEVÉ sur `/` : hôte 345 × 541 à 1440,
            z-3, opacité 0,09.
            Ce calque avait été retiré un temps : le cadre portait alors un
            portrait DÉTOURÉ sur aplat accent, et sur un aplat le bruit ne se
            lit plus comme une matière mais comme un rectangle sale dont il
            dessine les bords. Le cadre porte désormais une photographie pleine
            cadre, comme la source : le grain y redevient du grain argentique et
            il reprend sa place. C'est l'aplat qui rendait le grain visible, pas
            le grain qui était de trop. */}
        <Grain opacity={0.09} className="z-[3]" />
      </motion.div>
    </div>
  );
}

export function AboutSection({
  about,
}: {
  about: AboutContent | HomeContent["about"];
}) {
  // AboutContent n'a pas l'habillage de la section home (`title`, libellés,
  // millésime, compteur, lien) ; HomeContent["about"] oui. Narrowing sûr.
  const homeAbout = "title" in about ? about : undefined;
  const title = homeAbout?.title;
  const titleLines = homeAbout?.titleLines;
  const body = about.body;
  const bodyHighlights =
    "highlights" in about ? about.highlights : undefined;
  const counter = homeAbout?.counter;
  const cta = homeAbout?.cta;

  return (
    // framer-zwvlfw : section fond orange (--accent #ff4500), flex col centrée
    <section
      data-section="about"
      className="relative flex w-full flex-col items-center justify-start gap-[10px] overflow-hidden bg-accent p-[20px] [font-family:var(--font-sans)] tablet:p-[30px] tablet:px-[24px] desktop:px-[30px]"
    >
      {/* framer-1p37rei : Container (max 1440, aligné à gauche).
          IMMOBILE, et non plus en fondu. Relevé sur `/live-proxy` à 1440 par
          balayage fin (pas de 60 px) : ce conteneur garde `opacity: 100` et un
          transform constant d'un bout à l'autre de la page, alors que les
          blocs qu'il contient (paragraphes, titre, image) ont bien chacun leur
          apparition. Le fondu de section posé ici superposait une seconde
          apparition à celles des enfants. */}
      <div className="relative flex w-full max-w-[1440px] flex-col items-start gap-[20px] overflow-visible tablet:gap-[30px]">
        {/* framer-bv0uaa : Top (colonne en mobile, 2 moitiés côte à côte dès 810) */}
        <div className="relative flex w-full flex-col items-start gap-[20px] overflow-visible tablet:flex-row tablet:justify-center tablet:gap-0">
          {/* framer-lrbq21 : Info Grid (2 colonnes) — order 1 en mobile */}
          <div className="relative order-1 grid w-full auto-rows-[minmax(0,1fr)] grid-cols-[repeat(2,minmax(50px,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] justify-center gap-0 overflow-hidden tablet:order-none tablet:w-px tablet:flex-[1_0_0]">
            {/* framer-1olnusi : libellé de gauche (« Launched » dans la source) */}
            <p className={`relative h-auto w-full self-start whitespace-pre text-accent-ink ${PRESET_WWTW0Z}`}>
              {homeAbout?.launchedLabel}
            </p>
            {/* framer-wclzdh : libellé de droite (aligné à droite en mobile).
                Le « 24+ projects » de la source était une preuve sociale
                fabriquée : la donnée l'a neutralisé. */}
            <p className={`relative h-auto w-full self-start whitespace-pre text-right text-accent-ink tablet:text-left ${PRESET_WWTW0Z}`}>
              {homeAbout?.projectsLabel}
            </p>
          </div>

          {/* framer-6ophvm : Year + title (colonne alignée à droite en mobile, order 0) */}
          <div className="relative order-0 flex w-full flex-col items-end overflow-visible tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:flex-row tablet:items-start tablet:justify-between">
            {/* framer-1mvoez4 : millésime (« 2019-26© » dans la source, pas
                d'ancienneté à afficher : la donnée porte « 2026© ») */}
            <p className={`relative h-auto w-full whitespace-pre-wrap break-words text-left text-accent-ink tablet:w-auto tablet:whitespace-pre ${PRESET_WWTW0Z}`}>
              {homeAbout?.vintage}
            </p>
            {/* framer-1m4gs77 : conteneur du titre (aligné à droite, max 570) */}
            {/* `overflow-clip` avec une marge verticale : le conteneur doit
                contenir le titre EN LARGEUR, mais laisser passer les accents des
                capitales, qui dépassent la boîte de ligne par le haut. */}
            <div className="accent-clip-titre relative flex w-full max-w-[570px] flex-none flex-col items-end justify-end gap-[10px] overflow-clip tablet:w-px tablet:flex-[1_0_0]">
              {title ? (
                <TitleFitText title={title} lines={titleLines} />
              ) : null}
            </div>
          </div>
        </div>

        {/* framer-uc4bjs : Bottom (colonne en mobile, 2 colonnes dès 810) */}
        <div className="relative flex w-full flex-col items-start gap-[26px] overflow-visible tablet:flex-row tablet:gap-0">
          {/* framer-ferzr4 : colonne gauche (paragraphe + lien), order 1 en mobile */}
          <div className="relative order-1 flex w-full flex-col items-start justify-center gap-[20px] overflow-visible tablet:order-none tablet:h-auto tablet:w-px tablet:flex-[1_0_0] tablet:justify-between tablet:gap-0 tablet:self-stretch">
            {/* framer-tvr0oh : bloc paragraphe(s) */}
            <div className="relative flex w-full flex-col items-start gap-[16px] overflow-visible tablet:w-[60%] tablet:gap-[20px] desktop:w-[50%]">
              {body.map((para, i) => (
                // framer-1t7o5wy : paragraphe (preset wwtw0z, blanc 70 %).
                // Il apparaît en FONDU sur la source, sans translation ; il
                // était rendu immobile.
                <Reveal
                  as="p"
                  key={i}
                  initialOpacity={0.001}
                  duration={0.8}
                  delay={0.15 + i * 0.1}
                  className={`relative h-auto w-full max-w-[330px] whitespace-pre-wrap break-words text-accent-ink/70 tablet:max-w-none ${PRESET_WWTW0Z}`}
                >
                  <Highlighted text={para} highlights={bodyHighlights} highlightClassName="text-accent-ink" />
                </Reveal>
              ))}
            </div>

            {/* framer-a6atyc : conteneur du lien de bas de colonne */}
            <div className="relative flex w-full flex-col items-start gap-[10px] overflow-visible">
              {cta ? <AboutUsLink label={cta.label} href={cta.href} /> : null}
            </div>
          </div>

          {/* framer-1b6mrgg : colonne droite (image + compteur), order 0 en mobile */}
          <div className="relative order-0 grid w-full auto-rows-[minmax(0,1fr)] grid-cols-[repeat(2,minmax(50px,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] justify-center gap-0 overflow-hidden tablet:order-none tablet:w-px tablet:flex-[1_0_0]">
            <AboutImage src={homeAbout?.image?.src} />

            {/* framer-1m1hc70 : bloc compteur (aligné en bas à droite) */}
            <div className="relative flex h-full w-full flex-col items-end justify-end gap-0 self-start overflow-visible pl-[20px]">
              {/* framer-1g6xokw-container : compteur (order 0) */}
              {counter ? (
                <div className="relative order-0 h-auto w-auto">
                  <Counter value={counter.value} suffix={counter.suffix} />
                </div>
              ) : null}
              {/* framer-1sypqmm : légende (preset 1hgnchr, aligné à droite,
                  balance). Le « Industries where our sites consistently
                  outperform benchmarks » de la source était invérifiable : la
                  donnée porte désormais une mention tenable. */}
              <p className={`relative order-1 h-auto w-full text-right text-accent-ink [text-wrap:balance] ${PRESET_1HGNCHR}`}>
                {counter?.caption}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* framer-1jrf812 : filet vertical central (blanc 18 %) */}
      <div className="absolute left-[calc(50%-0.5px)] top-0 z-[1] h-full w-px bg-accent-ink opacity-[0.18]" />
    </section>
  );
}
