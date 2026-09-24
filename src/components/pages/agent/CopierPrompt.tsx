"use client";

import { useEffect, useRef, useState } from "react";

type Etat = "repos" | "fait" | "echec";

/**
 * Copie le prompt dans le presse-papiers. Aucun appel réseau : le texte est
 * déjà dans la page, rendu au serveur.
 *
 * REPLI sans API Clipboard (contexte non sécurisé, navigateur ancien) : une
 * zone de texte hors écran, sélectionnée puis copiée, et le focus rendu à
 * l'élément qui l'avait. Si les deux échouent, le prompt complet s'affiche
 * dans un cadre, déjà sélectionné : le visiteur n'a plus qu'à copier.
 */
async function copier(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    const focus = document.activeElement;
    const zone = document.createElement("textarea");
    zone.value = texte;
    zone.setAttribute("readonly", "");
    Object.assign(zone.style, { position: "fixed", top: "0", left: "0", opacity: "0" });
    document.body.appendChild(zone);
    zone.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    zone.remove();
    if (focus instanceof HTMLElement) focus.focus();
    return ok;
  }
}

export function CopierPrompt({
  prompt,
  libelles,
  className,
  conteneur,
  ton = "sombre",
}: {
  prompt: string;
  libelles: {
    action: string;
    fait: string;
    suite: string;
    echec: string;
    zone: string;
  };
  className?: string;
  /** Classes du bloc bouton + message (alignement). */
  conteneur?: string;
  /** Fond sur lequel le bouton est posé : règle la couleur du message. */
  ton?: "sombre" | "clair";
}) {
  const [etat, setEtat] = useState<Etat>("repos");
  const minuterie = useRef<number | undefined>(undefined);
  const zone = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => window.clearTimeout(minuterie.current), []);

  useEffect(() => {
    if (etat === "echec") zone.current?.select();
  }, [etat]);

  const auClic = async () => {
    const ok = await copier(prompt);
    setEtat(ok ? "fait" : "echec");
    window.clearTimeout(minuterie.current);
    if (ok) minuterie.current = window.setTimeout(() => setEtat("repos"), 4000);
  };

  const encre = ton === "sombre" ? "text-white/75" : "text-background/75";

  return (
    <div className={`flex flex-col items-start gap-[12px] ${conteneur ?? ""}`}>
      <button
        type="button"
        onClick={auClic}
        className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[10px] px-[18px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] motion-reduce:transition-none ${className ?? ""}`}
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-[14px] w-[14px] flex-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {etat === "fait" ? (
            <path d="M3 8.5l3 3 7-7" />
          ) : (
            <>
              <rect x="5" y="5" width="8.5" height="8.5" />
              <path d="M2.5 10.5V2.5h8" />
            </>
          )}
        </svg>
        {etat === "fait" ? libelles.fait : libelles.action}
      </button>
      {/* Zone de statut SÉPARÉE du bouton : placée dans le bouton, elle le
          renommait, et certains lecteurs d'écran annonçaient deux fois. */}
      <p role="status" className={`min-h-[1.4em] text-[14px] font-medium leading-[1.4] ${encre}`}>
        {etat === "fait" ? libelles.suite : etat === "echec" ? libelles.echec : ""}
      </p>
      {etat === "echec" ? (
        <textarea
          ref={zone}
          readOnly
          aria-label={libelles.zone}
          value={prompt}
          className="h-[200px] w-full max-w-[620px] resize-y border border-current/20 bg-transparent p-[12px] font-mono text-[12px] leading-[1.5]"
        />
      ) : null}
    </div>
  );
}
