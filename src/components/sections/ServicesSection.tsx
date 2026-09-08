"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";
import {
  EASE_FRAMER,
  REVEAL_VIEWPORT_MARGIN,
  Reveal,
  useRevealWillChange,
} from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { useParallaxLayerY } from "@/components/motion/ParallaxImage";
import { Grain } from "@/components/effects/Grain";
import { ToggleIcon } from "@/components/ui/ToggleIcon";
import type { HorsCatalogue, ServiceItem } from "@/lib/content/types";
import { uiLabels } from "@/content/ui";

/**
 * ServicesSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de
 * la section « Services » de la page d'accueil d'origine (section06, data-framer-name
 * "Services"), avec ACCORDÉON fonctionnel.
 *
 * Source : markup content/framer-html/section06.ts (3 variants SSR Framer :
 * Desktop / Tablet / Phone), CSS framer-global.css (composants scopés
 * .framer-Iaj5T / .framer-3K54C / .framer-L1ODD / .framer-craoB), presets
 * wwtw0z / 18rrjz2 / 2okhk1 / htsnb8. Données : content/services.ts (props).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base = Phone  (≤809.98, variant v-12gwtgp / accordéon "Phone")
 *   tablet: ≥810  (810-1199.98, variant v-1q0ldbk / accordéon "Desktop")
 *   desktop: ≥1200 (variant v-ftxqyr / accordéon "Desktop")
 *   → Tablet et Desktop partagent la MÊME structure d'accordéon (flex-row,
 *     grille texte 2 colonnes) ; seuls le padding conteneur et la typo de
 *     l'intro changent. Phone : grille item 2 colonnes + colonnes texte
 *     empilées (flex-column).
 *
 * ACCORDÉON — état par défaut du source : SEULE la ligne 01 est ouverte
 * ("Desktop open" / "Phone open", opacity:1 + icône Minus) ; 02→05 fermées
 * ("Desktop closed", opacity:0 + icône Plus). Clic sur le header (numéro+titre)
 * OU la ligne prix/toggle ouvre/ferme la ligne. La hauteur du panneau
 * (framer-mnuxty : texte + image) est animée via framer-motion (height auto↔0).
 * Robuste : le panneau reste dans le DOM (accessible), aria-expanded/controls.
 *
 * Notes de fidélité (zéro invention, contenu réel écrit en JSX quand la donnée
 * manque — cf. RECONSTRUCTION-GUIDE) :
 *   - Label "Services", intro ("Every project starts with…", code-component
 *     monté par JS, font 32/26/22px) et le libellé "Price: from" sont du
 *     chrome du site absent des props → écrits en dur ici (texte réel).
 *   - Les images des lignes (framer-hhouxn) ne sont pas dans services.ts →
 *     mappées par numéro depuis l'archive Framer (fallback si service.image).
 *   - Le prix prop ("from $2,900") est rendu "Price: from" (gris) + montant
 *     ("$2,900", blanc), le montant étant dérivé du prop (retrait du "from ").
 *   - Icône toggle : barre horizontale (v2a2ti) toujours blanche 60% ; barre
 *     verticale (1u6l8q) blanche 60% fermé (=> "+") / transparente ouvert
 *     (=> "−"), conteneur pivoté 90° ouvert (transform Framer exact).
 */

// Stack de police littérale Framer (résolue à l'identique via next/font).
const FONT = "[font-family:var(--font-sans)]";

// Repli du chapô (code-component "84d4c1" monté par JS, vide en SSR). Le texte
// affiché vient de la donnée via la prop `intro` ; cette constante ne sert que
// si elle manque.
const INTRO =
  "Chaque projet commence par comprendre comment tes clients prennent leur décision, et ce qui les empêche de la prendre maintenant.";

/*
 * LA TABLE DE REPLI EST SUPPRIMÉE. Elle associait un numéro de prestation à une
 * image, en doublon de `services.ts` qui porte déjà le champ `image` sur chaque
 * entrée — et sur les mêmes adresses. Un repli qui recopie la donnée qu'il
 * remplace ne protège de rien : il garantit seulement qu'un visuel remplacé
 * dans la donnée reste présent quelque part dans le code. Une prestation sans
 * image rend désormais son cadre vide, ce qui se voit, plutôt qu'une image du
 * template, qui ne se voyait pas.
 */

/**
 * Apparition de l'image d'une ligne, RELEVÉE sur la source (`/live-proxy` et
 * `/live-proxy/about`, 1440x900, section « Services »).
 *
 * La source enveloppe chaque image de DEUX conteneurs imbriqués portant le même
 * effet, `.framer-xqajfn-container` puis `.framer-1ambeg8-container`, tous deux
 * à `opacity: 0` et `scale(1.1)` au repos. Les échelles se composent : le calque
 * de fond est mesuré à 834 px de large au départ pour 690 à l'arrivée, soit
 * 1,209 — et non 1,1. Les opacités se composent aussi, ce qui donne une entrée
 * nettement plus tardive qu'un simple fondu : l'opacité EFFECTIVE relevée vaut
 * 0,125 quand un fondu unique en serait déjà à 0,354. Reproduire un seul calque
 * à 1,21 donnerait la bonne échelle mais un fondu deux fois trop précoce ; on
 * imbrique donc les deux calques comme la source.
 *
 * DURÉE — relevé image par image après déclenchement (défilement arrêté, saut de
 * 3 px sous le seuil puis franchissement) : largeur 834 à t=50 ms, 781 à 400,
 * 748 à 449, 727 à 500, 704 à 650, 695 à 800, 690 à 1050 ; opacité effective
 * 0,125 à 400, 0,337 à 449, 0,541 à 500, 0,807 à 650, 0,923 à 800, 1 à 1200. La
 * progression d'UN calque est la racine de l'opacité effective (0,354 · 0,581 ·
 * 0,735 · 0,898 · 0,961), et l'échelle relevée redonne exactement les mêmes
 * valeurs — les deux calques avancent donc ensemble. L'ajustement de ces
 * progressions sur la courbe Framer `cubic-bezier(0.68, 0, 0, 1)` donne
 * 1,09 s de durée et un délai nul (résidu inférieur à 40 ms sur 1,1 s).
 */
const COVER_APPEAR: Variants = {
  hidden: { opacity: 0.001, scale: 1.1 },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { type: "tween", duration: 1.09, ease: EASE_FRAMER },
  },
};

/**
 * Découpe un prix en préfixe et montant, pour le rendu bicolore de la source :
 * le préfixe rejoint le libellé gris de 14 px, le montant reste en blanc de
 * 16 px.
 *
 * « SUR DEVIS » N'A PAS DE PRÉFIXE, et c'est pour ça que la découpe se fait ici
 * plutôt que dans le libellé. Celui-ci portait « Prix : à partir de » en dur, ce
 * qui rendait « Prix : à partir de sur devis » sur la prestation « Au-delà ».
 * C'était servi en production.
 */
function priceParts(price: string | undefined, label: string): {
  label: string;
  amount: string;
} {
  if (!price) return { label, amount: "" };
  // « from » est la donnée du template, « dès » celle du site traduit. « à
  // partir de » a disparu de l'offre le 2026-08-27 mais reste accepté ici :
  // une donnée qui repasse par cette forme doit s'afficher, pas se doubler.
  const parts = price.match(/^\s*(from|à partir de|dès)\s+(.+)$/i);
  if (!parts) return { label, amount: price };
  return { label: `${label} ${parts[1].toLowerCase()}`, amount: parts[2] };
}

/*
 * L'icône Plus/Minus vit désormais dans `@/components/ui/ToggleIcon`, partagée
 * avec la FAQ et la primitive `Accordion`.
 *
 * La copie locale qui se trouvait ici était FAUSSE à l'état ouvert : elle rendait
 * une barre VERTICALE (2x12) là où la source rend un tiret HORIZONTAL (12x2),
 * mesuré des deux côtés à 1440 sur `/` (y6308) et `/about` (y2660). Elle ne
 * pivotait que le calque interne, ce qui couchait la barre horizontale. La
 * source pivote AUSSI la barre elle-même de 90 degrés : composée à son parent,
 * elle fait donc un demi-tour complet et retombe exactement à l'horizontale.
 *
 * La couleur n'est pas repassée ici : la valeur par défaut du composant partagé
 * est justement celle de cette section (`--foreground-60`), c'est écrit dans sa
 * documentation. La redéclarer créerait deux endroits à tenir à jour.
 */

/**
 * Entrée d'une ligne de prestation, RELEVÉE image par image sur la source
 * (`/live-proxy` et `/live-proxy/about`, protocole du seuil : défilement arrêté,
 * stationnement 3 px sous le seuil, puis franchissement instantané).
 *
 * OPACITÉ SEULE. Le conteneur d'apparition de la source
 * (`.framer-vlic3c-container` et ses quatre frères) garde `transform: none` du
 * premier au dernier relevé, y compris pendant l'animation : la montée de 16 px
 * que nous jouions n'existe pas. Notre `initialY: 16` était de surcroît
 * doublement faux, la marge d'observation qu'il entraîne déplaçant aussi le
 * seuil de déclenchement.
 *
 * AUCUN ÉCHELONNEMENT. Quand les quatre lignes fermées franchissent le seuil
 * dans la MÊME image (saut de défilement les amenant toutes au-dessus du bord
 * bas), elles partent, passent la mi-course et finissent aux mêmes
 * millisecondes : 330, 547 et 1190 ms aux trois largeurs. Notre `delay` de
 * 60 ms par rang était une invention. En défilement réel l'échelonnement existe
 * quand même, chaque ligne franchissant son propre seuil.
 *
 * RESSORT, ET NON TWEEN. La courbe relevée n'est PAS la courbe Framer du reste
 * du site : ajustée sur `cubic-bezier(0.68, 0, 0, 1)` elle laisse 2,7 % d'écart
 * quadratique, contre 0,10 % pour un ressort. Contrôle du protocole sur un
 * voisin immédiat, les lignes de l'intro de cette même section : le même
 * ajustement y redonne la courbe Framer à 0,03 % près, 499 ms de durée et 8 ms
 * de délai, soit exactement les valeurs déjà documentées plus bas. L'outil de
 * mesure est donc juste, et cette entrée-ci est bien d'une autre nature.
 *
 * PARAMÈTRES. Ajustement sur quatre relevés indépendants (`/` à 1440, `/about` à
 * 1440, 810 et 390) : raideur 15, amortissement 3,8, masse 0,3 (pulsation propre
 * 7,07 rad/s, amortissement relatif 0,896), écart quadratique 0,0010 à 0,0011.
 * Le délai ajusté vaut 312, 315, 318 et 323 ms selon le relevé ; le témoin
 * ci-dessus chiffre à 8 ms la latence propre au protocole, d'où 0,31 s retenu.
 * Repères du modèle : 0,1 à 385 ms, mi-course à 536, 0,9 à 792, 0,99 à 1030.
 *
 * AVANT CORRECTION, mesuré côté clone dans les mêmes conditions : mi-course à
 * 339 ms contre 547 sur la source, d'où un texte déjà lisible à 230 ms alors que
 * la source est encore noire (elle y est à 0,00 d'opacité, son entrée n'ayant
 * même pas commencé).
 */
const ROW_ENTRANCE: Transition = {
  type: "spring",
  stiffness: 15,
  damping: 3.8,
  mass: 0.3,
  delay: 0.31,
  // Les seuils de repos par défaut coupent le ressort à 1 % du but, soit
  // 1030 ms au lieu des 1190 relevés sur la source. On les abaisse pour laisser
  // la queue se dérouler entièrement, comme elle le fait sur la source.
  restDelta: 0.0005,
  restSpeed: 0.01,
};

/** Une ligne de prestation (framer-9sn8ks : Border + header + panneau). */
function ServiceRow({
  service,
  defaultOpen,
}: {
  service: ServiceItem;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  /**
   * Grille de texte APLATIE au repos fermé, à partir de la tablette.
   *
   * RELEVÉ sur `/live-proxy/about`, lignes fermées : `.framer-3t53jy` mesure
   * 690 × 1 à 1440 et 381 × 1 à 810 alors que ses colonnes font 109 et 91 de
   * haut, ce qui remonte l'image de 145 à 37 px sous le haut du panneau. À 390
   * la source ne l'aplatit PAS (grille de 342 à 414 px, image à 408-444), c'est
   * donc une bascule de variante propre à la tablette et au-dessus.
   *
   * Sans cet aplatissement, notre image restait 125 px plus bas que la sienne
   * dans le panneau replié. Invisible (le panneau est à hauteur nulle et
   * clippé), mais l'inventaire de grain apparie les calques par le haut de leur
   * hôte à 120 px près : les quatre lignes fermées de `/` et d'`/about`
   * sortaient non appariées à 810 et 1440.
   *
   * APLATISSEMENT DIFFÉRÉ, et c'est mesuré aussi. La source, elle, ANIME la
   * grille de 109 à 1 en 330 ms, en même temps que l'opacité du panneau qui
   * tombe de 1 à 0 (relevé image par image sur un vrai clic : 107 à 104 ms,
   * 74 à 179, 41 à 204, 2 à 328, 1 à 378). Notre panneau, lui, se ferme par sa
   * HAUTEUR ; aplatir la grille au premier rendu ferait sauter l'image de 108 px
   * vers le haut dans une boîte encore pleinement opaque. On attend donc la fin
   * de la fermeture, où la boîte est à hauteur nulle : même état de repos, aucun
   * saut. À l'ouverture, l'aplatissement est levé AVANT l'animation, pour que la
   * mesure de `height: auto` porte sur la grille déployée.
   */
  const [closedAtRest, setClosedAtRest] = useState(!defaultOpen);
  const shouldReduceMotion = useReducedMotion();
  const panelId = useId();
  const toggle = () => {
    if (!open) setClosedAtRest(false);
    setOpen((v) => !v);
  };
  // `will-change` réservé le temps de l'entrée de l'image, puis rendu.
  const coverWc = useRevealWillChange();

  const image = service.image?.src ?? "";
  // Cadre de l'image (framer-hhouxn) et dérive de son calque au scroll.
  const imageFrame = useRef<HTMLDivElement>(null);
  const imageY = useParallaxLayerY(imageFrame, 0.07);
  const [body0, body1] = [service.body[0] ?? "", service.body[1] ?? ""];

  // Reset visuel commun aux deux zones cliquables (nxpo9h / lyk4d7).
  // Focus : voir `src/app/focus.css` (source de vérité unique). Cette chaîne
  // portait encore `outline-none` et trois utilitaires `focus-visible:`, sans
  // aucun effet : `focus.css` est déclaré HORS COUCHE et l'emporte donc sur les
  // utilitaires Tailwind, tous placés dans `@layer utilities`. Vérifié au
  // runtime sur ce bouton précis, le style calculé au clavier était déjà celui
  // de la feuille centrale. Ne pas les réintroduire : un anneau posé localement
  // ne peut plus gagner, il ne ferait que laisser croire qu'il agit.
  const btnReset =
    "m-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-left [font:inherit] text-inherit";

  return (
    // framer-vlic3c-container / veo1ut-container… : conteneur d'apparition (reveal)
    <Reveal
      className="relative w-full flex-none"
      initialOpacity={0.001}
      transition={ROW_ENTRANCE}
    >
      {/* framer-9sn8ks (L1ODD) : item — grid 2col (phone) → flex-row (tablet+) */}
      <div
        data-part="service-row"
        className={
          "relative w-full overflow-hidden " +
          "grid auto-rows-[minmax(0,1fr)] grid-cols-[repeat(2,minmax(50px,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] justify-center gap-0 " +
          "tablet:flex tablet:flex-row tablet:items-start tablet:justify-start " +
          "pb-[20px] " +
          (open ? "tablet:pb-[50px]" : "tablet:pb-[20px]")
        }
      >
        {/* framer-1vky4e7 : Border (filet haut 1px, blanc 10%) */}
        <div
          data-part="border"
          aria-hidden
          className="absolute left-0 right-0 top-0 z-[1] h-px bg-[rgba(255,255,255,0.1)]"
        />

        {/* framer-nxpo9h : header (numéro + titre) — zone cliquable gauche */}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          /* Nom de la prestation, lu par la mesure déléguée
             (`components/analytics/GlobalAnalytics.tsx`) : le libellé de
             l'accordéon change avec le contenu, `data-analytics-service` donne
             une propriété stable aux entonnoirs « prix ». Aucun effet visuel. */
          data-analytics-service={service.title}
          /* `self-start` À TOUTES LES LARGEURS, et surtout PAS `self-stretch`.
             Cet en-tête est en `items-end` : étiré sur la hauteur de la rangée,
             il pousse le titre jusqu'au bas du panneau OUVERT, pendant que le
             numéro reste en haut (sa colonne est en `justify-start`). Le service
             ouvert affichait donc son « 01 » en haut et son libellé 570 px plus
             bas — mesuré à 888 px du haut de section à 1440 là où la source pose
             321, et de même à 810 (802 contre 323), 1200 (836 contre 321) et
             1920 (887 contre 321). Sous 810, où le panneau est plus court, le
             défaut ne se voyait pas.
             La source dimensionne cet en-tête sur son CONTENU (690 × 39 à 1440,
             `align-self: auto` sous un parent en `flex-start`). La zone
             cliquable se limite donc à la ligne d'en-tête : c'est exactement ce
             que fait la source, et c'est le prix à payer pour que le titre
             reste accolé à son numéro. */
          className={
            btnReset +
            " relative flex flex-row items-end justify-start gap-[10px] overflow-hidden " +
            "w-full self-start pt-[20px] pr-[10px] " +
            "tablet:w-px tablet:flex-[1_0_0] tablet:pr-0"
          }
        >
          {/* framer-ykbjth : colonne du numéro (align top, width min) */}
          <span className="relative flex w-min flex-none flex-col items-center justify-start gap-[10px] self-stretch pt-[2px]">
            {/* framer-a00aq6 : Number (preset 18rrjz2, 11px, blanc 50%) */}
            <span className="whitespace-pre text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-[rgba(255,255,255,0.5)]">
              {service.number}
            </span>
          </span>
          {/* framer-1tzzlex : Title (preset htsnb8, 16px, blanc) */}
          <span className="w-px flex-[1_0_0] whitespace-pre-wrap break-words text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
            {service.title}
          </span>
        </button>

        {/* framer-uvp0cl : colonne droite (ligne prix/toggle + panneau) */}
        <div className="relative flex w-full flex-col items-start justify-start gap-0 overflow-hidden tablet:w-px tablet:flex-[1_0_0] tablet:self-start">
          {/* framer-lyk4d7 : ligne prix + toggle — zone cliquable droite */}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            data-analytics-service={service.title}
            /* CE LIBELLÉ ÉTAIT RESTÉ EN ANGLAIS. Il annonçait « Site et
               visibilité locale — Show details » à tout lecteur d'écran, sur
               un site déclaré `lang="fr"`. Il n'apparaissait nulle part à
               l'écran, et `scripts/hardcoded-text-audit.mjs` ne le voyait pas :
               son motif d'attributs ne couvrait que `attr="…"`, jamais un
               gabarit `attr={`…`}`. Le motif a été élargi.

               Les trois fragments viennent maintenant de la donnée
               (`uiLabels.services`), qui les portait déjà en français sans que
               personne ne les lise. La virgule remplace le tiret cadratin :
               un lecteur d'écran le prononce « tiret », et les règles d'Eliott
               le proscrivent. */
            aria-label={`${service.title}, ${
              open
                ? uiLabels.services.toggleHideLabel
                : uiLabels.services.toggleShowLabel
            }${uiLabels.services.toggleSuffix}`}
            className={
              btnReset +
              " relative flex w-full flex-row items-center justify-between gap-[10px] overflow-hidden pt-[20px]"
            }
          >
            {/* framer-m56afa : prix (libellé + préfixe, puis montant)
                LE PRIX RESTE VISIBLE LIGNE FERMÉE, ce qui est un écart assumé
                avec la source Framer. Celle-ci le garde en `opacity: 0`,
                `position: absolute`, et ne le révèle qu'à l'ouverture du
                panneau. Conséquence MESURÉE le 2026-09-02, une fois qu'aucune
                ligne ne s'ouvre plus d'elle-même : la section des prestations
                n'affichait PLUS AUCUN MONTANT à l'arrivée, aux trois largeurs.
                Les fourchettes venaient d'être posées sur les en-têtes pour
                que les cinq lignes fermées donnent la carte de l'offre en une
                lecture ; elles étaient invisibles jusqu'au premier clic.

                LA FOURCHETTE PASSE SUR SA PROPRE LIGNE SOUS 810, et c'est une
                nécessité de mesure, pas un goût. À 390 la colonne droite fait
                168 px et « Prix : de 12 000 € à 36 000 € » en demande 215 :
                sur une seule ligne, `overflow-hidden` rasait la borne haute
                (débordement relevé de 63 px). En colonne, le libellé coiffe le
                montant et le montant se coupe entre ses deux bornes, jamais au
                milieu d'un montant : les insécables de `euros()` s'en chargent.
                Une fourchette tronquée se lit comme un prix, ce qui est
                exactement la lecture qu'on veut éviter. */}
            <span
              className={
                "relative flex min-w-0 flex-1 flex-col items-start gap-[2px] " +
                "tablet:w-min tablet:flex-none tablet:flex-row tablet:items-end tablet:gap-[6px]"
              }
            >
              {/* framer-11zvtfv : libellé de prix (« Price: from » dans la
                  source, preset 2okhk1, 14px, blanc 60%). Il porte le préfixe
                  du montant quand il y en a un, rien sur « sur devis ». */}
              {/* SANS MONTANT, PAS DE LIBELLÉ. Le Diagnostic n'a pas de prix :
                  il est compris dans la prestation qui suit. Le libellé était
                  rendu inconditionnellement, ce qui affichait « Prix : » suivi
                  de rien, servi en production. */}
              {service.price ? (
                <>
                  <span className="whitespace-pre text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                    {priceParts(service.price, uiLabels.services.priceLabel).label}
                  </span>
                  {/* framer-1407hte : montant (preset htsnb8, 16px, blanc) */}
                  <span className="text-balance text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground tablet:whitespace-pre">
                    {priceParts(service.price, uiLabels.services.priceLabel).amount}
                  </span>
                </>
              ) : null}
            </span>
            <ToggleIcon open={open} />
          </button>

          {/* framer-mnuxty : panneau (texte + image) — hauteur animée */}
          <motion.div
            id={panelId}
            data-part="panel"
            aria-hidden={!open}
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.5, ease: EASE_FRAMER }
            }
            // Repli terminé : la grille de texte rejoint l'état de repos fermé
            // de la source. La boîte est déjà à hauteur nulle, rien ne bouge.
            onAnimationComplete={() => {
              if (!open) setClosedAtRest(true);
            }}
            className="w-full overflow-hidden"
          >
            {/* Espacement lyk4d7↔mnuxty. Il SE RÉDUIT au repos fermé, la source
                passant alors le panneau en `position: absolute` : un enfant hors
                flux ne consomme pas l'écart de la boîte flexible.

                RELEVÉ sur `/live-proxy/about`, haut du panneau moins bas de la
                ligne de prix, ligne ouverte puis quatre lignes fermées :
                22 → 4 à 1440, 22 → 4 à 810, 18 → 6 à 390. Sans cette réduction,
                nos deux paragraphes de panneau replié restaient 18 px trop bas,
                seul écart de géométrie que l'audit de mise en page voyait encore
                sur cette section. */}
            <div
              className={
                "flex w-full flex-col items-center gap-[20px] tablet:gap-[36px] " +
                (closedAtRest ? "pt-[6px] tablet:pt-[4px]" : "pt-[18px] tablet:pt-[22px]")
              }
            >
              {/* framer-3t53jy : colonnes texte (stack phone → grille 2col tablet+).
                  `tablet:h-px` au repos fermé : hauteur relevée sur la source
                  (690 × 1 à 1440, 381 × 1 à 810, jamais aplatie à 390). */}
              <div
                className={
                  "flex w-full flex-col content-start items-start gap-[14px] overflow-hidden tablet:grid tablet:auto-rows-[minmax(0,1fr)] tablet:grid-cols-[repeat(2,minmax(50px,1fr))] tablet:grid-rows-[repeat(1,minmax(0,1fr))] tablet:content-normal tablet:items-center tablet:justify-center tablet:gap-x-[4px] tablet:gap-y-0 " +
                  (closedAtRest ? "tablet:h-px" : "")
                }
              >
                {/* framer-104b0i6 : Column 1 (padding-right 26px en tablet+) */}
                <div className="flex w-full flex-none flex-col items-center gap-[10px] overflow-hidden p-0 tablet:place-self-start tablet:pr-[26px]">
                  {/* framer-latp5o : body[0] (preset 2okhk1, 14px, blanc 60%) */}
                  <p className="w-full whitespace-pre-wrap break-words text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                    {body0}
                  </p>
                </div>
                {/* framer-14iaksy : Column 2 (padding-right 26px en tablet+) */}
                <div className="flex w-full flex-none flex-row items-center gap-[10px] overflow-hidden p-0 tablet:place-self-start tablet:pr-[26px]">
                  {/* framer-b6kxyz : body[1] (preset 2okhk1, 14px, blanc 60%) */}
                  <p className="w-px flex-[1_0_0] whitespace-pre-wrap break-words text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                    {body1}
                  </p>
                </div>
              </div>

              {/* POINT D'ARRIVÉE DE LA PRESTATION.
                  Il n'existait pas. Le site portait cinq prestations chiffrées
                  et zéro bouton rattaché à l'une d'elles : les seuls CTA vivaient
                  dans la grille tarifaire, dont aucune colonne ne parlait de site
                  vitrine. Un visiteur venu pour un site descendait 12 600 px sans
                  jamais croiser un bouton à sa mesure.

                  `tabIndex` suit l'ouverture : replié, le panneau garde sa boîte
                  dans le flux (hauteur 0, `overflow-hidden`), donc son lien
                  resterait atteignable au clavier tout en étant invisible. */}
              {service.rdvHref || service.cta ? (
                <div className="flex w-full flex-none flex-row flex-wrap items-center justify-start gap-x-[20px] gap-y-[12px]">
                  {/* LE RENDEZ-VOUS PASSE DEVANT LE DÉTAIL DES PRIX, et le lien
                      qui était plein devient souligné. Ce n'est pas une
                      hiérarchie de goût : la prise de rendez-vous existait,
                      affichait les vrais créneaux, et AUCUN lien du site n'y
                      menait. Le seul chemin était `/contact` puis 2 300 px de
                      descente à travers un formulaire de contact complet, qui
                      est son concurrent direct.

                      LE LIBELLÉ NE PORTE AUCUN MONTANT et ne varie pas d'une
                      ligne à l'autre : le contexte est dans le nom accessible,
                      composé avec le nom de la prestation. */}
                  {service.rdvHref ? (
                    <Link
                      href={service.rdvHref}
                      aria-label={`${uiLabels.services.rdvAriaPrefix}${service.title}`}
                      tabIndex={open ? undefined : -1}
                      aria-hidden={!open}
                      className="group relative flex h-[30px] flex-none flex-row items-center justify-center overflow-hidden bg-accent px-[10px] no-underline"
                    >
                      <span className="accent-room whitespace-pre text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background">
                        {uiLabels.services.rdvLabel}
                      </span>
                    </Link>
                  ) : null}
                  {service.cta ? (
                    <Link
                      href={service.cta.href}
                      tabIndex={open ? undefined : -1}
                      aria-hidden={!open}
                      className="flex h-[30px] flex-none flex-row items-center justify-center text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent motion-reduce:transition-none"
                    >
                      <span className="accent-room">{service.cta.label}</span>
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {/* framer-hhouxn : image (aspect 1.72727, bg cover + grain) */}
              <div
                ref={imageFrame}
                className="relative z-[1] aspect-[1.72727] w-full flex-none overflow-hidden"
              >
                {/* Calque sur-cadré de 7 % en haut et en bas, DÉRIVANT au scroll.
                    La source pose exactement `top:-7%; bottom:-7%` sur un div à
                    `background-image`, à l'intérieur d'un cadre `overflow:clip`.

                    Le sur-cadrage ne s'appliquait pas : `inset-0` et
                    `[inset:-7%_0]` déclarent la MÊME propriété, et c'est
                    `inset-0` qui l'emportait dans la feuille générée. Le calque
                    faisait donc pile la taille du cadre (mesuré 399px pour un
                    cadre de 399px, au lieu de 455px), ce qui ne laissait aucune
                    course à parcourir — d'où les tentatives de parallaxe
                    précédentes qui ne pouvaient rien produire. Les bords sont
                    désormais posés un par un, sans raccourci qui les écrase.

                    Les DEUX calques d'apparition qui l'enveloppent sont posés
                    en `absolute inset-0` : ils reprennent exactement la boîte
                    du cadre et deviennent le bloc conteneur du calque de
                    parallaxe, dont les `-7 %` se rapportent donc toujours à la
                    même hauteur. Le sur-cadrage et sa course sont intacts. */}
                <motion.div
                  className="absolute inset-0"
                  // État masqué rendu dès le HTML serveur, aucune bascule après
                  // hydratation (cf. l'entête de `@/components/motion/Reveal`).
                  data-reveal=""
                  initial="hidden"
                  whileInView="shown"
                  viewport={{
                    once: true,
                    amount: "some",
                    margin: REVEAL_VIEWPORT_MARGIN,
                  }}
                  onViewportEnter={coverWc.onViewportEnter}
                  onAnimationComplete={coverWc.onAnimationComplete}
                  style={coverWc.style}
                  variants={COVER_APPEAR}
                >
                  {/* Second calque, porté par les VARIANTES du premier : un seul
                      déclencheur, jamais deux observateurs. */}
                  <motion.div
                    className="absolute inset-0"
                    style={coverWc.style}
                    variants={COVER_APPEAR}
                  >
                    <motion.div
                      className="absolute bottom-[-7%] left-0 right-0 top-[-7%] bg-cover bg-center"
                      style={{
                        backgroundImage: image ? `url(${image})` : undefined,
                        ...(imageY ? { y: imageY } : null),
                      }}
                    />
                  </motion.div>
                  {/* framer-30jb7g-container. RELEVÉ sur `/` et `/about` : z-3,
                      opacité 0,07, motif 256 × 256.

                      SA PLACE EST ICI, ET ELLE SE MESURE. La source imbrique le
                      grain DANS le premier calque d'apparition et à côté du
                      second : `.framer-hhouxn` › `.framer-xqajfn-container` ›
                      [ `.framer-1ambeg8-container`, `.framer-30jb7g-container` ].
                      Son hôte hérite donc du `scale(1.1)` de repos du premier
                      calque tant que l'entrée n'a pas été jouée, et il est
                      relevé à 759 × 439 pour une boîte de mise en page de
                      690 × 399 (419 × 243 à 810, 193 × 111 à 390).

                      Posé en frère des deux calques, comme ici auparavant, il
                      restait à 690 × 399 : l'audit de grain voyait un rapport de
                      1,1 exactement aux trois largeurs sur les quatre cartes
                      fermées de `/` et d'`/about`, celles dont l'entrée n'est
                      jamais jouée puisque leur panneau est replié. Ce n'était
                      donc ni une largeur de colonne ni un plafond, mais l'échelle
                      de repos du calque d'apparition dont le grain doit dépendre.

                      Le calque de parallaxe n'est pas concerné : son bloc
                      conteneur reste le SECOND calque, et ses débords de 7 % s'y
                      rapportent comme avant. */}
                  <Grain opacity={0.07} className="z-[3]" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
}

export function ServicesSection({
  services,
  /**
   * Chapô de la section. Vient de la donnée (`home.services.intro` /
   * `about.services.intro`) ; `INTRO` n'est plus qu'un dernier recours.
   *
   * Le texte était figé dans le composant, alors qu'il existait déjà dans le
   * contenu : traduire la donnée ne changeait donc rien à l'écran.
   */
  intro = INTRO,
  /**
   * Bande de bas de section (`framer-jcy67m`), 20px en mobile et 30 au-dessus,
   * sur la moitié droite. Elle est ORANGE sur la home et GRISE (#e9e9e9) sur
   * `/about` : c'est une variante de couleur, pas une absence. La retirer sur
   * `/about` supprimait ses 30px et remontait tout le bas de page d'autant.
   */
  bottomAccent = "accent",
  horsCatalogue,
}: {
  services: ServiceItem[];
  intro?: string;
  bottomAccent?: "accent" | "muted";
  /**
   * « Et aussi » : ce qu'Eliott sait faire hors du catalogue chiffré.
   *
   * OPTIONNEL, ET ABSENT DE LA PAGE « À PROPOS ». Cette page monte le même
   * accordéon pour dire ce qu'il fait ; la page d'accueil, elle, enchaîne sur
   * la section tarifs, où le visiteur va chercher des montants. C'est là que le
   * « ces trois-là n'ont pas de forfait » a un sens, et nulle part ailleurs.
   */
  horsCatalogue?: HorsCatalogue;
}) {
  return (
    // framer-Iaj5T (section) : fond #0b0b0b, colonne [Top accent | Services | Bottom accent]
    <section
      // Ancre de retour des pages de prestation (`/services/<slug>`), qui
      // renvoient vers `/#services`. Sans `id`, le navigateur ouvrait la
      // page d\'accueil en haut et le visiteur devait redescendre.
      id="services"
      data-section="services"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-0 overflow-hidden bg-background"
      }
    >
      {/* framer-sn2cdf : Top accent (barre gris clair 50%, alignée à gauche) */}
      <div className="relative flex w-full flex-row items-center justify-start">
        {/* framer-61gm4x : Accent (h 20px phone / 30px tablet+, w 50%, #e9e9e9) */}
        <div className="relative z-[5] h-[20px] w-1/2 flex-none overflow-hidden bg-muted tablet:h-[30px]" />
      </div>

      {/* framer-1tnadfl : Services (centre le conteneur 1440, padding responsive) */}
      <div
        className={
          "relative flex w-full flex-row items-center justify-center overflow-visible " +
          "p-[20px_20px_10px] tablet:p-[30px_24px_60px] desktop:p-[30px_30px_60px]"
        }
      >
        {/* framer-kg34x4 : Container (max 1440, aligné gauche, gap 20/50) */}
        <div className="relative flex w-px max-w-[1440px] flex-[1_0_0] flex-col items-start justify-center gap-[20px] tablet:gap-[50px]">
          {/* framer-1px0leg : Header (colonne phone → rangée tablet+) */}
          <div className="relative flex w-full flex-col items-start justify-start overflow-visible tablet:flex-row">
            {/* framer-6dlxcu : Label */}
            <div className="relative flex w-full flex-row items-start gap-[10px] overflow-visible tablet:w-px tablet:flex-[1_0_0]">
              {/* framer-9f2eim : "Services" (preset wwtw0z, 12px uppercase, blanc 60%) */}
              <p className="whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                Services
              </p>
            </div>
            {/* framer-1fn9a7l : intro (code-component, max-w 560) */}
            <div className="relative flex w-full flex-row items-start overflow-hidden pt-[12px] tablet:w-px tablet:flex-[1_0_0] tablet:pt-[50px]">
              {/* framer-5jhr4k-container : max-w 560, révélé LIGNE PAR LIGNE.

                  RELEVÉ sur la source (`/live-proxy/about`, 1440x900) : le
                  paragraphe y est composé de 4 boîtes de ligne à
                  `overflow: hidden` (hauts 2448, 2483, 2518, 2554, hauteur 35
                  chacune pour un corps de 32 px en interligne 1,1), chacune
                  contenant une boîte à `opacity: 0` et
                  `translateY(60px)`. Le découpage n'est PAS écrit ici : il
                  dépend de la largeur, et `LineReveal` le mesure sur le rendu.

                  CHRONOLOGIE, relevée image par image après déclenchement (saut
                  3 px sous le seuil puis franchissement, défilement arrêté) :
                  les quatre lignes franchissent la mi-course à 192, 262, 332 et
                  404 ms, soit un DÉCALAGE régulier de 70 ms. L'ajustement de la
                  ligne 1 sur la courbe Framer `cubic-bezier(0.68, 0, 0, 1)`
                  (0,178 à 159 ms · 0,492 à 192 · 0,871 à 275 · 0,994 à 441)
                  donne 490 ms de durée et un délai nul. */}
              <LineReveal
                as="p"
                text={intro}
                className="w-px max-w-[560px] flex-[1_0_0] whitespace-pre-wrap text-left text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground tablet:text-[26px] desktop:text-[32px]"
                lineClassName="overflow-hidden"
                initialY={60}
                duration={0.49}
                delay={0}
                delayStep={0.07}
              />
            </div>
          </div>

          {/* framer-x9ljqq-container : wrapper accordéon */}
          <div className="relative w-full">
            {/* framer-14nsj48 (3K54C) : accordéon (colonne d'items) */}
            <div className="relative flex w-full flex-col items-start justify-start gap-0 overflow-visible">
              {services.map((service) => (
                <ServiceRow
                  key={service.number}
                  service={service}
                  /* AUCUN PANNEAU OUVERT À L'ARRIVÉE depuis le 2026-09-02.
                     Le premier ouvert était Le Diagnostic, la seule prestation
                     SANS prix : la section s'ouvrait donc sur la ligne qui ne
                     chiffre rien, et masquait la fourchette des quatre autres
                     derrière un pli. Les cinq lignes fermées, chacune portant
                     désormais sa fourchette, donnent la carte de l'offre en une
                     lecture. */
                  defaultOpen={false}
                />
              ))}
              {/* framer-o8ohx9-container : décoratif vide (filet central, code-component) */}
              <div aria-hidden className="absolute left-1/2 top-0 z-[1] h-auto w-auto -translate-x-1/2" />
            </div>
          </div>

          {/* « ET AUSSI » — ce qui n'a pas de forfait.
              Il reprend le partage en deux moitiés de l'en-tête de la section :
              l'étiquette à gauche, le contenu à droite, sur la même verticale
              que l'accordéon au-dessus. Aucun montant n'y figure, et il n'y en
              aura pas : ces sujets n'existent pas dans `offre.ts`. */}
          {horsCatalogue ? (
            <div className="relative flex w-full flex-col items-start border-t border-white/10 pt-[20px] tablet:flex-row tablet:pt-[30px]">
              <div className="relative flex w-full flex-row items-start gap-[10px] tablet:w-px tablet:flex-[1_0_0]">
                <p className="whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                  {horsCatalogue.titre}
                </p>
              </div>
              <div className="relative flex w-full flex-col items-start gap-[16px] pt-[12px] tablet:w-px tablet:flex-[1_0_0] tablet:pt-0">
                <p className="max-w-[560px] text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground-60">
                  {horsCatalogue.intro}
                </p>
                <ul className="flex w-full flex-col gap-[12px] desktop:grid desktop:grid-cols-3 desktop:gap-[16px]">
                  {horsCatalogue.items.map((item) => (
                    <li key={item.nom} className="flex flex-col gap-[4px]">
                      <span className="accent-room text-[14px] font-semibold leading-[1.2] tracking-[-0.01em] text-foreground">
                        {item.nom}
                      </span>
                      <span className="text-[13px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground-60">
                        {item.corps}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={horsCatalogue.cta.href}
                  className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent motion-reduce:transition-none"
                >
                  <span className="accent-room">{horsCatalogue.cta.label}</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* framer-jcy67m : Bottom accent (barre orange 50%, alignée à droite) */}
      <div className="relative flex w-full flex-col items-end justify-end">
        {/* framer-cy905f : h 20px phone / 30px tablet+, largeur 50 %. */}
        <div
          className={`relative z-[3] h-[20px] w-1/2 flex-none overflow-hidden tablet:h-[30px] ${
            bottomAccent === "muted" ? "bg-muted" : "bg-accent"
          }`}
        />
      </div>
    </section>
  );
}
