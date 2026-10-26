import { afterAll, afterEach, describe, expect, it } from "bun:test";

/* Copie propre du module : `bun test` partage les modules entre fichiers, et
   le singleton du SDK a pu être démarré par un test de composant. */
const mesure = await import("./posthog?regimes");

/* La clé de `config.ts` est figée à son chargement, souvent vide en test :
   elle est passée explicitement. */
const CLE = "phc_test";

/**
 * Faux SDK : il enregistre chaque appel. Le vrai `posthog-js` ne tourne pas
 * hors navigateur, et c'est le contrat entre le site et lui qu'on vérifie ici.
 */
function fauxSdk() {
  const appels = [];
  const note =
    (nom) =>
    (...args) => {
      appels.push([nom, ...args]);
    };
  const sdk = {
    appels,
    config: null,
    init(cle, config) {
      sdk.config = config;
      appels.push(["init", cle]);
    },
    set_config: note("set_config"),
    opt_in_capturing: note("opt_in_capturing"),
    opt_out_capturing: note("opt_out_capturing"),
    reset: note("reset"),
    startSessionRecording: note("startSessionRecording"),
    stopSessionRecording: note("stopSessionRecording"),
    capture: note("capture"),
    identify: note("identify"),
  };
  return sdk;
}

function navigateur(navigator = {}, extra = {}) {
  globalThis.window = { navigator, location: { protocol: "https:" }, ...extra };
}

/* Sans consentement, seuls la vue de page et la trace du choix partent : c'est
   le périmètre annoncé dans la politique de confidentialité. */
describe("filtreSansConsentement, sans consentement", () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it("laisse partir la vue de page et la trace du choix", () => {
    expect(mesure.filtreSansConsentement({ event: "$pageview" })).toEqual({
      event: "$pageview",
    });
    expect(mesure.filtreSansConsentement({ event: "consent_updated" })).toEqual({
      event: "consent_updated",
    });
  });

  it("jette la lecture, les clics et le rejeu", () => {
    for (const event of [
      "$pageleave",
      "$autocapture",
      "$$heatmap",
      "$snapshot",
      "$web_vitals",
      "section_viewed",
      "scroll_depth_reached",
    ]) {
      expect(mesure.filtreSansConsentement({ event })).toBeNull();
    }
  });

  it("ne laisse rien partir quand le navigateur signale « Ne pas suivre »", () => {
    navigateur({ doNotTrack: "1" });
    expect(mesure.filtreSansConsentement({ event: "$pageview" })).toBeNull();
  });

  it("lit aussi l'ancien signal porté par la fenêtre", () => {
    navigateur({}, { doNotTrack: "1" });
    expect(mesure.filtreSansConsentement({ event: "$pageview" })).toBeNull();
  });

  it("ne laisse rien partir avec Global Privacy Control", () => {
    navigateur({ globalPrivacyControl: true });
    expect(mesure.filtreSansConsentement({ event: "$pageview" })).toBeNull();
  });

  it("laisse passer un navigateur sans signal", () => {
    navigateur({ doNotTrack: "0", globalPrivacyControl: false });
    expect(mesure.filtreSansConsentement({ event: "$pageview" })).toEqual({
      event: "$pageview",
    });
  });

  it("laisse passer un envoi déjà annulé", () => {
    expect(mesure.filtreSansConsentement(null)).toBeNull();
  });
});

/*
 * Parcours complet d'un visiteur sur UNE instance : le SDK est un singleton,
 * l'ordre des étapes est donc celui d'une vraie visite.
 */
describe("startAnalytics, les deux régimes", () => {
  const sdk = fauxSdk();
  const charger = async () => ({ default: sdk });
  const refus = { analytics: false, replay: false };
  const accord = { analytics: true, replay: true };

  afterEach(() => {
    sdk.appels.length = 0;
  });

  /* Le faux `window` ne doit jamais survivre à ce fichier : d'autres tests
     vérifient le rendu serveur. */
  afterAll(() => {
    delete globalThis.window;
  });

  it("ne démarre rien sans clé configurée", async () => {
    navigateur();
    expect(await mesure.startAnalytics(refus, charger, "")).toBeNull();
    expect(sdk.appels).toEqual([]);
  });

  it("ne démarre rien hors navigateur", async () => {
    delete globalThis.window;
    expect(await mesure.startAnalytics(refus, charger, CLE)).toBeNull();
    expect(sdk.appels).toEqual([]);
  });

  it("ne démarre rien quand « Ne pas suivre » est actif et sans accord", async () => {
    navigateur({ doNotTrack: "1" });
    expect(await mesure.startAnalytics(refus, charger, CLE)).toBeNull();
    expect(sdk.appels).toEqual([]);
  });

  it("sans réponse, démarre en comptage sans cookie, filtre posé", async () => {
    navigateur();
    const vus = [];
    const desabonner = mesure.subscribeAnalytics(() => vus.push(1));
    expect(await mesure.startAnalytics(refus, charger, CLE)).toBe(sdk);
    desabonner();

    expect(sdk.appels).toEqual([["init", "phc_test"]]);
    expect(sdk.config.cookieless_mode).toBe("on_reject");
    expect(sdk.config.opt_out_capturing_by_default).toBe(true);
    expect(sdk.config.disable_session_recording).toBe(true);
    expect(sdk.config.before_send).toBe(mesure.filtreSansConsentement);
    expect(mesure.getAnalyticsSnapshot()).toBe(true);
    expect(mesure.getRegimeSnapshot()).toBe("sans-cookie");
    expect(vus.length).toBe(1);
  });

  it("un second appel réutilise l'instance et garde le rejeu coupé", async () => {
    expect(await mesure.startAnalytics(refus, charger, CLE)).toBe(sdk);
    expect(sdk.appels).toEqual([["stopSessionRecording"]]);
  });

  it("refuse le rejeu et l'identification tant que rien n'est accepté", () => {
    mesure.setReplayEnabled(true);
    mesure.identifyVisitor("prospect@example.com");
    expect(sdk.appels).toEqual([["stopSessionRecording"]]);
  });

  it("à l'accord, passe en mesure complète et publie le régime après", async () => {
    const regimes = [];
    const desabonner = mesure.subscribeAnalytics(() =>
      regimes.push(mesure.getRegimeSnapshot()),
    );
    expect(await mesure.startAnalytics(accord, charger, CLE)).toBe(sdk);
    desabonner();

    expect(sdk.appels).toEqual([
      ["set_config", { disable_persistence: false, disable_cookie: false }],
      ["opt_in_capturing", { captureEventName: false }],
      ["startSessionRecording"],
    ]);
    expect(regimes).toEqual(["complet"]);
    /* Une fois l'accord donné, tout passe le filtre. */
    expect(mesure.filtreSansConsentement({ event: "$autocapture" })).toEqual({
      event: "$autocapture",
    });
  });

  it("à la révocation, repasse sans cookie et efface ce qui a été posé", async () => {
    expect(await mesure.startAnalytics(refus, charger, CLE)).toBe(sdk);
    expect(sdk.appels).toEqual([
      ["stopSessionRecording"],
      ["opt_out_capturing"],
      ["set_config", { disable_persistence: true, disable_cookie: true }],
      ["reset", true],
      ["stopSessionRecording"],
    ]);
    expect(mesure.getRegimeSnapshot()).toBe("sans-cookie");
    expect(mesure.filtreSansConsentement({ event: "$autocapture" })).toBeNull();
  });

  it("une révocation qui échoue côté SDK n'empêche pas la purge", async () => {
    await mesure.startAnalytics(accord, charger, CLE);
    sdk.appels.length = 0;
    const opt = sdk.opt_out_capturing;
    sdk.opt_out_capturing = () => {
      throw new Error("SDK à moitié initialisé");
    };
    try {
      expect(await mesure.startAnalytics(refus, charger, CLE)).toBe(sdk);
    } finally {
      sdk.opt_out_capturing = opt;
    }
    expect(mesure.getRegimeSnapshot()).toBe("sans-cookie");
  });

  it("un accord répété ne republie pas le régime", async () => {
    await mesure.startAnalytics(accord, charger, CLE);
    const vus = [];
    const desabonner = mesure.subscribeAnalytics(() => vus.push(1));
    await mesure.startAnalytics(accord, charger, CLE);
    desabonner();
    expect(vus).toEqual([]);
    expect(mesure.getRegimeSnapshot()).toBe("complet");
  });

  it("le rendu serveur voit toujours le régime sans cookie", () => {
    expect(mesure.getRegimeServerSnapshot()).toBe("sans-cookie");
  });
});

describe("startAnalytics, visiteur qui revient déjà consentant", () => {
  it("bascule en mesure complète dès le démarrage", async () => {
    /* Instance neuve du module : le singleton du bloc précédent est déjà
       démarré. */
    const neuf = await import("./posthog?revenant");
    navigateur();
    const sdk = fauxSdk();
    await neuf.startAnalytics(
      { analytics: true, replay: false },
      async () => ({ default: sdk }),
      CLE,
    );
    expect(sdk.config.disable_session_recording).toBe(true);
    expect(sdk.appels.map(([nom]) => nom)).toEqual([
      "init",
      "set_config",
      "opt_in_capturing",
    ]);
    expect(neuf.getRegimeSnapshot()).toBe("complet");
    neuf.identifyVisitor("Prospect@Example.com ");
    expect(sdk.appels.at(-1)).toEqual([
      "identify",
      "prospect@example.com",
      { email: "prospect@example.com" },
    ]);
  });

  afterAll(() => {
    delete globalThis.window;
  });
});

describe("startAnalytics, chargement réel du SDK", () => {
  afterAll(() => {
    delete globalThis.window;
  });

  it("charge posthog-js à la demande, sans casser hors navigateur réel", async () => {
    const neuf = await import("./posthog?reel");
    navigateur();
    /* Le vrai SDK s'initialise sur un faux navigateur : il démarre ou échoue,
       et dans les deux cas le site ne lève rien. */
    const resultat = await neuf.startAnalytics(
      { analytics: false, replay: false },
      undefined,
      CLE,
    );
    expect(resultat === null || typeof resultat.capture === "function").toBe(true);
  });
});
