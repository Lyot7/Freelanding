"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { FaqItem } from "@/lib/content/types";
import { homeContent } from "@/content/home";
import { Reveal } from "@/components/motion/Reveal";
import { SwapCopies } from "@/components/ui/SwapCopies";
import { ToggleIcon } from "@/components/ui/ToggleIcon";
import { toggleFaqItem } from "./faq-state";

/**
 * FaqSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de la
 * section "Before we get started." (section08, `framer-leitka`) de la home
 * le gabarit d'origine, avec ACCORDÉON fonctionnel.
 *
 * Sources : markup content/framer-html/section08.ts, styles framer-global.css
 * (classes `.framer-leitka`, `.framer-Nzf4w` = item, presets `wwtw0z`/`11kvajf`/
 * `1r5vzwr`). Valeurs géométriques + couleurs vérifiées au rendu réel (miroir
 * offline de le-site-d-origine) aux largeurs 390 / 810 / 1440.
 *
 * Section CLAIRE (inverse du thème sombre) : fond `#e9e9e9` (--muted), texte
 * `#0b0b0b` (--background). Tokens de couleur exprimés en valeurs exactes quand
 * l'échelle Tailwind ne les expose pas (rgba(11,11,11,·)).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base = mobile "Phone" (≤809.98) · tablet: ≥810 "Tablet" · desktop: ≥1200 "Desktop".
 *
 * Layout Framer (identique aux 3 breakpoints, seules les tailles varient) :
 *   Container (1sm0lew, flex col) = deux rangées PLEINE LARGEUR empilées :
 *     · evxos    → bloc titre : ro3v3f (50% à gauche desktop/tablet ; pleine
 *                  largeur en mobile) avec FAQ + h2 alignés à droite.
 *     · 17aidnj  → bloc accordéon : 1xmkit9 (50% à droite desktop/tablet ; pleine
 *                  largeur en mobile), justifié à droite.
 *   Le titre étant très haut et l'accordéon commençant plus bas, ils s'imbriquent
 *   visuellement (titre à gauche, accordéon à droite) séparés par le filet central.
 *
 * Accordéon (état par défaut = item 01 ouvert, comme la source "Desktop open") :
 *   - Chaque item s'ouvre indépendamment ; re-cliquer ferme uniquement cet item.
 *   - Ouverture/fermeture animées en hauteur via `motion` (robuste, height:auto).
 *   - Icône : `@/components/ui/ToggleIcon`, source unique du plus/moins des
 *     accordéons. La bascule n'est pas un simple échange de barres : le relevé
 *     image par image de la source est documenté dans ce composant.
 *   - Numéro (01…04) : visible en ligne quand FERMÉ ; en OUVERT il passe en absolu
 *     (left:-18px) et se retrouve masqué par l'overflow — fidèle à la source, où
 *     l'item ouvert n'affiche pas son numéro et la question glisse à gauche.
 *
 * Reveals ROBUSTES (repos = état final visible) via `@/components/motion/Reveal`.
 * Les timings d'entrée sont volontairement sobres : le câblage fin des animations
 * d'apparition Framer relève du lot animations (état final rendu d'abord).
 *
 * Réutilisable /contact (même bloc FAQ, données ContactContent.faq).
 */

// Stack de police littérale (identique au reste du port).
const FONT = "[font-family:var(--font-sans)]";

// Couleurs exactes de la section (light) — l'échelle Tailwind n'expose pas
// `--background-60`, on écrit donc les valeurs rgba littérales.
const INK = "#0b0b0b"; // --background
const INK_60 = "rgba(11,11,11,0.6)"; // question + FAQ label
const RULE_12 = "rgba(11,11,11,0.12)"; // filet sous chaque item
const BAR = "rgba(11,11,11,0.6)"; // barres de l'icône

function FaqRow({
  index,
  item,
  open,
  onToggle,
}: {
  index: number;
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const number = String(index + 1).padStart(2, "0");
  const headerId = `faq-h-${index}`;
  const panelId = `faq-p-${index}`;
  return (
    // framer-Nzf4w (item) : flex col, overflow clip, pb 30(open)/20(close)
    <Reveal
      className="w-full"
      initialOpacity={0.001}
      initialY={12}
      transition={{ type: "tween", duration: 0.6, delay: 0.05 + index * 0.08 }}
    >
      {/* pb-[20px] constant : le delta open/close (14px + réponse + 10px) vit
          dans le conteneur animé → total sous la réponse = 10 + 20 = 30px (open),
          sous la question = 20px (close). */}
      <div className="relative flex w-full flex-col items-start overflow-hidden pb-[20px]">
        {/* framer-1i9d3kt : header (row), pt 20px + gap 10px */}
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="relative flex w-full cursor-pointer items-center gap-[10px] overflow-hidden pt-[20px] pb-0 text-left"
        >
          {/* framer-6rdjy8 : numéro + question (overflow clip → masque le n° absolu en open) */}
          <span className="relative flex w-px flex-[1_0_0] items-center gap-[10px] overflow-hidden">
            {/* framer-1uwy4qo : numéro — inline (fermé) / absolu left:-18px (ouvert, masqué) */}
            <span
              aria-hidden
              className={
                "whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] " +
                (open
                  ? "absolute left-[-18px] top-[46%] -translate-y-1/2"
                  : "relative")
              }
              style={{ color: INK }}
            >
              {number}
            </span>
            {/* framer-1nopks0 : question (11px, 60% noir, uppercase) */}
            <span
              className="w-px flex-[1_0_0] whitespace-pre-wrap break-words text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em]"
              style={{ color: INK_60 }}
            >
              {item.question}
            </span>
          </span>
          <ToggleIcon open={open} color={BAR} />
        </button>

        {/* framer-l2hjvx : réponse — hauteur animée (0 ↔ auto). Le delta open/close
            (gap 14px + réponse + 10px) est intégralement dans ce conteneur animé. */}
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: [0.68, 0, 0, 1] }
          }
          className="w-full overflow-hidden"
        >
          {/* NON RÉSOLU (mesuré, pas deviné). Le CSS de la source donne
              `padding: 20px 0 14px` sur l'en-tête et rien sur ce panneau, mais
              l'appliquer tel quel DÉGRADE : mesuré en relatif à la première
              question, on passe d'un écart de 14px sur la seule réponse de
              l'item 2 à un écart uniforme de 24px sur tous les repères. Les
              hauteurs de panneau, elles, sont exactes dans les deux cas
              (86px en 390, 72px en 1440). Il reste 24px non localisés dans le
              PREMIER item. On garde donc l'état le moins faux en attendant. */}
          <div className="relative flex w-full items-start pt-[14px] pb-[10px]">
            {/* framer-1gacui7 : texte de réponse (18px mobile/tablet, 20px desktop) */}
            <p
              className="w-px max-w-[600px] flex-[1_0_0] whitespace-pre-wrap break-words text-[18px] font-medium leading-[1.2] tracking-[-0.01em] desktop:text-[20px]"
              style={{ color: INK }}
            >
              {item.answer}
            </p>
          </div>
        </motion.div>

        {/* framer-zrzv8j : filet bas (12% noir) */}
        <span
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ backgroundColor: RULE_12 }}
        />
      </div>
    </Reveal>
  );
}

/**
 * Habillage de la section (surtitre, titre en deux lignes, bouton). Il était
 * recopié EN DUR et EN ANGLAIS dans le JSX, alors que `homeContent.faqSection`
 * le porte déjà traduit : le défaut vient donc de la donnée. Les six pages qui
 * montent cette section (accueil, contact, blog, projets, mentions légales,
 * 404) partagent le même habillage sur la source, seul le tableau `faq` change.
 *
 * L'import est DIRECT (`@/content/home`) et non passé en prop : ce composant est
 * client, et aucun de ses six appelants n'est dans le périmètre de ce lot. Les
 * props restent ouvertes pour qu'un appelant puisse les fournir plus tard.
 */
export function FaqSection({
  faq,
  eyebrow = homeContent.faqSection?.eyebrow ?? "",
  titleLines = homeContent.faqSection?.titleLines ?? [],
  cta = homeContent.faqSection?.cta,
}: {
  faq: FaqItem[];
  eyebrow?: string;
  /** Deux lignes exactement sur la source : leur concaténation fait le titre. */
  titleLines?: readonly string[];
  cta?: { label: string; href: string };
}) {
  // Item 01 ouvert par défaut (source : premier item = "Desktop open").
  const [openItems, setOpenItems] = useState<Set<number>>(() => new Set([0]));

  return (
    // framer-leitka : section (fond clair #e9e9e9, flex col centrée)
    <section
      data-section="faq"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-[10px] overflow-visible bg-muted " +
        "p-[20px] " +
        "tablet:px-[24px] tablet:pt-[30px] tablet:pb-[80px] " +
        "desktop:px-[30px]"
      }
    >
      {/* framer-9ek4ve : Accent — prolonge le fond clair au-dessus (moitié droite) */}
      <div className="absolute right-0 top-[-20px] z-[2] h-[22px] w-1/2 overflow-hidden bg-muted tablet:top-[-30px] tablet:h-[32px]" />

      {/* framer-1sm0lew : Container (max 1440, aligné à gauche) */}
      <div className="relative flex w-full max-w-[1440px] flex-col items-start gap-[10px] tablet:gap-[30px]">
        {/* framer-evxos : rangée titre (pleine largeur) */}
        <div className="relative flex w-full flex-row items-start overflow-visible">
          {/* framer-ro3v3f : colonne titre — 50% à droite desktop/tablet, pleine largeur mobile */}
          <div className="relative flex w-px flex-[1_0_0] flex-col items-end justify-end gap-[12px] overflow-visible tablet:w-1/2 tablet:flex-none tablet:gap-[40px]">
            {/* framer-1xefvys : eyebrow FAQ */}
            <div className="relative flex w-full flex-col items-start overflow-visible tablet:items-end">
              {/* framer-zvi6rv : eyebrow FAQ (12px, 60% noir, uppercase) */}
              <p
                className="h-auto w-auto whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]"
                style={{ color: INK_60 }}
              >
                {eyebrow}
              </p>
            </div>
            {/* framer-1co65xp : titre h2, frère de l'eyebrow dans la source */}
            <div className="relative h-auto w-full">
              <h2
                /* TAILLE PLAFONNÉE PAR LA LARGEUR DE LA COLONNE.
                   Le titre français déborde là où l'anglais tenait : « COMMENCER. »
                   mesure 330 px à 52 px de corps, pour une colonne de 280 à
                   320 px de large. Le `overflow-hidden` du masque d'apparition
                   le coupait donc, sans erreur ni alerte.
                   Le débordement n'apparaît qu'APRÈS chaque bascule, quand le
                   corps saute avant que la colonne ait grandi. Relevé sur 19
                   largeurs : colonne = 100vw - 40 sous 810, 50vw - 25 entre 810
                   et 1199, 50vw - 30 au-delà ; et le texte mesure toujours
                   6,35 x le corps. Le corps tenable vaut donc colonne / 6,35,
                   arrondi à 6,5 pour la marge.
                   `min()` garde EXACTEMENT la taille d'origine partout où elle
                   tient, et ne réduit que dans les bandes où le texte serait
                   tronqué : 320-369, 810-913 et 1200-1227. */
                className="relative m-0 flex w-full flex-col justify-center p-0 text-right text-[min(52px,calc(15.38vw-6.15px))] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[min(68px,calc(7.69vw-3.85px))] desktop:text-[min(92px,calc(7.69vw-4.6px))]"
                style={{ color: INK }}
              >
                <Reveal
                  as="span"
                  className="block overflow-hidden text-right"
                  initialOpacity={0.001}
                  initialY={40}
                  transition={{ type: "tween", duration: 0.7, delay: 0.05 }}
                >
                  {titleLines[0]}
                </Reveal>
                <Reveal
                  as="span"
                  className="block overflow-hidden text-right"
                  initialOpacity={0.001}
                  initialY={40}
                  transition={{ type: "tween", duration: 0.7, delay: 0.12 }}
                >
                  {titleLines[1]}
                </Reveal>
              </h2>
            </div>
          </div>
        </div>

        {/* framer-17aidnj : rangée accordéon (pleine largeur, contenu justifié à droite) */}
        <div className="relative flex w-full flex-row items-center justify-end overflow-hidden">
          {/* framer-1xmkit9 : colonne accordéon + bouton — 50% à droite desktop/tablet */}
          <div className="relative flex w-px flex-[1_0_0] flex-col items-start gap-[20px] overflow-hidden tablet:w-1/2 tablet:flex-none tablet:gap-[40px]">
            {/* framer-1rofdpl-container > framer-32t3hq : liste accordéon */}
            <div className="relative w-full">
              <div className="relative flex w-full flex-col items-start overflow-hidden">
                {faq.map((item, i) => (
                  <FaqRow
                    key={item.question}
                    index={i}
                    item={item}
                    open={openItems.has(i)}
                    onToggle={() =>
                      setOpenItems((current) => toggleFaqItem(current, i))
                    }
                  />
                ))}
              </div>
            </div>

            {/* framer-1gewbmn-container : bouton « Poser une question » (pleine largeur mobile).
                IMMOBILE : relevé sur `/live-proxy` à 1440 par balayage fin
                (pas de 60 px, bande 8600-8800), ce conteneur reste à
                `opacity: 100` sans transform d'un bout à l'autre du défilement,
                là où les quatre questions au-dessus ont bien leur fondu. Le
                reveal posé ici (fondu + 12 px, 600 ms, 400 ms de retard) n'avait
                pas d'équivalent sur la source. */}
            <div className="relative h-[50px] w-full tablet:h-[30px] tablet:w-auto">
              {/* framer-1sk0ilg : lien (bg noir, texte blanc 12px) */}
              <a
                // Chemin ABSOLU : en relatif (`./contact`), ce lien résolvait en
                // `/legal/contact` depuis une page légale, soit un 404. Le live
                // s'en sort avec des relatifs adaptés à la profondeur ; un chemin
                // absolu est correct partout et insensible à l'endroit où la
                // section est montée.
                href={cta?.href ?? "/contact"}
                className="surface-dark group relative flex h-full w-full cursor-pointer items-center justify-center gap-[10px] overflow-hidden p-[10px] no-underline tablet:h-[30px] tablet:w-min"
                style={{ backgroundColor: INK }}
              >
                {/* framer-12ut4h8 : conteneur (les deux calques de texte = swap au hover).
                    Le swap était ABSENT : les deux calques existaient, mais le
                    second restait à `opacity: 0` sans aucune règle de survol, si
                    bien que le bouton ne bougeait pas d'un pixel. RELEVÉ sur le
                    live (échantillons après l'entrée du pointeur) : la copie
                    visible monte de 22 px (408 → 386) en s'effaçant de 1 à 0, et
                    la copie en attente, posée 22 px PLUS BAS (430), remonte à sa
                    place en apparaissant de 0 à 1 — 0 % à 30 ms, 14 % à 60 ms,
                    77 % à 90 ms, 95 % à 120 ms, terminé vers 220 ms. C'est le
                    même composant Framer `.framer-1sk0ilg` que le CTA du header,
                    donc la même primitive et la même course de 22 px. */}
                <span className="relative block h-[14.4px] overflow-hidden">
                  <SwapCopies
                    travel={22}
                    textClassName="whitespace-pre text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground"
                  >
                    {cta?.label}
                  </SwapCopies>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* framer-1n2wdq0 : filet vertical central (8% noir) — desktop/tablet uniquement */}
      <div
        className="absolute left-[calc(50%-0.5px)] top-0 z-[1] hidden h-full w-px opacity-[0.08] tablet:block"
        style={{ backgroundColor: INK }}
      />
    </section>
  );
}
