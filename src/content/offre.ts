/**
 * L'OFFRE — source unique des prestations, de leurs packs et de leurs prix.
 *
 * TOUT EST CALCULÉ À PARTIR DE DEUX NOMBRES : le taux journalier ci-dessous et
 * le nombre de jours de chaque pack. Aucun prix n'est écrit à la main nulle
 * part sur le site. Changer `TJM` reprice l'intégralité des pages, du JSON-LD
 * et de `/llms.txt` en une ligne.
 *
 * POURQUOI CE FICHIER EXISTE. Les prix vivaient à deux endroits, `services.ts`
 * et `pricing.ts`, et ils ont divergé : l'accordéon annonçait un outil métier à
 * 5 000 € pendant que la grille affichait 5 000 à 15 000 €, à deux écrans
 * d'intervalle. Rien ne le signalait. `offre.test.mjs` empêche le retour de
 * cette classe d'erreur.
 */

/**
 * TAUX JOURNALIER, EN EUROS HT. C'est le seul curseur de prix du site.
 *
 * VALEUR ACTUELLE : 600, le PRIX DE LISTE. Décision d'Eliott du 2026-09-02.
 *
 * CE QUI A CHANGÉ, ET POURQUOI. Le site a servi 500 du 2026-08-27 au
 * 2026-09-02, c'est-à-dire le TARIF DE LANCEMENT. Or le vault, statut actif,
 * en fait autre chose qu'un prix : « une arme de closing gardée en poche,
 * jamais annoncée en premier, jamais affichée nulle part, sortie en fin d'appel
 * quand un prospect bloque sur le prix, et toujours contre une contrepartie :
 * un retour écrit et le droit de citer son nom. »
 *
 * Une remise qu'on affiche est une remise qu'on ne peut plus donner. Elle était
 * publiée sur neuf montants, donc dépensée avant le premier appel, sans rien
 * acheter en échange. Sur les trois premières missions, l'écart entre 500 et
 * 600 représentait 1 500 € abandonnés d'avance.
 *
 * L'ARGUMENT QUI TENAIT L'ÉCART, ET POURQUOI IL NE TIENT PLUS. Le commentaire
 * précédent soutenait que l'écart était sans conséquence parce que « le site
 * n'annonce nulle part qu'il s'agit d'un tarif réduit ». C'est vrai du lecteur
 * et faux du vendeur : le prospect ne sait pas qu'il y a une remise, mais
 * Eliott ne l'a plus sous la main le jour où il en a besoin. Le levier n'existe
 * que s'il reste inconnu ET disponible.
 *
 * QUAND LE CHANGER, et c'est une ligne à modifier, rien d'autre :
 *   - trois missions livrées avec témoignage écrit → 720 (déclencheur du vault)
 *
 * LE TAUX LUI-MÊME NE S'AFFICHE JAMAIS. Il est la règle de construction, pas un
 * argument de vente : l'offre se défend au périmètre. Un test vérifie qu'il
 * n'apparaît en clair nulle part. Il n'est exporté que pour être multiplié.
 */
export const TJM = 600;

/** Identifiants stables des trois prestations chiffrées. */
export type PrestationId = "vitrine" | "outil" | "logiciel";

/** Un pack : un périmètre, un nombre de jours, donc un prix. */
export interface Pack {
  /** Identifiant stable, unique à l'intérieur d'une prestation. */
  readonly id: string;
  /** Nom commercial du pack. */
  readonly nom: string;
  /**
   * Jours ouvrés de travail. TOUJOURS annoncé « environ » côté public : une
   * estimation n'est pas une date, et la date portée au devis garde une marge
   * au-dessus de ce nombre. Règle posée par Eliott le 2026-08-27, cohérente
   * avec l'article « Le devis disait huit semaines ».
   */
  readonly jours: number;
  /** Une phrase : ce que le client obtient, pas ce que je fais. */
  readonly promesse: string;
  /** Le cas de figure qui doit faire choisir ce pack plutôt qu'un autre. */
  readonly pourQui: string;
  /**
   * Ce que le pack ajoute AU PRÉCÉDENT. Le premier liste tout ; les suivants ne
   * listent que le delta, et la page affiche « tout le pack précédent, plus ».
   * Écrire trois listes complètes ferait relire trois fois la même chose et
   * masquerait précisément ce qui justifie l'écart de prix.
   */
  readonly ajoute: readonly string[];
}

/** Une prestation vendable : un nom, une page dédiée, trois packs. */
export interface Prestation {
  readonly id: PrestationId;
  readonly nom: string;
  /** Segment d'URL de sa page dédiée, sous `/services/`. */
  readonly slug: string;
  /** Une phrase, affichée en tête de la page dédiée et dans l'accordéon. */
  readonly resume: string;
  /** Ce qui fait sortir du chiffrage par pack, vers le devis sur mesure. */
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
 * normale sans que rien ne le signale, et tous les prix du site sont alors
 * devenus sécables d'un coup. `\u00A0` se voit.
 *
 * `\s` couvre l'insécable étroite (U+202F) que `toLocaleString` produit selon
 * la version d'ICU, aussi bien que l'insécable ordinaire des versions plus
 * anciennes : les deux sont ramenées à U+00A0.
 */
export function euros(montant: number): string {
  return `${montant.toLocaleString("fr-FR").replace(/\s/gu, "\u00A0")}\u00A0\u20AC`;
}

/*
 * LES DURÉES, ET D'OÙ ELLES VIENNENT.
 *
 * PLANCHER À CINQ JOURS OUVRÉS, ramené de dix le 2026-08-27 après le rapport de
 * marché. La médiane d'un site vitrine en France est de 3 500 € sur 380 budgets
 * réels, le budget médian d'une TPE de 4 000 €, et les agences qui publient
 * leurs prix affichent 890 à 2 490 €. Un plancher à dix jours plaçait l'entrée
 * de gamme à 5 000 €, c'est-à-dire au-dessus de la médiane du marché pour ce que
 * ce marché considère comme un produit d'entrée. Eliott a tranché : moins de
 * jours et moins cher plutôt qu'un prix que la cible ne peut pas payer.
 *
 * CE QUI NE BAISSE PAS AVEC LE PRIX : le sur-mesure, la performance et le fait
 * que le référencement soit pensé. Ce qui baisse, c'est la PROFONDEUR (nombre de
 * pages, étendue du travail sémantique, instrumentation). C'est une règle
 * d'Eliott, elle est écrite dans les périmètres et elle se vérifie en les
 * lisant : aucun pack ne retire la vitesse ni le sur-mesure.
 *
 * L'ÉCART ENTRE DEUX PACKS EST D'AU MOINS UN QUART DE JOURS EN PLUS. La règle
 * était « au moins cinq jours » ; elle ne tient plus quand le premier pack en
 * fait cinq, où cinq jours de plus voudrait dire doubler. Ce qui compte n'a
 * jamais été l'écart absolu mais le fait que le pack suivant SE VOIE dans le
 * livrable. En proportion, la règle vaut à tous les niveaux d'échelle.
 *
 * TROIS LIGNES, PLUS QUATRE, depuis le 2026-08-27. L'Infrastructure a été
 * absorbée par le troisième périmètre du Logiciel : ce n'était pas une autre
 * prestation, c'était son palier supérieur, et une quatrième colonne obligeait
 * le visiteur à se ranger avant d'avoir compris le rangement.
 *
 * RECALAGE DU LOGICIEL, le 2026-08-27 au soir, sur relevé de marché. Ses trois
 * périmètres étaient à 20, 30 et 40 jours. Les durées réellement publiées par
 * les agences françaises pour le même livrable sont plus longues : premier
 * périmètre 2 à 8 semaines, logiciel complet 6 à 12 semaines, version outillée
 * 2 à 6 mois. À 30 jours, « Le Logiciel complet » promettait en six semaines ce
 * que le marché livre en huit à douze, et le vendait 15 000 € là où la médiane
 * de 184 budgets réels est à 25 000 €. Ce n'était pas un prix agressif, c'était
 * une durée fausse : sous-estimer la durée d'un forfait revient à s'engager sur
 * une date qu'on ne tiendra pas. Corrigé à 20, 40 et 60 jours.
 *
 * LES DEUX AUTRES LIGNES SONT CONFIRMÉES par le même relevé. Le site vitrine
 * tombe à 2 500 € la semaine livrée, exactement le point de convergence des
 * studios français productisés (EID Lab, MVP Express et 5000.dev vendent tous
 * un sprint de deux semaines autour de 5 000 €). L'Outil se range juste sous la
 * valeur centrale des petits outils internes, 10 000 € pour trois à six
 * semaines.
 */
/*
 * CE QUI EST SORTI DES FORFAITS le 2026-09-01, et pourquoi.
 *
 * LA RÈGLE, POSÉE PAR ELIOTT : une promesse qui n'est pas dans son corpus n'a
 * rien à faire dans un périmètre chiffré. Sa peur, mot pour mot : « que le
 * client ne me sorte pas "y'a écrit ça sur le site" alors que j'suis pas au
 * courant ». Un livrable daté ou opposable qui n'a jamais été dit sort du
 * forfait ; il peut revenir en prestation à part, jamais en ligne de périmètre.
 *
 * TROIS LIGNES ONT ÉTÉ TRANCHÉES :
 *
 *  1. « Deux semaines après la mise en ligne, une passe de correction sur ce
 *     que les chiffres montrent ». La passe existe, la date était fausse :
 *     c'est J+7. Corrigée, gardée telle quelle pour le reste.
 *  2. « Un tableau de bord lisible sans être technicien, que vous gardez ».
 *     Sortie de « La Conversion ». Ce qu'Eliott appelle un tableau de bord est
 *     du SUIVI DE TRAFIC (Analytics, PostHog), et c'est « du bonus, une
 *     prestation que je peux délivrer en plus ». Annoncée dans `horsPack`,
 *     sans montant : aucun prix n'existe pour elle.
 *  3. « Votre fiche établissement Google reliée au site et remise d'aplomb ».
 *     Sortie de « La Crédibilité », même statut, même traitement.
 *
 * ET LA MÊME RÈGLE SUR LES DEUX AUTRES PAGES :
 *
 *  - « Une séance de prise en main avec les personnes qui s'en serviront »
 *    quitte « L'Outil supervisé » pour le `horsPack` de L'Outil : la formation
 *    n'est nulle part au corpus.
 *  - « Vos circuits mis à plat par écrit […] dès la première semaine » perd sa
 *    date : le livrable tient, l'échéance n'a jamais été dite.
 *  - « La reprise de vos données existantes, contrôlée ligne à ligne » perd sa
 *    méthode : la reprise est promise, le contrôle ligne à ligne ne l'a pas été.
 *  - « Mentions légales, politique de confidentialité et bandeau cookies »
 *    perd « conformes au RGPD » : c'est une qualification juridique, et elle
 *    n'appartient pas à un développeur.
 *
 * CE QUI RESTE À TRANCHER est listé dans le rapport de la passe, pas ici : ce
 * fichier ne porte que des décisions prises.
 */
/*
 * LE SITE TUTOIE, DEPUIS LE 2026-09-02, et Eliott dit « je ».
 *
 * DÉCISION D'ELIOTT, ses mots : « je suis une personne seule et ça va être mon
 * argument démarquant par rapport aux agences. Donc on garde le tutoiement. Ça
 * fait plus humain. » Le vouvoiement rangeait le site du côté du cabinet qui se
 * présente ; c'est exactement la place qu'occupe le concurrent qu'il vise.
 *
 * CE QUE LA PASSE A CHANGÉ, ET RIEN D'AUTRE : la personne grammaticale et le
 * rythme des phrases qu'elle oblige à réécrire. Aucune promesse, aucun chiffre,
 * aucun délai, aucun livrable n'entre ni ne sort d'un périmètre à cette
 * occasion. Une passe de ton qui fait rentrer un engagement est un échec, pas
 * une amélioration : les huit lignes sorties le 2026-09-01 le sont restées.
 *
 * LE « NOUS » N'EXISTE NULLE PART, et il n'a jamais existé ici : Eliott est
 * seul, donc tout est à la première personne du singulier.
 */
export const prestations: readonly Prestation[] = [
  {
    id: "vitrine",
    nom: "Site vitrine",
    slug: "site-vitrine",
    resume:
      "Une adresse qui dit ce que tu fais, pour qui, et comment te joindre. Écrite et développée sur mesure. Une fois livrée, elle est à toi, sans abonnement pour continuer à l’utiliser.",
    horsPack:
      "Boutique en ligne, espace client, réservation avec paiement : ces fonctions sortent de la vitrine, et je les chiffre avec L’Outil. Un tableau de bord de suivi du trafic et la remise d’aplomb de ta fiche établissement Google ne sont dans aucun périmètre : je les fais en plus, sur devis.",
    packs: [
      {
        id: "essentiel",
        nom: "L’Essentiel",
        jours: 5,
        promesse: "Une adresse en ligne, en quelques jours de travail.",
        pourQui:
          "Tu n’as rien en ligne, ou une page qui date, et il te faut une adresse.",
        ajoute: [
          "1 page longue ou 3 pages courtes, développées sur mesure",
          "Tes textes mis en page, tes photos recadrées et compressées",
          "Un formulaire qui arrive dans ta boîte mail",
          "Vitesse mesurée avant la mise en ligne, mobile et ordinateur",
          "Les bases du référencement posées, indexation vérifiée",
          "Mentions légales, politique de confidentialité et bandeau cookies",
          "Hébergement à ton nom, code dans ton dépôt",
        ],
      },
      {
        id: "credibilite",
        nom: "La Crédibilité",
        jours: 8,
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
        id: "conversion",
        nom: "La Conversion",
        jours: 12,
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
    id: "outil",
    nom: "L’Outil",
    slug: "outil-metier",
    resume:
      "Une fonction qui te manque, branchée sur ce que tu as déjà. Tes données existent quelque part, dans ta boutique, ton logiciel de gestion ou un fichier.",
    horsPack:
      "Quand les données naissent dans l’outil au lieu d’exister ailleurs, je le chiffre avec Le Logiciel. La prise en main de tes équipes n’est dans aucun périmètre : je la fais en plus, sur devis.",
    packs: [
      {
        id: "branchement",
        nom: "Le Branchement",
        jours: 8,
        promesse: "La tâche que tu refais à la main disparaît.",
        pourQui:
          "Une tâche répétitive, un seul outil à relier, une personne s’en sert.",
        ajoute: [
          "La fonction qui te manque, en ligne sur ton hébergement",
          "Le raccordement à l’outil qui porte déjà tes données",
          "Les écrans nécessaires à cette fonction, et rien de plus",
          "Une durée estimée au devis, et un point dès qu’elle bouge",
          "Code source dans ton dépôt, et sa documentation",
        ],
      },
      {
        id: "complet",
        nom: "L’Outil complet",
        jours: 12,
        promesse:
          "Tout ton historique entre dans l’outil dès le premier jour.",
        pourQui:
          "Tu as des années de données à reprendre, et des cas à part.",
        ajoute: [
          "La reprise de ton historique dans l’outil",
          "Les cas particuliers de ton métier traités un par un",
          "Plusieurs écrans, et un droit d’accès par personne",
          "Un export de tout ce que l’outil contient, à tout moment",
        ],
      },
      {
        id: "supervise",
        nom: "L’Outil supervisé",
        jours: 18,
        promesse: "Tu sais qu’il tourne sans avoir à aller voir.",
        pourQui:
          "Tu ne peux pas te permettre de le découvrir en panne le lundi matin.",
        ajoute: [
          "Supervision et alerte quand une opération échoue",
          "Un journal de ce qui est entré et de ce qui est sorti",
          "Sauvegardes vérifiées, procédure de retour en arrière écrite",
        ],
      },
    ],
  },

  {
    id: "logiciel",
    nom: "Le Logiciel",
    slug: "logiciel-metier",
    resume:
      "Un outil métier complet, avec ses écrans, sa base de données et sa mise en production. Les données naissent dedans, et plusieurs personnes s’en servent tous les jours.",
    /*
     * RÉÉCRIT le 2026-08-31. Cette ligne rangeait « la reprise d'un logiciel en
     * place » dans le même sac qu'un existant non documenté, avec pour seule
     * réponse un cadrage facturé à part. C'était faux depuis qu'Eliott a précisé
     * sa ligne de refus : la reprise est possible sur une base JavaScript
     * récente et bien construite, elle est refusée sur PHP et Laravel, et elle
     * commence toujours par un audit du code — lequel est une prestation à part
     * entière, désormais annoncée dans l'accordéon des services.
     */
    horsPack:
      "Un existant non documenté ou plusieurs sociétés à servir : je chiffre le cadrage à part, je te le remets écrit, et il t’appartient. Reprendre un logiciel déjà en place est une autre question : elle se tranche par un audit de son code, et la réponse est non sur PHP et sur Laravel.",
    packs: [
      {
        id: "socle",
        nom: "Le Socle",
        jours: 20,
        promesse:
          "Le métier quitte le tableur partagé pour un outil à lui.",
        pourQui:
          "Un seul système à relier, et une équipe qui a les mêmes droits.",
        ajoute: [
          "Les écrans du quotidien, la base et la mise en production",
          "Le raccordement à ton système existant",
          "Un compte par personne, les mêmes droits pour toute l’équipe",
          "La reprise de tes données existantes",
          "Hébergement à ton nom et code dans ton dépôt",
        ],
      },
      {
        id: "logiciel-complet",
        nom: "Le Logiciel complet",
        jours: 40,
        promesse: "Chacun voit ce qui le concerne, et rien d’autre.",
        pourQui:
          "Plusieurs métiers s’en servent, et chacun a besoin d’écrans différents.",
        ajoute: [
          "Des droits différenciés par rôle, décidés avec toi",
          "Les états et exports pour ta comptabilité et tes clients",
          "Tes circuits mis à plat par écrit : qui fait quoi, et ce qui circule",
          "Tes équipes essaient le logiciel avant qu’il remplace l’ancien",
        ],
      },
      {
        id: "ecosysteme",
        nom: "L’Écosystème",
        jours: 60,
        promesse: "Tes outils se parlent et restent d’accord entre eux.",
        pourQui:
          "Plusieurs systèmes doivent rester d’accord, et un écart silencieux te coûte cher.",
        ajoute: [
          "Le raccordement de tes autres systèmes, dans les deux sens",
          "La règle écrite : qui gagne quand deux sources se contredisent",
          "Supervision, alertes et journal des échanges",
          "Des tableaux de bord que tu définis avec moi",
          "La reprise après incident testée en conditions réelles",
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
 * et 20 % du coût de développement par an, et les prix mensuels affichés vont
 * de 490 à 3 000 €. Le site annonçait « à partir de 50 € », soit 0,6 % par an
 * sur un logiciel à 10 000 € : un chiffre hérité d'un positionnement abandonné,
 * qui aurait empoisonné toutes les négociations de suivi.
 *
 * UNE RÈGLE, PAS UN MONTANT. Écrire un prix de suivi en euros le fige au moment
 * où il est écrit ; l'exprimer en part du projet le fait suivre la grille
 * automatiquement, y compris quand le taux journalier changera.
 *
 * OÙ IL S'AFFICHE, ET OÙ IL NE S'AFFICHE PAS. Dans la FAQ, qui répond à « que se
 * passe-t-il après la mise en ligne ». Jamais sur les pages de prestation, à
 * côté des prix : le vault écrit que l'abonnement de suivi « ne se communique
 * jamais, il se propose après une prestation livrée ». Poser un coût récurrent
 * sous un prix de projet ne fait pas gagner un client, il en fait hésiter un.
 *
 * PLANCHER À 90 € PAR MOIS, arbitré par Eliott le 2026-08-27. Sans lui, 15 % du
 * plus petit périmètre du site vitrine faisaient 31 € par mois, soit moins d'une
 * heure de travail par trimestre : le pourcentage est juste en haut de grille et
 * ne paie rien en bas, parce que le coût fixe d'un suivi ne descend pas avec la
 * taille du projet. Le plancher mord jusqu'à 7 200 € de projet ; au-dessus, c'est
 * le pourcentage qui commande.
 */
export const TAUX_SUIVI = 0.15;

/** Plancher mensuel du suivi, en euros HT. Voir l'en-tête de `TAUX_SUIVI`. */
export const PLANCHER_SUIVI = 90;

/**
 * « 15 % » — le taux, tel qu'il s'écrit dans une phrase.
 *
 * ESPACE FINE INSÉCABLE (U+202F) devant le pourcent, et non l'insécable
 * ordinaire (U+00A0) qui précède l'euro. Ce n'est pas un détail de goût : c'est
 * la convention française, et c'est celle qu'applique `scripts/typo-fr.mjs`. Les
 * deux caractères sont indiscernables à l'écran, donc écrits en échappement.
 */
export const tauxSuivi = (): string =>
  `${Math.round(TAUX_SUIVI * 100)}\u202F%`;

/**
 * Suivi mensuel d'un projet donné, arrondi à l'euro, plancher compris.
 *
 * Le plancher n'est pas une exception au pourcentage : c'est l'autre moitié de
 * la règle. Un suivi a un coût d'existence (veille, mises à jour, sauvegardes
 * vérifiées) qui ne dépend pas de la taille du projet.
 */
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

/** Prix d'un pack, en euros HT. Jamais écrit à la main : toujours calculé. */
export const prixPack = (pack: Pack): string => euros(TJM * pack.jours);

/**
 * Le même prix, en NOMBRE, pour les consommateurs qui n'affichent pas de texte.
 *
 * Les données structurées des pages de prestation en ont besoin : `schema.org`
 * attend un nombre, pas « 12 000 € » avec ses espaces insécables. Reparser la
 * chaîne de `prixPack` aurait marché jusqu'au jour où le format change ; passer
 * par le calcul garde une seule règle. Rien d'autre ne doit exporter le taux.
 */
export const prixPackHT = (pack: Pack): number => TJM * pack.jours;

/**
 * Le pack le moins cher d'une prestation, donc la BORNE BASSE de sa fourchette.
 *
 * Il portait le « dès » de `prixDes()`, retiré le 2026-09-02 avec le passage des
 * en-têtes de l'accordéon à la fourchette entière : un plancher affiché seul ne
 * disait rien du haut de gamme. Il reste la référence à laquelle `offre.test.mjs`
 * confronte la borne basse produite par `fourchette()`.
 */
export const packEntree = (id: PrestationId): Pack =>
  prestation(id).packs.reduce((a, b) => (a.jours <= b.jours ? a : b));

/**
 * « environ 10 jours ouvrés ».
 *
 * L'ADVERBE N'EST PAS UNE PRÉCAUTION DE STYLE. Une estimation donnée avant le
 * cadrage n'est pas une date : la date, elle, est écrite au devis et porte une
 * marge au-dessus de ce nombre. Retirer « environ » transformerait une
 * estimation en engagement, ce qui est exactement l'erreur que le site reproche
 * aux devis des autres.
 */
export const delaiPack = (pack: Pack): string =>
  `environ ${pack.jours} jours ouvrés`;

/** Fourchette publique d'une prestation : « de 5 000 à 10 000 € ». */
export const fourchette = (id: PrestationId): string => {
  const jours = prestation(id).packs.map((p) => p.jours);
  return `de ${euros(TJM * Math.min(...jours))} à ${euros(TJM * Math.max(...jours))}`;
};

/**
 * Une ligne de la matrice comparative : un livrable, et le PREMIER périmètre qui
 * l'apporte.
 *
 * `depuis` est un index de pack, pas un nom : les noms changent, l'ordre non, et
 * c'est l'ordre qui porte le sens (« Le Socle », puis ce qu'il ajoute).
 */
export interface LigneComparee {
  readonly libelle: string;
  /** Index du pack qui introduit la ligne. Les suivants la contiennent tous. */
  readonly depuis: number;
}

/**
 * Les livrables d'une prestation mis à plat, dans l'ordre où ils apparaissent.
 *
 * RIEN N'EST INVENTÉ ICI, ET C'EST TOUT L'INTÉRÊT. La matrice de la section
 * tarifs n'a aucune donnée à elle : elle lit `ajoute`, qui liste déjà le DELTA
 * de chaque pack sur le précédent. Un livrable introduit par le deuxième pack
 * est donc coché sur le deuxième et sur le troisième, jamais sur le premier.
 * Écrire cette matrice à la main aurait rouvert exactement la porte que
 * `offre.ts` a fermée : une deuxième source de vérité sur ce que contient un
 * périmètre.
 */
export const lignesComparees = (id: PrestationId): readonly LigneComparee[] =>
  prestation(id).packs.flatMap((pack, index) =>
    pack.ajoute.map((libelle) => ({ libelle, depuis: index })),
  );

/**
 * Ce périmètre contient-il cette ligne ?
 *
 * LES PÉRIMÈTRES SONT CUMULATIFS, c'est la règle posée par `ajoute` et rendue
 * lisible par « tout le pack précédent, plus ». La comparaison est donc un
 * `>=`, jamais une égalité : un livrable du premier pack est dans les trois.
 */
export const packContient = (ligne: LigneComparee, indexPack: number): boolean =>
  indexPack >= ligne.depuis;
