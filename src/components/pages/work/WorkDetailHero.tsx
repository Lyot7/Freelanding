import Image from "next/image";
import { Grain } from "@/components/effects/Grain";
import { Reveal } from "@/components/motion/Reveal";
import { ScrollParallax } from "@/components/motion/ScrollParallax";
import type { WorkItem } from "@/lib/content";

/*
 * Hauteur RELATIVE À LA FENÊTRE : 90vh, identique à toutes les largeurs.
 * Vérifié en faisant varier la hauteur du viewport, pas seulement la largeur —
 * le bloc suivant démarre à 0,9 × h + 33 pour h = 700, 900 et 1100. Les trois
 * paliers fixes précédents (730 / 820 / 810) venaient d'un relevé unique à
 * 900px de haut : ils étaient justes à cette seule hauteur et faux partout
 * ailleurs, avec 80px d'écart en mobile.
 */
export function WorkDetailHero({ work }: { work: WorkItem }) {
  /*
   * LE FOND N'EST PAS LA COUVERTURE, quand le projet en fournit un.
   *
   * `cover` est une capture du site client, interface comprise. Elle est juste
   * en vignette et fausse en fond de hero : elle empile sa barre de navigation
   * sous la nôtre et son accroche sous notre titre. `heroBackground` porte la
   * même scène sans interface. Le repli garde les projets qui n'en ont pas.
   */
  const fond = work.heroBackground ?? work.cover;

  return (
    <section className="relative flex h-[90svh] w-full items-end overflow-hidden bg-background px-[20px] pb-[60px] pt-[110px] text-white tablet:px-[24px] tablet:pb-[90px] desktop:px-[30px] desktop:pt-[60px]">
      {/* framer-1gqz6xi « Media » : le visuel du hero DÉRIVE au scroll sur la
          source, il était posé fixe. Relevé sur `/live-proxy/work/box-mode` à
          1440, par sauts de scroll : translateY = 105,30 px à 702 · 210,60 à
          1404 · 315,90 à 2106 · 421,20 à 2808, soit `0,150 x scrollY` à la
          troisième décimale et sans borne — la même loi que le fond du hero de
          la home et celui d'`/about`. Le débord est absorbé par
          l'`overflow-hidden` de la section. */}
      <ScrollParallax
        factor={0.15}
        decorative
        className="pointer-events-none absolute inset-0 z-0 overflow-clip"
      >
        <Image
          src={fond.src}
          alt={fond.alt}
          fill
          preload
          sizes="100vw"
          className="object-cover object-center"
        />
      </ScrollParallax>
      {/* VOILE DE LISIBILITÉ, et il est MESURÉ.
          Le voile uniforme à 20 % suffisait sur les captures d'interface, qui
          portaient déjà leurs propres aplats sombres. Sur les photographies
          nues des fonds de hero, le titre blanc tombait à 2,36:1 sur Kpsull et
          2,82:1 sur NSLysium à ses points les plus clairs, sous le plancher de
          3:1 que WCAG demande pour du grand texte : quelques lettres se
          fondaient dans le trottoir ou dans un coussin beige.

          Un dégradé plutôt qu'un aplat plus dense : il assombrit le bas, là où
          vivent le titre et le résumé, et laisse la moitié haute de l'image
          intacte. Assombrir toute la photo pour deux lignes de texte aurait
          coûté l'image entière.

          RENFORCÉ LE 2026-09-04, PARCE QUE LE FOND DE WÜRTH A CHANGÉ. Sa page
          porte désormais un plateau 3D dont la DALLE EST BLANC PUR, et cette
          dalle tombe exactement sous le titre : le dégradé précédent (62 %,
          70/35) laissait le H1 blanc à 1,82:1, sous le plancher de 3:1 que WCAG
          demande pour du grand texte. Les deux autres pages tenaient, elles,
          sans marge confortable.

          Relevé par `bun run audit:contraste-hero`, qui masque le texte du H1,
          capture sa boîte sur la page rendue et cherche le pixel le plus clair
          qu'elle recouvre. Pire rapport des trois largeurs auditées :

            page        62 % · 70/35     78 % · 85/60
            kpsull          3,85             8,23
            nslysium        4,29             8,79
            wurth           1,82             3,70

          78 % / 85 / 60 est le premier jeu essayé qui passe partout : 72/80/50 a
          été mesuré avant lui et laissait Würth à 2,67. Le haut de l'image reste
          intact sur 22 % de sa hauteur au lieu de 38 : c'est ce que coûte la
          mise à niveau, et elle se paie sur du décor. Sur le plateau de Würth
          elle transforme l'écran en source lumineuse plutôt qu'en capture
          lisible, ce qui est le bon registre pour un fond de hero.

          À REJOUER dès qu'un `heroBackground` change : un fond clair sous le
          titre ne casse rien de visible et ne se voit qu'à l'œil. */}
      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-black/85 via-black/60 to-transparent" />
      {/* MANQUANT jusqu'ici : `/work/box-mode` n'avait aucun grain de section.
          RELEVÉ sur le live : hôte 1440 × 810, z-1, opacité 0,08. */}
      <Grain opacity={0.08} className="z-[1]" />
      {/* `hidden tablet:block` : la source ne trace AUCUN filet central sous
          810, nous en posions un (x 195, hauteur 810) sur toute la plage mobile.
          Son jumeau dans `WorkNarrative.tsx` porte déjà la garde, elle manquait
          seulement ici. Opacité relevée sur la source : 0,18 (nous étions à
          0,14). */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 hidden w-px bg-white/[0.18] tablet:block"
      />
      <div className="relative z-[1] mx-auto grid w-full max-w-[1440px] grid-cols-1 tablet:grid-cols-12 tablet:gap-x-[4px]">
        <div className="tablet:col-start-7 tablet:col-end-12">
          <Reveal
            initialOpacity={0.001}
            initialY={32}
            duration={0.8}
          >
            {/* 63 px en base, et non 52. La source rend 63/51,66/-3,15 à 390 ; nous
                rendions 52/42,64/-2,86, seul H1 du site à démarrer plus bas que
                63. La chasse passe de -0,055em à -0,05em : ces deux fichiers de
                `/work` étaient les seuls du site à porter -0,055em, les six
                autres H1 sont en -0,05em et la source aussi. */}
            <h1 className="m-0 text-[63px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:text-[78px] desktop:text-[98px]">
              {work.title}
            </h1>
          </Reveal>
          {work.excerpt ? (
            <Reveal
              as="p"
              initialOpacity={0.001}
              initialY={14}
              delay={0.12}
              // Interligne 1,2 (14,4px pour 12px) : le 1,18 précédent donnait
              // 14,16 et décalait la seconde ligne.
              /* Écart au H1 : 20 sous 810, 30 au-dessus — nous posions 24 partout,
              ce qui faisait tomber le H1 6,1 px trop bas dès 1200.
              Calage horizontal : la source adosse un bloc de 330 px à l'AXE
              CENTRAL (x 390 → 720 à 1440, 75 → 405 à 810). Notre colonne démarre
              sur cet axe, il faut donc la remonter de sa propre largeur, pas de
              220 px — avec `ml-[-220px]` et 360 px de large, le bloc débordait de
              142 px à droite de la médiane. Restent 2 px d'écart, imputables à la
              gouttière de 4 px de notre grille là où la source fait un 50/50 sec. */
              className="mt-[20px] max-w-[360px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white tablet:mt-[30px] tablet:ml-[-330px] tablet:max-w-[330px] tablet:text-right"
            >
              {work.excerpt}
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
