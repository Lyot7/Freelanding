import type { ImageAsset, ServiceItem } from "@/lib/content/types";
import {
  prestations,
  type PrestationId,
} from "@/content/offre";
import { lienRendezVous } from "@/content/rendez-vous";

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
 * IMAGES — cinq photographies sous licence Unsplash, provenance vérifiée cliché
 * par cliché dans `docs/ASSETS.md`.
 */

/** Illustration de chaque prestation, appariée par identifiant. */
const IMAGES: Record<PrestationId, ImageAsset> = {
  vitrine: {
    src: "/images/services/02-visibilite-locale.jpg",
    alt: "Deux commerces de quartier au coin d’une rue",
  },
  outil: {
    src: "/images/services/03-outil-metier.jpg",
    alt: "Ciseaux à bois posés sur un établi tracé au crayon",
  },
  logiciel: {
    src: "/images/services/04-logiciel-metier.jpg",
    alt: "Engrenages d’une machine industrielle en prise",
  },
};

/**
 * Deuxième paragraphe de chaque prestation : ce que le visiteur gagne à ouvrir
 * la page dédiée. Il annonce les trois périmètres sans les détailler, parce que
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
    "3 périmètres, de la simple mise en ligne au site qui te dit ce qu’il rapporte. Le détail est sur la page dédiée.",
  outil:
    "3 périmètres, du simple branchement à l’outil supervisé qui t’alerte avant que tu constates la panne. Le détail est sur la page dédiée.",
  logiciel:
    "3 périmètres, du socle qui remplace le tableur partagé à l’écosystème où plusieurs systèmes restent d’accord entre eux. Le détail est sur la page dédiée.",
};

export const services: ServiceItem[] = [
  /*
   * LE DIAGNOSTIC N'A PAS DE PRIX, ET C'EST VOLONTAIRE.
   *
   * Il est compris dans la prestation qui suit. Le mot « gratuit » est
   * volontairement absent : il attire ceux qui repartent avec la note et ne
   * reviennent pas, alors que « compris » range le diagnostic du côté de
   * l'achat. Eliott assume le diagnostic non converti, avec deux raisons qui
   * tiennent : il en ressort avec un contact qualifié, et un prospect que son
   * diagnostic ne convainc pas n'était pas son client.
   *
   * Il n'a pas de page dédiée non plus : il n'a pas de périmètre à détailler,
   * et son point d'arrivée est le formulaire de contact.
   */
  {
    number: "01",
    title: "Le Diagnostic",
    body: [
      "Une heure, au téléphone ou chez toi. On regarde ce qui te fait perdre du temps chaque semaine, comment tes clients te trouvent aujourd’hui, et ce qui se règle vraiment.",
      "Tu repars avec une note écrite : le constat, ce qui vaut le coup d’être fait, dans quel ordre, et ce que ça coûte. Elle t’appartient, et elle est comprise dans la prestation qui suit.",
    ],
    image: {
      src: "/images/services/01-diagnostic.jpg",
      alt: "Pied à coulisse posé sur des plans techniques",
    },
    cta: { label: "Demander un diagnostic", href: "/contact" },
    /*
     * LE DIAGNOSTIC ET L'AUDIT DE CODE PARTAGENT LE SUJET « DÉCOUVERTE ».
     * Ni l'un ni l'autre n'est une prestation de `offre.ts` : ils n'ont ni
     * périmètre à comparer, ni page dédiée, et le rendez-vous qui leur
     * correspond est celui où le prospect dit simplement où il en est.
     */
    rdvHref: lienRendezVous("decouverte"),
  },

  /*
   * L'AUDIT DE CODE, AJOUTÉ le 2026-08-31.
   *
   * IL N'EXISTAIT NULLE PART SUR LE SITE, alors que c'est une prestation en soi
   * et la seule porte d'entrée pour un prospect qui a déjà quelque chose. Le
   * site répondait « je fais du neuf » et s'arrêtait là ; il perdait donc, sans
   * la voir, la troisième des trois situations de départ qu'Eliott a lui-même
   * nommées : l'entreprise qui a un logiciel ancien que plus personne
   * n'entretient.
   *
   * LA LIGNE DE REFUS EST ÉCRITE DANS LE CORPS DU TEXTE, et ce n'est pas une
   * précaution : la reprise est possible sur une base JavaScript récente et bien
   * construite, elle est refusée sur PHP et sur Laravel. La dire ici évite un
   * rendez-vous inutile des deux côtés, et elle vaut mieux dite avant qu'après.
   *
   * PAS DE PRIX ET PAS DE PAGE DÉDIÉE, comme le Diagnostic : il n'a pas trois
   * périmètres à comparer, et son point d'arrivée est le formulaire de contact.
   * `offre.test.mjs` accepte une entrée sans montant, il refuse une entrée dont
   * le montant serait mal préfixé.
   *
   * IMAGE : deux manomètres, seule photographie du jeu qui montre une machine
   * qu'on MESURE au lieu d'une machine qu'on fabrique. Elle dormait dans
   * `public/images/services/` sans emploi depuis le retrait de la ligne suivi.
   */
  {
    number: "02",
    title: "L’Audit de code",
    body: [
      "Tu as déjà un site ou un logiciel, et tu veux savoir s’il vaut la peine d’être repris plutôt que refait. Je lis le code, son architecture et ce sur quoi il repose, et je te réponds sans détour.",
      "Tu repars avec un écrit : reprendre ou refaire, ce que ça coûte dans les deux cas, et ce qui lâchera en premier si tu ne touches à rien. Je peux reprendre un logiciel bâti sur une base JavaScript récente et propre ; sur du PHP ou du Laravel, je n’y touche pas, et je te le dis avant que ça te coûte quoi que ce soit.",
    ],
    image: {
      src: "/images/services/05-suivi-evolution.jpg",
      alt: "Deux manomètres montés sur un détendeur",
    },
    cta: { label: "Faire auditer mon code", href: "/contact" },
    rdvHref: lienRendezVous("decouverte"),
  },

  ...prestations.map(
    (p, index): ServiceItem => ({
      // 01 Diagnostic, 02 Audit de code, puis les trois prestations chiffrées.
      number: String(index + 3).padStart(2, "0"),
      title: p.nom,
      /*
       * AUCUN PRIX SUR L'EN-TÊTE depuis le 2026-09-07.
       *
       * Les fourchettes y étaient posées pour qu'on situe l'offre sans ouvrir
       * le panneau. Elles produisaient l'inverse : trois fourchettes côte à
       * côte, chacune large de plus du double de son plancher, invitent à
       * comparer des montants avant d'avoir lu ce qu'ils achètent — et la
       * ligne portait alors deux appels concurrents, l'un vers le détail,
       * l'autre vers la prise de rendez-vous.
       *
       * Le prix se lit désormais sur la page de la prestation, entouré de son
       * périmètre, où la réservation se fait sur place avec le sujet déjà
       * imposé. La ligne n'a plus qu'un seul appel, qui annonce ce qu'il ouvre.
       */
      body: [p.resume, RENVOI[p.id]],
      image: IMAGES[p.id],
      cta: { label: "Voir le détail et les prix", href: `/services/${p.slug}` },
    }),
  ),
];

/**
 * CE QUE FAIT ELIOTT AU-DELÀ DU CATALOGUE.
 *
 * DEMANDE D'ELIOTT DU 2026-09-02, ses mots : « je fais de l'automatisation IA,
 * je fais des audits, que ce soit de performance, de conversion […] montrer que
 * je suis vraiment complet sur le sujet et que je peux faire plein de choses. »
 *
 * POURQUOI CE N'EST PAS UNE SIXIÈME LIGNE D'ACCORDÉON. Les cinq lignes forment
 * un catalogue : chacune est numérotée, illustrée, et quatre d'entre elles ont
 * un périmètre et une page. Ces trois sujets n'ont ni l'un ni l'autre. Numérotés
 * au milieu des autres, ils se liraient comme des prestations chiffrées dont on
 * aurait oublié le prix ; posés sous la liste, ils disent ce qu'ils sont : ce
 * qu'on peut demander en plus.
 *
 * AUCUN PRIX, AUCUN DÉLAI, AUCUN LIVRABLE DATÉ. Ils n'existent pas dans
 * `offre.ts` et ils n'y entreront pas tant qu'Eliott ne les aura pas cadrés.
 * Chaque phrase ci-dessous ne fait que dire ce que le nom du sujet veut dire ;
 * aucune n'ajoute d'engagement à ce que le site porte déjà.
 */
export const horsCatalogue = {
  titre: "Et aussi",
  intro:
    "Tout ne rentre pas dans un forfait. Ces sujets se chiffrent au cas par cas, une fois qu’on en a parlé.",
  items: [
    {
      nom: "L’automatisation par IA",
      corps: "Les tâches que tu refais à la main, confiées à une machine.",
    },
    {
      nom: "L’audit de performance",
      corps: "Ce qui rend ton site lent, mesuré chiffres à l’appui.",
    },
    {
      nom: "L’audit de conversion",
      corps: "Où tes visiteurs s’arrêtent avant de te contacter.",
    },
  ],
  cta: { label: "En parler", href: lienRendezVous("decouverte") },
} as const;
