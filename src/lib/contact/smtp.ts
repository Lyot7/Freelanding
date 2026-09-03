/**
 * Envoi d’un message par SMTP, sur TLS implicite, écrit à la main.
 *
 * POURQUOI PAS `nodemailer`. Le paquet vaut son poids quand on a besoin de ce
 * qu’il apporte : réservoir de connexions, files d’attente, pièces jointes,
 * images en ligne, OAuth2, signature DKIM, transports de repli. Ici, rien de
 * tout cela n’est employé. Le besoin tient en une session, deux destinataires
 * possibles, deux parties de corps déjà composées par `emails.ts`, et le
 * dialogue SMTP figé depuis la RFC 821 : bannière, EHLO, AUTH LOGIN, MAIL FROM,
 * RCPT TO, DATA, QUIT. Ce fichier écrit exactement cela.
 *
 * Ce que la dépendance aurait coûté, en face : une dépendance de production de
 * plus à suivre et à auditer sur un chemin qui touche des données personnelles,
 * pour un protocole qui, lui, ne bougera plus. Le dépôt tranche déjà ainsi pour
 * Resend (`mailer.ts` : pas de paquet `resend`, un `fetch`), et le même arbitrage
 * a déjà été rendu dans `prospection-sourcing`, où le client SMTP maison envoie
 * en production depuis des mois.
 *
 * LE PIÈGE ÉVITÉ, c’est l’encodage. Un client SMTP maison se casse sur les
 * accents, sur les lignes de plus de 998 octets et sur le point isolé en début
 * de ligne qui coupe le message. La parade retenue supprime les trois d’un
 * coup : les deux corps partent en `base64` (lignes de 76 caractères, alphabet
 * sans point), et le sujet en mots encodés `=?UTF-8?B?…?=` découpés sous la
 * limite de 75 caractères de la RFC 2047. Il ne reste aucun octet à plus de 127
 * dans le flux, donc plus rien à négocier avec le serveur.
 *
 * CE QUI N’EST PAS GÉRÉ, volontairement : STARTTLS. La connexion est chiffrée
 * dès l’ouverture (port 465 chez Gmail comme chez Hostinger). Un port en clair
 * qu’on promeut ensuite est une négociation de plus, un mode dégradé de plus, et
 * un chemin qu’on ne pourrait pas tester ici.
 */
import { randomBytes, randomUUID } from "node:crypto";
import { connect as connecterTls } from "node:tls";

export interface ConfigSmtp {
  readonly hote: string;
  /** Port en TLS implicite. 465 partout où le service est standard. */
  readonly port: number;
  readonly utilisateur: string;
  /** Mot de passe d’application. Jamais journalisé, jamais renvoyé. */
  readonly motDePasse: string;
}

export interface MessageSmtp {
  /** En-tête `From`, du type `Nom <adresse>` ou `adresse` seule. */
  readonly de: string;
  readonly destinataire: string;
  readonly repondreA?: string;
  readonly sujet: string;
  readonly html: string;
  readonly texte: string;
}

export type ResultatSmtp =
  | { readonly ok: true; readonly id: string }
  | {
      readonly ok: false;
      /** `refuse` : le serveur a dit non. `indisponible` : réseau ou délai. */
      readonly raison: "refuse" | "indisponible";
      /** Détail pour le JOURNAL SERVEUR. Ne contient jamais d’identifiant. */
      readonly detail: string;
    };

/**
 * Canal de transport, isolé pour que le dialogue soit testable sans réseau.
 *
 * `lireReponse` rend UNE réponse SMTP complète, continuations comprises.
 */
export interface CanalSmtp {
  lireReponse(): Promise<string>;
  ecrire(donnees: string): void;
  fermer(): void;
}

const DELAI_MS = 15_000;

/** Extrait l’adresse nue d’un en-tête `Nom <adresse>`. */
export function adresseNue(valeur: string): string {
  const entre = /<([^>]*)>/.exec(valeur);
  return (entre ? entre[1] : valeur).trim();
}

/**
 * Une adresse d’enveloppe ne doit contenir ni espace, ni chevron, ni saut de
 * ligne : c’est la seule barrière entre une valeur soumise et une commande SMTP
 * forgée. La validation amont la contrôle déjà ; celle-ci est la seconde.
 */
function adresseSure(adresse: string): boolean {
  return adresse.length > 0 && adresse.length <= 254 && !/[\s<>,;"\\]/.test(adresse);
}

/** Retire de quoi couper un en-tête en deux. */
function enteteSure(valeur: string): string {
  return valeur.replace(/[\r\n\u0000-\u001F\u007F]+/g, " ").trim();
}

/**
 * Encode un en-tête en mots `=?UTF-8?B?…?=` quand il sort de l’ASCII.
 *
 * Le découpage se fait sur les POINTS DE CODE et non sur les octets : couper au
 * milieu d’un « é » produirait un mot encodé invalide, que certains clients
 * affichent en caractères de remplacement. Chaque morceau tient sous 45 octets,
 * ce qui borne le mot encodé à 72 caractères, sous la limite de 75.
 */
export function encoderEntete(valeur: string): string {
  const propre = enteteSure(valeur);
  if (/^[\x20-\x7E]*$/.test(propre)) return propre;

  const morceaux: string[] = [];
  let courant = "";
  for (const point of propre) {
    const essai = courant + point;
    if (Buffer.byteLength(essai, "utf8") > 45) {
      morceaux.push(courant);
      courant = point;
    } else {
      courant = essai;
    }
  }
  if (courant.length > 0) morceaux.push(courant);

  return morceaux
    .map((m) => `=?UTF-8?B?${Buffer.from(m, "utf8").toString("base64")}?=`)
    .join("\r\n ");
}

/** Découpe une chaîne base64 en lignes de 76 caractères, comme l’exige MIME. */
function plierBase64(valeur: string): string {
  const encode = Buffer.from(valeur, "utf8").toString("base64");
  return (encode.match(/.{1,76}/g) ?? [""]).join("\r\n");
}

/** Date au format RFC 5322. `toUTCString` dit « GMT » là où la RFC veut « +0000 ». */
function dateRfc(date: Date): string {
  return date.toUTCString().replace(/GMT$/, "+0000");
}

export interface OptionsMime {
  readonly identifiant: string;
  readonly date: Date;
  readonly frontiere: string;
}

/**
 * Construit le document MIME complet, en-têtes compris.
 *
 * `multipart/alternative` et pas seulement du HTML : un client qui préfère le
 * texte affiche la partie texte, et un message HTML sans équivalent texte perd
 * des points chez les filtres anti-spam.
 */
export function construireMime(
  message: MessageSmtp,
  options: OptionsMime,
): string {
  const lignes = [
    `From: ${enteteSure(message.de)}`,
    `To: ${enteteSure(message.destinataire)}`,
    ...(message.repondreA ? [`Reply-To: ${enteteSure(message.repondreA)}`] : []),
    `Subject: ${encoderEntete(message.sujet)}`,
    `Message-ID: <${options.identifiant}>`,
    `Date: ${dateRfc(options.date)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${options.frontiere}"`,
    "",
    `--${options.frontiere}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    plierBase64(message.texte),
    `--${options.frontiere}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    plierBase64(message.html),
    `--${options.frontiere}--`,
    "",
  ];
  return lignes.join("\r\n");
}

function codeReponse(reponse: string): number {
  return Number.parseInt(reponse.slice(0, 3), 10);
}

/** Réduit une réponse serveur à une ligne courte, sûre pour le journal. */
function detailSur(etape: string, reponse: string): string {
  return `${etape} ${enteteSure(reponse).slice(0, 120)}`;
}

class EchecSmtp extends Error {
  constructor(
    readonly raison: "refuse" | "indisponible",
    readonly detail: string,
  ) {
    super(detail);
    this.name = "EchecSmtp";
  }
}

/**
 * Déroule le dialogue SMTP sur un canal déjà ouvert.
 *
 * Séparé de l’ouverture de la connexion pour que le test scénarise les réponses
 * du serveur, y compris les refus, sans toucher au réseau.
 */
export async function dialogueSmtp(
  canal: CanalSmtp,
  config: ConfigSmtp,
  message: MessageSmtp,
  options: OptionsMime,
): Promise<ResultatSmtp> {
  const expediteur = adresseNue(message.de);
  const destinataire = adresseNue(message.destinataire);
  if (!adresseSure(expediteur) || !adresseSure(destinataire)) {
    canal.fermer();
    return { ok: false, raison: "refuse", detail: "adresse d’enveloppe invalide" };
  }

  /**
   * Le mot de passe ne passe JAMAIS par ici : les deux étapes d’authentification
   * écrivent leur base64 directement, sans repasser par le journal d’étape.
   */
  const attendre = async (etape: string, codes: readonly number[]): Promise<string> => {
    let reponse: string;
    try {
      reponse = await canal.lireReponse();
    } catch (erreur) {
      throw new EchecSmtp(
        "indisponible",
        `${etape} ${erreur instanceof Error ? erreur.message : "interrompu"}`,
      );
    }
    const code = codeReponse(reponse);
    if (!codes.includes(code)) {
      // 4xx est un refus TEMPORAIRE : le traiter comme « indisponible » laisse
      // la route répondre 504 et invite à réessayer, ce qui est exact.
      throw new EchecSmtp(
        code >= 400 && code < 500 ? "indisponible" : "refuse",
        detailSur(etape, reponse),
      );
    }
    return reponse;
  };

  const commande = async (
    ligne: string,
    etape: string,
    codes: readonly number[],
  ): Promise<string> => {
    canal.ecrire(`${ligne}\r\n`);
    return attendre(etape, codes);
  };

  try {
    await attendre("banniere", [220]);
    await commande(`EHLO ${config.hote}`, "EHLO", [250]);
    await commande("AUTH LOGIN", "AUTH", [334]);
    await commande(
      Buffer.from(config.utilisateur, "utf8").toString("base64"),
      "identifiant",
      [334],
    );
    await commande(
      Buffer.from(config.motDePasse, "utf8").toString("base64"),
      "authentification",
      [235],
    );
    await commande(`MAIL FROM:<${expediteur}>`, "MAIL FROM", [250]);
    await commande(`RCPT TO:<${destinataire}>`, "RCPT TO", [250, 251]);
    await commande("DATA", "DATA", [354]);
    canal.ecrire(`${construireMime(message, options)}\r\n.\r\n`);
    await attendre("fin des donnees", [250]);
    try {
      await commande("QUIT", "QUIT", [221]);
    } catch {
      /* Le message est accepté ; une sortie brutale ne l’annule pas. */
    }
    return { ok: true, id: options.identifiant };
  } catch (erreur) {
    if (erreur instanceof EchecSmtp) {
      return { ok: false, raison: erreur.raison, detail: erreur.detail };
    }
    return { ok: false, raison: "indisponible", detail: "erreur inattendue" };
  } finally {
    canal.fermer();
  }
}

/** Ouvre un canal chiffré et bufferisé vers le serveur. */
function ouvrirCanalTls(config: ConfigSmtp): Promise<CanalSmtp> {
  return new Promise((resoudre, rejeter) => {
    const prise = connecterTls({
      host: config.hote,
      port: config.port,
      servername: config.hote,
    });
    prise.setEncoding("utf8");
    prise.setTimeout(DELAI_MS);

    let tampon = "";
    let attente: { resoudre: (v: string) => void; rejeter: (e: Error) => void } | null =
      null;
    let fatale: Error | null = null;

    const complete = (): boolean => {
      const lignes = tampon.split("\r\n").filter((l) => l.length > 0);
      const derniere = lignes.at(-1) ?? "";
      return /^\d{3} /.test(derniere) && tampon.endsWith("\r\n");
    };

    const vider = (): void => {
      if (attente && complete()) {
        const reponse = tampon;
        tampon = "";
        const en_cours = attente;
        attente = null;
        en_cours.resoudre(reponse);
      }
    };

    const echouer = (erreur: Error): void => {
      fatale = erreur;
      if (attente) {
        const en_cours = attente;
        attente = null;
        en_cours.rejeter(erreur);
      }
    };

    prise.on("data", (morceau: string) => {
      tampon += morceau;
      vider();
    });
    prise.on("timeout", () => {
      prise.destroy();
      echouer(new Error("delai depasse"));
    });
    // Le message d’erreur du socket peut porter un nom d’hôte, jamais un secret.
    prise.on("error", (erreur: Error) => echouer(new Error(erreur.message)));
    prise.on("close", () => echouer(new Error("connexion fermee")));

    prise.once("secureConnect", () => {
      resoudre({
        lireReponse: () =>
          new Promise<string>((res, rej) => {
            if (fatale) {
              rej(fatale);
              return;
            }
            attente = { resoudre: res, rejeter: rej };
            vider();
          }),
        ecrire: (donnees) => {
          prise.write(donnees);
        },
        fermer: () => {
          prise.removeAllListeners("close");
          prise.destroy();
        },
      });
    });

    prise.once("error", (erreur: Error) => rejeter(new Error(erreur.message)));
  });
}

/** Envoi complet : ouverture, dialogue, fermeture. */
export async function envoyerParSmtp(
  config: ConfigSmtp,
  message: MessageSmtp,
  maintenant: Date = new Date(),
): Promise<ResultatSmtp> {
  const domaine = adresseNue(message.de).split("@")[1] ?? "localhost";
  const options: OptionsMime = {
    identifiant: `${randomUUID()}@${domaine}`,
    date: maintenant,
    frontiere: `_f_${randomBytes(12).toString("hex")}`,
  };

  let canal: CanalSmtp;
  try {
    canal = await ouvrirCanalTls(config);
  } catch (erreur) {
    return {
      ok: false,
      raison: "indisponible",
      detail: `connexion ${erreur instanceof Error ? erreur.message : "impossible"}`,
    };
  }
  return dialogueSmtp(canal, config, message, options);
}
