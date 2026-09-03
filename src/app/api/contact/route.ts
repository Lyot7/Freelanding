/**
 * `POST /api/contact` — seule sortie des trois formulaires du site.
 *
 * CE QUI EXISTAIT AVANT. Rien. Les trois formulaires n’avaient ni `action`, ni
 * `onSubmit`, ni action serveur, et celui de `/contact` était en `method="get"` :
 * soumettre rechargeait la page avec le nom, l’adresse et le message du
 * prospect DANS L’URL. Les données personnelles finissaient dans l’historique
 * du navigateur, dans les journaux d’accès et dans l’en-tête `Referer` envoyé
 * aux tiers, pendant que le prospect croyait avoir écrit et qu’Eliott ne
 * recevait rien.
 *
 * IL N’Y A DONC PAS DE `GET` ICI, et il ne faut jamais en ajouter : un
 * formulaire dont la méthode retombe sur `get` faute de gestionnaire est
 * exactement le défaut qu’on répare. Next renvoie 405 sur toute autre méthode.
 *
 * ORDRE DES CONTRÔLES, du moins cher au plus cher :
 *   origine → type de contenu → débit → corps → piège/temps/champs → captcha →
 *   envoi. Vérifier le captcha avant le débit ferait payer notre quota
 *   Cloudflare à chaque requête d’un robot.
 *
 * JOURNAL. Les erreurs sont journalisées avec l’intention, le motif et une
 * EMPREINTE tronquée de l’adresse. Ni le message, ni l’adresse en clair : un
 * journal d’application est lu par des outils tiers, archivé et rarement purgé.
 */
import { creerJournal, empreinte, json, origineEtrangere } from "@/lib/api/reponse";
import { siteConfig } from "@/content/site";
import { resoudreVerificateur } from "@/lib/contact/captcha";
import { composerAccuseReception, composerNotification } from "@/lib/contact/emails";
import { EMAIL_CONTACT_PAR_DEFAUT, resoudreExpediteur } from "@/lib/contact/mailer";
import {
  adresseAppelante,
  creerLimiteur,
  LIMITE_CONTACT,
} from "@/lib/contact/rate-limit";
import { validerSoumission } from "@/lib/contact/validation";
import type { MotifRejet } from "@/lib/contact/validation";

/**
 * Exécution Node et non Edge : `node:crypto` sert à l’empreinte de journal, et
 * le limiteur en mémoire n’a de sens que sur un processus qui dure.
 */
export const runtime = "nodejs";

/**
 * Les quatre briques d’en-tête, d’origine et de journal sont désormais dans
 * `src/lib/api/reponse.ts` : elles étaient privées ici, et `/api/rendez-vous`
 * en avait besoin à l’identique. Leur raisonnement complet y est conservé.
 */
const journaliser = creerJournal("contact");
/** Aucune mise en cache possible sur une route qui écrit. */
export const dynamic = "force-dynamic";

/**
 * Limiteur partagé par le module.
 *
 * Sa portée est le PROCESSUS : voir les limites documentées dans
 * `src/lib/contact/rate-limit.ts`. En développement, le rechargement à chaud
 * peut le réinitialiser.
 */
const limiteur = creerLimiteur(LIMITE_CONTACT);

/** Types de projet acceptés : la liste affichée par les formulaires, et elle seule. */
const TYPES_PROJET = siteConfig.footerForm?.selectOptions ?? [];

const EMAIL_CONTACT = siteConfig.contact.email || EMAIL_CONTACT_PAR_DEFAUT;

/** Repli affiché au prospect chaque fois que l’envoi ne peut pas aboutir. */
const REPLI_DIRECT = `Écris-moi directement à ${EMAIL_CONTACT}.`;

/** Message client d’un rejet de validation. Aucun détail d’implémentation. */
function messageRejet(motif: MotifRejet): { message: string; champ?: string } {
  if (motif.type === "champ_invalide") {
    switch (motif.champ) {
      case "email":
        return { message: "Cette adresse e-mail ne semble pas valide.", champ: "email" };
      case "nom":
        return { message: "Merci d’indiquer ton nom.", champ: "nom" };
      case "typeProjet":
        return {
          message: "Choisis un type de projet dans la liste.",
          champ: "typeProjet",
        };
      case "message":
        return {
          message: "Ton message est trop court ou trop long.",
          champ: "message",
        };
    }
  }
  // Piège, temps de remplissage, horodatage, corps illisible, intention
  // inconnue : le client reçoit LE MÊME message. Distinguer les cas
  // apprendrait à un robot lequel de nos contrôles l’a arrêté.
  return { message: "Cette demande n’a pas pu être vérifiée. Recharge la page et réessaie." };
}

export async function POST(requete: Request): Promise<Response> {
  if (origineEtrangere(requete)) {
    return json({ message: "Requête refusée." }, 403);
  }

  const typeContenu = requete.headers.get("content-type") ?? "";
  if (!typeContenu.toLowerCase().includes("application/json")) {
    return json({ message: "Requête refusée." }, 415);
  }

  const adresse = adresseAppelante(requete.headers);
  const limite = limiteur.verifier(adresse);
  if (!limite.autorise) {
    journaliser("debit_depasse", {
      appelant: empreinte(adresse),
      reessayerDansS: limite.reessayerDansS,
    });
    return json(
      {
        message:
          "Trop de demandes envoyées depuis cette connexion. Réessaie dans quelques minutes, ou écris-moi directement.",
      },
      429,
      { "retry-after": String(limite.reessayerDansS) },
    );
  }

  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return json({ message: "Requête refusée." }, 400);
  }

  const validation = validerSoumission(corps, {
    typesProjetAutorises: TYPES_PROJET,
    maintenantMs: Date.now(),
  });
  if (!validation.ok) {
    journaliser("rejet_validation", {
      motif: validation.motif.type,
      appelant: empreinte(adresse),
    });
    const { message, champ } = messageRejet(validation.motif);
    return json(champ ? { message, champ } : { message }, 400);
  }
  const { soumission } = validation;

  const jeton =
    typeof (corps as Record<string, unknown>).jetonCaptcha === "string"
      ? ((corps as Record<string, unknown>).jetonCaptcha as string)
      : undefined;

  const verificateur = resoudreVerificateur();
  const captcha = await verificateur.verifier(jeton, adresse);
  if (!captcha.ok) {
    journaliser("captcha_refuse", {
      fournisseur: verificateur.nom,
      raison: captcha.raison,
      codes: captcha.codes?.join(",") ?? "",
      contact: empreinte(soumission.email),
    });
    if (captcha.raison === "non_configure") {
      return json(
        {
          message: `L’envoi de messages est momentanément indisponible. ${REPLI_DIRECT}`,
        },
        503,
      );
    }
    return json(
      {
        message:
          "La vérification anti-robot n’a pas abouti. Recharge la page et réessaie.",
      },
      403,
    );
  }

  const resolution = resoudreExpediteur();
  if (!resolution.ok) {
    journaliser("expediteur_non_configure", {
      variableManquante: resolution.variableManquante,
    });
    return json(
      {
        message: `L’envoi de messages est momentanément indisponible. ${REPLI_DIRECT}`,
      },
      503,
    );
  }
  const { expediteur } = resolution;

  // La NOTIFICATION passe en premier et conditionne le succès : si Eliott ne
  // reçoit rien, le prospect ne doit pas lire « envoyé ». C’est exactement le
  // faux succès qu’on cherche à rendre impossible.
  const notification = await expediteur.envoyer({
    destinataire: expediteur.versEliott,
    message: composerNotification(soumission),
    repondreA: soumission.email,
  });
  if (!notification.ok) {
    journaliser("notification_echouee", {
      transport: expediteur.nom,
      raison: notification.raison,
      detail: notification.detail ?? "",
      contact: empreinte(soumission.email),
    });
    return json(
      {
        message: `Ton message n’a pas pu être transmis. ${REPLI_DIRECT}`,
      },
      notification.raison === "indisponible" ? 504 : 502,
    );
  }

  // L’ACCUSÉ DE RÉCEPTION, lui, ne conditionne rien : le message d’Eliott est
  // parti, la demande est bien reçue. Un échec ici (adresse valide en syntaxe
  // mais inexistante, boîte pleine) est journalisé et n’annule pas le succès —
  // le contraire ferait recommencer un prospect dont la demande est déjà
  // arrivée.
  const accuse = await expediteur.envoyer({
    destinataire: soumission.email,
    message: composerAccuseReception(soumission, EMAIL_CONTACT),
    repondreA: expediteur.versEliott,
  });
  if (!accuse.ok) {
    journaliser("accuse_echoue", {
      transport: expediteur.nom,
      raison: accuse.raison,
      detail: accuse.detail ?? "",
      contact: empreinte(soumission.email),
    });
  }

  return json({ ok: true, accuseEnvoye: accuse.ok }, 200);
}
