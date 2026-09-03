import type { AboutContent } from "@/lib/content/types";
import { slugsMisEnAvant } from "@/content/blog";
import { services } from "@/content/services";

// Les quatre chiffres du template ("60+ projects shipped since 2019",
// "89% business from referrals", "12 industries served", "100% on-time")
// étaient des preuves sociales fabriquées : activité démarrée le 1er juin 2026,
// aucun historique à afficher. La grille reste (le composant attend quatre
// cellules et une valeur numérique par cellule), mais elle porte désormais des
// ENGAGEMENTS tenables au présent, pas un palmarès.
// L'ordre suit les vitesses de compteur du composant (10 / 12 / 40 / 10 ms).
const aboutStats = [
  { value: "1", label: "Interlocuteur : tu parles à celui qui écrit le code" },
  /* « 2h » A ÉTÉ CORRIGÉ EN « 24h » le 2026-08-31, et c'était la dernière
     survivance de la promesse retirée. Elle était annoncée à deux heures à trois
     endroits ; il n'en restait plus qu'un, ici, et il contredisait `site.ts`,
     `contact.ts` et la grille de la page d'accueil. L'engagement tenu est une
     réponse à chaque message sous 24 heures ouvrées. */
  { value: "24h", label: "Réponse à chaque message, en heures ouvrées" },
  /* « 0 FRAIS CACHÉ » ET « 100 % CODE SUR MESURE » SONT PARTIS le 2026-08-31.
     Le second était une contre-vérité : Eliott part de briques standards
     (boilerplates, composants, références visuelles), et ce qui n'existe nulle
     part ailleurs est l'ASSEMBLAGE, pas chaque ligne. Le premier était une
     formule sans contenu. Les deux sont remplacés par des engagements écrits
     ailleurs et vérifiables : l'échéancier des CGV et la cession des droits. */
  { value: "30 %", label: "À la signature, 40 % à mi-parcours, 30 % à la livraison" },
  { value: "100 %", label: "Du code livré t’appartient" },
] as const;

/**
 * Contenu de la page À propos — structure extraite de about.html (archive
 * Framer), texte réécrit en français à la première personne du singulier.
 * NOTE : le corps du template mentionnait "Matter Studio" alors que la marque
 * était « la marque d'origine » (incohérence d'origine). Sans objet ici : le récit ne porte
 * plus de nom de studio.
 *
 * TUTOIEMENT depuis le 2026-09-02 (décision d'Eliott, cf. l'en-tête de
 * `home.ts`). C'est la page qui répond à « qui je suis » : c'est aussi celle où
 * le vouvoiement sonnait le plus comme un cabinet. Aucune phrase n'a changé de
 * contenu, seulement de personne. Attention aux accords en cas de reprise :
 * « vous ne verrez jamais » est devenu « tu ne verras jamais », « vous
 * n'achetez pas » est devenu « tu n'achètes pas ».
 */
export const aboutContent: AboutContent = {
  hero: {
    title: "À propos.",
    subtitle:
      "Je construis seul les sites et les outils des entreprises qui veulent des résultats.",
    // Fragments du sous-titre rendus en blanc plein (le reste est atténué).
    subtitleParagraphs: [
      {
        text: "Je construis seul les sites et les outils des entreprises qui veulent des résultats.",
        emphasis: ["seul", "veulent des résultats."],
      },
    ],
  },
  // Surtitre du bloc récit et photo, écrits en dur jusqu'ici.
  storyEyebrow: "Pourquoi je travaille comme ça",
  cover: {
    // Le visuel du template montrait des inconnus présentés comme « l'équipe du
    // studio ». Sur la page qui répond à « qui je suis », c'est le portrait
    // d'Eliott qui a sa place.
    //
    // PHOTO NATURELLE depuis le 2026-08-26. Le fichier servi ici était le
    // portrait DÉTOURÉ sur aplat vert : passé au filtre du cadre
    // (`grayscale` + `contraste .75` + `luminosité 1.8`), l'aplat virait à un
    // jaune-vert délavé qui occupait les deux tiers de l'image, et le buste
    // coupé flottait dessus. C'est le plus grand portrait du site : il porte
    // désormais la photo d'origine, en situation, dont le fond gris du ciel et
    // de l'étang tient tout seul en niveaux de gris. Le détourage vert reste
    // employé là où il fonctionne — la vignette ronde, la citation tarifs et le
    // bloc « à propos » de l'accueil.
    src: "/images/eliott-nature-vertical.jpg",
    alt: "Eliott Bouquerel, au bord d’un étang",
  },
  bodyHighlights: ["Seul par choix", "toi et le travail"],
  teamTitleLines: ["Qui", "je suis."],
  body: [
    /* PARAGRAPHE D'OUVERTURE, RÉÉCRIT le 2026-08-31.
     *
     * IL S'OUVRAIT SUR « une phrase que j'entends à chaque premier appel ». Ce
     * n'était pas vrai : Eliott n'a pas encore assez d'appels pour dégager une
     * phrase récurrente de prospect, il l'a dit lui-même le 2026-08-31, et c'est
     * même la seule chose que le corpus déclare manquante. Une citation de
     * client inventée sur la page qui répond à « qui je suis » est exactement le
     * défaut que ce chantier corrige.
     *
     * CE QUI OUVRE MAINTENANT est ce qu'il vend réellement, dans ses mots : pas
     * un site, ce que le site rapporte. */
    "Je ne vends pas un site. Je vends ce qu’il te rapporte : des clients qui te trouvent, une image qui te place au-dessus, un prétexte pour décrocher un rendez-vous. Un site qui impressionne et qui n’amène rien, ça existe, et c’est même devenu courant.",
    /*
     * PARAGRAPHES 2 A 5, REECRITS le 2026-08-31.
     *
     * CE QUI EST PARTI, ET POURQUOI.
     *
     * 1. « Le prix et le perimetre sont arretes sur le devis avant le premier
     *    jour » disait vrai, mais repondait a « qu'est-ce que vous me
     *    garantissez » alors que cette page repond a « qui je suis ». Les
     *    engagements chiffres vivent dans la FAQ et dans la grille de chiffres
     *    posee juste au-dessus : ils n'ont pas a etre racontes deux fois.
     *
     * 2. « Ce que je construis, ce n'est pas la boutique : ce sont les outils
     *    autour » enfermait Eliott dans l'outillage e-commerce alors qu'il vend
     *    aussi des sites, et sa liste (ERP, transporteur, back-office, tableau
     *    de bord de marge) enumerait des segments. La cible est large et
     *    assumee : une liste exclut.
     *
     * 3. « Si vous cherchez une refonte graphique ou du referencement, il y a
     *    mieux ailleurs » etait la contradiction la plus couteuse de la page.
     *    Le referencement naturel, la conversion, l'UX et le marketing SONT
     *    exactement ce qu'Eliott met en avant pour justifier son prix : ce
     *    paragraphe renvoyait ailleurs les clients qu'il cherche.
     *
     * CE QUI LES REMPLACE suit l'ordre de ses arguments : ce qu'il sait faire et
     * pourquoi ca coute plus cher, l'IA remise a sa vraie place, l'agence, puis
     * la part invisible du travail.
     */
    "Ce que je construis est pensé pour le référencement naturel et pour la conversion, avec ce que je sais faire en expérience utilisateur, en interface, en ergonomie, en accessibilité et en marketing. Sur un projet à quelques centaines d’euros, ces étapes-là sautent : personne n’a le temps d’y penser et de rester rentable. C’est pour ça que je facture au-dessus, et c’est pour ça que ce que je livre n’a pas grand-chose à voir.",
    /*
     * L'IA SE DIT, ET C'EST ELIOTT QUI L'A TRANCHE le 2026-08-31, contre l'avis
     * qui lui etait donne. Son argument : la transparence sur sa facon de
     * travailler vaut mieux que le silence.
     *
     * LA NUANCE PORTE TOUT L'ARGUMENT, et elle doit rester lisible ligne a
     * ligne. Son concurrent fait GENERER le site ; lui s'en sert pour DECIDER,
     * et il ecrit le code lui-meme. Meme outil, place opposee dans la chaine.
     * Ecrire « je genere des sites avec l'IA » le rangerait du cote du moteur
     * lent, c'est-a-dire du cote de son concurrent.
     */
    "Je travaille avec l’intelligence artificielle, et je préfère le dire. Pas pour fabriquer ton site : pour décider. Avant d’écrire une ligne, je m’en sers comme d’un contradicteur sur les arbitrages qui comptent : ton positionnement, ce qu’il faut montrer et à qui, l’architecture du projet, les outils sur lesquels il reposera encore dans deux ans. Le code, lui, je l’écris et j’en réponds.",
    "Une agence, ce sont des salariés, des plannings, des ressources humaines et plusieurs corps de métier : des frais qui courent que ton projet avance ou non, et une chaîne de personnes entre toi et le travail. Je vais droit au but. Je suis développeur, et je suis à l’aise avec les métiers qui gravitent autour, ce qui me permet de tenir un projet d’un bout à l’autre au lieu de le faire passer de main en main.",
    /*
     * LES SIX CHOSES QU'ELIOTT FAIT SANS QU'ON LES LUI DEMANDE, tenues en un
     * seul paragraphe. Elles ne se vendent pas une par une : leur point commun
     * est qu'aucune ne se voit a la livraison, et qu'elles ne se decouvrent que
     * le jour ou ca casse, ou deux ans plus tard quand il faut faire evoluer.
     * D'ou la derniere phrase, qui est l'argument et non le resume.
     */
    "Il y a une part du travail que tu ne verras jamais, et c’est la plus importante. L’architecture décidée avant le premier écran. Les outils choisis sur ce qu’ils coûteront à faire vivre, pas sur mes préférences. Les tests passés par des outils extérieurs aux miens, sur la vitesse, le référencement, l’accessibilité. La gestion des erreurs, pour qu’une panne dise pourquoi elle arrive au lieu de te laisser deviner. Le code documenté, pour que quelqu’un d’autre puisse reprendre après moi. Tu n’achètes pas ces points-là : tu achètes de ne jamais avoir à les découvrir.",
    // Le template écrivait « four people » en minuscule après un point (artefact
    // de la source Framer). Sans objet en français : Eliott travaille seul, la
    // phrase est repartie proprement.
    //
    // DERNIER PARAGRAPHE = CHAPÔ. AboutPage prend le dernier élément de body
    // comme chapô de la section « Qui je suis. » : c'est lui, et lui seul, que
    // bodyHighlights met en avant. Les deux fragments déclarés doivent donc
    // rester dans cette phrase-là.
    "Seul par choix. Un seul interlocuteur, aucune couche intermédiaire, personne entre toi et le travail. Et une barre que je me fixe sur chaque projet : n’avoir aucun regret sur ce que j’ai livré."
  ],
  // Les quatre membres d'équipe du template (Anna Schneider, Jennifer Peterson,
  // Erik Voss, Liam Torres) sont des personas fictifs : ils n'existent pas et
  // Eliott travaille seul. La grille de portraits reste donc VIDE tant qu'il n'y
  // a personne d'autre à montrer — le titre « Qui je suis. » et le chapô
  // « Seul par choix… » suffisent à porter la section.
  team: [],
  stats: aboutStats,
  services: {
    eyebrow: "Services",
    // IDENTIQUE à `homeContent.services.intro` (même section, deux pages).
    intro:
      "Je pars de ta façon de travailler, et je construis ce qui lui correspond. Pas de fonctions en trop, rien à contourner.",
    items: services,
  },
  // `testimonial` ABSENT depuis le 2026-09-01. Il portait « Sophie Andersen »,
  // persona du template supprimé de `testimonials.ts` : le champ est optionnel,
  // et le bloc de la page est de toute façon gardé par `siteFeatures.testimonials`.
  articles: {
    eyebrow: "Actualités et nouveautés.",
    titleLines: ["Actualités et", "nouveautés."],
    cta: { label: "Voir plus", href: "/blog" },
    // QUATRE cartes dans le teaser de la source, pas trois : la dernière
    // manquait, ce qui raccourcissait la section de 403px en mobile.
    //
    // DÉRIVÉE DU REGISTRE depuis le 2026-08-28, et surtout PARTAGÉE avec
    // l'accueil : cette liste était une copie de celle de `home.ts`, et une
    // copie qui dérive est une section qui n'affiche pas la même chose que
    // l'accueil sans que personne le remarque. Voir l'en-tête de `blog.ts`.
    featuredSlugs: slugsMisEnAvant,
  },
  seo: {
    // Séparateur et marque alignés sur `siteConfig.meta.titleTemplate`
    // (« %s · Eliott Bouquerel ») : ces titres sont posés en `absolute`, le
    // gabarit ne s'applique donc pas et la marque doit être écrite ici. C'est
    // exactement pourquoi le « ® » y avait survécu au retrait du 2026-08-29 :
    // `brand.mark` ne passe pas par là.
    title: "À propos · Eliott Bouquerel",
    description:
      "Développeur freelance en Normandie, et partout en France à distance. Je construis des sites qui amènent des clients et des outils métier qui rendent des heures.",
  },
};
