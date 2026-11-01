/**
 * Ajustement d'un titre à la largeur de son cadre, LIGNE PAR LIGNE.
 *
 * LE DÉFAUT QUE CE MODULE RÈGLE. `TitleFitText` (AboutSection) portait le nom du
 * composant Framer « fit text » sans en faire le travail : il découpait le titre
 * un mot par ligne et posait une taille FIXE (52 / 68 / 92 px selon le point
 * d'arrêt). Rien n'était ajusté à quoi que ce soit. Conséquence mesurée le
 * 2026-09-01 sur `/` : « logiciels. » occupait 327,9 px des 341 disponibles au
 * point d'arrêt tablette, soit 96 % du cadre pour DIX caractères. Le titre était
 * donc borné à des mots de neuf caractères, ce qui interdit mécaniquement toute
 * phrase — un h1 qui dit le métier, la cible et la zone en fait vingt fois plus.
 *
 * LE CHEMIN RETENU : CSS PUR. La taille de chaque ligne s'écrit
 *
 *     font-size: min(var(--plafond), calc(100cqw / facteur))
 *
 * dans un cadre passé en `container-type: inline-size`. `facteur` est le nombre
 * de fois que la ligne tient dans son propre corps, calculé ICI à partir des
 * chasses réelles de la police. Aucun JavaScript au rendu, donc aucun risque
 * d'écart entre le HTML du serveur et celui du client, aucun saut au chargement,
 * aucun écouteur de redimensionnement, et rien à désarmer sous
 * `prefers-reduced-motion`.
 *
 * POURQUOI PAS UNE MOYENNE DE CHASSE, la solution habituelle en CSS pur. Elle
 * revient à écrire `calc(100cqw / (nombre-de-caractères * k))`. MESURÉ dans
 * Geist 600 : « I » vaut 0,290 em et « W » 0,991, soit un rapport de 3,4. Une
 * ligne de « COMMANDE » demande 0,709 em par caractère quand « SITES, » en
 * demande 0,447 : à `k` constant, l'une déborde de 30 % ou l'autre est rendue
 * 30 % trop petite. Une table de chasses coûte trente lignes de données et
 * supprime l'approximation.
 *
 * D'OÙ VIENNENT LES CHIFFRES. Relevés au canvas le 2026-09-01 sur le site lui-
 * même, `600 1000px Geist` (la famille servie par `src/app/fonts.css`), largeur
 * d'avance divisée par le corps. Ils sont donc en em et valent pour toutes les
 * tailles.
 *
 * CE QUE LE MODÈLE IGNORE, ET POURQUOI CE N'EST PAS GRAVE. Une somme d'avances
 * ne voit pas le crénage. Contrôle sur les six lignes du titre de l'accueil,
 * chaîne entière mesurée au canvas contre somme des avances : le crénage retire
 * de 0,8 % à 2,8 % de la largeur. L'erreur va donc TOUJOURS dans le sens sûr —
 * le modèle surestime la largeur, la taille calculée est un peu plus petite que
 * la taille qui remplirait exactement, et la ligne ne déborde jamais.
 */

/**
 * Chasse des glyphes de Geist en graisse 600, en em.
 *
 * Seules les CAPITALES sont listées : les titres concernés portent tous
 * `text-transform: uppercase`, et `facteurDeChasse` met la ligne en capitales
 * avant de la mesurer. Les bas de casse n'apparaîtraient donc jamais.
 */
const CHASSE_GEIST_600: Readonly<Record<string, number>> = {
  A: 0.709, B: 0.695, C: 0.724, D: 0.708, E: 0.615, F: 0.6, G: 0.726,
  H: 0.719, I: 0.29, J: 0.617, K: 0.672, L: 0.586, M: 0.902, N: 0.748,
  O: 0.763, P: 0.664, Q: 0.757, R: 0.689, S: 0.668, T: 0.584, U: 0.699,
  V: 0.709, W: 0.991, X: 0.66, Y: 0.613, Z: 0.577,
  À: 0.709, Â: 0.709, Ä: 0.709, Ç: 0.724, É: 0.615, È: 0.615, Ê: 0.615,
  Ë: 0.615, Î: 0.29, Ï: 0.29, Ô: 0.763, Ö: 0.763, Ù: 0.699, Û: 0.699,
  Ü: 0.699, Ÿ: 0.71, Œ: 1.109, Æ: 1.019,
  "0": 0.683, "1": 0.427, "2": 0.642, "3": 0.637, "4": 0.643, "5": 0.656,
  "6": 0.615, "7": 0.538, "8": 0.644, "9": 0.618,
  // Espace ordinaire, insécable et insécable fine : la typographie française
  // du site emploie les trois (cf. `scripts/typo-fr.mjs`) et elles ont la même
  // chasse dans Geist.
  " ": 0.236, "\u00A0": 0.236, "\u202F": 0.236,
  ".": 0.225, ",": 0.225, ";": 0.306, ":": 0.306, "!": 0.243, "?": 0.581,
  "«": 0.607, "»": 0.616, "'": 0.195, "’": 0.232, '"': 0.376,
  "(": 0.306, ")": 0.306, "[": 0.375, "]": 0.375, "{": 0.401, "}": 0.401,
  "/": 0.508, "\\": 0.485, "-": 0.418, "–": 0.594, "—": 0.91,
  "&": 0.677, "+": 0.566, "%": 0.818, "°": 0.42, "€": 0.752, "@": 0.944,
  "#": 0.552, "*": 0.424,
};

/**
 * Chasse retenue pour un glyphe absent de la table : celle du « W », le plus
 * large de la fonte. Un caractère inconnu rend donc la ligne un peu plus petite
 * que nécessaire ; il ne la fait jamais déborder. Le sens de l'erreur est le
 * seul choix qui compte ici.
 */
const CHASSE_INCONNUE = 0.991;

/**
 * Interlettrage des grands titres, en em, tel que la classe
 * `tracking-[-0.05em]` le pose. Il s'applique APRÈS CHAQUE caractère, dernier
 * compris — vérifié au rendu : « SITES, » mesure 246,9 px à 92 px de corps, soit
 * exactement (2,984 − 6 × 0,05) × 92.
 */
export const APPROCHE_TITRE = 0.05;

/**
 * Combien de fois la ligne tient dans son propre corps, interlettrage compris.
 *
 * `largeur_rendue = facteur × taille_de_police`. La taille qui remplit un cadre
 * de `L` pixels est donc `L / facteur`, ce que le CSS écrit `100cqw / facteur`.
 *
 * Le plancher à 0,1 protège la division du cas d'une ligne vide ou d'un
 * interlettrage qui mangerait toute la chasse : une taille absurde vaut mieux
 * qu'une déclaration CSS invalide, qui rendrait la ligne à la taille héritée et
 * la ferait déborder sans rien signaler.
 */
export function facteurDeChasse(ligne: string, approche = APPROCHE_TITRE): number {
  const capitales = ligne.toUpperCase();
  let total = 0;
  for (const glyphe of capitales) {
    total += (CHASSE_GEIST_600[glyphe] ?? CHASSE_INCONNUE) - approche;
  }
  return Math.max(total, 0.1);
}

/**
 * Taille de corps qu'une ligne prendra dans un cadre de `largeur` pixels, sous
 * un plafond. Le rendu ne s'en sert pas — c'est le CSS qui calcule — mais les
 * tests et les relevés en ont besoin pour prédire une largeur sans navigateur.
 */
export function tailleAjustee(
  ligne: string,
  largeur: number,
  plafond: number,
  approche = APPROCHE_TITRE,
): number {
  return Math.min(plafond, largeur / facteurDeChasse(ligne, approche));
}

/**
 * Largeur rendue d'une ligne, en pixels, à une taille de corps donnée.
 * Majorant : le crénage la resserre encore de 1 à 3 %.
 */
export function largeurRendue(
  ligne: string,
  taille: number,
  approche = APPROCHE_TITRE,
): number {
  return facteurDeChasse(ligne, approche) * taille;
}

/* ============================================================
   COLLISION D'ENCRE ENTRE DEUX LIGNES — le défaut que l'ajustement a créé.

   Tant que les lignes du titre étaient RAGUÉES (un mot par ligne, alignées à
   droite, largeurs très inégales), la virgule d'une ligne tombait dans le vide
   laissé par la ligne du dessous : le recouvrement existait déjà, personne ne le
   voyait. Une fois chaque ligne ajustée à la largeur du cadre, il n'y a plus de
   vide — sous chaque virgule il y a une lettre. MESURÉ au premier rendu, à
   `leading-[0.82em]` et 1440 px : la virgule de « SITES, » descendait 5,1 px
   DANS les capitales de « LOGICIELS », qui se lisait « LOGICIEĽS ».

   C'EST UN AUTRE DÉFAUT QUE CELUI QUE GARDENT `accent-room` ET
   `descender-room`. Ces deux-là empêchent le masque de COUPER l'encre ; ils
   l'autorisent au contraire à sortir de la boîte de ligne. Ce qui suit règle où
   cette encre ATTERRIT. L'un ouvre la fenêtre, l'autre écarte les voisins.

   LE SEUL LEVIER EST L'INTERLIGNE. Deux lignes de même corps laissent, entre
   l'encre basse de l'une et l'encre haute de l'autre, exactement
   `interligne − montée − descente` : les termes de position de la ligne de base
   s'annulent. Avec une capitale accentuée en tête de la ligne du bas
   (montée 0,910em) et rien qui descende au-dessus, il faut donc un interligne
   supérieur à 0,910em, quelle que soit la taille. `leading-[0.82em]`, la valeur
   du template anglais, ne pouvait pas y suffire : ce template n'accentue rien.

   VALEUR RETENUE : 0,95em, soit 0,910 pour l'encre d'un « É » plus les 4 % de
   corps de marge qu'exige `scripts/accent-clip-audit.mjs`. Jeu minimal mesuré
   sur le titre de l'accueil aux trois cadres : 1,4 px. À 0,82em il valait
   −5,1 px, à 0,90em −0,2 px.
   ============================================================ */

/** Montée et descente de la police Geist, en em (cf. `globals.css`). */
const MONTEE_POLICE = 1.01;
const DESCENTE_POLICE = 0.29;

/** Encre sous la ligne de base, en em, par glyphe. Tout le reste vaut 0. */
const DESCENTE_ENCRE: Readonly<Record<string, number>> = {
  ",": 0.158, ";": 0.158, "(": 0.11, ")": 0.11, "Ç": 0.228,
};

/** Encre au-dessus de la ligne de base, en em : capitale accentuée ou non. */
const MONTEE_CAPITALE_ACCENTUEE = 0.91;
const MONTEE_CAPITALE = 0.71;

/** Interligne des titres ajustés. Voir l'encadré ci-dessus pour la valeur. */
export const INTERLIGNE_TITRE = 0.95;

function monteeEncre(ligne: string): number {
  return /[ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/.test(ligne.toUpperCase())
    ? MONTEE_CAPITALE_ACCENTUEE
    : MONTEE_CAPITALE;
}

function descenteEncre(ligne: string): number {
  let creux = 0;
  for (const glyphe of ligne.toUpperCase()) {
    creux = Math.max(creux, DESCENTE_ENCRE[glyphe] ?? 0);
  }
  return creux;
}

/**
 * Espace vertical, en pixels, entre l'encre la plus basse de `haut` et l'encre
 * la plus haute de `bas`. Négatif = les deux lignes se chevauchent.
 */
export function jeuEntreLignes(
  haut: string,
  tailleHaut: number,
  bas: string,
  tailleBas: number,
  interligne = INTERLIGNE_TITRE,
): number {
  // Position de la ligne de base dans sa boîte : la zone de contenu de la
  // police (montée + descente) est centrée dans la boîte de ligne.
  const ligneDeBase =
    (interligne - (MONTEE_POLICE + DESCENTE_POLICE)) / 2 + MONTEE_POLICE;
  const encreBasse = (ligneDeBase + descenteEncre(haut)) * tailleHaut;
  const encreHaute =
    interligne * tailleHaut + (ligneDeBase - monteeEncre(bas)) * tailleBas;
  return encreHaute - encreBasse;
}
