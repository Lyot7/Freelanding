import type { SiteFeatures } from "@/lib/content/types";

/**
 * Sections allumées / éteintes du site.
 *
 * Deux sections sont éteintes tant qu'elles n'ont rien de vrai à montrer :
 *
 * - `blog` : allumé le 2026-08-26, en même temps que le passage des articles au
 *   MDX. Les 26 articles de démonstration hérités du template ont été supprimés
 *   avec la bascule ; le blog ne montre que ce qui est réellement écrit. Voir
 *   `docs/BLOG.md` pour la marche à suivre.
 *
 * - `testimonials` : aucun client n'a encore laissé de témoignage. Les citations
 *   du template sont attribuées à des personnes qui n'existent pas ; les
 *   afficher serait une fausse déclaration. Repasser à `true` le jour où un vrai
 *   témoignage remplace les données de démonstration.
 *
 * - `signature` : la signature manuscrite du hero, de la page « à propos », de la
 *   page contact et de la section tarifs. CONFIRMÉ PAR ELIOTT (2026-08-10) :
 *   c'est bien SA signature, pas celle du template. Rien à remplacer, le drapeau
 *   reste allumé. La note précédente affirmait le contraire — elle était fausse.
 *   Le tracé vit dans `sections/hero/Signature.tsx` et `sections/PricingSection.tsx`.
 *   Le vecteur étant positionné en absolu, l'éteindre ne déplacerait aucun autre
 *   élément.
 *
 * Éteindre une section ne supprime rien, ni le contenu ni les composants. C'est
 * une bascule, pas une amputation.
 *
 * Ce qui suit automatiquement le drapeau (voir `src/lib/content/features.ts`) :
 * navigation d'en-tête, menu flottant, navigation de pied de page, ordre des
 * sections de la home, sitemap, et réponse 404 sur les routes concernées.
 */
export const siteFeatures: SiteFeatures = {
  blog: true,
  testimonials: false,
  signature: true,
};
