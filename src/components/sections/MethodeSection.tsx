import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { ParallaxBackdrop } from "@/components/motion/ParallaxBackdrop";
import { SignatureMark } from "@/components/sections/SignatureMark";
import { siteFeatures } from "@/content/features";
import { methodePromise } from "@/content/testimonials";
import { methodeLabels } from "@/content/tarifs";

/**
 * PRISE DE PAROLE SUR LA MÉTHODE, à la place de la section tarifs.
 *
 * CE QU'ELLE REMPLACE, et pourquoi le contenu a changé autant que la place. La
 * section tarifs de l'accueil s'ouvrait sur un engagement de FACTURATION : « le
 * prix est fixé avant que je commence, et il ne bouge pas ». La phrase est
 * vraie, elle est tenable, et elle ne dit rien — tout prestataire sérieux
 * facture ce qu'il a devisé, l'écrire ne distingue de personne et occupe la
 * seule prise de parole directe de la page d'accueil pour parler d'argent.
 *
 * Ce qui distingue tient à la manière de travailler, pas à la manière
 * d'encaisser. C'est aussi ce que le visiteur cherche à cet endroit : il sait
 * déjà qu'il va payer, il ne sait pas encore comment ça va se passer.
 *
 * LES PRIX, EUX, VIVENT SUR LES PAGES DE PRESTATION depuis le 2026-09-07 :
 * comparer trois offres et trois forfaits dans une même grille demandait au
 * visiteur de choisir deux fois avant d'avoir rien lu, et la grille ne tenait
 * pas sur un téléphone.
 *
 * LE GABARIT EST CELUI DU BLOC D'OUVERTURE DE L'ANCIENNE SECTION : œil à
 * gauche, portrait et signature en appui, citation en grand corps alignée à
 * droite dès 810. Il n'y avait aucune raison de redessiner un bloc dont la
 * géométrie était déjà réglée.
 */
export function MethodeSection() {
  const auteur = methodePromise.author;
  const portrait = auteur?.avatar;

  return (
    <section
      id="methode"
      data-section="methode"
      className="relative flex w-full flex-col items-center overflow-hidden bg-background px-[20px] pb-[60px] pt-[40px] text-foreground tablet:px-[24px] tablet:pb-[100px] tablet:pt-[70px] desktop:px-[30px]"
    >
      <div className="relative z-[2] flex w-full max-w-[1440px] flex-col items-center gap-[30px] overflow-hidden tablet:gap-0">
        {/* Œil à gauche, auteur à droite. L'ordre visuel s'inverse sous 810 :
            la citation passe en tête, l'auteur la signe en dessous. */}
        <div className="relative order-2 flex w-full flex-col gap-[12px] desktop:order-1 desktop:flex-row desktop:items-start desktop:gap-0 desktop:pb-[50px] desktop:pt-[30px]">
          <div className="relative hidden w-px flex-[1_0_0] flex-row items-start justify-start gap-[10px] desktop:flex">
            <p className="whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
              {methodeLabels.eyebrow}
            </p>
          </div>

          <div className="relative flex w-full flex-row items-end justify-start gap-[20px] overflow-hidden desktop:w-px desktop:flex-[1_0_0] desktop:gap-[30px] desktop:pt-[50px]">
            {portrait ? (
              <div className="relative z-[1] h-[143px] w-[116px] flex-none overflow-hidden desktop:h-[167px] desktop:w-[136px]">
                <ParallaxBackdrop
                  src={portrait.src}
                  overshoot={0.06}
                  label={portrait.alt}
                  reveal
                />
              </div>
            ) : null}
            <Reveal
              initialOpacity={0.001}
              delay={0.1}
              className="relative flex w-min flex-none flex-col items-start justify-start gap-[5px]"
            >
              <p className="whitespace-pre text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
                {auteur?.name}
              </p>
              {auteur?.role ? (
                <p className="whitespace-pre text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground opacity-70">
                  {auteur.role}
                </p>
              ) : null}
              {/* Le paraphe vient de `SignatureMark`, source unique du dessin. */}
              {siteFeatures.signature ? (
                <SignatureMark className="mt-[6px] block h-auto w-[150px] opacity-90 desktop:w-[180px]" />
              ) : null}
            </Reveal>
          </div>
        </div>

        {/* LA CITATION NE SE SERRE QU'À PARTIR DE 1200px. En demi-colonne dès
            810, elle disposait de 379px pour un corps de 26px : le découpage
            ligne par ligne produisait ONZE lignes de deux à trois mots, et la
            phrase se lisait mot à mot. Mesuré le 2026-09-08. Elle occupe donc
            toute la largeur tant que la moitié ne suffit pas — même cause, même
            correction que la grille des forfaits et celle des pages légales. */}
        <div className="relative order-1 flex w-full flex-col gap-[12px] desktop:order-2 desktop:flex-row desktop:items-start desktop:gap-0">
          <div className="relative flex w-full flex-col items-start gap-[14px] overflow-hidden desktop:w-1/2 desktop:items-end desktop:gap-[30px]">
            <p className="m-0 flex w-full max-w-[550px] flex-col justify-center text-left text-[22px] font-medium leading-[1.15] tracking-[-0.02em] text-foreground desktop:text-right desktop:text-[32px]">
              <LineReveal
                text={methodePromise.quote}
                className="block w-full"
                lineClassName="w-full overflow-hidden"
                delay={0.1}
              />
            </p>
            <Reveal
              as="p"
              initialOpacity={0.001}
              delay={0.15}
              className="m-0 h-auto w-full max-w-[230px] text-left text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 [text-wrap:balance] desktop:text-right"
            >
              {methodeLabels.quoteFooter}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
