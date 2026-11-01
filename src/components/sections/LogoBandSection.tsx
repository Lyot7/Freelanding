import type { ReactNode } from "react";
import { ImageProgressive } from "@/components/ui/ImageProgressive";
import { Reveal } from "@/components/motion/Reveal";
import type { LogoBand } from "@/lib/content/types";

/**
 * LogoBandSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de
 * la section « LOGO-BAND » de la page d'accueil d'origine (section11). La source
 * faisait défiler les logos en boucle ; la bande est fixe ici, voir plus bas.
 *
 * Source : markup content/framer-html/section11.ts, CSS framer-global.css
 *
 * ⚠️ CHANGEMENT DE COMPORTEMENT, 2026-08-10.
 *
 * Le composant portait SIX marques de repli, inlinées en data-URI depuis le CSS
 * Framer, affichées dès que la donnée ne fournissait aucun logo. Elles étaient
 * décrites comme « abstraites, aucune marque réelle » : c'est faux à l'écran, on
 * y lit des NOMS (PictelAI, Watchtower…). Sur un site de prestataire, une bande
 * de logos se lit comme « voici mes clients » : l'afficher sans client réel est
 * une fausse déclaration, et Eliott n'en a aucun à ce jour.
 *
 * Le repli est donc SUPPRIMÉ, data-URI compris (~90 lignes de code mort), et la
 * section ne rend plus RIEN tant que la donnée ne porte pas de vrai logo. C'est
 * une garde qui vaut pour les deux sources de contenu et pour les deux pages qui
 * appellent le composant (home et `/about`) : retirer la donnée ne suffisait pas,
 * le seed réécrit `logoBand` en `{logos: []}`, qui est un objet vérité.
 *
 * RALLUMÉE LE 2026-09-01, EN TEXTE ET PAS EN LOGOS.
 *
 * Les quatre entreprises affichées sont des EMPLOYEURS, pas des clients : deux
 * alternances et deux stages. Deux choses ont donc changé, et aucune n'est
 * cosmétique.
 *
 * 1. LA BANDE PORTE UN INTITULÉ ET CHAQUE CELLULE PORTE SA DATE. « Ils m'ont
 *    fait confiance » aurait fabriqué des clients à partir d'employeurs, ce qui
 *    est exactement la fausse déclaration que le retrait du 2026-08-10 voulait
 *    éviter. `logoBand.title` dit la nature du lien, `logo.detail` dit lequel et
 *    quand : rien n'est laissé à l'interprétation du lecteur.
 *
 * 2. AUCUN LOGO DE TIERS N'EST REPRODUIT. Afficher la marque figurative de
 *    Würth, de Médiapilote, de MeilleursBiens ou de MECA SERVICES sans leur
 *    accord écrit est une contrefaçon (art. L713-2 CPI) doublée d'une
 *    reproduction d'œuvre graphique. Citer leur NOM pour dire qu'on y a
 *    travaillé relève au contraire du fait vérifiable et de la référence
 *    nécessaire (art. L713-6). Le risque est concret et pas théorique : Eliott
 *    attend au même moment l'autorisation de Würth pour publier une étude de
 *    cas, c'est à dire pour bien moins que la reproduction de son logo.
 *
 * La branche IMAGE reste en place et sert dès qu'une cellule porte un fichier :
 * le jour où une autorisation écrite arrive, il suffit d'ajouter `image` à
 * l'entrée concernée, les autres restant en texte.
 *
 * FIXE DEPUIS LE 2026-09-24 (panel design, phase D). Trois cellules qui
 * défilent en boucle se répètent sous les yeux du visiteur : le défilement
 * montrait surtout qu'il n'y en avait que trois. La bande pose désormais les
 * trois cellules une fois, côte à côte, sur toute la largeur.
 *
 * DEUX VARIANTES. `bande` est la section pleine largeur (cellules blanches,
 * `/a-propos`). `heros` est la rangée compacte montée dans le bas du héros de
 * l'accueil, à côté de la ligne de preuve : là, la bande devait être visible
 * sans défiler à 1440 × 900, et le bas du héros en est la seule place.
 */

/* Cellule blanche : trois colonnes égales, 4 px de gris entre elles (le
   `gap` laisse voir le fond `bg-muted` de la rangée). */
const CELL =
  "relative flex h-[117px] min-w-0 items-center justify-center bg-white px-[12px] tablet:h-[140px]";

/* Cellule TEXTE : le nom, puis la nature et la date du lien.
   Le nom reprend le corps et l'interlettrage des titres de carte du site, la
   ligne de détail le preset 12 px capitales des libellés. `text-background`
   parce que la cellule est blanche : sur ce fond, l'encre est celle du fond du
   site, pas celle de son texte. */
const CELL_NOM =
  "text-[18px] font-semibold uppercase leading-[1.05] tracking-[-0.03em] text-background tablet:text-[20px]";
// `/65` et non `/55` : sur la cellule blanche, 55 % d'encre donnait 4,37:1,
// sous le seuil AA de 4,5:1 pour un texte de 12 px.
const CELL_DETAIL =
  "text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/65 tablet:text-[12px]";

/* Échelle des logos dans le héros. Les tailles de `home.ts` sont calibrées à
   surface optique égale pour une cellule de 140 px : les réduire d'un même
   facteur garde cet équilibre. */
const ECHELLE_HEROS = 0.6;

/* Identifiant du filtre qui passe les logos en blanc. */
const FILTRE_BLANC = "logo-blanc";

type Logo = LogoBand["logos"][number];

/* LE DÉTAIL SURVIT AU LOGO, et c'est le point de la cellule.
   Une version antérieure rendait SOIT le logo SOIT le nom et sa date : poser
   une image faisait donc disparaître « Stage · 2024 ». Le logo remplace le nom,
   jamais la ligne qui dit la nature du lien. */
function Cellule({ logo }: { logo: Logo }): ReactNode {
  return (
    <li className={CELL}>
      <div className="flex min-w-0 flex-col items-center gap-[8px] text-center">
        {logo.image ? (
          /* LA TAILLE EST POSÉE EN CSS, pas laissée à `w-auto`, et c'est
             mesuré. `width`/`height` sur un `<img>` ne sont que des attributs
             de RAPPORT : avec `width: auto`, le navigateur retient la taille
             intrinsèque du FICHIER. Les trois logotypes étaient alors rendus à
             la même largeur, ce qui annulait le calibrage à surface optique de
             `home.ts`. `maxWidth: 100%` et `object-contain` gardent le logo
             dans sa cellule quand elle se resserre au mobile. */
          <ImageProgressive
            src={logo.image.src}
            alt={logo.image.alt}
            width={logo.image.width ?? 130}
            height={logo.image.height ?? 28}
            style={{
              width: logo.image.width ?? 130,
              height: logo.image.height ?? 28,
              maxWidth: "100%",
            }}
            className="object-contain"
          />
        ) : (
          /* Repli TEXTE, faute d'autorisation écrite de reproduire le logo.
             `[text-wrap:balance]` : un nom en deux mots se coupe au milieu. */
          <span className={`${CELL_NOM} [text-wrap:balance]`}>{logo.name}</span>
        )}
        {logo.detail ? <span className={CELL_DETAIL}>{logo.detail}</span> : null}
      </div>
    </li>
  );
}

/* RANGÉE DU HÉROS : logos en blanc, sans cellule.
   Des cellules blanches sur le fond presque noir du héros faisaient trois
   aplats clairs, plus lumineux que la phrase d'offre qu'ils devaient appuyer.
   Les fichiers sont des PNG noirs sur fond blanc, sans canal alpha : le filtre
   SVG ci-dessous met chaque pixel en blanc et lui donne pour opacité
   l'inverse de sa luminance. Le fond blanc disparaît, l'encre sombre devient
   blanche, l'anticrénelage est conservé. Un `invert()` CSS aurait laissé un
   rectangle noir autour de chaque logo. */
function RangeeHeros({ logos }: { logos: readonly Logo[] }): ReactNode {
  return (
    <>
      <svg aria-hidden width="0" height="0" className="absolute">
        {/* Région du filtre = boîte de l'image. Par défaut elle déborde de
            10 % de chaque côté, sur des pixels transparents que la matrice
            aurait rendus blancs : un cadre gris apparaissait autour de chaque
            logo. L'alpha source entre aussi dans le calcul, pour la même
            raison. */}
        <filter
          id={FILTRE_BLANC}
          x="0"
          y="0"
          width="1"
          height="1"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.2126 -0.7152 -0.0722 1 0"
          />
        </filter>
      </svg>
      <ul className="m-0 flex list-none flex-row flex-wrap items-center gap-x-[20px] gap-y-[10px] p-0 opacity-70 tablet:gap-x-[32px]">
        {logos.map((logo) => (
          <li key={logo.name} className="flex items-center">
            {logo.image ? (
              /* Premier écran : `eager` rend le logo tel quel, sans
                 dépixelisation, comme toute image du héros. */
              <ImageProgressive
                loading="eager"
                src={logo.image.src}
                alt={logo.image.alt}
                width={Math.round((logo.image.width ?? 130) * ECHELLE_HEROS)}
                height={Math.round((logo.image.height ?? 28) * ECHELLE_HEROS)}
                style={{
                  width: Math.round((logo.image.width ?? 130) * ECHELLE_HEROS),
                  height: Math.round((logo.image.height ?? 28) * ECHELLE_HEROS),
                  filter: `url(#${FILTRE_BLANC})`,
                }}
                className="object-contain"
              />
            ) : (
              <span className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
                {logo.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export function LogoBandSection({
  logoBand,
  variant = "bande",
}: {
  logoBand: LogoBand;
  variant?: "bande" | "heros";
}): ReactNode {
  const logos = logoBand.logos;

  // Aucune marque réelle : pas de bandeau. Voir l'en-tête du fichier.
  if (logos.length === 0) {
    return null;
  }

  if (variant === "heros") {
    return <RangeeHeros logos={logos} />;
  }

  return (
    <section data-section="logoBand" className="relative w-full">
      <Reveal
        className="flex w-full flex-col items-center gap-[16px] tablet:gap-[20px]"
        initialOpacity={0.001}
        to={{ opacity: 1 }}
      >
        {/* L'INTITULÉ EST DANS LE FLUX, pas en surimpression du bandeau : il
            doit être lu AVANT la rangée de noms, sinon la rangée dit ce qu'elle
            veut dire toute seule, et sur un site de prestataire elle dit
            « clients ». Même gouttière horizontale que les autres sections. */}
        {logoBand.title ? (
          <div className="flex w-full max-w-[1440px] flex-col items-start px-[20px] tablet:px-[24px] desktop:px-[30px]">
            <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
              {logoBand.title}
            </p>
          </div>
        ) : null}
        <ul
          className="m-0 grid w-full list-none gap-[4px] bg-muted p-0"
          style={{ gridTemplateColumns: `repeat(${logos.length}, minmax(0, 1fr))` }}
        >
          {logos.map((logo) => (
            <Cellule key={logo.name} logo={logo} />
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
