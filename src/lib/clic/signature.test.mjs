import { describe, expect, it } from "bun:test";
import {
  creerThrottleClic,
  DESTINATION_BUSTE,
  DESTINATION_CLIC,
  DESTINATION_CLIC_LOGICIEL,
  DESTINATION_OUVERTURE,
  estRobotProbable,
  idClicValide,
  nettoyerNavigateur,
  ouvertureRobotProbable,
  traiterClic,
  traiterClicSuivi,
  traiterOuverture,
  URL_COCKPIT_CLICS,
  urlCockpitOffre,
} from "./signature.ts";

/**
 * Deux autres programmes lisent ce contrat : le pipeline de prospection génère
 * les identifiants, le cockpit (`admin.eliottbouquerel.fr`) reçoit les clics.
 * L'URL, les en-têtes, le corps et la destination sont donc figés ici au
 * caractère près. Changer l'un d'eux sans changer l'autre côté casse le suivi
 * en silence.
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

describe("creerThrottleClic", () => {
  for (const robot of [false, true]) {
    const qui = robot ? "robots" : "humains";

    it(`${qui} : un enregistrement par identifiant toutes les dix minutes`, () => {
      const throttle = creerThrottleClic();
      expect(throttle.autoriser("abc", T0, robot)).toBe(true);
      expect(throttle.autoriser("abc", T0 + 9 * MINUTE, robot)).toBe(false);
      expect(throttle.autoriser("autre", T0 + 9 * MINUTE, robot)).toBe(true);
      expect(throttle.autoriser("abc", T0 + 10 * MINUTE + 1, robot)).toBe(true);
    });

    it(`${qui} : trente enregistrements par heure au total, puis plus rien`, () => {
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

const URL_COCKPIT = "https://admin.eliottbouquerel.fr/api/clics";
const UA_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

/**
 * Dépendances factices : on capture ce que la route planifie et ce qui part
 * vers le cockpit. `repondre` fabrique la réponse (ou lève) à chaque appel.
 */
function banc(options = {}) {
  // `in` et non une valeur par défaut : `jeton: undefined` doit rester absent.
  const jeton = "jeton" in options ? options.jeton : "jeton-de-test";
  const repondre =
    options.repondre ?? (async () => new Response(null, { status: 201 }));
  const planifies = [];
  const appels = [];
  const deps = {
    planifier: (tache) => planifies.push(tache),
    jeton: () => jeton,
    envoyer: async (url, init) => {
      appels.push({ url, init });
      return repondre();
    },
    throttle: creerThrottleClic(),
    maintenantMs: () => T0,
  };
  return { deps, planifies, appels };
}

/**
 * Exécute les tâches planifiées en capturant `console.info` et
 * `console.error`. Aucune ne doit lever.
 */
async function executer(planifies) {
  const journal = { info: [], erreur: [] };
  const { info, error } = console;
  console.info = (...args) => journal.info.push(args.join(" "));
  console.error = (...args) => journal.erreur.push(args.join(" "));
  try {
    for (const tache of planifies) {
      await expect(tache()).resolves.toBeUndefined();
    }
  } finally {
    console.info = info;
    console.error = error;
  }
  return journal;
}

function requete(methode, ua = UA_SAFARI) {
  const headers = ua === null ? {} : { "user-agent": ua };
  return new Request("http://localhost/r/x", { method: methode, headers });
}

const DESTINATION_ATTENDUE =
  "https://eliottbouquerel.fr/rdv?sujet=autre&utm_source=email&utm_medium=signature&utm_campaign=prospection";

function verifierRedirection(reponse) {
  expect(reponse.status).toBe(302);
  expect(reponse.headers.get("location")).toBe(DESTINATION_ATTENDUE);
  expect(reponse.headers.get("cache-control")).toBe("no-store");
  expect(reponse.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  expect(reponse.headers.get("referrer-policy")).toBe("no-referrer");
}

describe("traiterClic : redirection", () => {
  it("la destination est fixe, sur l'hôte canonique, sans dépendre de l'environnement", () => {
    expect(DESTINATION_CLIC).toBe(DESTINATION_ATTENDUE);
    expect(new URL(DESTINATION_CLIC).host).toBe("eliottbouquerel.fr");
  });

  it("GET valide : 302 immédiat, l'appel au cockpit part après la réponse", async () => {
    const { deps, planifies, appels } = banc();
    verifierRedirection(traiterClic(requete("GET"), "dupont-plomberie", deps));
    expect(planifies).toHaveLength(1);
    expect(appels).toHaveLength(0);
    await executer(planifies);
    expect(appels).toHaveLength(1);
  });

  it("identifiant invalide : 302 sans appel", async () => {
    const { deps, planifies, appels } = banc();
    verifierRedirection(traiterClic(requete("GET"), "AB CD", deps));
    expect(planifies).toHaveLength(0);
    await executer(planifies);
    expect(appels).toHaveLength(0);
  });

  it("HEAD : 302 sans appel", async () => {
    const { deps, planifies, appels } = banc();
    verifierRedirection(traiterClic(requete("HEAD"), "dupont-plomberie", deps));
    expect(planifies).toHaveLength(0);
    await executer(planifies);
    expect(appels).toHaveLength(0);
  });

  it("second clic dans les dix minutes : 302 sans second appel", async () => {
    const { deps, planifies, appels } = banc();
    traiterClic(requete("GET"), "abc", deps);
    verifierRedirection(traiterClic(requete("GET"), "abc", deps));
    expect(planifies).toHaveLength(1);
    await executer(planifies);
    expect(appels).toHaveLength(1);
  });
});

describe("traiterClic : appel au cockpit", () => {
  it("URL, méthode, en-têtes et corps exacts", async () => {
    const { deps, planifies, appels } = banc();
    traiterClic(requete("GET"), "dupont-plomberie", deps);
    await executer(planifies);

    const { url, init } = appels[0];
    expect(url).toBe(URL_COCKPIT);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      authorization: "Bearer jeton-de-test",
      "content-type": "application/json",
    });
    expect(init.body).toBe(
      JSON.stringify({
        id: "dupont-plomberie",
        cliqueLe: new Date(T0).toISOString(),
        navigateur: UA_SAFARI,
        robotProbable: false,
      }),
    );
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  async function corpsEnvoye(headers) {
    const { deps, planifies, appels } = banc();
    const req = new Request("http://localhost/r/x", {
      method: "GET",
      headers: { "user-agent": UA_SAFARI, ...headers },
    });
    traiterClic(req, "dupont-plomberie", deps);
    await executer(planifies);
    return JSON.parse(appels[0].init.body);
  }

  it("ip : premier élément de x-forwarded-for", async () => {
    const corps = await corpsEnvoye({ "x-forwarded-for": "203.0.113.9, 10.0.0.2" });
    expect(corps.ip).toBe("203.0.113.9");
    expect("eliott" in corps).toBe(false);
  });

  it("sans x-forwarded-for ni cookie : ni ip ni eliott", async () => {
    const corps = await corpsEnvoye({});
    expect("ip" in corps).toBe(false);
    expect("eliott" in corps).toBe(false);
  });

  it("x-forwarded-for vide : pas d'ip", async () => {
    const corps = await corpsEnvoye({ "x-forwarded-for": " , 10.0.0.2" });
    expect("ip" in corps).toBe(false);
  });

  it("cookie suivi-eliott=1 : eliott vaut true", async () => {
    const corps = await corpsEnvoye({ cookie: "a=b; suivi-eliott=1; c=d" });
    expect(corps.eliott).toBe(true);
  });

  it("autre valeur ou autre cookie : eliott omis", async () => {
    for (const cookie of ["suivi-eliott=0", "xsuivi-eliott=1", "a=b"]) {
      const corps = await corpsEnvoye({ cookie });
      expect("eliott" in corps).toBe(false);
    }
  });

  it("l'URL est une constante littérale sur le cockpit", () => {
    expect(URL_COCKPIT_CLICS).toBe(URL_COCKPIT);
  });

  it("robot probable : robotProbable vaut true, navigateur nettoyé", async () => {
    const { deps, planifies, appels } = banc();
    traiterClic(requete("GET", "Microsoft SafeLinks\tX"), "abc", deps);
    await executer(planifies);
    const corps = JSON.parse(appels[0].init.body);
    expect(corps.robotProbable).toBe(true);
    expect(corps.navigateur).toBe("Microsoft SafeLinks X");
  });

  it("user-agent absent : robot probable, navigateur vide", async () => {
    const { deps, planifies, appels } = banc();
    traiterClic(requete("GET", null), "abc", deps);
    await executer(planifies);
    const corps = JSON.parse(appels[0].init.body);
    expect(corps.robotProbable).toBe(true);
    expect(corps.navigateur).toBe("");
  });

  it("navigateur tronqué à 300 caractères", async () => {
    const { deps, planifies, appels } = banc();
    traiterClic(requete("GET", "x".repeat(500)), "abc", deps);
    await executer(planifies);
    expect(JSON.parse(appels[0].init.body).navigateur).toHaveLength(300);
  });

  it("un robot puis un humain sur le même identifiant : deux appels", async () => {
    const { deps, planifies, appels } = banc();
    traiterClic(requete("GET", "Microsoft SafeLinks"), "abc", deps);
    traiterClic(requete("GET"), "abc", deps);
    await executer(planifies);
    expect(appels.map((a) => JSON.parse(a.init.body).robotProbable)).toEqual([
      true,
      false,
    ]);
  });

  it("CLIC_TOKEN absent : aucun appel, non_configure journalisé", async () => {
    for (const jeton of [undefined, "", "   "]) {
      const { deps, planifies, appels } = banc({ jeton });
      verifierRedirection(traiterClic(requete("GET"), "abc", deps));
      const journal = await executer(planifies);
      expect(appels).toHaveLength(0);
      expect(journal.erreur).toEqual(["[clic] abc non_configure"]);
      expect(journal.info).toEqual([]);
    }
  });

  for (const [statut, corps] of [
    [201, { statut: "cree" }],
    [200, { statut: "deja_enregistre" }],
    [404, { erreur: "envoi_inconnu" }],
  ]) {
    it(`${statut} : issue normale, journalisée en info, aucune erreur`, async () => {
      const { deps, planifies } = banc({
        repondre: async () => Response.json(corps, { status: statut }),
      });
      traiterClic(requete("GET"), "abc", deps);
      const journal = await executer(planifies);
      expect(journal.erreur).toEqual([]);
      expect(journal.info).toEqual([`[clic] abc ${statut}`]);
    });
  }

  for (const statut of [401, 503, 500, 400]) {
    it(`${statut} : journalisé en erreur, sans exception`, async () => {
      const { deps, planifies } = banc({
        repondre: async () => new Response("{}", { status: statut }),
      });
      traiterClic(requete("GET"), "abc", deps);
      const journal = await executer(planifies);
      expect(journal.info).toEqual([]);
      expect(journal.erreur).toEqual([`[clic] abc ${statut}`]);
    });
  }

  it("timeout : journalisé en erreur, sans exception", async () => {
    const { deps, planifies } = banc({
      repondre: async () => {
        throw new DOMException("délai dépassé", "TimeoutError");
      },
    });
    traiterClic(requete("GET"), "abc", deps);
    const journal = await executer(planifies);
    expect(journal.erreur).toEqual(["[clic] abc timeout"]);
  });

  it("erreur réseau : journalisée en erreur, sans exception", async () => {
    const { deps, planifies } = banc({
      repondre: async () => {
        throw new TypeError("fetch failed");
      },
    });
    traiterClic(requete("GET"), "abc", deps);
    const journal = await executer(planifies);
    expect(journal.erreur).toEqual(["[clic] abc reseau"]);
  });

  it("le journal ne contient ni le jeton ni le navigateur", async () => {
    const { deps, planifies } = banc({
      repondre: async () => new Response(null, { status: 401 }),
    });
    traiterClic(requete("GET", "Mozilla/5.0 Signe-Distinctif"), "abc", deps);
    const journal = await executer(planifies);
    const tout = [...journal.info, ...journal.erreur].join("\n");
    expect(tout).not.toContain("jeton-de-test");
    expect(tout).not.toContain("Signe-Distinctif");
  });
});

describe("traiterOuverture : portrait de la signature", () => {
  function requeteLogo(methode, ua = UA_SAFARI) {
    const headers = ua === null ? {} : { "user-agent": ua };
    return new Request("http://localhost/o/x", { method: methode, headers });
  }

  it("redirige toujours vers le portrait fixe, sans cache", async () => {
    const { deps, planifies } = banc();
    const reponse = traiterOuverture(requeteLogo("GET"), "dupont-plomberie", deps);
    expect(reponse.status).toBe(302);
    expect(reponse.headers.get("location")).toBe("https://eliottbouquerel.fr/images/eliott-bouquerel-avatar.jpg");
    expect(DESTINATION_OUVERTURE).toBe("https://eliottbouquerel.fr/images/eliott-bouquerel-avatar.jpg");
    expect(reponse.headers.get("cache-control")).toBe("no-store");
    expect(planifies).toHaveLength(1);
  });

  it("sert le buste de la carte de visite sur ?forme=buste, et rien d'autre de la requête", async () => {
    const { deps, planifies } = banc();
    const buste = traiterOuverture(new Request("http://localhost/o/x?forme=buste"), "dupont-plomberie", deps);
    expect(buste.headers.get("location")).toBe("https://eliottbouquerel.fr/images/eliott-carte.png");
    expect(DESTINATION_BUSTE).toBe("https://eliottbouquerel.fr/images/eliott-carte.png");
    expect(planifies).toHaveLength(1);
    const autre = traiterOuverture(new Request("http://localhost/o/x?forme=https://ailleurs.example"), "dupont-plomberie", deps);
    expect(autre.headers.get("location")).toBe(DESTINATION_OUVERTURE);
  });

  it("corps du clic plus nature ouverture, sur la même URL du cockpit", async () => {
    const { deps, planifies, appels } = banc();
    traiterOuverture(requeteLogo("GET"), "dupont-plomberie", deps);
    const journal = await executer(planifies);
    expect(appels[0].url).toBe(URL_COCKPIT);
    expect(appels[0].init.body).toBe(
      JSON.stringify({
        id: "dupont-plomberie",
        cliqueLe: new Date(T0).toISOString(),
        navigateur: UA_SAFARI,
        robotProbable: false,
        nature: "ouverture",
      }),
    );
    expect(journal.info).toEqual(["[ouverture] dupont-plomberie 201"]);
  });

  it("le relais d'Apple Mail (« Mozilla/5.0 » seul) est un robot probable", async () => {
    expect(ouvertureRobotProbable("Mozilla/5.0")).toBe(true);
    expect(ouvertureRobotProbable(UA_SAFARI)).toBe(false);
    const gmail = "Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)";
    expect(ouvertureRobotProbable(gmail)).toBe(false);
    const { deps, planifies, appels } = banc();
    traiterOuverture(requeteLogo("GET", "Mozilla/5.0"), "abc", deps);
    await executer(planifies);
    expect(JSON.parse(appels[0].init.body).robotProbable).toBe(true);
  });

  it("HEAD et identifiant invalide : image servie, aucun appel", () => {
    const { deps, planifies } = banc();
    expect(traiterOuverture(requeteLogo("HEAD"), "abc", deps).status).toBe(302);
    expect(traiterOuverture(requeteLogo("GET"), "AB CD", deps).status).toBe(302);
    expect(planifies).toHaveLength(0);
  });

  it("le corps d'un clic ne porte pas de nature", async () => {
    const { deps, planifies, appels } = banc();
    traiterClic(requete("GET"), "abc", deps);
    await executer(planifies);
    expect(JSON.parse(appels[0].init.body)).not.toHaveProperty("nature");
  });
});

describe("traiterClicSuivi : l'offre du mail choisit le formulaire", () => {
  const offre = (corps) => async () => Response.json(corps);
  const DESTINATION_LOGICIEL =
    "https://eliottbouquerel.fr/rdv?sujet=logiciel&utm_source=email&utm_medium=signature&utm_campaign=prospection";

  it("destinations littérales, sur l'hôte canonique", () => {
    expect(DESTINATION_CLIC_LOGICIEL).toBe(DESTINATION_LOGICIEL);
    expect(urlCockpitOffre("abc")).toBe("https://admin.eliottbouquerel.fr/api/clics/abc/offre");
  });

  it("offre logiciel : 302 vers le formulaire logiciel, jeton porteur, clic toujours enregistré", async () => {
    const { deps, planifies, appels } = banc({ repondre: offre({ offre: "logiciel" }) });
    const reponse = await traiterClicSuivi(requete("GET"), "starsnett-96c9bc", deps);
    expect(reponse.status).toBe(302);
    expect(reponse.headers.get("location")).toBe(DESTINATION_LOGICIEL);
    expect(reponse.headers.get("cache-control")).toBe("no-store");
    expect(appels).toHaveLength(1);
    expect(appels[0].url).toBe("https://admin.eliottbouquerel.fr/api/clics/starsnett-96c9bc/offre");
    expect(appels[0].init.method).toBe("GET");
    expect(appels[0].init.headers.authorization).toBe("Bearer jeton-de-test");
    expect(planifies).toHaveLength(1);
  });

  it("offre découverte : 302 vers la découverte", async () => {
    const { deps } = banc({ repondre: offre({ offre: "decouverte" }) });
    const reponse = await traiterClicSuivi(requete("GET"), "abc", deps);
    expect(reponse.headers.get("location")).toBe(DESTINATION_ATTENDUE);
  });

  it("cockpit en panne, identifiant inconnu, réponse illisible ou autre offre : la découverte", async () => {
    const cas = [
      async () => new Response(null, { status: 404 }),
      async () => new Response(null, { status: 503 }),
      async () => new Response("pas du json", { status: 200 }),
      offre(null),
      offre({ offre: "ia" }),
      async () => {
        throw new Error("réseau");
      },
      async () => {
        throw new DOMException("délai", "TimeoutError");
      },
    ];
    for (const repondre of cas) {
      const { deps } = banc({ repondre });
      const reponse = await traiterClicSuivi(requete("GET"), "abc", deps);
      expect(reponse.status).toBe(302);
      expect(reponse.headers.get("location")).toBe(DESTINATION_ATTENDUE);
    }
  });

  it("HEAD : même destination que le GET, sans enregistrer de clic", async () => {
    const { deps, planifies, appels } = banc({ repondre: offre({ offre: "logiciel" }) });
    const reponse = await traiterClicSuivi(requete("HEAD"), "abc", deps);
    expect(reponse.headers.get("location")).toBe(DESTINATION_LOGICIEL);
    expect(appels).toHaveLength(1);
    expect(planifies).toHaveLength(0);
  });

  it("identifiant invalide ou jeton absent : la découverte, sans interroger le cockpit", async () => {
    for (const [methode, id, options] of [
      ["GET", "AB CD", {}],
      ["GET", "abc", { jeton: undefined }],
      ["GET", "abc", { jeton: "  " }],
    ]) {
      const { deps, appels } = banc({ ...options, repondre: offre({ offre: "logiciel" }) });
      const reponse = await traiterClicSuivi(requete(methode), id, deps);
      expect(reponse.headers.get("location")).toBe(DESTINATION_ATTENDUE);
      expect(appels).toHaveLength(0);
    }
  });

  it("mémoire des offres : le second clic ne rappelle pas le cockpit, la mémoire se vide à 2 000 entrées", async () => {
    const { deps, appels } = banc({ repondre: offre({ offre: "logiciel" }) });
    const memoireOffres = new Map();
    const avecMemoire = { ...deps, memoireOffres };
    await traiterClicSuivi(requete("GET"), "abc", avecMemoire);
    const second = await traiterClicSuivi(requete("GET"), "abc", avecMemoire);
    expect(second.headers.get("location")).toBe(DESTINATION_LOGICIEL);
    expect(appels).toHaveLength(1);

    for (let i = 0; i < 2_000; i++) memoireOffres.set(`plein-${i}`, "decouverte");
    await traiterClicSuivi(requete("GET"), "nouveau", avecMemoire);
    expect(memoireOffres.size).toBe(1);
    expect(memoireOffres.get("nouveau")).toBe("logiciel");
  });

  it("une panne n'entre pas dans la mémoire : le clic suivant réessaie", async () => {
    const { deps, appels } = banc({ repondre: async () => new Response(null, { status: 503 }) });
    const memoireOffres = new Map();
    await traiterClicSuivi(requete("GET"), "abc", { ...deps, memoireOffres });
    await traiterClicSuivi(requete("GET"), "abc", { ...deps, memoireOffres });
    expect(appels).toHaveLength(2);
    expect(memoireOffres.size).toBe(0);
  });
});
