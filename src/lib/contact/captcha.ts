/**
 * Vérification du jeton anti-robot, derrière une interface.
 *
 * ARBITRAGE (2026-08-28). Le fournisseur retenu est **Cloudflare Turnstile**,
 * pas reCAPTCHA v3, et la raison est de conformité plus que technique : le site
 * publie par ailleurs une bannière de consentement soignée, et reCAPTCHA v3
 * charge un script Google sur chaque page portant un formulaire, dépose des
 * cookies et transmet des signaux comportementaux à Google. C'est un traceur
 * tiers non exempté : il faudrait le soumettre au consentement, sur un
 * formulaire de contact où refuser le consentement rendrait le formulaire
 * inutilisable. Turnstile rend le même service (score de risque, invisible par
 * défaut, épreuve interactive seulement au besoin), gratuit, sans cookie de
 * suivi ni profilage publicitaire.
 *
 * L'INTERFACE EXISTE POUR QUE CE CHOIX RESTE RÉVERSIBLE. Basculer sur reCAPTCHA
 * v3 revient à écrire un second `VerificateurCaptcha` (une trentaine de lignes,
 * même forme de requête, un `score` à comparer à un seuil en plus) et à changer
 * la ligne de `resoudreVerificateur`. Rien d'autre dans le projet ne connaît le
 * fournisseur.
 *
 * ABSENCE DE CLEF = REFUS EXPLICITE, jamais un laissez-passer. Un formulaire
 * qui accepte tout parce qu'une variable d'environnement manque est le pire des
 * deux mondes : il a l'air protégé et ne l'est pas.
 */

/** Issue d'une vérification. Le détail reste au serveur. */
export type ResultatCaptcha =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /**
       * `non_configure` : clefs absentes, le service refuse de servir.
       * `jeton_absent` : le client n'a envoyé aucun jeton.
       * `jeton_refuse` : Cloudflare a répondu « non ».
       * `indisponible` : le fournisseur n'a pas répondu (réseau, panne).
       */
      readonly raison: "non_configure" | "jeton_absent" | "jeton_refuse" | "indisponible";
      /** Codes bruts du fournisseur, pour le journal serveur uniquement. */
      readonly codes?: readonly string[];
    };

export interface VerificateurCaptcha {
  /** Nom du fournisseur, journalisé au démarrage et en cas d'erreur. */
  readonly nom: string;
  verifier(jeton: string | undefined, adresse: string | undefined): Promise<ResultatCaptcha>;
}

const URL_TURNSTILE =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Forme utile de la réponse Cloudflare. Le reste est ignoré. */
interface ReponseTurnstile {
  success: boolean;
  "error-codes"?: string[];
}

function litReponseTurnstile(charge: unknown): ReponseTurnstile | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const objet = charge as Record<string, unknown>;
  if (typeof objet.success !== "boolean") return undefined;
  const codes = objet["error-codes"];
  return {
    success: objet.success,
    "error-codes": Array.isArray(codes)
      ? codes.filter((c): c is string => typeof c === "string")
      : undefined,
  };
}

export function creerVerificateurTurnstile(
  cleSecrete: string,
): VerificateurCaptcha {
  return {
    nom: "turnstile",
    async verifier(jeton, adresse) {
      if (!jeton || jeton.trim().length === 0) {
        return { ok: false, raison: "jeton_absent" };
      }

      const corps = new FormData();
      corps.append("secret", cleSecrete);
      corps.append("response", jeton);
      // L'adresse aide Cloudflare à noter la requête. Omise si inconnue :
      // envoyer notre repli `sans-adresse` ferait échouer la vérification.
      if (adresse && adresse !== "sans-adresse") {
        corps.append("remoteip", adresse);
      }

      try {
        const reponse = await fetch(URL_TURNSTILE, {
          method: "POST",
          body: corps,
          // Sans délai maximal, une panne réseau chez Cloudflare tiendrait la
          // requête ouverte jusqu'au délai de la plateforme (souvent 30 s) et
          // le prospect regarderait un bouton qui tourne.
          signal: AbortSignal.timeout(8_000),
        });
        if (!reponse.ok) {
          return { ok: false, raison: "indisponible", codes: [String(reponse.status)] };
        }
        const analyse = litReponseTurnstile(await reponse.json());
        if (!analyse) return { ok: false, raison: "indisponible" };
        if (analyse.success) return { ok: true };
        return {
          ok: false,
          raison: "jeton_refuse",
          codes: analyse["error-codes"],
        };
      } catch {
        return { ok: false, raison: "indisponible" };
      }
    },
  };
}

/**
 * Vérificateur de repli quand aucune clef n'est configurée.
 *
 * Il refuse TOUT. La route traduit ce refus en 503 et en un message honnête
 * (« le formulaire est momentanément indisponible, écrivez-moi directement »),
 * ce qui est la seule sortie acceptable : la solution alternative, laisser
 * passer, ouvre la boîte d'Eliott à n'importe quel robot le jour où une
 * variable d'environnement saute au déploiement.
 */
export const VERIFICATEUR_ABSENT: VerificateurCaptcha = {
  nom: "aucun",
  async verifier() {
    return { ok: false, raison: "non_configure" };
  },
};

/**
 * Choisit le vérificateur à partir de l'environnement.
 *
 * Lu à chaque appel et non au chargement du module : en développement, poser la
 * clef puis relancer le serveur suffit, sans avoir à raisonner sur l'ordre
 * d'évaluation des modules.
 */
export function resoudreVerificateur(): VerificateurCaptcha {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return VERIFICATEUR_ABSENT;
  return creerVerificateurTurnstile(secret);
}
