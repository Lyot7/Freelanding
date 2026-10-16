"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";

/**
 * Bascule du pied de page entre ÉCRIRE et RÉSERVER (2026-10-15).
 *
 * Idée d'Eliott : un seul bloc minimal qui laisse le choix entre un petit
 * message et un rendez-vous en visio, le second préparé par quelques questions
 * (sujet, objectif, budget, échéance) avant la confirmation. Les deux panneaux
 * restent montés : changer d'onglet ne perd ni la saisie ni le créneau choisi.
 *
 * Sans rendez-vous configuré, il ne reste qu'une porte : pas d'onglets.
 */
const ANCRE_RENDEZ_VOUS = "#rendez-vous";

/**
 * Nombre de demandes d'ouverture du rendez-vous : arrivée sur la page avec
 * l'ancre, clic sur un lien vers elle, changement d'ancre. Un COMPTEUR et non
 * l'ancre elle-même : les liens de Next posent l'ancre par `pushState`, sans
 * `hashchange`, et un second clic sur le même lien ne la change pas.
 */
let demandesRendezVous =
  typeof window !== "undefined" && window.location.hash === ANCRE_RENDEZ_VOUS ? 1 : 0;

function abonnerDemandes(rappel: () => void): () => void {
  const surClic = (evenement: MouseEvent) => {
    const cible = evenement.target;
    const lien = cible instanceof Element ? cible.closest("a[href]") : null;
    if (lien?.getAttribute("href")?.endsWith(ANCRE_RENDEZ_VOUS)) {
      demandesRendezVous += 1;
      rappel();
    }
  };
  const surAncre = () => {
    if (window.location.hash !== ANCRE_RENDEZ_VOUS) return;
    demandesRendezVous += 1;
    rappel();
  };
  document.addEventListener("click", surClic, true);
  window.addEventListener("hashchange", surAncre);
  return () => {
    document.removeEventListener("click", surClic, true);
    window.removeEventListener("hashchange", surAncre);
  };
}

function lireDemandes(): number {
  return demandesRendezVous;
}

export function FooterContact({
  modes,
  message,
  rendezVous,
  ongletInitial = "message",
}: {
  modes?: { label: string; message: string; rendezVous: string };
  message: ReactNode;
  rendezVous?: ReactNode;
  /** « rendezVous » quand l'adresse porte un sujet (`?sujet=`). */
  ongletInitial?: "message" | "rendezVous";
}) {
  // Un lien vers `#rendez-vous` (boutons « Réserver » des pages) ouvre
  // l'onglet rendez-vous, même quand le visiteur avait choisi l'autre.
  const demandes = useSyncExternalStore(abonnerDemandes, lireDemandes, () => 0);
  const [choisi, setOnglet] = useState<"message" | "rendezVous" | null>(null);
  const [demandesVues, setDemandesVues] = useState(demandes);
  if (demandes !== demandesVues) {
    setDemandesVues(demandes);
    setOnglet(null);
  }
  const onglet =
    choisi ?? (demandes > 0 || ongletInitial === "rendezVous" ? "rendezVous" : "message");
  const base = useId();
  if (!rendezVous || !modes) return <>{message}</>;

  const onglets = [
    { id: "message", libelle: modes.message },
    { id: "rendezVous", libelle: modes.rendezVous },
  ] as const;

  return (
    <div className="flex w-full flex-col gap-[24px]">
      <div
        role="tablist"
        aria-label={modes.label}
        className="relative grid w-full grid-cols-2 border border-white/10 p-[4px] tablet:max-w-[440px]"
        onKeyDown={(evenement) => {
          if (evenement.key !== "ArrowLeft" && evenement.key !== "ArrowRight") return;
          evenement.preventDefault();
          const suivant = onglet === "message" ? "rendezVous" : "message";
          setOnglet(suivant);
          document.getElementById(`${base}-onglet-${suivant}`)?.focus();
        }}
      >
        {/* Pastille volt qui glisse sous l'onglet actif : une seule boîte
            déplacée en `transform`, jamais deux fonds qui s'échangent. */}
        <span
          aria-hidden
          className="footer-onglet-pastille absolute inset-y-[4px] left-[4px] w-[calc(50%-4px)] bg-accent"
          style={{ transform: onglet === "message" ? "translateX(0)" : "translateX(100%)" }}
        />
        {onglets.map(({ id, libelle }) => {
          const actif = onglet === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${base}-onglet-${id}`}
              aria-selected={actif}
              aria-controls={`${base}-panneau-${id}`}
              tabIndex={actif ? 0 : -1}
              onClick={() => setOnglet(id)}
              className={`footer-onglet relative z-[1] flex min-h-[44px] items-center justify-center px-[12px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] ${
                actif ? "text-accent-ink" : "text-foreground-60 hover:text-foreground"
              }`}
            >
              {libelle}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${base}-panneau-message`}
        aria-labelledby={`${base}-onglet-message`}
        hidden={onglet !== "message"}
        className="footer-panneau w-full"
      >
        {message}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panneau-rendezVous`}
        aria-labelledby={`${base}-onglet-rendezVous`}
        hidden={onglet !== "rendezVous"}
        className="footer-panneau w-full"
      >
        {rendezVous}
      </div>
    </div>
  );
}
