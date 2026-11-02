/**
 * `/rdv/gerer/[jeton]` — déplacer ou annuler un rendez-vous, depuis le lien de
 * l'e-mail de confirmation (et de la description de l'événement Google).
 *
 * LE JETON EST UN SECRET (256 bits) : la page n'est pas indexée, ne transmet
 * pas son adresse en référent, et n'affiche ni nom ni e-mail. Le rendez-vous
 * est lu au cockpit côté serveur, à chaque visite (jamais mis en cache).
 *
 * États : rendez-vous à venir (actions), annulé, déplacé (ancien lien), passé,
 * jeton inconnu, cockpit injoignable.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { GestionRendezVous } from "@/components/rendez-vous/GestionRendezVous";
import { CLASSE_LIBELLE, CLASSE_TEXTE } from "@/components/rendez-vous/ReservationRendezVous";
import { rendezVousContent } from "@/content/rendez-vous";
import type { EtatGestion } from "@/content/rendez-vous";
import { content } from "@/lib/content";
import { lireGestion } from "@/lib/rendez-vous/cockpit";
import type { RendezVousGere } from "@/lib/rendez-vous/cockpit";
import { formaterHeure, formaterJour, jourParis } from "@/lib/rendez-vous/creneaux";
import { etatRendezVous } from "@/lib/rendez-vous/gestion";

export const dynamic = "force-dynamic";

const gestion = rendezVousContent.gestion;

export const metadata: Metadata = {
  title: gestion.metaTitre,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function resumeRendezVous(rdv: RendezVousGere): string {
  return `${formaterJour(jourParis(new Date(rdv.debut)))} à ${formaterHeure(rdv.debut)}`;
}

function BlocEtat({ etat, reserver }: { etat: EtatGestion; reserver: boolean }) {
  return (
    <div className="flex flex-col items-start gap-[16px]">
      <p className="m-0 text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground tablet:text-[26px]">
        {etat.titre}
      </p>
      <p className={CLASSE_TEXTE}>{etat.texte}</p>
      {reserver ? (
        <Link
          href={gestion.lienReserver}
          className="inline-flex min-h-[44px] items-center text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent no-underline"
        >
          {gestion.actions.reserver}
        </Link>
      ) : null}
    </div>
  );
}

export default async function GererRendezVous({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const [{ jeton }, site] = await Promise.all([params, content.getSiteConfig()]);
  const lecture = await lireGestion(jeton);
  const rdv = lecture.ok ? lecture.donnees : undefined;
  const etat = rdv ? etatRendezVous(rdv, new Date()) : undefined;

  let corps;
  if (!lecture.ok) {
    corps =
      lecture.raison === "refuse" && lecture.statut === 404 ? (
        <BlocEtat etat={gestion.etats.inconnu} reserver />
      ) : (
        <BlocEtat etat={gestion.etats.indisponible} reserver={false} />
      );
  } else if (etat === "annule") {
    corps = <BlocEtat etat={gestion.etats.annule} reserver />;
  } else if (etat === "deplace") {
    corps = <BlocEtat etat={gestion.etats.deplace} reserver={false} />;
  } else if (etat === "passe") {
    corps = <BlocEtat etat={gestion.etats.passe} reserver />;
  } else {
    corps = <GestionRendezVous jeton={jeton} />;
  }

  return (
    <>
      <SvgSprite />
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <section className="relative bg-background px-[20px] pb-[90px] pt-[150px] text-foreground tablet:px-[24px] desktop:px-[30px]">
          <div className="mx-auto flex w-full max-w-[860px] flex-col gap-[32px]">
            <div className="flex flex-col gap-[12px]">
              <p className={CLASSE_LIBELLE}>{gestion.eyebrow}</p>
              <h1 className="m-0 text-[40px] font-semibold uppercase leading-[0.9] tracking-[-0.05em] tablet:text-[62px]">
                {gestion.titre}
              </h1>
            </div>
            {rdv ? (
              <dl className="grid grid-cols-1 gap-[16px] border-y border-border py-[20px] tablet:grid-cols-3">
                <div className="flex flex-col gap-[6px]">
                  <dt className={CLASSE_LIBELLE}>{gestion.libelleSujet}</dt>
                  <dd className="m-0 text-[16px] font-medium leading-[1.2] text-foreground">{rdv.titre}</dd>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <dt className={CLASSE_LIBELLE}>{gestion.libelleDate}</dt>
                  <dd className="m-0 text-[16px] font-medium leading-[1.2] text-foreground">
                    {resumeRendezVous(rdv)}
                  </dd>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <dt className={CLASSE_LIBELLE}>{gestion.libelleDuree}</dt>
                  <dd className="m-0 text-[16px] font-medium leading-[1.2] text-foreground">
                    {rendezVousContent.creneaux.duree(rdv.duree)}
                  </dd>
                </div>
              </dl>
            ) : null}
            {rdv ? <p className={CLASSE_LIBELLE}>{rendezVousContent.noteFuseau}</p> : null}
            {corps}
          </div>
        </section>
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
