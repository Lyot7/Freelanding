import type { ImageAsset, ServiceItem } from "@/lib/content/types";
import { aPartirDe, prestations, type PrestationId } from "@/content/offre";
import { lienRendezVous, RDV_PAR_PRESTATION } from "@/content/rendez-vous";
import { CHEMIN_PAGE_CAEN } from "@/content/page-caen";

/**
 * Prestations de la section « Services » (section06.ts de l'archive Framer).
 *
 * CE FICHIER N'ÉCRIT NI PRIX NI PÉRIMÈTRE. Il compose l'accordéon à partir
 * de `offre.ts`, qui porte les prestations et leur plancher. Le prix affiché
 * est lu dans le module, jamais recopié.
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
 * la page dédiée. Depuis le 2026-10-05, l'offre n'a plus de paliers : la page
 * dit ce qui est compris dès le plancher et ce qui fait monter le prix.
 */
const RENVOI: Record<PrestationId, string> = {
  vitrine:
    "De la page qui fait appeler au site qui vous dit ce qu’il rapporte. Ce qui est compris et ce qui fait varier le prix sont sur la page dédiée.",
  logiciel:
    "De l’outil qui fait disparaître une tâche à la plateforme où vos systèmes restent d’accord entre eux. Ce qui est compris et ce qui fait varier le prix sont sur la page dédiée.",
};

export const services: ServiceItem[] = prestations.map(
  (p, index): ServiceItem => ({
    number: String(index + 1).padStart(2, "0"),
    title: p.nom,
    /*
     * LE PLANCHER, DEPUIS LE 2026-10-05 : la fourchette « de X à Y » a quitté
     * le site avec les paliers. `priceParts()` découpe « à partir de » : le
     * libellé gris devient « Prix : à partir de », le montant reste blanc.
     */
    price: aPartirDe(p),
    body: [p.resume, RENVOI[p.id]],
    image: IMAGES[p.id],
    cta: { label: "Voir le détail et les prix", href: `/services/${p.slug}` },
    // COMPOSÉE, jamais écrite à la main : `RDV_PAR_PRESTATION` est le seul
    // endroit où « vitrine » devient « site ».
    rdvHref: lienRendezVous(RDV_PAR_PRESTATION[p.id]),
    ...(p.id === "vitrine"
      ? { lienLocal: { label: "Création de site internet à Caen", href: CHEMIN_PAGE_CAEN } }
      : {}),
  }),
);
