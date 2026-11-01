import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { ParallaxBackdrop } from "@/components/motion/ParallaxBackdrop";
import { Highlighted } from "@/components/ui/Highlighted";
import { LogicielDemo } from "@/components/sections/LogicielDemo";
import { SignatureMark } from "@/components/sections/SignatureMark";
import { siteFeatures } from "@/content/features";
import { methodePromise } from "@/content/testimonials";
import type { LogicielDemoContent } from "@/lib/content/types";

/**
 * LA SECTION NOIRE MONTRE LE LOGICIEL AU TRAVAIL (2026-10-16).
 *
 * Elle répond, pour l'outil, à ce que « On vous compare avant d'appeler » fait
 * pour le site : une raison de lire, puis la preuve. Moitié gauche le titre et
 * ce que l'outil change ; moitié droite la démonstration, une même tâche faite
 * à la main puis par l'outil.
 *
 * ELLE REMPLACE LA PRISE DE PAROLE SUR LA MÉTHODE et en garde la citation,
 * signée, en pied de section : « ce que je vends commence là où un abonnement
 * ne suffit plus » est le meilleur seuil d'entrée vers un logiciel sur mesure.
 */
export function LogicielSection({
  logiciel,
  bottomAccent,
}: {
  logiciel: LogicielDemoContent;
  /** Bande claire en bas à droite : elle annonce la section claire qui suit. */
  bottomAccent?: "muted";
}) {
  const auteur = methodePromise.author;
  const portrait = auteur?.avatar;

  return (
    <section
      id="logiciel"
      data-section="logiciel"
      className="relative flex w-full flex-col items-center overflow-hidden bg-background py-section px-[20px] text-foreground tablet:px-[24px] desktop:px-[30px]"
    >
      <span aria-hidden className="absolute inset-y-0 left-1/2 z-[1] hidden w-px bg-white/10 tablet:block" />

      <div className="relative z-[2] grid w-full max-w-[1440px] gap-[36px] tablet:grid-cols-2 tablet:gap-x-0 tablet:gap-y-[60px]">
        <div className="flex flex-col gap-[24px] tablet:pr-[24px] desktop:pr-[30px]">
          <p className="m-0 micro text-foreground-60">
            {logiciel.eyebrow}
          </p>
          <h2 className="m-0 flex flex-col titre-marque titre-section ">
            {logiciel.titleLines.map((ligne, i) => (
              <span key={ligne} className="accent-room descender-room block overflow-hidden leading-display">
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
          <Reveal
            as="p"
            initialOpacity={0.001}
            delay={0.2}
            className="m-0 max-w-[46ch] text-[16px] font-medium leading-[1.45] tracking-[-0.01em] text-foreground-60 tablet:text-[18px] desktop:text-[18px]"
          >
            <Highlighted
              text={logiciel.statement}
              highlights={[...(logiciel.statementEmphasis ?? [])]}
              highlightClassName="text-foreground"
            />
          </Reveal>
          <Link
            href={logiciel.cta.href}
            className="cta-primaire w-fit"
          >
            {logiciel.cta.label}
          </Link>
        </div>

        <Reveal
          initialOpacity={0.001}
          initialY={30}
          delay={0.15}
          className="w-full tablet:pl-[24px] desktop:pl-[30px] tablet:self-center"
        >
          <LogicielDemo demo={logiciel.demo} />
        </Reveal>

        {/* La citation signée, en pied : l'auteur à gauche, la phrase à droite. */}
        <div className="flex items-end gap-[20px] tablet:pr-[24px] desktop:gap-[30px] desktop:pr-[30px]">
          {portrait ? (
            <div className="relative h-[120px] w-[98px] flex-none overflow-hidden desktop:h-[150px] desktop:w-[122px]">
              <ParallaxBackdrop src={portrait.src} overshoot={0.06} label={portrait.alt} reveal />
            </div>
          ) : null}
          <Reveal initialOpacity={0.001} delay={0.1} className="flex flex-col gap-[5px]">
            <p className="m-0 whitespace-pre text-[14px] font-medium leading-[1.3] tracking-[-0.01em]">
              {auteur?.name}
            </p>
            {auteur?.role ? (
              <p className="m-0 whitespace-pre text-[12px] font-medium leading-[1.2] tracking-[-0.01em] opacity-70">
                {auteur.role}
              </p>
            ) : null}
            {siteFeatures.signature ? (
              <SignatureMark className="mt-[6px] block h-auto w-[140px] opacity-90 desktop:w-[170px]" />
            ) : null}
          </Reveal>
        </div>
        <p className="m-0 w-full text-[22px] font-medium leading-[1.2] tracking-[-0.01em] tablet:self-end tablet:pl-[24px] tablet:text-right desktop:pl-[30px] desktop:text-[26px]">
          <LineReveal
            text={methodePromise.quote}
            className="block w-full"
            lineClassName="w-full overflow-hidden"
            delay={0.1}
          />
        </p>
      </div>

      {bottomAccent === "muted" ? (
        <div className="absolute bottom-0 right-0 z-[2] h-[20px] w-1/2 bg-muted tablet:h-[30px]" />
      ) : null}
    </section>
  );
}
