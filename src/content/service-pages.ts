/**
 * Libellés des pages de prestation (`/services/<slug>`).
 *
 * TOUT LE TEXTE D'INTERFACE DE CES PAGES VIT ICI, comme le reste du site :
 * `scripts/hardcoded-text-audit.mjs` refuse une chaîne visible écrite dans un
 * composant. La règle a une raison pratique et une raison de fond : la première
 * est qu'une chaîne dans un composant échappe au correcteur typographique
 * français, la seconde est qu'on ne relit pas une offre en ouvrant du JSX.
 *
 * CE QUI NE FIGURE PAS ICI : les prix, les durées et les périmètres. Ils vivent
 * dans `offre.ts` et sont calculés.
 */
import type { PrestationId } from "./offre";

/**
 * TITRE DE RECHERCHE ET TITRE DE PAGE, prestation par prestation.
 *
 * CE QUI ÉTAIT SERVI, ET POURQUOI C'ÉTAIT UN DÉFAUT SANS CONTREPARTIE. La
 * balise `<title>` de ces trois pages valait `prestation.nom` : « Site
 * vitrine », « L'Outil », « Le Logiciel ». Deux d'entre elles sont des NOMS
 * INTERNES DE CATALOGUE — personne ne tape « le logiciel » pour chercher un
 * développeur — et aucune ne portait la marque, alors que toutes les autres
 * pages du site suivent « … · Eliott Bouquerel ». Une page de vente sans mot
 * cherchable dans son titre est une page qui ne se trouve pas.
 *
 * POURQUOI ÇA VIT ICI ET NON DANS `offre.ts`. `nom` est le nom commercial du
 * palier : il porte l'accordéon de l'accueil, la matrice tarifaire et le
 * contrôle de cohérence de `offre.test.mjs` (`services.title === prestation.nom`).
 * Le titre de recherche est un autre objet, avec une autre contrainte, la
 * longueur. Les confondre revient à faire dépendre le catalogue du référencement.
 *
 * LA CONTRAINTE DE LONGUEUR EST DURE : au-delà d'une soixantaine de caractères,
 * un résultat de recherche est tronqué et la marque, qui est en fin de titre,
 * disparaît la première. Les trois titres sont MESURÉS sur le rendu : 56, 58
 * et 54 caractères. `service-pages.test.mjs` refuse tout ajout au-dessus de 60.
 *
 * LA ZONE N'EST ÉCRITE QUE LÀ OÙ ELLE SE CHERCHE. « Site vitrine » est une
 * requête locale : on cherche quelqu'un près de chez soi. Un outil ou un
 * logiciel métier se commande à distance, et y coller une région ne fait que
 * rétrécir la requête sans rien gagner.
 */
export const servicePageSeo: Record<
  PrestationId,
  {
    /** Balise `<title>`, marque comprise. 60 caractères, jamais plus. */
    readonly titre: string;
    /**
     * Le H1. Il dit ce qui est vendu, avec les mots du client, et il reste
     * COURT : la typographie de la page le rend en capitales à 98 px sur une
     * colonne de 510 px, où chaque mot occupe une ligne pleine.
     */
    readonly h1: string;
  }
> = {
  vitrine: {
    titre: "Création de site vitrine en Normandie · Eliott Bouquerel",
    h1: "Site vitrine sur mesure",
  },
  outil: {
    titre: "Outil métier sur mesure pour TPE et PME · Eliott Bouquerel",
    h1: "Outil métier sur mesure",
  },
  logiciel: {
    titre: "Logiciel métier sur mesure pour PME · Eliott Bouquerel",
    h1: "Logiciel métier sur mesure",
  },
};

export const servicePageLabels = {
  /*
   * « Toutes les prestations » A DISPARU avec le retour simple qu'il libellait,
   * remplacé par le fil d'Ariane ci-dessous. Un libellé qui survit au composant
   * qui l'affichait est un texte que personne ne relit et que personne ne voit.
   */

  /**
   * FIL D'ARIANE, repris du motif déjà en place sur `/work/*`.
   *
   * La dernière marche porte `prestation.nom` — « L'Outil », « Le Logiciel » —
   * et c'est elle qui garde le nom de catalogue lisible sur la page, une fois
   * que le H1 est passé aux mots que le client tape.
   *
   * « Prestations » pointe sur `/#services`, l'accordéon de l'accueil : c'est
   * le seul index de l'offre, il n'existe pas de page `/services` nue. Déclarer
   * une marche vers une adresse qui répond 404 serait pire que ne rien déclarer.
   */
  filAriane: {
    /** Nom accessible du `<nav>`. Lu par un lecteur d'écran, jamais affiché. */
    intitule: "Fil d’Ariane",
    accueil: "Accueil",
    prestations: "Prestations",
    /** Séparateur visible entre deux marches. */
    separateur: "/",
  },

  /** Chapô de la fourchette, en tête de page. */
  fourchette: "Selon le périmètre,",

  /** Suffixe des montants. Toujours séparé du chiffre : jamais « 5 000 €HT ». */
  horsTaxes: "HT",

  /**
   * Titre de la section des trois périmètres.
   *
   * « 3 » ET NON « TROIS », règle posée par Eliott le 2026-09-01 et appliquée à
   * tout le site : un nombre écrit en chiffres s'accroche à l'œil, le même
   * nombre écrit en lettres se lit comme un mot de plus.
   */
  titrePacks: "3 périmètres, et ce qui les sépare",

  /**
   * Signalement du périmètre conseillé.
   *
   * IL DISAIT « LE PLUS CHOISI » et c'était faux : aucune mission n'a encore été
   * livrée, donc aucun périmètre n'a jamais été choisi par personne. Une preuve
   * sociale fabriquée est le premier signal qui décrédibilise un site quand elle
   * se voit, et elle se voit toujours. « Recommandé » est une recommandation,
   * pas une statistique : c'est vrai le premier jour comme le centième.
   */
  misEnAvant: "Recommandé",

  /** Amorce de la ligne « pour qui ». */
  pourQui: "Pour toi si",

  /**
   * Phrase d'enchaînement entre deux périmètres.
   *
   * ELLE EST OBLIGATOIRE, et pas décorative. À partir du deuxième périmètre, la
   * liste n'énumère que ce qui S'AJOUTE : sans cette phrase, le lecteur voit une
   * liste plus courte en face d'un prix plus élevé et en conclut l'inverse de ce
   * qui est vrai.
   */
  toutLePrecedent: (precedent: string) => `Tout ce que contient ${precedent}, plus :`,

  /** Bouton de chaque carte. */
  cta: "En parler",

  /** Titre de la section qui explique les écarts de prix. */
  titreVariation: "Pourquoi un devis ne tombe jamais pile sur ces montants",

  /**
   * CE QUI FAIT BOUGER LE PRIX.
   *
   * La grille comparative supprimée le 2026-08-27 ne répondait à cette question
   * nulle part : elle montrait une différence entre trois colonnes sans jamais
   * dire ce qui la produisait. C'est pourtant la seule question que se pose un
   * dirigeant devant trois montants.
   *
   * Les quatre points ci-dessous sont les quatre causes réelles de dérive, dans
   * l'ordre où elles apparaissent sur un projet. Elles sont écrites du côté du
   * client, parce que ce sont ses décisions à lui qui déplacent la date.
   */
  variation: [
    {
      titre: "Ce que tu fournis, et ce que je produis",
      corps:
        "Des textes prêts et des photos exploitables ne coûtent pas la même chose qu’une page blanche. C’est le premier poste d’écart, et c’est celui sur lequel tu as la main.",
    },
    {
      titre: "Ce qui existe déjà chez toi",
      corps:
        "Un outil documenté, avec une interface prévue pour, se branche en 1 jour. Un logiciel fermé, ou un export qu’il faut aller chercher à la main, en prend 5. Je le regarde avant de chiffrer, jamais après.",
    },
    {
      titre: "Le nombre de décisions à prendre",
      corps:
        "Ce qui fait déraper un projet, c’est presque toujours une question d’organisation à laquelle personne n’a répondu, et le temps passé à attendre la réponse. Plus tes règles sont écrites, plus le chiffrage est bas.",
    },
    /*
     * CE POINT ÉTAIT À MOITIÉ FAUX, corrigé sur relevé d'Eliott le 2026-09-01.
     *
     * Il rangeait tout ce qui arrive en cours de route dans un seul sac, avec
     * pour seule conséquence un délai plus long. Deux choses très différentes y
     * étaient confondues :
     *
     *  - la MODIFICATION (un texte, une photo, une couleur), qui est comprise ;
     *  - l'AJOUT D'UNE FONCTION qui n'était pas au cadrage, qui fait l'objet
     *    d'un devis, parce qu'elle n'y était pas.
     *
     * Mot d'Eliott : « moi je travaille pas dans le vent, je rallonge pas mes
     * délais pour le même prix ». La règle est déjà au corpus (« une demande
     * nouvelle fait l'objet d'un devis »), elle manquait ici.
     *
     * ÉCRIT SANS MENACE, ET SANS AMBIGUÏTÉ NON PLUS : le lecteur doit pouvoir
     * demander une retouche sans craindre une facture, et savoir qu'une
     * fonction en plus se chiffre. Les deux moitiés sont dans la même phrase.
     */
    {
      titre: "Ce que tu décides d’ajouter en cours de route",
      corps:
        "Changer un texte, une photo ou une couleur pendant le développement : c’est compris. Une fonction qui n’était pas au cadrage est un autre travail, avec sa propre durée : je la chiffre à part, et tu décides. Le prix déjà signé, lui, ne bouge pas.",
    },
  ],
} as const;
