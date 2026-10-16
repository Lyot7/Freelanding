import Link from "next/link";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { FaqSection } from "@/components/sections/FaqSection";
import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Grain } from "@/components/effects/Grain";
import {
  FilAriane,
  OffreDetail,
  SectionDeuxMoities,
  TONS,
  type Ton,
} from "@/components/pages/services/ServicePage";
import { prixAffiche } from "@/content/offre";
import type {
  BlocChiffres,
  BlocEtapes,
  BlocTableau,
  BlocTheme,
  PageTheme as ContenuPageTheme,
} from "@/content/page-theme";
import { RDV_PAR_PRESTATION } from "@/content/rendez-vous";
import { servicePageLabels } from "@/content/service-pages";
import type { SiteConfig } from "@/lib/content/types";

/**
 * PAGE THÉMATIQUE : ERP, GMAO, automatisation, artisans, IA à Caen. Contenu
 * et règles dans `src/content/page-theme.ts`.
 *
 * MÊME GRAMMAIRE QUE LES PAGES DE PRESTATION (héros coupé par le filet
 * médian, deux tons alternés, l'offre, le rendez-vous, la FAQ), et c'est le
 * CORPS qui change : chaque page compose ses blocs, et trois natures de bloc
 * n'existent qu'ici. Le tableau se lit en cartes sous 810 px, chaque cellule
 * portant le nom de sa colonne.
 */

/** Le titre d'un bloc et ses paragraphes, en tête de la moitié gauche. */
function EnTeteBloc({ bloc, ton }: { bloc: BlocTheme; ton: Ton }) {
  const t = TONS[ton];
  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="accent-room max-w-[560px] text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
        {bloc.titre}
      </h2>
      {bloc.paragraphes.map((paragraphe) => (
        <p
          key={paragraphe}
          className={`max-w-[620px] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] ${t.attenue}`}
        >
          {paragraphe}
        </p>
      ))}
    </div>
  );
}

/** Les liens d'un bloc, sous son contenu. */
function LiensBloc({ bloc, ton }: { bloc: BlocTheme; ton: Ton }) {
  if (!bloc.liens) return null;
  const t = TONS[ton];
  return (
    <nav aria-label={bloc.liens.titre} className="flex flex-col gap-[12px]">
      <p className={`text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.02em] ${t.etiquette}`}>
        {bloc.liens.titre}
      </p>
      <ul className="grid gap-[16px] tablet:grid-cols-3">
        {bloc.liens.items.map((lien) => (
          <li key={lien.href} className="flex flex-col gap-[2px]">
            <Link
              href={lien.href}
              className={`w-fit text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] underline underline-offset-[3px] transition-[text-decoration-color,text-underline-offset] duration-200 hover:underline-offset-[4px] ${t.lien}`}
            >
              {lien.libelle}
            </Link>
            <span className={`text-[14px] font-medium leading-[1.4] tracking-[-0.01em] ${t.attenue}`}>
              {lien.description}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** L'enveloppe d'un bloc pleine largeur : fond, rembourrage, largeur max. */
function Enveloppe({
  id,
  ton,
  children,
}: {
  id: string;
  ton: Ton;
  children: React.ReactNode;
}) {
  return (
    <section
      data-section={`theme-${id}`}
      className={`relative px-[20px] py-[60px] tablet:px-[24px] tablet:py-[90px] desktop:px-[30px] ${TONS[ton].section}`}
    >
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-[36px]">
        {children}
      </div>
    </section>
  );
}

function Tableau({ bloc, ton }: { bloc: BlocTableau; ton: Ton }) {
  const t = TONS[ton];
  const [premiere, ...autres] = bloc.colonnes;
  return (
    <Enveloppe id={bloc.id} ton={ton}>
      <EnTeteBloc bloc={bloc} ton={ton} />
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{bloc.legende}</caption>
        <thead className="hidden tablet:table-header-group">
          <tr>
            {bloc.colonnes.map((colonne) => (
              <th
                key={colonne}
                scope="col"
                className={`pb-[12px] pr-[20px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.02em] ${t.etiquette}`}
              >
                {colonne}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloc.lignes.map((ligne) => (
            <tr
              key={ligne[0]}
              className={`grid gap-[8px] border-t py-[16px] tablet:table-row tablet:py-0 ${ton === "clair" ? "border-black/[0.08]" : "border-white/10"}`}
            >
              {ligne.map((cellule, index) =>
                index === 0 ? (
                  <th
                    key={`${ligne[0]}-${premiere}`}
                    scope="row"
                    className="align-top text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] tablet:w-[24%] tablet:py-[16px] tablet:pr-[20px]"
                  >
                    {cellule}
                  </th>
                ) : (
                  <td
                    key={`${ligne[0]}-${autres[index - 1]}`}
                    className={`align-top text-[14px] font-medium leading-[1.45] tracking-[-0.01em] tablet:py-[16px] tablet:pr-[20px] ${t.attenue}`}
                  >
                    <span className={`block text-[11px] font-semibold uppercase tracking-[0.02em] tablet:hidden ${t.etiquette}`}>
                      {autres[index - 1]}
                    </span>
                    {cellule}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
        {bloc.total ? (
          <tfoot>
            <tr
              className={`grid grid-cols-2 border-t py-[16px] tablet:table-row tablet:py-0 ${ton === "clair" ? "border-black/30" : "border-white/40"}`}
            >
              {bloc.total.map((cellule, index) => (
                <td
                  key={`total-${bloc.colonnes[index]}`}
                  className={`text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] tablet:py-[16px] tablet:pr-[20px] ${cellule === "" ? "hidden tablet:table-cell" : ""}`}
                >
                  {cellule}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
      {bloc.note ? (
        <p className={`max-w-[720px] text-[14px] font-medium leading-[1.45] tracking-[-0.01em] ${t.attenue}`}>
          {bloc.note}
        </p>
      ) : null}
      <LiensBloc bloc={bloc} ton={ton} />
    </Enveloppe>
  );
}

function Etapes({ bloc, ton }: { bloc: BlocEtapes; ton: Ton }) {
  const t = TONS[ton];
  return (
    <Enveloppe id={bloc.id} ton={ton}>
      <EnTeteBloc bloc={bloc} ton={ton} />
      <ol className="grid gap-x-[30px] tablet:grid-cols-2 desktop:grid-cols-3">
        {bloc.etapes.map((etape, index) => (
          <li
            key={etape.titre}
            className={`flex flex-col gap-[8px] border-t py-[20px] ${ton === "clair" ? "border-black/[0.08]" : "border-white/10"}`}
          >
            <span className={`text-[12px] font-medium leading-[1.2] tracking-[-0.01em] ${t.etiquette}`}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-[18px] font-semibold uppercase leading-[1] tracking-[-0.03em]">
              {etape.titre}
            </h3>
            <p className={`text-[14px] font-medium leading-[1.45] tracking-[-0.01em] ${t.attenue}`}>
              {etape.corps}
            </p>
            {etape.passe ? (
              <p className="text-[13px] font-semibold leading-[1.4] tracking-[-0.01em]">
                <span aria-hidden>→ </span>
                {etape.passe}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      <LiensBloc bloc={bloc} ton={ton} />
    </Enveloppe>
  );
}

function Chiffres({ bloc, ton }: { bloc: BlocChiffres; ton: Ton }) {
  const t = TONS[ton];
  return (
    <Enveloppe id={bloc.id} ton={ton}>
      <EnTeteBloc bloc={bloc} ton={ton} />
      <dl className="grid gap-[24px] tablet:grid-cols-3 tablet:gap-[30px]">
        {bloc.chiffres.map((chiffre) => (
          <div
            key={chiffre.libelle}
            className={`flex flex-col-reverse gap-[8px] border-t pt-[20px] ${ton === "clair" ? "border-black/[0.08]" : "border-white/10"}`}
          >
            <dt className={`text-[14px] font-medium leading-[1.4] tracking-[-0.01em] ${t.attenue}`}>
              {chiffre.libelle}
            </dt>
            <dd className="text-[44px] font-semibold leading-[1] tracking-[-0.04em] desktop:text-[64px]">
              {chiffre.valeur}
            </dd>
          </div>
        ))}
      </dl>
      {bloc.source ? (
        <p className={`text-[14px] font-medium leading-[1.4] tracking-[-0.01em] ${t.attenue}`}>
          <Link
            href={bloc.source.href}
            className={`font-semibold underline underline-offset-[3px] ${t.lien}`}
          >
            {bloc.source.libelle}
          </Link>
          {" : "}
          {bloc.source.description}
        </p>
      ) : null}
      <LiensBloc bloc={bloc} ton={ton} />
    </Enveloppe>
  );
}

function Bloc({ bloc, ton }: { bloc: BlocTheme; ton: Ton }) {
  switch (bloc.type) {
    case "section":
      return (
        <SectionDeuxMoities
          dataSection={`theme-${bloc.id}`}
          titre={bloc.titre}
          paragraphes={bloc.paragraphes}
          liens={bloc.liens}
          points={bloc.points}
          ton={ton}
        />
      );
    case "tableau":
      return <Tableau bloc={bloc} ton={ton} />;
    case "etapes":
      return <Etapes bloc={bloc} ton={ton} />;
    case "chiffres":
      return <Chiffres bloc={bloc} ton={ton} />;
  }
}

/** Graine du fond animé : une par page, pour que deux héros ne se ressemblent pas. */
const graine = (chemin: string): number =>
  [...chemin].reduce((somme, c) => somme + c.charCodeAt(0), 0) % 97;

export function PageTheme({
  page,
  site,
}: {
  page: ContenuPageTheme;
  site: SiteConfig;
}) {
  return (
    <>
      <SvgSprite />
      <Header site={site} />
      <main id="main-content" tabIndex={-1}>
        <section className="relative flex min-h-[calc(70svh/var(--zoom-ecran,1))] items-end overflow-hidden bg-background px-[20px] pb-[60px] pt-[140px] text-foreground tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px]">
          <GradientWaveBackdrop seed={graine(page.chemin)} />
          <Grain opacity={0.05} className="z-[1]" />
          <span className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/10" />
          <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] gap-[20px] tablet:grid-cols-2 tablet:items-end tablet:gap-x-0 tablet:gap-y-[30px]">
            <Reveal
              trigger="appear"
              appearId="theme-hero-titre"
              initialOpacity={0.001}
              initialY={80}
              duration={1.2}
              className="accent-room overflow-hidden [--accent-room:26px] tablet:col-start-2 tablet:row-start-2"
            >
              <h1 className="max-w-[560px] text-[52px] font-semibold uppercase leading-[0.85] tracking-[-0.05em] tablet:text-[66px] desktop:text-[86px]">
                {page.h1}
              </h1>
            </Reveal>
            <p className="max-w-[380px] text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-white/60 tablet:col-start-1 tablet:row-start-3 tablet:mr-[30px] tablet:justify-self-end tablet:text-right desktop:mr-[40px]">
              {page.resume}
            </p>
            <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/50 tablet:col-start-2 tablet:row-start-3 tablet:pl-[30px] desktop:pl-[40px]">
              {servicePageLabels.chapoPrix(
                prixAffiche(page.offre, ` ${servicePageLabels.horsTaxes}`),
              )}
            </p>
          </div>
        </section>

        {page.blocs.map((bloc, index) => (
          <Bloc key={bloc.id} bloc={bloc} ton={index % 2 === 0 ? "clair" : "sombre"} />
        ))}

        {/* L'OFFRE. `data-section="packs"` : `pricing_viewed` le lit
            (docs/ANALYTICS.md), comme sur les pages de prestation. */}
        <section
          data-section="packs"
          className="relative bg-background px-[20px] py-[60px] text-foreground tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-1/2 hidden w-px bg-white/10 tablet:block"
          />
          <div className="relative mx-auto flex w-full max-w-[1440px] flex-col">
            <div className="grid gap-[16px] pb-[30px] tablet:grid-cols-2 tablet:items-end tablet:gap-0 tablet:pb-[40px]">
              <h2 className="accent-room max-w-[460px] text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:pr-[30px] tablet:text-[34px] desktop:pr-[40px]">
                {page.titreOffre}
              </h2>
              <p className="max-w-[440px] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-white/80 tablet:pl-[30px] desktop:pl-[40px]">
                {page.reassurance ?? servicePageLabels.reassurance}
              </p>
            </div>
            <OffreDetail offre={page.offre} href="#rendez-vous" />
          </div>
        </section>

        <FaqSection
          faq={[...page.faq.items]}
          eyebrow={page.faq.eyebrow}
          titleLines={page.faq.titleLines}
        />
        {page.filAriane ? <FilAriane marches={page.filAriane} /> : null}
      </main>
      <Footer sujetRendezVous={page.rendezVous ?? RDV_PAR_PRESTATION[page.prestation]} />
      <FloatingNav site={site} />
    </>
  );
}
