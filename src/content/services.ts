import type { ImageAsset, ServiceItem } from "@/lib/content/types";
import { fourchette, prestations, type PrestationId } from "@/content/offre";
import { lienRendezVous, RDV_PAR_PRESTATION } from "@/content/rendez-vous";

/**
 * Prestations de la section « Services » (section06.ts de l'archive Framer).
 *
 * CE FICHIER N'ÉCRIT PLUS NI PRIX NI PÉRIMÈTRE. Il compose l'accordéon à partir
 * de `offre.ts`, qui porte les quatre prestations, leurs packs et leurs durées.
 * Le prix affiché est calculé (taux journalier × jours du pack d'entrée), jamais
 * recopié.
 *
 * CE QUI A CHANGÉ LE 2026-08-27, deuxième passe. La grille tarifaire de la page
 * d'accueil a été supprimée : le détail des prix vit désormais sur une page par
 * prestation, sous `/services/`. L'accordéon annonce le point d'entrée et
 * renvoie à la page, au lieu de laisser le visiteur descendre vers un tableau
 * qui ne parlait pas de son cas.
 *
 * DEUX LIGNES SEULEMENT depuis le 2026-09-24, décision d'Eliott : Site vitrine
 * et La Solution métier. Le Diagnostic, l'Audit de code et le bloc « Et aussi »
 * sont sortis de l'accueil : ils n'avaient ni prix ni page, et au milieu des
 * deux prestations chiffrées ils brouillaient ce qu'Eliott vend.
 *
 * IMAGES — photographies sous licence Unsplash, provenance vérifiée cliché par
 * cliché dans `docs/ASSETS.md`.
 */

/** Illustration de chaque prestation, appariée par identifiant. */
const IMAGES: Record<PrestationId, ImageAsset> = {
  vitrine: {
    src: "/images/services/02-visibilite-locale.jpg",
    alt: "Deux commerces de quartier au coin d’une rue",
  },
  logiciel: {
    src: "/images/services/04-logiciel-metier.jpg",
    alt: "Engrenages d’une machine industrielle en prise",
  },
};

/**
 * Deuxième paragraphe de chaque prestation : ce que le visiteur gagne à ouvrir
 * la page dédiée. Il annonce les trois forfaits sans les détailler, parce que
 * les détailler ici reconstruirait la grille qu'on vient de retirer.
 *
 * « 3 » ET NON « TROIS », règle d'Eliott du 2026-09-01. Elle a une raison de
 * plus ici qu'ailleurs : ce paragraphe et l'en-tête du bloc de prix qui le suit
 * vivent DANS LE MÊME PANNEAU d'accordéon, à quelques lignes l'un de l'autre.
 * Le premier écrivait « Trois périmètres » quand le second affichait déjà
 * « 3 périmètres » : deux orthographes du même nombre, visibles d'un seul coup
 * d'œil, se lisent comme deux comptes différents.
 */
const RENVOI: Record<PrestationId, string> = {
  vitrine:
    "3 forfaits à prix ferme, de la page qui fait appeler au site qui te dit ce qu’il rapporte. Le détail est sur la page dédiée.",
  logiciel:
    "3 forfaits, de l’outil qui fait disparaître une tâche à la plateforme où tes systèmes restent d’accord entre eux. Le détail est sur la page dédiée.",
};

export const services: ServiceItem[] = prestations.map(
  (p, index): ServiceItem => ({
    number: String(index + 1).padStart(2, "0"),
    title: p.nom,
    /*
     * FOURCHETTE ET NON PLANCHER sur l'en-tête, depuis le 2026-09-02.
     *
     * « Dès 3 000 € » ne dit rien du haut de gamme : le visiteur qui ferme
     * les cinq lignes lit cinq points d'entrée et repart sans savoir ce que
     * coûte un projet complet. « De 3 000 € à 7 200 € » donne la carte de
     * l'offre en une lecture, lignes fermées, ce qui est exactement l'état
     * d'arrivée depuis que plus aucun panneau ne s'ouvre tout seul.
     *
     * `priceParts()` ne découpe que « from », « à partir de » et « dès » :
     * « de X à Y » ne correspond à aucun, il part donc entier dans le montant
     * et le libellé gris reste « Prix : ». Rendu bicolore inchangé.
     */
    price: fourchette(p.id),
    body: [p.resume, RENVOI[p.id]],
    image: IMAGES[p.id],
    cta: { label: "Voir le détail et les prix", href: `/services/${p.slug}` },
    // COMPOSÉE, jamais écrite à la main : `RDV_PAR_PRESTATION` est le seul
    // endroit où « vitrine » devient « site ».
    rdvHref: lienRendezVous(RDV_PAR_PRESTATION[p.id]),
  }),
);
