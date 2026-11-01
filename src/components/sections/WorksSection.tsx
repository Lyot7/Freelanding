import { WorkCardPin } from "@/components/cards/WorkCardPin";
import type { WorkItem } from "@/lib/content/types";

/**
 * WorksSection — section "Works" de la home Framer (grille portfolio).
 *
 * Reproduction fidèle (état final, scroll-animation exclue) de la section Framer
 * (markup: content/framer-html/works.ts, CSS: framer-home.css `.framer-1ludsib`).
 *
 * Périmètre RÉEL : fond clair (--muted #e9e9e9), pile verticale pleine largeur de
 * cartes projet sombres (--background #0b0b0b), une carte par rangée
 * (`.framer-l99f28`), sans gouttière. Chaque carte est une WorkCard (voir
 * cards/WorkCard.tsx) numérotée par sa position (01, 02, …).
 *
 * Breakpoints (Framer desktop-first → Tailwind mobile-first, INVERSÉ) :
 *   base   = mobile   (≤809.98)
 *   tablet = 810-1199 (≥810)
 *   desktop= ≥1200    (≥1200)
 *
 * Pin : la mécanique d'épinglage (hublot clippé, track de 300vh, sticky 100vh)
 * vit dans {@link WorkCardPin}, source unique partagée avec `/work` et le
 * « Next project » d'une page projet. Voir ce fichier pour la structure mesurée
 * et les deux pièges (`clip` et non `hidden`, `flex-none` sur le track).
 *
 * La `<section>` ci-dessous est en `overflow-clip` et non `hidden` pour la même
 * raison : `hidden` créerait un conteneur de défilement qui capturerait le sticky
 * des cartes et tuerait l'effet. Mesuré sur le live : aucun ancêtre du sticky
 * n'est un conteneur de défilement.
 */
export function WorksSection({ works }: { works: WorkItem[] }) {
  return (
    // framer-1ludsib : section (fond clair, colonne centrée, sans gap)
    <section
      data-section="works"
      className="relative flex w-full flex-col items-center justify-start gap-0 overflow-clip bg-muted"
    >
      {/* framer-1ylfwfy : conteneur (colonne, pleine largeur, sans gap) */}
      <div className="flex w-full flex-col items-start gap-0">
        {works.map((work, i) => (
          <WorkCardPin key={work.slug} work={work} index={i + 1} />
        ))}
      </div>
    </section>
  );
}
