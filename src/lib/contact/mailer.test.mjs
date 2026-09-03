import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { EMAIL_CONTACT_PAR_DEFAUT, resoudreExpediteur } from "./mailer.ts";

/**
 * Ce fichier ne teste QUE la sélection du chemin d'envoi : c'est la seule
 * décision de `mailer.ts`, et c'est celle qui se trompe silencieusement quand
 * une variable saute au déploiement. Le transport lui-même est couvert par
 * `smtp.test.mjs`, sur un canal factice.
 *
 * Aucune valeur réelle ici : les identifiants de test sont des chaînes
 * évidemment factices. Un mot de passe d'application ne se recopie jamais dans
 * un dépôt, pas même dans un test.
 */
const VARIABLES = [
  "RESEND_API_KEY",
  "SMTP_HOTE",
  "SMTP_PORT",
  "SMTP_UTILISATEUR",
  "SMTP_MOT_DE_PASSE",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
];

const sauvegarde = new Map();

beforeEach(() => {
  for (const nom of VARIABLES) {
    sauvegarde.set(nom, process.env[nom]);
    delete process.env[nom];
  }
});

afterEach(() => {
  for (const nom of VARIABLES) {
    const valeur = sauvegarde.get(nom);
    if (valeur === undefined) delete process.env[nom];
    else process.env[nom] = valeur;
  }
  sauvegarde.clear();
});

/** Les trois variables SMTP sans lesquelles rien ne part. */
function poserSmtp() {
  process.env.SMTP_HOTE = "smtp.exemple.test";
  process.env.SMTP_UTILISATEUR = "compte@exemple.test";
  process.env.SMTP_MOT_DE_PASSE = "mot-de-passe-factice";
}

describe("resoudreExpediteur", () => {
  it("prend Resend quand la clef est posée", () => {
    process.env.RESEND_API_KEY = "re_cle_factice";
    const resolution = resoudreExpediteur();
    expect(resolution.ok).toBe(true);
    expect(resolution.expediteur.nom).toBe("resend");
  });

  it("garde Resend même quand SMTP est configuré aussi", () => {
    process.env.RESEND_API_KEY = "re_cle_factice";
    poserSmtp();
    const resolution = resoudreExpediteur();
    expect(resolution.ok).toBe(true);
    expect(resolution.expediteur.nom).toBe("resend");
  });

  it("bascule sur SMTP quand Resend n'est pas configuré", () => {
    poserSmtp();
    const resolution = resoudreExpediteur();
    expect(resolution.ok).toBe(true);
    expect(resolution.expediteur.nom).toBe("smtp");
  });

  it("ignore une clef Resend vide ou faite d'espaces", () => {
    process.env.RESEND_API_KEY = "   ";
    poserSmtp();
    const resolution = resoudreExpediteur();
    expect(resolution.ok).toBe(true);
    expect(resolution.expediteur.nom).toBe("smtp");
  });

  it("refuse quand aucun des deux chemins n'est amorcé", () => {
    const resolution = resoudreExpediteur();
    expect(resolution.ok).toBe(false);
    expect(resolution.variableManquante).toBe("RESEND_API_KEY ou SMTP_HOTE");
  });

  it("nomme la variable SMTP absente quand la configuration est à moitié posée", () => {
    poserSmtp();
    delete process.env.SMTP_MOT_DE_PASSE;
    const resolution = resoudreExpediteur();
    expect(resolution.ok).toBe(false);
    expect(resolution.variableManquante).toBe("SMTP_MOT_DE_PASSE");
  });

  it("refuse un port SMTP illisible plutôt que de retomber sur 465", () => {
    poserSmtp();
    process.env.SMTP_PORT = "quatre-cent-soixante-cinq";
    const resolution = resoudreExpediteur();
    expect(resolution.ok).toBe(false);
    expect(resolution.variableManquante).toBe("SMTP_PORT");
  });

  it("accepte un port explicite", () => {
    poserSmtp();
    process.env.SMTP_PORT = "465";
    expect(resoudreExpediteur().ok).toBe(true);
  });

  it("applique les mêmes adresses par défaut aux deux chemins", () => {
    poserSmtp();
    const parSmtp = resoudreExpediteur();
    process.env.RESEND_API_KEY = "re_cle_factice";
    const parResend = resoudreExpediteur();

    expect(parSmtp.expediteur.de).toBe(
      `Eliott Bouquerel <${EMAIL_CONTACT_PAR_DEFAUT}>`,
    );
    expect(parSmtp.expediteur.versEliott).toBe(EMAIL_CONTACT_PAR_DEFAUT);
    expect(parResend.expediteur.de).toBe(parSmtp.expediteur.de);
    expect(parResend.expediteur.versEliott).toBe(parSmtp.expediteur.versEliott);
  });

  it("laisse l'environnement surcharger l'expéditeur et le destinataire", () => {
    poserSmtp();
    process.env.CONTACT_FROM_EMAIL = "Autre Nom <bonjour@exemple.test>";
    process.env.CONTACT_TO_EMAIL = "boite@exemple.test";
    const resolution = resoudreExpediteur();

    expect(resolution.expediteur.de).toBe("Autre Nom <bonjour@exemple.test>");
    expect(resolution.expediteur.versEliott).toBe("boite@exemple.test");
  });
});
