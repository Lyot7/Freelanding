"use client";

import { useInView } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { lireReponseCreneaux } from "@/lib/rendez-vous/creneaux";

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
 * Nombre de clics ou de changements d'ancre vers le rendez-vous. Un clic fait
 * sur la page ouvre l'onglet sans attendre l'ancre, et remet à zéro le choix
 * du visiteur : un second clic sur « Réserver » rouvre le rendez-vous même si
 * l'ancre n'a pas changé. Les liens de Next posent l'ancre par `pushState`,
 * sans `hashchange` : d'où l'écoute des clics.
 */
let demandesRendezVous = 0;

function abonnerDemandes(rappel: () => void): () => void {
  const surClic = (evenement: MouseEvent) => {
    const cible = evenement.target;
    const lien = cible instanceof Element ? cible.closest("a[href]") : null;
    if (lien?.getAttribute("href")?.endsWith(ANCRE_RENDEZ_VOUS)) {
      demandesRendezVous += 1;
      // Après le `pushState` du lien, pour lire la nouvelle ancre.
      window.setTimeout(rappel, 0);
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

function lireDemandesServeurOuClient(): number {
  return typeof window === "undefined" ? 0 : demandesRendezVous;
}

function lireAncre(): string {
  return window.location.hash;
}

/**
 * LE PROCHAIN CRÉNEAU RÉEL, lu quand le bloc approche de l'écran : ce pied de
 * page est sur toutes les pages, et chaque lecture coûte un appel à Cal.com. Rien
 * si l'agenda ne répond pas : la ligne disparaît, elle ne se remplace pas.
 */
function useProchainCreneau(actif: boolean): string | undefined {
  const [prochain, setProchain] = useState<string>();
  useEffect(() => {
    if (!actif) return;
    const controleur = new AbortController();
    fetch("/api/rendez-vous/creneaux?type=logiciel", { signal: controleur.signal })
      .then((reponse) => (reponse.ok ? reponse.json() : undefined))
      .then((charge: unknown) => {
        setProchain(lireReponseCreneaux(charge)?.jours[0]?.creneaux[0]?.resume);
      })
      .catch(() => undefined);
    return () => controleur.abort();
  }, [actif]);
  return prochain;
}

export function FooterContact({
  modes,
  message,
  rendezVous,
  ongletInitial = "message",
}: {
  modes?: {
    label: string;
    message: { titre: string; detail: string };
    rendezVous: { titre: string; prochain: string; promesse: string };
  };
  message: ReactNode;
  rendezVous?: ReactNode;
  /** « rendezVous » quand l'adresse porte un sujet (`?sujet=`). */
  ongletInitial?: "message" | "rendezVous";
}) {
  // Un lien vers `#rendez-vous` (boutons « Réserver » des pages) ouvre
  // l'onglet rendez-vous, même quand le visiteur avait choisi l'autre.
  const demandes = useSyncExternalStore(abonnerDemandes, lireDemandes, () => 0);
  const ancre = useSyncExternalStore(abonnerDemandes, lireAncre, () => "");
  // Les clics faits sur une page précédente ne comptent pas : le compteur vit
  // au niveau du module, ce pied de page se monte à chaque page.
  const [demandesAuMontage] = useState(lireDemandesServeurOuClient);
  const [choisi, setOnglet] = useState<"message" | "rendezVous" | null>(null);
  const [demandesVues, setDemandesVues] = useState(demandes);
  if (demandes !== demandesVues) {
    setDemandesVues(demandes);
    setOnglet(null);
  }
  const onglet =
    choisi ??
    (ancre === ANCRE_RENDEZ_VOUS || demandes > demandesAuMontage || ongletInitial === "rendezVous"
      ? "rendezVous"
      : "message");
  const base = useId();
  const bloc = useRef<HTMLDivElement>(null);
  const proche = useInView(bloc, { once: true, margin: "300px 0px" });
  const prochain = useProchainCreneau(proche && Boolean(rendezVous));
  if (!rendezVous || !modes) return <>{message}</>;

  const onglets = [
    { id: "message", titre: modes.message.titre, detail: modes.message.detail },
    {
      id: "rendezVous",
      titre: modes.rendezVous.titre,
      detail: prochain ? `${modes.rendezVous.prochain} ${prochain}` : undefined,
    },
  ] as const;

  return (
    // `data-section` : premier palier de l'entonnoir de rendez-vous
    // (`PageAnalytics`), porté par la section des pages avant le 2026-10-16.
    <div ref={bloc} data-section="rendez-vous" className="flex w-full flex-col gap-[24px]">
      <div
        role="tablist"
        aria-label={modes.label}
        className="relative grid w-full grid-cols-2 border border-white/10 p-[4px]"
        onKeyDown={(evenement) => {
          if (evenement.key !== "ArrowLeft" && evenement.key !== "ArrowRight") return;
          evenement.preventDefault();
          const suivant = onglet === "message" ? "rendezVous" : "message";
          setOnglet(suivant);
          document.getElementById(`${base}-onglet-${suivant}`)?.focus();
        }}
      >
        {/* Pastille qui glisse sous l'onglet actif : une seule boîte déplacée
            en `transform`. Elle reste discrète : le volt appartient à l'action,
            pas à l'onglet déjà choisi. */}
        <span
          aria-hidden
          className="footer-onglet-pastille absolute inset-y-[4px] left-[4px] w-[calc(50%-4px)] bg-white/10"
          style={{ transform: onglet === "message" ? "translateX(0)" : "translateX(100%)" }}
        />
        {onglets.map(({ id, titre, detail }) => {
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
              className={`footer-onglet relative z-[1] flex min-h-[64px] w-full flex-col items-start justify-center gap-[4px] px-[12px] text-left tracking-[-0.01em] tablet:px-[16px] ${
                actif ? "text-foreground" : "text-foreground-60 hover:text-foreground"
              }`}
            >
              <span className="text-[14px] font-semibold leading-[1.2]">{titre}</span>
              {detail ? (
                <span className="text-[12px] font-medium leading-[1.25] text-foreground-60">{detail}</span>
              ) : null}
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
        className="footer-panneau flex w-full flex-col gap-[16px]"
      >
        <p className="m-0 text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground-60">
          {modes.rendezVous.promesse}
        </p>
        {rendezVous}
      </div>
    </div>
  );
}
