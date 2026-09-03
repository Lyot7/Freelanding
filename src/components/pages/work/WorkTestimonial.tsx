import { Fragment } from "react";
import Image from "next/image";
import { GradientWaveBackdrop } from "@/components/effects/GradientWaveBackdrop";
import { Grain } from "@/components/effects/Grain";
import { Reveal } from "@/components/motion/Reveal";
import { LineReveal } from "@/components/motion/LineReveal";
import { uiLabels } from "@/content/ui";
import type { Testimonial } from "@/lib/content";

/**
 * WorkTestimonial — bloc « Paroles de client. » d'une page projet
 * (« Client words. » sur la source).
 *
 * Surtitre, lignes de titre et guillemets viennent de `uiLabels.work` : ils
 * étaient recopiés en anglais ici, donc la traduction de la donnée n'atteignait
 * pas l'écran.
 *
 * Structure MESURÉE sur la source à 390 / 810 / 1440. Trois traits la
 * caractérisent, tous absents de la version précédente :
 *
 *  - un TITRE D'AFFICHAGE en deux mots (52 / 68 / 92px, interligne 0,82)
 *    qui n'était pas rendu du tout ;
 *  - tout le contenu vit dans la MOITIÉ GAUCHE et se cale sur la ligne médiane
 *    (`ml-auto` + texte à droite à partir de 810), sauf le portrait qui démarre
 *    exactement sur cette ligne, donc dans la moitié droite ;
 *  - la section n'a AUCUNE hauteur minimale : sa hauteur découle du contenu
 *    (620 / 837 / 881). Les `min-h-[760px]` / `min-h-[900px]` précédents la
 *    figeaient et décalaient tout le bas de page.
 */
export function WorkTestimonial({
  testimonial,
  followUp,
}: {
  testimonial: Testimonial;
  /** Paragraphe de relance posé APRÈS la citation, en 16px calé à droite. */
  followUp?: string;
}) {
  const avatar = testimonial.author.avatar;

  /** Une rangée du bloc : deux moitiés égales, sans gouttière. */
  const row = "grid grid-cols-1 tablet:grid-cols-2";

  return (
    <section className="relative overflow-hidden bg-background px-[20px] pb-[30px] pt-[10px] text-white tablet:px-[24px] tablet:pb-[80px] tablet:pt-[30px] desktop:px-[30px]">
      <GradientWaveBackdrop seed={52} />
      {/* MANQUANT jusqu'ici. RELEVÉ sur `/work/box-mode` : section
          « Testimonial », hôte 1440 × 881 à 1440 (810 × 837 à 810, 390 × 620 à
          390), z-2, opacité 0,05. */}
      <Grain opacity={0.05} className="z-[2]" />
      {/* CACHE CLAIR de la couture récit / témoignage, miroir exact de celui que
          `WorkNarrative` porte à son propre haut (là il est à DROITE et déborde
          vers le haut, ici il est à GAUCHE et déborde vers le bas). Sans lui les
          deux moitiés basculaient en sombre en même temps, alors que la source
          fait basculer la moitié droite 30px avant la gauche.

          RELEVÉ sur `/live-proxy/work/box-mode`, nœud `data-framer-name="Accent"`
          de la section « Testimonial » :
            position: absolute ; left: 0 ; top: -1px ; z-index: 5 ;
            width: 405 à 810, 720 à 1440, 960 à 1920, soit toujours 50 % de la
                   section, donc `w-1/2` et non une demi-colonne de 1440 ;
            height: 20px de 390 à 809, 31px de 810 à 1920, PALIER UNIQUE à 810,
                   vérifié sans bascule à 1200 (1199 et 1200 donnent tous deux 31) ;
            background: rgb(233, 233, 233), soit `--muted` (#e9e9e9) au pixel près.
          Le `overflow: clip` de la section source rogne le 1px qui dépasse, comme
          notre `overflow-hidden` : 19px puis 30px de cache réellement peints.
          z-[5] et non z-[2] : sur la source le cache passe AU-DESSUS du grain, sa
          bande est donc du gris plein, sans texture. */}
      <div
        aria-hidden
        className="absolute left-0 top-[-1px] z-[5] h-[20px] w-1/2 bg-muted tablet:h-[31px]"
      />
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-[1] hidden w-px bg-white/[0.08] tablet:block"
      />

      <div className="relative z-[2] mx-auto mt-[30px] w-full max-w-[1440px]">
        <div className={row}>
          <div>
            <p className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white/60">
              {uiLabels.work.testimonialEyebrow}
            </p>
            {/* Plafond de 520 px à TOUTES les largeurs, jamais 350 ni 381 : sur
                la source le titre mesure 350 à 390 (bridé par la colonne), 460 à
                500, 520 dès 600, 381 à 810 (bridé par la demi-colonne), puis 520
                à 1199, 1440 et 1920 — c'est-à-dire `min(520, colonne)`. Bridé à
                350 puis 381, il repassait sur deux lignes là où la source tient
                sur une (43 px contre 85 entre 500 et 809, 56 contre 112 à 1199),
                d'où +43 dans la bande mobile et +51 à 1199.
                Le titre ne peut donc PAS être coupé en dur : le nombre de lignes
                dépend de la largeur. Les deux mots restent deux masques
                `inline-block`, ce qui garde l'apparition en deux temps relevée
                par `motion-sweep` tout en les laissant se replier naturellement
                sur une seule ligne quand la place existe.
                Composant SERVEUR : `duration` / `delay`, jamais `framerTween`. */}
            <h2 className="mt-[12px] max-w-[520px] text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] tablet:ml-auto tablet:mt-[50px] tablet:text-right tablet:text-[68px] desktop:text-[92px]">
              {uiLabels.work.testimonialTitleLines.map((line, i) => (
                // L'espace est écrit ENTRE les deux masques, jamais dedans : un
                // `inline-block` est insécable, la coupure de ligne ne peut se
                // produire qu'entre les deux.
                <Fragment key={line}>
                  {i > 0 ? " " : null}
                  <span className="inline-block overflow-hidden align-bottom leading-[0.82]">
                    <Reveal
                      as="span"
                      className="inline-block whitespace-pre-wrap"
                      initialOpacity={0.001}
                      initialY={40}
                      duration={0.8}
                      delay={0.1 + i * 0.1}
                    >
                      {line}
                    </Reveal>
                  </span>
                </Fragment>
              ))}
            </h2>
          </div>
        </div>

        {/* Portrait et attribution côte à côte dans la moitié DROITE, et AVANT
            la citation : c'est l'ordre de la source. Le bloc texte est calé en
            bas du portrait. */}
        <div className={`mt-[31px] tablet:mt-[50px] ${row}`}>
          {/* FONDU du bloc auteur : `motion-sweep` relevait sur le live un
              `-O DIV "Daniel KowalskiFounderSt"` (opacité seule, aucune
              translation) sans équivalent chez nous. Le `Reveal` REMPLACE le
              `div` de la rangée, il n'en ajoute pas un : la géométrie est
              inchangée. */}
          <Reveal
            className="flex items-end gap-[30px] tablet:col-start-2"
            initialOpacity={0.001}
            duration={0.8}
            delay={0.15}
          >
            {avatar ? (
              <div className="relative h-[162px] w-[130px] flex-none overflow-hidden">
                <Image
                  src={avatar.src}
                  alt={avatar.alt}
                  fill
                  sizes="130px"
                  className="object-cover"
                />
              </div>
            ) : null}
            {/* Attribution en TROIS lignes distinctes, comme la source, et non
                deux : nom 14px blanc (interligne 1,3), fonction 11px à 60 %
                avec 5px de blanc au-dessus, société 13px blanc. MESURÉ sur le
                live à 1440 : hauteurs 18 / 13 / 16, sommets 6806 / 6829 / 6843.
                La fonction manquait, d'où un bloc de 38px au lieu de 53 — et un
                libellé qui ne pouvait pas s'apparier à celui du live. Le bloc
                étant calé en BAS du portrait de 162px, ces 15px de plus ne
                déplacent rien. */}
            {/* `tracking` posé sur CHAQUE ligne et non sur le conteneur : en
                `em`, il se résout à la taille de police de l'élément qui le
                DÉCLARE, puis se transmet en px. Sur le conteneur (16px) les
                trois lignes héritaient -0,16px au lieu de -0,14 / -0,11 / -0,13,
                trois écarts relevés par `audit-live`. */}
            <div className="pb-[2px] font-medium">
              <p className="text-[14px] leading-[1.3] tracking-[-0.01em]">
                {testimonial.author.name}
              </p>
              {testimonial.author.role ? (
                <p className="mt-[5px] text-[11px] leading-[1.2] tracking-[-0.01em] text-white/60">
                  {testimonial.author.role}
                </p>
              ) : null}
              {testimonial.author.company ? (
                <p className="text-[13px] leading-[1.2] tracking-[-0.01em]">
                  {testimonial.author.company}
                </p>
              ) : null}
            </div>
          </Reveal>
        </div>

        <div className={`mt-[29px] tablet:mt-[50px] ${row}`}>
          {/* `w-full` plafonné à 550 et non simple `ml-auto` : une case de
              grille poussée par une marge automatique se réduit à son contenu.
              Une fois la citation découpée en lignes, ce contenu n'est plus que
              la ligne la plus longue, et la boîte tombait à 541 là où la source
              en fait 550. Le texte étant calé à DROITE, l'encre ne bougeait
              pas, mais `audit-live` comptait quatre écarts de géométrie. */}
          <div className="tablet:ml-auto tablet:w-full tablet:max-w-[550px]">
            {/* Guillemets COURBES ici — la source les utilise sur ce bloc, alors
                qu'elle emploie des guillemets droits sur la home.

                La citation se révèle LIGNE PAR LIGNE, comme les cinq SPAN du
                live. Le découpage n'est pas écrit dans le JSX — il dépendrait
                de la largeur — mais MESURÉ sur le rendu du navigateur par
                `LineReveal`. */}
            {/* Approche -0,02em et non -0,01 : MESURÉ sur le live, qui rend
                -0,44 / -0,52 / -0,64px pour 22 / 26 / 32px de corps. Une
                approche deux fois trop lâche élargissait le texte et faisait
                tomber les retours à la ligne un mot plus tôt que la source, ce
                que `motion-sweep` relevait en trois SPAN de citation non
                appariés — le découpage de `LineReveal` étant mesuré sur le
                rendu réel, il héritait fidèlement de la mauvaise largeur. */}
            <blockquote className="m-0 max-w-[550px] text-[22px] font-medium leading-[1.1] tracking-[-0.02em] tablet:text-right tablet:text-[26px] desktop:text-[32px]">
              <LineReveal
                text={`${uiLabels.work.quoteOpen}${testimonial.quote}${uiLabels.work.quoteClose}`}
                className="block"
                lineClassName="w-full overflow-hidden"
                initialY={22}
              />
            </blockquote>
            {followUp ? (
              // FONDU PROPRE au paragraphe de relance : le live l'anime
              // séparément de la citation (`-O DIV "The wildest part was how"`,
              // opacité seule). Il était enfermé dans le `Reveal` de la
              // citation, donc aucun élément animé ne portait son texte.
              <Reveal initialOpacity={0.001} duration={0.8} delay={0.15}>
                <p className="mt-[14px] max-w-[390px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] tablet:ml-auto tablet:mt-[30px] tablet:text-right">
                  {followUp}
                </p>
              </Reveal>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
