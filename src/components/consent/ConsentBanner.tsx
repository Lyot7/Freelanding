"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

import type { ConsentChoices } from "@/lib/analytics/consent";
import { useConsent } from "./ConsentProvider";
import { consentCopy } from "@/content/consent";

/**
 * BANNIÈRE DE CONSENTEMENT.
 *
 * CE QU'ELLE RESPECTE, POINT PAR POINT (recommandation CNIL du 17 septembre
 * 2020 sur les modalités pratiques de recueil du consentement) :
 *
 *  1. REFUSER EST AUSSI SIMPLE QU'ACCEPTER. Les deux boutons sont sur le
 *     PREMIER écran, côte à côte, de géométrie strictement identique, tous deux
 *     en aplat plein et fortement contrastés (blanc 20,6:1, volt 14,4:1). Aucun
 *     n'est un contour pâle, aucun n'est relégué derrière un second écran, et
 *     « Tout refuser » est posé EN PREMIER dans l'ordre de lecture comme dans
 *     l'ordre de tabulation.
 *  2. AUCUN TRACEUR AVANT LE CHOIX. La bannière ne déclenche rien elle-même ;
 *     c'est `AnalyticsRuntime` qui observe l'état et ne charge le SDK qu'après
 *     acceptation. Vérifié dans l'onglet réseau, pas seulement dans le code.
 *  3. GRANULARITÉ. Trois finalités distinctes, dont une seule est imposée parce
 *     qu'elle est exemptée (l'enregistrement du choix lui-même). Aucune case
 *     n'est pré-cochée : l'état de départ du panneau est le refus.
 *  4. RÉVERSIBILITÉ. Un lien permanent en pied de page rouvre ce panneau
 *     (`ConsentPreferencesLink`, dans la rangée légale du pied de page), et « Retirer mon consentement » efface le choix.
 *  5. PAS DE BLOCAGE. Encart en bas d'écran, pas de voile, pas de modale
 *     plein écran : la page reste lisible et navigable pendant la décision.
 *     Le seul moment où le focus est piégé est le panneau « Personnaliser »,
 *     qui est alors un vrai dialogue et l'annonce (`aria-modal`).
 *
 * CE QU'ELLE NE FAIT PAS, DÉLIBÉRÉMENT : pas de croix de fermeture tant
 * qu'aucun choix n'existe (fermer sans choisir serait un consentement
 * implicite), pas de « en continuant votre navigation… », pas de compte à
 * rebours, pas de réouverture après un refus.
 */

const EASE = [0.68, 0, 0, 1] as const;

/** Interrupteur accessible — `role="switch"`, pilotable au clavier. */
function ConsentSwitch({
  checked,
  disabled = false,
  onChange,
  labelId,
  describedById,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  labelId: string;
  describedById: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={describedById}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      /* 44px de haut de zone tactile, obtenu par un remplissage vertical : la
         piste elle-même reste fine (22px) sans que la cible ne le soit. */
      className="group relative flex h-[44px] w-[44px] flex-none cursor-pointer items-center justify-end disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span
        aria-hidden
        className={
          "relative block h-[22px] w-[40px] rounded-pill transition-colors duration-200 motion-reduce:transition-none " +
          (checked ? "bg-accent" : "bg-white/20")
        }
      >
        <span
          className={
            "absolute top-[3px] block h-[16px] w-[16px] rounded-full transition-[left,background-color] duration-200 motion-reduce:transition-none " +
            (checked ? "left-[21px] bg-accent-ink" : "left-[3px] bg-white")
          }
        />
      </span>
    </button>
  );
}

function CategoryRow({
  title,
  body,
  checked,
  locked = false,
  disabled = false,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  locked?: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  const labelId = useId();
  const bodyId = useId();

  return (
    <li className="flex items-start justify-between gap-[16px] border-t border-white/10 pt-[12px] first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-[4px]">
        <p
          id={labelId}
          className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground"
        >
          {title}
        </p>
        <p
          id={bodyId}
          className="max-w-[300px] text-[12px] font-medium leading-[1.35] tracking-[-0.01em] text-white/70"
        >
          {body}
        </p>
      </div>
      {locked ? (
        <span
          className="mt-[2px] flex-none whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/70"
          aria-describedby={bodyId}
        >
          {consentCopy.alwaysOn}
        </span>
      ) : (
        <ConsentSwitch
          checked={checked}
          disabled={disabled}
          onChange={(next) => onChange?.(next)}
          labelId={labelId}
          describedById={bodyId}
        />
      )}
    </li>
  );
}

/**
 * PANNEAU « PERSONNALISER ».
 *
 * Il porte son propre brouillon et n'est monté QUE lorsqu'il est ouvert. Ce
 * n'est pas un détail d'organisation : l'état du brouillon doit repartir des
 * choix en vigueur à CHAQUE ouverture, et le faire depuis un effet de
 * synchronisation du parent était à la fois un rendu en cascade et une source
 * d'états incohérents. Ici, le montage EST la réinitialisation.
 *
 * Aucune case n'est pré-cochée : sans choix antérieur, `initial` vaut le refus
 * des deux finalités facultatives.
 */
function PreferencesPanel({
  initial,
  onSave,
  reduceMotion,
  transition,
  buttonClassName,
}: {
  initial: ConsentChoices;
  onSave: (choices: ConsentChoices) => void;
  reduceMotion: boolean;
  transition: Transition;
  buttonClassName: string;
}) {
  const [draft, setDraft] = useState<ConsentChoices>(initial);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={transition}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-[16px]">
        <ul className="flex flex-col gap-[12px] border-t border-white/10 pt-[16px]">
          <CategoryRow
            title={consentCopy.categories.necessary.title}
            body={consentCopy.categories.necessary.body}
            checked
            locked
          />
          <CategoryRow
            title={consentCopy.categories.analytics.title}
            body={consentCopy.categories.analytics.body}
            checked={draft.analytics}
            onChange={(next) =>
              setDraft(
                next
                  ? { ...draft, analytics: true }
                  : /* Couper la mesure coupe le rejeu : il passe par le même
                       SDK. L'interface dit donc la vérité de ce que fait
                       `consentAllows`. */
                    { analytics: false, replay: false },
              )
            }
          />
          <CategoryRow
            title={consentCopy.categories.replay.title}
            body={consentCopy.categories.replay.body}
            checked={draft.replay}
            disabled={!draft.analytics}
            onChange={(next) => setDraft({ ...draft, replay: next })}
          />
        </ul>

        <button
          type="button"
          onClick={() => onSave(draft)}
          className={`${buttonClassName} border border-white/25 bg-transparent text-foreground`}
        >
          {consentCopy.savePreferences}
        </button>
      </div>
    </motion.div>
  );
}

/** Éléments réellement atteignables au clavier (même filtre que FloatingNav). */
function focusablesIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, [tabindex]",
    ),
  ).filter((node) => node.tabIndex >= 0 && !node.hasAttribute("disabled"));
}

export function ConsentBanner() {
  const {
    ready,
    configured,
    record,
    choices,
    panelOpen,
    openPanel,
    closePanel,
    acceptAll,
    rejectAll,
    save,
    revoke,
  } = useConsent();

  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const hasDecision = record !== null;
  const visible = ready && configured && (!hasDecision || panelOpen);

  /* Fermeture par Échap. Deux comportements, et la nuance compte :
     - un choix existe déjà (panneau rouvert depuis le pied de page) : Échap
       referme tout, le choix précédent reste en vigueur ;
     - aucun choix : Échap replie le panneau et REVIENT au premier écran, il ne
       fait pas disparaître la bannière. Une bannière qu'on peut congédier sans
       choisir vaut consentement implicite. */
  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (panelOpen) closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel, panelOpen, visible]);

  /* Le focus n'entre dans la carte QUE quand le panneau est déplié : au premier
     écran, la bannière ne doit pas voler le focus à la page qu'on est en train
     de lire. */
  useEffect(() => {
    if (!panelOpen) return;
    focusablesIn(cardRef.current)[0]?.focus({ preventScroll: true });
  }, [panelOpen]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!panelOpen || event.key !== "Tab") return;
      const nodes = focusablesIn(cardRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey ? active === first : active === last) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    },
    [panelOpen],
  );

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.36, ease: EASE };

  /* Géométrie des deux boutons de premier niveau : STRICTEMENT la même chaîne.
     Écrite une fois, elle ne peut pas diverger — c'est ce qui garantit que le
     refus ne se dégrade pas au fil des retouches. */
  const decisionButton =
    "flex min-h-[44px] flex-1 items-center justify-center rounded-none px-[16px] " +
    "text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] " +
    "transition-opacity duration-200 hover:opacity-85 motion-reduce:transition-none";

  const linkButton =
    "inline-flex min-h-[44px] items-center whitespace-pre text-[11px] font-medium uppercase " +
    "leading-[1.2] tracking-[-0.01em] text-white/70 underline decoration-white/25 underline-offset-[3px] " +
    "transition-[color,text-decoration-color,text-underline-offset] duration-200 " +
    "hover:text-foreground hover:decoration-white hover:underline-offset-4 motion-reduce:transition-none";

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="consent-banner"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={transition}
          data-consent-ui=""
          /* PLACEMENT. Au-dessus du menu flottant (z-9) et de tout le contenu.
             Remontée à 88 px du bas tant qu'on n'est pas en desktop : la
             pastille du menu est centrée en bas et croiserait la carte sur les
             largeurs intermédiaires.

             CLICS. `pointer-events-none` sur l'enveloppe, `auto` sur la carte :
             l'enveloppe fait toute la largeur de la fenêtre alors que la carte
             plafonne à 460 px. Sans cela, la bande vide à sa droite avalerait
             les clics sur le contenu — et pendant l'animation de sortie, une
             carte déjà invisible continuerait de bloquer la page. */
          className="pointer-events-none fixed inset-x-[16px] bottom-[88px] z-[60] flex justify-start tablet:inset-x-[24px] desktop:inset-x-[30px] desktop:bottom-[20px]"
        >
          <div
            ref={cardRef}
            onKeyDown={onKeyDown}
            role={panelOpen ? "dialog" : "region"}
            aria-modal={panelOpen || undefined}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            /* Même matière que le panneau du menu flottant : fond très sombre
               translucide, flou d'arrière-plan, filet 1px en pseudo-élément
               (jamais un `border`, qui décalerait la boîte), angles vifs. */
            className="pointer-events-auto relative w-full max-w-[460px] overflow-hidden bg-[rgba(23,23,23,0.94)] [backdrop-filter:blur(9px)] before:pointer-events-none before:absolute before:inset-0 before:z-[2] before:border before:border-[rgba(255,255,255,0.12)] before:content-['']"
          >
            {/* HAUTEUR BORNÉE, avec défilement interne. Le panneau déplié
                mesure près de 700 px : sur un téléphone court (360 × 640) il
                dépasserait la fenêtre et ses boutons de décision deviendraient
                inatteignables — c'est-à-dire un refus impossible. La borne est
                calculée sur `svh` et non `vh` : sur iOS, `vh` compte la barre
                d'adresse rétractée et surestime la place disponible. */}
            <div className="relative z-[1] flex max-h-[calc(100svh-120px)] flex-col gap-[16px] overflow-y-auto p-[20px]">
              <div className="flex flex-col gap-[8px]">
                <p className="whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/60">
                  {consentCopy.eyebrow}
                </p>
                <h2
                  id={titleId}
                  className="accent-room text-[18px] font-semibold uppercase leading-[1.05] tracking-[-0.03em] text-foreground"
                >
                  {consentCopy.title}
                </h2>
                <p
                  id={descriptionId}
                  className="text-[13px] font-medium leading-[1.4] tracking-[-0.01em] text-white/70"
                >
                  {consentCopy.body}{" "}
                  <Link
                    href={consentCopy.policyHref}
                    className="text-foreground underline decoration-white/30 underline-offset-[3px] transition-colors duration-200 hover:text-accent motion-reduce:transition-none"
                  >
                    {consentCopy.policyLabel}
                  </Link>
                  .
                </p>
              </div>

              <AnimatePresence initial={false}>
                {panelOpen ? (
                  <PreferencesPanel
                    key="consent-panel"
                    initial={choices}
                    onSave={save}
                    reduceMotion={Boolean(reduceMotion)}
                    transition={transition}
                    buttonClassName={decisionButton}
                  />
                ) : null}
              </AnimatePresence>

              {/* Premier écran : les deux décisions, de même poids. Même
                  chaîne de classes de géométrie, deux aplats pleins, refus en
                  premier. Mesuré au rendu : 206 × 44 px l'un comme l'autre. */}
              <div className="flex flex-row gap-[8px]">
                <button
                  type="button"
                  onClick={rejectAll}
                  className={`${decisionButton} bg-foreground text-background`}
                >
                  {consentCopy.rejectAll}
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className={`${decisionButton} bg-accent text-accent-ink`}
                >
                  {consentCopy.acceptAll}
                </button>
              </div>

              <div className="flex flex-row flex-wrap items-center justify-between gap-x-[16px]">
                {panelOpen ? (
                  <button type="button" onClick={closePanel} className={linkButton}>
                    {hasDecision ? consentCopy.close : consentCopy.back}
                  </button>
                ) : (
                  <button type="button" onClick={openPanel} className={linkButton}>
                    {consentCopy.customise}
                  </button>
                )}

                {hasDecision ? (
                  <button type="button" onClick={revoke} className={linkButton}>
                    {consentCopy.revoke}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
