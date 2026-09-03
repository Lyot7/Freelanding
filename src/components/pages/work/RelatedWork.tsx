import { WorkCardPin } from "@/components/cards/WorkCardPin";
import { uiLabels } from "@/content/ui";
import type { WorkItem } from "@/lib/content";

/**
 * RelatedWork — bloc « Projet suivant » d'une page projet (« Next project » sur
 * la source). Le libellé vient de `uiLabels.work.nextProjectLabel`.
 *
 * Utilise la mécanique d'épinglage partagée ({@link WorkCardPin}) : la version
 * précédente en différait par un `overflow-hidden` (qui capture le sticky et
 * annule l'effet) et l'absence de track, comme la home et `/work` avant
 * correction.
 *
 * Longueur de scroll MESURÉE : 800px fixes en dessous de 1200, puis une hauteur
 * de fenêtre au-delà. Ce n'est donc ni une valeur unique ni une valeur purement
 * relative — le 125vh hérité en donnait 225 de trop à 1440 et 100 de trop en
 * dessous. Le libellé reste à 20px du bord gauche à toutes les largeurs, et son
 * interligne est 1,2 (14px de haut, pas 18).
 */
export function RelatedWork({ work }: { work: WorkItem }) {
  return (
    <section aria-labelledby="next-project-title" className="relative">
      <WorkCardPin
        work={work}
        rowClassName="h-[800px] desktop:h-screen"
        overlay={
          <h2
            id="next-project-title"
            /* Retrait haut du libellé : PALIER 20 / 30 à 810, relevé sur le
               `padding-top` de sa colonne sur la source (haut de section 3423
               puis libellé 3443 à 390 ; 4889 puis 4919 à 810 ; 6352 puis 6382 à
               1440). Le 30px unique posait le libellé 9px trop bas en mobile.
               Position absolue : aucun effet sur la hauteur de page. */
            /* Bord gauche : la source suit le bord du conteneur centré de
               1440 dès que la fenêtre le dépasse, et reste à 20 px en deçà —
               relevé x=20 à 390, 810, 1200 et 1440, x=240 à 1920. Nous le
               collions à 20 px du bord de FENÊTRE, donc 220 px trop à gauche à
               1920. `max()` exprime la règle en une déclaration, sans figer de
               palier : max(20, (100vw - 1440) / 2) vaut 20 jusqu'à 1480 puis
               suit le conteneur. */
            className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[20px] z-[3] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-white tablet:top-[30px]"
          >
            {uiLabels.work.nextProjectLabel}
          </h2>
        }
      />
    </section>
  );
}
