import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { rendezVousContent } from "@/content/rendez-vous";
import { ReservationRendezVous } from "./ReservationRendezVous";

/**
 * LE STEPPER, PARCOURU COMME UN VISITEUR, pour les deux sujets qui restent
 * depuis le 2026-10-31 : « logiciel » et « decouverte ». Les deux posent le
 * budget, le besoin et l'échéance, sans question d'outil, et ce que le
 * navigateur envoie suit ces questions.
 *
 * Rien ne sort du processus : `fetch` est remplacé, la clef Turnstile est posée
 * par `scripts/test-turnstile-env.mjs` et le widget est factice.
 */

const C = rendezVousContent;
const TRANCHE = "5000-10000";

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
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(
      createElement(ReservationRendezVous, {
        types: C.types,
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

/** Écrit dans un champ contrôlé par React, comme le ferait un clavier. */
async function saisir(conteneur, nom, valeur) {
  const champ = conteneur.querySelector(`input[name="${nom}"]`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  await act(async () => {
    setter.call(champ, valeur);
    champ.dispatchEvent(new window.Event("input", { bubbles: true }));
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

async function allerAuProjet(conteneur) {
  await cliquer(bouton(conteneur, "15:00"));
  expect(texte(conteneur)).toContain(C.etapes.projet);
}

async function allerAuxCoordonnees(conteneur) {
  await cliquer(bouton(conteneur, C.actions.continuer));
  expect(conteneur.querySelector('input[name="nom"]')).not.toBeNull();
  await saisir(conteneur, "nom", "Camille Renard");
  await saisir(conteneur, "email", "camille@exemple.fr");
}

describe("ReservationRendezVous — les questions suivent le sujet", () => {
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

  it("deux sujets seulement, et aucune question d'outil", async () => {
    contexte = installerDom();
    simulerServeur([]);
    montage = await monter();
    const { conteneur } = montage;
    expect(C.types.map((t) => t.id)).toEqual(["logiciel", "decouverte"]);
    for (const type of C.types) expect(texte(conteneur)).toContain(type.nom);
    await cliquer(bouton(conteneur, C.types[0].nom));
    await allerAuProjet(conteneur);
    expect(conteneur.querySelector('input[type=radio][name$="-outil"]')).toBeNull();
    expect(C.questionnaire).not.toHaveProperty("outil");
  });

  it("découverte : budget, besoin puis échéance, et un envoi qui porte les trois", async () => {
    contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    montage = await monter();
    const { conteneur } = montage;

    // Le sujet se choisit dans la liste : rien n'est présélectionné.
    await cliquer(bouton(conteneur, C.types.find((t) => t.id === "decouverte").nom));
    await allerAuProjet(conteneur);

    expect(texte(conteneur)).toContain(C.questionnaire.budget.legende);
    expect(texte(conteneur)).toContain(C.questionnaire.objectif.legende);

    // Sans réponse, l'erreur porte sur le budget, et le focus y va.
    await cliquer(bouton(conteneur, C.actions.continuer));
    expect(texte(conteneur)).toContain(C.questionnaire.budget.erreur);
    expect(document.activeElement?.getAttribute("name")).toMatch(/-budget$/u);

    await choisir(conteneur, "budget", TRANCHE);
    await choisir(conteneur, "objectif", "conseil");
    await choisir(conteneur, "echeance", "vite");
    await allerAuxCoordonnees(conteneur);
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({
      type: "decouverte",
      budget: TRANCHE,
      objectif: "conseil",
      echeance: "vite",
    });
    expect(envois[0]).not.toHaveProperty("outil");
    expect(texte(conteneur)).toContain(C.succes.titre);

    // « Prendre un autre rendez-vous » repart du choix du sujet.
    await cliquer(bouton(conteneur, C.succes.autre));
    expect(texte(conteneur)).toContain(C.etapes.sujet);
  });

  it("logiciel : budget puis besoin, chacun exigé dans l'ordre affiché", async () => {
    contexte = installerDom();
    const envois = simulerServeur([
      { status: 400, corps: { message: "Cette réponse n’est pas proposée.", champ: "objectif" } },
      { status: 400, corps: { message: "Indiquez votre nom.", champ: "nom" } },
      { status: 409, corps: { message: "Ce créneau vient d’être pris.", champ: "creneau" } },
      { status: 200, corps: { ok: true } },
    ]);
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await allerAuProjet(conteneur);

    expect(texte(conteneur)).toContain(C.questionnaire.budget.legende);
    expect(texte(conteneur)).toContain(C.questionnaire.objectif.legende);
    // Le retour renvoie à l'appel et au devis, sans aucun montant.
    await choisir(conteneur, "budget", TRANCHE);
    expect(texte(conteneur)).toContain(C.retour.aPortee);

    // Budget répondu, besoin manquant : l'erreur et le focus vont au besoin.
    await cliquer(bouton(conteneur, C.actions.continuer));
    expect(texte(conteneur)).toContain(C.questionnaire.objectif.erreur);
    expect(document.activeElement?.getAttribute("name")).toMatch(/-objectif$/u);
    await choisir(conteneur, "objectif", "tableur");
    await allerAuxCoordonnees(conteneur);

    // Le serveur refuse le besoin : retour à la question, erreur affichée.
    await soumettre(conteneur);
    expect(texte(conteneur)).toContain(C.questionnaire.objectif.erreur);
    await choisir(conteneur, "objectif", "tache");
    expect(texte(conteneur)).not.toContain(C.questionnaire.objectif.erreur);

    // Un refus sur un autre champ laisse le visiteur sur ses coordonnées.
    await allerAuxCoordonnees(conteneur);
    await soumettre(conteneur);
    expect(conteneur.querySelector('input[name="nom"]')).not.toBeNull();

    // Créneau pris entre-temps : retour au calendrier, les réponses gardées.
    await soumettre(conteneur);
    expect(conteneur.querySelector('input[name="nom"]')).toBeNull();
    await allerAuProjet(conteneur);
    await cliquer(bouton(conteneur, C.actions.continuer));

    await soumettre(conteneur);
    expect(envois).toHaveLength(4);
    expect(envois[3]).toMatchObject({
      type: "logiciel",
      budget: TRANCHE,
      objectif: "tache",
    });
    expect(envois[3]).not.toHaveProperty("outil");
    expect(texte(conteneur)).toContain(C.succes.titre);
  });

  it("logiciel : sans aucune réponse, le budget est demandé le premier", async () => {
    contexte = installerDom();
    simulerServeur([]);
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await allerAuProjet(conteneur);

    await cliquer(bouton(conteneur, C.actions.continuer));
    expect(texte(conteneur)).toContain(C.questionnaire.budget.erreur);
    expect(document.activeElement?.getAttribute("name")).toMatch(/-budget$/u);
  });
});
