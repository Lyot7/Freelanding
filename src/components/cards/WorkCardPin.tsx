import type { ReactNode } from "react";
import { WorkCard, WorkCardBackground } from "@/components/cards/WorkCard";
import type { WorkItem } from "@/lib/content/types";

/**
 * WorkCardPin — mécanique d'épinglage d'une carte projet, MESURÉE sur le live et
 * factorisée ici. Source unique pour la home (`WorksSection`), l'index `/work`
 * (`WorkExplorer`) et le « Next project » d'une page projet (`RelatedWork`), qui
 * répliquaient chacun leur variante, toutes cassées de la même façon.
 *
 * Structure relevée sur le live (computed styles + balayage de scroll), identique
 * à toutes les largeurs :
 *
 *   rangée `.framer-l99f28`        height 800px / 100vh à partir de 1200  visible
 *     └ hublot `<a>` `.framer-z2o4lz`  height 100% + flex column CENTRÉ  clip
 *         ├ fond `.framer-1cogzvi`     absolute inset-0 (DÉFILE)
 *         └ track `.framer-7nnyja`     height 300vh, flex-none           clip
 *             └ sticky `.framer-1l83zgi` height 100vh, sticky, top: 0    visible
 *                 └ détails du projet (ÉPINGLÉS)
 *
 * Le fond est FRÈRE du track, pas son descendant : il défile donc avec la carte
 * tandis que les détails restent épinglés. C'est là que se joue l'effet « l'image
 * reste figée pendant que l'arrière-plan bouge ». Placer ce fond dans le sticky
 * épingle TOUT et supprime l'effet (mesuré : pente `fondTop - hublotTop` de
 * +1,000 px/px au lieu de 0, jusqu'à 300 px d'écart de cadrage à mi-parcours).
 *
 * Les QUATRE couches sont nécessaires :
 *   - la rangée porte la longueur de scroll du projet ;
 *   - le hublot clippe : c'est la fenêtre visible de la carte, et il CENTRE le
 *     track, qui déborde donc symétriquement de `(hublot - track) / 2` (relevé :
 *     -955px pour un hublot de 955, -1032px pour un hublot de 800) ;
 *   - le track (300vh) donne au sticky sa course, soit 300vh - 100vh = 200vh.
 *     Sans lui, le sticky aurait un bloc conteneur plus PETIT que lui, donc une
 *     course nulle : l'effet serait mort (mesuré, delta 0 sur tout le balayage) ;
 *   - le sticky épingle le contenu au viewport pendant que le hublot glisse
 *     dessus. D'où l'effet : l'image reste FIGÉE tandis que son cadre défile.
 *
 * Deux pièges, tous deux constatés dans les versions précédentes de ce code :
 *   - `overflow: clip` est OBLIGATOIRE, jamais `hidden`. `hidden` crée un
 *     conteneur de défilement qui CAPTURE le sticky (il s'accrocherait au hublot,
 *     lequel ne défile pas → effet mort) ; `clip` n'en crée pas, donc le sticky
 *     continue de s'accrocher au viewport du document. Mesuré sur le live :
 *     aucun ancêtre n'est un conteneur de défilement.
 *   - `flex-none` sur le track est indispensable : en flex-column il serait sinon
 *     rétréci à la hauteur du hublot et perdrait toute sa course.
 */
export function WorkCardPin({
  work,
  index,
  /**
   * Hauteur de la rangée, donc longueur de scroll du projet. Défaut = valeur
   * mesurée sur la home : 800px, et 100vh à partir de 1200 (seuil `desktop`,
   * PAS `tablet` : relevé à 800px de hublot aussi bien à 390 qu'à 810).
   */
  rowClassName = "h-[800px] desktop:h-[100vh]",
  /** Contenu superposé à la carte, dans le repère du sticky (titre de section…). */
  overlay,
  /** Châssis d'ordinateur portable autour de la vignette. Home uniquement. */
}: {
  work: WorkItem;
  index?: number;
  rowClassName?: string;
  overlay?: ReactNode;
}) {
  return (
    // framer-l99f28 : rangée — porte la longueur de scroll du projet
    <div className={`relative w-full ${rowClassName}`}>
      {/* framer-z2o4lz : hublot — c'est LE LIEN de la carte sur le live. Fenêtre
          visible, il CENTRE le track et le clippe. */}
      <a
        href={`/realisations/${work.slug}`}
        data-part="work-card-window"
        className="relative flex h-full w-full flex-col items-center justify-center overflow-clip bg-background no-underline"
      >
        {/* framer-1cogzvi : fond plein cadre — enfant du HUBLOT, donc il DÉFILE
            avec la carte, contrairement aux détails qui restent épinglés. */}
        <WorkCardBackground work={work} />

        {/* framer-7nnyja : track de 300vh — course du sticky (200vh).
            `z-[1]` est OBLIGATOIRE : le fond ci-dessus est positionné en `z-[1]`,
            donc un track laissé en `z-index: auto` passerait DERRIÈRE lui et le
            fond recouvrirait la totalité du contenu de la carte. Sur le live les
            deux frères sont à `z-index: 1` et c'est l'ordre du DOM qui tranche,
            plaçant les détails devant. */}
        <div className="relative z-[1] h-[300vh] w-full flex-none overflow-clip">
          {/* framer-1l83zgi : « Container Sticky » — épinglé au viewport */}
          <div className="sticky top-0 flex h-[100vh] w-full flex-row items-center justify-start">
            {overlay}
            <WorkCard work={work} index={index} />
          </div>
        </div>
      </a>
    </div>
  );
}
