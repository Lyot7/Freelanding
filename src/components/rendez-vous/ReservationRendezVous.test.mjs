import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { rendezVousContent } from "@/content/rendez-vous";
import { ReservationRendezVous } from "./ReservationRendezVous";

/**
 * LE FORMULAIRE D'UN SEUL ÉCRAN, PARCOURU COMME UN VISITEUR (2026-11-12) : un
 * sujet (Logiciel, Site, IA, Autre), un créneau, nom, e-mail, téléphone et une
 * ligne libre. Ni cadrage, ni budget : ce que le navigateur envoie se limite à
 * ces champs.
 *
 * Rien ne sort du processus : `fetch` est remplacé, la clef Turnstile est posée
 * par `scripts/test-turnstile-env.mjs` et le widget est factice.
 */

const C = rendezVousContent;
/** Ce que `ReservationAvecSujet` donne au bloc : jamais un sujet réservé aux clients. */
const PROSPECTS = C.types.filter((t) => !t.prive);

const CRENEAUX = {
  fenetre: {
    debut: "2026-11-02",
    fin: "2026-11-30",
    mois: "2026-11",
    libelle: "novembre 2026",
    premiere: true,
    derniere: false,
  },
  durees: { options: [30, 45, 60], defaut: 45 },
  duree: 45,
  jours: [
    {
      jour: "2026-11-03",
      libelle: "mardi 3 novembre",
      libelleCourt: "mar. 3",
      creneaux: [
        {
          debut: "2026-11-03T14:00:00.000Z",
          heure: "15:00",
          resume: "mardi 3 novembre à 15:00",
        },
      ],
    },
  ],
};

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/contact",
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    fetch: globalThis.fetch,
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    FormData: globalThis.FormData,
    self: globalThis.self,
  };
  globalThis.window = dom.window;
  // `next/link` lit `self` (requestIdleCallback) : défini sous bun, pas sous vitest.
  globalThis.self = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.FormData = dom.window.FormData;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  // Widget factice : un jeton à l'affichage, un neuf à chaque réinitialisation
  // (le jeton est à usage unique, le composant réinitialise après chaque envoi).
  let rappel;
  dom.window.turnstile = {
    render(_conteneur, options) {
      rappel = options.callback;
      rappel("jeton-de-test");
      return "widget-de-test";
    },
    reset() {
      rappel?.("jeton-de-test");
    },
    remove() {},
  };
  return {
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      globalThis.fetch = precedent.fetch;
      globalThis.Event = precedent.Event;
      globalThis.CustomEvent = precedent.CustomEvent;
      globalThis.FormData = precedent.FormData;
      globalThis.self = precedent.self;
      Object.defineProperty(globalThis, "navigator", {
        value: precedent.navigator,
        configurable: true,
        writable: true,
      });
    },
  };
}

/**
 * `fetch` factice : les créneaux à chaque GET, puis les réponses de POST dans
 * l'ordre donné. Chaque corps envoyé est gardé pour être relu.
 */
function simulerServeur(reponsesPost) {
  const envois = [];
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith("/api/rendez-vous/creneaux")) {
      return { ok: true, status: 200, json: async () => CRENEAUX };
    }
    envois.push(JSON.parse(options.body));
    const { status, corps } = reponsesPost.shift();
    return { ok: status === 200, status, json: async () => corps };
  };
  return envois;
}

const attendre = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));

async function monter(typeInitial) {
  const proposes = typeInitial && C.types.find((t) => t.id === typeInitial)?.prive
    ? C.types.filter((t) => t.id === typeInitial)
    : PROSPECTS;
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(
      createElement(ReservationRendezVous, {
        types: proposes,
        emailContact: "contact@exemple.fr",
        ...(typeInitial ? { typeInitial } : {}),
      }),
    );
    await attendre(20);
  });
  return { conteneur, racine };
}

const texte = (conteneur) => conteneur.textContent ?? "";

function bouton(conteneur, libelle) {
  const trouve = [...conteneur.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes(libelle),
  );
  if (!trouve) throw new Error(`bouton introuvable : ${libelle}`);
  return trouve;
}

async function cliquer(element, ms = 20) {
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await attendre(ms);
  });
}

async function choisir(conteneur, groupe, valeur) {
  const radio = conteneur.querySelector(`input[type=radio][name$="-${groupe}"][value="${valeur}"]`);
  if (!radio) throw new Error(`réponse introuvable : ${groupe}=${valeur}`);
  await cliquer(radio);
}

/**
 * Écrit dans un champ contrôlé par React.
 *
 * L'ÉVÉNEMENT `input` NE SUFFIT PAS ICI : `react-dom` est importé avant que le
 * DOM simulé existe, il croit donc le navigateur incapable de cet événement et
 * l'ignore. Le gestionnaire `onChange` du champ est appelé directement, avec
 * la valeur écrite dans le DOM.
 */
async function saisir(conteneur, nom, valeur) {
  const champ = conteneur.querySelector(`input[name="${nom}"], textarea[name="${nom}"]`);
  if (!champ) throw new Error(`champ introuvable : ${nom}`);
  const prototype =
    champ.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
  const cle = Object.keys(champ).find((k) => k.startsWith("__reactProps"));
  await act(async () => {
    setter.call(champ, valeur);
    champ[cle].onChange({ target: champ });
    await attendre(5);
  });
}

async function soumettre(conteneur) {
  await act(async () => {
    conteneur
      .querySelector("form")
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    // Le sondage de `obtenirJeton` passe toutes les 150 ms.
    await attendre(400);
  });
}

const titre = (conteneur) => conteneur.querySelector("h3")?.textContent;

/** Nom, e-mail et téléphone d'un visiteur. */
async function donnerCoordonnees(conteneur, telephone = "06 12 34 56 78") {
  await saisir(conteneur, "nom", "Camille Renard");
  await saisir(conteneur, "email", "camille@exemple.fr");
  await saisir(conteneur, "telephone", telephone);
}

const sujets = (conteneur) =>
  [...conteneur.querySelectorAll('input[type=radio][name$="-sujet"]')].map((r) => r.value);

describe("ReservationRendezVous — un seul écran", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    if (montage) {
      await act(async () => montage.racine.unmount());
      montage = undefined;
    }
    if (contexte) {
      await attendre(20);
      contexte.restaurer();
      contexte = undefined;
    }
  });

  it("quatre boutons de sujet, rien de réservé aux clients, aucune question de cadrage", async () => {
    contexte = installerDom();
    simulerServeur([]);
    montage = await monter();
    const { conteneur } = montage;
    expect(PROSPECTS.map((t) => t.nom)).toEqual(["Logiciel", "Site", "IA", "Autre"]);
    expect(sujets(conteneur)).toEqual(["logiciel", "site", "ia", "decouverte"]);
    for (const type of PROSPECTS) expect(texte(conteneur)).toContain(type.nom);
    expect(texte(conteneur)).not.toContain("Démonstration");
    // Aucun sujet choisi : pas de calendrier, une invitation à choisir.
    expect(texte(conteneur)).toContain(C.formulaire.choisirSujet);
    expect(conteneur.querySelector('[aria-label="' + C.creneaux.libelleCalendrier + '"]')).toBeNull();
    // Le formulaire tient en cinq champs : nom, e-mail, téléphone, ligne libre, et le piège.
    const champs = [...conteneur.querySelectorAll("input:not([type=radio]):not([type=hidden]), textarea")];
    expect(champs.map((c) => c.getAttribute("name")).filter((n) => n && n !== "referenceInterne")).toEqual([
      "nom",
      "email",
      "telephone",
      "message",
    ]);
    expect(texte(conteneur)).not.toContain("budget");
  });

  it("un sujet présélectionné charge les créneaux, et un envoi porte exactement le formulaire", async () => {
    contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    montage = await monter("site");
    const { conteneur } = montage;
    await act(async () => attendre(20));

    expect(conteneur.querySelector('input[type=radio][value="site"]').checked).toBe(true);
    expect(texte(conteneur)).not.toContain(C.formulaire.choisirSujet);
    expect(conteneur.querySelector('[aria-label="' + C.creneaux.libelleCalendrier + '"]')).not.toBeNull();

    await cliquer(bouton(conteneur, "15:00"));
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
    await donnerCoordonnees(conteneur);
    await saisir(conteneur, "message", "Refaire le site de mon cabinet.");
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({
      type: "site",
      debut: "2026-11-03T14:00:00.000Z",
      nom: "Camille Renard",
      email: "camille@exemple.fr",
      telephone: "06 12 34 56 78",
      message: "Refaire le site de mon cabinet.",
    });
    for (const ancien of ["budget", "objectif", "echeance", "entreprise", "coince", "projet", "duree"]) {
      expect(envois[0]).not.toHaveProperty(ancien);
    }
    expect(texte(conteneur)).toContain(C.succes.titre);
    expect(texte(conteneur)).toContain(C.succes.texte);
  });

  it("changer de sujet recharge les créneaux et efface l'heure retenue", async () => {
    contexte = installerDom();
    const demandes = [];
    const base = globalThis.fetch;
    simulerServeur([]);
    const intercepte = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      demandes.push(String(url));
      return intercepte(url, options);
    };
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await cliquer(bouton(conteneur, "15:00"));
    expect(texte(conteneur)).toContain(C.recapitulatif);

    await choisir(conteneur, "sujet", "ia");
    await act(async () => attendre(20));
    expect(demandes.some((u) => u.includes("type=ia"))).toBe(true);
    expect(texte(conteneur)).not.toContain(C.recapitulatif);
    globalThis.fetch = base;
  });

  it("sans sujet, sans heure ou avec un faux téléphone, rien ne part et le champ est nommé", async () => {
    contexte = installerDom();
    const envois = simulerServeur([]);
    montage = await monter();
    const { conteneur } = montage;

    await donnerCoordonnees(conteneur);
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain(C.formulaire.choisirSujet);

    await choisir(conteneur, "sujet", "logiciel");
    await act(async () => attendre(20));
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain(C.formulaire.choisirHeure);

    await cliquer(bouton(conteneur, "15:00"));
    await saisir(conteneur, "telephone", "");
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain(C.formulaire.telephoneErreur);
    expect(conteneur.querySelector('input[name="telephone"]').getAttribute("aria-invalid")).toBe("true");

    await saisir(conteneur, "telephone", "abc");
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain("Ce numéro de téléphone ne semble pas valide.");
  });

  it("un créneau pris entre-temps vide l'heure et recharge l'agenda", async () => {
    contexte = installerDom();
    const envois = simulerServeur([
      { status: 409, corps: { message: "Ce créneau vient d’être pris.", champ: "creneau" } },
    ]);
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await cliquer(bouton(conteneur, "15:00"));
    await donnerCoordonnees(conteneur);
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(texte(conteneur)).toContain("Ce créneau vient d’être pris.");
    expect(texte(conteneur)).not.toContain(C.recapitulatif);
    expect(conteneur.querySelector('input[name="nom"]').value).toBe("Camille Renard");
  });

  it("un sujet de client seul : aucun bouton de sujet, un titre, téléphone facultatif", async () => {
    contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    montage = await monter("demonstration");
    const { conteneur } = montage;
    await act(async () => attendre(20));

    expect(sujets(conteneur)).toEqual([]);
    expect(titre(conteneur)).toBe(C.types.find((t) => t.id === "demonstration").nom);
    expect(texte(conteneur)).toContain(C.formulaire.telephoneLabelClient);
    expect(conteneur.querySelector('input[name="telephone"]').required).toBe(false);
    await cliquer(bouton(conteneur, "15:00"));
    await saisir(conteneur, "nom", "Camille Renard");
    await saisir(conteneur, "email", "camille@exemple.fr");
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({ type: "demonstration", nom: "Camille Renard", telephone: "" });
    expect(envois[0]).not.toHaveProperty("projet");
  });

  it("la page client : quatre sujets, nom et e-mail suffisent, un faux numéro reste refusé", async () => {
    contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    const racine = createRoot(conteneur);
    montage = { conteneur, racine };
    await act(async () => {
      racine.render(
        createElement(ReservationRendezVous, {
          types: C.types.filter((t) => t.prive),
          emailContact: "contact@exemple.fr",
        }),
      );
      await attendre(20);
    });
    expect(sujets(conteneur)).toEqual(["point-rapide", "demonstration", "proposition", "point-d-etape"]);
    expect(texte(conteneur)).toContain(C.formulaire.choisirSujet);

    await choisir(conteneur, "sujet", "proposition");
    await act(async () => attendre(20));
    await cliquer(bouton(conteneur, "15:00"));
    await saisir(conteneur, "nom", "Camille Renard");
    await saisir(conteneur, "email", "camille@exemple.fr");
    await saisir(conteneur, "telephone", "abc");
    await soumettre(conteneur);
    expect(envois).toHaveLength(0);
    expect(texte(conteneur)).toContain("Ce numéro de téléphone ne semble pas valide.");

    await saisir(conteneur, "telephone", "");
    await saisir(conteneur, "message", "Relire le devis du module stock.");
    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({ type: "proposition", message: "Relire le devis du module stock." });
    expect(texte(conteneur)).toContain(C.succes.titre);
  });
});

describe("ReservationRendezVous — états du créneau", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    if (montage) {
      await act(async () => montage.racine.unmount());
      montage = undefined;
    }
    if (contexte) {
      await attendre(20);
      contexte.restaurer();
      contexte = undefined;
    }
  });

  /** GET des créneaux servis dans l'ordre donné : `"reseau"` = panne, sinon `{ status, corps }`. */
  function simulerCreneaux(reponsesGet, reponsesPost = []) {
    const envois = [];
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith("/api/rendez-vous/creneaux")) {
        const suivante = reponsesGet.length > 1 ? reponsesGet.shift() : reponsesGet[0];
        if (suivante === "reseau") throw new Error("reseau");
        return { ok: suivante.status === 200, status: suivante.status, json: async () => suivante.corps };
      }
      envois.push(JSON.parse(options.body));
      const { status, corps } = reponsesPost.shift();
      return { ok: status === 200, status, json: async () => corps };
    };
    return envois;
  }

  it("agenda non configuré, panne puis « Réessayer », mois vide", async () => {
    contexte = installerDom();
    simulerCreneaux([{ status: 503, corps: {} }]);
    montage = await monter("demonstration");
    let { conteneur } = montage;
    await act(async () => attendre(30));
    expect(texte(conteneur)).toContain(C.creneaux.indisponible);
    await act(async () => montage.racine.unmount());

    simulerCreneaux(["reseau", { status: 200, corps: { ...CRENEAUX, jours: [] } }]);
    montage = await monter("demonstration");
    conteneur = montage.conteneur;
    await act(async () => attendre(30));
    expect(texte(conteneur)).toContain(C.creneaux.erreur);
    await cliquer(bouton(conteneur, C.actions.reessayer), 40);
    expect(texte(conteneur)).toContain(C.creneaux.vide);
  });

  it("moins de mouvement demandé, un refus sans champ garde le visiteur sur place avec son message", async () => {
    contexte = installerDom();
    const envois = simulerCreneaux(
      [{ status: 200, corps: CRENEAUX }],
      [{ status: 502, corps: { message: "Le rendez-vous n’a pas pu être enregistré." } }],
    );
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await cliquer(bouton(conteneur, "15:00"));
    await donnerCoordonnees(conteneur);

    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
    expect(texte(conteneur)).toContain("Le rendez-vous n’a pas pu être enregistré.");
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
    expect(conteneur.querySelector("form")).not.toBeNull();
  });
});
