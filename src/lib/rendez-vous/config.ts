/**
 * Résolution de la configuration Cal.com, depuis l'environnement.
 *
 * CE MODULE EST PUR : `process.env` n'est lu que par le paramètre par défaut,
 * jamais au chargement. Les tests injectent leur propre table, et poser une
 * variable en développement ne demande qu'un redémarrage du serveur, sans
 * raisonnement sur l'ordre d'évaluation des modules.
 *
 * ABSENCE DE CONFIGURATION = BLOC MASQUÉ, JAMAIS DE PANNE. Le dépôt ne contient
 * pas le compte Cal.com d'Eliott : sans variables, `typesDisponibles` est vide,
 * la section ne se rend pas du tout et les deux routes répondent 503 avec un
 * message honnête. C'est l'état par défaut du dépôt, et il est testé.
 *
 * DEUX FAÇONS DE DÉSIGNER UN TYPE D'ÉVÉNEMENT, parce que Cal.com en accepte
 * deux et que l'une des deux est nettement plus facile à recopier :
 *
 *   - un IDENTIFIANT numérique (`1234567`), qui se suffit à lui-même ;
 *   - un SLUG (`site-20min`), qui exige `CAL_COM_USERNAME` en plus.
 *
 * Le slug est celui qu'on lit dans l'URL publique (`cal.com/<user>/<slug>`),
 * donc celui qu'Eliott aura sous les yeux. L'identifiant, lui, ne bouge pas
 * quand on renomme l'événement. Les deux sont acceptés, type par type.
 */
import { IDS_RENDEZ_VOUS } from "@/content/rendez-vous";
import type { IdRendezVous } from "@/content/rendez-vous";

/** Désignation d'un type d'événement Cal.com, sous l'une de ses deux formes. */
export type CibleEvenement =
  | { readonly par: "id"; readonly eventTypeId: number }
  | {
      readonly par: "slug";
      readonly eventTypeSlug: string;
      readonly username: string;
    };

/** Nom de la variable d'environnement portant chaque type de rendez-vous. */
export const VARIABLES_EVENEMENT: Readonly<Record<IdRendezVous, string>> = {
  site: "CAL_COM_EVENT_SITE",
  outil: "CAL_COM_EVENT_OUTIL",
  logiciel: "CAL_COM_EVENT_LOGICIEL",
  decouverte: "CAL_COM_EVENT_DECOUVERTE",
};

export interface ConfigurationRendezVous {
  /** Cibles résolues, type par type. Une entrée absente = type non configuré. */
  readonly cibles: Readonly<Partial<Record<IdRendezVous, CibleEvenement>>>;
  /** Types réellement réservables, dans l'ordre d'affichage du contenu. */
  readonly typesDisponibles: readonly IdRendezVous[];
}

/** Table d'environnement, réduite à ce qui nous intéresse. */
export type Environnement = Readonly<Record<string, string | undefined>>;

function lire(env: Environnement, clef: string): string {
  return (env[clef] ?? "").trim();
}

/**
 * Résout une seule cible.
 *
 * `undefined` couvre les trois cas d'absence : variable vide, slug sans nom
 * d'utilisateur, et valeur numérique invalide (zéro, négative, décimale). Aucun
 * d'eux n'est une erreur bloquante : le type disparaît simplement du sélecteur.
 */
export function resoudreCible(
  id: IdRendezVous,
  env: Environnement,
): CibleEvenement | undefined {
  const valeur = lire(env, VARIABLES_EVENEMENT[id]);
  if (valeur.length === 0) return undefined;

  // Un identifiant Cal.com est un entier positif. `Number("12abc")` vaut NaN,
  // mais `Number(" 12 ")` vaut 12 : la valeur est déjà rognée plus haut, et le
  // motif ci-dessous refuse tout ce qui n'est pas une suite de chiffres.
  if (/^\d+$/.test(valeur)) {
    const eventTypeId = Number(valeur);
    if (!Number.isSafeInteger(eventTypeId) || eventTypeId <= 0) return undefined;
    return { par: "id", eventTypeId };
  }

  const username = lire(env, "CAL_COM_USERNAME");
  if (username.length === 0) return undefined;
  return { par: "slug", eventTypeSlug: valeur, username };
}

export function resoudreConfiguration(
  env: Environnement = process.env,
): ConfigurationRendezVous {
  const cibles: Partial<Record<IdRendezVous, CibleEvenement>> = {};
  const typesDisponibles: IdRendezVous[] = [];

  for (const id of IDS_RENDEZ_VOUS) {
    const cible = resoudreCible(id, env);
    if (cible) {
      cibles[id] = cible;
      typesDisponibles.push(id);
    }
  }

  return { cibles, typesDisponibles };
}

/** Vrai quand la chaîne reçue du client désigne un type connu du contenu. */
export function estIdRendezVous(valeur: unknown): valeur is IdRendezVous {
  return (
    typeof valeur === "string" &&
    (IDS_RENDEZ_VOUS as readonly string[]).includes(valeur)
  );
}
