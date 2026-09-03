/**
 * Envoi des e-mails, par Resend ou par SMTP, derrière une seule interface.
 *
 * DEUX CHEMINS, UN SEUL CHOISI PAR LA CONFIGURATION. `RESEND_API_KEY` posée
 * l’emporte toujours : l’API rend la délivrabilité, les journaux d’envoi et les
 * rebonds, ce que SMTP ne donne pas. À défaut, si les quatre variables `SMTP_*`
 * sont posées, le message part par SMTP. Si rien n’est posé, le comportement
 * d’origine tient au mot près : `resoudreExpediteur` dit ce qui manque, la route
 * répond 503 et le formulaire affiche son message honnête.
 *
 * POURQUOI CE SECOND CHEMIN EXISTE. Resend n’envoie à un tiers qu’une fois le
 * domaine vérifié par DNS : compte à créer, enregistrements à poser, propagation
 * à attendre. Tant que ce n’est pas fait, l’accusé de réception au prospect ne
 * part pas. Un compte Gmail avec son alias vérifié envoie, lui, dès aujourd’hui.
 * Le site n’a pas à attendre le DNS pour accepter un message.
 *
 * LES DEUX CHEMINS ENVOIENT LE MÊME CONTENU : `emails.ts` compose, ces
 * expéditeurs transportent. Rien de rédactionnel ne vit ici.
 *
 * PAS DE PAQUET `resend`. L’API tient en un POST JSON sur un seul point
 * d’entrée : la dépendance n’apporterait qu’un typage que ce fichier écrit en
 * quinze lignes, et coûterait une mise à jour de plus à suivre. `fetch` est
 * dans la plateforme, il est déjà utilisé pour Turnstile.
 *
 * COMPTE VISÉ : le compte Resend PERSONNEL d’Eliott
 * (eliott.bouquerel@gmail.com), domaine `eliottbouquerel.fr`. Le compte Resend
 * d’un ancien projet ne doit servir à rien ici : rien dans ce fichier ne s’y
 * rattache, la clef vient de l’environnement.
 *
 * ABSENCE DE CLEF = ÉCHEC EXPLICITE. `resoudreExpediteur` renvoie une erreur
 * typée que la route traduit en 503 et en un message honnête. Le piège à éviter
 * est précisément l’inverse : un formulaire qui affiche « envoyé » sans avoir
 * rien envoyé.
 */
import type { MessageCompose } from "./emails";
import { envoyerParSmtp } from "./smtp";
import type { ConfigSmtp } from "./smtp";

const URL_RESEND = "https://api.resend.com/emails";

export interface EnvoiDemande {
  readonly destinataire: string;
  readonly message: MessageCompose;
  /** Adresse à laquelle « Répondre » doit écrire. */
  readonly repondreA?: string;
}

export type ResultatEnvoi =
  | { readonly ok: true; readonly id: string }
  | {
      readonly ok: false;
      /**
       * `non_configure` : aucun chemin d’envoi amorcé.
       * `refuse` : le service a dit non (domaine non vérifié, quota, adresse
       *   inconnue du serveur SMTP…).
       * `indisponible` : réseau, délai dépassé, ou refus temporaire 4xx.
       */
      readonly raison: "non_configure" | "refuse" | "indisponible";
      /** Détail destiné au JOURNAL SERVEUR seulement, jamais au client. */
      readonly detail?: string;
    };

export interface Expediteur {
  /**
   * Chemin employé, journalisé par la route en cas d'échec. Sans lui, un
   * « refuse » dans le journal ne dit pas s'il vient de Resend ou du serveur
   * SMTP, alors que le diagnostic n'est pas du tout le même.
   */
  readonly nom: "resend" | "smtp";
  /** Adresse `From`, du type `Nom <contact@eliottbouquerel.fr>`. */
  readonly de: string;
  /** Boîte d’Eliott, destinataire des notifications. */
  readonly versEliott: string;
  envoyer(demande: EnvoiDemande): Promise<ResultatEnvoi>;
}

/** Adresse de contact publiée sur le site (`src/content/site.ts`). */
export const EMAIL_CONTACT_PAR_DEFAUT = "contact@eliottbouquerel.fr";

function lireIdentifiant(charge: unknown): string | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const id = (charge as Record<string, unknown>).id;
  return typeof id === "string" ? id : undefined;
}

function lireMessageErreur(charge: unknown): string | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const message = (charge as Record<string, unknown>).message;
  return typeof message === "string" ? message : undefined;
}

function creerExpediteurResend(
  cle: string,
  de: string,
  versEliott: string,
): Expediteur {
  return {
    nom: "resend",
    de,
    versEliott,
    async envoyer({ destinataire, message, repondreA }) {
      try {
        const reponse = await fetch(URL_RESEND, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cle}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: de,
            to: [destinataire],
            subject: message.sujet,
            html: message.html,
            text: message.texte,
            ...(repondreA ? { reply_to: repondreA } : {}),
          }),
          signal: AbortSignal.timeout(10_000),
        });

        const charge: unknown = await reponse.json().catch(() => null);
        if (!reponse.ok) {
          return {
            ok: false,
            raison: "refuse",
            detail: `${reponse.status} ${lireMessageErreur(charge) ?? "sans message"}`,
          };
        }
        const id = lireIdentifiant(charge);
        if (!id) {
          return { ok: false, raison: "refuse", detail: "réponse sans identifiant" };
        }
        return { ok: true, id };
      } catch (erreur) {
        return {
          ok: false,
          raison: "indisponible",
          detail: erreur instanceof Error ? erreur.name : "inconnue",
        };
      }
    },
  };
}

/**
 * Expéditeur SMTP. Même interface, même contenu, autre transport.
 *
 * Le `Reply-To` reste posé de la même façon : c’est lui qui rend la réponse à un
 * prospect immédiate depuis la notification.
 */
function creerExpediteurSmtp(
  config: ConfigSmtp,
  de: string,
  versEliott: string,
): Expediteur {
  return {
    nom: "smtp",
    de,
    versEliott,
    async envoyer({ destinataire, message, repondreA }) {
      const resultat = await envoyerParSmtp(config, {
        de,
        destinataire,
        repondreA,
        sujet: message.sujet,
        html: message.html,
        texte: message.texte,
      });
      if (resultat.ok) return { ok: true, id: resultat.id };
      return { ok: false, raison: resultat.raison, detail: resultat.detail };
    },
  };
}

export type ResolutionExpediteur =
  | { readonly ok: true; readonly expediteur: Expediteur }
  | { readonly ok: false; readonly variableManquante: string };

/** Port par défaut : TLS implicite, la valeur standard chez Gmail et Hostinger. */
const PORT_SMTP_PAR_DEFAUT = 465;

type LectureSmtp =
  | { readonly ok: true; readonly config: ConfigSmtp }
  | { readonly ok: false; readonly variableManquante: string };

/**
 * Lit la configuration SMTP, ou nomme la PREMIÈRE variable qui manque.
 *
 * Une configuration à moitié posée est l’erreur la plus probable au
 * déploiement : nommer la variable absente dans le journal évite d’aller
 * chercher dans quatre écrans lequel des quatre champs a sauté.
 */
function lireConfigSmtp(): LectureSmtp {
  const hote = process.env.SMTP_HOTE?.trim();
  const utilisateur = process.env.SMTP_UTILISATEUR?.trim();
  const motDePasse = process.env.SMTP_MOT_DE_PASSE?.trim();

  if (!hote) return { ok: false, variableManquante: "SMTP_HOTE" };
  if (!utilisateur) return { ok: false, variableManquante: "SMTP_UTILISATEUR" };
  if (!motDePasse) return { ok: false, variableManquante: "SMTP_MOT_DE_PASSE" };

  const portBrut = process.env.SMTP_PORT?.trim();
  const port = portBrut ? Number.parseInt(portBrut, 10) : PORT_SMTP_PAR_DEFAUT;
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    return { ok: false, variableManquante: "SMTP_PORT" };
  }

  return { ok: true, config: { hote, port, utilisateur, motDePasse } };
}

/**
 * Construit l’expéditeur à partir de l’environnement, ou dit ce qui manque.
 *
 * `CONTACT_FROM_EMAIL` a une valeur par défaut parce que l’adresse est déjà
 * publiée sur le site ; ni `RESEND_API_KEY` ni les variables `SMTP_*` n’en ont,
 * et c’est le seul moyen d’empêcher un déploiement de démarrer en croyant
 * pouvoir écrire.
 *
 * ORDRE : Resend d’abord. Sa présence est un choix délibéré d’Eliott, pas un
 * reliquat ; basculer sur SMTP alors que la clef est posée le priverait des
 * journaux d’envoi sans qu’il l’ait demandé.
 */
export function resoudreExpediteur(): ResolutionExpediteur {
  const de =
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    `Eliott Bouquerel <${EMAIL_CONTACT_PAR_DEFAUT}>`;
  const versEliott =
    process.env.CONTACT_TO_EMAIL?.trim() || EMAIL_CONTACT_PAR_DEFAUT;

  const cle = process.env.RESEND_API_KEY?.trim();
  if (cle) {
    return { ok: true, expediteur: creerExpediteurResend(cle, de, versEliott) };
  }

  const smtp = lireConfigSmtp();
  if (smtp.ok) {
    return { ok: true, expediteur: creerExpediteurSmtp(smtp.config, de, versEliott) };
  }

  // Aucun des deux chemins n’est amorcé : le message nomme les deux entrées
  // possibles plutôt que la seule variable SMTP absente, qui laisserait croire
  // que SMTP est le chemin attendu.
  if (smtp.variableManquante === "SMTP_HOTE") {
    return { ok: false, variableManquante: "RESEND_API_KEY ou SMTP_HOTE" };
  }
  return { ok: false, variableManquante: smtp.variableManquante };
}
