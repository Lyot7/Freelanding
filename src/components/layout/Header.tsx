import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { SwapCopies } from "@/components/ui/SwapCopies";
import { uiLabels } from "@/content/ui";
import type { SiteConfig } from "@/lib/content/types";
import { Logo } from "./Logo";

/**
 * Header — reconstruction fidèle du header Framer de la page d'accueil d'origine
 * (`header.ts`, variantes Desktop / Tablet / Phone fusionnées en un composant
 * responsive). Chrome exact du live :
 *   - Overlay TRANSPARENT positionné en absolu au-dessus du hero (pas de fond,
 *     pas de bordure, pas de blur). Container `framer-1nqx0rw` : z-9, top:0,
 *     inset-x:0 ; padding 30px (≥1200) / 20px (mobile), sans padding bas.
 *   - Gauche `framer-1t4npk4` (gap 20px) : Logo (icône + « la marque d'origine »),
 *     puis — DESKTOP UNIQUEMENT — un séparateur vertical (1px, blanc 18 %) et
 *     la tagline "Conversion-first design & dev studio" ("design & dev" blanc,
 *     le reste blanc 60 %).
 *   - Droite `framer-beg1hm` (gap 28→36px) : nav "WORKS / BLOG / ABOUT / CONTACT"
 *     (séparateurs "/" opacity .2) visible dès 810px, puis le CTA orange
 *     "START A PROJECT" (toujours visible) avec swap vertical du texte au survol.
 *
 * Reveal d'apparition (appear-id `1nqx0rw`) : opacity .001 + translateY(-100px)
 * + scale(1.3) → état final, tween 1.4s delay .3s ease cubic(0.68,0,0,1). Joué
 * via `@/components/motion/Reveal` avec le déclencheur `"appear"` : l'état
 * masqué est rendu dès le HTML serveur et l'entrée part au montage, exactement
 * comme la source démarre ses `appear effects`. Sans JavaScript, la feuille
 * `<noscript>` du layout remet l'élément à l'état visible.
 *
 * Fidélité mobile (VÉRIFIÉ contre archive ET live, headers Phone byte-identiques,
 * 3407 chars) : la variante « Phone » du header source contient UNIQUEMENT le Logo
 * (« la marque d'origine ») + le bouton orange « START A PROJECT ». PAS de burger, PAS de menu
 * hamburger. Le `Container framer-12ut4h8` (« 1 »/« 2 ») n'est pas un burger : ce
 * sont les 2 copies du libellé « START A PROJECT » pour le swap vertical au survol.
 * Sur mobile, la nav (Works/Blog/About/Contact) n'est donc accessible que via le
 * footer et via le menu flottant séparé, invisible en haut puis affiché au scroll.
 */

/** Bouton CTA orange avec swap vertical du texte au survol (framer-1sk0ilg). */
function StartProjectCta({
  href,
  label,
  shortLabel,
}: {
  href: string;
  label: string;
  shortLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-[30px] flex-none flex-row items-center justify-center overflow-hidden bg-accent px-[10px] no-underline"
    >
      {/* Swap vertical MESURÉ sur le live : course de 22 px (14,4 px de texte +
          7,6 px d'écart), ~300 ms, et surtout un vrai FONDU CROISÉ (opacité 1→0
          sur la copie sortante, 0→1 sur l'entrante). La version précédente
          glissait de la seule hauteur de ligne (15 px) en 450 ms, sans fondu :
          trop lente, trop courte et trop sèche. */}
      {/* MASQUE DE PERMUTATION. Le libellé mesure 14,4 px de haut (12 x 1,2) sur
          la source, mais « DÉMARRER » porte un É dont l'encre dépasse cette
          boîte par le haut : le masque coupait l'accent sur les huit pages.

          Première tentative, FAUSSE : relever la hauteur du masque à 18 px. Le
          bouton centre ce masque verticalement, donc l'agrandir a décalé le
          libellé de 1,8 px vers le haut — le texte n'était plus centré dans le
          rectangle.

          `.accent-room` est la bonne réponse, contrairement à ce que disait la
          note précédente. Son remplissage haut est compensé par une marge
          négative de même valeur : la BOÎTE DE MARGE reste à 14,4 px, c'est elle
          que le centrage flex utilise, et le libellé ne bouge donc pas d'un
          pixel. Seule la zone visible du masque s'étend vers le haut.

          La copie garée de la permutation est en absolu à `top: 22px`, mesuré
          depuis la boîte de REMPLISSAGE : elle reste hors du cadre tant que le
          remplissage est inférieur à 7,6 px (22 - 14,4). Ici il vaut 0,32em à
          12 px de corps, soit 5,12 px.

          PAS de hauteur fixe : `box-sizing: border-box` ferait rentrer le
          remplissage DANS les 14,4 px, la boîte de contenu tomberait à 9,3 et le
          bas du libellé serait coupé. La hauteur vient donc du contenu, qui vaut
          précisément ces 14,4 px (12 x 1,2). */}
      {/* CENTRAGE OPTIQUE. Centrer la BOÎTE DE LIGNE ne centre pas le texte : la
          boîte réserve la place des jambages, que des capitales n'utilisent pas.
          MESURÉ au canvas (Geist 12 px, hauteur de capitale 8,52 px) : sans
          correction, le centre d'encre des CAPITALES tombe 0,46 px au-dessus du
          centre du bouton. C'est cette hauteur-là qu'il faut centrer.
          La valeur précédente, 1,3 px, centrait l'encre TOTALE, accent du « É »
          compris. Un accent n'entre pas dans le centrage optique d'une ligne de
          capitales : le libellé se retrouvait 0,84 px trop bas, visible à l'œil
          sur un bouton de 30 px. Les autres boutons du site, eux, ne portent
          aucune correction et restent donc à -0,46 px.
          `translate` et non `margin` : la correction est purement visuelle, elle
          ne doit pas déplacer la boîte ni rouvrir la question du centrage flex.
          Le masque entier descend, sa copie garée avec lui. */}
      <span className="accent-room relative block translate-y-[0.46px] overflow-hidden">
        <SwapCopies
          travel={22}
          textClassName="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink"
        >
          {/* MESURÉ : « DÉMARRER UN PROJET » porte le bouton à 155 px, contre
              124 pour « START A PROJECT » sur la source. À 320 px de fenêtre,
              le bord droit du bouton tombait à 357, donc hors écran, alors que
              la source s'arrêtait pile à 300. La forme courte ne sort que sous
              390 px, la largeur de référence du design mobile. */}
          {shortLabel ? (
            <>
              <span className="min-[390px]:hidden">{shortLabel}</span>
              <span className="hidden min-[390px]:inline">{label}</span>
            </>
          ) : (
            label
          )}
        </SwapCopies>
      </span>
    </Link>
  );
}

export function Header({
  site,
  appear = false,
}: {
  site: SiteConfig;
  /**
   * Joue l'entrée `scale(1.3)` + `translateY(-100)` du header. RÉSERVÉ À LA HOME.
   *
   * MESURÉ, source contre clone. Dans le miroir, seule `/` enveloppe le header
   * dans `framer-1nqx0rw-container` porteur de
   * `data-framer-appear-id="1nqx0rw"` ; `/contact`, `/about`, `/work`, `/blog`
   * et les deux pages légales le posent dans `framer-2be8m-container`, SANS
   * appear-id. Vérifié au runtime, pas seulement dans le SSR : relevé en rAF sur
   * les 3 premières secondes du live, le conteneur de `/contact` reste
   * `transform: none`, `opacity: 1` sur ses 219 images, tandis que celui de `/`
   * part de `matrix(1.3,…,-100)` à 55 ms et arrive à l'identité vers 1,85 s.
   *
   * Chez nous l'entrée était jouée sur les 18 pages : le header s'affichait, puis
   * RETOMBAIT à `opacity 0.001` / `scale(1.3)` à 224 ms (à l'hydratation) avant
   * de rejouer son entrée jusqu'à 2 s. Un clignotement, plus une animation
   * inventée, sur 17 routes.
   */
  appear?: boolean;
}) {
  const { brand, nav, primaryCta, tagline, taglineEmphasis: emphasisList } = site;

  // Baseline : un fragment passe en blanc plein, le reste reste à 60 % (rendu
  // exact du live). Le fragment vient de la DONNÉE (`site.taglineEmphasis`) : il
  // était figé sur l'ancien libellé anglais « design & dev », qui n'existe plus
  // dans la baseline traduite — l'emphase ne s'appliquait donc plus à rien, sans
  // la moindre erreur de compilation.
  const taglineEmphasis = emphasisList?.[0] ?? "";
  const [taglineBefore, taglineAfter] = taglineEmphasis
    ? tagline.split(taglineEmphasis)
    : [tagline, ""];

  // Base commune aux liens ET aux séparateurs « / ».
  const navBaseCls =
    "relative whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground no-underline";
  // Survol des LIENS : recoloration vers l'accent, `0.2s cubic-bezier(0.44,0,0.56,1)`
  // (mesuré sur le live). L'ancienne version passait l'opacité à 0.7, ce qui est le
  // mauvais effet ; et les séparateurs héritaient de ce survol alors que le live
  // n'en applique AUCUN sur eux — ils gardent donc la base, sans état de survol.
  const navItemCls =
    navBaseCls +
    " transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none";

  const shellCls =
    "absolute inset-x-0 top-0 z-[9] flex flex-row items-center justify-between gap-[10px] px-[20px] pt-[20px] tablet:px-[30px] tablet:pt-[30px]";

  const contenu: ReactNode = (
    <>
      {/* framer-1t4npk4 : Logo + text (gap 20px) */}
      <div className="relative flex w-min flex-none flex-row items-center justify-start gap-[20px] overflow-visible text-foreground">
        <Logo brand={brand} />

        {/* framer-u1lar3 : séparateur vertical — desktop uniquement (≥1200) */}
        <span
          aria-hidden
          className="hidden h-[28px] w-px flex-none bg-[rgba(255,255,255,0.18)] desktop:block"
        />

        {/* framer-ht2or3 : tagline — desktop uniquement (≥1200) */}
        <p className="hidden whitespace-pre text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60 desktop:block">
          {taglineBefore}
          <span className="text-foreground">{taglineEmphasis}</span>
          {taglineAfter}
        </p>
      </div>

      {/* framer-beg1hm : Nav (gap 28→36px) */}
      <div className="relative flex w-min flex-none flex-row items-center justify-start gap-[28px] overflow-visible desktop:gap-[36px]">
        {/* framer-16rltc5 : menu — visible dès 810px (gap 20→24px) */}
        <nav
          aria-label={uiLabels.chrome.mainNavLabel}
          className="relative hidden w-min flex-none flex-row items-center justify-end gap-[20px] overflow-visible tablet:flex desktop:gap-[24px]"
        >
          {nav.map((link, index) => (
            <span key={link.href} className="contents">
              {index > 0 ? (
                <span aria-hidden className={`${navBaseCls} opacity-20`}>
                  {uiLabels.chrome.navSeparator}
                </span>
              ) : null}
              <Link
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={navItemCls}
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        {/* framer-c221d5-container : CTA (toujours visible) */}
        <StartProjectCta
          href={primaryCta.href}
          label={primaryCta.label}
          shortLabel={primaryCta.shortLabel}
        />
      </div>
    </>
  );

  // Hors home, le header est un simple `<header>` : ni motion, ni remount, donc
  // aucun retour à l'état masqué à l'hydratation (cf. la prop `appear`).
  if (!appear) return <header className={shellCls}>{contenu}</header>;

  return (
    <Reveal
      as="header"
      // `appear effect` de la source, démarré dès la première peinture sans
      // observateur. `appearId` = la clé de l'entrée dans son bloc
      // `__framer__appearAnimationsContent`.
      trigger="appear"
      appearId="1nqx0rw"
      className={shellCls}
      initialOpacity={0.001}
      initialY={-100}
      initialScale={1.3}
      duration={1.4}
      delay={0.3}
    >
      {contenu}
    </Reveal>
  );
}
