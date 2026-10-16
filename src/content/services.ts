import type { ImageAsset, ServiceItem } from "@/lib/content/types";
import {
  aPartirDe,
  ctoReferentIA,
  integrationIA,
  prestation,
  type Offre,
} from "@/content/offre";
import {
  lienRendezVous,
  RDV_HORS_PRESTATION,
  RDV_PAR_PRESTATION,
  type IdRendezVous,
} from "@/content/rendez-vous";
import { CHEMIN_PAGE_CAEN } from "@/content/page-caen";
import { CHEMIN_AUTOMATISATION, CHEMIN_CTO } from "@/content/page-theme";

/**
 * Prestations de la section « Services » (section06.ts de l'archive Framer),
 * rendue par l'accordéon de `/a-propos`.
 *
 * CE FICHIER N'ÉCRIT NI PRIX NI PÉRIMÈTRE. Il compose l'accordéon à partir
 * de `offre.ts`, qui porte les offres et leur plancher. Le prix affiché est lu
 * dans le module, jamais recopié.
 *
 * QUATRE LIGNES depuis le 2026-10-16, demande d'Eliott : « que ça corresponde
 * beaucoup plus à l'étendue de ce que je peux faire ». Du site à l'outil, de
 * l'IA au pilotage technique : Site vitrine, La Solution métier, L'intégration
 * IA et le CTO et référent IA à temps partagé. Chaque ligne a un prix « à
 * partir de » et une page. Le Diagnostic et l'Audit de code, sortis le
 * 2026-09-24 faute de prix et de page, ne reviennent pas.
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
  readonly lienLocal?: ServiceItem["lienLocal"];
}

const VITRINE = prestation("vitrine");
const LOGICIEL = prestation("logiciel");

/*
 * Depuis le 2026-10-05, l'offre n'a plus de paliers : chaque page dit ce qui
 * est compris dès le plancher et ce qui fait monter le prix.
 */
const LIGNES: readonly LigneService[] = [
  {
    offre: VITRINE,
    resume: VITRINE.resume,
    renvoi:
      "De la page qui fait appeler au site qui vous dit ce qu’il rapporte. Ce qui est compris et ce qui fait varier le prix sont sur la page dédiée.",
    image: {
      src: "/images/services/02-visibilite-locale.jpg",
      alt: "Deux commerces de quartier au coin d’une rue",
    },
    page: `/services/${VITRINE.slug}`,
    rendezVous: RDV_PAR_PRESTATION.vitrine,
    lienLocal: { label: "Création de site internet à Caen", href: CHEMIN_PAGE_CAEN },
  },
  {
    offre: LOGICIEL,
    resume: LOGICIEL.resume,
    renvoi:
      "Le plancher couvre un outil simple : un écran, une base, une tâche automatisée. Les modules, les outils à relier et la reprise de votre historique font monter le prix : le détail est sur la page dédiée.",
    image: {
      src: "/images/services/04-logiciel-metier.jpg",
      alt: "Engrenages d’une machine industrielle en prise",
    },
    page: `/services/${LOGICIEL.slug}`,
    rendezVous: RDV_PAR_PRESTATION.logiciel,
  },
  {
    offre: integrationIA,
    resume:
      "L’IA branchée dans les outils que vous utilisez déjà, sur une tâche que votre équipe refait chaque semaine : trier les mails, saisir les commandes, relancer les factures. Vous reprenez des heures sans changer de logiciel.",
    renvoi:
      "Un premier usage branché sur un outil démarre au plancher. Les tâches chiffrées avant et après, et ce qui fait varier le prix, sont sur la page dédiée.",
    image: {
      src: "/images/services/03-outil-metier.jpg",
      alt: "Ciseaux à bois posés sur un établi tracé au crayon",
    },
    page: CHEMIN_AUTOMATISATION,
    rendezVous: RDV_HORS_PRESTATION.integrationIA,
  },
  {
    offre: ctoReferentIA,
    resume:
      "Pour une PME sans directeur technique : je prends les décisions techniques avec vous, je relis les devis avant que vous signiez, et je mets l’IA là où elle vous rend des heures. Deux jours de travail chaque mois, un comité mensuel en visio.",
    renvoi:
      "Trois mois d’engagement, puis un mois de préavis. Ce qui est compris, et ce qu’ajoutent quatre jours de travail chaque mois, est sur la page dédiée.",
    image: {
      src: "/images/services/01-diagnostic.jpg",
      alt: "Pied à coulisse posé sur des plans techniques",
    },
    page: CHEMIN_CTO,
    rendezVous: RDV_HORS_PRESTATION.cto,
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
     * L'offre mensuelle garde « par mois » derrière son montant.
     */
    price: aPartirDe(ligne.offre),
    body: [ligne.resume, ligne.renvoi],
    image: ligne.image,
    cta: { label: "Voir le détail et les prix", href: ligne.page },
    // COMPOSÉE, jamais écrite à la main : `RDV_PAR_PRESTATION` et
    // `RDV_HORS_PRESTATION` sont les seuls endroits où une offre devient un
    // sujet de rendez-vous.
    rdvHref: lienRendezVous(ligne.rendezVous),
    ...(ligne.lienLocal ? { lienLocal: ligne.lienLocal } : {}),
  }),
);
