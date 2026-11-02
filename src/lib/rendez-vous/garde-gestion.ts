/**
 * Contrôles communs aux routes `/api/rendez-vous/gestion/[jeton]/*`, dans le
 * même ordre que `/api/rendez-vous`, du moins cher au plus cher : origine →
 * type de contenu (écritures) → débit → format du jeton → configuration.
 *
 * PAS DE CAPTCHA ICI : le jeton de gestion (256 bits, reçu par e-mail) est la
 * preuve. Un robot qui ne l'a pas ne peut rien viser.
 */
import { siteConfig } from "@/content/site";
import { empreinte, json, origineEtrangere } from "@/lib/api/reponse";
import { EMAIL_CONTACT_PAR_DEFAUT } from "@/lib/contact/mailer";
import { adresseAppelante } from "@/lib/contact/rate-limit";
import type { Limiteur } from "@/lib/contact/rate-limit";
import { estJetonGestion } from "./cockpit";
import { resoudreAcces } from "./config";

const EMAIL_CONTACT = siteConfig.contact.email || EMAIL_CONTACT_PAR_DEFAUT;

/** Repli affiché quand l'opération ne peut pas aboutir. */
export const REPLI_GESTION = `Écrivez-moi directement à ${EMAIL_CONTACT}.`;


export type Garde =
  | { readonly ok: true; readonly jeton: string; readonly appelant: string }
  | { readonly ok: false; readonly reponse: Response };

export function garderGestion(
  requete: Request,
  jeton: string,
  limiteur: Limiteur,
  ecriture: boolean,
): Garde {
  if (origineEtrangere(requete)) {
    return { ok: false, reponse: json({ message: "Requête refusée." }, 403) };
  }
  if (ecriture) {
    const typeContenu = requete.headers.get("content-type") ?? "";
    if (!typeContenu.toLowerCase().includes("application/json")) {
      return { ok: false, reponse: json({ message: "Requête refusée." }, 415) };
    }
  }
  const adresse = adresseAppelante(requete.headers);
  const limite = limiteur.verifier(adresse);
  if (!limite.autorise) {
    return {
      ok: false,
      reponse: json({ message: "Trop de demandes. Réessayez dans quelques minutes." }, 429, {
        "retry-after": String(limite.reessayerDansS),
      }),
    };
  }
  if (!estJetonGestion(jeton)) {
    return { ok: false, reponse: json({ message: "Ce lien ne correspond à aucun rendez-vous." }, 404) };
  }
  if (!resoudreAcces()) {
    return {
      ok: false,
      reponse: json(
        { message: `La gestion en ligne est momentanément indisponible. ${REPLI_GESTION}` },
        503,
      ),
    };
  }
  return { ok: true, jeton, appelant: empreinte(adresse) };
}
