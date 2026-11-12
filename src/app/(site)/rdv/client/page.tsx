/**
 * `/rdv/client` — les rendez-vous des clients en cours : point rapide,
 * démonstration, présentation d'une proposition, point d'étape.
 *
 * UN SEUL LIEN à leur envoyer (décision d'Eliott du 2026-11-12), et un
 * formulaire réduit : seuls le nom et l'e-mail sont exigés, le téléphone et la
 * ligne libre sont facultatifs. `?sujet=point-rapide|demonstration|proposition|
 * point-d-etape` présélectionne le bouton. Page non indexée.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { ReservationAvecSujet } from "@/components/rendez-vous/ReservationAvecSujet";
import { CLASSE_LIBELLE, CLASSE_TEXTE, ReservationRendezVous } from "@/components/rendez-vous/ReservationRendezVous";
import { rendezVousContent } from "@/content/rendez-vous";
import { content } from "@/lib/content";
import { resoudreConfiguration, typesClient } from "@/lib/rendez-vous/config";

const contenu = rendezVousContent;

export const metadata: Metadata = {
  title: { absolute: contenu.client.metaTitre },
  description: contenu.client.metaDescription,
  robots: { index: false, follow: false },
};

export default async function RdvClient() {
  const site = await content.getSiteConfig();
  const { typesDisponibles } = resoudreConfiguration();
  const types = typesClient(contenu.types.filter((type) => typesDisponibles.includes(type.id)));
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
              <span className={CLASSE_LIBELLE}>{contenu.client.eyebrow}</span>
              <h1 className="m-0 text-[40px] font-semibold uppercase leading-[0.9] tracking-[-0.05em] tablet:text-[62px]">
                {contenu.client.titre}
              </h1>
              <p className={`${CLASSE_TEXTE} m-0 max-w-[560px]`}>{contenu.client.chapeau}</p>
            </div>
            {types.length > 0 ? (
              <Suspense
                fallback={<ReservationRendezVous types={types} emailContact={email} />}
              >
                <ReservationAvecSujet types={types} emailContact={email} client />
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
