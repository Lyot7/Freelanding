/**
 * Validation SERVEUR des soumissions de formulaire.
 *
 * Écrite à la main, sans bibliothèque. Le projet n'en embarquait aucune, et le
 * besoin tient en quatre types de champs (chaîne bornée, e-mail, valeur prise
 * dans une liste, entier). Ajouter Zod ou Valibot pour ça aurait coûté une
 * dépendance, un fichier de schémas et une surface de mise à jour, pour une
 * logique qui tient ici en un fichier lisible et testé.
 *
 * CE MODULE EST PUR. Aucun accès au réseau, à l'horloge globale ou à
 * `process.env` : `maintenantMs` et `typesProjetAutorises` sont injectés par
 * l'appelant. C'est ce qui rend `src/lib/contact/validation.test.mjs` possible
 * sans démarrer Next.
 *
 * La validation CLIENT (attributs `required`, `type="email"`) n'est qu'un
 * confort d'interface : elle ne protège rien, un `curl` la contourne en une
 * ligne. Tout ce qui compte se décide ici.
 */

/** Intentions distinctes portées par les trois formulaires du site. */
export const INTENTIONS = ["projet", "footer", "newsletter"] as const;

export type Intention = (typeof INTENTIONS)[number];

/** Soumission acceptée, normalisée, prête à être mise en gabarit d'e-mail. */
export interface SoumissionValide {
  readonly intention: Intention;
  /** Absent pour l'intention `newsletter`, qui ne demande que l'adresse. */
  readonly nom?: string;
  readonly email: string;
  /** Absent pour `newsletter`. */
  readonly typeProjet?: string;
  /** Présent pour `projet` seulement, et facultatif même là. */
  readonly message?: string;
}

/**
 * Motif de rejet.
 *
 * Il ne sort JAMAIS tel quel vers le client : la route le traduit en un message
 * générique. `champ_invalide` porte le nom du champ pour que l'interface puisse
 * le surligner, mais le détail (« ce robot a rempli le piège ») reste au
 * serveur, sinon on apprend au robot comment passer.
 */
export type MotifRejet =
  | { readonly type: "corps_illisible" }
  | { readonly type: "intention_inconnue" }
  | { readonly type: "piege_rempli" }
  | { readonly type: "trop_rapide"; readonly delaiMs: number }
  | { readonly type: "horodatage_invalide" }
  | { readonly type: "champ_invalide"; readonly champ: string; readonly raison: string };

export type ResultatValidation =
  | { readonly ok: true; readonly soumission: SoumissionValide }
  | { readonly ok: false; readonly motif: MotifRejet };

/**
 * Délai minimal de remplissage, en millisecondes.
 *
 * Un humain qui lit un libellé, clique dans un champ et tape une adresse ne
 * descend pas sous trois secondes. Un robot qui poste le formulaire dès qu'il
 * l'a analysé y arrive en quelques dizaines de millisecondes.
 *
 * LIMITE ASSUMÉE : l'horodatage de départ vient du client, un robot déterminé
 * peut donc l'antidater. Ce contrôle attrape les robots naïfs — la vraie
 * défense est le jeton Turnstile, qui, lui, est délivré par Cloudflare et
 * vérifié auprès de lui. Le rendre infalsifiable demanderait un jeton signé
 * côté serveur, donc un secret de plus à gérer pour un gain marginal derrière
 * un captcha.
 */
export const DELAI_MINIMAL_MS = 3_000;

/**
 * Âge maximal de l'horodatage de départ (12 h).
 *
 * Borne haute pour refuser un horodatage rejoué ou grossièrement faux (onglet
 * laissé ouvert une semaine, horloge client déréglée, valeur inventée).
 */
export const DELAI_MAXIMAL_MS = 12 * 60 * 60 * 1_000;

export const LIMITES = {
  nom: { min: 2, max: 80 },
  /** 254 = longueur maximale d'une adresse e-mail (RFC 5321). */
  email: { min: 6, max: 254 },
  message: { min: 10, max: 4_000 },
  typeProjet: { max: 120 },
} as const;

/**
 * Reconnaissance d'adresse e-mail, volontairement simple.
 *
 * Une expression « complète » RFC 5322 est illisible, coûteuse et accepte des
 * adresses que plus aucun fournisseur ne délivre. Le seul test qui prouve
 * vraiment qu'une adresse existe est l'envoi lui-même — d'où l'accusé de
 * réception. Ce filtre écarte ce qui ne pourra jamais être routé.
 */
export const MOTIF_EMAIL =
  /^[^\s@,;:<>()[\]\\"]+@[^\s@.,;:<>()[\]\\"]+(\.[^\s@.,;:<>()[\]\\"]+)+$/;

/** Caractères de contrôle et séparateurs de ligne, interdits partout. */
const CARACTERES_CONTROLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function estIntention(valeur: unknown): valeur is Intention {
  return (
    typeof valeur === "string" &&
    (INTENTIONS as readonly string[]).includes(valeur)
  );
}

/**
 * Nettoie une valeur texte AVANT toute vérification de longueur.
 *
 * Retire les caractères de contrôle (dont `\r`, qui sert aux injections
 * d'en-têtes quand la valeur repart dans un `subject` ou un `reply-to`),
 * normalise les fins de ligne et compacte les espaces de bord.
 */
export function normaliserTexte(valeur: string): string {
  return valeur
    .replace(/\r\n?/g, "\n")
    .replace(CARACTERES_CONTROLE, "")
    .trim();
}

/** Comme {@link normaliserTexte}, mais réduit aussi les sauts de ligne. */
function normaliserLigne(valeur: string): string {
  return normaliserTexte(valeur).replace(/\s+/g, " ");
}

function lireChaine(corps: Record<string, unknown>, clef: string): string | undefined {
  const brut = corps[clef];
  return typeof brut === "string" ? brut : undefined;
}

interface OptionsValidation {
  /** Liste blanche des types de projet, lue dans le contenu du site. */
  readonly typesProjetAutorises: readonly string[];
  /** Horloge injectée : les tests n'ont pas à dépendre de `Date.now()`. */
  readonly maintenantMs: number;
}

/**
 * Valide et normalise un corps JSON déjà analysé.
 *
 * @param corps Valeur `unknown` sortie de `JSON.parse` — jamais typée d'office.
 */
export function validerSoumission(
  corps: unknown,
  options: OptionsValidation,
): ResultatValidation {
  if (typeof corps !== "object" || corps === null || Array.isArray(corps)) {
    return { ok: false, motif: { type: "corps_illisible" } };
  }
  const champs = corps as Record<string, unknown>;

  const intention = champs.intention;
  if (!estIntention(intention)) {
    return { ok: false, motif: { type: "intention_inconnue" } };
  }

  // PIÈGE D'ABORD. Inutile de valider quoi que ce soit d'autre si le champ que
  // seul un robot remplit porte une valeur.
  const piege = lireChaine(champs, "referenceInterne");
  if (piege !== undefined && piege.trim().length > 0) {
    return { ok: false, motif: { type: "piege_rempli" } };
  }

  const debutMs = champs.debutMs;
  if (typeof debutMs !== "number" || !Number.isFinite(debutMs)) {
    return { ok: false, motif: { type: "horodatage_invalide" } };
  }
  const delaiMs = options.maintenantMs - debutMs;
  if (delaiMs < 0 || delaiMs > DELAI_MAXIMAL_MS) {
    return { ok: false, motif: { type: "horodatage_invalide" } };
  }
  if (delaiMs < DELAI_MINIMAL_MS) {
    return { ok: false, motif: { type: "trop_rapide", delaiMs } };
  }

  const email = normaliserLigne(lireChaine(champs, "email") ?? "");
  if (email.length < LIMITES.email.min || email.length > LIMITES.email.max) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "email", raison: "longueur" },
    };
  }
  if (!MOTIF_EMAIL.test(email)) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "email", raison: "format" },
    };
  }

  if (intention === "newsletter") {
    return { ok: true, soumission: { intention, email } };
  }

  const nom = normaliserLigne(lireChaine(champs, "nom") ?? "");
  if (nom.length < LIMITES.nom.min || nom.length > LIMITES.nom.max) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "nom", raison: "longueur" },
    };
  }

  const typeProjet = normaliserLigne(lireChaine(champs, "typeProjet") ?? "");
  if (!options.typesProjetAutorises.includes(typeProjet)) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "typeProjet", raison: "hors_liste" },
    };
  }

  if (intention === "footer") {
    return { ok: true, soumission: { intention, nom, email, typeProjet } };
  }

  // Intention « projet » : le message est le seul champ multiligne du site.
  const messageBrut = normaliserTexte(lireChaine(champs, "message") ?? "");
  if (messageBrut.length === 0) {
    return { ok: true, soumission: { intention, nom, email, typeProjet } };
  }
  if (
    messageBrut.length < LIMITES.message.min ||
    messageBrut.length > LIMITES.message.max
  ) {
    return {
      ok: false,
      motif: { type: "champ_invalide", champ: "message", raison: "longueur" },
    };
  }

  return {
    ok: true,
    soumission: { intention, nom, email, typeProjet, message: messageBrut },
  };
}
