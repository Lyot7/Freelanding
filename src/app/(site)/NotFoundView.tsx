/**
 * Contenu de la page 404 du site, sans son document.
 *
 * Il est monté par DEUX entrées de routage distinctes, d'où l'extraction :
 *   - `(site)/not-found.tsx` pour un `notFound()` levé par une page du site ;
 *   - `src/app/global-not-found.tsx` pour une URL qui ne correspond à AUCUNE
 *     route. Le layout du site vivant dans le groupe `(site)`, Next n'a pas de
 *     layout racine pour composer un 404 global, et bascule sur son
 *     404 nu si ce fichier n'existe pas. MESURÉ : sans lui, `/nimporte-quoi`
 *     renvoyait « 404: This page could not be found. » à la place du design.
 */
import Link from "next/link";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { Reveal } from "@/components/motion/Reveal";
import { FaqSection } from "@/components/sections/FaqSection";
import { content } from "@/lib/content";

export async function NotFoundView() {
  const [faq, site, notFound] = await Promise.all([
    content.getFaq(),
    content.getSiteConfig(),
    content.getNotFound(),
  ]);

  // Les quatre chaînes de cette page viennent de `src/content/not-found.ts`.
  // Elles y étaient déjà, traduites, pendant que ce composant en gardait une
  // copie en dur, en anglais. Le découpage en lignes (deux et deux) est
  // structurel : il appartient à la donnée, pas au rendu.
  const [messageLine1, messageLine2] = notFound.messageLines;
  const [titleLine1, titleLine2] = notFound.titleLines;

  return (
    <>
      <SvgSprite />
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <section className="relative flex min-h-[900px] items-end overflow-hidden bg-background px-[20px] pb-[46px] pt-[150px] text-foreground tablet:px-[24px] desktop:px-[30px]">
          <span className="pointer-events-none absolute inset-0 bg-[url('/images/grain.png')] bg-repeat opacity-[0.08] [background-size:256px_256px]" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
          <div className="relative mx-auto grid w-full max-w-[1440px] gap-[46px] tablet:grid-cols-2 tablet:items-end">
            <div className="flex flex-col items-start gap-[64px] tablet:items-end">
              <p className="max-w-[230px] text-[11px] font-medium uppercase leading-[1.2] text-white/60 tablet:text-right">
                {messageLine1}
                <br />
                {messageLine2}
              </p>
              <Link
                href={notFound.backLink.href}
                className="inline-flex items-center gap-[12px] text-[11px] font-medium uppercase text-foreground no-underline"
              >
                <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-accent text-background">
                  ←
                </span>
                {notFound.backLink.label}
              </Link>
            </div>
            <div>
              <Reveal
                initialOpacity={0.001}
                initialY={80}
                duration={1.2}
                className="overflow-hidden"
              >
                {/* TAILLE PLAFONNÉE PAR LA LARGEUR DISPONIBLE.
                    « INTROUVABLE » mesure 419 px à 68 px de corps, pour une
                    colonne de 280 à 320 px de fenêtre : le titre sortait de
                    l'écran de 320 à 430 px, et poussait avec lui la mention
                    « Erreur 404 » (relevée 119 px hors cadre). La source
                    anglaise, « Not found », tenait partout.
                    Colonne = 100vw - 40 sous 810, et le texte mesure 6,16 x le
                    corps ; le corps tenable vaut donc colonne / 6,3. `min()`
                    conserve les 68 px partout où ils tiennent. */}
                <h1 className="text-[min(68px,calc(15.87vw-6.35px))] font-semibold uppercase leading-[0.82] tracking-[-0.06em] tablet:text-[92px] desktop:text-[120px]">
                  {titleLine1}
                  <br />
                  {titleLine2}
                </h1>
              </Reveal>
              <p className="mt-[80px] text-[16px] font-medium uppercase text-white/60">
                {notFound.errorLabel}
              </p>
            </div>
          </div>
        </section>
        <FaqSection faq={faq} />
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
