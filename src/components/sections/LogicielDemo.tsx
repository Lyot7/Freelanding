"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { LogicielDemoContent } from "@/lib/content/types";

type Onglet = "main" | "outil";

/**
 * UNE SEMAINE DE BUREAU, À LA MAIN PUIS AVEC MOI.
 *
 * Chaque jour porte sa corvée, à sa hauteur réelle. Avec moi, il n'en reste
 * qu'un cinquième à relire et le reste monte en volt, jour après jour : le temps
 * rendu se voit dans l'agenda avant de se lire dans le total. La fenêtre s'ouvre
 * sur « À la main » et bascule une seule fois quand elle est à moitié visible ;
 * dès que le visiteur touche un onglet, plus rien ne bascule seul.
 *
 * Le volt monte en `transform`, via `.logiciel-rendu`, coupé en mouvement réduit.
 * Les onglets suivent le motif ARIA (flèches gauche et droite, un seul arrêt de
 * tabulation).
 */
export function LogicielDemo({ demo }: { demo: LogicielDemoContent["demo"] }) {
  const [onglet, setOnglet] = useState<Onglet>("main");
  const touche = useRef(false);
  const base = useId();

  /* Ref de rappel avec nettoyage (React 19) : appelée une fois le nœud posé,
     jamais avec `null` puisqu'elle rend sa fonction de nettoyage. */
  const observer = useCallback((cible: HTMLDivElement) => {
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree?.isIntersecting || touche.current) return;
        observateur.disconnect();
        minuteur = setTimeout(() => {
          if (!touche.current) setOnglet("outil");
        }, 1400);
      },
      { threshold: 0.5 },
    );
    observateur.observe(cible);
    return () => {
      observateur.disconnect();
      if (minuteur) clearTimeout(minuteur);
    };
  }, []);

  const choisir = (suivant: Onglet) => {
    touche.current = true;
    setOnglet(suivant);
  };

  const ordre: readonly Onglet[] = ["main", "outil"];
  const avecLogiciel = onglet === "outil";
  const compteur = demo.compteur[onglet];

  return (
    <div
      ref={observer}
      className="relative w-full border border-white/10 bg-surface-1 text-foreground"
    >
      <div className="flex flex-col gap-[14px] border-b border-white/10 px-[16px] py-[14px] tablet:px-[20px] min-[1360px]:flex-row min-[1360px]:items-center min-[1360px]:justify-between">
        <p className="m-0 text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
          {demo.titre}
        </p>
        <div
          role="tablist"
          aria-label={demo.titre}
          className="relative grid w-full grid-cols-2 rounded-[50px] border border-white/10 p-[4px] min-[1360px]:w-auto"
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const suivant = onglet === "main" ? "outil" : "main";
            choisir(suivant);
            document.getElementById(`${base}-onglet-${suivant}`)?.focus();
          }}
        >
          <span
            aria-hidden
            className="logiciel-pastille absolute inset-y-[4px] left-[4px] w-[calc(50%-4px)] rounded-[50px] bg-accent"
            style={{ transform: avecLogiciel ? "translateX(100%)" : "none" }}
          />
          {ordre.map((cle) => (
            <button
              key={cle}
              id={`${base}-onglet-${cle}`}
              type="button"
              role="tab"
              aria-selected={onglet === cle}
              aria-controls={`${base}-panneau`}
              tabIndex={onglet === cle ? 0 : -1}
              onClick={() => choisir(cle)}
              className={`relative z-[1] h-[36px] whitespace-nowrap rounded-[50px] px-[16px] text-[12px] font-semibold uppercase leading-none tracking-[-0.01em] transition-colors duration-200 ${
                onglet === cle ? "text-accent-ink" : "text-foreground-60 hover:text-foreground"
              }`}
            >
              {demo.onglets[cle]}
            </button>
          ))}
        </div>
      </div>

      <div
        id={`${base}-panneau`}
        role="tabpanel"
        aria-labelledby={`${base}-onglet-${onglet}`}
        aria-live="polite"
      >
        <div className="grid grid-cols-2 border-b border-white/10">
          <p className="m-0 flex flex-col gap-[6px] border-r border-white/10 px-[16px] py-[18px] tablet:px-[20px]">
            <span className="text-[40px] font-semibold leading-[1] tracking-[-0.04em] tabular-nums desktop:text-[52px]">
              {compteur.valeur}
            </span>
            <span className="text-[13px] font-medium leading-[1.25] tracking-[-0.01em] text-foreground-60">
              {compteur.libelle}
            </span>
          </p>
          <p
            className={`logiciel-gain m-0 flex flex-col gap-[6px] px-[16px] py-[18px] tablet:px-[20px] ${
              avecLogiciel ? "bg-accent text-accent-ink" : "text-foreground/30"
            }`}
          >
            <span className="text-[40px] font-semibold leading-[1] tracking-[-0.04em] tabular-nums desktop:text-[52px]">
              {avecLogiciel ? demo.gain.valeur : demo.gain.avant}
            </span>
            <span className="text-[13px] font-medium leading-[1.25] tracking-[-0.01em]">
              {demo.gain.libelle}
            </span>
          </p>
        </div>

        <ul className="m-0 grid list-none grid-cols-5 gap-[4px] p-[12px] tablet:gap-[6px] tablet:px-[20px] tablet:py-[16px]">
          {demo.jours.map((jour, index) => (
            <li key={jour.jour} className="flex min-w-0 flex-col gap-[6px]">
              <span className="truncate text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60 tablet:text-[12px]">
                {jour.jour}
              </span>
              <span className="flex h-[230px] flex-col gap-[2px] tablet:h-[260px]">
                <span
                  className="relative block overflow-hidden bg-white/[0.14]"
                  style={{ height: `${jour.part * 72}%` }}
                >
                  <span
                    aria-hidden={avecLogiciel}
                    className={`logiciel-jour absolute inset-0 flex flex-col gap-[2px] p-[4px] text-[10px] tablet:p-[6px] font-medium leading-[1.15] tracking-[-0.01em] tablet:text-[12px] ${
                      avecLogiciel ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    {jour.tache}
                    <span className="tabular-nums text-foreground-60">{jour.main}</span>
                  </span>
                  <span
                    aria-hidden={!avecLogiciel}
                    className={`logiciel-jour absolute inset-x-0 top-0 h-[20%] truncate px-[6px] pt-[3px] text-[10px] font-medium leading-none text-foreground-60 ${
                      avecLogiciel ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {demo.relire}
                  </span>
                  <span
                    aria-hidden={!avecLogiciel}
                    className="logiciel-rendu absolute inset-x-0 bottom-0 flex h-[80%] flex-col gap-[2px] bg-accent p-[4px] text-[10px] tablet:p-[6px] font-medium leading-[1.15] tracking-[-0.01em] text-accent-ink tablet:text-[12px]"
                    style={{
                      transform: `scaleY(${avecLogiciel ? 1 : 0})`,
                      transitionDelay: `${index * 70}ms`,
                    }}
                  >
                    <span className="text-[14px] font-semibold tabular-nums leading-none tablet:text-[16px]">
                      {jour.rendu}
                    </span>
                    {jour.tache}
                  </span>
                </span>
                <span className="flex-1 bg-white/[0.05] p-[4px] text-[10px] tablet:p-[6px] font-medium leading-[1.15] tracking-[-0.01em] text-foreground-60 tablet:text-[12px]">
                  {demo.votreMetier}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-[6px] border-t border-white/10 px-[16px] py-[14px] tablet:px-[20px]">
          <p
            className={`m-0 text-[15px] font-medium leading-[1.35] tracking-[-0.01em] transition-opacity duration-300 ${
              avecLogiciel ? "opacity-100" : "opacity-40"
            }`}
          >
            {demo.gain.detail}
          </p>
          <p className="m-0 text-[12px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground-60">
            {avecLogiciel ? `${demo.preuve} ${demo.note}` : demo.note}
          </p>
        </div>
      </div>
    </div>
  );
}
