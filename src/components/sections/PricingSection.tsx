"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Grain } from "@/components/effects/Grain";
import { LineReveal } from "@/components/motion/LineReveal";
import { ParallaxBackdrop } from "@/components/motion/ParallaxBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SignatureMark } from "@/components/sections/SignatureMark";
import { Icon } from "@/components/ui/Icon";
import { siteFeatures } from "@/content/features";
import {
  delaiPack,
  lignesComparees,
  packContient,
  prestations,
  prixPack,
  type LigneComparee,
  type Pack,
  type Prestation,
} from "@/content/offre";
import { lienRendezVous, RDV_PAR_PRESTATION } from "@/content/rendez-vous";
import { servicePageLabels } from "@/content/service-pages";
import { lienDevis, tarifsLabels } from "@/content/tarifs";
import { pricingPromise } from "@/content/testimonials";
import { uiLabels } from "@/content/ui";

/**
 * SECTION TARIFS — le gabarit « Quote + Pricing » du template, rempli par
 * l'offre réelle.
 *
 * CE QUI EST REPRIS DE LA SOURCE, et c'est sa structure entière :
 *   - un bloc d'ouverture à cheval sur un filet vertical central, œil à gauche,
 *     portrait et paraphe d'un côté, grande citation alignée à droite ;
 *   - un titre de section posé dans la MOITIÉ DROITE, au-dessus des colonnes ;
 *   - un tableau comparatif en deux moitiés : les libellés à gauche, les
 *     colonnes de prix à droite, une coche par cellule, un bouton par colonne ;
 *   - des pastilles de sélection au-dessus du tableau dès que la largeur ne
 *     permet plus de tout montrer ;
 *   - la barre d'accent en bas à droite et le grain de la source.
 *
 * CE QUI N'EN VIENT PAS : une seule phrase. Aucun libellé, aucun intitulé de
 * colonne et aucune ligne de tableau n'est traduit du template ; tout descend de
 * `offre.ts` et de `tarifs.ts`.
 *
 * TROIS PRESTATIONS, PAS DEUX. La question s'est posée de ne garder que le site
 * et le logiciel. Retirer L'Outil de la SEULE section qui le chiffre laisserait
 * une prestation vendue, dotée de sa page et de son sujet de rendez-vous,
 * invisible au moment où le visiteur regarde les prix. Une pastille de plus ne
 * coûte rien en hauteur ; une prestation absente coûte les projets qu'elle
 * décrit.
 *
 * LA MATRICE NE PORTE AUCUNE DONNÉE. Elle est dérivée de `ajoute`, qui liste
 * déjà ce que chaque périmètre ajoute au précédent : voir `lignesComparees()`.
 */

/** Stack de police littérale du template (le nom de famille est hashé). */
const FONT = "[font-family:var(--font-sans)]";

/** La colonne mise en avant, comme sur les pages de prestation : la médiane. */
const MIS_EN_AVANT = 1;

/* --------------------------- Bloc d'ouverture --------------------------- */

/**
 * Citation d'ouverture : l'engagement de facturation, à l'endroit exact où le
 * visiteur se demande si le montant affiché va déraper.
 */
function BlocCitation() {
  const auteur = pricingPromise.author;
  const portrait = auteur?.avatar;

  return (
    <div className="relative flex w-full flex-col items-center gap-[30px] overflow-hidden tablet:gap-0">
      {/* Œil à gauche, auteur à droite. L'ordre visuel s'inverse sous 810 :
          la citation passe en tête, l'auteur la signe en dessous. */}
      <div className="relative order-2 flex w-full flex-col gap-[12px] tablet:order-1 tablet:flex-row tablet:items-start tablet:gap-0 tablet:pb-[50px] tablet:pt-[30px]">
        <div className="relative hidden w-px flex-[1_0_0] flex-row items-start justify-start gap-[10px] tablet:flex">
          <p className="whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
            {tarifsLabels.eyebrow}
          </p>
        </div>

        <div className="relative flex w-full flex-row items-end justify-start gap-[20px] overflow-hidden tablet:w-px tablet:flex-[1_0_0] tablet:gap-[30px] tablet:pt-[50px]">
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
            {/* LE PARAPHE VIENT DE `SignatureMark`, source unique du dessin. Le
                template en posait un autre à cet endroit, qui épelait le nom de
                sa propre marque : le site montrait deux signatures différentes
                à deux endroits où le lecteur croit voir la même. */}
            {siteFeatures.signature ? (
              <SignatureMark className="mt-[6px] block h-auto w-[150px] opacity-90 desktop:w-[180px]" />
            ) : null}
          </Reveal>
        </div>
      </div>

      <div className="relative order-1 flex w-full flex-col gap-[12px] tablet:order-2 tablet:flex-row tablet:items-start tablet:gap-0">
        <div className="relative flex w-full flex-col items-start gap-[14px] overflow-hidden tablet:w-1/2 tablet:items-end tablet:gap-[30px]">
          <p className="m-0 flex w-full max-w-[550px] flex-col justify-center text-left text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground tablet:text-right tablet:text-[26px] desktop:text-[32px]">
            <LineReveal
              text={pricingPromise.quote}
              className="block w-full"
              lineClassName="w-full overflow-hidden"
              delay={0.1}
            />
          </p>
          <Reveal
            as="p"
            initialOpacity={0.001}
            delay={0.15}
            className="m-0 h-auto w-full max-w-[230px] text-left text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 [text-wrap:balance] tablet:text-right"
          >
            {tarifsLabels.quoteFooter}
          </Reveal>
        </div>
      </div>

      {/* Filet vertical central, en fondu vers le bas. Il n'existe qu'à partir
          de 810 : sous cette largeur, les deux moitiés sont empilées. */}
      <div
        aria-hidden
        className="absolute bottom-0 left-[calc(50%-0.5px)] top-0 z-[1] hidden w-px overflow-hidden bg-foreground opacity-10 [-webkit-mask:linear-gradient(#000_37%,#0000_100%)] [mask:linear-gradient(#000_37%,#0000_100%)] tablet:block"
      />
    </div>
  );
}

/* ------------------------------ Pastilles ------------------------------- */

function Pastille({
  libelle,
  actif,
  onClick,
}: {
  libelle: string;
  actif: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={
        "relative flex h-[28px] flex-none cursor-pointer items-center justify-center px-[10px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] transition-colors duration-200 " +
        (actif
          ? "bg-foreground text-background"
          : "border border-white/10 text-foreground hover:border-white/30")
      }
    >
      <span className="accent-room whitespace-pre">{libelle}</span>
    </button>
  );
}


/* -------------------------- Colonnes du tableau -------------------------- */

/**
 * En-tête d'une colonne : le nom du périmètre, et ce qu'il promet.
 *
 * LA PASTILLE « RECOMMANDÉ » OCCUPE SA PLACE DANS LES TROIS COLONNES, visible
 * dans une seule. Rendue conditionnellement, elle poussait « La Crédibilité »
 * 22 px sous ses deux voisines : trois titres qu'on ne peut plus lire d'une
 * seule ligne d'œil annulent l'intérêt de les mettre côte à côte.
 */
function EnTeteColonne({ pack, misEnAvant }: { pack: Pack; misEnAvant: boolean }) {
  return (
    <div className="flex flex-col items-start gap-[8px] pb-[30px] tablet:pb-[40px]">
      {/* LA PLACE EST RÉSERVÉE DANS LES TROIS COLONNES, l'encre dans une seule.
          Rendue conditionnellement, la pastille poussait « La Crédibilité »
          22 px sous ses deux voisines. Sous 810 il n'y a plus de colonnes à
          aligner : la carte n'en montre qu'une, et une réserve vide y serait un
          blanc de 20 px sans raison. */}
      <span
        className={
          "bg-accent px-[8px] py-[3px] text-[10px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background " +
          (misEnAvant ? "" : "invisible hidden tablet:block")
        }
      >
        {servicePageLabels.misEnAvant}
      </span>
      <p className="accent-room text-[16px] font-semibold uppercase leading-[1.05] tracking-[-0.02em] text-foreground desktop:text-[20px]">
        {pack.nom}
      </p>
      <p className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60 [text-wrap:balance]">
        {pack.promesse}
      </p>
    </div>
  );
}

/**
 * Le prix, et la durée estimée juste dessous.
 *
 * LES DEUX SE TOUCHENT, et c'est assumé : c'est ce qui permet de juger si le
 * périmètre est sérieux. Le taux journalier s'en déduit, il est de toute façon
 * dans la nature dès qu'on publie une durée et un montant. Ce qui compte est de
 * ne pas le REVENDIQUER.
 */
function Prix({ pack }: { pack: Pack }) {
  return (
    <div className="flex flex-col items-start gap-[2px]">
      <p className="whitespace-pre text-[24px] font-semibold leading-[1] tracking-[-0.03em] text-foreground desktop:text-[30px]">
        {prixPack(pack)}
        <span className="ml-[5px] align-baseline text-[12px] font-medium uppercase tracking-[-0.01em] text-foreground-60">
          {servicePageLabels.horsTaxes}
        </span>
      </p>
      <p className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
        {delaiPack(pack)}
      </p>
    </div>
  );
}

/** Le bouton d'une colonne. Trois colonnes, trois boutons, un seul sujet. */
function BoutonRdv({
  href,
  aria,
  misEnAvant,
}: {
  href: string;
  aria: string;
  misEnAvant: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={aria}
      className={
        "flex min-h-[34px] w-full items-center justify-center px-[10px] py-[8px] text-center text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] no-underline transition-opacity duration-200 hover:opacity-80 " +
        (misEnAvant ? "bg-accent text-background" : "bg-foreground text-background")
      }
    >
      <span className="accent-room">{uiLabels.services.rdvLabel}</span>
    </Link>
  );
}

/**
 * LA MATRICE, à partir de 810.
 *
 * UNE SEULE GRILLE, et c'est ce qui garantit l'alignement. Le template empile
 * deux blocs indépendants (les libellés à gauche, les colonnes à droite) et cale
 * ses rangées sur une hauteur fixe de 50 px. Nos libellés sont des phrases : à
 * 810, « la mesure installée : d'où viennent les visites… » passe sur trois
 * lignes et sortirait de la rangée. Ici chaque rangée se dimensionne sur son
 * contenu, et les quatre colonnes restent d'aplomb quelle que soit la longueur
 * du texte.
 *
 * `3fr` POUR LA COLONNE DES LIBELLÉS : 3fr + 3 × 1fr = 6fr, donc la moitié
 * exacte, qui est le partage de toutes les sections sombres du site.
 */
function Matrice({
  prestation,
  lignes,
  rdv,
}: {
  prestation: Prestation;
  lignes: readonly LigneComparee[];
  rdv: string;
}) {
  return (
    <div className="hidden w-full grid-cols-[3fr_repeat(3,minmax(0,1fr))] items-start gap-x-[10px] tablet:grid">
      {/* Rangée des noms. La cellule de gauche est vide : il n'y a rien à
          annoncer avant d'avoir montré ce qu'on compare. */}
      <div />
      {prestation.packs.map((pack, index) => (
        <EnTeteColonne
          key={pack.id}
          pack={pack}
          misEnAvant={index === MIS_EN_AVANT}
        />
      ))}

      {/* Rangée des prix. Le libellé de la colonne de gauche se cale sur la
          ligne d'appui des montants, comme dans la source. */}
      <p className="self-end pb-[6px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 [text-wrap:balance]">
        {tarifsLabels.colonne}
      </p>
      {prestation.packs.map((pack) => (
        <Prix key={pack.id} pack={pack} />
      ))}

      {/* PREMIÈRE RANGÉE DU CORPS : le cas de figure qui doit faire choisir. Une
          coche ne dit pas à QUI un périmètre s'adresse, et c'est pourtant la
          première chose qu'on cherche devant trois colonnes. La source admet des
          cellules de texte ; celle-ci en est une. */}
      <p className="border-t border-white/10 pr-[16px] pt-[16px] text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
        {servicePageLabels.pourQui}
      </p>
      {prestation.packs.map((pack) => (
        <p
          key={pack.id}
          className="border-t border-white/10 pr-[10px] pt-[16px] text-[13px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground-60"
        >
          {pack.pourQui}
        </p>
      ))}

      {lignes.map((ligne) => (
        <Fragment key={ligne.libelle}>
          <p className="flex min-h-[50px] items-center border-t border-white/10 pr-[16px] text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground [text-wrap:balance]">
            {ligne.libelle}
          </p>
          {prestation.packs.map((pack, index) => {
            const compris = packContient(ligne, index);
            return (
              <div
                key={pack.id}
                className="flex min-h-[50px] items-center justify-start border-t border-white/10"
              >
                {compris ? (
                  <Icon name="check" size={14} className="shrink-0 text-accent" />
                ) : (
                  <span aria-hidden className="block h-px w-[12px] bg-white/25" />
                )}
                <span className="sr-only">
                  {compris ? tarifsLabels.compris : tarifsLabels.absent}
                </span>
              </div>
            );
          })}
        </Fragment>
      ))}

      <div />
      {prestation.packs.map((pack, index) => (
        <div key={pack.id} className="pt-[40px]">
          <BoutonRdv
            href={rdv}
            aria={tarifsLabels.rdvAria(prestation.nom, pack.nom)}
            misEnAvant={index === MIS_EN_AVANT}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * LE PÉRIMÈTRE CHOISI, sous 810.
 *
 * TROIS COLONNES NE TIENNENT PAS SUR 390 PX, et la source ne l'essaie pas non
 * plus : elle bascule sur un sélecteur et n'affiche qu'un plan. La différence
 * est qu'elle garde ses tirets, ce qui donne une colonne de « non » aussi longue
 * que la colonne de « oui ». Ici la carte liste ce que le périmètre CONTIENT,
 * cumul compris : le sélecteur au-dessus reste le moyen de comparer, et la
 * lecture de gauche à droite disparaît avec la place de la faire.
 */
function CartePerimetre({
  prestation,
  pack,
  lignes,
  index,
  rdv,
}: {
  prestation: Prestation;
  pack: Pack;
  lignes: readonly LigneComparee[];
  index: number;
  rdv: string;
}) {
  const comprises = lignes.filter((ligne) => packContient(ligne, index));
  return (
    <div className="flex w-full flex-col gap-[18px] border-t border-white/10 pt-[20px] tablet:hidden">
      <EnTeteColonne pack={pack} misEnAvant={index === MIS_EN_AVANT} />
      <Prix pack={pack} />
      <div className="flex flex-col gap-[4px]">
        <span className="text-[11px] font-semibold uppercase leading-[1.2] tracking-[0.02em] text-foreground-60">
          {servicePageLabels.pourQui}
        </span>
        <p className="text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground">
          {pack.pourQui}
        </p>
      </div>
      <div className="flex flex-col gap-[10px]">
        <span className="text-[11px] font-semibold uppercase leading-[1.2] tracking-[0.02em] text-foreground-60">
          {tarifsLabels.colonne}
        </span>
        <ul className="flex flex-col gap-[10px]">
          {comprises.map((ligne) => (
            <li key={ligne.libelle} className="flex items-start gap-[10px]">
              <Icon
                name="check"
                size={14}
                className="mt-[3px] shrink-0 text-accent"
              />
              <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground">
                {ligne.libelle}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <BoutonRdv
        href={rdv}
        aria={tarifsLabels.rdvAria(prestation.nom, pack.nom)}
        misEnAvant={index === MIS_EN_AVANT}
      />
    </div>
  );
}

/* -------------------------------- Section -------------------------------- */

export function PricingSection() {
  /* DEUX SÉLECTEURS, ET UN SEUL EST VISIBLE À LA FOIS. La prestation commande la
     section à toutes les largeurs ; le périmètre ne commande que sous 810, où
     trois colonnes ne tiennent pas côte à côte. */
  const [prestationActive, setPrestationActive] = useState(0);
  const [perimetreActif, setPerimetreActif] = useState(MIS_EN_AVANT);

  const prestation: Prestation = prestations[prestationActive];
  const lignes = lignesComparees(prestation.id);
  const rdv = lienRendezVous(RDV_PAR_PRESTATION[prestation.id]);

  return (
    <section
      id="tarifs"
      data-section="tarifs"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start overflow-hidden bg-background " +
        "px-[20px] pb-[50px] tablet:px-[24px] tablet:pb-[100px] desktop:px-[30px]"
      }
    >
      <div className="relative z-[2] flex w-full max-w-[1440px] flex-col items-start gap-[50px] pt-[30px] tablet:gap-[70px] tablet:pt-0">
        <BlocCitation />

        <div className="relative flex w-full flex-col items-end justify-end gap-[30px] tablet:gap-[50px] desktop:gap-[60px]">
          {/* Titre et chapô dans la moitié droite dès 1200, comme la source. */}
          <div className="relative flex w-full flex-col items-start justify-start gap-[20px] tablet:gap-[30px] desktop:w-1/2">
            <h2 className="m-0 flex w-full max-w-full flex-col justify-center p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-foreground tablet:text-[68px] desktop:text-[92px]">
              <span className="accent-room block w-full overflow-hidden leading-[0.82]">
                <Reveal
                  as="span"
                  className="inline-block whitespace-pre-wrap"
                  initialOpacity={0.001}
                  initialY={40}
                  duration={0.8}
                  delay={0.1}
                >
                  {tarifsLabels.titre}
                </Reveal>
              </span>
            </h2>
            <p className="max-w-[560px] text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground-60">
              {tarifsLabels.intro}
            </p>
          </div>

          <div className="flex w-full flex-col gap-[26px] tablet:gap-[20px]">
            {/* LES PASTILLES DE PRESTATION. Une prestation est déjà choisie à
                l'arrivée : rien n'est caché derrière un clic, le tableau est
                rempli dès le premier regard, et les pastilles ne font que le
                reconfigurer. Ce n'est pas le « choisis ta case avant de lire »
                que le dépôt a écarté trois fois. */}
            <div
              role="group"
              aria-label={tarifsLabels.selecteurLabel}
              className="flex w-full flex-row flex-wrap items-center gap-[10px]"
            >
              {prestations.map((p, index) => (
                <Pastille
                  key={p.id}
                  libelle={p.nom}
                  actif={index === prestationActive}
                  onClick={() => setPrestationActive(index)}
                />
              ))}
            </div>

            {/* LES PASTILLES DE PÉRIMÈTRE n'existent que sous 810. */}
            <div
              role="group"
              aria-label={tarifsLabels.perimetreLabel}
              className="flex w-full flex-row flex-wrap items-center gap-[10px] tablet:hidden"
            >
              {prestation.packs.map((pack, index) => (
                <Pastille
                  key={pack.id}
                  libelle={pack.nom}
                  actif={index === perimetreActif}
                  onClick={() => setPerimetreActif(index)}
                />
              ))}
            </div>

            <Matrice prestation={prestation} lignes={lignes} rdv={rdv} />
            <CartePerimetre
              prestation={prestation}
              pack={prestation.packs[perimetreActif]}
              lignes={lignes}
              index={perimetreActif}
              rdv={rdv}
            />

            {/* Pied du tableau, sur les deux moitiés : ce que le forfait ne
                couvre pas à gauche, la réserve sur les durées à droite. */}
            <div className="flex w-full flex-col gap-[20px] pt-[30px] tablet:flex-row tablet:gap-0">
              <div className="flex w-full flex-col items-start gap-[10px] tablet:w-1/2 tablet:pr-[30px]">
                <p className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
                  {tarifsLabels.horsPackLabel}
                </p>
                <p className="max-w-[460px] text-[13px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60">
                  {prestation.horsPack}
                </p>
                {/* LE BLOC « POURQUOI UN DEVIS NE TOMBE JAMAIS PILE » N'EST PAS
                    RECOPIÉ ICI, il est lié. Voir l'arbitrage dans `tarifs.ts`. */}
                <Link
                  href={lienDevis(prestation.slug)}
                  className="text-[12px] font-semibold uppercase leading-[1.3] tracking-[-0.01em] text-foreground underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent motion-reduce:transition-none"
                >
                  <span className="accent-room">{tarifsLabels.lienDevis}</span>
                </Link>
              </div>
              <p className="w-full max-w-[560px] text-[11px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground-60 tablet:w-1/2 tablet:pl-[30px]">
                {tarifsLabels.note}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'accent en bas à droite : elle annonce la section orange qui
          suit, comme la barre basse de l'accordéon des services le faisait avant
          que cette section vienne s'intercaler. */}
      <div className="absolute bottom-0 right-0 z-[3] h-[20px] w-1/2 overflow-hidden bg-accent tablet:h-[30px]" />
      <Grain opacity={0.05} className="z-[2]" />
    </section>
  );
}
