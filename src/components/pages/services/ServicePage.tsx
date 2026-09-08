import Link from "next/link";
import { SvgSprite } from "@/components/SvgSprite";
import { FloatingNav, Footer, Header } from "@/components/layout";
import { FaqSection } from "@/components/sections/FaqSection";
import { faqItems } from "@/content/faq";
import { Reveal } from "@/components/motion/Reveal";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Grain } from "@/components/effects/Grain";
import { Icon } from "@/components/ui/Icon";
import type { SiteConfig } from "@/lib/content/types";
import {
  delaiPack,
  fourchette,
  prixPack,
  type Pack,
  type Prestation,
} from "@/content/offre";
import { servicePageLabels, servicePageSeo } from "@/content/service-pages";
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
 * LE TAUX JOURNALIER N'APPARAÎT PAS. Il construit tous les montants de la page
 * et ne s'affiche nulle part : le périmètre est l'argument, le taux n'est que
 * l'arithmétique. Voir l'en-tête de `offre.ts`.
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
 */
function FilAriane({ prestation }: { prestation: Prestation }) {
  const { filAriane } = servicePageLabels;
  const marches: readonly { libelle: string; href?: string }[] = [
    { libelle: filAriane.accueil, href: "/" },
    { libelle: filAriane.prestations, href: "/#services" },
    { libelle: prestation.nom },
  ];

  return (
    <nav
      aria-label={filAriane.intitule}
      className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/50"
    >
      <ol className="flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
        {marches.map((marche, index) => (
          <li key={marche.libelle} className="flex items-center gap-[8px]">
            {index > 0 ? (
              <span aria-hidden className="text-white/25">
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
 * Une carte de périmètre.
 *
 * `precedent` porte le nom du pack de gauche : à partir du deuxième, la liste
 * n'énumère que le DELTA, et cette phrase dit à quoi il s'ajoute. Sans elle, le
 * lecteur croit que le pack le plus cher contient moins de choses que le premier,
 * puisque sa liste est plus courte.
 */
function PackCard({
  pack,
  precedent,
  misEnAvant,
  href,
}: {
  pack: Pack;
  precedent?: string;
  misEnAvant: boolean;
  /** Prise de rendez-vous, sujet déjà choisi. Composée par l'appelant. */
  href: string;
}) {
  return (
    /* LES SIX RANGÉES DE LA CARTE SONT CELLES DE LA GRILLE, à partir de 810.
       Chaque carte était une colonne flex autonome : ses rangées se calaient
       sur SON contenu, donc le prix de « La Crédibilité » tombait 46 px plus
       bas que celui de ses voisines sur `/services/logiciel-metier` à 810, et
       27 px plus bas sur `/services/outil-metier` à 1440, parce que son titre
       passe à la ligne et pas les leurs. Trois montants qu'on ne peut comparer
       qu'en balayant du regard de haut en bas annulent l'intérêt de les mettre
       côte à côte. En `grid-rows-subgrid`, les six rangées (titre, promesse,
       prix, pour qui, liste, bouton) sont des pistes de la grille PARENTE :
       elles sont communes aux trois cartes, donc chaque ligne démarre au même
       y d'un bout à l'autre.

       `grid-cols-1` EST OBLIGATOIRE, et ce n'est pas une redondance. Sans
       colonne déclarée, la carte n'a qu'une piste implicite en `auto`, dont la
       limite haute est le max-content de ses éléments. La rangée du titre porte
       le titre ET la pastille « Recommandé » en `justify-between` : son
       max-content vaut 236 px pour 191 px disponibles, et la carte du milieu
       débordait sa propre boîte de 15 px, texte par-dessus le fond blanc.
       `repeat(1, minmax(0, 1fr))` borne la piste à la largeur de la carte.

       LES GOUTTIÈRES PASSENT EN MARGES. Une sous-grille impose une gouttière
       unique à toutes ses pistes, or l'écart titre → promesse vaut 10 px et
       tous les autres 24 px. Gouttière nulle et marge haute par élément rendent
       exactement le rythme d'avant, et la marge compte dans le dimensionnement
       de la piste, donc l'alignement tient. */
    <article
      data-part="pack"
      className={
        "relative flex h-full flex-col gap-[24px] p-[24px] tablet:row-span-6 tablet:grid tablet:grid-cols-1 tablet:grid-rows-subgrid tablet:gap-y-0 tablet:p-[30px] " +
        (misEnAvant
          ? "bg-foreground text-background"
          : "bg-white/[0.04] text-foreground ring-1 ring-inset ring-white/10")
      }
    >
      <header className="tablet:contents">
        {/* LE SIGNALEMENT EST DANS LE FLUX, plus posé en absolu au coin de la
            carte. En absolu, il ne réservait aucune place : à 810, où les trois
            colonnes tombent à 240 px, « LE LOGICIEL COMPLET » passait dessous et
            se lisait « LE LOGIC RECOMMANDÉ COMPLET ». Sur la même ligne, le
            titre se coupe devant lui au lieu de passer dessous, et la position
            haute-droite reste celle du gabarit. */}
        <div className="flex items-start justify-between gap-[12px]">
          {/* `min-w-0` : sans lui, le titre garde sa largeur de min-content
              (le mot le plus long, « CRÉDIBILITÉ », 155 px à 24 px de corps) et
              la pastille, qui ne se comprime pas, était poussée 15 px HORS de
              la carte à 810 — une étiquette verte posée à cheval sur le bord du
              fond blanc. Mesuré sur la carte du milieu des trois pages. */}
          <h3 className="accent-room min-w-0 max-w-[240px] text-[24px] font-semibold uppercase leading-[0.95] tracking-[-0.03em] desktop:text-[28px]">
            {pack.nom}
          </h3>
          {misEnAvant ? (
            <span className="shrink-0 bg-accent px-[8px] py-[4px] text-[10px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background">
              {servicePageLabels.misEnAvant}
            </span>
          ) : null}
        </div>
        <p
          className={
            "mt-[10px] text-[15px] font-medium leading-[1.3] tracking-[-0.01em] tablet:mt-0 tablet:pt-[10px] " +
            (misEnAvant ? "text-background" : "text-foreground")
          }
        >
          {pack.promesse}
        </p>
      </header>

      {/* LE PRIX ET LA DURÉE SE TOUCHENT, et c'est assumé : c'est ce qui permet
          au visiteur de juger si le périmètre est sérieux. Le taux journalier
          s'en déduit, il est de toute façon dans la nature dès qu'on publie une
          durée et un montant. Ce qui compte est de ne pas le REVENDIQUER. */}
      <div className="flex flex-col gap-[4px] tablet:pt-[24px]">
        <p className="text-[30px] font-semibold leading-[1] tracking-[-0.03em] desktop:text-[34px]">
          {prixPack(pack)}
          <span
            className={
              "ml-[6px] align-baseline text-[13px] font-medium uppercase tracking-[-0.01em] " +
              (misEnAvant ? "text-background/60" : "text-white/50")
            }
          >
            {servicePageLabels.horsTaxes}
          </span>
        </p>
        <p
          className={
            "text-[13px] font-medium leading-[1.3] tracking-[-0.01em] " +
            (misEnAvant ? "text-background/70" : "text-white/60")
          }
        >
          {delaiPack(pack)}
        </p>
      </div>

      {/* Le libellé est sur SA PROPRE LIGNE. Sur la même, il donnait « POUR VOUS
          SI Vous n'avez rien en ligne » : deux majuscules qui se suivent et une
          phrase qui semble commencer deux fois. */}
      <div
        className={
          "flex flex-col gap-[4px] tablet:pt-[24px] " +
          (misEnAvant ? "text-background/70" : "text-white/60")
        }
      >
        <span className="text-[11px] font-semibold uppercase leading-[1.2] tracking-[0.02em]">
          {servicePageLabels.pourQui}
        </span>
        <p className="text-[13px] font-medium leading-[1.4] tracking-[-0.01em]">
          {pack.pourQui}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-[12px] tablet:pt-[24px]">
        {precedent ? (
          <p
            className={
              "text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] " +
              (misEnAvant ? "text-background/60" : "text-white/50")
            }
          >
            {servicePageLabels.toutLePrecedent(precedent)}
          </p>
        ) : null}
        <ul className="flex flex-col gap-[10px]">
          {pack.ajoute.map((ligne) => (
            <li key={ligne} className="flex items-start gap-[10px]">
              <Icon
                name="check"
                size={14}
                className={
                  "mt-[3px] shrink-0 " +
                  (misEnAvant ? "text-background" : "text-accent")
                }
              />
              <span
                className={
                  "text-[14px] font-medium leading-[1.35] tracking-[-0.01em] " +
                  (misEnAvant ? "text-background/80" : "text-white/70")
                }
              >
                {ligne}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* IL POINTAIT SUR `/contact` NU, donc sur le formulaire de contact, et
          le visiteur qui venait de choisir un périmètre se voyait redemander ce
          qu'il cherchait. Il mène maintenant à la prise de rendez-vous avec son
          sujet déjà coché. */}
      <Link
        href={href}
        className={
          "flex h-[36px] flex-none items-center justify-center px-[14px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] no-underline transition-opacity duration-200 hover:opacity-80 tablet:mt-[24px] " +
          (misEnAvant
            ? "bg-accent text-background"
            : "bg-foreground text-background")
        }
      >
        <span className="accent-room">{servicePageLabels.cta}</span>
      </Link>
    </article>
  );
}

export function ServicePage({
  prestation,
  site,
}: {
  prestation: Prestation;
  site: SiteConfig;
}) {
  // Le périmètre du milieu est celui qui se vend : il est mis en avant, comme
  // sur la grille qu'il remplace.
  const avant = 1;

  return (
    <>
      <SvgSprite />
      <Header site={site} />
      <main id="main-content" tabIndex={-1}>
        <section className="relative flex min-h-[70svh] items-end overflow-hidden bg-background px-[20px] pb-[60px] pt-[140px] text-foreground tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px]">
          <GradientWaveBackdrop seed={51} />
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
          <div className="relative z-[2] mx-auto grid w-full max-w-[1440px] gap-[20px] tablet:grid-cols-2 tablet:items-end tablet:gap-x-0 tablet:gap-y-[30px]">
            <div className="tablet:col-start-1 tablet:row-start-1">
              <FilAriane prestation={prestation} />
            </div>
            <Reveal
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
                {servicePageSeo[prestation.id].h1}
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
            <p className="max-w-[340px] text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-white/60 tablet:col-start-1 tablet:row-start-3 tablet:mr-[30px] tablet:justify-self-end tablet:text-right desktop:mr-[40px]">
              {prestation.resume}
            </p>
            {/* `pl` À PARTIR DE 810 : la gouttière de cette grille est NULLE
                (les deux colonnes se touchent sur la ligne médiane, c'est le
                gabarit de la source). Le résumé de gauche est calé à droite,
                donc sans ce retrait les deux textes se collent au pixel près et
                se lisent comme une seule phrase cassée en deux. */}
            <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/50 tablet:col-start-2 tablet:row-start-3 tablet:pl-[30px] desktop:pl-[40px]">
              {servicePageLabels.fourchette} {fourchette(prestation.id)}{" "}
              {servicePageLabels.horsTaxes}
            </p>
          </div>
        </section>

        {/* RIEN EN HAUT DE CETTE SECTION JUSQU'ICI : elle n'avait pas de
            rembourrage haut du tout. Le titre « 3 périmètres, et ce qui les
            sépare » démarrait donc à la frontière exacte du héros, et son encre
            en capitales à interligne 0,95 la franchissait même de 6 px, mesuré
            aux trois largeurs. Il se lisait comme la fin du héros et non comme
            le début de la grille qu'il annonce. Le rembourrage reprend celui de
            la section qui suit (60 / 90), pour que le rythme vertical de la
            page soit le même partout. */}
        <section
          data-section="packs"
          className="relative bg-background px-[20px] pb-[80px] pt-[60px] text-foreground tablet:px-[24px] tablet:pt-[90px] desktop:px-[30px]"
        >
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[30px]">
            <h2 className="accent-room max-w-[600px] text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
              {servicePageLabels.titrePacks}
            </h2>
            {/* SIX PISTES DÉCLARÉES ICI, reprises par chaque carte en
                `grid-rows-subgrid`. La cinquième est en `1fr` : c'est la liste
                des livrables qui absorbe la hauteur restante, ce que faisait
                `flex-1` quand chaque carte était une colonne autonome. */}
            {/* TROIS COLONNES SEULEMENT À PARTIR DE 1200px, et non dès 810.
                Entre les deux, chaque carte tombait à 250px et son texte à
                166px : à 14px de corps, les lignes d'inclusion se coupaient
                tous les deux mots. Mesuré le 2026-09-08 sur `/services/*`.
                C'est le même défaut que la grille des pages légales, et il a la
                même cause : un partage déclenché avant que la place existe. */}
            <div className="grid gap-[4px] desktop:grid-cols-3 desktop:grid-rows-[auto_auto_auto_auto_1fr_auto]">
              {prestation.packs.map((pack, index) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  precedent={
                    index > 0 ? prestation.packs[index - 1].nom : undefined
                  }
                  misEnAvant={index === avant}
                  /* ANCRE LOCALE, plus un aller vers `/contact` : la prise de
                     rendez-vous est désormais SUR cette page, avec le bon sujet
                     déjà coché. Envoyer ailleurs coûterait un chargement pour
                     arriver au même formulaire. */
                  href="#rendez-vous"
                />
              ))}
            </div>
          </div>
        </section>

        {/* CE QUI FAIT BOUGER LE PRIX. C'est la question que la grille de coches
            ne traitait nulle part, et c'est celle que tout le monde se pose. */}
        {/* `id` : la section tarifs de la page d'accueil ne recopie pas ces
            quatre points, elle y renvoie. Sans ancre, le lien ouvrait la page
            en haut et le visiteur devait retrouver le bloc à la main. */}
        <section
          id="devis"
          className="relative scroll-mt-[100px] bg-muted px-[20px] py-[60px] text-background tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
        >
          {/* LE MÊME PARTAGE QUE LE HÉROS, ET POUR LA MÊME RAISON.
              Cette section était la seule de la page à couper en deux SANS le
              filet médian et avec une gouttière de 60 px, alors que toutes les
              sections en deux moitiés du site posent une gouttière nulle et un
              filet sur l'axe. Deux découpes différentes sur une même page se
              voient tout de suite. La gouttière est reportée en rembourrage de
              part et d'autre du filet, comme dans le héros. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-1/2 hidden w-px bg-black/[0.08] tablet:block"
          />
          <div className="relative mx-auto grid w-full max-w-[1440px] gap-[30px] tablet:grid-cols-2 tablet:gap-x-0 tablet:gap-y-[30px]">
            {/* `justify-between` À PARTIR DE 810 : la moitié gauche tient en
                deux blocs (le titre, puis ce qui sort du forfait) et la droite
                en quatre points. À hauteur égale de cellule, la gauche
                s'arrêtait de 117 à 291 px au-dessus de la droite selon la page
                et la largeur. Le titre reste calé en haut, la note descend
                jusqu'à la ligne d'appui du dernier point, et les deux moitiés
                se terminent ensemble. */}
            <div className="flex flex-col gap-[16px] tablet:justify-between tablet:pr-[30px] desktop:pr-[40px]">
              <h2 className="accent-room max-w-[420px] text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
                {servicePageLabels.titreVariation}
              </h2>
              <p className="max-w-[460px] text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-background/70">
                {prestation.horsPack}
              </p>
            </div>
            <ul className="flex flex-col gap-[18px] tablet:pl-[30px] desktop:pl-[40px]">
              {servicePageLabels.variation.map((point) => (
                <li key={point.titre} className="flex flex-col gap-[6px]">
                  <p className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em]">
                    {point.titre}
                  </p>
                  <p className="text-[14px] font-medium leading-[1.45] tracking-[-0.01em] text-background/70">
                    {point.corps}
                  </p>
                </li>
              ))}
            </ul>
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

        <FaqSection faq={[...faqItems]} />
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
