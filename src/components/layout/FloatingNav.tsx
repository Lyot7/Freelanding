"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SwapCopies } from "@/components/ui/SwapCopies";
/* Ce panneau est en `position: fixed` : ses liens ne quittent JAMAIS la fenêtre,
   donc le préchargement automatique tirait en permanence toutes les routes du
   site. Voir la note de `HoverPrefetchLink`. */
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import type { Link, SiteConfig } from "@/lib/content/types";
import { uiLabels } from "@/content/ui";

// useLayoutEffect côté client (avant paint), useEffect côté serveur (no-op SSR).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Seuil de scroll déclenchant le montage du dock. MESURÉ sur le live par sondes
 * successives avec rechargement complet : absent à 0, 1 et 2 px, présent et
 * visible à 5 px. Le dock apparaît donc au tout premier geste de scroll.
 */
const REVEAL_SCROLL_PX = 2;

/**
 * Course verticale de l'entrée, en px. MESURÉE sur le live : le dock arrive de
 * `translateY ≈ 70` et rejoint 0, l'opacité restant à 1 du début à la fin (aucun
 * fondu, aucun changement de `display` ni de `visibility`). À +70, la pastille a
 * son bord haut à 900 pour une fenêtre de 900 : elle est donc exactement hors
 * champ, ce qui suffit à la masquer sans toucher à l'opacité.
 */
const REVEAL_Y = 70;

/**
 * FloatingNav — port FIDÈLE du menu flottant du gabarit Framer d'origine
 * (`framer-QbZBP` / layer `framer-xm6233-container`). Géométrie + styles + ANIMATIONS
 * capturés sur le site LIVE (runtime Framer Motion échantillonné frame par frame),
 * reproduits en CSS performant (transform + opacity, GPU) — zéro invention.
 *
 * Comportement source vérifié LIVE :
 *   - Dock MONTÉ AU PREMIER SCROLL, pas au chargement. Mesuré : au chargement
 *     frais son hôte `framer-xm6233-container` a un `textContent` de 0 caractère,
 *     et le dock est absent du DOM ; il apparaît entre 2 et 5 px de scroll, puis
 *     ne se rétracte JAMAIS (vérifié en remontant à 0 : il reste affiché).
 *     Entrée : `translateY 70 → 0` en ~550 ms, profil exponentiel sans
 *     dépassement, opacité constante à 1. Voir REVEAL_SCROLL_PX / REVEAL_Y.
 *     (Une version antérieure de ce fichier affirmait l'inverse — dock persistant
 *     sans animation — sur la base d'une capture prise dans un document au rAF
 *     gelé, où toute animation est figée à t=0. Le relevé était invalide.)
 *   - VOILE plein écran `rgba(18,18,18,0.3)` (framer-o5yu5p), opacité 0 → 1 sur la
 *     même chronologie que le panneau. (Affirmé absent dans une version antérieure
 *     de ce fichier, sur la base d'une capture au rAF gelé où son opacité restait
 *     figée à 0. Mesure refaite dans un Chrome réel : il existe bien.)
 *   - Ouverture panneau : `opacity 0→1` + `transform scale(.9) translateY(20px)→none`,
 *     ~300ms, ease-out sans overshoot (`cubic-bezier(.2,.8,.2,1)`), opacity `ease-out`.
 *     Propriétés animées : opacity + transform uniquement (pas de height).
 *   - Burger→croix : barres haut/bas `rotate(±45deg)`, médiane `opacity 0`, même 300ms.
 *   - CTA « START A PROJECT » : ENFANT du panneau, dernier élément en bas, pleine
 *     largeur, `background rgb(11,11,11)` — apparaît donc AVEC le panneau (caché au repos).
 *
 * Styles computed exacts (live) :
 *   - Panneau `e5omt8` : `bg rgba(23,23,23,0.89)`, `backdrop-filter blur(9px)`,
 *     `padding 16px`, `gap 36px`, bord 1px `rgba(255,255,255,0.1)` (Framer data-border),
 *     `border-radius 0`. max-width 400px.
 *     Le bord est un PSEUDO-ÉLÉMENT, pas un `border` de boîte : la source le
 *     dessine via `[data-border=true]::after` (`position:absolute; inset:0`), et
 *     `.framer-e5omt8` a bien `border-width: 0`. Notre `border` ajoutait 2 px de
 *     haut et rognait 2 px de largeur utile.
 *     Le FLOU s'anime avec l'ouverture : relevé image par image sur le live,
 *     `backdrop-filter` monte de 0,056 → 0,559 → 3,19 → 7,24 → 8,44 → 8,89 →
 *     9 px sur la même chronologie que l'opacité. Le nôtre était figé à 9 px.
 *   - Burger : wrapper 50×50 `radius 1px` + bord 1px `rgba(255,255,255,0.1)` ; carré
 *     interne 48×48 `rgba(23,23,23,0.8)` + `blur(8px)`, `radius 0`. Barres blanches 2px :
 *     haut 9px, milieu 16px, bas 16px.
 *   - CTA `1sk0ilg` : h 50px, `bg rgb(11,11,11)`, `radius 0`, texte blanc.
 *
 * Textes : items nav 18px (≤809) / 20px, blanc, hover accent ; labels 11px blanc-60 ;
 * legal 11px blanc-60 underline `#ffffff21` offset 3px → hover blanc offset 4px ;
 * email/tel Geist 500 -0.02em 110%.
 */

/**
 * Repli des liens du menu — ordre source : Home, Works, About, Blog, Contact.
 *
 * Ce tableau n'est utilisé QUE si la donnée n'expose ni `menuNav` ni `nav`. Il
 * était auparavant la seule source du menu flottant, ce qui avait deux effets :
 * les libellés restaient en anglais, et surtout le masquage de sections (voir
 * `src/content/features.ts`, qui retire « Blog » de `nav`, `menuNav` et
 * `footerNav`) ne s'appliquait pas ici — le menu flottant était le dernier
 * endroit du site à pointer vers `/blog`, qui répond 404.
 */
const MENU_LINKS_FALLBACK: readonly Link[] = [
  { label: "Home", href: "/" },
  { label: "Works", href: "/realisations" },
  { label: "About", href: "/a-propos" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

/**
 * Easing de l'ouverture du panneau — courbe en S, PAS un ease-out.
 *
 * MESURÉ image par image sur le live, deux relevés indépendants : à ~27 % de la
 * course l'opacité du panneau vaut 0,16 puis 0,19, et elle ne franchit 50 %
 * qu'aux environs de 38-40 % du temps. `cubic-bezier(0.2,0.8,0.2,1)`, employé
 * avant, franchit 50 % à ~19 % : le panneau se remplissait presque entièrement
 * dans le premier quart puis rampait, alors que la source démarre lentement.
 * `cubic-bezier(0.68,0,0,1)` est la courbe que Framer utilise déjà sur ce site
 * (entrée du header) et recouvre le relevé.
 */
const EASE = "cubic-bezier(0.68,0,0,1)";
const PANEL_ID = "floating-nav-panel";

/**
 * Éléments réellement atteignables au clavier dans un sous-arbre.
 *
 * Le filtre sur `tabIndex >= 0` est ce qui rend la fonction utilisable ici sans
 * cas particulier : le voile plein écran est un `<button aria-hidden>` en
 * `tabIndex={-1}`, et tous les liens du panneau repassent à `-1` dès qu'il est
 * fermé. Ils sortent donc d'eux-mêmes de la liste, sans énumération manuelle.
 */
function focusablesIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const nodes = root.querySelectorAll<HTMLElement>(
    "a[href], button, input, select, textarea, [tabindex]",
  );
  return Array.from(nodes).filter(
    (node) => node.tabIndex >= 0 && !node.hasAttribute("disabled"),
  );
}

/** Icône burger → croix (barres 9/16/16px, morph ±45°, médiane opacity 0). */
function BurgerIcon({ open }: { open: boolean }) {
  const bar =
    "block h-[2px] bg-white transition-all duration-300 motion-reduce:transition-none";
  return (
    <span
      aria-hidden
      className="relative flex h-[12px] w-[16px] flex-col items-start justify-center gap-[3px]"
    >
      <span
        style={{ transitionTimingFunction: EASE }}
        className={`${bar} ${
          open
            ? "absolute left-0 top-1/2 w-[16px] -translate-y-1/2 rotate-45"
            : // Au SURVOL de la pastille, la barre du haut s'allonge de 9 à 16 px.
              // MESURÉ sur le live : ~385 ms, courbe en S (50 % de la course à
              // 38 % du temps). Seul effet de survol de la pastille avec
              // l'assombrissement de son fond.
              "w-[9px] group-hover:w-[16px] group-hover:duration-[385ms]"
        }`}
      />
      <span
        style={{ transitionTimingFunction: EASE }}
        className={`${bar} w-[16px] ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span
        style={{ transitionTimingFunction: EASE }}
        className={`${bar} ${
          open
            ? "absolute left-0 top-1/2 w-[16px] -translate-y-1/2 -rotate-45"
            : "w-[16px]"
        }`}
      />
    </span>
  );
}

export function FloatingNav({ site }: { site: SiteConfig }) {
  const { primaryCta, contact, legalLinks } = site;
  // Le menu lit la donnée (`menuNav`, repli `nav`) : c'est elle qui porte les
  // libellés traduits ET le retrait des sections éteintes.
  const menuLinks = site.menuNav ?? site.nav ?? MENU_LINKS_FALLBACK;
  const [open, setOpen] = useState(false);

  // Apparition au premier scroll, IRRÉVERSIBLE (fidèle au live).
  //
  // L'état de REPOS est le dock MASQUÉ (translaté de REVEAL_Y, donc juste sous le
  // bord bas), et non plus visible. L'ancien repos « visible » était payé cher :
  // relevé en rAF sur `/contact`, notre pastille restait AFFICHÉE à y=830 pour
  // une fenêtre de 900 pendant les 320 premières millisecondes, puis glissait
  // jusqu'à 900 une fois l'hydratation passée — une pastille qui apparaît puis
  // s'en va, sur les 18 pages. La source, elle, ne monte PAS le dock avant le
  // premier scroll : son hôte `.framer-11cf560-container` est absent du DOM sur
  // les 193 images des 3 premières secondes.
  //
  // Sans JavaScript le dock reste donc hors champ, exactement comme la source ;
  // la navigation reste servie par le header (≥810) et par le pied de page.
  const [revealed, setRevealed] = useState(false);

  useIsoLayoutEffect(() => {
    // Si la page est déjà scrollée (rechargement en cours de page, restauration
    // de position, ancre), le dock doit être là immédiatement, sans entrée.
    if (window.scrollY > REVEAL_SCROLL_PX) {
      setRevealed(true);
    }
  }, []);

  useEffect(() => {
    if (revealed) return;
    const onScroll = () => {
      if (window.scrollY > REVEAL_SCROLL_PX) setRevealed(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealed]);

  const shown = revealed;

  // Fermeture Échap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* ---------------------------- Focus au clavier ---------------------------
     Le panneau est un `role="dialog" aria-modal`, il doit donc respecter le
     contrat complet : le focus ENTRE à l'ouverture, RESTE à l'intérieur tant
     qu'il est ouvert, et REVIENT sur le déclencheur à la fermeture. Rien de
     tout cela n'existait : le panneau s'ouvrait, le focus restait sur le
     burger, et la tabulation suivante quittait purement et simplement le menu
     pour repartir dans la page derrière le voile. */
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  // Vrai seulement si le panneau a réellement été ouvert : sans ce garde-fou,
  // le premier rendu (fermé) volerait le focus au chargement de chaque page.
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      focusablesIn(panelRef.current)[0]?.focus({ preventScroll: true });
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    // Retour sur le déclencheur, mais UNIQUEMENT si le focus est encore dans le
    // menu : si l'utilisateur est déjà reparti ailleurs entre-temps, le lui
    // reprendre serait pire que de ne rien faire. `document.body` correspond au
    // cas où l'élément focalisé vient d'être rendu inatteignable.
    const active = document.activeElement;
    const inside =
      active === document.body ||
      (active instanceof Node && wrapperRef.current?.contains(active) === true);
    if (inside) burgerRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Piège de tabulation. Le cycle couvre le panneau ET le burger, qui fait
  // office de bouton de fermeture : Tab depuis le dernier élément revient au
  // premier lien, Maj+Tab depuis le premier repart sur le burger.
  const onWrapperKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open || event.key !== "Tab") return;
    const nodes = focusablesIn(wrapperRef.current);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (event.shiftKey ? active === first : active === last) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
    }
  };

  const closeMenu = () => setOpen(false);
  const tab = open ? 0 : -1;
  const labelCls =
    "m-0 whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60";

  return (
    <div
      ref={wrapperRef}
      onKeyDown={onWrapperKeyDown}
      role={open ? "dialog" : undefined}
      aria-modal={open || undefined}
      aria-label={open ? "Menu de navigation" : undefined}
      data-part="floating-nav"
      /*
       * CENTRÉE EN BAS, comme sur la source. Décision d'Eliott, après un essai
       * en bas à droite.
       *
       * CE QUE ÇA IMPLIQUE, et ce qui est fait pour. À x = 720 sur une fenêtre
       * de 1440, la pastille tombe sur le filet vertical qui sépare les deux
       * colonnes du site ET sur le premier caractère de la colonne de texte des
       * pages d'article. Son fond était translucide à 80 % : sur les pages à
       * fond clair, les lettres transparaissaient floutées dessous et la
       * pastille se lisait comme une tache posée sur le texte. C'est le défaut
       * signalé. L'opacité du fond règle ça sans la déplacer (voir la pastille
       * plus bas).
       */
      className="pointer-events-none fixed inset-0 z-[9] flex flex-col items-center justify-end p-[20px]"
    >
      {/* framer-o5yu5p : voile plein écran — ferme au clic hors menu.
          MESURÉ sur le live dans un Chrome réel : `rgba(18,18,18,0.3)`, opacité
          0 → 1 sur la même chronologie que le panneau. Il avait été supprimé à
          tort à partir d'une capture faite dans un document au rAF gelé, où
          l'opacité restait figée à 0 et le voile semblait donc absent. */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={closeMenu}
        style={{ transitionTimingFunction: EASE }}
        // FLOU PLEIN ÉCRAN : `backdrop-filter: blur(5px)` MESURÉ sur
        // `.framer-o5yu5p` du live (fond `rgba(18,18,18,0.3)`, z-index 1, boîte
        // 1440×900). Le nôtre n'avait que l'assombrissement : capture à l'appui,
        // toute la page reste nette derrière notre panneau alors que la source
        // la floute entièrement. Le flou monte avec l'opacité, comme celui du
        // panneau.
        className={`absolute inset-0 bg-[rgba(18,18,18,0.3)] transition-[opacity,backdrop-filter] duration-300 motion-reduce:transition-none ${
          open
            ? "pointer-events-auto opacity-100 [backdrop-filter:blur(5px)]"
            : "pointer-events-none opacity-0 [backdrop-filter:blur(0px)]"
        }`}
      />

      {/* Dock — le live porte la translation d'entrée sur ce nœud parent
          (`data-framer-name="Closed"`), pas sur la pastille, dont le `transform`
          propre reste `none`. Spring sans dépassement : la décroissance mesurée est
          exponentielle de constante de temps ~86 ms (ratio ~0,82 toutes les 17 ms),
          95 % à ~300 ms, fin ~550 ms. `bounce: 0` supprime tout rebond. */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={false}
        animate={{ y: shown ? 0 : REVEAL_Y }}
        transition={{ type: "spring", visualDuration: 0.3, bounce: 0 }}
      >
        {/* Panneau (e5omt8) — absolute au-dessus du burger ; anim opacity+scale+translateY. */}
        <div
          ref={panelRef}
          id={PANEL_ID}
          aria-hidden={!open}
          style={{
            transitionTimingFunction: EASE,
            transform: open
              ? "translateX(-50%) scale(1) translateY(0)"
              : "translateX(-50%) scale(0.9) translateY(20px)",
          }}
          // Origine de l'échelle au CENTRE (défaut), pas en bas. MESURÉ : à
          // `scale(0.9) translateY(20)` la source place le haut du panneau à
          // y=537,2 pour une position finale de 501,8 et une hauteur réduite de
          // 277,4 — c'est exactement le résultat d'une mise à l'échelle centrée
          // (655,9 - 138,7 + 20). `origin-bottom` le posait à 550,6, soit 13 px
          // trop bas pendant toute l'ouverture.
          className={`absolute bottom-[70px] left-1/2 w-[min(400px,calc(100vw-40px))] overflow-hidden bg-[rgba(23,23,23,0.89)] transition-[opacity,transform,backdrop-filter] duration-300 before:pointer-events-none before:absolute before:inset-0 before:z-[2] before:border before:border-[rgba(255,255,255,0.1)] before:content-[''] motion-reduce:transition-none ${
            open
              ? "pointer-events-auto opacity-100 [backdrop-filter:blur(9px)]"
              : "pointer-events-none opacity-0 [backdrop-filter:blur(0px)]"
          }`}
        >
          <div className="flex flex-col gap-[36px] p-[16px]">
            {/* Row (1q7n49m) : Menu (gauche) / Contact + Legal (droite).
                `padding: 16px 16px 0` MESURÉ sur `.framer-1q7n49m` — un SECOND
                retrait de 16 px par-dessus celui du panneau. Sans lui le panneau
                mesurait 294,2 px de haut contre 308,2 sur la source, et les deux
                colonnes s'écartaient sur 366 px de largeur utile au lieu de 336. */}
            <div className="flex items-stretch justify-between gap-[24px] px-[16px] pt-[16px]">
              <div className="flex flex-col items-start gap-[9px] select-none">
                <p className={labelCls}>{uiLabels.chrome.menuColumnLabel}</p>
                <nav
                  aria-label={uiLabels.chrome.floatingNavLabel}
                  className="flex flex-col items-start gap-[8px]"
                >
                  {menuLinks.map((link) => (
                    <HoverPrefetchLink
                      key={link.href}
                      href={link.href}
                      tabIndex={tab}
                      onClick={closeMenu}
                      className="whitespace-pre text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none min-[810px]:text-[20px]"
                    >
                      {link.label}
                    </HoverPrefetchLink>
                  ))}
                </nav>
              </div>

              <div className="flex flex-col items-end justify-between gap-[24px] text-right select-none">
                <div className="flex flex-col items-end gap-[9px]">
                  <p className={labelCls}>
                    {uiLabels.chrome.contactColumnLabel}
                  </p>
                  <div className="flex flex-col items-end gap-[8px]">
                    <a
                      href={`mailto:${contact.email}`}
                      tabIndex={tab}
                      className="whitespace-pre text-[16px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground no-underline transition-colors duration-200 hover:text-accent motion-reduce:transition-none"
                    >
                      {contact.email}
                    </a>
                    {/* Aucun numéro publié tant qu'Eliott n'a pas tranché
                        (`siteConfig.contact.phone` est vide) : le lien `tel:`
                        vide disparaît entièrement, sans espace résiduel. */}
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                        tabIndex={tab}
                        className="whitespace-pre text-[16px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground no-underline transition-colors duration-200 hover:text-accent motion-reduce:transition-none"
                      >
                        {contact.phone}
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Documents légaux : la LISTE vient de la donnée. Les deux
                    liens étaient écrits en dur, en anglais, et retrouvés par
                    leur libellé anglais : la troisième obligation française
                    (mentions légales) n'apparaissait donc pas. */}
                <div className="flex flex-col items-end gap-[8px]">
                  {legalLinks.map((link) => (
                    <HoverPrefetchLink
                      key={link.href}
                      href={link.href}
                      tabIndex={tab}
                      onClick={closeMenu}
                      className="whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 underline decoration-[#ffffff21] underline-offset-[3px] transition-[color,text-decoration-color,text-underline-offset] duration-200 hover:text-foreground hover:underline-offset-4 motion-reduce:transition-none"
                    >
                      {link.label}
                    </HoverPrefetchLink>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA « START A PROJECT » — enfant du panneau, pleine largeur, fond #0b0b0b. */}
            <HoverPrefetchLink
              href={primaryCta.href}
              tabIndex={tab}
              onClick={closeMenu}
              className="group relative flex h-[50px] w-full items-center justify-center overflow-hidden bg-background px-[16px] no-underline"
            >
              {/* 14,4 px et non 15 : le cadre clippant de la source mesure
                  12,97 px sous l'échelle 0,9 du panneau, soit 14,41 px avant
                  échelle (12 px × 1,2), comme le CTA du header. */}
              <span className="relative block h-[14.4px] overflow-hidden">
                <SwapCopies
                  travel={22}
                  textClassName="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground"
                >
                  {primaryCta.label}
                </SwapCopies>
              </span>
            </HoverPrefetchLink>
          </div>
        </div>

        {/* Burger (11cf560) — 50×50, carré interne flou 48×48, → croix. */}
        <button
          ref={burgerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          // Le dock est monté au premier SCROLL (fidèle à la source), donc au
          // chargement il est translaté de 70px, entièrement hors de la fenêtre.
          // Il restait pourtant dans l'ordre de tabulation : au clavier, on
          // atteignait un bouton invisible, situé sous le bord bas, sans aucun
          // moyen de savoir où on était. Le focus le révèle donc, exactement
          // comme le ferait un premier geste de défilement. Aucun changement
          // pour la souris, donc aucune perte de fidélité.
          onFocus={() => setRevealed(true)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls={PANEL_ID}
          // Focus : voir `src/app/focus.css` (source de vérité unique).
          className="group pointer-events-auto relative flex h-[50px] w-[50px] flex-none items-center justify-center rounded-[1px] border border-[rgba(255,255,255,0.1)]"
        >
          {/* Fond de la pastille : s'assombrit au survol, de rgba(23,23,23,0.8) à
              rgba(20,20,20,0.8) (mesuré sur le live — très subtil, 3/255). */}
          <span
            aria-hidden
            /*
             * FOND À 96 %, ET NON 80 % COMME SUR LA SOURCE.
             *
             * La pastille est posée au centre bas, donc sur le filet séparateur
             * et sur le début de la colonne de texte des articles. À 80 %, le
             * texte noir dessous transparaissait, flouté par le
             * `backdrop-filter` : calculé sur le gris clair des pages
             * d'article (232), le fond rendait 65 et une lettre 18, un écart
             * qui se voit franchement. À 96 %, l'écart tombe de 43 à 9 points
             * de gris, sous le seuil du perceptible.
             *
             * La source peut se permettre 80 % : son site est sombre partout, il
             * n'y a jamais de texte noir derrière cette pastille. Le flou est
             * conservé, il travaille encore sur les fonds sombres et sur la
             * vidéo du hero.
             */
            className="absolute inset-[1px] bg-[rgba(23,23,23,0.96)] transition-colors duration-[385ms] [backdrop-filter:blur(8px)] group-hover:bg-[rgba(20,20,20,0.96)] motion-reduce:transition-none"
          />
          <span className="relative z-[1] flex items-center justify-center">
            <BurgerIcon open={open} />
          </span>
        </button>
      </motion.div>
    </div>
  );
}
