import { REVEAL_VIEWPORT_MARGIN } from "@/components/motion/Reveal";

/**
 * Un SEUL `IntersectionObserver` par jeu d'options, partagé par tous les
 * éléments qui l'utilisent.
 *
 * POURQUOI — framer-motion mutualise déjà les siens (il les indexe par
 * `JSON.stringify` des options), mais deux animations du site n'y passent pas :
 * les compteurs, dont le déclenchement n'est pas une transition de style mais le
 * départ d'un décompte. Chacun instanciait donc son propre observateur. RELEVÉ
 * avec les constructeurs interceptés (`scripts/motion-perf.mjs`), à structure
 * de page identique : `/about` passait de 7 observateurs à 4, et la home de 14
 * à 10, du seul fait de ce regroupement. Les compteurs partagent désormais
 * l'observateur des révélations sans déplacement, la marge étant la même.
 *
 * MARGE — celle de {@link REVEAL_VIEWPORT_MARGIN}, mesurée sur la source. Les
 * compteurs y suivent exactement le même seuil que le reste : encore à zéro
 * quand leur haut est à 930, déjà arrivés à leur valeur (4.9, 89, 60, 3.2, 89)
 * à 870, pour une fenêtre de 900.
 *
 * UNE SEULE FOIS — le rappel n'est joué qu'à la première entrée, puis la cible
 * est désobservée. C'est la sémantique des apparitions du site, et cela évite de
 * garder une liste qui ne fait que grossir.
 */
type Rappel = () => void;

const observateurs = new Map<string, IntersectionObserver>();
const rappels = new WeakMap<Element, Rappel>();

function pour(margin: string): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  const existant = observateurs.get(margin);
  if (existant) return existant;
  const neuf = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const rappel = rappels.get(entry.target);
        rappels.delete(entry.target);
        neuf.unobserve(entry.target);
        rappel?.();
      }
    },
    { rootMargin: margin, threshold: 0 },
  );
  observateurs.set(margin, neuf);
  return neuf;
}

/**
 * Observe `el` et joue `rappel` à sa première entrée dans la zone. Renvoie la
 * fonction de désabonnement, à appeler au démontage : sans elle, l'observateur
 * partagé garderait une référence sur un élément détaché.
 */
export function inViewOnce(
  el: Element,
  rappel: Rappel,
  margin: string = REVEAL_VIEWPORT_MARGIN,
): () => void {
  const observateur = pour(margin);
  if (!observateur) {
    // Pas d'`IntersectionObserver` : on joue tout de suite plutôt que jamais.
    rappel();
    return () => {};
  }
  rappels.set(el, rappel);
  observateur.observe(el);
  return () => {
    rappels.delete(el);
    observateur.unobserve(el);
  };
}
