/**
 * Limitation de débit par adresse IP, EN MÉMOIRE.
 *
 * CE QUE ÇA NE FAIT PAS, écrit ici plutôt qu'espéré ailleurs :
 *
 *  1. le compteur vit dans le processus Node. Un redéploiement, un
 *     redémarrage, ou le recyclage d'une fonction sans serveur remettent tout
 *     à zéro : un attaquant qui provoque un redémarrage repart de zéro ;
 *  2. il ne se partage pas entre instances. Derrière deux conteneurs ou sur un
 *     hébergeur qui répartit les requêtes (Vercel, Cloudflare Workers), chaque
 *     instance a SON compteur, donc le plafond réel vaut `maxParFenetre ×
 *     nombre d'instances` ;
 *  3. en développement, le rechargement à chaud de Next peut réévaluer le
 *     module et vider la table.
 *
 * C'est acceptable ICI parce que la limitation n'est pas la défense principale
 * — Turnstile l'est — et que le volume attendu sur le formulaire d'un site
 * vitrine se compte en unités par jour. Le jour où le site tourne sur plusieurs
 * instances, la bonne réponse est le limiteur de l'hébergeur (règle WAF
 * Cloudflare, `rate limit` Vercel), pas un Redis ajouté pour ce seul usage.
 *
 * L'implémentation est une fenêtre glissante : on garde les horodatages des
 * requêtes récentes par clef, et on compte celles qui tombent dans la fenêtre.
 * Plus juste qu'une fenêtre fixe, qui laisse passer deux fois le plafond à
 * cheval sur la frontière.
 */

export interface OptionsLimiteur {
  /** Largeur de la fenêtre glissante, en millisecondes. */
  readonly fenetreMs: number;
  /** Nombre de requêtes autorisées par clef sur la fenêtre. */
  readonly maxParFenetre: number;
  /**
   * Nombre maximal de clefs suivies simultanément.
   *
   * Sans ce plafond, une averse de requêtes depuis des IP usurpées ferait
   * grossir la table sans limite : la limitation de débit deviendrait
   * elle-même le vecteur d'épuisement mémoire. Au-delà, on purge les clefs les
   * plus anciennes.
   */
  readonly maxCles: number;
}

export type ResultatLimite =
  | { readonly autorise: true; readonly restant: number }
  | { readonly autorise: false; readonly reessayerDansS: number };

export interface Limiteur {
  /**
   * @param clef Identifiant d'appelant (adresse IP, ou repli documenté).
   * @param maintenantMs Horloge injectée, pour que les tests ne dorment pas.
   */
  verifier(clef: string, maintenantMs?: number): ResultatLimite;
  /** Nombre de clefs actuellement suivies. Sert aux tests et au diagnostic. */
  taille(): number;
}

export function creerLimiteur(options: OptionsLimiteur): Limiteur {
  const historique = new Map<string, number[]>();

  function purger(maintenantMs: number): void {
    for (const [clef, horodatages] of historique) {
      const recents = horodatages.filter(
        (t) => maintenantMs - t < options.fenetreMs,
      );
      if (recents.length === 0) historique.delete(clef);
      else historique.set(clef, recents);
    }
  }

  return {
    verifier(clef, maintenantMs = Date.now()) {
      const horodatages = historique.get(clef) ?? [];
      const recents = horodatages.filter(
        (t) => maintenantMs - t < options.fenetreMs,
      );

      if (recents.length >= options.maxParFenetre) {
        historique.set(clef, recents);
        // Le plus ancien de la fenêtre libère la place : c'est lui qui donne le
        // délai d'attente honnête, et non la largeur entière de la fenêtre.
        const plusAncien = recents[0] ?? maintenantMs;
        const attenteMs = options.fenetreMs - (maintenantMs - plusAncien);
        return {
          autorise: false,
          reessayerDansS: Math.max(1, Math.ceil(attenteMs / 1000)),
        };
      }

      recents.push(maintenantMs);
      historique.set(clef, recents);

      if (historique.size > options.maxCles) {
        purger(maintenantMs);
        // Purger ne suffit pas si toutes les clefs sont fraîches : on retire
        // alors les plus anciennes dans l'ordre d'insertion (`Map` le conserve).
        while (historique.size > options.maxCles) {
          const premiere = historique.keys().next();
          if (premiere.done) break;
          historique.delete(premiere.value);
        }
      }

      return {
        autorise: true,
        restant: options.maxParFenetre - recents.length,
      };
    },
    taille() {
      return historique.size;
    },
  };
}

/**
 * Réglage du formulaire : 5 envois par quart d'heure et par IP.
 *
 * Assez large pour qu'un prospect qui se trompe d'adresse et recommence ne soit
 * jamais bloqué, assez serré pour qu'un robot ne remplisse pas la boîte.
 */
export const LIMITE_CONTACT: OptionsLimiteur = {
  fenetreMs: 15 * 60 * 1000,
  maxParFenetre: 5,
  maxCles: 5_000,
};

/**
 * Extrait l'adresse d'appel des en-têtes d'une requête.
 *
 * `x-forwarded-for` est une LISTE : le client réel est le PREMIER élément, les
 * suivants sont les mandataires traversés. Prendre le dernier (erreur courante)
 * revient à limiter le proxy et non l'appelant.
 *
 * L'en-tête est falsifiable par nature. Il n'est digne de confiance que si le
 * site est servi derrière un mandataire qui le réécrit (Vercel, Cloudflare,
 * Nginx correctement configuré) — c'est le cas visé en production. En local, il
 * est absent : le repli renvoie une clef unique et partagée, ce qui fait que
 * TOUS les appelants comptent ensemble. C'est volontaire : mieux vaut trop
 * limiter que pas du tout, et c'est aussi ce qui rend la démonstration du 429
 * possible sur `localhost`.
 */
export function adresseAppelante(entetes: Headers): string {
  const transmis = entetes.get("x-forwarded-for");
  if (transmis) {
    const premier = transmis.split(",")[0]?.trim();
    if (premier) return premier;
  }
  const reel = entetes.get("x-real-ip")?.trim();
  if (reel) return reel;
  return "sans-adresse";
}
