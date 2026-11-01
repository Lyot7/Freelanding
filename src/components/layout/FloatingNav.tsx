"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SwapCopies } from "@/components/ui/SwapCopies";
/* Ce panneau est en `position: fixed` : ses liens ne quittent JAMAIS la fenêtre,
   donc le préchargement automatique tirait en permanence toutes les routes du
   site. Voir la note de `HoverPrefetchLink`. */
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import type { SiteConfig } from "@/lib/content/types";
import { uiLabels } from "@/content/ui";

// useLayoutEffect côté client (avant paint), useEffect côté serveur (no-op SSR).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Le dock arrive une fois le héros presque passé, et repart au retour au-dessus
 * de ce seuil : posé plus tôt, il recouvrait la source La Fabrique du Net et les
 * logos. Une fraction de la fenêtre, lue à chaque événement.
 */
const SEUIL_DOCK = 0.85;

/**
 * Course verticale, en px : le bouton (50), son retrait bas et l'encoche d'un
 * téléphone (34 au plus), pour le garer entièrement sous le bord.
 */
const REVEAL_Y = 90;

/** Courbe de la charte pour tout ce qui entre : départ franc, arrivée douce. */
const ENTREE = { type: "spring", visualDuration: 0.3, bounce: 0 } as const;
const SORTIE = { duration: 0.24, ease: "easeIn" } as const;

/**
 * FloatingNav — port FIDÈLE du menu flottant du gabarit Framer d'origine
 * (`framer-QbZBP` / layer `framer-xm6233-container`). Géométrie + styles + ANIMATIONS
 * capturés sur le site LIVE (runtime Framer Motion échantillonné frame par frame),
 * reproduits en CSS performant (transform + opacity, GPU) — zéro invention.
 *
 * Comportement source vérifié LIVE :
 *   - Dock en bas à droite depuis le 2026-11-01 : hors de l'axe du filet central,
 *     il ne recouvre plus la colonne de texte. Il apparaît sous le héros, se
 *     retire au pied de page, et porte l'action une fois `#logiciel` passé.
 *   - VOILE plein écran `rgba(18,18,18,0.3)` (framer-o5yu5p), opacité 0 → 1 sur la
 *     même chronologie que le panneau. (Affirmé absent dans une version antérieure
 *     de ce fichier, sur la base d'une capture au rAF gelé où son opacité restait
 *     figée à 0. Mesure refaite dans un Chrome réel : il existe bien.)
 *   - Ouverture panneau (depuis son coin bas droit) : `opacity 0→1` + `scale(.9) translateY(20px)→none`,
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
 * Easing de l'ouverture du panneau : la courbe vive du tempo du site, comme
 * tout ce qui répond à un geste.
 */
const EASE = "var(--courbe-vive)";
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
  const menuLinks = site.menuNav ?? site.nav;
  const [open, setOpen] = useState(false);
  const burgerActif = useRef(false);

  // L'état de REPOS est le dock MASQUÉ, juste sous le bord bas : une pastille
  // visible au chargement puis retirée à l'hydratation clignotait sur toutes les
  // pages. Sans JavaScript, la navigation reste servie par l'en-tête et le pied.
  const [revealed, setRevealed] = useState(false);
  // Le pied de page a son propre formulaire et ses propres liens.
  const [piedVisible, setPiedVisible] = useState(false);
  // L'action n'apparaît qu'une fois la démonstration lue. Seul l'accueil porte
  // `#logiciel` ; `#rendez-vous` la replie, la réservation est alors sous les yeux.
  const [logicielPasse, setLogicielPasse] = useState(false);
  const [rendezVousVu, setRendezVousVu] = useState(false);

  useIsoLayoutEffect(() => {
    // Rechargement en cours de page, ancre : le dock est là tout de suite.
    const lire = () => {
      // Lu au défilement et non par un observateur : un saut d'ancre ou un
      // rechargement franchit la section sans jamais la croiser.
      const logiciel = document.getElementById("logiciel");
      const rendezVous = document.getElementById("rendez-vous");
      setLogicielPasse(logiciel ? logiciel.getBoundingClientRect().bottom < 0 : false);
      setRendezVousVu(
        rendezVous ? rendezVous.getBoundingClientRect().top < window.innerHeight : false,
      );
      // Tant que le clavier est sur le burger, le dock reste : le retirer ferait
      // perdre le focus.
      if (burgerActif.current) return;
      setRevealed(window.scrollY > window.innerHeight * SEUIL_DOCK);
    };
    lire();
    window.addEventListener("scroll", lire, { passive: true });
    return () => window.removeEventListener("scroll", lire);
  }, []);

  useEffect(() => {
    const pied = document.querySelector("footer");
    if (!pied) return;
    const observateur = new IntersectionObserver(([entree]) => {
      if (entree) setPiedVisible(entree.isIntersecting);
    });
    observateur.observe(pied);
    return () => observateur.disconnect();
  }, []);

  const shown = open || revealed;
  // Fondu et non translation : le dock s'efface devant le pied, sans glisser.
  const efface = piedVisible && !open;
  const avecAction = logicielPasse && !rendezVousVu && !open;

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
  const action = site.floatingCta ?? primaryCta;
  const labelCls =
    "micro m-0 whitespace-pre text-foreground-60";

  return (
    <div
      ref={wrapperRef}
      onKeyDown={onWrapperKeyDown}
      role={open ? "dialog" : undefined}
      aria-modal={open || undefined}
      aria-label={open ? "Menu de navigation" : undefined}
      data-part="floating-nav"
      // EN BAS À DROITE depuis le 2026-11-01 : au centre, la pastille tombait sur
      // le filet et sur le premier caractère de la colonne de texte des articles.
      className="pointer-events-none fixed inset-0 z-[9] flex flex-col items-end justify-end pb-[max(16px,env(safe-area-inset-bottom))] pr-[16px]"
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
        className="relative flex flex-col items-end"
        initial={false}
        animate={
          efface
            ? { y: shown ? 0 : REVEAL_Y, opacity: 0, transitionEnd: { visibility: "hidden" } }
            : { y: shown ? 0 : REVEAL_Y, opacity: 1, visibility: "visible" }
        }
        transition={{ y: shown ? ENTREE : SORTIE, opacity: { duration: 0.2 } }}
      >
        {/* Panneau (e5omt8) — absolute au-dessus du burger ; anim opacity+scale+translateY. */}
        <div
          ref={panelRef}
          id={PANEL_ID}
          aria-hidden={!open}
          style={{
            transitionTimingFunction: EASE,
            transform: open
              ? "scale(1) translateY(0)"
              : "scale(0.9) translateY(20px)",
          }}
          // S'ouvre depuis le coin du dock, qui l'a fait naître. `max-h` et le
          // défilement : le panneau tient en 320 × 568.
          className={`absolute bottom-[70px] right-0 left-auto max-h-[calc(100svh-110px)] w-[min(400px,calc(calc(100vw/var(--zoom-ecran,1))-32px))] origin-bottom-right translate-x-0 overflow-y-auto bg-[rgba(23,23,23,0.89)] transition-[opacity,transform,backdrop-filter] duration-300 before:pointer-events-none before:absolute before:inset-0 before:z-[2] before:border before:border-[rgba(255,255,255,0.1)] before:content-[''] motion-reduce:transition-none ${
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
            <div className="flex flex-col gap-[20px] px-[16px] pt-[16px] min-[400px]:flex-row min-[400px]:items-stretch min-[400px]:justify-between min-[400px]:gap-[24px]">
              <div className="flex flex-col items-start gap-[9px] select-none">
                <p className={labelCls}>{uiLabels.chrome.menuColumnLabel}</p>
                <nav
                  aria-label={uiLabels.chrome.floatingNavLabel}
                  className="flex flex-col items-start gap-0"
                >
                  {menuLinks.map((link) => (
                    <HoverPrefetchLink
                      key={link.href}
                      href={link.href}
                      tabIndex={tab}
                      onClick={closeMenu}
                      className="whitespace-pre py-[11px] text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 ease-[var(--courbe-vive)] hover:text-accent motion-reduce:transition-none min-[810px]:text-[22px]"
                    >
                      {link.label}
                    </HoverPrefetchLink>
                  ))}
                </nav>
              </div>

              <div className="flex flex-col items-start justify-between gap-[24px] text-left select-none min-[400px]:items-end min-[400px]:text-right">
                <div className="flex flex-col items-start gap-[9px] min-[400px]:items-end">
                  <p className={labelCls}>
                    {uiLabels.chrome.contactColumnLabel}
                  </p>
                  <div className="flex flex-col items-start gap-[8px] min-[400px]:items-end">
                    <a
                      href={`mailto:${contact.email}`}
                      tabIndex={tab}
                      className="whitespace-pre text-[16px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 hover:text-accent motion-reduce:transition-none"
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
                        className="whitespace-pre text-[16px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground no-underline transition-colors duration-200 hover:text-accent motion-reduce:transition-none"
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
                <div className="flex flex-col items-start gap-[8px] min-[400px]:items-end">
                  {legalLinks.map((link) => (
                    <HoverPrefetchLink
                      key={link.href}
                      href={link.href}
                      tabIndex={tab}
                      onClick={closeMenu}
                      className="micro whitespace-normal text-foreground-60 underline decoration-[#ffffff21] underline-offset-[3px] transition-[color,text-decoration-color,text-underline-offset] duration-200 hover:text-foreground hover:underline-offset-4 motion-reduce:transition-none"
                    >
                      {link.label}
                    </HoverPrefetchLink>
                  ))}
                </div>
              </div>
            </div>

            {/* L'action du panneau, pleine largeur, en volt. */}
            <HoverPrefetchLink
              href={primaryCta.href}
              tabIndex={tab}
              onClick={closeMenu}
              className="group relative flex h-[50px] w-full items-center justify-center overflow-hidden bg-accent px-[16px] no-underline"
            >
              {/* 14,4 px et non 15 : le cadre clippant de la source mesure
                  12,97 px sous l'échelle 0,9 du panneau, soit 14,41 px avant
                  échelle (12 px × 1,2), comme le CTA du header. */}
              <span className="relative block h-[14.4px] overflow-hidden">
                <SwapCopies
                  travel={22}
                  textClassName="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink"
                >
                  {primaryCta.label}
                </SwapCopies>
              </span>
            </HoverPrefetchLink>
          </div>
        </div>

        <div className="pointer-events-none flex items-stretch">
        {/* L'action, ouverte à gauche du menu une fois la démonstration passée. */}
        <div className="dock-action" data-ouvert={avecAction}>
          <div>
            <HoverPrefetchLink
              href={action.href}
              tabIndex={avecAction ? 0 : -1}
              aria-hidden={!avecAction}
              className={`flex h-[50px] items-center whitespace-pre bg-accent px-[16px] text-[12px] font-semibold uppercase leading-none tracking-[-0.01em] text-accent-ink no-underline ${
                avecAction ? "pointer-events-auto" : "pointer-events-none"
              }`}
            >
              <span className="dock-action-texte">
                {primaryCta.shortLabel ? (
                  <>
                    <span className="min-[390px]:hidden">{primaryCta.shortLabel}</span>
                    <span className="hidden min-[390px]:inline">{action.label}</span>
                  </>
                ) : (
                  action.label
                )}
              </span>
            </HoverPrefetchLink>
          </div>
        </div>

        {/* Burger (11cf560) — 50×50, carré interne flou 48×48, → croix. */}
        <button
          ref={burgerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          // Garé hors écran en haut de page, il reste dans l'ordre de tabulation :
          // le focus le révèle et le garde tant qu'il y est, comme un défilement.
          onFocus={() => {
            burgerActif.current = true;
            setRevealed(true);
          }}
          onBlur={() => {
            burgerActif.current = false;
          }}
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
            // Fond à 96 % : la pastille peut passer sur du texte noir.
            className="absolute inset-[1px] bg-[rgba(23,23,23,0.96)] transition-colors duration-[385ms] [backdrop-filter:blur(8px)] group-hover:bg-[rgba(20,20,20,0.96)] motion-reduce:transition-none"
          />
          <span className="relative z-[1] flex items-center justify-center">
            <BurgerIcon open={open} />
          </span>
        </button>
        </div>
      </motion.div>
    </div>
  );
}
