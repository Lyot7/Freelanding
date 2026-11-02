/**
 * Masquage des secrets portés par une URL, avant tout envoi à la mesure
 * d'audience.
 *
 * LE JETON DE GESTION D'UN RENDEZ-VOUS EST DANS L'URL (`/rdv/gerer/<jeton>`,
 * et `/api/rendez-vous/gestion/<jeton>/…` pour les appels de la page) : 32
 * octets qui suffisent à annuler ou déplacer le rendez-vous. Il ne doit jamais
 * partir chez PostHog, ni dans `page_path`, ni dans `$current_url`, ni dans un
 * champ que le SDK remplit seul (`$pathname`, `$referrer`, réseau du rejeu),
 * ni dans une CLÉ d'objet (`$heatmap_data` est indexé par l'URL). Le segment
 * est remplacé par `[jeton]` : la page reste comptée, sans le secret.
 */

import { pageTypeFromPathname, slugFromPathname } from "./events";

const MOTIF_JETON = /((?:\/|%2F)(?:rdv(?:\/|%2F)gerer|rendez-vous(?:\/|%2F)gestion)(?:\/|%2F))[\w-]{43}/gi;
/** Repère bon marché : sans lui, aucun événement n'est recopié. */
const REPERE = /(rdv|rendez-vous)(\/|%2F)(gerer|gestion)/i;
const REMPLACEMENT = "$1[jeton]";

/** Une chaîne d'URL ou de chemin, jeton masqué. */
export function masquerChemin(valeur: string): string {
  return valeur.replace(MOTIF_JETON, REMPLACEMENT);
}

function masquerValeur(valeur: unknown): unknown {
  if (typeof valeur === "string") return masquerChemin(valeur);
  if (Array.isArray(valeur)) return valeur.map(masquerValeur);
  if (typeof valeur === "object" && valeur !== null) {
    const copie: Record<string, unknown> = {};
    for (const [clef, sous] of Object.entries(valeur)) {
      copie[masquerChemin(clef)] = masquerValeur(sous);
    }
    return copie;
  }
  return valeur;
}

/**
 * Un événement entier, jeton masqué dans chaque chaîne, à toute profondeur.
 *
 * L'événement n'est recopié que s'il contient le chemin : la quasi-totalité
 * des envois (et les gros lots du rejeu) repartent tels quels.
 */
export function masquerJetons<T>(evenement: T): T {
  let texte: string;
  try {
    texte = JSON.stringify(evenement) ?? "";
  } catch {
    return evenement;
  }
  if (!REPERE.test(texte)) return evenement;
  // Même forme, mêmes clefs : seules des chaînes ont changé.
  return masquerValeur(evenement) as T;
}

/**
 * Propriétés communes aux événements d'une page, calculées sur le chemin
 * MASQUÉ : le type, le chemin, le dernier segment et l'URL complète.
 */
export function proprietesDePage(pathname: string, href: string) {
  const chemin = masquerChemin(pathname);
  return {
    base: {
      page_type: pageTypeFromPathname(chemin),
      page_path: chemin,
      content_slug: slugFromPathname(chemin),
    },
    url: masquerChemin(href),
  };
}
