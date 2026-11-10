import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { rendezVousContent } from "@/content/rendez-vous";
import { etapeDuChamp, ReservationRendezVous } from "./ReservationRendezVous";

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

const continuer = (conteneur) => cliquer(bouton(conteneur, C.actions.continuer));
const titre = (conteneur) => conteneur.querySelector("h3")?.textContent;

/** Les trois écrans du cadrage, remplis, jusqu'aux coordonnées. */
async function repondreAuCadrage(conteneur) {
  expect(titre(conteneur)).toBe(C.etapes.entreprise);
  await saisir(conteneur, "entreprise", "Transports Martin");
  await saisir(conteneur, "activite", "Transport frigorifique");
  await choisir(conteneur, "taille", "6-20");
  await continuer(conteneur);
  expect(titre(conteneur)).toBe(C.etapes.besoin);
  await choisir(conteneur, "objectif", "tache");
  await saisir(conteneur, "coince", "On ressaisit chaque commande dans trois fichiers.");
  await choisir(conteneur, "cout", "2-5h");
  await choisir(conteneur, "essaye", "tableur");
  await continuer(conteneur);
  expect(titre(conteneur)).toBe(C.etapes.projet);
  await choisir(conteneur, "decision", "plusieurs");
  await choisir(conteneur, "echeance", "trimestre");
  await choisir(conteneur, "budget", TRANCHE);
  await continuer(conteneur);
  expect(titre(conteneur)).toBe(C.etapes.coordonnees);
}

/** Coordonnées complètes, téléphone compris, puis passage au créneau. */
async function donnerCoordonnees(conteneur) {
  await saisir(conteneur, "nom", "Camille Renard");
  await saisir(conteneur, "email", "camille@exemple.fr");
  await saisir(conteneur, "telephone", "06 12 34 56 78");
  await continuer(conteneur);
  expect(titre(conteneur)).toBe(C.etapes.creneau);
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

  it("quatre sujets, et aucune question d'outil", async () => {
    contexte = installerDom();
    simulerServeur([]);
    montage = await monter();
    const { conteneur } = montage;
    expect(C.types.map((t) => t.id)).toEqual(["logiciel", "decouverte", "demonstration", "point-d-etape"]);
    for (const type of C.types) expect(texte(conteneur)).toContain(type.nom);
    await cliquer(bouton(conteneur, C.types[0].nom));
    // Le cadrage d'abord : aucun créneau avant les réponses.
    expect(titre(conteneur)).toBe(C.etapes.entreprise);
    expect(texte(conteneur)).toContain(C.introCadrage);
    expect(conteneur.querySelector('[aria-label="' + C.creneaux.libelleCalendrier + '"]')).toBeNull();
    expect(conteneur.querySelector('input[type=radio][name$="-outil"]')).toBeNull();
    expect(C.questionnaire).not.toHaveProperty("outil");
  });

  it("découverte : le cadrage, les coordonnées, puis le créneau, et un envoi qui porte tout", async () => {
    contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    montage = await monter();
    const { conteneur } = montage;

    // Le sujet se choisit dans la liste : rien n'est présélectionné.
    await cliquer(bouton(conteneur, C.types.find((t) => t.id === "decouverte").nom));

    // Sans réponse, l'erreur porte sur l'entreprise, et le focus y va.
    await continuer(conteneur);
    expect(texte(conteneur)).toContain(C.questionnaire.entreprise.erreur);
    expect(texte(conteneur)).toContain(C.questionnaire.taille.erreur);
    expect(document.activeElement?.getAttribute("name")).toBe("entreprise");
    expect(titre(conteneur)).toBe(C.etapes.entreprise);

    await repondreAuCadrage(conteneur);

    // Le téléphone est exigé : sans lui, on reste sur les coordonnées.
    expect(texte(conteneur)).toContain(C.formulaire.telephoneAide);
    await saisir(conteneur, "nom", "Camille Renard");
    await saisir(conteneur, "email", "camille@exemple.fr");
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.coordonnees);
    await donnerCoordonnees(conteneur);

    // Le créneau vient en dernier : la confirmation attend une heure.
    expect(texte(conteneur)).toContain(C.formulaire.choisirHeure);
    expect(() => bouton(conteneur, C.formulaire.envoyer)).toThrow();
    await cliquer(bouton(conteneur, "15:00"));
    expect(texte(conteneur)).toMatch(/mardi 3 novembre à 15:00\s·\s45\smin/u);
    expect(titre(conteneur)).toBe(C.etapes.creneau);
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({
      type: "decouverte",
      debut: "2026-11-03T14:00:00.000Z",
      telephone: "06 12 34 56 78",
      budget: TRANCHE,
      objectif: "tache",
      echeance: "trimestre",
      entreprise: "Transports Martin",
      activite: "Transport frigorifique",
      taille: "6-20",
      decision: "plusieurs",
      coince: "On ressaisit chaque commande dans trois fichiers.",
      cout: "2-5h",
      essaye: "tableur",
    });
    expect(envois[0]).not.toHaveProperty("outil");
    expect(texte(conteneur)).toContain(C.succes.titre);
    expect(texte(conteneur)).toContain(C.succes.texteCadrage);

    // « Prendre un autre rendez-vous » repart du choix du sujet.
    await cliquer(bouton(conteneur, C.succes.autre));
    expect(texte(conteneur)).toContain(C.etapes.sujet);
  });

  it("logiciel : chaque refus du serveur renvoie à l'écran de sa question", async () => {
    contexte = installerDom();
    const envois = simulerServeur([
      { status: 400, corps: { message: "Décrivez ce qui coince.", champ: "coince" } },
      { status: 400, corps: { message: "Indiquez un numéro.", champ: "telephone" } },
      { status: 409, corps: { message: "Ce créneau vient d’être pris.", champ: "creneau" } },
      { status: 200, corps: { ok: true } },
    ]);
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await repondreAuCadrage(conteneur);
    await donnerCoordonnees(conteneur);
    await cliquer(bouton(conteneur, "15:00"));

    // Ce qui coince est refusé : retour au besoin, erreur sous la question.
    await soumettre(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.besoin);
    expect(texte(conteneur)).toContain(C.questionnaire.coince.erreur);
    await saisir(conteneur, "coince", "Chaque commande est ressaisie à la main, deux fois.");
    expect(texte(conteneur)).not.toContain(C.questionnaire.coince.erreur);

    // Les réponses sont gardées : on revient au créneau sans rien ressaisir.
    await continuer(conteneur);
    await continuer(conteneur);
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.creneau);
    await soumettre(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.coordonnees);

    // Créneau pris entre-temps : retour au calendrier, à rechoisir.
    await continuer(conteneur);
    await soumettre(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.creneau);
    expect(texte(conteneur)).toContain(C.formulaire.choisirHeure);
    await cliquer(bouton(conteneur, "15:00"));
    await soumettre(conteneur);

    expect(envois).toHaveLength(4);
    expect(envois[3]).toMatchObject({
      type: "logiciel",
      budget: TRANCHE,
      coince: "Chaque commande est ressaisie à la main, deux fois.",
    });
    expect(texte(conteneur)).toContain(C.succes.titre);
  });

  it("démonstration : ce qu'on veut voir, sans budget ni échéance", async () => {
    contexte = installerDom();
    const envois = simulerServeur([{ status: 200, corps: { ok: true } }]);
    montage = await monter();
    const { conteneur } = montage;
    await cliquer(bouton(conteneur, C.types.find((t) => t.id === "demonstration").nom));
    await allerAuProjet(conteneur);

    expect(texte(conteneur)).toContain(C.questionnaire.objectif.legendes.demonstration);
    expect(texte(conteneur)).not.toContain(C.questionnaire.budget.legende);
    expect(texte(conteneur)).not.toContain(C.questionnaire.echeance.legende);
    expect(conteneur.querySelector('input[name="projet"]')).toBeNull();

    await cliquer(bouton(conteneur, C.actions.continuer));
    expect(texte(conteneur)).toContain(C.questionnaire.objectif.erreur);
    expect(document.activeElement?.getAttribute("name")).toMatch(/-objectif$/u);

    await choisir(conteneur, "objectif", "logiciel");
    await allerAuxCoordonnees(conteneur);
    await soumettre(conteneur);

    expect(envois).toHaveLength(1);
    expect(envois[0]).toMatchObject({
      type: "demonstration",
      objectif: "logiciel",
      nom: "Camille Renard",
      email: "camille@exemple.fr",
    });
    expect(envois[0]).not.toHaveProperty("budget");
    expect(envois[0]).not.toHaveProperty("echeance");
    expect(envois[0]).not.toHaveProperty("projet");
  });

  it("point d'étape : le projet concerné puis ce qu'on veut trancher", async () => {
    contexte = installerDom();
    const envois = simulerServeur([
      { status: 400, corps: { message: "Indiquez le projet.", champ: "projet" } },
      { status: 200, corps: { ok: true } },
    ]);
    montage = await monter("point-d-etape");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await allerAuProjet(conteneur);

    expect(texte(conteneur)).toContain(C.questionnaire.projet.legende);
    expect(texte(conteneur)).toContain(C.questionnaire.objectif.legendes["point-d-etape"]);
    expect(texte(conteneur)).not.toContain(C.questionnaire.budget.legende);

    // Rien de répondu : le projet, affiché en premier, est demandé le premier.
    await cliquer(bouton(conteneur, C.actions.continuer));
    expect(texte(conteneur)).toContain(C.questionnaire.projet.erreur);
    expect(document.activeElement?.getAttribute("name")).toBe("projet");

    await saisir(conteneur, "projet", "Cockpit");
    expect(texte(conteneur)).not.toContain(C.questionnaire.projet.erreur);
    await cliquer(bouton(conteneur, C.actions.continuer));
    expect(document.activeElement?.getAttribute("name")).toMatch(/-objectif$/u);
    await choisir(conteneur, "objectif", "priorites");
    await allerAuxCoordonnees(conteneur);

    // Le serveur refuse le projet : retour à la question, erreur affichée.
    await soumettre(conteneur);
    expect(texte(conteneur)).toContain(C.questionnaire.projet.erreur);
    await saisir(conteneur, "projet", "Cockpit, module agenda");
    expect(texte(conteneur)).not.toContain(C.questionnaire.projet.erreur);
    await allerAuxCoordonnees(conteneur);
    await soumettre(conteneur);

    expect(envois).toHaveLength(2);
    expect(envois[1]).toMatchObject({
      type: "point-d-etape",
      projet: "Cockpit, module agenda",
      objectif: "priorites",
    });
    expect(envois[1]).not.toHaveProperty("budget");
    expect(envois[1]).not.toHaveProperty("echeance");
    expect(texte(conteneur)).toContain(C.succes.titre);
  });

  it("logiciel : sur l'écran du projet, la décision est demandée la première", async () => {
    contexte = installerDom();
    simulerServeur([]);
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await saisir(conteneur, "entreprise", "Transports Martin");
    await saisir(conteneur, "activite", "Transport frigorifique");
    await choisir(conteneur, "taille", "seul");
    await continuer(conteneur);
    await choisir(conteneur, "objectif", "tache");
    await saisir(conteneur, "coince", "Une tâche refaite chaque soir à la main.");
    await choisir(conteneur, "cout", "inconnu");
    await choisir(conteneur, "essaye", "rien");
    await continuer(conteneur);

    await continuer(conteneur);
    expect(texte(conteneur)).toContain(C.questionnaire.decision.erreur);
    expect(texte(conteneur)).toContain(C.questionnaire.budget.erreur);
    expect(document.activeElement?.getAttribute("name")).toMatch(/-decision$/u);
  });
});

describe("etapeDuChamp — un refus du serveur renvoie à l'écran de sa question", () => {
  it.each([
    ["creneau", true, "creneau"],
    ["duree", false, "creneau"],
    ["entreprise", true, "entreprise"],
    ["activite", true, "entreprise"],
    ["taille", true, "entreprise"],
    ["coince", true, "besoin"],
    ["cout", true, "besoin"],
    ["essaye", true, "besoin"],
    ["objectif", true, "besoin"],
    ["objectif", false, "projet"],
    ["decision", true, "cadre"],
    ["budget", true, "cadre"],
    ["echeance", true, "cadre"],
    ["budget", false, "projet"],
    ["projet", false, "projet"],
    ["nom", true, "coordonnees"],
    ["email", true, "coordonnees"],
    ["telephone", true, "coordonnees"],
    ["message", false, "coordonnees"],
  ])("%s (cadrage : %s) → %s", (champ, cadrage, attendue) => {
    expect(etapeDuChamp(champ, cadrage)).toBe(attendue);
  });

  it("un refus sans champ, ou d'un champ inconnu, laisse le visiteur où il est", () => {
    expect(etapeDuChamp(undefined, true)).toBeUndefined();
    expect(etapeDuChamp("jetonCaptcha", true)).toBeUndefined();
  });
});

describe("ReservationRendezVous — navigation et états du créneau", () => {
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

  it("la barre et « Retour » ramènent aux étapes franchies, réponses gardées", async () => {
    contexte = installerDom();
    simulerServeur([]);
    montage = await monter("logiciel");
    const { conteneur } = montage;
    await act(async () => attendre(20));
    await saisir(conteneur, "entreprise", "Transports Martin");
    await saisir(conteneur, "activite", "Transport frigorifique");
    await choisir(conteneur, "taille", "seul");
    await continuer(conteneur);
    expect(titre(conteneur)).toBe(C.etapes.besoin);

    await cliquer(bouton(conteneur, C.actions.retour));
    expect(titre(conteneur)).toBe(C.etapes.entreprise);
    expect(conteneur.querySelector('input[name="entreprise"]').value).toBe("Transports Martin");

    await continuer(conteneur);
    // Étape 01 franchie : un bouton qui ramène au choix du sujet.
    await cliquer(bouton(conteneur, C.etapes.sujet));
    expect(titre(conteneur)).toBe(C.etapes.sujet);
  });

  it("agenda non configuré, panne puis « Réessayer », mois vide, sans durées", async () => {
    contexte = installerDom();
    const sansDurees = { ...CRENEAUX, durees: undefined, duree: undefined };
    delete sansDurees.durees;
    delete sansDurees.duree;
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
    await act(async () => montage.racine.unmount());

    // Sans durées au cockpit : la confirmation montre le créneau seul.
    const envois = simulerCreneaux([{ status: 200, corps: sansDurees }], [{ status: 502, corps: { message: "Le rendez-vous n’a pas pu être enregistré." } }]);
    montage = await monter("logiciel");
    conteneur = montage.conteneur;
    await act(async () => attendre(20));
    await repondreAuCadrage(conteneur);
    await donnerCoordonnees(conteneur);
    // Moins de mouvement demandé : la confirmation vient en vue sans glisser.
    const defilements = [];
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
    window.HTMLElement.prototype.scrollIntoView = (options) => defilements.push(options);
    await cliquer(bouton(conteneur, "15:00"));
    expect(defilements).toEqual([{ block: "start", behavior: "auto" }]);
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
    expect(texte(conteneur)).not.toMatch(/15:00\s·/u);

    // Refus sans champ nommé : le visiteur reste sur le créneau, le message s'affiche.
    await soumettre(conteneur);
    expect(envois).toHaveLength(1);
    expect(titre(conteneur)).toBe(C.etapes.creneau);
    expect(texte(conteneur)).toContain("Le rendez-vous n’a pas pu être enregistré.");
  });
});
