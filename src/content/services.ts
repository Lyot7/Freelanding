import type { ImageAsset, ServiceItem } from "@/lib/content/types";
import { aPartirDe, prestation, type Offre } from "@/content/offre";
import { lienRendezVous, RDV_PAR_PRESTATION, type IdRendezVous } from "@/content/rendez-vous";

/**
 * L'offre de la section « Services », rendue par l'accordéon de `/a-propos`.
 *
 * CE FICHIER N'ÉCRIT NI PRIX NI PÉRIMÈTRE : il compose l'accordéon à partir
 * d'`offre.ts`. UNE SEULE LIGNE depuis le 2026-10-31, décision d'Eliott : le
 * site vitrine, l'intégration IA et le CTO à temps partagé ne sont plus des
 * offres.
 *
 * IMAGES : photographies sous licence Unsplash, provenance vérifiée cliché par
 * cliché dans `docs/ASSETS.md`.
 */

/** Une ligne de l'accordéon : une offre, sa page, son rendez-vous. */
interface LigneService {
  readonly offre: Offre;
  /** Une phrase : ce que l'offre règle. */
  readonly resume: string;
  /** Deuxième paragraphe : l'étendue de l'offre, et ce que dit sa page. */
  readonly renvoi: string;
  readonly image: ImageAsset;
  readonly page: string;
  readonly rendezVous: IdRendezVous;
}

const LOGICIEL = prestation("logiciel");

const LIGNES: readonly LigneService[] = [
  {
    offre: LOGICIEL,
    resume: LOGICIEL.resume,
    renvoi:
      "Le plancher couvre un premier outil. Les modules, les outils à relier et la reprise de votre historique font monter le prix : le détail est sur la page dédiée.",
    image: {
      src: "/images/services/04-logiciel-metier.jpg",
      alt: "Engrenages d’une machine industrielle en prise",
    },
    page: `/services/${LOGICIEL.slug}`,
    rendezVous: RDV_PAR_PRESTATION.logiciel,
  },
];

export const services: ServiceItem[] = LIGNES.map(
  (ligne, index): ServiceItem => ({
    number: String(index + 1).padStart(2, "0"),
    title: ligne.offre.nom,
    /*
     * LE PLANCHER, DEPUIS LE 2026-10-05 : la fourchette « de X à Y » a quitté
     * le site avec les paliers. `priceParts()` découpe « à partir de » : le
     * libellé gris devient « Prix : à partir de », le montant reste blanc.
     */
    price: aPartirDe(ligne.offre),
    body: [ligne.resume, ligne.renvoi],
    image: ligne.image,
    cta: { label: "Voir le détail et les prix", href: ligne.page },
    // COMPOSÉE, jamais écrite à la main : `RDV_PAR_PRESTATION` est le seul
    // endroit où une offre devient un sujet de rendez-vous.
    rdvHref: lienRendezVous(ligne.rendezVous),
  }),
);
