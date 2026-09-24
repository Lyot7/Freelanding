"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { preload } from "react-dom";
import { estProfilLeger } from "@/lib/profil-appareil";
import { useDepixelisation } from "@/components/motion/useDepixelisation";
import { recadrageCover } from "@/lib/images/recadrage";
import { motion } from "motion/react";
import type { HeroContent, SiteConfig } from "@/lib/content/types";
import {
  appearReveal,
  framerSpring as spring,
  framerTween as tween,
} from "@/components/motion/Reveal";
import { HEIGHT_FROM_ATTRIBUTE } from "@/components/motion/appearAnimations";
import {
  ScrollParallax,
  useScrollParallaxY,
} from "@/components/motion/ScrollParallax";
import { Grain } from "@/components/effects/Grain";
import { BouquerelWordmark } from "@/components/brand/BouquerelWordmark";
import { AvailabilityMeter } from "@/components/ui";
import { Highlighted } from "@/components/ui";
import { Signature } from "./hero/Signature";
import { lienRendezVous } from "@/content/rendez-vous";
import { uiLabels } from "@/content/ui";
import { DemanderAssistant } from "@/components/pages/agent/DemanderAssistant";

/**
 * HeroSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de la
 * section "Hero" de la page d'accueil d'origine, avec les reveals d'apparition Framer
 * reproduits via `motion` (moteur de Framer).
 *
 * Source : markup content/framer-html/hero.ts, CSS framer-home.css + global,
 * valeurs d'animation extraites du JSON `__framer__appearAnimationsContent`.
 *
 * APPARITIONS — toutes celles du hero sont des `appear effects` de la source :
 * on les retrouve une à une dans son bloc
 * `<script type="framer/appear" id="__framer__appearAnimationsContent">`, que son
 * HTML démarre au premier `requestAnimationFrame`, sans condition de visibilité.
 * Elles emploient donc `appearReveal` de `@/components/motion/Reveal` : état
 * masqué rendu dès le HTML serveur, départ dès la PREMIÈRE PEINTURE par le
 * script inline du layout, aucun observateur d'intersection. Voir l'entête de
 * cette primitive pour la mesure qui a imposé ce choix.
 *
 * Le premier argument de chaque appel est l'identifiant de l'entrée DANS LA
 * SOURCE : `1lrracs`, `4lt2tn`, `h0duhu`… Ce sont les clés de son bloc
 * `__framer__appearAnimationsContent`, reprises telles quelles pour que chaque
 * apparition d'ici se vérifie ligne à ligne contre son original.
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base = mobile (≤809.98) · tablet: ≥810 · desktop: ≥1200.
 *
 * Notes de fidélité :
 *   - Le hero affiche le paragraphe de `hero.subtitleParagraphs` (« J'aligne
 *     stratégie… »), en blanc plein dont deux fragments passent à 60 % : c'est
 *     un paragraphe `inverted`, d'où `highlightClassName="text-foreground-60"`.
 *     Le champ `hero.subtitle` reste une copy SEO différente, non affichée ici.
 *     `hero.eyebrow` et `site.brand` viennent des props.
 *   - La carte "fondateur" lit `hero.person` (nom, rôle, avatar). Le template y
 *     affichait une persona fictive écrite en JSX ; elle n'existe pas.
 *   - LE SEUL `<h1>` DE L'ACCUEIL EST ICI depuis le 2026-09-24 (phase E),
 *     sous le mot-symbole : `hero.title`, la phrase qui était le h1 de la
 *     section About un écran plus bas. Le mot-symbole reste un
 *     `<div role="img">`. Du 2026-08-31 à cette date, le cadre n'avait aucun
 *     titre, parce qu'un pavé de 48 px concurrençait le logotype ; la phrase
 *     tient ici le rang que la phrase d'offre avait déjà (26 à 52 px, une
 *     seule masse typographique sous le logotype).
 *   - LARGEUR : 740 px dès 810, puis la fenêtre moins 100 px de chaque côté
 *     dès 1200, plafonnée à 1 400 px. Le mot-symbole garde sa largeur de
 *     tablette (677 px de rangée) : son prénom est calibré dessus, et le
 *     titre prend la largeur gagnée.
 */

/**
 * Chaque élément animé étale `appearReveal(id, from, transition, to?)`. Les
 * props renvoyées sont identiques au rendu serveur et au rendu client : plus
 * aucune `key` à poser, plus aucun remontage.
 */

/** Wordmark « le mot-symbole d'origine » fit-text SVG + ® + studio, avec slide-up masqué (Framer). */
function Wordmark({ brand }: { brand: SiteConfig["brand"] }) {
  return (
    // framer-pjz3qu : Title (colonne en mobile, rangée dès 810)
    <div className="relative flex h-min w-full flex-none flex-col items-start justify-center overflow-visible pr-px tablet:flex-row tablet:items-center desktop:max-w-[678px]">
      {/* framer-qa4q6y : zone du wordmark (overflow-hidden = masque du slide-up) */}
      <div className="relative flex h-min w-full flex-none flex-row items-start justify-start overflow-hidden tablet:w-px tablet:flex-[1_0_0]">
        {/* framer-1lrracs « Matter » : le logotype occupe 100 % de la
            largeur disponible, sa hauteur suit son rapport (1808 / 376 = 4,81).

            CE QUI ÉTAIT LÀ AVANT. Un `foreignObject` contenant un `<p>` composé
            en Geist 140,5 px, dans un `viewBox` de 795,6 x 115 calibré À LA MAIN
            sur la largeur d'encre du mot. Tout changement de nom imposait de
            remesurer cette valeur. Un dessin vectoriel n'a pas ce problème : son
            `viewBox` EST sa largeur d'encre.

            VOLT, et non blanc comme dans le chrome. Le hero est le seul endroit
            où le nom est le sujet, et le seul où le fond — la boucle vidéo,
            calibrée à 13,7/255 de moyenne par `scripts/hero-loop.mjs` — laisse
            l'accent porter sans rien écraser.

            CONTRASTE RELEVÉ sur la capture 1440 (fond échantillonné dans la
            boîte du logotype, encre et textes blancs exclus) : 12,1:1 en
            moyenne, 5,5:1 sur le centile le plus clair du fond. Le pire cas
            réel reste donc au-dessus du seuil AA de 4,5:1. Ce n'est pas acquis
            une fois pour toutes : refaire la mesure si la boucle est
            réencodée.

            Le reveal passe sur un `motion.div` : `BouquerelWordmark` reste un
            composant serveur pur, il ne porte que le dessin. */}
        <motion.div
          className="relative flex w-px flex-[1_0_0] flex-col justify-center"
          aria-label={`${brand.given} ${brand.name}${brand.mark}`}
          role="img"
          {...appearReveal("1lrracs", { y: 110 }, spring(199, 0.2))}
        >
          <BouquerelWordmark className="block h-auto w-full text-accent" />
        </motion.div>
        {/* framer-12uq78y "® mobile" : reveal y110 spring delay .2, mobile seul.

            8 px de marge à gauche, ABSENTS de la source. Le logotype se termine
            par un « l » incliné dont l'encre monte jusqu'au bord haut-droit de
            sa boîte ; collé au ®, le tout se lisait comme un seul signe. Avec
            « BOUQUEREL » tout en capitales, la dernière lettre était un L droit
            et l'intervalle venait tout seul. C'est un ajustement propre à ce
            dessin, pas une correction de fidélité. */}
        <motion.div
          className="relative ml-[8px] h-auto w-auto flex-none whitespace-pre tablet:hidden"
          {...appearReveal("12uq78y", { y: 110 }, spring(199, 0.2))}
        >
          <p className="m-0 text-[28px] font-semibold uppercase leading-[0.8] tracking-[-0.06em] text-foreground">
            {brand.mark}
          </p>
        </motion.div>
      </div>

      {/* framer-1ski5f6 : colonne ® + prénom (à droite du wordmark en desktop) */}
      {/* Retrait à gauche ABSENT de la source : avec « le mot-symbole d'origine », six lettres, le
          mot-symbole ne remplissait pas sa colonne et l'intervalle venait tout
          seul. « BOUQUEREL » occupe toute la largeur disponible, donc le prénom
          venait buter contre le symbole et l'ensemble se lisait comme un seul
          mot. C'est un ajustement PROPRE à ce nom, pas une correction de
          fidélité : il disparaîtrait avec un nom plus court.

          `pb-[17px]` dès 810 : LA CALE DE LIGNE DE BASE. La colonne est
          `self-stretch`, donc son bas coïncide avec le bas de la boîte du
          logotype — c'est-à-dire le BAS DE LA DESCENDANTE du « q », pas sa
          ligne de base. Poser le prénom sur ce bord le fait donc plonger sous
          la ligne du mot-symbole (13,6 px trop bas, mesuré à 1440 et à 810).
          Le retrait vaut « descendante du logotype − ce qui reste sous la ligne
          de base du prénom dans sa propre boîte » :
              (71 / 376) × 113,7 − 0,09 × 51 = 21,46 − 4,59 = 16,87 ≈ 17 px
          (71/376 = part de la descendante dans le viewBox ; 0,09 × fs = ce que
          `leading-[0.9]` laisse sous la ligne de base en Geist, dont l'ascendante
          vaut 1,01 em et la descendante 0,29 em). En mobile la colonne passe
          SOUS le logotype : il n'y a plus de ligne commune, `pb-[5px]` reste. */}
      <div className="relative flex h-min w-min flex-none flex-col items-start justify-center overflow-visible pt-px pb-[5px] tablet:h-auto tablet:justify-between tablet:self-stretch tablet:pl-[18px] tablet:pb-[17px]">
        {/* framer-1fuujfo "®" : masqué mobile, reveal y120 spring delay .25 */}
        <motion.div
          className="relative hidden h-auto w-auto flex-none whitespace-pre tablet:block"
          {...appearReveal("1fuujfo", { y: 120 }, spring(172, 0.25))}
        >
          <p className="m-0 font-medium leading-[1.1] tracking-[-0.01em] text-foreground tablet:text-[26px] desktop:text-[32px]">
            {brand.mark}
          </p>
        </motion.div>
        {/* framer-1i9t4bt "studio" : reveal y120 spring delay .35.
            Le gabarit du prénom, lui, ne vient plus de la source.

            CE QUI ÉTAIT LÀ : `text-[34px] uppercase`, hérité du template où le
            mot-symbole était « le mot-symbole d'origine », capitales géométriques. Deux défauts,
            tous deux MESURÉS sur le rendu réel (ligne de base et hauteur de
            capitale déduites des métriques du `viewBox`, cf.
            `BouquerelWordmark`) :

            1. CASSE. Le logotype est un Capitale + bas-de-casse (« Bouquerel »).
               À côté, « ELIOTT » tout en capitales lisait comme une étiquette
               posée là, pas comme le prénom du nom dessiné à sa gauche : deux
               registres, donc deux éléments. Les deux options ont été rendues et
               comparées à 1440 (essais en capitales calées et en bas-de-casse) :
               le bas-de-casse gagne, parce qu'il reprend le motif de casse du
               tracé et fait relire l'ensemble comme « Eliott Bouquerel ». Les
               capitales restent justes pour la micro-typo du hero (surtitre,
               sous-titre, services, 11-12 px) — c'est un autre registre que
               cette ligne d'affichage.

            2. TAILLE. 34 px FIXES quelle que soit la largeur, alors que le
               logotype, lui, occupe 100 % de la place restante. Résultat : sa
               capitale valait 33 % de celle du logotype à 1440 et 65 % à 390 —
               le rapport s'inversait d'un bout à l'autre de la plage. La règle
               est désormais un RAPPORT, tenu partout : hauteur de capitale du
               prénom = 50 % de celle du logotype (soit `0,71 × fs = 0,5 ×
               0,636 × H`, avec 0,71 em la capitale de Geist et 63,6 % la
               capitale du tracé dans sa boîte). Un rapport de 1 a été essayé :
               le prénom passe alors devant le nom et vient toucher le ®.

            Les deux paliers sortent du même calcul, résolu par point fixe sur le
            rendu (la largeur du prénom entre dans la largeur laissée au
            logotype, qui redonne la taille du prénom) :
              - dès 810, la boîte du hero est FIXE (740 px, soit 677 px de
                rangée) : la solution est un nombre, 50,9 px → `text-[51px]` ;
              - en dessous, la boîte suit la fenêtre et la solution est une
                droite, relevée à cinq largeurs (360 → 23,5 px, 390 → 26,3,
                500 → 36,6, 700 → 55,2, 809 → 65,3), soit `9,31vw − 10px`
                (R² = 1 sur les cinq points). */}
        <motion.div
          className="relative h-auto w-auto flex-none whitespace-pre"
          {...appearReveal("1i9t4bt", { y: 120 }, spring(172, 0.35))}
        >
          <p className="m-0 text-right text-[calc(9.31vw_-_10px)] font-semibold leading-[0.9] tracking-[-0.06em] text-foreground tablet:text-[51px]">
            {brand.given}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/** Carte fondateur (avatar 40px + nom + rôle). Reveal y16 opacity spring delay .7. */
function FounderCard({ person }: { person: HeroContent["person"] }) {
  if (!person) return null;
  return (
    // framer-4lt2tn
    <motion.div
      className="relative flex h-min w-full flex-none flex-row items-center justify-start gap-[10px] overflow-visible tablet:place-self-start"
      {...appearReveal("4lt2tn", { opacity: 0.001, y: 16 }, spring(199, 0.7), {
        opacity: 1,
        y: 0,
      })}
    >
      {/* framer-1uwsdn2 : Avatar 40×40 */}
      <div className="relative h-[40px] w-[40px] flex-none overflow-hidden rounded-[50px]">
        {person.avatar ? (
          <img
            src={person.avatar.src}
            alt={person.avatar.alt}
            width={400}
            height={400}
            decoding="async"
            className="block h-full w-full rounded-[inherit] object-cover object-center"
          />
        ) : null}
      </div>
      {/* framer-38echt : nom + rôle */}
      <div className="relative flex h-min w-px flex-[1_0_0] flex-col items-start gap-[2px] overflow-visible">
        <div className="relative h-auto w-full flex-none whitespace-pre-wrap break-words">
          <p className="m-0 text-[13px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
            {person.name}
          </p>
        </div>
        <div className="relative h-auto w-full flex-none whitespace-pre-wrap break-words">
          <p className="m-0 text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
            {person.role}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/** Catégories DESIGN / DÉVELOPPEMENT / MARKETING (preset 1jnz3v9), reveal cascade. */
function ServicesList({
  words,
  separator,
}: {
  words?: readonly string[];
  separator?: string;
}) {
  /* RÉDUITE AU REGISTRE DES ÉTIQUETTES depuis le 2026-09-24 (12 px, blanc
     60 %, comme le surtitre). En 18 px gras et blanc plein, ces trois mots
     pesaient autant que la phrase d'offre et se lisaient avant elle en bas du
     cadre. Ils gardent leur cascade d'apparition, sur une seule ligne à toutes
     les largeurs : en colonne, ils prenaient 70 px de hauteur au mobile. */
  const itemCls =
    "m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60";
  // Séquence exacte (item + séparateurs), delays 0.9 → 1.1 par pas de 0.05.
  // `appearId` = la clé de l'entrée dans le bloc appear de la source. La liste
  // compte TROIS mots dans la source : les `appearId` sont donc écrits un à un,
  // et seuls les libellés viennent de `hero.serviceWords`.
  const sep = separator ?? "/";
  const parts: Array<{ kind: "item" | "sep"; label: string; appearId: string }> =
    [
      { kind: "item", label: words?.[0] ?? "", appearId: "1mkcgul" },
      { kind: "sep", label: sep, appearId: "19pz0wp" },
      { kind: "item", label: words?.[1] ?? "", appearId: "1952vuc" },
      { kind: "sep", label: sep, appearId: "ykvp4y" },
      { kind: "item", label: words?.[2] ?? "", appearId: "1icx9ei" },
    ];
  return (
    // framer-10zojy0 "Services"
    /* `clip-room` : la barre oblique des séparateurs descend de 1,9 px sous la
       ligne de base à 17 px de corps, et l'interlignage de 0,82 n'en offre
       qu'un. Ce conteneur est aussi le masque d'apparition des trois mots,
       d'où les 2 px et pas davantage : ils suffisent à la queue de la barre et
       ne laissent rien voir de la course de 20 px. */
    <div className="accent-room clip-room relative flex h-min w-min flex-none flex-row items-center gap-[10px] [--clip-room:2px] tablet:gap-[16px]">
      {parts.map((p, i) => {
        const delay = 0.9 + i * 0.05;
        if (p.kind === "sep") {
          return (
            <motion.div
              // `key` STABLE (le rang), et surtout indépendante de tout état :
              // c'est une clé variable qui rejouait toute la ligne une seconde
              // après le chargement et laissait les deux derniers mots figés.
              key={`sep-${i}`}
              aria-hidden
              className="relative block h-auto w-auto flex-none whitespace-pre"
              {...appearReveal(p.appearId, { y: 20 }, spring(172, delay), {
                opacity: 0.2,
                y: 0,
              })}
            >
              <p className={itemCls}>{p.label}</p>
            </motion.div>
          );
        }
        return (
          <motion.div
            key={`item-${p.label}`}
            className="relative h-auto w-auto flex-none whitespace-pre"
            {...appearReveal(p.appearId, { y: 20 }, spring(172, delay), {
              opacity: 1,
              y: 0,
            })}
          >
            <p className={itemCls}>{p.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/** 4 pastilles blanches aux angles du bloc Content (framer-1d8rob1). */
function Decoration() {
  const dot =
    "absolute z-[1] aspect-square h-[9px] w-[8px] flex-none rounded-full bg-foreground tablet:h-[8px]";
  return (
    <div className="absolute inset-0 flex flex-none flex-row items-center justify-center gap-[10px] overflow-visible">
      <div className={`${dot} left-[-4px] top-[-4px]`} />
      <div className={`${dot} bottom-[-4px] left-[-4px]`} />
      <div className={`${dot} right-[-4px] top-[-4px]`} />
      <div className={`${dot} bottom-[-4px] right-[-4px]`} />
    </div>
  );
}

/**
 * Barre bas (framer-irdhqz) : la ligne de preuve à gauche, les logos à droite.
 *
 * ELLE PORTAIT « RÉPONSE SOUS 24 HEURES OUVRÉES », seul dans le coin bas
 * gauche, loin de tout : le délai est monté sous le bouton de rendez-vous, là
 * où le visiteur décide (2026-09-24, phase D). La barre garde sa place et son
 * apparition, et reçoit ce qui manquait au premier écran : un résultat mesuré
 * et les trois logos, visibles sans défiler à 1440 × 900.
 *
 * Même grammaire que la barre d'origine : micro-typo 12 px en capitales, calée
 * sur les bords du héros, contenu réparti aux deux extrémités. Seul le chiffre
 * sort du registre des étiquettes, parce que c'est lui qu'on doit lire.
 */
function ProofBar({
  proof,
  logos,
}: {
  proof?: HeroContent["proof"];
  logos?: ReactNode;
}) {
  if (!proof && !logos) return null;
  const libelle =
    "accent-room min-w-0 max-w-[300px] text-[12px] [text-wrap:balance] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60";
  const contenu = proof ? (
    <>
      <span className="whitespace-pre text-[22px] font-medium leading-none tracking-[-0.02em] text-foreground tablet:text-[26px]">
        {proof.value}
      </span>
      <span className={libelle}>{proof.label}</span>
    </>
  ) : null;
  return (
    <motion.div
      /* `clip-room` : la barre a exactement la hauteur de son contenu, et les
         accents des capitales (« WÜRTH ») y montaient trop haut. 2 px de marge
         de coupe, sans rien déplacer. `flex-wrap` : au mobile, les logos
         passent sous la ligne de preuve. */
      className="clip-room absolute bottom-[20px] left-[20px] right-[20px] z-[2] flex h-min flex-none flex-row flex-wrap items-center justify-between gap-x-[24px] gap-y-[14px] [--clip-room:2px] tablet:bottom-[30px] tablet:left-[30px] tablet:right-[30px]"
      {...appearReveal(
        "irdhqz",
        { opacity: 0.001, y: 50, scale: 1.3 },
        tween(1.4, 0.3),
        { opacity: 1, y: 0, scale: 1 },
      )}
    >
      {proof?.href ? (
        <a
          href={proof.href}
          data-part="preuve"
          className="group flex min-w-0 max-w-full items-center gap-[12px] no-underline [&>span:last-child]:transition-colors [&>span:last-child]:duration-200 hover:[&>span:last-child]:text-foreground motion-reduce:[&>span:last-child]:transition-none"
        >
          {contenu}
        </a>
      ) : proof ? (
        <p data-part="preuve" className="m-0 flex min-w-0 max-w-full items-center gap-[12px]">
          {contenu}
        </p>
      ) : null}
      {logos}
    </motion.div>
  );
}

/** Grain plein cadre (framer-1nah8ke-container). RELEVÉ sur `/` : z-7, opacité 0,1. */
function NoiseTexture() {
  return <Grain opacity={0.1} className="z-[7]" />;
}

/** framer-vsspgz : eyebrow reveal (opacity .8 final). Isolé pour rester lisible. */
function EyebrowReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      // Retour à la ligne permis sous 810 : en `pre`, le surtitre sortait
      // coupé en « …PARTOU » à 320.
      className="relative h-auto w-auto min-w-0 flex-1 whitespace-normal tablet:flex-none tablet:whitespace-pre"
      {...appearReveal("vsspgz", { opacity: 0.001, y: 16 }, spring(199, 0.7), {
        opacity: 0.8,
        y: 0,
      })}
    >
      {children}
    </motion.div>
  );
}

/**
 * APPARITION DU BLOC HERO — source unique.
 *
 * Deux éléments la jouent : la boîte encadrée (`framer-h0duhu`) et le calque de
 * verre dépoli posé derrière elle (`HeroGlass`). Ils ne peuvent pas être
 * imbriqués — voir l'entête de `HeroGlass` — donc ils portent chacun
 * l'animation. Les valeurs vivent ici pour qu'il soit impossible d'en modifier
 * une sans l'autre : deux entrées désynchronisées feraient glisser le verre
 * sous son cadre pendant toute la durée de l'entrée.
 */
const HERO_BOX_REVEAL = {
  from: { opacity: 0.001, scale: 1.5, rotate: 2 },
  transition: tween(1.6, 0),
} as const;

/** Pente `translateY / scrollY` du bloc hero. Mesurée sur le live (R² = 1). */
const HERO_BOX_PARALLAX = 0.07;

/**
 * Hauteur de MISE EN PAGE de la boîte du hero.
 *
 * `offsetHeight` et non `getBoundingClientRect()` : le premier ignore le
 * `transform`, le second le subit. Pendant l'entrée, la boîte est agrandie de
 * 1,5 et inclinée de 2° — un relevé de son rectangle rendu donnerait donc une
 * hauteur fausse, et le verre se recalerait dessus à chaque image.
 *
 * Mesurer plutôt que figer : la hauteur dépend du contenu (longueur du
 * sous-titre, présence de la carte fondateur), donc toute valeur en dur se
 * périmerait au premier changement de texte, sans que rien ne le signale. La
 * LARGEUR, elle, n'a pas besoin d'être mesurée : elle se déduit de la mise en
 * page (plein cadre moins les deux traits de 20 px en mobile, 740 px au-delà).
 */
function useBoxHeight(ref: RefObject<HTMLDivElement | null>): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesure = () => setHeight(el.offsetHeight);
    mesure();
    const observateur = new ResizeObserver(mesure);
    observateur.observe(el);
    return () => observateur.disconnect();
  }, [ref]);
  return height;
}

/** Contenu principal (bloc Content encadré). framer-h0duhu = reveal scale/rotate. */
function HeroContentBox({
  hero,
  site,
  boxRef,
}: {
  hero: HeroContent;
  site: SiteConfig;
  boxRef: RefObject<HTMLDivElement | null>;
}) {
  // framer-h0duhu porte AUSSI une parallaxe, mesurée à `y = 0.070 × scrollY`
  // (linéaire, R² = 1). Appliquée en `style` sur le même élément que l'apparition :
  // framer-motion compose `y` avec le `scale`/`rotate` du reveal dans un seul
  // transform, donc aucun wrapper n'est nécessaire.
  const y = useScrollParallaxY(HERO_BOX_PARALLAX);
  // Le sous-titre AFFICHÉ vient de `hero.subtitleParagraphs` (un seul
  // paragraphe dans la donnée), pas de `hero.subtitle` (copy SEO). La polarité
  // est portée par `inverted` : paragraphe en couleur pleine, fragments à 60 %.
  const subtitleParagraph = hero.subtitleParagraphs?.[0];
  const subtitleText = subtitleParagraph?.text ?? hero.subtitle ?? "";
  const subtitleEmphasis = subtitleParagraph?.emphasis
    ? [...subtitleParagraph.emphasis]
    : [];
  // Non `inverted`, l’emphase passe à la ligne, en blanc plein ;
  // `inverted`, elle s'atténue à 60 % dans le fil du texte.
  const subtitleHighlightClass = subtitleParagraph?.inverted
    ? "text-foreground-60"
    : "block text-foreground";
  return (
    // framer-h0duhu : Container — reveal scale1.5 rotate2 tween 1.6s + parallaxe
    <motion.div
      className="relative z-[2] flex h-full w-px flex-[1_0_0] flex-col items-center justify-center overflow-visible"
      style={y ? { y } : undefined}
      {...appearReveal("h0duhu", HERO_BOX_REVEAL.from, HERO_BOX_REVEAL.transition)}
    >
      {/* framer-12eo3oz : Top Line */}
      <div className="relative h-px w-px flex-[1_0_0] overflow-hidden bg-foreground opacity-[0.18]" />

      {/* framer-wbzujl : rangée [left line | content | right line] */}
      <div className="relative flex h-min w-full flex-none flex-row items-center justify-center overflow-visible">
        {/* framer-1xx6opn : Left Line */}
        <div className="relative h-px w-[20px] flex-none overflow-hidden bg-foreground opacity-[0.18] tablet:w-px tablet:flex-[1_0_0]" />

        {/* framer-ahbwos : Content (bordure + BG blur + décor) */}
        <div
          ref={boxRef}
          data-part="hero-box"
          className="relative flex h-min w-px flex-[1_0_0] flex-col items-center justify-center gap-[10px] overflow-visible border border-[#ffffff2e] p-[20px] tablet:w-[740px] tablet:flex-none tablet:p-[30px] desktop:w-[min(1400px,calc(100vw-200px))] desktop:px-[40px]"
        >
          {/* framer-1cdgr7m : colonne interne (offsetParent de la signature) */}
          <div className="relative z-[2] flex h-min w-full flex-none flex-col items-start justify-start overflow-visible">
            {/* framer-1s2pu2o : Heading (eyebrow + wordmark) */}
            <div className="relative flex h-min w-full flex-none flex-col items-start gap-[6px] overflow-hidden">
              {/* framer-1nxvkw5 : Top text */}
              <div className="relative flex h-min w-full flex-none flex-row items-center justify-start gap-[10px] overflow-hidden tablet:w-min tablet:justify-center">
                {/* framer-vsspgz : eyebrow — reveal y16 → opacity .8 spring delay .7 */}
                <EyebrowReveal>
                  <p className="m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
                    {hero.eyebrow}
                  </p>
                </EyebrowReveal>
              </div>
              <Wordmark brand={site.brand} />
            </div>

            {/* LE TITRE A LE PREMIER RANG DE LECTURE après le mot-symbole.
                Il reprend le corps que la phrase d'offre avait gagné au panel
                design (26 / 32 / 38 px, phases C et D), et grandit avec le
                cadre dès 1200 : sur deux lignes à 1440, là où la phrase
                d'offre en prenait trois dans 740 px. Sous lui, en corps de
                lecture et à 60 %, la ligne qui dit pour qui.

                Les retraits bas (64 px, 96 dès 810) laissent la place du
                paraphe, calé dans l'angle bas droit de la colonne, à côté des
                trois mots : 96 px couvrent sa hauteur (78 px) et sa dérive au
                défilement sans toucher la carte fondateur.

                Le bouton plein reprend celui de l'accordéon (30 px, aplat
                accent) : c'est le seul aplat accent du cadre, le lien vers
                les prestations reste une étiquette à côté de lui. */}
            {/* DÈS 1200, DEUX COLONNES : le titre à gauche, et à droite la
                colonne d'action (carte fondateur, rendez-vous, délai,
                raccourci agent), calée sur le bas du titre. Le cadre gagne
                en largeur ce qu'il perd en hauteur. */}
            <div className="relative z-[2] flex h-min w-full flex-none flex-col items-start gap-[18px] overflow-hidden pt-[16px] pb-[64px] tablet:gap-[26px] tablet:pt-[26px] tablet:pb-[96px] desktop:grid desktop:grid-cols-[minmax(0,1fr)_auto] desktop:items-end desktop:gap-x-[48px]">
              <div className="flex w-full flex-col items-start gap-[10px] tablet:gap-[14px]">
                <h1
                  data-part="hero-titre"
                  className="m-0 w-full text-[26px] font-medium leading-[1.08] tracking-[-0.025em] text-foreground [text-wrap:balance] tablet:text-[32px] desktop:text-[40px] min-[1440px]:text-[48px] min-[1680px]:text-[56px]"
                >
                  {/* Une ligne par entrée de `titleLines` dès 1360 px, où
                      chacune tient dans sa colonne ; en dessous, le texte
                      s'équilibre seul. */}
                  {hero.titleLines?.length
                    ? hero.titleLines.map((ligne, i) => (
                        <span key={ligne} className="min-[1360px]:block">
                          {i > 0 ? " " : null}
                          {ligne}
                        </span>
                      ))
                    : hero.title}
                </h1>
                {subtitleText ? (
                  <p
                    data-part="hero-pour-qui"
                    className="m-0 max-w-[60ch] text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60 tablet:text-[17px]"
                  >
                    <Highlighted
                      text={subtitleText}
                      highlights={subtitleEmphasis}
                      highlightClassName={subtitleHighlightClass}
                    />
                  </p>
                ) : null}
              </div>
              {/* `flex-col-reverse` dès 1200 : la carte fondateur passe
                  au-dessus du bouton, le visage avant l'action. */}
              <div className="relative flex w-full flex-col items-start gap-[16px] tablet:grid tablet:grid-cols-[repeat(2,minmax(50px,1fr))] tablet:items-center tablet:gap-0 desktop:flex desktop:w-auto desktop:flex-col-reverse desktop:items-start desktop:gap-[22px]">
                <div className="flex w-full min-w-0 flex-col items-start gap-[10px]">
                  <div className="flex flex-row flex-wrap items-center gap-x-[20px] gap-y-[12px]">
                    <a
                      href={lienRendezVous("decouverte")}
                      className="group relative flex h-[30px] flex-none flex-row items-center justify-center overflow-hidden bg-accent px-[10px] no-underline"
                    >
                      <span className="accent-room whitespace-pre text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background">
                        {uiLabels.services.rdvLabel}
                      </span>
                    </a>
                    {hero.offerLink ? (
                      <a
                        href={hero.offerLink.href}
                        className="flex h-[30px] flex-none items-center text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 no-underline transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
                      >
                        <span className="accent-room">{hero.offerLink.label}</span>
                      </a>
                    ) : null}
                  </div>
                  {/* LE DÉLAI DE RÉPONSE SOUS LE BOUTON depuis le 2026-09-24
                      (phase D). Il était seul dans le coin bas gauche du héros,
                      loin de l'action qu'il rassure. Ici, il se lit au moment
                      où l'on hésite à réserver. Même composant que la page
                      contact : la jauge y reviendrait avec les créneaux. */}
                  {site.availability ? (
                    <div data-part="hero-delai">
                      <AvailabilityMeter
                        availability={site.availability}
                        variant="hero"
                        timeZone={site.contact.timezone}
                        className="clip-room m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground [--clip-room:2px]"
                      />
                    </div>
                  ) : null}
                  {/* RACCOURCI DE LA VUE AGENT (2026-09-24) : copie en un clic
                      un prompt qui contient tout le profil, à coller dans
                      l'assistant du visiteur. Il vivait dans la barre basse du
                      héros ; la preuve Würth et les logos l'y ont remplacé en
                      phase D, et il remonte ici, sous le délai : c'est l'autre
                      façon de décider, au même endroit que le rendez-vous.
                      Même typo que le délai, seul le curseur vert le
                      distingue. Voir `DemanderAssistant`. */}
                  <DemanderAssistant className="m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]" />
                </div>
                <FounderCard person={hero.person} />
              </div>
            </div>

            <ServicesList
              words={hero.serviceWords}
              separator={hero.serviceWordsSeparator}
            />

            {/* framer-126i1qf : paraphe (absolu dans framer-1cdgr7m).
                ATTÉNUÉ À 40 % sur l'accueil depuis le 2026-09-24 : en volt
                plein, ce tracé était la plus grande surface accent du cadre
                et tirait l'œil loin du bouton, seul autre aplat accent. En
                phase D, il est ramené à 300 px et rentré dans le cadre (voir
                `Signature`). Il garde son apparition et sa dérive.
                L'enveloppe n'est pas positionnée : le paraphe reste calé sur
                la colonne interne, l'opacité ne fait que le fondre. */}
            <div className="pointer-events-none opacity-40">
              <Signature />
            </div>
          </div>

          {/* framer-3kxc86 : le calque de verre dépoli N'EST PLUS ICI.
              Voir `HeroGlass`, monté au niveau de la section. */}
          <Decoration />
        </div>

        {/* framer-micyc6 : Right Line */}
        <div className="relative h-px w-[20px] flex-none overflow-hidden bg-foreground opacity-[0.18] tablet:w-px tablet:flex-[1_0_0]" />
      </div>

      {/* framer-24prt6 : Bottom Line */}
      <div className="relative h-px w-px flex-[1_0_0] overflow-hidden bg-foreground opacity-[0.18]" />
    </motion.div>
  );
}

/**
 * Verre dépoli derrière la boîte du hero.
 *
 * POURQUOI IL N'EST PAS DANS LA BOÎTE, alors que c'est là qu'il se voit.
 *
 * Il y était, et le flou n'apparaissait qu'une fois l'animation d'entrée
 * terminée. La cause n'est pas un défaut de chargement : `backdrop-filter` ne
 * floute que ce qui se trouve derrière l'élément DANS LE MÊME contexte de
 * composition. Or son ancêtre `framer-h0duhu` s'anime en `opacity` 0,001 → 1 et
 * en `scale` 1,5 → 1 pendant 1,6 s, et chacune de ces deux propriétés isole le
 * sous-arbre. Tant que l'animation court, le calque ne VOIT plus la vidéo de
 * fond : il n'a rien à flouter. framer-motion retire ensuite les styles en fin
 * de course, le contexte disparaît, et le flou surgit d'un coup.
 * Mesuré : ancêtre à `opacity 0.001` + `matrix(1.49…)` à 200 ms, encore à
 * `0.709` à 900 ms, plus aucun ancêtre filtrant à 2 500 ms.
 *
 * Le calque est donc monté au niveau de la SECTION, frère de la vidéo et non
 * son descendant. Sorti du sous-arbre animé, il ne pouvait plus non plus en
 * suivre le mouvement : il restait à sa taille de repos pendant que la boîte se
 * dézoomait de 1,5 à 1, et le verre flottait sous un cadre bien plus grand que
 * lui. IL REJOUE DONC LA MÊME ENTRÉE, sur lui-même : `HERO_BOX_REVEAL` est la
 * source unique des deux, et le script d'apparition les démarre au même instant
 * (un seul `performance.now()` pour toute la page), donc à l'image près.
 *
 * Porter le `scale` et le `rotate` ne coûte rien au flou : c'est un ANCÊTRE
 * transformé qui casse un `backdrop-filter`, jamais l'élément qui le porte.
 * L'`opacity`, elle, compose : à 0,001 le verre est invisible, à 0,5 le flou est
 * fondu de moitié, à 1 il est plein. Le verre apparaît donc AVEC son cadre, au
 * lieu de flotter tout seul au premier plan.
 *
 * GÉOMÉTRIE. La largeur se déduit de la mise en page, sans mesure : plein cadre
 * moins les deux traits de 20 px en mobile, 740 px dès 810. La hauteur, elle,
 * dépend du contenu — elle est donc RELEVÉE sur la boîte (voir `useBoxHeight`),
 * la valeur des classes ne servant que de repli avant la première mesure et
 * sans JavaScript. Le centrage passe par `inset` + `margin: auto`, et non par un
 * `translate`, pour laisser le `transform` entier à l'animation.
 */
function HeroGlass({ height }: { height: number | null }) {
  const y = useScrollParallaxY(HERO_BOX_PARALLAX);
  return (
    <motion.div
      aria-hidden
      data-part="hero-glass"
      // Hauteur posée avant peinture par le démarreur d'apparitions (voir
      // `HEIGHT_FROM_ATTRIBUTE`), puis tenue par `useBoxHeight` : le style
      // serveur n'a donc pas encore de `height` quand l'hydratation passe.
      {...{ [HEIGHT_FROM_ATTRIBUTE]: "hero-box" }}
      suppressHydrationWarning
      className="pointer-events-none absolute top-[64px] bottom-[120px] left-[20px] right-[20px] z-[1] m-auto h-[367px] tablet:inset-y-0 bg-[#ffffff08] [backdrop-filter:blur(8px)] tablet:inset-x-0 tablet:h-[394px] tablet:w-[740px] desktop:w-[min(1400px,calc(100vw-200px))]"
      style={{ ...(y ? { y } : null), ...(height ? { height } : null) }}
      {...appearReveal(
        // Identifiant DISTINCT de celui de la boîte, alors que l'animation est
        // la même : le démarreur inline indexe ses animations par identifiant,
        // et deux éléments sous la même clé n'en laisseraient qu'une seule
        // reprise par framer-motion. L'autre resterait figée sur son image
        // finale WAAPI (`fill: both`), qui bat le style en ligne — le verre ne
        // suivrait alors plus la parallaxe au défilement.
        "h0duhu-verre",
        HERO_BOX_REVEAL.from,
        HERO_BOX_REVEAL.transition,
      )}
    />
  );
}

/**
 * Fond du hero : l'AFFICHE d'abord, la vidéo après le chargement de la page.
 *
 * Quand la `<video>` est dans le HTML, c'est elle que le navigateur retient
 * comme élément LCP, et son fichier (234 Kio) passe en concurrence avec tout le
 * reste du premier chargement : LCP de 10,2 s relevé par PageSpeed sur mobile.
 * L'affiche (14 Kio, préchargée en priorité haute) est une vraie image, peinte
 * avec le HTML. La vidéo n'est montée qu'à l'événement `load`, posée au-dessus
 * en fondu dès qu'elle joue : même boîte, donc aucun nouveau candidat LCP, et
 * la première image de la boucle est celle de l'affiche.
 */
/** Exporté pour le test unitaire ciblé (`HeroSection.test.mjs`) : le seul appelant reste `HeroSection`. */
export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const [monter, setMonter] = useState(false);
  const [joue, setJoue] = useState(false);
  // Téléphone en profil complet : affiche dépixelisée puis vidéo. Décidé
  // après l'hydratation, le serveur ne connaît ni l'écran ni l'appareil.
  const [mobile, setMobile] = useState(false);
  const calque = useRef<HTMLCanvasElement>(null);
  const affiche = useRef<Promise<HTMLImageElement | null> | null>(null);
  const [afficheChargee, setAfficheChargee] = useState(false);
  const afficheChargeeRef = useRef(false);
  const chargerAffiche = useCallback(() => {
    affiche.current ??= new Promise<HTMLImageElement | null>((fin) => {
      const img = new window.Image();
      img.onload = () => fin(img);
      img.onerror = () => fin(null);
      img.src = poster ?? "";
    }).then((img) => {
      afficheChargeeRef.current = true;
      setAfficheChargee(true);
      return img;
    });
    return affiche.current;
  }, [poster]);
  const etape = useDepixelisation({
    cible: calque,
    src: poster ?? "",
    actif: mobile && Boolean(poster),
    estChargee: () => afficheChargeeRef.current,
    charger: chargerAffiche,
  });
  useEffect(() => {
    // Profil léger (appareil modeste, réseau lent, économie de données) : ni
    // vidéo ni effet, sur aucun écran. Voir `@/lib/profil-appareil`.
    if (estProfilLeger()) return;
    // SOUS 810 PX, RIEN DANS LE HTML. L'affiche y était l'élément LCP, peinte
    // près de 2 s après le texte par le processeur lent de PageSpeed, et la
    // vidéo dans le HTML menait à un LCP de 10,2 s. Ici tout arrive APRÈS le
    // premier rendu : l'affiche se dépixelise (miniatures de moins de 0,05 bit
    // par pixel, que Chrome ne retient pas comme LCP), puis la vidéo, montée
    // au `load` comme sur grand écran, prend le relais en fondu dès qu'elle
    // joue. Le texte du héros reste l'élément LCP.
    const petitEcran = !window.matchMedia("(min-width: 810px)").matches;
    const lancer = () => {
      if (petitEcran && poster) {
        setMobile(true);
        void chargerAffiche();
      }
      setMonter(true);
    };
    if (document.readyState === "complete") {
      const id = window.setTimeout(lancer, 0);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", lancer, { once: true });
    return () => window.removeEventListener("load", lancer);
  }, [chargerAffiche, poster]);
  // SUR TÉLÉPHONE, LA VIDÉO EST PEINTE DANS UNE TOILE. Une `<video>` visible
  // de 375 × 710 devient l'élément LCP de la page (mesuré : le texte du héros
  // perdait sa place) et le LCP mobile tombait au moment où la boucle, montée
  // après le `load`, finissait de télécharger. Une `<canvas>` n'est pas
  // candidate au LCP : le texte le reste, la vidéo arrive quand elle arrive.
  // La balise vidéo reste dans la page, réduite à 1 px, pour être décodée.
  // Hors de l'écran, la lecture s'arrête : ni décodage ni batterie pour rien.
  const video = useRef<HTMLVideoElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const v = video.current;
    const c = toile.current;
    const ctx = c?.getContext("2d");
    if (!mobile || !monter || !v || !c || !ctx) return;
    let actif = true;
    const peindre = () => {
      if (!actif) return;
      const ratio = Math.min(window.devicePixelRatio, 2);
      const l = Math.round(c.clientWidth * ratio);
      const h = Math.round(c.clientHeight * ratio);
      if (c.width !== l) c.width = l;
      if (c.height !== h) c.height = h;
      const zone = recadrageCover(v.videoWidth, v.videoHeight, l, h);
      if (zone) ctx.drawImage(v, zone.x, zone.y, zone.l, zone.h, 0, 0, l, h);
      if (typeof v.requestVideoFrameCallback === "function") {
        v.requestVideoFrameCallback(peindre);
      } else {
        window.requestAnimationFrame(peindre);
      }
    };
    peindre();
    const visibilite = new IntersectionObserver((entrees) => {
      if (entrees.some((entree) => entree.isIntersecting)) void v.play().catch(() => undefined);
      else v.pause();
    });
    visibilite.observe(c);
    return () => {
      actif = false;
      visibilite.disconnect();
    };
  }, [mobile, monter]);
  const fondMobile = etape ?? (afficheChargee ? poster : null);
  // L'affiche et ses étapes sont PEINTES dans une toile, comme la vidéo : en
  // fond CSS, l'affiche nette devenait l'élément LCP (mesuré à 1,8 s sur un
  // Pixel 7 émulé) à la place du texte du héros. Les étapes sont agrandies
  // sans lissage, ce qui donne les gros pixels nets.
  useEffect(() => {
    const c = calque.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !fondMobile) return;
    let valide = true;
    const img = new window.Image();
    img.onload = () => {
      if (!valide) return;
      const ratio = Math.min(window.devicePixelRatio, 2);
      const l = Math.round(c.clientWidth * ratio);
      const h = Math.round(c.clientHeight * ratio);
      if (c.width !== l) c.width = l;
      if (c.height !== h) c.height = h;
      const zone = recadrageCover(img.naturalWidth, img.naturalHeight, l, h);
      ctx.imageSmoothingEnabled = !etape;
      if (zone) ctx.drawImage(img, zone.x, zone.y, zone.l, zone.h, 0, 0, l, h);
    };
    img.src = fondMobile;
    return () => {
      valide = false;
    };
  }, [fondMobile, etape]);
  return (
    <>
      {mobile ? (
        <canvas ref={calque} aria-hidden className="absolute inset-0 h-full w-full" />
      ) : null}
      {poster ? (
        /* AFFICHE À PARTIR DE 810 PX SEULEMENT. Sur mobile, elle était
           l'élément LCP, peinte avec près de 2 s de retard par le processeur
           lent de PageSpeed alors que le texte du héros était déjà affiché.
           Sous 810 px la source vide fait retomber `<img>` sur un GIF
           transparent de 1 px, que Chrome ne retient pas comme LCP : le texte
           du héros le devient. L'affiche est quasi noire (luminance 13/255),
           le fond sombre, le grain et le verre restent. */
        <picture>
          <source media="(min-width: 810px)" srcSet={poster} />
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      ) : null}
      {mobile && monter && src ? (
        <>
          <video
            ref={video}
            className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
            aria-hidden
            tabIndex={-1}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src={src}
            onPlaying={() => setJoue(true)}
          />
          <canvas
            ref={toile}
            aria-hidden
            className={
              "absolute inset-0 h-full w-full transition-opacity duration-500 " +
              (joue && !etape ? "opacity-100" : "opacity-0")
            }
          />
        </>
      ) : monter && src ? (
        <video
          className={
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 " +
            // Sur téléphone, la vidéo attend la fin de la dépixelisation.
            (joue && !etape ? "opacity-100" : "opacity-0")
          }
          /* Décor pur, sans piste audio : sorti de l'arbre d'accessibilité pour
             qu'un lecteur d'écran n'annonce pas un lecteur vidéo vide au milieu
             du titre, et du parcours clavier où il n'a rien à offrir. */
          aria-hidden
          tabIndex={-1}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={src}
          onPlaying={() => setJoue(true)}
        />
      ) : null}
    </>
  );
}

export function HeroSection({
  hero,
  site,
  logos,
}: {
  hero: HeroContent;
  site: SiteConfig;
  /** Rangée de logos du bas du héros, rendue par l'appelant (composant serveur). */
  logos?: ReactNode;
}) {
  const media = hero.media;
  const hasVideo = media?.kind === "video" && Boolean(media.src);
  // L'affiche est l'élément LCP du mobile : préchargée en priorité haute, elle
  // part avec le HTML au lieu d'attendre que le navigateur découvre la vidéo.
  if (hasVideo && media?.poster) {
    // Préchargée à partir de 810 px seulement, comme l'affiche elle-même
    // (voir `HeroVideo`) : un téléphone ne la télécharge pas.
    preload(media.poster, {
      as: "image",
      fetchPriority: "high",
      media: "(min-width: 810px)",
    });
  }
  // La boîte encadrée commande la hauteur du verre posé derrière elle.
  const boxRef = useRef<HTMLDivElement>(null);
  const boxHeight = useBoxHeight(boxRef);
  return (
    // framer-lotasx : section Hero (100vh desktop/tablet, 710px mobile)
    <section
      data-section="hero"
      /* SOUS 810 PX, 800 PX DE HAUT ET DEUX RETRAITS (2026-09-24, phase E).
         Le titre du héros et la ligne « pour qui » ont ajouté trois lignes au
         cadre, qui chevauchait alors la barre de preuve à 710 px. Les retraits
         réservent l'en-tête (64 px) et la barre de preuve (120 px) : le cadre
         se centre entre les deux, et `HeroGlass` reprend les mêmes valeurs. */
      className="relative flex h-[800px] w-full flex-row items-center justify-center gap-[10px] overflow-hidden pt-[64px] pb-[120px] [font-family:var(--font-sans)] tablet:h-[100vh] tablet:min-h-[700px] tablet:py-0"
    >
      {/* framer-60s0ze « BG » : couche de fond en parallaxe. Le live dérive de
          `translateY = 0.15 × scrollY` sans borne (R² = 1.000000) ; le débord est
          absorbé par l'`overflow-hidden` de la section ci-dessus. */}
      {hasVideo && (
        <ScrollParallax
          factor={0.15}
          decorative
          className="pointer-events-none absolute inset-0 z-0 overflow-clip"
        >
          <HeroVideo src={media?.src ?? ""} poster={media?.poster} />
        </ScrollParallax>
      )}

      <HeroGlass height={boxHeight} />
      <HeroContentBox hero={hero} site={site} boxRef={boxRef} />
      <ProofBar proof={hero.proof} logos={logos} />
      <NoiseTexture />
    </section>
  );
}
