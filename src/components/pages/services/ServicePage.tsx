import Link from "next/link";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { FaqSection } from "@/components/sections/FaqSection";
import { faqItems } from "@/content/faq";
import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Grain } from "@/components/effects/Grain";
import {
  CreditHeroPhoto,
  HeroPhoto,
  VOILE_TEXTE,
} from "@/components/pages/services/HeroPhoto";
import { herosPages } from "@/content/heros-pages";
import type { SiteConfig } from "@/lib/content/types";
import {
  fourchette,
  prixPack,
  type Pack,
  type Prestation,
} from "@/content/offre";
import {
  lienLocalParPrestation,
  marchesFilAriane,
  servicePageLabels,
  servicePageSeo,
  type MarcheFilAriane,
} from "@/content/service-pages";
import type { PageLocale } from "@/content/page-caen";
import { RDV_PAR_PRESTATION } from "@/content/rendez-vous";
import { SectionRendezVous } from "@/components/rendez-vous/SectionRendezVous";

/**
 * PAGE D'UNE PRESTATION — le détail des prix, là où il peut être expliqué.
 *
 * POURQUOI CETTE PAGE EXISTE. La page d'accueil portait une grille comparative
 * de trois colonnes et dix lignes de coches. Elle avait deux défauts qu'aucune
 * retouche ne réglait : elle comparait des paliers entre eux, donc le site
 * vitrine n'y avait pas sa place, et un tableau de coches ne dit jamais POURQUOI
 * un périmètre coûte plus cher qu'un autre. Il montre une différence, il ne
 * l'explique pas.
 *
 * Ici, chaque périmètre porte sa promesse, le cas de figure qui doit le faire
 * choisir, et ce qu'il ajoute au précédent. Le prix vient ensuite, et il vient
 * comme une conséquence.
 *
 * PRIX FERMES, SANS DURÉE NI TAUX JOURNALIER, depuis le 2026-09-23 : le
 * périmètre est l'argument, et un montant accolé à des jours se divise. Voir
 * l'en-tête de `offre.ts`.
 */

/**
 * LE FIL D'ARIANE, ET CE QU'IL REMPLACE.
 *
 * Il y avait ici un simple retour : une flèche et « Toutes les prestations ».
 * Il ramenait en arrière, ce qui est utile, mais il ne SITUAIT pas la page :
 * un visiteur arrivé par un moteur de recherche, c'est-à-dire tout le monde sur
 * ces trois pages, ne voyait nulle part où il était tombé. `/work/*` déclare le
 * sien aux moteurs depuis le début (`workSchema`), `/services/*` n'en avait
 * aucun, ni affiché ni balisé.
 *
 * LES MARCHES SONT CELLES DU BALISAGE, AU MOT PRÈS. Elles viennent du même
 * objet (`servicePageLabels.filAriane`) que le `BreadcrumbList` émis par la
 * route : déclarer à un moteur un chemin que la page n'affiche pas est une
 * déclaration trompeuse, et deux listes écrites séparément divergent toujours.
 *
 * LA DERNIÈRE MARCHE N'EST PAS UN LIEN. C'est la page courante : `aria-current`
 * le dit aux lecteurs d'écran, et elle garde le nom de CATALOGUE de la
 * prestation (« L'Outil », « Le Logiciel ») lisible sur la page, maintenant que
 * le titre principal porte les mots que le client tape.
 *
 * SUR UNE PHOTO, LE FIL EST PLUS CLAIR ET PORTE SON VOILE. Le blanc à 50 % tient
 * 5:1 sur le fond uni du site, mais il tombait à 2,3:1 sur le ciel et le
 * contour de l'église du héros de Caen. À 810 px, il croise la flèche : même
 * avec le voile collé au texte (`VOILE_TEXTE`), le blanc à 80 % restait à
 * 4,35:1. À 90 %, il passe sans assombrir davantage la photo.
 */
function FilAriane({
  marches,
  surPhoto = false,
}: {
  marches: readonly MarcheFilAriane[];
  surPhoto?: boolean;
}) {
  const { filAriane } = servicePageLabels;

  return (
    <nav
      aria-label={filAriane.intitule}
      className={`text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] ${surPhoto ? `text-white/90 ${VOILE_TEXTE}` : "text-white/50"}`}
    >
      <ol className="flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
        {marches.map((marche, index) => (
          <li key={marche.libelle} className="flex items-center gap-[8px]">
            {index > 0 ? (
              <span aria-hidden className={surPhoto ? "text-white/60" : "text-white/25"}>
                {filAriane.separateur}
              </span>
            ) : null}
            {marche.href ? (
              <Link
                href={marche.href}
                className="no-underline transition-colors duration-200 hover:text-foreground"
              >
                {marche.libelle}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {marche.libelle}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * UN FORFAIT, EN RANGÉE ET NON EN CARTE, depuis le 2026-09-23.
 *
 * CE QU'IL REMPLACE. Trois cartes côte à côte, dont celle du milieu inversée
 * en blanc plein, titres à 28 px, prix à 34 px : la seule section de la page
 * qui ne parlait pas la langue du gabarit. Eliott l'a jugée « vraiment pas
 * belle », et c'était mesurable : aucune autre section du site ne pose de
 * carte pleine, toutes découpent l'espace par des filets.
 *
 * LA GRAMMAIRE REPRISE EST CELLE DE L'ACCORDÉON DES PRESTATIONS ET DU HÉROS :
 * un filet haut par rangée, le numéro à 12 px en demi-teinte, deux moitiés
 * séparées par le filet médian de la section, gouttière nulle reportée en
 * rembourrage de part et d'autre. À gauche ce que le forfait promet et à qui ;
 * à droite le prix, ce qu'il contient, et l'action.
 *
 * L'ORANGE NE SERT QU'UNE FOIS PAR FORFAIT RECOMMANDÉ : la pastille et le
 * bouton plein. Les deux autres rangées gardent le lien souligné, second
 * niveau d'action de l'accordéon. Trois boutons orange empilés se seraient
 * annulés les uns les autres.
 */
function PackRow({
  pack,
  numero,
  precedent,
  misEnAvant,
  href,
}: {
  pack: Pack;
  numero: string;
  precedent?: string;
  misEnAvant: boolean;
  /** Prise de rendez-vous, sujet déjà choisi. Composée par l'appelant. */
  href: string;
}) {
  return (
    <li
      data-part="pack"
      className="relative grid grid-cols-1 gap-[24px] py-[30px] tablet:grid-cols-2 tablet:gap-x-0 tablet:py-[40px]"
    >
      <span
        aria-hidden
        className="absolute left-0 right-0 top-0 h-px bg-[rgba(255,255,255,0.1)]"
      />
      <div className="flex flex-col gap-[14px] tablet:pr-[30px] desktop:pr-[40px]">
        <div className="flex h-[20px] items-center gap-[10px]">
          <span className="text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-white/50">
            {numero}
          </span>
          {misEnAvant ? (
            <span className="bg-accent px-[8px] py-[3px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background">
              {servicePageLabels.misEnAvant}
            </span>
          ) : null}
          {pack.surMesure ? (
            <span className="px-[8px] py-[3px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-white/70 ring-1 ring-inset ring-white/25">
              {servicePageLabels.surMesure}
            </span>
          ) : null}
        </div>
        <h3 className="accent-room text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[32px]">
          {pack.nom}
        </h3>
        <p className="max-w-[440px] text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
          {pack.promesse}
        </p>
        <div className="flex max-w-[440px] flex-col gap-[4px] pt-[6px] text-white/60">
          <span className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em]">
            {servicePageLabels.pourQui}
          </span>
          <p className="text-[14px] font-medium leading-[1.4] tracking-[-0.01em]">
            {pack.pourQui}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-[20px] tablet:pl-[30px] desktop:pl-[40px]">
        {/* LE MONTANT EST LE PREMIER ÉLÉMENT DE LA MOITIÉ DROITE, sur la
            ligne du numéro et du nom : l'œil qui descend la colonne de droite
            compare trois prix alignés, sans lire le reste. La durée n'y est
            plus : à côté d'un prix ferme, elle ne servait qu'à le diviser. */}
        <p className="flex flex-col gap-[6px]">
          {pack.surMesure ? (
            <span className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-white/60">
              {servicePageLabels.aPartirDe}
            </span>
          ) : null}
          <span className="text-[32px] font-semibold leading-[1] tracking-[-0.04em] desktop:text-[44px]">
            {prixPack(pack)}
            <span className="ml-[8px] align-baseline text-[13px] font-medium uppercase tracking-[-0.01em] text-white/50">
              {servicePageLabels.horsTaxes}
            </span>
          </span>
        </p>

        <div className="flex flex-col gap-[12px]">
          {precedent ? (
            <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/50">
              {servicePageLabels.toutLePrecedent(precedent)}
            </p>
          ) : null}
          <ul className="flex max-w-[520px] flex-col gap-[10px]">
            {pack.ajoute.map((ligne) => (
              <li
                key={ligne}
                className="text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-white/70"
              >
                {ligne}
              </li>
            ))}
          </ul>
        </div>

        {/* LES DEUX NIVEAUX D'ACTION DE L'ACCORDÉON, à l'identique : bouton
            plein à 30 px pour le forfait recommandé, lien souligné pour les
            autres. Même hauteur, donc même ligne d'appui d'une rangée à
            l'autre. */}
        <Link
          href={href}
          className={
            misEnAvant
              ? "flex h-[30px] w-fit flex-none items-center justify-center bg-accent px-[10px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background no-underline transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
              : "flex h-[30px] w-fit flex-none items-center text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent motion-reduce:transition-none"
          }
        >
          <span className="accent-room">{servicePageLabels.cta}</span>
        </Link>
      </div>
    </li>
  );
}

/**
 * LE CONTEXTE LOCAL D'UNE PAGE DE VILLE, entre le héros et les périmètres.
 *
 * MÊME DÉCOUPE QUE LA SECTION `#devis` : fond clair, deux moitiés, filet sur
 * l'axe, gouttière reportée en rembourrage. Aucun gabarit neuf : une page
 * locale reprend la grammaire de la page de prestation qu'elle décline.
 *
 * Placée AVANT les prix : le visiteur arrivé sur « création site internet
 * Caen » doit lire d'abord ce qui le concerne, lui, à Caen. Les périmètres
 * viennent ensuite, identiques à ceux du site vitrine.
 */
function ContexteLocal({ contexte }: { contexte: PageLocale["contexte"] }) {
  return (
    <section
      data-section="contexte-local"
      className="relative bg-muted px-[20px] py-[60px] text-background tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 hidden w-px bg-black/[0.08] tablet:block"
      />
      <div className="relative mx-auto grid w-full max-w-[1440px] gap-[30px] tablet:grid-cols-2 tablet:gap-x-0 tablet:gap-y-[30px]">
        <div className="flex flex-col gap-[16px] tablet:pr-[30px] desktop:pr-[40px]">
          <h2 className="accent-room max-w-[460px] text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
            {contexte.titre}
          </h2>
          <p className="max-w-[460px] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-background/70">
            {contexte.intro}
          </p>
          <nav
            aria-label={contexte.titreLiens}
            className="mt-[14px] flex max-w-[460px] flex-col gap-[12px]"
          >
            <p className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.02em] text-background/60">
              {contexte.titreLiens}
            </p>
            <ul className="flex flex-col gap-[12px]">
              {contexte.liens.map((lien) => (
                <li key={lien.href} className="flex flex-col gap-[2px]">
                  <Link
                    href={lien.href}
                    className="w-fit text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] underline decoration-black/25 underline-offset-[3px] transition-[text-decoration-color,text-underline-offset] duration-200 hover:decoration-black hover:underline-offset-[4px]"
                  >
                    {lien.libelle}
                  </Link>
                  <span className="text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70">
                    {lien.description}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <ul className="flex flex-col gap-[18px] tablet:pl-[30px] desktop:pl-[40px]">
          {contexte.points.map((point) => (
            <li key={point.titre} className="flex flex-col gap-[6px]">
              <h3 className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em]">
                {point.titre}
              </h3>
              <p className="text-[14px] font-medium leading-[1.45] tracking-[-0.01em] text-background/70">
                {point.corps}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ServicePage({
  prestation,
  site,
  local,
}: {
  prestation: Prestation;
  site: SiteConfig;
  /**
   * Page locale qui décline la prestation (`/creation-site-internet-caen`).
   * Elle remplace le H1, le chapô, la FAQ et prolonge le fil d'Ariane ; les
   * périmètres, les prix et la prise de rendez-vous restent ceux de la
   * prestation.
   */
  local?: PageLocale;
}) {
  // Le lien vers la page locale ne s'affiche que sur la page de prestation :
  // sur la page locale elle-même, il pointerait vers la page courante.
  const lienLocal = local ? undefined : lienLocalParPrestation[prestation.id];

  // Le périmètre du milieu est celui qui se vend : il est mis en avant, comme
  // sur la grille qu'il remplace.
  const avant = 1;
  const { surMesureBloc } = servicePageLabels;

  // Photo de fond portée par la page locale ; les pages de prestation n'en ont
  // pas et gardent leur fond animé.
  const heroImage = local?.heroImage ?? herosPages.prestations[prestation.slug];

  return (
    <>
      <SvgSprite />
      <Header site={site} />
      <main id="main-content" tabIndex={-1}>
        {/* PLUS HAUT SUR MOBILE QUAND LE HÉROS PORTE UNE PHOTO. Le texte est
            calé en bas : à 70svh, le titre de quatre lignes remontait jusqu'au
            fil d'Ariane et ne laissait à la photo qu'une bande de 150 px sous
            la navigation. À 85svh, le sujet de la photo a la place de se lire
            au-dessus du texte. */}
        <section className={`relative flex ${heroImage ? "min-h-[85svh] tablet:min-h-[70svh]" : "min-h-[70svh]"} items-end overflow-hidden bg-background px-[20px] pb-[60px] pt-[140px] text-foreground tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px]`}>
          {heroImage ? (
            <HeroPhoto image={heroImage} />
          ) : (
            <GradientWaveBackdrop seed={51} />
          )}
          <Grain opacity={0.05} className="z-[1]" />
          <span className="absolute inset-y-0 left-1/2 z-[1] w-px bg-white/10" />
          {/* `items-end` À PARTIR DE 810, ET C'EST LE CŒUR DU HÉROS.
              La dernière rangée porte DEUX blocs, un par moitié : le résumé à
              gauche et la fourchette à droite. Par défaut, une cellule de
              grille est étirée et chaque texte se pose EN HAUT de la sienne :
              le résumé descendait sur quatre lignes quand la fourchette en
              tenait une, et la moitié gauche finissait 60 px plus bas que la
              droite, mesuré identique sur les trois pages à 810 comme à 1440.
              Un héros coupé par un filet central qui ne se termine pas au même
              endroit des deux côtés se lit comme un défaut d'assemblage.
              Aligner par le BAS remet les deux dernières lignes sur la même
              ligne d'appui, et ne change rien aux rangées qui n'ont qu'un
              occupant (le retour, le titre). */}
          {/* Ombre de texte sur photo : un halo discret qui détache les lettres des
              détails fins de l'image (contour vert, fenêtres). Héritée par tous
              les textes de la grille. Les voiles de `HeroPhoto` suffisent à
              l'AA ; l'ombre n'est pas comptée dans la mesure. */}
          <div className={`relative z-[2] mx-auto grid w-full max-w-[1440px] gap-[20px] tablet:grid-cols-2 tablet:items-end tablet:gap-x-0 tablet:gap-y-[30px]${heroImage ? " [text-shadow:0_0_18px_rgba(0,0,0,.45)]" : ""}`}>
            <div className="tablet:col-start-1 tablet:row-start-1">
              <FilAriane
                marches={marchesFilAriane(prestation, local)}
                surPhoto={heroImage !== undefined}
              />
            </div>
            <Reveal
              trigger="appear"
              appearId="service-hero-titre"
              initialOpacity={0.001}
              initialY={80}
              duration={1.2}
              className="accent-room overflow-hidden [--accent-room:26px] tablet:col-start-2 tablet:row-start-2"
            >
              {/* LE H1 N'EST PLUS `prestation.nom`, et c'est le seul endroit du
                  site où l'écart entre les deux se voit. « L'Outil » et « Le
                  Logiciel » sont des noms de catalogue : ils rangent l'offre en
                  interne et ne correspondent à aucune requête. Le titre porte
                  maintenant ce que le client cherche ; le nom de catalogue,
                  lui, reste affiché sur la dernière marche du fil d'Ariane, à
                  quelques centimètres au-dessus. */}
              <h1 className="max-w-[510px] text-[63px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[78px] desktop:text-[98px]">
                {local?.h1 ?? servicePageSeo[prestation.id].h1}
              </h1>
            </Reveal>
            {/* `mr` SYMÉTRIQUE DU `pl` D'EN FACE. Le gabarit de la source pose
                le chapô contre l'axe, mais chez elle la moitié droite de cette
                rangée est vide : rien n'est en vis-à-vis. Ici les deux moitiés
                sont occupées, et le résumé se terminait SUR le filet quand la
                fourchette commençait 30 à 40 px après lui. L'air est le même
                des deux côtés du filet. En marge et non en rembourrage : la
                largeur de 340 px est celle du texte, un `pr` l'aurait amputée
                d'autant et changé toutes les coupures de ligne. */}
            <p className={`max-w-[340px] text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-white/60 tablet:col-start-1 tablet:row-start-3 tablet:mr-[30px] tablet:justify-self-end tablet:text-right desktop:mr-[40px]${heroImage ? ` ${VOILE_TEXTE}` : ""}`}>
              {local?.resume ?? prestation.resume}
            </p>
            {/* `pl` À PARTIR DE 810 : la gouttière de cette grille est NULLE
                (les deux colonnes se touchent sur la ligne médiane, c'est le
                gabarit de la source). Le résumé de gauche est calé à droite,
                donc sans ce retrait les deux textes se collent au pixel près et
                se lisent comme une seule phrase cassée en deux. */}
            <p className={`text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/50 tablet:col-start-2 tablet:row-start-3 tablet:pl-[30px] desktop:pl-[40px]${heroImage ? ` ${VOILE_TEXTE}` : ""}`}>
              {servicePageLabels.fourchette}{" "}
              {fourchette(prestation.id, ` ${servicePageLabels.horsTaxes}`)}
            </p>
          </div>
          {heroImage ? <CreditHeroPhoto credit={heroImage.credit} /> : null}
        </section>

        {local ? <ContexteLocal contexte={local.contexte} /> : null}

        {/* LES FORFAITS. Même rembourrage que les sections voisines (60 / 90)
            et même filet médian que le héros : la page garde un seul rythme
            vertical et une seule découpe du haut en bas. Le titre tient dans
            la moitié gauche, comme le H1 tient dans la droite. */}
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
                {servicePageLabels.titrePacks(
                  prestation.packs[2].surMesure === true,
                )}
              </h2>
              {/* LA RÉASSURANCE SE LIT AU MOMENT DU CHOIX, en vis-à-vis du
                  titre et sur sa ligne d'appui, comme le chapô du héros :
                  devant 18 000 €, le lecteur cherche d'abord comment il paie
                  et si le montant peut bouger. */}
              <p className="max-w-[440px] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-white/80 tablet:pl-[30px] desktop:pl-[40px]">
                {servicePageLabels.reassurance}
              </p>
            </div>
            <ol className="flex flex-col">
              {prestation.packs.map((pack, index) => (
                <PackRow
                  key={pack.id}
                  pack={pack}
                  numero={String(index + 1).padStart(2, "0")}
                  precedent={
                    index > 0 ? prestation.packs[index - 1].nom : undefined
                  }
                  misEnAvant={index === avant}
                  /* ANCRE LOCALE : la prise de rendez-vous est sur cette page,
                     avec le bon sujet déjà coché. */
                  href="#rendez-vous"
                />
              ))}
            </ol>
            {lienLocal ? (
              <p className="border-t border-white/10 pt-[30px] text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-white/60 tablet:pt-[40px]">
                {lienLocal.avant}{" "}
                <Link
                  href={lienLocal.href}
                  className="text-foreground underline decoration-white/30 underline-offset-[3px] transition-[text-decoration-color,text-underline-offset] duration-200 hover:decoration-white hover:underline-offset-[4px]"
                >
                  {lienLocal.libelle}
                </Link>
              </p>
            ) : null}
          </div>
        </section>

        {/* SUR MESURE, SUR DEVIS. Même découpe que le contexte local des pages
            de ville : fond clair, deux moitiés, filet sur l'axe. À gauche ce
            qui sort des forfaits, à droite les trois questions du
            questionnaire de rendez-vous, pour que le visiteur arrive à
            l'agenda en sachant ce qu'on va lui demander.

            `id="devis"` : l'ancre est gardée, `lienDevis()` y mène toujours. */}
        <section
          id="devis"
          data-section="sur-mesure"
          className="relative scroll-mt-[100px] bg-muted px-[20px] py-[60px] text-background tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-1/2 hidden w-px bg-black/[0.08] tablet:block"
          />
          <div className="relative mx-auto grid w-full max-w-[1440px] gap-[40px] tablet:grid-cols-2 tablet:gap-x-0">
            <div className="flex flex-col gap-[16px] tablet:pr-[30px] desktop:pr-[40px]">
              <h2 className="accent-room max-w-[420px] text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
                {surMesureBloc.titre}
              </h2>
              <p className="max-w-[460px] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-background/70">
                {prestation.horsPack}
              </p>
            </div>
            <div className="flex flex-col gap-[20px] tablet:pl-[30px] desktop:pl-[40px]">
              <div className="flex max-w-[460px] flex-col gap-[16px]">
                {/* MÊME CORPS QUE LE TITRE D'EN FACE : le chemin qui mène au
                    rendez-vous ne peut pas peser moins que l'exception qu'il
                    côtoie. */}
                <h3 className="accent-room max-w-[420px] text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
                  {surMesureBloc.titreQuestions}
                </h3>
                <p className="text-[14px] font-medium leading-[1.45] tracking-[-0.01em] text-background/70">
                  {surMesureBloc.introQuestions}
                </p>
              </div>
              <ol className="flex flex-col">
                {surMesureBloc.questions.map((question, index) => (
                  <li
                    key={question.titre}
                    className="grid grid-cols-[32px_1fr] gap-x-[10px] border-t border-black/[0.08] py-[16px]"
                  >
                    <span className="pt-[2px] text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-background/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-[6px]">
                      <p className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em]">
                        {question.titre}
                      </p>
                      <p className="max-w-[460px] text-[14px] font-medium leading-[1.45] tracking-[-0.01em] text-background/70">
                        {question.corps}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {/* LE BOUTON SUIT LES QUESTIONS qu'il vient d'annoncer : placé
                  à gauche, il se lisait avant elles. Plein, à l'accent, comme
                  l'action principale de la rangée recommandée. */}
              <Link
                href="#rendez-vous"
                className="flex h-[30px] w-fit flex-none items-center justify-center bg-accent px-[10px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background no-underline transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
              >
                <span className="accent-room">{surMesureBloc.cta}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* LA PRISE DE RENDEZ-VOUS EST ICI, ET PLUS SEULEMENT UN LIEN VERS ELLE.
            La page portait trois boutons « En parler » menant tous à
            `/contact?sujet=…` : trois occasions de partir, aucune de réserver.
            Le visiteur qui vient de lire les prix et le périmètre d'une
            prestation est exactement celui qui est prêt à poser une date, et
            l'envoyer sur une autre page pour ça lui coûtait un chargement, un
            défilement et un choix.

            LE SUJET EST IMPOSÉ, pas suggéré : la prestation qu'on vient de lire
            EST le type de rendez-vous. `RDV_PAR_PRESTATION` porte la
            correspondance, qui n'est pas l'identité (« vitrine » devient
            « site »). */}
        <SectionRendezVous
          emailContact={site.contact.email}
          typeImpose={RDV_PAR_PRESTATION[prestation.id]}
        />

        {local ? (
          <FaqSection
            faq={[...local.faq.items]}
            eyebrow={local.faq.eyebrow}
            titleLines={local.faq.titleLines}
          />
        ) : (
          <FaqSection faq={[...faqItems]} />
        )}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
