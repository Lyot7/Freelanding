/**
 * L'OFFRE — source unique des prestations, de leurs forfaits et de leurs prix.
 *
 * DES FORFAITS À PRIX FERME, DEPUIS LE 2026-09-23. Décision d'Eliott : chaque
 * périmètre porte un montant arrêté, et ce qui dépasse le dernier périmètre se
 * traite sur mesure, sur devis. Le site n'explique plus « pourquoi un devis ne
 * tombe jamais pile » : un prix ferme qui s'excuse de ne pas l'être se
 * contredit à l'écran.
 *
 * CE QUI A DISPARU AVEC LE PASSAGE AU PRIX FERME :
 *  - le taux journalier comme règle de construction. Les montants s'écrivent
 *    désormais ici, pack par pack. Le taux reste un outil interne de chiffrage
 *    (vault, `offre-grille-prix.md`), il n'a plus aucune existence dans le code
 *    du site ;
 *  - la durée affichée. « Environ 5 jours ouvrés » à côté de 3 000 € redonnait
 *    le taux en une division : un prix ferme vend un résultat, la date vit au
 *    devis ;
 *  - L'Outil comme prestation à part. Il devient le premier palier de La
 *    Solution métier : un outil simple et un logiciel complet répondent au même
 *    besoin, à deux tailles différentes, et deux pages voisines forçaient le
 *    visiteur à se ranger avant d'avoir compris le rangement. L'ancienne adresse
 *    `/services/outil-metier` redirige en 301 (`next.config.ts`).
 *
 * POURQUOI CE FICHIER EXISTE. Les prix vivaient à deux endroits, `services.ts`
 * et `pricing.ts`, et ils ont divergé à deux écrans d'intervalle sans que rien
 * ne le signale. `offre.test.mjs` empêche le retour de cette classe d'erreur :
 * aucun montant ne s'écrit ailleurs qu'ici.
 */

/** Identifiants stables des prestations chiffrées. */
export type PrestationId = "vitrine" | "logiciel";

/** Un forfait : un périmètre et son prix. */
export interface Pack {
  /** Identifiant stable, unique à l'intérieur d'une prestation. */
  readonly id: string;
  /** Nom commercial du forfait. */
  readonly nom: string;
  /**
   * Prix HT, en euros. Ferme pour le périmètre décrit ; pour un palier
   * `surMesure`, c'est le PLANCHER du devis, affiché « à partir de ».
   */
  readonly prix: number;
  /**
   * Palier sur mesure : le périmètre n'a pas de plafond, le prix se fixe au
   * devis et ne descend jamais sous `prix`. Réservé au dernier palier.
   */
  readonly surMesure?: true;
  /** Une phrase : ce que le client obtient, pas ce que je fais. */
  readonly promesse: string;
  /** Le cas de figure qui doit faire choisir ce forfait plutôt qu'un autre. */
  readonly pourQui: string;
  /**
   * Ce que le forfait ajoute AU PRÉCÉDENT. Le premier liste tout ; les suivants
   * ne listent que le delta, et la page affiche « tout le précédent, plus ».
   * Écrire trois listes complètes ferait relire trois fois la même chose et
   * masquerait précisément ce qui justifie l'écart de prix.
   */
  readonly ajoute: readonly string[];
}

/** Une prestation vendable : un nom, une page dédiée, trois forfaits. */
export interface Prestation {
  readonly id: PrestationId;
  readonly nom: string;
  /** Segment d'URL de sa page dédiée, sous `/services/`. */
  readonly slug: string;
  /** Une phrase, affichée en tête de la page dédiée et dans l'accordéon. */
  readonly resume: string;
  /** Ce qui sort des forfaits, vers le devis sur mesure. */
  readonly horsPack: string;
  readonly packs: readonly [Pack, Pack, Pack];
}

/**
 * Formate un montant en euros, avec l'espace insécable des milliers et celle
 * qui précède le symbole. Écrire le montant avec des espaces ordinaires laisse
 * le navigateur couper entre « 5 » et « 000 », ou renvoyer le « € » seul à la
 * ligne suivante.
 *
 * LES ESPACES SONT ÉCRITES EN ÉCHAPPEMENT, jamais en caractère littéral. Une
 * insécable et une espace ordinaire sont indiscernables à l'écran comme dans un
 * diff : une réécriture du fichier a déjà remplacé l'insécable par une espace
 * normale sans que rien ne le signale. ` ` se voit.
 *
 * `\s` couvre l'insécable étroite (U+202F) que `toLocaleString` produit selon
 * la version d'ICU, aussi bien que l'insécable ordinaire des versions plus
 * anciennes : les deux sont ramenées à U+00A0.
 */
export function euros(montant: number): string {
  return `${montant.toLocaleString("fr-FR").replace(/\s/gu, " ")} €`;
}

/*
 * LES MONTANTS, ARRÊTÉS PAR ELIOTT LE 2026-09-23.
 *
 * LE SITE : 3 000 / 4 800 / 7 200. Les montants déjà publiés, confirmés par un
 * panel de quatre avis contradictoires (positionnement, dirigeant de PME,
 * agence concurrente, recul à cinq ans) : trois sur quatre les gardent tels
 * quels. Le troisième palier s'appelle « Signature » : il dit le haut de gamme
 * sans jargon, et c'est celui qui porte le travail marketing.
 *
 * LA SOLUTION MÉTIER : 6 000 / 18 000 / à partir de 36 000. Calés sur l'unité
 * réelle de facturation d'Eliott, le MODULE : un pan de l'activité du client
 * (les devis, le planning, la facturation), chiffré autour de 6 000 € dans
 * les devis réels. L'Outil vaut un module et une connexion ; Le Logiciel, jusqu'à trois modules
 * et deux connexions. La Plateforme est du sur mesure : les quatre avis
 * convergeaient pour refuser un prix ferme sur un périmètre sans plafond, et
 * un projet réel à cette échelle dépasse de lui-même l'ancien haut de grille.
 *
 * CE QUI NE BAISSE PAS AVEC LE PRIX : le sur-mesure, la performance et le fait
 * que le référencement soit pensé. Ce qui baisse, c'est la PROFONDEUR. Règle
 * d'Eliott, vérifiable en lisant les périmètres : aucun palier ne retire la
 * vitesse ni le sur-mesure.
 */
/*
 * LA RÈGLE DU CORPUS, posée par Eliott le 2026-09-01 : une promesse qu'il n'a
 * jamais faite n'a rien à faire dans un périmètre chiffré. Sa peur, mot pour
 * mot : « que le client ne me sorte pas "y'a écrit ça sur le site" alors que
 * j'suis pas au courant ». La refonte du 2026-09-23 n'a donc RIEN inventé : les
 * lignes ci-dessous sont celles des neuf anciens périmètres, redistribuées sur
 * six paliers. Un tableau de bord de suivi du trafic, la fiche établissement
 * Google et la prise en main des équipes restent hors forfait, sur devis.
 *
 * LE SITE TUTOIE, et Eliott dit « je » : il est seul, c'est son argument face
 * aux agences. Le « nous » n'existe nulle part.
 */
export const prestations: readonly Prestation[] = [
  {
    id: "vitrine",
    nom: "Site vitrine",
    slug: "site-vitrine",
    resume:
      "Une adresse qui dit ce que tu fais, pour qui, et comment te joindre. Écrite et développée sur mesure. Une fois livrée, elle est à toi, sans abonnement pour continuer à l’utiliser.",
    horsPack:
      "Boutique en ligne, espace client, réservation avec paiement : ces fonctions sortent du site, et je les chiffre avec La Solution métier. Un tableau de bord de suivi du trafic et la remise d’aplomb de ta fiche établissement Google ne sont dans aucun forfait : je les fais en plus, sur devis.",
    packs: [
      {
        id: "landing",
        nom: "La Landing",
        prix: 3000,
        promesse: "Une page qui dit ce que tu fais, et qui fait appeler.",
        pourQui:
          "Tu n’as rien en ligne, ou une page qui date, et il te faut une adresse.",
        ajoute: [
          "1 page longue, développée sur mesure",
          "Tes textes mis en page, tes photos recadrées et compressées",
          "Un formulaire qui arrive dans ta boîte mail",
          "Vitesse mesurée avant la mise en ligne, mobile et ordinateur",
          "Les bases du référencement posées, indexation vérifiée",
          "Mentions légales, politique de confidentialité et bandeau cookies",
          "Hébergement à ton nom, code dans ton dépôt",
        ],
      },
      {
        id: "site",
        nom: "Le Site",
        prix: 4800,
        promesse:
          "Un site qu’on ne confond avec aucun autre, et que Google sait lire.",
        pourQui:
          "Tu es comparé à tes concurrents avant même d’être appelé.",
        ajoute: [
          "5 à 7 pages, direction visuelle tirée de ton univers",
          "Tes textes réécrits avec toi, pour être lus et trouvés",
          "Les mots que tapent tes clients, cherchés avant d’écrire",
          "Balisage, données structurées, Search Console branchée",
          "Une page par métier ou par ville si ton marché est local",
        ],
      },
      {
        id: "signature",
        nom: "Le Site Signature",
        prix: 7200,
        promesse:
          "Un site dont tu sais ce qu’il rapporte, chiffres à l’appui.",
        pourQui:
          "Tu as des visites, et tu veux qu’elles deviennent des appels.",
        ajoute: [
          "Un parcours dessiné pour une action décidée avec toi",
          "La mesure installée : d’où viennent les visites, ce qui déclenche un contact",
          "Tes formulaires branchés sur ta boîte mail, ton agenda ou ton CRM",
          "7 jours après la mise en ligne, une passe de correction sur ce que les chiffres montrent",
        ],
      },
    ],
  },

  {
    id: "logiciel",
    nom: "La Solution métier",
    slug: "logiciel-metier",
    resume:
      "La réponse à un problème précis de ton métier : une tâche que tu refais à la main, un tableur qui déborde, des outils qui ne se parlent pas. Des écrans, une base de données et une mise en production, à la taille de ce que tu dois résoudre.",
    /*
     * La reprise d'un logiciel existant : possible sur une base JavaScript
     * récente et bien construite, refusée sur PHP et Laravel, et toujours
     * précédée d'un audit du code, lui-même prestation à part entière.
     */
    horsPack:
      "Un existant non documenté ou plusieurs sociétés à servir : je chiffre le cadrage à part, je te le remets écrit, et il t’appartient. La prise en main de tes équipes n’est dans aucun forfait : je la fais en plus, sur devis. Reprendre un logiciel déjà en place se tranche par un audit de son code, et la réponse est non sur PHP et sur Laravel.",
    packs: [
      {
        id: "outil",
        nom: "L’Outil",
        prix: 6000,
        promesse: "La tâche que tu refais à la main disparaît.",
        pourQui:
          "1 tâche répétitive, 1 outil à relier, une personne s’en sert.",
        ajoute: [
          "La fonction qui te manque, en ligne sur ton hébergement",
          "Le raccordement à l’outil qui porte déjà tes données",
          "Les écrans nécessaires à cette fonction, et rien de plus",
          "Code source dans ton dépôt, et sa documentation",
        ],
      },
      {
        id: "logiciel",
        nom: "Le Logiciel",
        prix: 18000,
        promesse:
          "Le métier quitte le tableur partagé pour un outil à lui.",
        pourQui:
          "Jusqu’à 3 modules, comme les devis, le planning et la facturation, et 2 outils à relier.",
        ajoute: [
          "Jusqu’à 3 modules : les écrans du quotidien, la base et la mise en production",
          "Jusqu’à 2 raccordements à tes outils existants",
          "Un compte par personne, et des droits différenciés par rôle",
          "La reprise de ton historique, et les cas particuliers de ton métier traités un par un",
          "Un export de tout ce que le logiciel contient, à tout moment",
        ],
      },
      {
        id: "plateforme",
        nom: "La Plateforme",
        prix: 36000,
        surMesure: true,
        promesse: "Tes outils se parlent et restent d’accord entre eux.",
        pourQui:
          "Plusieurs métiers, plusieurs systèmes, et un écart silencieux te coûte cher.",
        ajoute: [
          "Autant de modules que ton activité en demande",
          "Le raccordement de tes autres systèmes, dans les deux sens",
          "La règle écrite : qui gagne quand deux sources se contredisent",
          "Tes circuits mis à plat par écrit : qui fait quoi, et ce qui circule",
          "Supervision, alertes et journal des échanges",
          "Sauvegardes vérifiées, reprise après incident testée en conditions réelles",
        ],
      },
    ],
  },
];

/**
 * SUIVI MENSUEL — part annuelle du prix du projet.
 *
 * VALEUR : 15 %, arbitrée par Eliott le 2026-08-27 sur relevé de marché. Six
 * sources françaises indépendantes placent la maintenance applicative entre 15
 * et 20 % du coût de développement par an.
 *
 * UNE RÈGLE, PAS UN MONTANT : exprimé en part du projet, le suivi suit la
 * grille automatiquement.
 *
 * OÙ IL S'AFFICHE : dans la FAQ, qui répond à « que se passe-t-il après la mise
 * en ligne ». Jamais sur les pages de prestation, à côté des prix : poser un
 * coût récurrent sous un prix de projet fait hésiter.
 *
 * PLANCHER À 90 € PAR MOIS, arbitré par Eliott le 2026-08-27 : le coût fixe
 * d'un suivi ne descend pas avec la taille du projet. Le plancher mord jusqu'à
 * 7 200 € de projet ; au-dessus, c'est le pourcentage qui commande.
 */
export const TAUX_SUIVI = 0.15;

/** Plancher mensuel du suivi, en euros HT. Voir l'en-tête de `TAUX_SUIVI`. */
export const PLANCHER_SUIVI = 90;

/**
 * « 15 % » — le taux, tel qu'il s'écrit dans une phrase.
 *
 * ESPACE FINE INSÉCABLE (U+202F) devant le pourcent, et non l'insécable
 * ordinaire (U+00A0) qui précède l'euro : c'est la convention française, celle
 * qu'applique `scripts/typo-fr.mjs`. Écrite en échappement, parce qu'invisible.
 */
export const tauxSuivi = (): string =>
  `${Math.round(TAUX_SUIVI * 100)} %`;

/** Suivi mensuel d'un projet donné, arrondi à l'euro, plancher compris. */
export const suiviMensuel = (prixProjet: number): string =>
  euros(Math.max(PLANCHER_SUIVI, Math.round((prixProjet * TAUX_SUIVI) / 12)));

/** « 90 € » — le plancher, tel qu'il s'écrit dans une phrase. */
export const plancherSuivi = (): string => euros(PLANCHER_SUIVI);

/** Accès par identifiant, pour que les consommateurs ne dépendent pas de l'ordre. */
export const prestation = (id: PrestationId): Prestation => {
  const trouve = prestations.find((p) => p.id === id);
  if (!trouve) throw new Error(`Prestation inconnue : ${id}`);
  return trouve;
};

/** Montant d'un forfait, formaté. Plancher du devis pour un palier sur mesure. */
export const prixPack = (pack: Pack): string => euros(pack.prix);

/**
 * Le même prix, en NOMBRE, pour les données structurées : `schema.org` attend
 * un nombre, pas « 18 000 € » avec ses espaces insécables.
 */
export const prixPackHT = (pack: Pack): number => pack.prix;

/** Le forfait le moins cher d'une prestation, donc la borne basse de sa fourchette. */
export const packEntree = (id: PrestationId): Pack =>
  prestation(id).packs.reduce((a, b) => (a.prix <= b.prix ? a : b));

/** Le forfait le plus cher, donc la borne haute (ou le plancher du sur-mesure). */
export const packHaut = (id: PrestationId): Pack =>
  prestation(id).packs.reduce((a, b) => (a.prix >= b.prix ? a : b));

/**
 * Fourchette publique d'une prestation : « de 3 000 € à 7 200 € ».
 *
 * « ET PLUS » QUAND LE HAUT DE GRILLE EST SUR MESURE. « De 6 000 € à 36 000 € »
 * annoncerait un plafond qui n'existe pas : La Plateforme commence à
 * 36 000 €, elle ne s'y arrête pas.
 *
 * `taxe` se place DERRIÈRE LE MONTANT et avant « et plus » : ajoutée par
 * l'appelant en fin de chaîne, elle donnait « 36 000 € et plus HT ».
 */
export const fourchette = (id: PrestationId, taxe = ""): string => {
  const haut = packHaut(id);
  return `de ${prixPack(packEntree(id))} à ${prixPack(haut)}${taxe}${haut.surMesure ? " et plus" : ""}`;
};
