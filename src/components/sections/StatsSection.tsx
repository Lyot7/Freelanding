import Image from "next/image";
import { LineReveal } from "@/components/motion/LineReveal";
import { Reveal } from "@/components/motion/Reveal";
import type {
  Stat,
  StatsSection as StatsSectionContent,
  Testimonial as TestimonialContent,
} from "@/lib/content/types";
import { Highlighted } from "@/components/ui";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { uiLabels } from "@/content/ui";

/**
 * StatsSection — PILOTE Étape 2 (traduction CSS Framer → Tailwind).
 *
 * Reproduction fidèle (iso-pixel) de la section "Numbers" de la home Framer
 * (markup: content/framer-html/numbers.ts, CSS: framer-home.css `.framer-2iabe2`).
 *
 * Périmètre RÉEL de la section source : 3 compteurs (60+, 1.4s, 80%) disposés
 * dans une grille décorative à points, + colonne droite (titre + témoignage) +
 * filet vertical central, sur fond orange (--accent #ff4500). Les compteurs
 * sont pilotés par `stats` (3 premiers items). Les valeurs "12+" et "4.9" de
 * stats.ts proviennent d'une AUTRE section Framer ("Why us?", number.ts) — voir
 * rapport de fidélité.
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, logique INVERSÉE) :
 *   base   = mobile   (max-width 809.98px)
 *   tablet = 810-1199 (min-width 810)
 *   desktop= ≥1200    (min-width 1200)
 *
 * Note fidélité : les compteurs affichent leur valeur FINALE, là où le port
 * statique rend "0" (animation JS non rejouée). L'emphase couleur des libellés
 * et de la citation vient de la DONNÉE (`Stat.highlights`,
 * `Testimonial.highlights`) : aucun fragment n'est écrit dans ce composant.
 */

// Police exacte du port (stack littérale Framer, résolue à l'identique dans les
// deux environnements puisque `geist` enregistre un nom de famille hashé).
const FONT = "[font-family:var(--font-sans)]";

// Décoration positionnelle (point blanc) de chaque grille, dans l'ordre source.
// index pair → point à gauche (avant le compteur) ; index impair → point à
// droite (après le compteur, décalé de 24px en tablette).
const GRID_LAYOUT = [
  { dot: "left" as const },
  { dot: "right" as const },
  { dot: "left" as const },
];
const COUNTER_SPEEDS = [10, 10, 10] as const;

function Dot({ side }: { side: "left" | "right" }) {
  // framer-1h215vn / ac44d9 / 9u6m7p : cellule de grille (h-full, w-full, self-start)
  return (
    <div data-part="dotcell" className="relative h-full w-full self-start overflow-hidden">
      {/* framer-1gdmi9n / 98r1i8 / awl382 : point 8×8 blanc, ancré en haut */}
      <div
        data-part="dot"
        className={
          "absolute top-0 z-[1] aspect-square h-[8px] w-[8px] rounded-full bg-accent-ink " +
          (side === "left"
            ? "left-0"
            : "right-0 tablet:right-[24px] desktop:right-0")
        }
      />
    </div>
  );
}

function Counter({ stat, speedMs }: { stat: Stat; speedMs: number }) {
  return (
    // framer-1kb2cqw / 1oh0ifa / obt2nj : compteur + libellé
    <div className="relative flex w-full max-w-[500px] flex-col items-start gap-[12px] self-start tablet:gap-[16px]">
      {/* framer-1njqp0m-container : conteneur nombre, hauteur réservée */}
      <div className="relative h-[50px] w-auto tablet:h-[60px] desktop:h-[65px]">
        <AnimatedCounter
          value={stat.value}
          suffix={stat.suffix}
          speedMs={speedMs}
          // `uppercase` : le live rend l'unité en capitale (« 3.2S », pas « 3.2s »).
          className="flex items-center gap-0 text-[44px] font-semibold uppercase tracking-[-0.07em] leading-[normal] text-accent-ink tablet:text-[52px] desktop:text-[58px]"
        />
      </div>
      {/* framer-13pncuw : libellé (preset wwtw0z, uppercase 12px, blanc 70%) */}
      {/* Le libellé apparaît en fondu sur la source, sans translation. Il était
          rendu immobile. */}
      <Reveal
        as="p"
        data-part="counter-label"
        className="h-auto w-full max-w-[160px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink/70 [text-wrap:balance]"
        initialOpacity={0.001}
        duration={0.8}
        delay={0.15}
      >
        <Highlighted text={stat.label} highlights={stat.highlights} highlightClassName="text-accent-ink" />
      </Reveal>
    </div>
  );
}

function StatGrid({
  stat,
  dot,
  speedMs,
}: {
  stat: Stat;
  dot: "left" | "right";
  speedMs: number;
}) {
  // framer-zi5ocb / 1k3lmsr / 6t6elu : grille 2 colonnes (point | compteur)
  return (
    <div className="relative grid w-full max-w-none auto-rows-[minmax(0,1fr)] grid-cols-[repeat(2,minmax(50px,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] justify-center gap-0 overflow-hidden tablet:max-w-[500px]">
      {dot === "left" ? (
        <>
          <Dot side="left" />
          <Counter stat={stat} speedMs={speedMs} />
        </>
      ) : (
        <>
          <Counter stat={stat} speedMs={speedMs} />
          <Dot side="right" />
        </>
      )}
    </div>
  );
}

function Testimonial({ testimonial }: { testimonial: TestimonialContent }) {
  const { author, quote } = testimonial;
  return (
    // framer-19tf8ze : Quote Stack
    <div className="relative flex w-full flex-col items-start gap-[20px] overflow-hidden tablet:gap-[30px]">
      {/* framer-n1faye : description (preset wwtw0z, uppercase 12px, blanc 60%) */}
      <p className="h-auto w-full max-w-[340px] whitespace-pre-wrap break-words text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink/60">
        {/* Les fragments en emphase viennent de la DONNÉE (`Testimonial.highlights`).
            Ils étaient recopiés en dur, en anglais : l'emphase disparaissait dès
            que la citation passait au français. */}
        <Highlighted
          text={quote}
          highlights={testimonial.highlights ? [...testimonial.highlights] : []}
          highlightClassName="text-accent-ink"
        />
      </p>
      {/* framer-7ol94s : User Info */}
      <div className="relative flex w-min flex-row items-center gap-[16px]">
        {/* framer-c7vzye : avatar 50×50 (51 en mobile). Le CADRE lui-même
            disparaît quand la citation n'a pas de portrait : il laissait sinon
            un trou de 50 px et son écart de 16 px devant le nom. Même
            traitement que `MethodeSection`, qui conditionne déjà son avatar. */}
        {author.avatar ? (
          <div className="relative aspect-square h-[51px] w-[50px] overflow-hidden rounded-[50px] tablet:h-[50px]">
            <Image
              src={author.avatar.src}
              alt={author.avatar.alt}
              width={author.avatar.width ?? 83}
              height={author.avatar.height ?? 83}
              className="block h-full w-full rounded-[inherit] object-cover object-center"
            />
          </div>
        ) : null}
        {/* framer-18yi3cf : User Details */}
        <div className="relative flex w-min flex-col items-start gap-[5px]">
          {/* framer-15ec62h : nom (preset 2okhk1, 14px) */}
          <p className="h-auto w-auto whitespace-pre text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-accent-ink">
            {author.name}
          </p>
          {/* framer-5qoxdz : User Description.
              Le liant « at » du template était rendu SANS condition : la citation
              n'ayant plus ni rôle ni société, il restait un « at » orphelin, en
              anglais, sur une section publiée. Le liant (« chez ») n'apparaît
              désormais que si les DEUX informations existent, et chaque ligne
              disparaît si son contenu est vide (pas de bloc résiduel). */}
          {author.role || author.company ? (
            <div className="relative flex w-full flex-col items-start gap-[1px]">
              {/* framer-qsmhrc : rôle (preset 18rrjz2, 11px, opacity .7) */}
              {author.role ? (
                <p className="h-auto w-auto whitespace-pre text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-accent-ink opacity-70">
                  {author.company
                    ? `${author.role}${uiLabels.testimonials.roleSuffix}`
                    : author.role}
                </p>
              ) : null}
              {/* framer-1p875q0 : société (preset 1hgnchr, 13px) */}
              {author.company ? (
                <p className="h-auto w-auto whitespace-pre text-[13px] font-medium leading-[1.2] tracking-[-0.01em] text-accent-ink">
                  {author.company}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function StatsSection({ numbers }: { numbers: StatsSectionContent }) {
  const counters = numbers.stats.slice(0, 3);
  return (
    // framer-2iabe2 : section (fond orange, flex col centrée)
    <section
      data-section="numbers"
      className={
        FONT +
        " relative flex w-full flex-col items-center justify-start gap-[10px] overflow-hidden bg-accent " +
        "pt-[20px] pr-[20px] pb-[50px] pl-[20px] " +
        "tablet:pt-[30px] tablet:pr-[24px] tablet:pb-[120px] tablet:pl-[24px] " +
        "desktop:pr-[30px] desktop:pl-[30px]"
      }
    >
      {/* framer-cilo4b : Container (max 1440, aligné à gauche) */}
      <div className="relative flex w-full max-w-[1440px] flex-col items-start gap-[12px] tablet:gap-[30px]">
        {/* framer-kqrkbn : Label (preset wwtw0z, uppercase 12px, blanc 70%) */}
        <p data-part="label" className="h-auto w-auto whitespace-pre text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink/70">
          {numbers.eyebrow}
        </p>

        {/* framer-19d6ceo : Row (colonnes empilées en mobile, côte à côte dès 810) */}
        <div className="relative flex w-full flex-col items-end gap-[34px] tablet:flex-row tablet:items-end tablet:justify-center tablet:gap-0">
          {/* framer-1rkftgj : colonne gauche (compteurs), order 1 en mobile */}
          <div data-part="cluster" className="relative order-1 flex w-full flex-col items-start gap-[20px] overflow-hidden tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:gap-[50px]">
            {counters.map((stat, i) => (
              <StatGrid
                key={stat.label}
                stat={stat}
                dot={GRID_LAYOUT[i].dot}
                speedMs={COUNTER_SPEEDS[i]}
              />
            ))}
          </div>

          {/* framer-1cdzglh : colonne droite (titre + témoignage), order 0 en mobile */}
          <div className="relative order-0 flex w-full flex-col items-start gap-[30px] tablet:order-none tablet:w-px tablet:flex-[1_0_0] tablet:gap-[50px]">
            {/* framer-1xsiil0-container : conteneur titre */}
            <div className="relative h-auto w-full max-w-[360px] tablet:max-w-[440px] desktop:max-w-[600px]">
              {/* framer-1xsiil0 h2 (92/68/52px, ls -0.05em, lh 0.82) */}
              <h2 className="relative m-0 flex w-full max-w-full flex-col justify-center p-0 text-left text-[52px] font-semibold uppercase leading-[0.82] tracking-[-0.05em] text-accent-ink tablet:text-[68px] desktop:text-[92px]">
                {/* Révélé LIGNE PAR LIGNE, en décalé, comme la source. Le
                    découpage est MESURÉ sur le rendu du navigateur et jamais
                    écrit en dur : les retours à la ligne de ce titre dépendent
                    de la largeur de la fenêtre. */}
                <LineReveal
                  text={numbers.title ?? ""}
                  className="block w-full"
                  lineClassName="w-full overflow-hidden"
                  delay={0.1}
                />
              </h2>
            </div>
            {numbers.testimonial ? (
              <Testimonial testimonial={numbers.testimonial} />
            ) : null}
          </div>
        </div>
      </div>

      {/* framer-1hqjbn5 : filet vertical central (blanc 18%) */}
      <div className="absolute left-[calc(50%-0.5px)] top-0 z-[1] h-full w-px bg-accent-ink opacity-[0.18]" />
    </section>
  );
}
