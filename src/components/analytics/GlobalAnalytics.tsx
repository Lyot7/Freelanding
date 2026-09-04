"use client";

import { useEffect } from "react";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { capture } from "@/lib/analytics/posthog";

/**
 * MESURE DES INTERACTIONS, par DÉLÉGATION au niveau du document.
 *
 * POURQUOI PAS UN `onClick` SUR CHAQUE BOUTON. Le site compte une centaine de
 * liens répartis sur une trentaine de composants, dont plusieurs sont des ports
 * fidèles au pixel qu'on ne rouvre pas de gaieté de cœur. Instrumenter à la
 * main, c'était une trentaine de diffs, autant d'occasions de casser une
 * animation mesurée — et un oubli garanti au prochain lien ajouté.
 *
 * Un seul écouteur en phase de CAPTURE lit ce que le DOM dit déjà : la
 * destination d'un lien (`tel:`, `mailto:`, `/services/…`), l'état d'un
 * accordéon (`aria-expanded`), l'état d'un filtre (`aria-pressed`), la section
 * d'où part le clic (`data-section`, déjà posé sur les onze sections de
 * l'accueil). Un lien ajouté demain est donc mesuré sans que personne n'y
 * pense, et aucun composant n'a à connaître l'existence de la mesure.
 *
 * Phase de capture (`capture: true`) : un composant qui arrête la propagation
 * de son clic — il y en a — ne peut pas rendre l'interaction invisible.
 *
 * CE QUI N'EST JAMAIS LU : la VALEUR d'un champ. Les écouteurs de formulaire
 * rapportent le nom du champ et le fait qu'il soit rempli, jamais son contenu.
 */

const SOCIAL_HOSTS: ReadonlyArray<readonly [string, string]> = [
  ["linkedin.", "linkedin"],
  ["github.", "github"],
  ["x.com", "x"],
  ["twitter.", "x"],
  ["instagram.", "instagram"],
  ["malt.", "malt"],
  ["dribbble.", "dribbble"],
  ["behance.", "behance"],
  ["youtube.", "youtube"],
  ["youtu.be", "youtube"],
];

function socialNetwork(host: string): string | null {
  const lower = host.toLowerCase();
  for (const [needle, name] of SOCIAL_HOSTS) {
    if (lower.includes(needle)) return name;
  }
  return null;
}

/**
 * D'OÙ PART LE CLIC. Résolu par remontée du DOM, du plus précis au plus
 * général. `data-analytics-zone` est la porte de sortie pour un cas particulier ;
 * en pratique `data-section`, déjà présent, suffit sur l'accueil.
 */
function zoneOf(element: Element): string {
  const explicit = element.closest<HTMLElement>("[data-analytics-zone]");
  if (explicit?.dataset.analyticsZone) return explicit.dataset.analyticsZone;
  if (element.closest("[data-part='floating-nav']")) return "floating_nav";
  if (element.closest("header")) return "header";
  if (element.closest("footer")) return "footer";
  const section = element.closest<HTMLElement>("[data-section]");
  if (section?.dataset.section) return section.dataset.section;
  if (element.closest("main")) return "main";
  return "page";
}

function labelOf(element: Element): string {
  const aria = element.getAttribute("aria-label");
  if (aria && aria.trim() !== "") return aria.trim();
  const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
  return text.slice(0, 80);
}

/** Identifiant stable d'un formulaire, sans jamais toucher à son contenu. */
function formId(form: HTMLFormElement): string {
  return (
    form.dataset.analyticsForm ??
    form.getAttribute("name") ??
    form.id ??
    "form"
  );
}

function fieldName(field: Element): string {
  return (
    field.getAttribute("name") ??
    field.getAttribute("id") ??
    field.getAttribute("aria-label") ??
    field.tagName.toLowerCase()
  );
}

export function GlobalAnalytics({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    /* Formulaires déjà comptés comme « commencés ». La clé porte le CHEMIN en
       plus de l'identifiant : ce composant n'est monté qu'une fois pour toute
       la visite, et sans le chemin, un visiteur qui commence le formulaire du
       pied de page sur deux pages différentes ne serait compté qu'une fois. */
    const started = new Set<string>();
    const marqueDebut = (id: string) => `${window.location.pathname}::${id}`;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      /* La bannière de consentement ne se mesure pas elle-même : ses clics
         seraient du bruit, et l'un d'eux est un refus — mesurer un refus serait
         précisément ce qu'on promet de ne pas faire. */
      if (target.closest("[data-consent-ui]")) return;

      const zone = zoneOf(target);

      /* 1. Événement explicitement déclaré sur l'élément. */
      const declared = target.closest<HTMLElement>("[data-analytics-event]");
      if (declared?.dataset.analyticsEvent) {
        const { analyticsEvent, ...rest } = declared.dataset;
        capture(analyticsEvent, {
          zone,
          label: labelOf(declared),
          ...rest,
        });
        return;
      }

      /* 2. Lien : la destination dit ce qui vient de se passer. */
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (anchor) {
        const raw = anchor.getAttribute("href") ?? "";
        const label = labelOf(anchor);
        const common = { zone, label, href: raw };

        if (raw.startsWith("tel:")) {
          capture(ANALYTICS_EVENTS.phoneClicked, common);
          return;
        }
        if (raw.startsWith("mailto:")) {
          capture(ANALYTICS_EVENTS.emailClicked, common);
          return;
        }

        let url: URL | null = null;
        try {
          url = new URL(anchor.href, window.location.href);
        } catch {
          url = null;
        }
        if (!url || !url.protocol.startsWith("http")) return;

        if (url.origin !== window.location.origin) {
          const network = socialNetwork(url.host);
          capture(
            network
              ? ANALYTICS_EVENTS.socialClicked
              : ANALYTICS_EVENTS.externalLinkClicked,
            { ...common, host: url.host, ...(network ? { network } : {}) },
          );
          return;
        }

        const path = url.pathname.replace(/\/+$/, "") || "/";
        const slug = path.split("/").filter(Boolean).pop();
        const isCta =
          path === "/contact" ||
          anchor.className.includes("bg-accent") ||
          anchor.dataset.cta === "true";

        if (isCta) {
          capture(ANALYTICS_EVENTS.ctaClicked, {
            ...common,
            destination: path,
            cta_id: anchor.dataset.ctaId ?? label.toLowerCase() ?? path,
          });
          return;
        }
        if (path.startsWith("/services/")) {
          capture(ANALYTICS_EVENTS.serviceLinkClicked, {
            ...common,
            service_slug: slug,
          });
          return;
        }
        if (path.startsWith("/realisations/")) {
          capture(ANALYTICS_EVENTS.workLinkClicked, {
            ...common,
            work_slug: slug,
          });
          return;
        }
        if (path.startsWith("/blog/")) {
          capture(ANALYTICS_EVENTS.articleLinkClicked, {
            ...common,
            article_slug: slug,
          });
          return;
        }
        if (path.startsWith("/legal/")) {
          capture(ANALYTICS_EVENTS.legalLinkClicked, {
            ...common,
            legal_slug: slug,
          });
          return;
        }
        capture(ANALYTICS_EVENTS.navLinkClicked, {
          ...common,
          destination: path,
        });
        return;
      }

      /* 3. Bascule (accordéon, menu). L'attribut porte encore l'état d'AVANT le
         clic au moment où l'écouteur tourne : `aria-expanded="false"` signifie
         donc « va s'ouvrir ». */
      const toggle = target.closest<HTMLElement>("[aria-expanded]");
      if (toggle) {
        const willOpen = toggle.getAttribute("aria-expanded") === "false";
        const label = toggle.dataset.analyticsService ?? labelOf(toggle);
        const common = { zone, label, opened: willOpen };

        if (zone === "services") {
          capture(
            willOpen
              ? ANALYTICS_EVENTS.serviceExpanded
              : ANALYTICS_EVENTS.serviceCollapsed,
            { ...common, service: label },
          );
          if (willOpen) {
            /* Ouvrir une ligne de prestation, c'est découvrir son prix : la
               grille tarifaire est DANS le panneau replié. */
            capture(ANALYTICS_EVENTS.pricingViewed, {
              ...common,
              section: "services",
              trigger: "accordion",
              service: label,
            });
          }
          return;
        }
        if (zone === "faq") {
          if (willOpen) capture(ANALYTICS_EVENTS.faqOpened, common);
          return;
        }
        if (zone === "floating_nav") {
          if (willOpen) capture(ANALYTICS_EVENTS.menuOpened, common);
          return;
        }
        capture(ANALYTICS_EVENTS.accordionToggled, common);
        return;
      }

      /* 4. Filtre (grilles blog et réalisations). */
      const filter = target.closest<HTMLElement>("[aria-pressed]");
      if (filter) {
        capture(ANALYTICS_EVENTS.filterApplied, {
          zone,
          filter: labelOf(filter),
          selected: filter.getAttribute("aria-pressed") === "false",
        });
      }
    };

    /* --------------------------------- formulaires ------------------------ */
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-consent-ui]")) return;
      const form = target.closest("form");
      if (!form) return;
      const id = formId(form);
      const marque = marqueDebut(id);
      if (started.has(marque)) return;
      started.add(marque);
      capture(ANALYTICS_EVENTS.formStarted, {
        form_id: id,
        zone: zoneOf(form),
        first_field: fieldName(target),
      });
    };

    const onFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        )
      ) {
        return;
      }
      if (target.closest("[data-consent-ui]")) return;
      const form = target.closest("form");
      if (!form) return;
      /* LE NOM DU CHAMP ET RIEN D'AUTRE. `filled` est un booléen dérivé de la
         longueur : la valeur saisie ne quitte jamais le navigateur. */
      capture(ANALYTICS_EVENTS.formFieldCompleted, {
        form_id: formId(form),
        field: fieldName(target),
        filled: target.value.trim().length > 0,
      });
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.closest("[data-consent-ui]")) return;
      const fields = Array.from(form.elements)
        .filter(
          (element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement,
        )
        .filter((field) => field.value.trim().length > 0)
        .map((field) => fieldName(field));

      capture(ANALYTICS_EVENTS.formSubmitted, {
        form_id: formId(form),
        zone: zoneOf(form),
        filled_fields: fields,
        filled_field_count: fields.length,
      });
    };

    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("focusin", onFocusIn, { capture: true });
    document.addEventListener("focusout", onFocusOut, { capture: true });
    document.addEventListener("submit", onSubmit, { capture: true });

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("focusin", onFocusIn, { capture: true });
      document.removeEventListener("focusout", onFocusOut, { capture: true });
      document.removeEventListener("submit", onSubmit, { capture: true });
    };
  }, [enabled]);

  return null;
}
