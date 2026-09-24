import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { Reveal } from "@/components/motion/Reveal";
import { Grain } from "@/components/effects/Grain";
import { RichText } from "@/components/pages/RichText";
import {
  CreditHeroPhoto,
  HeroPhoto,
  VOILE_TEXTE,
} from "@/components/pages/services/HeroPhoto";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { herosPages } from "@/content/heros-pages";
import { CHEMIN_PROFIL_TEXTE, vueAgentContent } from "@/content/vue-agent";
import { sommaireDesBlocs } from "@/lib/blog/sommaire";
import type { SiteConfig } from "@/lib/content/types";
import {
  consignesDuPrompt,
  construirePrompt,
  type Profil,
} from "@/lib/profil/profil";
import { CopierPrompt } from "./CopierPrompt";

/**
 * Vue Agent : le profil complet en un seul texte, et le prompt à copier.
 *
 * GABARIT DES PAGES LÉGALES, et pour la même raison : un long document qu'on
 * consulte par section. Héros sombre, puis le texte sur fond clair avec son
 * sommaire en colonne. Deux écarts :
 *   - le héros est plus court (70svh contre 90) : le visiteur vient chercher le
 *     texte ou le bouton, pas une ouverture ;
 *   - le bouton de copie est dans le héros, au premier écran, et revient en
 *     tête du texte pour qui a commencé par lire.
 * La photo du héros vient de `herosPages.agent`, posée par `HeroPhoto` comme
 * sur les pages légales : la main et l'écran dans la moitié gauche, le texte
 * sur le fondu de la moitié droite.
 *
 * RENDU AU SERVEUR, sans condition : le profil est dans le HTML, lisible par
 * un robot d'exploration comme par l'assistant d'un visiteur qui colle l'URL.
 */
export function AgentPage({
  site,
  profil,
}: {
  site: SiteConfig;
  profil: Profil;
}) {
  const t = vueAgentContent;
  const sommaire = sommaireDesBlocs(profil.blocs);
  const prompt = construirePrompt(profil);
  const personne = site.contact.person?.name ?? site.brand.name;
  const photo = herosPages.agent;

  return (
    <>
      <SvgSprite />
      <Header site={site} vue="agent" />
      <main id="main-content" tabIndex={-1}>
        <section className="relative flex min-h-[70svh] items-end overflow-hidden bg-background px-[20px] pb-[60px] pt-[140px] text-foreground tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px]">
          <HeroPhoto image={photo} />
          <Grain opacity={0.05} className="z-[1]" />
          <span className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/10" />
          {/* UNE SEULE COLONNE, la moitié droite, comme le titre des pages
              légales : surtitre, titre, texte et bouton se lisent d'un trait.
              Répartis sur deux colonnes, ils faisaient faire à l'œil un
              aller-retour par-dessus la ligne médiane. */}
          <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] tablet:grid-cols-2">
            <div className="flex flex-col items-start gap-[24px] tablet:col-start-2 tablet:pl-[30px] desktop:pl-0">
              {/* Hors de l'apparition, comme le fil d'Ariane des prestations :
                  sur mobile, il croise le contour de la main, et son voile
                  (`VOILE_TEXTE`) serait rogné par la coupe de `Reveal`. */}
              <p className={`-mb-[8px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/90 ${VOILE_TEXTE}`}>
                {t.hero.surtitre(personne, site.tagline)}
              </p>
              <Reveal
                trigger="appear"
                appearId="agent-hero-titre"
                initialOpacity={0.001}
                initialY={80}
                duration={1.2}
                className="accent-room clip-room [--accent-room:26px] [--clip-room:4px] [text-shadow:0_0_18px_rgba(0,0,0,.45)]"
              >
                <h1 className="max-w-[680px] text-[clamp(34px,8.4vw,48px)] font-semibold uppercase leading-[0.9] tracking-[-0.05em] tablet:text-[clamp(40px,4.8vw,64px)] desktop:text-[clamp(52px,4.6vw,78px)]">
                  {t.hero.titre}
                </h1>
              </Reveal>
              <p className="max-w-[460px] text-[16px] font-medium leading-[1.5] tracking-[-0.01em] text-white/80 [text-shadow:0_0_18px_rgba(0,0,0,.45)]">
                {t.hero.resume}
              </p>
              <CopierPrompt
                prompt={prompt}
                libelles={t.copier}
                className="bg-accent text-accent-ink hover:bg-foreground hover:text-background"
              />
            </div>
          </div>
          <CreditHeroPhoto credit={photo.credit} />
        </section>

        <article className="relative bg-muted p-[20px] pb-[60px] text-background tablet:px-[24px] tablet:pb-[90px] tablet:pt-[30px] desktop:px-[30px]">
          <div className="relative grid gap-y-[28px] desktop:grid-cols-[minmax(0,260px)_minmax(0,1fr)] desktop:gap-x-[40px] desktop:gap-y-[44px]">
            <div className="hidden desktop:col-start-1 desktop:row-start-1 desktop:block desktop:self-stretch desktop:pr-[40px]">
              <TableOfContents entrees={sommaire} titre={t.sommaire} />
            </div>

            <div className="desktop:col-start-2 desktop:row-start-1">
              {/* MODE D'EMPLOI, séparé du profil par un filet : ce bloc parle
                  du bouton, le texte en dessous parle d'Eliott. */}
              <section
                aria-labelledby="agent-mode"
                className="max-w-[620px] border-b border-background/15 pb-[40px]"
              >
                <h2
                  id="agent-mode"
                  className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/70"
                >
                  {t.mode.titre}
                </h2>
                <ol className="mt-[18px] list-none space-y-[12px] p-0">
                  {t.mode.etapes.map((etape, index) => (
                    <li
                      key={etape}
                      className="grid grid-cols-[28px_1fr] text-[15px] font-medium leading-[1.55] tracking-[-0.005em] text-background"
                    >
                      <span aria-hidden className="text-background/40">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{etape}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-[24px] flex flex-wrap items-start gap-x-[24px] gap-y-[14px]">
                  <CopierPrompt
                    prompt={prompt}
                    libelles={t.copier}
                    ton="clair"
                    className="bg-background text-foreground hover:bg-accent hover:text-accent-ink"
                  />
                  <a
                    href={CHEMIN_PROFIL_TEXTE}
                    className="flex min-h-[44px] items-center text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background underline decoration-background/40 underline-offset-[3px] transition-[text-decoration-color] duration-200 hover:decoration-background motion-reduce:transition-none"
                  >
                    {t.mode.lienTexte}
                  </a>
                </div>
                <details className="group mt-[12px]">
                  {/* Marqueur maison : le triangle natif jurait avec les angles
                      droits du site. « + » fermé, « − » ouvert. */}
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-[10px] text-[14px] font-medium leading-[1.4] text-background/75 [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="w-[10px] font-mono text-background/60 group-open:hidden">+</span>
                    <span aria-hidden className="hidden w-[10px] font-mono text-background/60 group-open:inline">−</span>
                    {t.mode.voirPrompt}
                  </summary>
                  <p className="mt-[14px] whitespace-pre-wrap border-l border-background/20 pl-[16px] text-[14px] font-medium leading-[1.6] text-background/75">
                    {consignesDuPrompt()}
                  </p>
                </details>
              </section>

              {/* Pas un titre : ses sections sont des h2, il ne peut pas être
                  leur égal. */}
              <p className="mt-[52px] max-w-[620px] text-[26px] font-semibold leading-[1.05] tracking-[-0.04em] text-background tablet:mt-[64px] tablet:text-[32px]">
                {profil.titre}
              </p>
              <RichText
                blocks={profil.blocs}
                liens
                className="mt-[22px] max-w-[620px]"
              />
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
