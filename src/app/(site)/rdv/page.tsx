/**
 * `/rdv` — le premier rendez-vous, pour tout sujet.
 *
 * UN SEUL LIEN depuis le 2026-11-12 (décision d'Eliott) : logiciel, site, IA ou
 * autre chose, le visiteur choisit son sujet sur la page. `?sujet=logiciel|site|
 * ia|autre` présélectionne le bouton (liens des pages, de l'outil de chiffrage,
 * des mails). `/rdv/logiciel` renvoie ici en 301.
 *
 * La page est statique : la lecture de `?sujet` est faite par
 * `ReservationAvecSujet`, derrière sa frontière `Suspense`.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { ReservationAvecSujet } from "@/components/rendez-vous/ReservationAvecSujet";
import { ReservationRendezVous } from "@/components/rendez-vous/ReservationRendezVous";
import { CLASSE_LIBELLE, CLASSE_TEXTE } from "@/components/rendez-vous/ReservationRendezVous";
import { CHEMIN_RDV, rendezVousContent } from "@/content/rendez-vous";
import { content } from "@/lib/content";
import { resoudreConfiguration, typesVisibles } from "@/lib/rendez-vous/config";

const contenu = rendezVousContent;

export const metadata: Metadata = {
  title: { absolute: "Prendre rendez-vous · Eliott Bouquerel" },
  description:
    "Réservez trente minutes en visio pour parler de votre logiciel, de votre site ou d’une intégration d’IA. Gratuit, sans engagement.",
  alternates: { canonical: CHEMIN_RDV },
};

export default async function Rdv() {
  const site = await content.getSiteConfig();
  const { typesDisponibles } = resoudreConfiguration();
  const types = contenu.types.filter((type) => typesDisponibles.includes(type.id));
  const email = site.contact.email;

  return (
    <>
      <SvgSprite />
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <section className="relative bg-background px-[20px] pb-[90px] pt-[130px] text-foreground tablet:px-[24px] desktop:px-[30px]">
          <div className="mx-auto flex w-full max-w-[860px] flex-col gap-[32px]">
            <div className="flex flex-col gap-[14px]">
              <span className={CLASSE_LIBELLE}>{contenu.eyebrow}</span>
              <h1 className="m-0 text-[40px] font-semibold uppercase leading-[0.9] tracking-[-0.05em] tablet:text-[62px]">
                {contenu.titre}
              </h1>
              <p className={`${CLASSE_TEXTE} m-0 max-w-[560px]`}>{contenu.chapeau}</p>
              <ul className="m-0 flex list-none flex-col gap-[4px] p-0 tablet:flex-row tablet:flex-wrap tablet:gap-x-[20px]">
                {contenu.garanties.map((garantie) => (
                  <li key={garantie} className={CLASSE_LIBELLE}>
                    {garantie}
                  </li>
                ))}
              </ul>
            </div>
            {types.length > 0 ? (
              <Suspense
                fallback={
                  <ReservationRendezVous types={typesVisibles(types)} emailContact={email} />
                }
              >
                <ReservationAvecSujet types={types} emailContact={email} />
              </Suspense>
            ) : (
              <p className={`${CLASSE_TEXTE} m-0`}>{contenu.creneaux.indisponible}</p>
            )}
          </div>
        </section>
      </main>
      <Footer sansFormulaire />
      <FloatingNav site={site} />
    </>
  );
}
