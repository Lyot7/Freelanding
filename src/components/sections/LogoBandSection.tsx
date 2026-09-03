import type { ReactNode } from "react";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Marquee } from "@/components/ui/Marquee";
import type { LogoBand } from "@/lib/content/types";

/**
 * LogoBandSection — reconstruction fidèle (CSS Framer → Tailwind responsive) de
 * la section « LOGO-BAND » de la page d'accueil d'origine (section11), un bandeau de logos
 * défilant en boucle horizontale.
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
 */

// framer-1ctdh94 … : cellule blanche, centrée, gap conteneur 4px (→ mr-[4px]).
// Le mr est appliqué à CHAQUE cellule (trailing compris) pour que la période du
// motif soit uniforme et que la boucle -50 % du Marquee reste sans couture.
const CELL =
  "relative flex h-[117px] w-[201px] shrink-0 items-center justify-center " +
  "mr-[4px] bg-white tablet:h-[140px] tablet:w-[240px]";

/* Cellule TEXTE : le nom, puis la nature et la date du lien.
   Le nom reprend le corps et l'interlettrage des titres de carte du site, la
   ligne de détail le preset 12 px capitales des libellés. `text-background`
   parce que la cellule est blanche : sur ce fond, l'encre est celle du fond du
   site, pas celle de son texte. */
const CELL_NOM =
  "text-[18px] font-semibold uppercase leading-[1.05] tracking-[-0.03em] text-background tablet:text-[20px]";
const CELL_DETAIL =
  "text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background/55 tablet:text-[12px]";

export function LogoBandSection({ logoBand }: { logoBand: LogoBand }): ReactNode {
  const logos = logoBand.logos;

  // Aucune marque réelle : pas de bandeau. Voir l'en-tête du fichier.
  if (logos.length === 0) {
    return null;
  }

  return (
    // framer-18agiee-container : bloc pleine largeur.
    <section data-section="logoBand" className="relative w-full">
      {/* framer-1vzdent : wrapper colonne centré (width 100 %). Reveal = fondu
          d'apparition du bandeau (le <ul> Framer part à opacity 0 → 1). */}
      <Reveal
        className="flex w-full flex-col items-center gap-[16px] tablet:gap-[20px]"
        initialOpacity={0.001}
        to={{ opacity: 1 }}
      >
        {/* L'INTITULÉ EST DANS LE FLUX, pas en surimpression du bandeau : il
            doit être lu AVANT la file de noms, sinon la file dit ce qu'elle veut
            dire toute seule, et sur un site de prestataire elle dit « clients ».
            Même gouttière horizontale que les autres sections. */}
        {logoBand.title ? (
          <div className="flex w-full max-w-[1440px] flex-col items-start px-[20px] tablet:px-[24px] desktop:px-[30px]">
            <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
              {logoBand.title}
            </p>
          </div>
        ) : null}
        {/* framer-1k1ouqd : conteneur défilant, fond gris, overflow masqué. */}
        {/* `repetitions` : trois cellules de 240 px ne font que 720 px, soit la
            moitié d'un écran de 1 440. Le rail se vidait en fin de cycle. Six
            copies par groupe couvrent large, jusqu'aux très grands écrans. */}
        <Marquee speed={70} repetitions={6} className="w-full bg-muted">
          {logos.map((logo, i) => (
            <div key={`logo-${i}`} className={CELL}>
              {/* LE DÉTAIL SURVIT AU LOGO, et c'est le point de la cellule.
                  La version précédente rendait SOIT le logo SOIT le nom et sa
                  date : poser une image faisait donc disparaître « Stage ·
                  2024 », et la bande redevenait une file de marques, c'est à
                  dire ce qu'un visiteur lit comme « mes clients ». Le logo
                  remplace le nom, jamais la ligne qui dit la nature du lien. */}
              <div className="flex flex-col items-center gap-[8px] px-[16px] text-center">
                {logo.image ? (
                  /* LA TAILLE EST POSÉE EN CSS, pas laissée à `w-auto`, et
                     c'est mesuré. `width`/`height` sur un `<img>` ne sont que
                     des attributs de RAPPORT : avec `width: auto`, le
                     navigateur retient la taille intrinsèque du FICHIER, puis
                     `max-w-full` la borne à la cellule. Les trois logotypes
                     horizontaux étaient donc rendus à la même largeur, 208 px,
                     ce qui annulait exactement le calibrage à surface optique
                     de `home.ts` : MeilleursBiens s'affichait trois fois plus
                     gros que MSSHOP. Le style inline rétablit les dimensions
                     voulues ; `maxWidth: 100%` garde le garde-fou de cellule.
                     Les dimensions restent optionnelles dans `ImageAsset`,
                     d'où le repli. */
                  <Image
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
                  /* Repli TEXTE, faute d'autorisation écrite de reproduire le
                     logo. `[text-wrap:balance]` parce qu'un nom en deux mots
                     (« MECA SERVICES », « WÜRTH FRANCE ») doit se couper au
                     milieu et non laisser un mot seul sur la seconde ligne. */
                  <span className={`${CELL_NOM} [text-wrap:balance]`}>
                    {logo.name}
                  </span>
                )}
                {logo.detail ? (
                  <span className={CELL_DETAIL}>{logo.detail}</span>
                ) : null}
              </div>
            </div>
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}
