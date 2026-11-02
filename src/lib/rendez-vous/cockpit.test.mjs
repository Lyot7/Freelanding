import { afterEach, describe, expect, it } from "bun:test";
import {
  annulerRendezVous,
  creerReservation,
  deplacerRendezVous,
  estJetonGestion,
  lireGestion,
  obtenirDurees,
  recupererCreneaux,
} from "./cockpit.ts";

/**
 * LE CLIENT DU COCKPIT, fetch simulé. Ce qui compte : le jeton part dans
 * l'en-tête et nulle part ailleurs, les refus du cockpit gardent leur statut
 * et leur code (409 `creneau_pris` surtout), et aucune exception ne sort.
 */

const ENV = { RDV_TOKEN: "jeton-secret", COCKPIT_URL: "https://cockpit.test" };
const JETON = "a".repeat(43);

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

/** Remplace fetch ; chaque appel rend la réponse suivante de la liste. */
function simuler(...reponses) {
  const appels = [];
  globalThis.fetch = async (url, options = {}) => {
    appels.push({ url: String(url), options });
    const suivante = reponses[Math.min(appels.length - 1, reponses.length - 1)];
    if (suivante instanceof Error) throw suivante;
    const [corps, statut = 200] = suivante;
    return new Response(corps === undefined ? "" : JSON.stringify(corps), { status: statut });
  };
  return appels;
}

const TYPES = {
  types: [
    { cle: "logiciel", titre: "Logiciel", durees: [30, 45, 60], defaut: 45 },
    { cle: "decouverte", titre: "Premier échange", durees: [15, 30, 45], defaut: 30 },
  ],
};

const RESERVATION = {
  cible: "logiciel",
  debutUtc: "2026-11-10T09:00:00.000Z",
  duree: 45,
  nom: "Camille Renard",
  email: "camille@exemple.fr",
  telephone: "06 12 34 56 78",
  notes: "Téléphone : 06 12 34 56 78\nBudget : 5 000 €",
  reponses: { budget: "5000-10000" },
};

describe("recupererCreneaux", () => {
  it("interroge le cockpit avec le jeton en en-tête et une fin exclue", async () => {
    const charge = { jours: [{ jour: "2026-11-10", creneaux: ["2026-11-10T09:00:00.000Z"] }] };
    const appels = simuler([charge]);
    const resultat = await recupererCreneaux("logiciel", "2026-11-01", "2026-11-30", 45, ENV);
    expect(resultat).toEqual({ ok: true, donnees: charge });
    const url = new URL(appels[0].url);
    expect(url.origin + url.pathname).toBe("https://cockpit.test/api/rdv/creneaux");
    expect(url.searchParams.get("type")).toBe("logiciel");
    expect(url.searchParams.get("du")).toBe("2026-11-01");
    expect(url.searchParams.get("au")).toBe("2026-12-01");
    expect(url.searchParams.get("duree")).toBe("45");
    expect(url.searchParams.get("fuseau")).toBe("Europe/Paris");
    expect(appels[0].options.headers.authorization).toBe("Bearer jeton-secret");
    expect(appels[0].url).not.toContain("jeton-secret");
  });

  it("rend le refus 503 du cockpit (agenda injoignable) avec son code", async () => {
    simuler([{ erreur: "sans_agenda" }, 503]);
    expect(await recupererCreneaux("logiciel", "2026-11-01", "2026-11-30", undefined, ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 503,
      detail: "sans_agenda",
    });
  });

  it("n’appelle rien sans RDV_TOKEN", async () => {
    const appels = simuler([{}]);
    const resultat = await recupererCreneaux("logiciel", "2026-11-01", "2026-11-30", 45, {});
    expect(resultat).toEqual({ ok: false, raison: "indisponible", detail: "non_configure" });
    expect(appels).toHaveLength(0);
  });

  it("transforme une panne réseau en résultat, jamais en exception", async () => {
    simuler(new TypeError("fetch failed"));
    const resultat = await recupererCreneaux("logiciel", "2026-11-01", "2026-11-30", 45, ENV);
    expect(resultat).toEqual({ ok: false, raison: "indisponible", detail: "TypeError" });
  });
});

describe("obtenirDurees", () => {
  it("lit les durées du type et garde la liste cinq minutes", async () => {
    const env = { ...ENV, COCKPIT_URL: "https://cache.test" };
    const appels = simuler([TYPES]);
    expect(await obtenirDurees("logiciel", 0, env)).toEqual({ options: [30, 45, 60], defaut: 45 });
    expect(await obtenirDurees("decouverte", 1_000, env)).toEqual({ options: [15, 30, 45], defaut: 30 });
    expect(appels).toHaveLength(1);
    expect(appels[0].url).toBe("https://cache.test/api/rdv/types");
    await obtenirDurees("logiciel", 5 * 60 * 1000 + 1, env);
    expect(appels).toHaveLength(2);
  });

  it("rend undefined sur un refus, sans le garder", async () => {
    const env = { ...ENV, COCKPIT_URL: "https://refus.test" };
    let appels = simuler([{ erreur: "jeton_invalide" }, 401]);
    expect(await obtenirDurees("logiciel", 0, env)).toBeUndefined();
    appels = simuler([TYPES]);
    expect(await obtenirDurees("logiciel", 1, env)).toEqual({ options: [30, 45, 60], defaut: 45 });
    expect(appels).toHaveLength(1);
  });
});

describe("creerReservation", () => {
  it("poste la demande et rend l’identifiant du rendez-vous", async () => {
    const appels = simuler([
      { id: "rdv_1", debut: "2026-11-10T09:00:00.000Z", fin: "2026-11-10T09:45:00.000Z", lienMeet: "x", jetonGestion: JETON },
      201,
    ]);
    const resultat = await creerReservation(RESERVATION, ENV);
    expect(resultat).toEqual({ ok: true, donnees: { uid: "rdv_1" } });
    expect(appels[0].url).toBe("https://cockpit.test/api/rdv");
    expect(appels[0].options.method).toBe("POST");
    const corps = JSON.parse(appels[0].options.body);
    expect(corps).toEqual({
      type: "logiciel",
      duree: 45,
      debut: "2026-11-10T09:00:00.000Z",
      nom: "Camille Renard",
      email: "camille@exemple.fr",
      telephone: "06 12 34 56 78",
      notes: RESERVATION.notes,
      reponses: { budget: "5000-10000" },
      fuseau: "Europe/Paris",
    });
    // Le téléphone reste en première ligne des notes.
    expect(corps.notes.split("\n")[0]).toContain("06 12 34 56 78");
  });

  it("prend la durée par défaut du type quand aucune n’est choisie", async () => {
    const env = { ...ENV, COCKPIT_URL: "https://defaut.test" };
    const appels = simuler([TYPES], [{ id: "rdv_2" }, 201]);
    const sansDuree = { ...RESERVATION, duree: undefined };
    expect((await creerReservation(sansDuree, env)).ok).toBe(true);
    expect(JSON.parse(appels[1].options.body).duree).toBe(45);
  });

  it("renonce sans durée connue plutôt que de réserver une durée au hasard", async () => {
    const env = { ...ENV, COCKPIT_URL: "https://sans-types.test" };
    const appels = simuler([{ erreur: "non_configure" }, 503]);
    const resultat = await creerReservation({ ...RESERVATION, duree: undefined }, env);
    expect(resultat).toEqual({ ok: false, raison: "indisponible", detail: "durees_inconnues" });
    expect(appels).toHaveLength(1);
  });

  it("garde le 409 `creneau_pris` pour que la route le traduise", async () => {
    simuler([{ erreur: "creneau_pris" }, 409]);
    expect(await creerReservation(RESERVATION, ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 409,
      detail: "creneau_pris",
    });
  });

  it("rend le 401 d’un jeton refusé", async () => {
    simuler([{ erreur: "jeton_invalide" }, 401]);
    expect(await creerReservation(RESERVATION, ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 401,
      detail: "jeton_invalide",
    });
  });

  it("rend le 503 d’un cockpit sans RDV_TOKEN", async () => {
    simuler([{ erreur: "non_configure" }, 503]);
    expect(await creerReservation(RESERVATION, ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 503,
      detail: "non_configure",
    });
  });

  it("supporte un corps d’erreur illisible (page HTML d’un mandataire)", async () => {
    globalThis.fetch = async () => new Response("<html>502</html>", { status: 502 });
    expect(await creerReservation(RESERVATION, ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 502,
      detail: "",
    });
  });
});

describe("gestion par jeton", () => {
  const RDV = {
    id: "rdv_1",
    type: "logiciel",
    titre: "Explique-moi ton projet de logiciel",
    duree: 45,
    durees: [30, 45, 60],
    debut: "2026-11-10T09:00:00.000Z",
    fin: "2026-11-10T09:45:00.000Z",
    statut: "CONFIRME",
    lienMeet: "https://meet.google.com/abc",
    fuseau: "Europe/Paris",
    nom: "Camille Renard",
  };

  it("reconnaît le format du jeton", () => {
    expect(estJetonGestion(JETON)).toBe(true);
    expect(estJetonGestion("court")).toBe(false);
    expect(estJetonGestion(`${"a".repeat(42)}/`)).toBe(false);
  });

  it("lit le rendez-vous sans garder nom ni lien", async () => {
    const appels = simuler([RDV]);
    const resultat = await lireGestion(JETON, ENV);
    expect(resultat).toEqual({
      ok: true,
      donnees: {
        type: "logiciel",
        titre: RDV.titre,
        duree: 45,
        durees: { options: [30, 45, 60], defaut: 45 },
        debut: RDV.debut,
        fin: RDV.fin,
        statut: "CONFIRME",
      },
    });
    expect(appels[0].url).toBe(`https://cockpit.test/api/rdv/gestion/${JETON}`);
  });

  it("refuse un jeton mal formé sans appeler le cockpit", async () => {
    const appels = simuler([RDV]);
    expect(await lireGestion("../types", ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 404,
      detail: "introuvable",
    });
    expect(appels).toHaveLength(0);
  });

  it("rend le 404 d’un jeton inconnu, et une charge illisible comme une panne", async () => {
    simuler([{ erreur: "introuvable" }, 404]);
    expect((await lireGestion(JETON, ENV)).statut).toBe(404);
    simuler([{ statut: "CONFIRME" }]);
    expect(await lireGestion(JETON, ENV)).toEqual({
      ok: false,
      raison: "indisponible",
      detail: "charge_illisible",
    });
  });

  it("annule avec le motif, et sans motif quand il est vide", async () => {
    const appels = simuler([{ statut: "ANNULE", deja: false }]);
    expect(await annulerRendezVous(JETON, "Empêchement", ENV)).toEqual({ ok: true, donnees: { deja: false } });
    expect(appels[0].url).toBe(`https://cockpit.test/api/rdv/gestion/${JETON}/annuler`);
    expect(JSON.parse(appels[0].options.body)).toEqual({ motif: "Empêchement" });
    await annulerRendezVous(JETON, undefined, ENV);
    expect(JSON.parse(appels[1].options.body)).toEqual({});
  });

  it("déplace et rend le nouveau jeton", async () => {
    const nouveau = "b".repeat(43);
    const appels = simuler([
      { id: "rdv_2", debut: "2026-11-12T13:00:00.000Z", fin: "2026-11-12T13:45:00.000Z", lienMeet: "x", jetonGestion: nouveau },
    ]);
    expect(await deplacerRendezVous(JETON, { debutUtc: "2026-11-12T13:00:00.000Z" }, ENV)).toEqual({
      ok: true,
      donnees: { debut: "2026-11-12T13:00:00.000Z", fin: "2026-11-12T13:45:00.000Z", jetonGestion: nouveau },
    });
    expect(appels[0].url).toBe(`https://cockpit.test/api/rdv/gestion/${JETON}/deplacer`);
    expect(JSON.parse(appels[0].options.body)).toEqual({ debut: "2026-11-12T13:00:00.000Z" });
  });

  it("traite une réponse de déplacement sans jeton comme une panne", async () => {
    simuler([{ id: "rdv_2", debut: "2026-11-12T13:00:00.000Z" }]);
    expect(await deplacerRendezVous(JETON, { debutUtc: "2026-11-12T13:00:00.000Z" }, ENV)).toEqual({
      ok: false,
      raison: "indisponible",
      detail: "charge_illisible",
    });
  });

  it("refuse un jeton mal formé à l’annulation et au déplacement sans appel", async () => {
    const appels = simuler([{}]);
    expect((await annulerRendezVous("x", undefined, ENV)).ok).toBe(false);
    expect((await deplacerRendezVous("x", { debutUtc: "2026-11-12T13:00:00.000Z" }, ENV)).ok).toBe(false);
    expect(appels).toHaveLength(0);
  });

  it("rend le refus du cockpit à l’annulation", async () => {
    simuler([{ erreur: "introuvable" }, 404]);
    expect((await annulerRendezVous(JETON, undefined, ENV)).ok).toBe(false);
  });

  it("garde le 409 d’un créneau pris au déplacement", async () => {
    simuler([{ erreur: "creneau_pris" }, 409]);
    expect(await deplacerRendezVous(JETON, { debutUtc: "2026-11-12T13:00:00.000Z", duree: 45 }, ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 409,
      detail: "creneau_pris",
    });
  });
});

describe("réponses inattendues du cockpit", () => {
  it("garde un code vide quand le refus n’en porte pas", async () => {
    simuler([{ erreur: 42 }, 500]);
    expect(await recupererCreneaux("logiciel", "2026-11-02", "2026-11-30", undefined, ENV)).toEqual({
      ok: false,
      raison: "refuse",
      statut: 500,
      detail: "",
    });
  });

  it("nomme « inconnue » une panne qui n’est pas une erreur JavaScript", async () => {
    globalThis.fetch = async () => {
      throw "coupure";
    };
    expect(await recupererCreneaux("logiciel", "2026-11-02", "2026-11-30", undefined, ENV)).toEqual({
      ok: false,
      raison: "indisponible",
      detail: "inconnue",
    });
  });

  it("ne demande pas les durées sans RDV_TOKEN", async () => {
    const appels = simuler([TYPES]);
    expect(await obtenirDurees("logiciel", 0, {})).toBeUndefined();
    expect(appels).toHaveLength(0);
  });

  it("ignore une liste de types illisible, sans la garder", async () => {
    const env = { ...ENV, COCKPIT_URL: "https://types-illisibles.test" };
    for (const charge of [null, { types: "logiciel" }]) {
      simuler([charge]);
      expect(await obtenirDurees("logiciel", 0, env)).toBeUndefined();
    }
    const appels = simuler([TYPES]);
    expect(await obtenirDurees("logiciel", 0, env)).toEqual({ options: [30, 45, 60], defaut: 45 });
    expect(appels).toHaveLength(1);
  });

  it("écarte les types mal formés et garde les autres", async () => {
    const env = { ...ENV, COCKPIT_URL: "https://types-mixtes.test" };
    simuler([
      {
        types: [
          null,
          { titre: "Sans clé", durees: [30], defaut: 30 },
          { cle: "decouverte", durees: [15], defaut: "trente" },
          { cle: "logiciel", durees: [30, 45], defaut: 45 },
        ],
      },
    ]);
    expect(await obtenirDurees("logiciel", 0, env)).toEqual({ options: [30, 45], defaut: 45 });
    expect(await obtenirDurees("decouverte", 1, env)).toBeUndefined();
  });

  it("n’envoie ni notes ni réponses vides", async () => {
    const appels = simuler([{ id: "rdv_3" }, 201]);
    await creerReservation({ ...RESERVATION, telephone: undefined, notes: undefined, reponses: {} }, ENV);
    const corps = JSON.parse(appels[0].options.body);
    expect(corps).not.toHaveProperty("notes");
    expect(corps).not.toHaveProperty("reponses");
    expect(corps).not.toHaveProperty("telephone");
  });

  it("accepte une réservation sans identifiant lisible", async () => {
    simuler([null, 201]);
    expect(await creerReservation(RESERVATION, ENV)).toEqual({ ok: true, donnees: { uid: "" } });
  });

  it("lit un rendez-vous sans liste de durées comme un rendez-vous à durée unique", async () => {
    simuler([
      {
        type: "decouverte",
        titre: "Premier échange",
        duree: 30,
        debut: "2026-11-10T09:00:00.000Z",
        fin: "2026-11-10T09:30:00.000Z",
        statut: "DEPLACE",
      },
    ]);
    const resultat = await lireGestion(JETON, ENV);
    expect(resultat.ok).toBe(true);
    expect(resultat.donnees.durees).toEqual({ options: [30], defaut: 30 });
    expect(resultat.donnees.statut).toBe("DEPLACE");
  });

  it("traite une charge vide ou une durée absurde comme une panne", async () => {
    const rdv = {
      type: "logiciel",
      titre: "Logiciel",
      durees: [30, 45],
      debut: "2026-11-10T09:00:00.000Z",
      fin: "2026-11-10T09:45:00.000Z",
      statut: "CONFIRME",
    };
    for (const charge of [null, { ...rdv, duree: 0 }, { ...rdv, duree: "45" }]) {
      simuler([charge]);
      expect(await lireGestion(JETON, ENV)).toEqual({
        ok: false,
        raison: "indisponible",
        detail: "charge_illisible",
      });
    }
  });
});
