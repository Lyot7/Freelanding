import { describe, expect, it } from "bun:test";
import {
  composerNotificationClic,
  creerThrottleClic,
  DESTINATION_CLIC,
  estRobotProbable,
  idClicValide,
  nettoyerNavigateur,
  traiterClic,
} from "./signature.ts";

/**
 * Le contrat de cette route est lu par un autre programme : le pipeline de
 * prospection génère les identifiants et parse le corps de la notification.
 * Les libellés, le sujet et la destination sont donc figés ici au caractère
 * près. Changer l'un d'eux sans changer le pipeline casse le suivi en silence.
 */

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

describe("idClicValide", () => {
  it("accepte minuscules, chiffres et tirets, de 3 à 80 caractères", () => {
    expect(idClicValide("abc")).toBe(true);
    expect(idClicValide("dupont-plomberie-2026-09-11")).toBe(true);
    expect(idClicValide("a".repeat(80))).toBe(true);
  });

  it("refuse le reste", () => {
    expect(idClicValide("ab")).toBe(false);
    expect(idClicValide("a".repeat(81))).toBe(false);
    expect(idClicValide("AB-CD")).toBe(false);
    expect(idClicValide("ab cd")).toBe(false);
    expect(idClicValide("ab_cd")).toBe(false);
    expect(idClicValide("abc\n")).toBe(false);
    expect(idClicValide("../etc")).toBe(false);
    expect(idClicValide("")).toBe(false);
  });
});

describe("estRobotProbable", () => {
  it("signale un user-agent vide ou absent", () => {
    expect(estRobotProbable("")).toBe(true);
    expect(estRobotProbable("   ")).toBe(true);
    expect(estRobotProbable(null)).toBe(true);
  });

  it("signale les scanners de messagerie et les clients HTTP", () => {
    for (const ua of [
      "Googlebot/2.1",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "Some Crawler",
      "spider",
      "Slack link preview",
      "Barracuda Sentinel",
      "Microsoft SafeLinks",
      "Proofpoint URL Defense",
      "Mimecast",
      "HeadlessChrome/120",
      "python-requests/2.31",
      "curl/8.4.0",
      "Wget/1.21",
      "Go-http-client/1.1",
      "Java/17.0.2",
      "URL Scanner",
    ]) {
      expect(estRobotProbable(ua)).toBe(true);
    }
  });

  it("laisse passer un navigateur ordinaire", () => {
    expect(
      estRobotProbable(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
      ),
    ).toBe(false);
    // « JavaScript » ne doit pas être pris pour le client HTTP Java.
    expect(estRobotProbable("Mozilla/5.0 JavaScript enabled")).toBe(false);
  });
});

describe("nettoyerNavigateur", () => {
  it("met la valeur sur une ligne et la tronque à 300 caractères", () => {
    expect(nettoyerNavigateur("a\r\nb\nc")).toBe("a b c");
    expect(nettoyerNavigateur("x".repeat(500))).toHaveLength(300);
    expect(nettoyerNavigateur(null)).toBe("");
    expect(nettoyerNavigateur("python-requests/2.31")).toBe("python-requests/2.31");
  });

  it("retire aussi les contrôles C1 et les séparateurs de ligne Unicode", () => {
    expect(nettoyerNavigateur("a\u0085b\u2028c\u2029d\u009Fe")).toBe("a b c d e");
    expect(nettoyerNavigateur(`${"x".repeat(299)}\u2028yyy`)).toHaveLength(300);
  });
});

describe("composerNotificationClic", () => {
  it("produit le sujet et les quatre lignes exactes", () => {
    const message = composerNotificationClic({
      id: "dupont-plomberie",
      maintenantMs: T0,
      userAgent: "Mozilla/5.0 Safari",
    });
    expect(message.sujet).toBe("Clic signature : dupont-plomberie");
    expect(message.texte).toBe(
      [
        "Identifiant : dupont-plomberie",
        `Date : ${new Date(T0).toISOString()}`,
        "Navigateur : Mozilla/5.0 Safari",
        "Robot probable : non",
      ].join("\n"),
    );
  });

  it("échappe le HTML et nettoie le navigateur", () => {
    const message = composerNotificationClic({
      id: "abc",
      maintenantMs: T0,
      userAgent: "<script>alert(1)</script>\ncurl",
    });
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.html).toContain("<p>Robot probable : oui</p>");
    expect(message.texte).toContain(
      "Navigateur : <script>alert(1)</script> curl",
    );
  });
});

describe("creerThrottleClic", () => {
  for (const robot of [false, true]) {
    const qui = robot ? "robots" : "humains";

    it(`${qui} : une notification par identifiant toutes les dix minutes`, () => {
      const throttle = creerThrottleClic();
      expect(throttle.autoriser("abc", T0, robot)).toBe(true);
      expect(throttle.autoriser("abc", T0 + 9 * MINUTE, robot)).toBe(false);
      expect(throttle.autoriser("autre", T0 + 9 * MINUTE, robot)).toBe(true);
      expect(throttle.autoriser("abc", T0 + 10 * MINUTE + 1, robot)).toBe(true);
    });

    it(`${qui} : trente notifications par heure au total, puis plus rien`, () => {
      const throttle = creerThrottleClic();
      for (let i = 0; i < 30; i += 1) {
        expect(throttle.autoriser(`id-${i}`, T0 + i, robot)).toBe(true);
      }
      expect(throttle.autoriser("id-30", T0 + 30, robot)).toBe(false);
      expect(throttle.autoriser("id-31", T0 + 60 * MINUTE + 1, robot)).toBe(true);
    });
  }

  it("le plafond global atteint ne consomme pas l'identifiant", () => {
    const throttle = creerThrottleClic();
    for (let i = 0; i < 30; i += 1) throttle.autoriser(`id-${i}`, T0, false);
    expect(throttle.autoriser("abc", T0 + 59 * MINUTE, false)).toBe(false);
    // Le plafond se libère à T0 + 60 min. Si le refus avait enregistré « abc »,
    // il resterait bloqué jusqu'à T0 + 69 min.
    expect(throttle.autoriser("abc", T0 + 60 * MINUTE + 1, false)).toBe(true);
  });

  it("un identifiant refusé ne consomme pas le plafond global", () => {
    const throttle = creerThrottleClic();
    expect(throttle.autoriser("abc", T0, false)).toBe(true);
    for (let i = 0; i < 50; i += 1) {
      expect(throttle.autoriser("abc", T0 + i, false)).toBe(false);
    }
    for (let i = 0; i < 29; i += 1) {
      expect(throttle.autoriser(`id-${i}`, T0 + 100, false)).toBe(true);
    }
  });

  it("un robot ne consomme pas le quota des humains", () => {
    const throttle = creerThrottleClic();
    expect(throttle.autoriser("abc", T0, true)).toBe(true);
    expect(throttle.autoriser("abc", T0 + 1, false)).toBe(true);
    for (let i = 0; i < 40; i += 1) throttle.autoriser(`robot-${i}`, T0 + 2, true);
    expect(throttle.autoriser("humain", T0 + 3, false)).toBe(true);
  });
});

/** Dépendances factices : on capture ce que la route planifie et envoie. */
function banc() {
  const planifies = [];
  const envois = [];
  const deps = {
    planifier: (tache) => planifies.push(tache),
    resoudreExpediteur: () => ({
      ok: true,
      expediteur: {
        nom: "resend",
        de: "Test <de@exemple.test>",
        versEliott: "boite@exemple.test",
        envoyer: async (demande) => {
          envois.push(demande);
          return { ok: true, id: "msg-1" };
        },
      },
    }),
    throttle: creerThrottleClic(),
    maintenantMs: () => T0,
  };
  return { deps, planifies, envois };
}

/** Exécute la tâche en capturant `console.error` ; rend les lignes journalisées. */
async function silencieux(tache) {
  const lignes = [];
  const erreurs = console.error;
  console.error = (...args) => lignes.push(args.join(" "));
  try {
    await expect(tache()).resolves.toBeUndefined();
  } finally {
    console.error = erreurs;
  }
  return lignes;
}

function requete(methode, ua = "Mozilla/5.0 Safari") {
  return new Request("http://localhost/r/x", {
    method: methode,
    headers: { "user-agent": ua },
  });
}

const DESTINATION_ATTENDUE =
  "https://eliottbouquerel.fr/contact?utm_source=email&utm_medium=signature&utm_campaign=prospection";

function verifierRedirection(reponse) {
  expect(reponse.status).toBe(302);
  expect(reponse.headers.get("location")).toBe(DESTINATION_ATTENDUE);
  expect(reponse.headers.get("cache-control")).toBe("no-store");
  expect(reponse.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  expect(reponse.headers.get("referrer-policy")).toBe("no-referrer");
}

describe("traiterClic", () => {
  it("la destination est fixe, sur l'hôte canonique, sans dépendre de l'environnement", () => {
    expect(DESTINATION_CLIC).toBe(DESTINATION_ATTENDUE);
    expect(new URL(DESTINATION_CLIC).host).toBe("eliottbouquerel.fr");
  });

  it("un robot puis un humain sur le même identifiant : deux notifications", async () => {
    const { deps, planifies, envois } = banc();
    traiterClic(requete("GET", "Microsoft SafeLinks"), "abc", deps);
    traiterClic(requete("GET"), "abc", deps);
    expect(planifies).toHaveLength(2);
    await planifies[0]();
    await planifies[1]();
    expect(envois[0].message.texte).toContain("Robot probable : oui");
    expect(envois[1].message.texte).toContain("Robot probable : non");
  });

  it("expéditeur non configuré : rien n'est envoyé, l'échec est journalisé", async () => {
    const { deps, planifies } = banc();
    deps.resoudreExpediteur = () => ({
      ok: false,
      variableManquante: "RESEND_API_KEY",
    });
    traiterClic(requete("GET"), "abc", deps);
    const journal = await silencieux(() => planifies[0]());
    expect(journal).toHaveLength(1);
    expect(journal[0]).toContain("[clic] expediteur_non_configure");
    expect(journal[0]).toContain("RESEND_API_KEY");
  });

  it("envoi refusé par le transport : ne remonte pas, journalisé", async () => {
    const { deps, planifies } = banc();
    deps.resoudreExpediteur = () => ({
      ok: true,
      expediteur: {
        nom: "resend",
        de: "d",
        versEliott: "v",
        envoyer: async () => ({ ok: false, raison: "quota" }),
      },
    });
    traiterClic(requete("GET"), "abc", deps);
    const journal = await silencieux(() => planifies[0]());
    expect(journal).toHaveLength(1);
    expect(journal[0]).toContain("[clic] notification_echouee");
    expect(journal[0]).toContain('"id":"abc"');
  });

  it("GET valide : 302 et une notification planifiée après la réponse", async () => {
    const { deps, planifies, envois } = banc();
    verifierRedirection(traiterClic(requete("GET"), "dupont-plomberie", deps));
    expect(planifies).toHaveLength(1);
    expect(envois).toHaveLength(0);

    await planifies[0]();
    expect(envois).toHaveLength(1);
    expect(envois[0].destinataire).toBe("boite@exemple.test");
    expect(envois[0].message.sujet).toBe("Clic signature : dupont-plomberie");
  });

  it("identifiant invalide : 302 sans notification", () => {
    const { deps, planifies } = banc();
    verifierRedirection(traiterClic(requete("GET"), "AB CD", deps));
    expect(planifies).toHaveLength(0);
  });

  it("HEAD : 302 sans notification", () => {
    const { deps, planifies } = banc();
    verifierRedirection(traiterClic(requete("HEAD"), "dupont-plomberie", deps));
    expect(planifies).toHaveLength(0);
  });

  it("second clic dans les dix minutes : 302 sans notification", () => {
    const { deps, planifies } = banc();
    traiterClic(requete("GET"), "abc", deps);
    verifierRedirection(traiterClic(requete("GET"), "abc", deps));
    expect(planifies).toHaveLength(1);
  });

  it("un envoi qui échoue ou qui lève ne remonte pas", async () => {
    const { deps, planifies } = banc();
    deps.resoudreExpediteur = () => ({
      ok: true,
      expediteur: {
        nom: "smtp",
        de: "d",
        versEliott: "v",
        envoyer: async () => {
          throw new Error("réseau");
        },
      },
    });
    traiterClic(requete("GET"), "abc", deps);
    const erreurs = console.error;
    console.error = () => {};
    try {
      await expect(planifies[0]()).resolves.toBeUndefined();
    } finally {
      console.error = erreurs;
    }
  });
});
