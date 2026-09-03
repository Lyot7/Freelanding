/**
 * `POST /api/rendez-vous` — création d'une réservation Cal.com.
 *
 * MÊME ORDRE DE CONTRÔLES que `/api/contact`, du moins cher au plus cher :
 *   origine → type de contenu → débit → corps → piège/temps/champs → captcha →
 *   écriture. Vérifier le captcha avant le débit ferait payer notre quota
 *   Cloudflare à chaque requête d'un robot.
 *
 * POURQUOI LE CAPTCHA ICI AUSSI, alors que Cal.com a ses propres protections.
 * Une réservation n'est pas un e-mail de plus dans une boîte : elle POSE un
 * événement dans l'agenda d'Eliott, envoie deux messages et bloque un créneau
 * que personne d'autre ne pourra prendre. Un robot qui remplirait quinze
 * créneaux d'affilée ne coûterait pas du bruit, il coûterait une semaine
 * d'agenda. Absence de clef Turnstile = 503, comme sur le formulaire : jamais
 * un laissez-passer.
 *
 * PAS DE `GET` ICI, et il ne faut jamais en ajouter : la lecture des créneaux a
 * sa propre route (`./creneaux`). Next renvoie 405 sur toute autre méthode.
 */
import { siteConfig } from "@/content/site";
import { creerJournal, empreinte, json, origineEtrangere } from "@/lib/api/reponse";
import { resoudreVerificateur } from "@/lib/contact/captcha";
import { EMAIL_CONTACT_PAR_DEFAUT } from "@/lib/contact/mailer";
import { adresseAppelante, creerLimiteur } from "@/lib/contact/rate-limit";
import { creerReservation } from "@/lib/rendez-vous/cal-com";
import { resoudreConfiguration } from "@/lib/rendez-vous/config";
import { LIMITE_RESERVATION } from "@/lib/rendez-vous/limites";
import { validerReservation } from "@/lib/rendez-vous/validation";
import type { MotifRejetReservation } from "@/lib/rendez-vous/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const journaliser = creerJournal("rendez-vous");
const limiteur = creerLimiteur(LIMITE_RESERVATION);

const EMAIL_CONTACT = siteConfig.contact.email || EMAIL_CONTACT_PAR_DEFAUT;

/** Repli affiché au prospect chaque fois que la réservation ne peut pas aboutir. */
const REPLI_DIRECT = `Écrivez-moi directement à ${EMAIL_CONTACT}.`;

/**
 * Message client d'un rejet de validation.
 *
 * Comme sur le formulaire de contact, le piège, le temps de remplissage et
 * l'horodatage partagent LE MÊME message : distinguer les cas apprendrait à un
 * robot lequel de nos contrôles l'a arrêté.
 */
function messageRejet(motif: MotifRejetReservation): {
  message: string;
  champ?: string;
} {
  if (motif.type === "champ_invalide") {
    switch (motif.champ) {
      case "nom":
        return { message: "Merci d’indiquer votre nom.", champ: "nom" };
      case "email":
        return {
          message: "Cette adresse e-mail ne semble pas valide.",
          champ: "email",
        };
      case "message":
        return { message: "Votre message est trop long.", champ: "message" };
      case "creneau":
        return {
          message:
            "Ce créneau n’est plus proposé. Choisissez-en un autre dans la liste.",
          champ: "creneau",
        };
      case "type":
        return { message: "Ce type de rendez-vous n’est pas proposé.", champ: "type" };
    }
  }
  return {
    message: "Cette demande n’a pas pu être vérifiée. Rechargez la page et réessayez.",
  };
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
          "Trop de réservations depuis cette connexion. Réessayez dans quelques minutes, ou écrivez-moi directement.",
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

  const { cibles, typesDisponibles } = resoudreConfiguration();
  if (typesDisponibles.length === 0) {
    journaliser("non_configure", { variable: "CAL_COM_EVENT_*" });
    return json(
      {
        message: `La prise de rendez-vous en ligne est momentanément indisponible. ${REPLI_DIRECT}`,
      },
      503,
    );
  }

  const validation = validerReservation(corps, {
    typesAutorises: typesDisponibles,
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
  const { reservation } = validation;

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
      contact: empreinte(reservation.email),
    });
    if (captcha.raison === "non_configure") {
      return json(
        {
          message: `La prise de rendez-vous en ligne est momentanément indisponible. ${REPLI_DIRECT}`,
        },
        503,
      );
    }
    return json(
      {
        message:
          "La vérification anti-robot n’a pas abouti. Rechargez la page et réessayez.",
      },
      403,
    );
  }

  // `typesDisponibles` vient d'être calculé à partir de `cibles`, et la
  // validation n'accepte que des types de cette liste : la cible existe donc
  // forcément. Le garde ci-dessous n'est pas défensif pour rien, il évite un
  // `!` non typé et fait tenir la promesse « aucun `any`, aucune assertion ».
  const cible = cibles[reservation.type];
  if (!cible) {
    return json(
      {
        message: `La prise de rendez-vous en ligne est momentanément indisponible. ${REPLI_DIRECT}`,
      },
      503,
    );
  }

  const creation = await creerReservation({
    cible,
    debutUtc: reservation.debutUtc,
    nom: reservation.nom,
    email: reservation.email,
    message: reservation.message,
  });

  if (!creation.ok) {
    journaliser("reservation_echouee", {
      type: reservation.type,
      raison: creation.raison,
      statut: creation.raison === "refuse" ? creation.statut : 0,
      detail: creation.detail,
      contact: empreinte(reservation.email),
    });
    // 409 chez Cal.com = créneau pris entre l'affichage et la confirmation.
    // C'est le seul cas où le prospect peut agir tout seul : on le lui dit.
    if (creation.raison === "refuse" && creation.statut === 409) {
      return json(
        {
          message:
            "Ce créneau vient d’être pris. Choisissez-en un autre dans la liste.",
          champ: "creneau",
        },
        409,
      );
    }
    return json(
      { message: `Le rendez-vous n’a pas pu être enregistré. ${REPLI_DIRECT}` },
      creation.raison === "indisponible" ? 504 : 502,
    );
  }

  journaliser("reservation_creee", {
    type: reservation.type,
    uid: creation.donnees.uid,
  });
  return json({ ok: true }, 200);
}
