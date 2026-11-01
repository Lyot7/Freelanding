"use client";

import type { CSSProperties, ReactNode } from "react";
import { preload } from "react-dom";
import type { HeroComparaison, HeroContent, HeroDoor, HeroProof, SiteConfig } from "@/lib/content/types";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import { HeroCadran } from "@/components/sections/HeroCadran";
import { HeroVideo } from "@/components/sections/HeroVideo";
import { Grain } from "@/components/effects/Grain";
import { ImageProgressive } from "@/components/ui/ImageProgressive";
import { lienRendezVous } from "@/content/rendez-vous";
import { uiLabels } from "@/content/ui";

/**
 * Héros de l'accueil, refait le 2026-10-15.
 *
 * UN TITRE DEPUIS LE 2026-11-01. Le h1 ne porte ni lien ni prix : au-dessus, ce
 * qui est vendu ; en bas, la comparaison de prix sourcée.
 *
 * CE QUI EST PARTI, et pourquoi. Le logotype géant « Bouquerel » redisait le
 * logo de l'en-tête et prenait le premier rang de lecture au titre ; le cadre
 * à coins, son verre flouté, le paraphe et les trois mots de métier
 * empilaient six éléments avant l'action. Eliott le trouvait « gros et pas
 * spécialement beau ».
 *
 * MOUVEMENT. Une seule entrée, en CSS (`globals.css`, bloc `.hero-*`) : le titre
 * monte de ses masques, tout le reste arrive d'un seul fondu et le cadran prend
 * le relais. Le CSS tourne hors du fil principal, donc l'entrée reste fluide
 * pendant que la page s'hydrate. `prefers-reduced-motion` ramène tout à un fondu.
 */

/** Décalage d'une ligne du titre, en millisecondes, porté par la variable `--d`. */
function delai(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

function Porte({ porte }: { porte: HeroDoor }) {
  return (
    <span
      data-part="hero-porte"
      className="titre-marque block text-[clamp(38px,calc(11.4vw/var(--zoom-ecran,1)),60px)] leading-[0.92] text-foreground tablet:text-[clamp(60px,min(calc(9.4vw/var(--zoom-ecran,1)),calc(21vh/var(--zoom-ecran,1))),150px)]"
    >
      {porte.lines.map((ligne, i) => (
        <span key={ligne} className="hero-ligne">
          <span
            style={delai(i * 70)}
          >
            {ligne}
            {i < porte.lines.length - 1 ? " " : null}
          </span>
        </span>
      ))}
    </span>
  );
}

function Preuve({ preuve }: { preuve: HeroProof }) {
  const valeur = (
    <span className="whitespace-nowrap text-[22px] font-medium leading-none tracking-[-0.045em] text-foreground tablet:text-[26px]">
      {preuve.value}
    </span>
  );
  const libelle = (
    <span className="min-w-0 max-w-[34ch] micro text-foreground-60 [text-wrap:balance]">
      {preuve.label}
      {preuve.source ? (
        <>
          <span className="mt-[4px] block normal-case">
            {uiLabels.hero.source}{" "}
            <a
              href={preuve.source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="cible-44 text-foreground-60 underline decoration-white/30 underline-offset-[3px] transition-colors duration-200 hover:text-foreground"
            >
              {preuve.source.label}
            </a>
          </span>
        </>
      ) : null}
    </span>
  );
  const classe = "hero-fond flex min-w-0 items-center gap-[12px]";
  return preuve.href ? (
    <a
      href={preuve.href}
      data-part="preuve"
      className={`${classe} no-underline [&>span:last-child]:transition-colors [&>span:last-child]:duration-200 hover:[&>span:last-child]:text-foreground`}
    >
      {valeur}
      {libelle}
    </a>
  ) : (
    <p data-part="preuve" className={`${classe} m-0`}>
      {valeur}
      {libelle}
    </p>
  );
}

/**
 * LE PRIX D'UNE AGENCE ET LE MIEN, POUR LE MÊME SITE (2026-10-16). Une seule
 * ligne discrète depuis la même journée (Eliott : « allège l'affichage, garde
 * la source ») : le sujet nomme ce qui est comparé, puis les deux prix, puis
 * la source. Mon prix porte la seule couleur.
 */
function Comparaison({ comparaison }: { comparaison: HeroComparaison }) {
  return (
    <p
      data-part="comparaison"
      className="hero-fond m-0 flex flex-wrap items-baseline gap-x-[16px] gap-y-[6px] micro text-foreground-60"
    >
      <span>{comparaison.sujet}</span>
      {comparaison.lignes.map((ligne) => (
        <span key={ligne.qui} className="flex flex-wrap items-baseline gap-x-[6px]">
          {ligne.qui}
          <span
            className={`text-[14px] normal-case tracking-[-0.01em] ${
              ligne.fort ? "text-accent" : "text-foreground"
            }`}
          >
            {ligne.prix}
          </span>
          {ligne.detail ? (
            <span className="text-[14px] normal-case tracking-[-0.01em] text-foreground-60">
              {ligne.detail}
            </span>
          ) : null}
        </span>
      ))}
      <span className="normal-case">
        {uiLabels.hero.source}{" "}
        <a
          href={comparaison.source.href}
          target="_blank"
          rel="noopener noreferrer"
          className="cible-44 text-foreground-60 underline decoration-white/30 underline-offset-[3px] transition-colors duration-200 hover:text-foreground"
        >
          {comparaison.source.label}
        </a>
      </span>
    </p>
  );
}

function Fondateur({ person }: { person: HeroContent["person"] }) {
  if (!person) return null;
  return (
    <div className="flex items-center gap-[10px]">
      {person.avatar ? (
        <ImageProgressive
          src={person.avatar.src}
          alt={person.avatar.alt}
          width={40}
          height={40}
          className="block h-[40px] w-[40px] flex-none rounded-full object-cover"
        />
      ) : null}
      <span className="flex flex-col gap-[2px]">
        <span className="text-[14px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
          {person.name}
        </span>
        <span className="text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
          {person.role}
        </span>
      </span>
    </div>
  );
}


export function HeroSection({
  hero,
  site,
  logos,
}: {
  hero: HeroContent;
  site: SiteConfig;
  logos?: ReactNode;
}) {
  const media = hero.media;
  const hasVideo = media?.kind === "video" && Boolean(media.src);
  if (hasVideo && media?.poster) {
    preload(media.poster, {
      as: "image",
      fetchPriority: "high",
      media: "(min-width: 810px)",
    });
  }
  const portes = hero.doors ?? [];
  const preuves = hero.proofs ?? [];
  const sousTitre = hero.subtitleParagraphs?.[0]?.text ?? hero.subtitle;
  return (
    <section
      data-section="hero"
      className="relative isolate flex min-h-[calc(100dvh/var(--zoom-ecran,1))] w-full flex-col overflow-hidden bg-background pt-[88px] pb-[20px] [font-family:var(--font-sans)] tablet:min-h-[max(calc(100dvh/var(--zoom-ecran,1)),720px)] tablet:pt-[112px] tablet:pb-[30px]"
    >
      {hasVideo ? (
        <ScrollParallax
          factor={0.15}
          decorative
          className="pointer-events-none absolute inset-0 z-0 overflow-clip"
        >
          <HeroVideo src={media?.src ?? ""} poster={media?.poster} />
        </ScrollParallax>
      ) : null}
      {/* Voile : le texte vit sur la moitié gauche, presque noire ; le
          mécanisme reste visible à droite et sous les preuves. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(11,11,11,0.55)_0%,rgba(11,11,11,0.78)_55%,rgba(11,11,11,0.96)_100%)] tablet:bg-[linear-gradient(90deg,rgba(11,11,11,0.92)_0%,rgba(11,11,11,0.7)_38%,rgba(11,11,11,0.1)_70%,transparent_100%)]"
      />
      <Grain matiere="photo" className="z-[1]" />
      {hero.cadran ? (
        <div className="absolute right-[-42%] top-[72px] z-[1] w-[110vw] opacity-50 tablet:right-[-4%] tablet:top-1/2 tablet:z-[2] tablet:w-[min(46vw,78vh)] tablet:-translate-y-1/2 tablet:opacity-100">
          <HeroCadran cadran={hero.cadran} />
        </div>
      ) : null}

      <div className="pointer-events-none relative z-[3] mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-[20px] [&_a]:pointer-events-auto tablet:px-[24px] desktop:px-[30px]">
        <div className="flex flex-1 flex-col justify-center">
          {hero.eyebrow ? (
            <p
              className="hero-fond m-0 flex max-w-[30ch] tablet:max-w-none items-baseline gap-[12px] text-[16px] font-medium leading-[1.25] tracking-[-0.01em] text-foreground tablet:text-[22px] desktop:text-[22px]"
            >
              <span aria-hidden className="hero-pastille relative top-[-2px] h-[8px] w-[8px] flex-none bg-accent" />
              {hero.eyebrow}
            </p>
          ) : null}

          {/* LE SEUL h1 DE L'ACCUEIL : l'offre, depuis le 2026-10-31. `id="services"` : la
              marche « Prestations » des fils d'Ariane (`/#services`) y mène
              depuis que l'accordéon a quitté l'accueil (2026-10-16). */}
          <h1 id="services" data-part="hero-titre" className="hero-portes m-0 mt-[18px] tablet:mt-[34px]">
            {portes.map((porte) => (
              <Porte key={porte.lines.join(" ")} porte={porte} />
            ))}
          </h1>

          <div className="mt-[22px] flex max-w-[640px] flex-col gap-[20px] tablet:mt-[30px]">
            {sousTitre ? (
              <p
                data-part="hero-pour-qui"
                className="hero-fond m-0 max-w-[44ch] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-white/80 tablet:text-[18px]"
              >
                {sousTitre}
              </p>
            ) : null}
            <div
              className="hero-fond flex flex-col items-start gap-[16px] tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-x-[28px]"
            >
              <div className="flex flex-col gap-[8px]">
                <a href={lienRendezVous("logiciel")} className="cta-primaire">
                  {uiLabels.services.rdvLabel}
                </a>
                {hero.ctaNote ? (
                  <p data-part="hero-note-cta" className="m-0 text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                    {hero.ctaNote}
                  </p>
                ) : null}
              </div>
              {hero.offerLink ? (
                <a href={hero.offerLink.href} className="cta-lien text-foreground">
                  {hero.offerLink.label}
                </a>
              ) : null}
              <Fondateur person={hero.person} />
            </div>
          </div>

          {hero.cadran ? (
            <a href={hero.cadran.exemple.href} className="hero-fond mt-[16px] text-[14px] font-medium tracking-[-0.01em] text-white/80 no-underline tablet:hidden">
              <span className="text-accent">{hero.cadran.gain.valeur}</span> {hero.cadran.gain.libelle}, {hero.cadran.exempleCourt}
            </a>
          ) : null}
        </div>

        {preuves.length > 0 || hero.comparison || logos ? (
          <div className="relative mt-[36px] flex flex-col gap-[18px] border-t border-white/10 pt-[18px] tablet:mt-[48px] desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-[40px]">
            <div className="flex flex-col gap-[16px] tablet:flex-row tablet:gap-[40px]">
              {hero.comparison ? <Comparaison comparaison={hero.comparison} /> : null}
              {preuves.map((preuve) => (
                <Preuve key={preuve.label} preuve={preuve} />
              ))}
            </div>
            {logos ? (
              <div className="hero-fond">
                {logos}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
