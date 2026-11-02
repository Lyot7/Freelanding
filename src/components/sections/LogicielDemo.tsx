"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import { tranche, useProgressionDefilement } from "@/components/motion/useProgressionDefilement";
import { duree } from "@/lib/duree";
import type { LogicielDemoContent } from "@/lib/content/types";

type Onglet = "main" | "outil";

/**
 * UNE SEMAINE DE BUREAU, À LA MAIN PUIS AVEC MOI.
 *
 * Chaque jour porte sa corvée, à sa hauteur réelle. Avec moi, il n'en reste
 * qu'un cinquième à relire et le reste monte en volt, jour après jour : le temps
 * rendu se voit dans l'agenda avant de se lire dans le total.
 *
 * AU DÉFILEMENT depuis le 2026-11-02 (demande d'Eliott) : la semaine se
 * convertit jour après jour à mesure qu'on descend, et revient à la main si
 * l'on remonte. Le dernier jour rempli, la fenêtre passe sur « Avec moi ».
 * Dès que le visiteur touche un onglet, le défilement ne pilote plus rien.
 * En mouvement réduit, la fenêtre bascule une seule fois, à moitié visible.
 *
 * Le volt monte en `transform` (`scaleY`), jamais en hauteur.
 * Les onglets suivent le motif ARIA (flèches gauche et droite, un seul arrêt de
 * tabulation).
 */
export function LogicielDemo({ demo }: { demo: LogicielDemoContent["demo"] }) {
  const [onglet, setOnglet] = useState<Onglet>("main");
  const touche = useRef(false);
  const [libre, setLibre] = useState(false);
  // Côté où se trouve la pastille pendant qu'elle glisse : l'onglet qu'elle
  // couvre prend l'encre sombre, l'autre reste lisible sur le fond.
  const [pastilleOutil, setPastilleOutil] = useState(false);
  const base = useId();
  const fenetre = useRef<HTMLDivElement | null>(null);
  const { progression, actif } = useProgressionDefilement(fenetre);
  const pilote = actif && !libre;
  const pilotage = useRef(pilote);
  useEffect(() => {
    pilotage.current = pilote;
  }, [pilote]);

  useEffect(() => {
    if (!pilote) return;
    const suivre = (p: number) => {
      setOnglet(p >= 1 ? "outil" : "main");
      setPastilleOutil(p >= 0.5);
    };
    suivre(progression.get());
    return progression.on("change", suivre);
  }, [pilote, progression]);

  /* Tout le reste de la fenêtre suit le défilement au même pas que la
     semaine (2026-11-02) : la pastille glisse, les heures de saisie fondent et
     les heures rendues montent minute par minute, l'aplat volt se remplit.
     Écrit dans le DOM sans repasser par React ; les valeurs lues par les
     lecteurs d'écran restent celles de l'onglet, en texte masqué. */
  const pastille = useRef<HTMLSpanElement>(null);
  const saisie = useRef<HTMLSpanElement>(null);
  const panneauGain = useRef<HTMLParagraphElement>(null);
  const rendues = useRef<HTMLSpanElement>(null);
  const detail = useRef<HTMLParagraphElement>(null);
  const { main: avant, outil: apres } = demo.compteur;
  const gainMinutes = demo.gain.minutes;
  useLayoutEffect(() => {
    const glisse = pastille.current;
    const texteSaisie = saisie.current?.firstChild;
    const panneau = panneauGain.current;
    const texteRendues = rendues.current?.firstChild;
    const note = detail.current;
    if (!pilote || !glisse || !texteSaisie || !panneau || !texteRendues || !note) return;
    glisse.style.transition = "none";
    panneau.style.transition = "none";
    note.style.transition = "none";
    const poser = (p: number) => {
      glisse.style.transform = `translateX(${p * 100}%)`;
      texteSaisie.nodeValue = duree(Math.round(avant.minutes + (apres.minutes - avant.minutes) * p));
      texteRendues.nodeValue = duree(Math.round(gainMinutes * p));
      const part = `${Math.round(p * 100)}%`;
      panneau.style.backgroundColor = `color-mix(in oklab, var(--color-accent) ${part}, transparent)`;
      panneau.style.color = `color-mix(in oklab, var(--color-accent-ink) ${part}, rgb(255 255 255 / 0.3))`;
      note.style.opacity = String(0.4 + 0.6 * p);
    };
    poser(progression.get());
    const arreter = progression.on("change", poser);
    return () => {
      arreter();
      for (const element of [glisse, panneau, note]) element.style.transition = "";
      panneau.style.backgroundColor = "";
      panneau.style.color = "";
      note.style.opacity = "";
    };
  }, [apres.minutes, avant.minutes, gainMinutes, pilote, progression]);

  /* Ref de rappel avec nettoyage (React 19) : appelée une fois le nœud posé,
     jamais avec `null` puisqu'elle rend sa fonction de nettoyage. */
  const observer = useCallback((cible: HTMLDivElement) => {
    fenetre.current = cible;
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree?.isIntersecting || touche.current || pilotage.current) return;
        observateur.disconnect();
        minuteur = setTimeout(() => {
          if (!touche.current && !pilotage.current) setOnglet("outil");
        }, 1400);
      },
      { threshold: 0.5 },
    );
    observateur.observe(cible);
    return () => {
      fenetre.current = null;
      observateur.disconnect();
      if (minuteur) clearTimeout(minuteur);
    };
  }, []);

  const choisir = (suivant: Onglet) => {
    touche.current = true;
    setLibre(true);
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
            ref={pastille}
            className="logiciel-pastille absolute inset-y-[4px] left-[4px] w-[calc(50%-4px)] rounded-[50px] bg-accent"
            style={pilote ? undefined : { transform: avecLogiciel ? "translateX(100%)" : "none" }}
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
                (pilote ? (cle === "outil") === pastilleOutil : onglet === cle)
                  ? "text-accent-ink"
                  : "text-foreground-60 hover:text-foreground"
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
            <span className="sr-only">{compteur.valeur}</span>
            {/* `key` : un nœud neuf quand le défilement prend ou rend la main,
                pour que React ne garde jamais un texte écrit par l'animation. */}
            <span
              key={pilote ? "pilote" : "onglet"}
              ref={saisie}
              aria-hidden
              className="text-[40px] font-semibold leading-[1] tracking-[-0.04em] tabular-nums desktop:text-[52px]"
            >
              {pilote ? avant.valeur : compteur.valeur}
            </span>
            <span className="text-[13px] font-medium leading-[1.25] tracking-[-0.01em] text-foreground-60">
              {compteur.libelle}
            </span>
          </p>
          <p
            ref={panneauGain}
            className={`logiciel-gain m-0 flex flex-col gap-[6px] px-[16px] py-[18px] tablet:px-[20px] ${
              avecLogiciel ? "bg-accent text-accent-ink" : "text-foreground/30"
            }`}
          >
            <span className="sr-only">{avecLogiciel ? demo.gain.valeur : demo.gain.avant}</span>
            <span
              key={pilote ? "pilote" : "onglet"}
              ref={rendues}
              aria-hidden
              className="text-[40px] font-semibold leading-[1] tracking-[-0.04em] tabular-nums desktop:text-[52px]"
            >
              {pilote || !avecLogiciel ? demo.gain.avant : demo.gain.valeur}
            </span>
            <span className="text-[13px] font-medium leading-[1.25] tracking-[-0.01em]">
              {demo.gain.libelle}
            </span>
          </p>
        </div>

        <ul className="m-0 grid list-none grid-cols-5 gap-[4px] p-[12px] tablet:gap-[6px] tablet:px-[20px] tablet:py-[16px]">
          {demo.jours.map((jour, index) => (
            <Jour
              key={jour.jour}
              jour={jour}
              index={index}
              total={demo.jours.length}
              avecLogiciel={avecLogiciel}
              progression={progression}
              pilote={pilote}
              relire={demo.relire}
              votreMetier={demo.votreMetier}
            />
          ))}
        </ul>

        <div className="flex flex-col gap-[6px] border-t border-white/10 px-[16px] py-[14px] tablet:px-[20px]">
          <p
            ref={detail}
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

type JourDemo = LogicielDemoContent["demo"]["jours"][number];

/**
 * Un jour de la semaine. Piloté par le défilement (`pilote`), il se
 * remplit sur sa propre tranche, décalée d'un jour à l'autre : lundi part le
 * premier, vendredi finit quand la progression atteint 1. Sans pilote, il suit
 * l'onglet avec la transition de `.logiciel-rendu`, décalée de 70 ms par jour.
 */
function Jour({
  jour,
  index,
  total,
  avecLogiciel,
  progression,
  pilote,
  relire,
  votreMetier,
}: {
  jour: JourDemo;
  index: number;
  total: number;
  avecLogiciel: boolean;
  progression: MotionValue<number>;
  pilote: boolean;
  relire: string;
  votreMetier: string;
}) {
  const duree = 0.52;
  const depart = (index * (1 - duree)) / Math.max(1, total - 1);
  const texteMain = useRef<HTMLSpanElement>(null);
  const texteRelire = useRef<HTMLSpanElement>(null);
  const rendu = useRef<HTMLSpanElement>(null);

  /* Écrit dans le DOM à chaque image de défilement, sans repasser par React.
     Au nettoyage, seuls l'opacité et la transition sont rendues aux classes :
     la transformation, React la repose lui-même dès qu'il ne pilote plus.
     Avant la peinture : une page rechargée à mi-section ne montre pas une
     image de semaine dans le mauvais état. */
  useLayoutEffect(() => {
    const main = texteMain.current;
    const relu = texteRelire.current;
    const volt = rendu.current;
    if (!pilote || !main || !relu || !volt) return;
    for (const element of [main, relu, volt]) element.style.transition = "none";
    const poser = (p: number) => {
      const r = tranche(p, depart, depart + duree);
      volt.style.transform = `scaleY(${r})`;
      main.style.opacity = String(1 - r);
      relu.style.opacity = String(r);
    };
    poser(progression.get());
    const arreter = progression.on("change", poser);
    return () => {
      arreter();
      for (const element of [main, relu, volt]) element.style.transition = "";
      main.style.opacity = "";
      relu.style.opacity = "";
    };
  }, [depart, pilote, progression]);

  return (
    <li className="flex min-w-0 flex-col gap-[6px]">
      <span className="truncate text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60 tablet:text-[12px]">
        {jour.jour}
      </span>
      <span className="flex h-[230px] flex-col gap-[2px] tablet:h-[260px]">
        <span
          className="relative block overflow-hidden bg-white/[0.14]"
          style={{ height: `${jour.part * 72}%` }}
        >
          <span
            ref={texteMain}
            aria-hidden={avecLogiciel}
            className={`logiciel-jour absolute inset-0 flex flex-col gap-[2px] p-[4px] text-[11px] tablet:p-[6px] font-medium hyphens-auto leading-[1.15] tracking-[-0.01em] tablet:text-[12px] ${
              pilote ? "" : avecLogiciel ? "opacity-0" : "opacity-100"
            }`}
          >
            {jour.tache}
            <span className="tabular-nums text-foreground-60">{jour.main}</span>
          </span>
          <span
            ref={texteRelire}
            aria-hidden={!avecLogiciel}
            className={`logiciel-jour absolute inset-x-0 top-0 h-[20%] truncate px-[6px] pt-[3px] text-[11px] font-medium leading-none text-foreground-60 ${
              pilote ? "" : avecLogiciel ? "opacity-100" : "opacity-0"
            }`}
          >
            {relire}
          </span>
          <span
            ref={rendu}
            aria-hidden={!avecLogiciel}
            className="logiciel-rendu absolute inset-x-0 bottom-0 flex h-[80%] flex-col gap-[2px] bg-accent p-[4px] text-[11px] tablet:p-[6px] font-medium hyphens-auto leading-[1.15] tracking-[-0.01em] text-accent-ink tablet:text-[12px]"
            style={
              pilote
                ? undefined
                : {
                    transform: `scaleY(${avecLogiciel ? 1 : 0})`,
                    transitionDelay: `${index * 70}ms`,
                  }
            }
          >
            <span className="text-[14px] font-semibold tabular-nums leading-none tablet:text-[16px]">
              {jour.rendu}
            </span>
            {jour.tache}
          </span>
        </span>
        <span className="flex-1 bg-white/[0.05] p-[4px] text-[11px] tablet:p-[6px] font-medium hyphens-auto leading-[1.15] tracking-[-0.01em] text-foreground-60 tablet:text-[12px]">
          {votreMetier}
        </span>
      </span>
    </li>
  );
}
