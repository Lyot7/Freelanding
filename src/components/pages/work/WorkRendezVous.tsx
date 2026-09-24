import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { lienRendezVous } from "@/content/rendez-vous";
import { uiLabels } from "@/content/ui";
import type { WorkItem } from "@/lib/content";

/**
 * Fin de fiche projet : « Un besoin proche ? » + « Réserver un appel ».
 *
 * La fiche finissait sur « Projet suivant » puis le pied de page : aucune
 * action pour le lecteur que le projet venait de convaincre (audit des
 * parcours, 2026-09-24). Le sujet du rendez-vous vient de la fiche
 * (`sujetRendezVous`), « découverte » à défaut.
 *
 * GRAMMAIRE DES SECTIONS SOMBRES DU SITE : deux moitiés séparées par le filet
 * central, surtitre à gauche, titre à droite en capitales serrées, bouton volt
 * de 30 px identique à celui des pages de prestation.
 */
export function WorkRendezVous({ work }: { work: WorkItem }) {
  const labels = uiLabels.work;
  return (
    <section
      aria-labelledby="rendez-vous-projet-titre"
      className="relative flex w-full flex-col items-center overflow-hidden bg-background px-[20px] pb-[60px] pt-[40px] text-foreground tablet:px-[24px] tablet:pb-[90px] tablet:pt-[60px] desktop:px-[30px]"
    >
      <div className="relative z-[2] flex w-full max-w-[1440px] flex-col gap-[20px] tablet:flex-row tablet:gap-0">
        <p className="m-0 w-full text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 tablet:w-1/2">
          {labels.rendezVousEyebrow}
        </p>
        <div className="flex w-full flex-col items-start gap-[24px] tablet:w-1/2 tablet:pl-[30px] desktop:pl-[40px]">
          <h2
            id="rendez-vous-projet-titre"
            className="m-0 flex flex-col text-[44px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[52px] desktop:text-[68px]"
          >
            {labels.rendezVousTitleLines.map((ligne, i) => (
              <span
                key={ligne}
                className="accent-room descender-room block overflow-hidden leading-[0.82]"
              >
                <Reveal
                  as="span"
                  className="inline-block whitespace-pre"
                  initialOpacity={0.001}
                  initialY={40}
                  duration={0.8}
                  delay={0.1 * i}
                >
                  {ligne}
                </Reveal>
              </span>
            ))}
          </h2>
          <Link
            href={lienRendezVous(work.sujetRendezVous ?? "decouverte")}
            className="flex h-[30px] w-fit flex-none items-center justify-center bg-accent px-[10px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background no-underline transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
          >
            {labels.rendezVousLabel}
          </Link>
        </div>
      </div>
      {/* Filet vertical central, comme les autres sections sombres. */}
      <div className="absolute left-[calc(50%-0.5px)] top-0 z-[1] hidden h-full w-px bg-foreground opacity-[0.1] tablet:block" />
    </section>
  );
}
