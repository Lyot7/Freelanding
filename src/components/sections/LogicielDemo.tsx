"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { LogicielDemoContent } from "@/lib/content/types";

type Onglet = "main" | "outil";

/**
 * UNE MÊME TÂCHE, FAITE À LA MAIN PUIS PAR L'OUTIL.
 *
 * La fenêtre s'ouvre sur « À la main » et bascule une seule fois sur « Avec
 * l'outil » quand elle est à moitié visible : le visiteur voit la différence
 * sans avoir à cliquer. Dès qu'il touche un onglet, plus rien ne bascule seul.
 *
 * Les onglets suivent le motif ARIA (flèches gauche et droite, un seul arrêt
 * de tabulation). La pastille glisse en `transform`, comme celle du pied de
 * page ; les étapes entrent en fondu décalé, coupé en mouvement réduit.
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
  const etapes = demo[onglet];
  const restantes = etapes.filter((etape) => !etape.auto).length;

  return (
    <div
      ref={observer}
      className="relative w-full border border-white/10 bg-surface-1 text-foreground"
    >
      <div className="flex flex-col gap-[14px] border-b border-white/10 px-[16px] py-[14px] tablet:px-[20px] min-[1360px]:flex-row min-[1360px]:items-center min-[1360px]:justify-between">
        <p className="m-0 flex items-center gap-[10px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
          <span aria-hidden className="flex gap-[4px]">
            <span className="h-[6px] w-[6px] bg-white/20" />
            <span className="h-[6px] w-[6px] bg-white/20" />
            <span className="h-[6px] w-[6px] bg-white/20" />
          </span>
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
            style={{ transform: onglet === "outil" ? "translateX(100%)" : "none" }}
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
        <ol key={onglet} className="m-0 list-none p-0">
          {etapes.map((etape, index) => (
            <li
              key={etape.libelle}
              className="logiciel-etape grid grid-cols-[2.2ch_1fr_auto] items-baseline gap-[12px] border-b border-white/10 px-[16px] py-[14px] tablet:px-[20px]"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="text-[12px] font-medium leading-none text-foreground-60 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] font-medium leading-[1.3] tracking-[-0.01em] tablet:text-[16px]">
                {etape.libelle}
              </span>
              <span
                className={`flex items-center gap-[6px] whitespace-nowrap text-[11px] font-medium uppercase leading-none tracking-[-0.01em] ${
                  etape.auto ? "text-accent" : "text-foreground-60"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-[6px] w-[6px] ${etape.auto ? "bg-accent" : "border border-white/40"}`}
                />
                {etape.auto ? demo.acteurs.outil : demo.acteurs.vous}
              </span>
            </li>
          ))}
        </ol>
        <p
          key={`bilan-${onglet}`}
          className="logiciel-etape m-0 flex items-center gap-[12px] px-[16px] py-[18px] text-[16px] font-medium leading-[1.3] tracking-[-0.01em] tablet:px-[20px] tablet:text-[18px]"
          style={{ animationDelay: `${etapes.length * 70}ms` }}
        >
          <span
            aria-hidden
            className={`flex h-[28px] min-w-[28px] items-center justify-center px-[6px] text-[13px] font-semibold tabular-nums ${
              onglet === "outil" ? "bg-accent text-accent-ink" : "bg-white/10 text-foreground"
            }`}
          >
            {restantes}
          </span>
          {demo.bilan[onglet]}
        </p>
      </div>
    </div>
  );
}
