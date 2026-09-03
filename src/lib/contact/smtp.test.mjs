import { describe, expect, it } from "bun:test";
import {
  adresseNue,
  construireMime,
  dialogueSmtp,
  encoderEntete,
} from "./smtp.ts";

/**
 * Le dialogue SMTP est testé sur un CANAL FACTICE, jamais sur le réseau : les
 * cas qui comptent sont précisément ceux qu'on ne peut pas provoquer à la
 * demande sur un vrai serveur (refus d'authentification, 4xx temporaire,
 * coupure en plein DATA).
 */
function canalFactice(reponses) {
  const ecrits = [];
  let index = 0;
  return {
    ecrits,
    canal: {
      async lireReponse() {
        const reponse = reponses[index];
        index += 1;
        if (reponse === undefined) throw new Error("plus de reponse scenarisee");
        if (reponse instanceof Error) throw reponse;
        return reponse;
      },
      ecrire(donnees) {
        ecrits.push(donnees);
      },
      fermer() {
        ecrits.push("<ferme>");
      },
    },
  };
}

const CONFIG = {
  hote: "smtp.exemple.test",
  port: 465,
  utilisateur: "compte@exemple.test",
  motDePasse: "mot-de-passe-factice",
};

const MESSAGE = {
  de: "Eliott Bouquerel <contact@exemple.test>",
  destinataire: "prospect@exemple.test",
  repondreA: "prospect@exemple.test",
  sujet: "Ton message est bien arrivé",
  html: "<p>Bonjour Élodie,</p>",
  texte: "Bonjour Élodie,",
};

const OPTIONS = {
  identifiant: "id-de-test@exemple.test",
  date: new Date(Date.UTC(2026, 8, 3, 14, 30, 0)),
  frontiere: "_f_frontiere",
};

/** Séquence d'un envoi qui aboutit, de la bannière au QUIT. */
const SEQUENCE_OK = [
  "220 smtp.exemple.test ESMTP\r\n",
  "250-smtp.exemple.test\r\n250 AUTH LOGIN PLAIN\r\n",
  "334 VXNlcm5hbWU6\r\n",
  "334 UGFzc3dvcmQ6\r\n",
  "235 2.7.0 Accepted\r\n",
  "250 2.1.0 OK\r\n",
  "250 2.1.5 OK\r\n",
  "354 Go ahead\r\n",
  "250 2.0.0 OK 1abc\r\n",
  "221 2.0.0 closing connection\r\n",
];

describe("adresseNue", () => {
  it("extrait l'adresse d'un en-tête nommé", () => {
    expect(adresseNue("Eliott Bouquerel <contact@exemple.test>")).toBe(
      "contact@exemple.test",
    );
  });

  it("laisse une adresse nue intacte", () => {
    expect(adresseNue("  contact@exemple.test ")).toBe("contact@exemple.test");
  });
});

describe("encoderEntete", () => {
  it("laisse l'ASCII en clair", () => {
    expect(encoderEntete("Nouvelle demande")).toBe("Nouvelle demande");
  });

  it("encode les accents en mot encodé UTF-8", () => {
    const encode = encoderEntete("Ton message est bien arrivé");
    expect(encode.startsWith("=?UTF-8?B?")).toBe(true);
    const charge = encode.slice("=?UTF-8?B?".length, -"?=".length);
    expect(Buffer.from(charge, "base64").toString("utf8")).toBe(
      "Ton message est bien arrivé",
    );
  });

  it("découpe un en-tête long en plusieurs mots encodés sous 75 caractères", () => {
    const encode = encoderEntete(`Nouvelle demande de ${"é".repeat(80)}`);
    const mots = encode.split("\r\n ");
    expect(mots.length).toBeGreaterThan(1);
    for (const mot of mots) expect(mot.length).toBeLessThanOrEqual(75);
    const reconstruit = mots
      .map((mot) =>
        Buffer.from(mot.slice("=?UTF-8?B?".length, -"?=".length), "base64").toString(
          "utf8",
        ),
      )
      .join("");
    expect(reconstruit).toBe(`Nouvelle demande de ${"é".repeat(80)}`);
  });

  it("refuse de laisser un saut de ligne couper l'en-tête", () => {
    expect(encoderEntete("sujet\r\nBcc: pirate@exemple.test")).toBe(
      "sujet Bcc: pirate@exemple.test",
    );
  });
});

describe("construireMime", () => {
  const mime = construireMime(MESSAGE, OPTIONS);

  it("pose les en-têtes attendus", () => {
    expect(mime).toContain("From: Eliott Bouquerel <contact@exemple.test>");
    expect(mime).toContain("To: prospect@exemple.test");
    expect(mime).toContain("Reply-To: prospect@exemple.test");
    expect(mime).toContain("Message-ID: <id-de-test@exemple.test>");
    expect(mime).toContain("Date: Thu, 03 Sep 2026 14:30:00 +0000");
    expect(mime).toContain("MIME-Version: 1.0");
  });

  it("omet Reply-To quand il n'est pas demandé", () => {
    const sans = construireMime({ ...MESSAGE, repondreA: undefined }, OPTIONS);
    expect(sans).not.toContain("Reply-To:");
  });

  it("porte les deux parties, texte et HTML, en base64", () => {
    expect(mime).toContain('Content-Type: text/plain; charset="UTF-8"');
    expect(mime).toContain('Content-Type: text/html; charset="UTF-8"');
    expect(mime).toContain(Buffer.from(MESSAGE.texte, "utf8").toString("base64"));
    expect(mime).toContain(Buffer.from(MESSAGE.html, "utf8").toString("base64"));
    expect(mime.endsWith("--_f_frontiere--\r\n")).toBe(true);
  });

  it("ne laisse passer aucun octet hors ASCII ni aucune ligne trop longue", () => {
    for (const ligne of mime.split("\r\n")) {
      expect(Buffer.byteLength(ligne, "utf8")).toBeLessThanOrEqual(998);
      expect(/^[\x00-\x7F]*$/.test(ligne)).toBe(true);
    }
  });

  it("ne peut pas voir un point isolé couper le corps", () => {
    const piege = construireMime(
      { ...MESSAGE, texte: "ligne\r\n.\r\nsuite" },
      OPTIONS,
    );
    for (const ligne of piege.split("\r\n")) {
      expect(ligne).not.toBe(".");
    }
  });
});

describe("dialogueSmtp", () => {
  it("envoie et rend l'identifiant du message", async () => {
    const { canal, ecrits } = canalFactice(SEQUENCE_OK);
    const resultat = await dialogueSmtp(canal, CONFIG, MESSAGE, OPTIONS);

    expect(resultat).toEqual({ ok: true, id: "id-de-test@exemple.test" });
    expect(ecrits[0]).toBe("EHLO smtp.exemple.test\r\n");
    expect(ecrits[1]).toBe("AUTH LOGIN\r\n");
    expect(ecrits[4]).toBe("MAIL FROM:<contact@exemple.test>\r\n");
    expect(ecrits[5]).toBe("RCPT TO:<prospect@exemple.test>\r\n");
    expect(ecrits[6]).toBe("DATA\r\n");
    expect(ecrits[7].endsWith("\r\n.\r\n")).toBe(true);
    expect(ecrits.at(-1)).toBe("<ferme>");
  });

  it("réussit même si le serveur coupe avant le QUIT", async () => {
    const { canal } = canalFactice(SEQUENCE_OK.slice(0, 9));
    const resultat = await dialogueSmtp(canal, CONFIG, MESSAGE, OPTIONS);
    expect(resultat.ok).toBe(true);
  });

  it("rend « refuse » sur un rejet d'authentification, sans divulguer le secret", async () => {
    const { canal } = canalFactice([
      ...SEQUENCE_OK.slice(0, 4),
      "535-5.7.8 Username and Password not accepted\r\n",
    ]);
    const resultat = await dialogueSmtp(canal, CONFIG, MESSAGE, OPTIONS);

    expect(resultat.ok).toBe(false);
    expect(resultat.raison).toBe("refuse");
    expect(resultat.detail).toContain("authentification");
    expect(resultat.detail).not.toContain(CONFIG.motDePasse);
    expect(resultat.detail).not.toContain(
      Buffer.from(CONFIG.motDePasse, "utf8").toString("base64"),
    );
  });

  it("rend « refuse » sur une boîte inconnue", async () => {
    const { canal } = canalFactice([
      ...SEQUENCE_OK.slice(0, 6),
      "550 5.1.1 User unknown\r\n",
    ]);
    const resultat = await dialogueSmtp(canal, CONFIG, MESSAGE, OPTIONS);

    expect(resultat.ok).toBe(false);
    expect(resultat.raison).toBe("refuse");
    expect(resultat.detail).toContain("RCPT TO");
  });

  it("traite un 4xx comme temporaire, donc « indisponible »", async () => {
    const { canal } = canalFactice([
      ...SEQUENCE_OK.slice(0, 6),
      "451 4.3.0 Try again later\r\n",
    ]);
    const resultat = await dialogueSmtp(canal, CONFIG, MESSAGE, OPTIONS);

    expect(resultat.ok).toBe(false);
    expect(resultat.raison).toBe("indisponible");
  });

  it("traite une coupure de canal comme « indisponible »", async () => {
    const { canal } = canalFactice([
      ...SEQUENCE_OK.slice(0, 8),
      new Error("connexion fermee"),
    ]);
    const resultat = await dialogueSmtp(canal, CONFIG, MESSAGE, OPTIONS);

    expect(resultat.ok).toBe(false);
    expect(resultat.raison).toBe("indisponible");
  });

  it("refuse une adresse porteuse d'un saut de ligne sans ouvrir le dialogue", async () => {
    const { canal, ecrits } = canalFactice(SEQUENCE_OK);
    const resultat = await dialogueSmtp(
      canal,
      CONFIG,
      { ...MESSAGE, destinataire: "prospect@exemple.test>\r\nRCPT TO:<pirate@x.test" },
      OPTIONS,
    );

    expect(resultat.ok).toBe(false);
    expect(resultat.raison).toBe("refuse");
    expect(ecrits).toEqual(["<ferme>"]);
  });
});
