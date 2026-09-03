import type { Testimonial } from "@/lib/content/types";

/**
 * IL N'Y A PLUS DE TÉMOIGNAGE CLIENT DANS CE FICHIER, ET C'EST VOULU.
 *
 * `sophieTestimonial` (« Sophie Andersen ») et `stacklineTestimonial`
 * (« Daniel Kowalski », Stackline) ont été SUPPRIMÉS le 2026-09-01. C'étaient
 * deux témoignages du template, attribués à des personnes qui n'existent pas et
 * rédigés en louanges précises et chiffrées. Ils ne s'affichaient pas : la
 * section est éteinte par `siteFeatures.testimonials`, et ils n'étaient gardés
 * que pour que la bascule soit possible en un mot.
 *
 * C'est précisément le danger. Un drapeau remis à `true` par curiosité, un
 * composant rebranché par erreur, et le site publiait deux faux clients avec
 * leurs résultats inventés. La donnée seule protégeait, et une donnée n'est pas
 * une garde : la garde, c'est qu'il n'y ait rien à publier.
 *
 * RÉACTIVER LA SECTION demande donc maintenant d'écrire un vrai témoignage,
 * signé par une vraie personne, ce qui est exactement la condition qu'il fallait
 * poser. Le type `Testimonial`, la section, ses deux points de montage et le
 * drapeau sont tous intacts : il ne manque que la parole d'un client.
 *
 * CE QUI RESTE ICI SONT DES PHRASES D'ELIOTT — `jenniferTestimonial` et
 * `pricingPromise`.
 *    Dans le template, elles étaient attribuées à des membres de l'« équipe ».
 *    Eliott travaille seul : ce ne sont pas des témoignages mais des phrases de
 *    manifeste, réécrites à la première personne du singulier. Les deux sections
 *    qui les portent restent VISIBLES (« How we do it » de `stats.ts` et
 *    ouverture de la section tarifs de `home.ts`). Les clés d'export et la forme
 *    `Testimonial` sont conservées : d'autres fichiers de contenu les importent.
 *
 * AVATARS : plus AUCUN portrait du template ne subsiste dans ce fichier.
 * Ceux des deux phrases d'Eliott avaient été retirés parce qu'ils montraient des
 * inconnus sous son nom ; ceux des deux témoignages de démonstration l'ont été
 * le 2026-08-26 pour la même raison, doublée d'une licence intraçable. Le champ
 * `avatar` est optionnel et les composants gèrent l'absence.
 */

/**
 * Phrase intégrée à la section « How we do it » (stats.ts) — SECTION VISIBLE.
 * Ce n'est pas un témoignage : c'est Eliott qui parle de sa façon de travailler.
 * La troisième phrase du template (« Most clients stay for years ») a été
 * retirée : l'activité a démarré le 1er juin 2026, l'ancienneté n'existe pas.
 * Elle est remplacée par un engagement tenable au présent.
 */
export const jenniferTestimonial: Testimonial = {
  // « JE RESTE DISPONIBLE APRÈS LA MISE EN LIGNE » A SAUTÉ le 2026-08-31 : c'est
  // une promesse de disponibilité sans terme, qu'aucun mot d'Eliott ne porte et
  // qu'un client peut ressortir des années plus tard. Elle est remplacée par la
  // barre qu'il se fixe et qu'il a formulée lui-même : n'avoir aucun regret.
  quote:
    "Je ne cherche pas le volume. Je prends chaque projet très à cœur et je vais au bout de ce que je sais faire : ce que je vise, c’est n’avoir aucun regret sur ce que je livre.",
  // Fragments rendus en blanc plein dans la section « How we do it ».
  // ATTENTION : `StatsSection.tsx` recopie encore ces deux fragments en dur, en
  // anglais. Tant qu'il n'est pas branché sur cette donnée, l'emphase ne sort pas.
  highlights: ["Je ne cherche pas le volume", "aucun regret"],
  author: {
    name: "Eliott Bouquerel",
    // Ni rôle ni société : Eliott est seul, il n'y a pas d'organigramme à citer.
    // `avatar` retiré (photo de personne fictive) — voir l'en-tête du fichier.
  },
};

/**
 * Citation d'ouverture de la section tarifs (home.ts, œil « Ma façon de voir »)
 * — SECTION VISIBLE. Phrase d'Eliott, pas un témoignage.
 * Les guillemets font partie de la CHAÎNE : `PricingSection.tsx` rend
 * `quote.quote` tel quel, sans rien ajouter autour. Les retirer ferait
 * disparaître les guillemets à l'écran.
 */
/**
 * Ouverture de la section TARIFS. Ce n'est ni un témoignage ni un manifeste :
 * c'est l'ENGAGEMENT DE FACTURATION, à l'endroit précis où le visiteur se
 * demande si le prix affiché va déraper. La forme `Testimonial` est conservée
 * parce que le composant attend une citation signée, mais le contenu est une
 * information vérifiable, pas une opinion sur le métier.
 *
 * Chaque phrase doit rester tenable : le périmètre est écrit dans le devis,
 * l'acompte est de 30 % (voir la FAQ), et une demande hors périmètre est
 * chiffrée à part au lieu d'être absorbée en silence.
 */
export const pricingPromise: Testimonial = {
  quote:
    "« Le prix est fixé avant que je commence, et il ne bouge pas. Ce qui n’est pas écrit dans le devis n’arrive pas dans la facture. »",
  author: {
    name: "Eliott Bouquerel",
    // RÔLE REMIS. La source affiche trois lignes sous le portrait : le nom, la
    // fonction, puis la marque (« Anna Schneider / Head of Sales at / la marque d'origine »).
    // La troisième n'a pas d'équivalent ici : la marque, c'est le nom déjà
    // affiché sur la première ligne, et « Eliott Bouquerel / Développeur
    // freelance chez / Bouquerel® » se lirait comme une erreur. Le composant
    // rend donc deux lignes, et n'écrit le liant « chez » que si une société
    // existe.
    role: "Développeur freelance",
    // PORTRAIT REMIS. Il avait été retiré parce que le template y montrait une
    // inconnue, présentée sous le nom d'Eliott. Cadré au rapport de la source
    // (136 / 167 = 0,814), servi en 408 × 501 pour rester net sur écran dense.
    avatar: {
      src: "/images/eliott-portrait-citation.jpg",
      alt: "Eliott Bouquerel",
    },
  },
};

/**
 * Registre exposé par le port contenu (`getTestimonials`). Il ne porte plus que
 * des phrases d'Eliott : tant qu'aucun client n'a écrit, un consommateur qui
 * lirait ce tableau ne peut plus en sortir de faux témoignage.
 */
export const testimonials: Testimonial[] = [
  jenniferTestimonial,
  pricingPromise,
];
