"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { motion } from "motion/react";
import type { HeroContent, SiteConfig } from "@/lib/content/types";
import {
  appearReveal,
  framerSpring as spring,
  framerTween as tween,
} from "@/components/motion/Reveal";
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
import { SwapText } from "@/components/ui/SwapText";

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
 *   - AUCUN `<h1>` ICI, comme dans la source : le hero du template n'avait pas
 *     de titre de niveau 1 (logotype en `<div role="img">`, tout le reste en
 *     `<p>`). Un `HeroHeadline` en a porté un du 2026-08-29 au 2026-08-31 ;
 *     il faisait un second pavé typographique sous le logotype. Le h1 de la
 *     page d'accueil est celui d'`AboutSection`, un écran plus bas.
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
    <div className="relative flex h-min w-full flex-none flex-col items-start justify-center overflow-visible pr-px tablet:flex-row tablet:items-center">
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
          <p className="m-0 text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
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
  const itemCls =
    "m-0 text-[16px] font-semibold uppercase leading-[0.82] tracking-[-0.02em] text-foreground tablet:text-[17px] desktop:text-[18px]";
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
    <div className="accent-room clip-room relative flex h-min w-min flex-none flex-col items-start gap-[10px] [--clip-room:2px] tablet:flex-row tablet:items-center tablet:gap-[16px]">
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
              className="relative hidden h-auto w-auto flex-none whitespace-pre tablet:block"
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

/** Barre bas : disponibilité (meter) + horloge locale live (framer-irdhqz). */
function BottomBar({ site }: { site: SiteConfig }) {
  const localTimeLabel = (site.contact.localTimeLabel ?? "Heure locale").toUpperCase();
  const presetWwtw0z =
    "m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]";
  return (
    <motion.div
      /* `clip-room` : la barre a exactement la hauteur de son contenu, et
         l'accent de « RÉPONSE SOUS 24 HEURES OUVRÉES » y montait 0,7 px trop
         haut. 2 px de marge de coupe, sans rien déplacer. */
      className="clip-room absolute bottom-[20px] left-[20px] right-[20px] z-[2] flex h-min flex-none flex-row items-center justify-between [--clip-room:2px] tablet:bottom-[30px] tablet:left-[30px] tablet:right-[30px]"
      {...appearReveal(
        "irdhqz",
        { opacity: 0.001, y: 50, scale: 1.3 },
        tween(1.4, 0.3),
        { opacity: 1, y: 0, scale: 1 },
      )}
    >
      {/* framer-y1czug : disponibilité */}
      <div className="relative h-auto w-auto flex-none">
        <div className="relative flex h-min w-min flex-none flex-row items-center gap-[12px] overflow-visible">
          {/* framer-1p44ppv + framer-3idgbx : libellé, jauge et compteur.
              Les six barres étaient écrites en dur ici, alors que la page
              contact en rendait cinq depuis la donnée : la même jauge affichait
              donc deux états différents sur le même site. Source unique
              désormais, `@/components/ui/AvailabilityMeter`. */}
          {site.availability ? (
            <AvailabilityMeter
              availability={site.availability}
              variant="hero"
              // Même fuseau que l'horloge locale rendue quelques lignes plus
              // bas : le mois affiché est celui d'Eliott, pas celui du visiteur.
              timeZone={site.contact.timezone}
              className={`${presetWwtw0z} gap-[12px] text-foreground`}
            />
          ) : null}
        </div>
      </div>

      {/*
        L'HORLOGE LOCALE A ÉTÉ REMPLACÉE PAR LE SEUL APPEL À L'ACTION DU CADRE,
        le 2026-09-02, et les deux moitiés de ce changement comptent.

        CE QUI PARTAIT : « HEURE LOCALE : 19:19 », un artefact de gabarit
        d'agence internationale. Il informe quand le studio est à Berlin et le
        client à New York. Ici l'un et l'autre sont en France : la ligne
        occupait un coin du premier écran pour dire au visiteur l'heure qu'il
        a déjà sous les yeux.

        CE QUI ARRIVE : le hero n'avait AUCUN bouton dans son cadre. Le seul
        chemin vers une action était la barre de navigation, hors du bloc qui
        capte le regard. C'est le point de conversion le moins cher de la page.

        LE TYPE VISÉ EST « decouverte », jamais un des trois autres : quelqu'un
        qui n'a pas encore lu une ligne de l'offre ne sait pas s'il vient pour
        un site, un outil ou un logiciel. Le préselectionner sur un type précis
        lui ferait choisir avant de savoir, ce que les intitulés de
        `rendez-vous.ts` évitent déjà par ailleurs.
      */}
      <a
        href={lienRendezVous("decouverte")}
        // Focus : voir `src/app/focus.css` (source de vérité unique).
        className={`${presetWwtw0z} group relative flex h-min w-max flex-none items-center gap-[8px] text-foreground no-underline`}
      >
        <span className="h-[6px] w-[6px] flex-none rounded-full bg-accent" />
        <SwapText travel={12}>{uiLabels.services.rdvLabel}</SwapText>
      </a>
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
      className="relative h-auto w-auto flex-none whitespace-pre"
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
  const subtitleHighlightClass = subtitleParagraph?.inverted
    ? "text-foreground-60"
    : "text-foreground";
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
          className="relative flex h-min w-px flex-[1_0_0] flex-col items-center justify-center gap-[10px] overflow-visible border border-[#ffffff2e] p-[20px] tablet:w-[740px] tablet:flex-none tablet:p-[30px]"
        >
          {/* framer-1cdgr7m : colonne interne (offsetParent de la signature) */}
          <div className="relative z-[2] flex h-min w-full flex-none flex-col items-start justify-start overflow-visible">
            {/* framer-1s2pu2o : Heading (eyebrow + wordmark) */}
            <div className="relative flex h-min w-full flex-none flex-col items-start gap-[6px] overflow-hidden">
              {/* framer-1nxvkw5 : Top text */}
              <div className="relative flex h-min w-min flex-none flex-row items-center justify-center gap-[10px] overflow-hidden">
                {/* framer-vsspgz : eyebrow — reveal y16 → opacity .8 spring delay .7 */}
                <EyebrowReveal>
                  <p className="m-0 text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
                    {hero.eyebrow}
                  </p>
                </EyebrowReveal>
              </div>
              <Wordmark brand={site.brand} />
            </div>

            {/* framer-1luv26g : sous-titre | fondateur (flex mobile → grid 2col dès 810) */}
            {/* LE H1 QUI OCCUPAIT CETTE PLACE EST PARTI SUR `AboutSection` le
                2026-08-31, et le rythme vertical de la source revient avec son
                départ (14 px en mobile, 30 px dès 810). Ce sont les valeurs
                d'avant le 2026-08-29 ; les 10/22 px qui les avaient remplacées
                n'existaient que pour desserrer ce titre du logotype. */}
            <div className="relative z-[2] flex h-min w-full flex-none flex-col items-start gap-[16px] overflow-hidden pt-[14px] pb-[40px] tablet:grid tablet:auto-rows-[minmax(0,1fr)] tablet:grid-cols-[repeat(2,minmax(50px,1fr))] tablet:grid-rows-[repeat(1,minmax(0,1fr))] tablet:justify-center tablet:gap-0 tablet:pt-[30px] tablet:pb-[130px]">
              {/* framer-1qzjqre : sous-titre (emphase blanc 60%) */}
              <div className="relative h-auto w-full max-w-[400px] flex-none self-auto whitespace-pre-wrap break-words tablet:max-w-[91%] tablet:place-self-start">
                <p className="m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
                  <Highlighted
                    text={subtitleText}
                    highlights={subtitleEmphasis}
                    highlightClassName={subtitleHighlightClass}
                  />
                </p>
              </div>
              <FounderCard person={hero.person} />
            </div>

            <ServicesList
              words={hero.serviceWords}
              separator={hero.serviceWordsSeparator}
            />

            {/* framer-126i1qf : signature orange (absolue dans framer-1cdgr7m) */}
            <Signature />
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
      className="pointer-events-none absolute inset-y-0 left-[20px] right-[20px] z-[1] m-auto h-[367px] bg-[#ffffff08] [backdrop-filter:blur(8px)] tablet:inset-x-0 tablet:h-[394px] tablet:w-[740px]"
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

export function HeroSection({ hero, site }: { hero: HeroContent; site: SiteConfig }) {
  const media = hero.media;
  const hasVideo = media?.kind === "video" && Boolean(media.src);
  // La boîte encadrée commande la hauteur du verre posé derrière elle.
  const boxRef = useRef<HTMLDivElement>(null);
  const boxHeight = useBoxHeight(boxRef);
  return (
    // framer-lotasx : section Hero (100vh desktop/tablet, 710px mobile)
    <section
      data-section="hero"
      className="relative flex h-[710px] w-full flex-row items-center justify-center gap-[10px] overflow-hidden [font-family:var(--font-sans)] tablet:h-[100vh] tablet:min-h-[700px]"
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
          {/* Vidéo de fond native — joue sur TOUTES les tailles (mobile inclus) */}
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={media?.poster}
            src={media?.src}
          />
        </ScrollParallax>
      )}

      <HeroGlass height={boxHeight} />
      <HeroContentBox hero={hero} site={site} boxRef={boxRef} />
      <BottomBar site={site} />
      <NoiseTexture />
    </section>
  );
}
