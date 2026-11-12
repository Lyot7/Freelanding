import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { estimationContent } from "@/content/estimation";
import { libelleChoix, OutilEstimation } from "./OutilEstimation";

/**
 * L'OUTIL DE CHIFFRAGE, PARCOURU COMME UN VISITEUR : quatre choix, la
 * description, les coordonnées, l'envoi, puis le résultat. Rien ne sort du
 * processus : `fetch` est remplacé, la clef Turnstile est posée par
 * `scripts/test-turnstile-env.mjs` et le widget est factice.
 *
 * LE MOUVEMENT RÉDUIT se force par l'état partagé de `motion-dom` (celui que
 * lit `useReducedMotion`), parce que le module décide de sa lecture du
 * navigateur à son import, avant que ce fichier ait un DOM.
 */

const C = estimationContent;
const DESCRIPTION = "Nos devis se font sur Excel et se perdent dans les mails, je veux un outil de devis.";

const fourchette = (bas, haut) => (haut === undefined ? { bas } : { bas, haut });
const abonnement = (duree, haut) => ({
  duree,
  miseEnRoute: fourchette(2_000, haut),
  mensualite: fourchette(duree === 12 ? 600 : 400, haut === undefined ? undefined : haut / 4),
  suiviApres: fourchette(120, haut === undefined ? undefined : 200),
});
const estimation = (type = "logiciel", grandProjet = false) => ({
  type,
  grandProjet,
  prix: fourchette(8_000, grandProjet ? undefined : 12_000),
  maintenance: fourchette(150, grandProjet ? undefined : 250),
  abonnements: [abonnement(12, grandProjet ? undefined : 3_000), abonnement(24, grandProjet ? undefined : 2_400)],
});

const attendre = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/estimation",
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
  // `react-dom` est importé sans DOM : il croit l'événement `input` absent et
  // passe par le chemin d'Internet Explorer au premier focus d'un champ.
  dom.window.HTMLElement.prototype.attachEvent = () => {};
  dom.window.HTMLElement.prototype.detachEvent = () => {};
  const defilements = [];
  dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView(options) {
    defilements.push({ etape: this.getAttribute("data-etape"), ...options });
  };
  const hauts = [];
  dom.window.scrollTo = (options) => hauts.push(options);
  let rappel;
  const reinitialisations = [];
  dom.window.turnstile = {
    render(_conteneur, options) {
      rappel = options.callback;
      rappel("jeton-de-test");
      return "widget-de-test";
    },
    reset() {
      reinitialisations.push(true);
      rappel?.("jeton-de-test");
    },
    remove() {},
  };
  return {
    defilements,
    hauts,
    reinitialisations,
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
 * `fetch` factice : chaque appel prend la réponse suivante de la file (une
 * fonction peut la fabriquer, ou lever). Chaque corps envoyé est gardé.
 */
function simulerServeur(reponses) {
  const envois = [];
  globalThis.fetch = async (url, options) => {
    envois.push({ url: String(url), options, corps: JSON.parse(options.body) });
    const suivante = reponses.shift();
    return typeof suivante === "function" ? suivante() : suivante;
  };
  return envois;
}

const succes = (extra = {}, source = "boutons") => ({
  ok: true,
  status: 200,
  json: async () => ({ ok: true, estimation: estimation(), source, ...extra }),
});
const echec = (status, corps) => ({ ok: false, status, json: async () => corps });

async function monter() {
  const conteneur = document.createElement("div");
  document.body.appendChild(conteneur);
  const racine = createRoot(conteneur);
  await act(async () => {
    racine.render(createElement(OutilEstimation));
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

/** Écrit dans un champ contrôlé (voir `ReservationRendezVous.test.mjs`). */
async function saisir(conteneur, nom, valeur) {
  const champ = conteneur.querySelector(`input[name="${nom}"], textarea`);
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

const soumettreForm = (form) =>
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

async function choisirOption(conteneur, cle, indice) {
  const question = C.questions[cle];
  await cliquer(bouton(conteneur, question.options[indice].libelle));
}

async function repondreAuxChoix(conteneur, indices = [0, 0, 0, 0]) {
  const cles = ["type", "equipe", "outils", "urgence"];
  for (const [i, cle] of cles.entries()) await choisirOption(conteneur, cle, indices[i]);
}

async function decrire(conteneur, description = DESCRIPTION) {
  await saisir(conteneur, "", description);
  await act(async () => {
    soumettreForm(conteneur.querySelector("form"));
    await attendre(20);
  });
}

async function donnerCoordonnees(conteneur) {
  await saisir(conteneur, "prenom", " Lucie ");
  await saisir(conteneur, "nom", "Marchetti");
  await saisir(conteneur, "societe", "Menuiserie des Coteaux");
  await saisir(conteneur, "email", "lucie@coteaux.fr");
  await saisir(conteneur, "telephone", "06 47 21 88 03");
}

/** Premier contact avec le formulaire : charge le widget, comme un vrai focus. */
async function envoyer(conteneur) {
  await act(async () => {
    conteneur.querySelector('input[name="prenom"]').focus();
    await attendre(20);
  });
  await act(async () => {
    soumettreForm(conteneur.querySelector("form"));
    await attendre(60);
  });
}

async function jusquAuxCoordonnees(conteneur, indices) {
  await repondreAuxChoix(conteneur, indices);
  await decrire(conteneur);
  await donnerCoordonnees(conteneur);
}

describe("libelleChoix", () => {
  it("rend le libellé de l'option, ou la valeur brute quand elle est inconnue", () => {
    expect(libelleChoix("equipe", "6-20")).toBe("6 à 20");
    expect(libelleChoix("equipe", "inconnue")).toBe("inconnue");
  });
});

describe("OutilEstimation", () => {
  let contexte;
  let montage;

  const demarrer = (reponses = []) => {
    contexte = installerDom();
    const envois = simulerServeur(reponses);
    return envois;
  };

  afterEach(async () => {
    if (montage) {
      await act(async () => montage.racine.unmount());
      montage = undefined;
    }
    hasReducedMotionListener.current = false;
    prefersReducedMotion.current = null;
    if (contexte) {
      await attendre(20);
      contexte.restaurer();
      contexte = undefined;
    }
  });

  it("pose la première question sans animation ni focus, puis chaque réponse appelle la suivante", async () => {
    demarrer();
    montage = await monter();
    const { conteneur } = montage;
    expect(texte(conteneur)).toContain(C.questions.type.question);
    expect(conteneur.querySelectorAll("button")).toHaveLength(4);
    // Pas de focus au chargement : il sauterait le lien d'évitement.
    expect(document.activeElement).toBe(document.body);

    await choisirOption(conteneur, "type", 1);
    expect(texte(conteneur)).toContain(C.questions.type.options[1].libelle);
    expect(texte(conteneur)).toContain(C.questions.equipe.question);
    // La question qui apparaît après le chargement prend le focus.
    expect(document.activeElement?.textContent).toBe(C.questions.equipe.question);

    await choisirOption(conteneur, "equipe", 2);
    await choisirOption(conteneur, "outils", 3);
    expect(texte(conteneur)).toContain(C.questions.urgence.question);
    // Trois options : la grille passe à trois colonnes.
    expect(conteneur.querySelector('[role="group"]').className).toContain("tablet:grid-cols-3");
    await choisirOption(conteneur, "urgence", 2);
    expect(texte(conteneur)).toContain(C.description.question);
    expect(texte(conteneur)).toContain(C.questions.urgence.options[2].libelle);
  });

  it("« Modifier » vide une réponse et garde les suivantes pour quand elle est redonnée", async () => {
    demarrer();
    montage = await monter();
    const { conteneur } = montage;
    await repondreAuxChoix(conteneur, [0, 1, 2, 0]);
    expect(texte(conteneur)).toContain(C.description.question);

    const modifier = [...conteneur.querySelectorAll("button")].filter((b) => b.textContent === C.modifier);
    expect(modifier).toHaveLength(4);
    await cliquer(modifier[1]);
    // L'équipe est redemandée ; l'écran s'arrête à elle.
    expect(texte(conteneur)).toContain(C.questions.equipe.question);
    expect(texte(conteneur)).not.toContain(C.questions.outils.question);
    expect(texte(conteneur)).not.toContain(C.description.question);

    await choisirOption(conteneur, "equipe", 3);
    // Les réponses suivantes reviennent d'elles-mêmes.
    expect(texte(conteneur)).toContain(C.questions.equipe.options[3].libelle);
    expect(texte(conteneur)).toContain(C.questions.outils.options[2].libelle);
    expect(texte(conteneur)).toContain(C.description.question);
  });

  it("refuse une description trop courte, dit ce qui manque, puis accepte une description valide", async () => {
    demarrer();
    montage = await monter();
    const { conteneur } = montage;
    await repondreAuxChoix(conteneur);

    expect(texte(conteneur)).toContain(C.description.minimum);
    const form = () => conteneur.querySelector("form");
    await act(async () => {
      soumettreForm(form());
      await attendre(10);
    });
    expect(texte(conteneur)).toContain(C.description.manque(20));
    expect(conteneur.querySelector("textarea").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(conteneur.querySelector("textarea"));

    await saisir(conteneur, "", "x".repeat(19));
    expect(texte(conteneur)).toContain(C.description.manque(1));
    await saisir(conteneur, "", "x".repeat(5));
    expect(texte(conteneur)).toContain(C.description.manque(15));

    // Plus long que le maximum : le texte est coupé, le compteur le dit.
    await saisir(conteneur, "", "y".repeat(3_500));
    expect(conteneur.querySelector("textarea").value).toHaveLength(3_000);
    expect(texte(conteneur)).toContain(C.description.compteur(3_000, 3_000));
    expect(conteneur.querySelector("textarea").getAttribute("aria-invalid")).toBeNull();

    await saisir(conteneur, "", `  ${DESCRIPTION}  `);
    expect(texte(conteneur)).toContain(C.description.compteur(DESCRIPTION.length + 4, 3_000));
    await act(async () => {
      soumettreForm(form());
      await attendre(20);
    });
    // La description validée devient une réponse (rognée) et les coordonnées sont demandées.
    expect(conteneur.querySelector("textarea")).toBeNull();
    expect(texte(conteneur)).toContain(DESCRIPTION);
    expect(texte(conteneur)).toContain(C.contact.question);

    // « Modifier » la description la rouvre, texte conservé.
    const modifier = [...conteneur.querySelectorAll("button")].filter((b) => b.textContent === C.modifier);
    await cliquer(modifier[modifier.length - 1]);
    expect(conteneur.querySelector("textarea").value).toContain(DESCRIPTION);
    expect(texte(conteneur)).not.toContain(C.contact.question);
  });

  it("parcours complet : un seul envoi, le résultat, la bascule 12/24 mois et « Refaire une estimation »", async () => {
    const envois = demarrer([succes({}, "ia")]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur, [0, 1, 2, 1]);

    expect(texte(conteneur)).toContain(C.contact.question);
    expect(conteneur.querySelectorAll('input[required]')).toHaveLength(5);
    await envoyer(conteneur);

    expect(envois).toHaveLength(1);
    expect(envois[0].url).toBe("/api/estimation");
    expect(envois[0].options.method).toBe("POST");
    expect(envois[0].corps).toMatchObject({
      reponses: { type: "logiciel", equipe: "6-20", outils: "plusieurs", urgence: "trimestre" },
      description: DESCRIPTION,
      contact: { prenom: " Lucie ", nom: "Marchetti", societe: "Menuiserie des Coteaux", email: "lucie@coteaux.fr", telephone: "06 47 21 88 03" },
      consentement: true,
      jetonCaptcha: "jeton-de-test",
      referenceInterne: "",
    });
    expect(typeof envois[0].corps.debutMs).toBe("number");

    // Le résultat : le prénom nettoyé, les deux formules, plus de « Modifier ».
    expect(texte(conteneur)).toContain(C.resultat.intro("Lucie"));
    expect(texte(conteneur)).toContain(C.resultat.avertissement);
    expect(texte(conteneur)).not.toContain(C.resultat.grandProjet);
    expect(texte(conteneur)).toMatch(/Lucie\s+Marchetti, Menuiserie des Coteaux/u);
    expect(texte(conteneur)).toContain(C.resultat.achat.titre);
    expect(texte(conteneur)).toContain("8 000");
    expect(texte(conteneur)).toContain("12 000");
    expect(texte(conteneur)).toContain(C.resultat.abonnement.apres(12, true));
    expect([...conteneur.querySelectorAll("button")].some((b) => b.textContent === C.modifier)).toBe(false);
    expect(document.activeElement?.textContent).toBe(C.resultat.intro("Lucie"));
    expect(contexte.reinitialisations).toHaveLength(0);

    // Deux liens de rendez-vous vers le sujet du projet.
    const liens = [...conteneur.querySelectorAll("a")].filter((a) => a.getAttribute("href") === "/rdv?sujet=logiciel");
    expect(liens.map((a) => a.textContent)).toEqual([`${C.resultat.rendezVous}→`, `${C.resultat.rendezVousBas}→`]);

    // Bascule 12 / 24 mois.
    const [douze, vingtQuatre] = [...conteneur.querySelectorAll("button[aria-pressed]")];
    expect(douze.getAttribute("aria-pressed")).toBe("true");
    expect(texte(conteneur)).toContain(C.resultat.abonnement.mensualite(12));
    await cliquer(vingtQuatre);
    expect(vingtQuatre.getAttribute("aria-pressed")).toBe("true");
    expect(douze.getAttribute("aria-pressed")).toBe("false");
    expect(texte(conteneur)).toContain(C.resultat.abonnement.mensualite(24));
    await cliquer(douze);
    expect(texte(conteneur)).toContain(C.resultat.abonnement.mensualite(12));

    // Le résultat remonte en haut de l'écran, en défilement doux.
    expect(contexte.defilements.at(-1)).toMatchObject({ etape: "resultat", behavior: "smooth", block: "start" });

    // Tout recommencer.
    await cliquer(bouton(conteneur, C.resultat.recommencer));
    expect(texte(conteneur)).toContain(C.questions.type.question);
    expect(texte(conteneur)).not.toContain(C.resultat.achat.titre);
    expect(contexte.hauts).toEqual([{ top: 0, behavior: "smooth" }]);
    expect(contexte.reinitialisations).toHaveLength(1);
    // Les coordonnées restent pour une seconde estimation.
    await repondreAuxChoix(montage.conteneur);
    await decrire(conteneur);
    expect(conteneur.querySelector('input[name="email"]').value).toBe("lucie@coteaux.fr");
  });

  it("grand projet : pas de haut de fourchette, « dès » et « À partir de », site sans évolutions", async () => {
    demarrer([
      {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, estimation: estimation("site", true), source: "autre" }),
      },
    ]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur, [1, 3, 3, 2]);
    await envoyer(conteneur);

    expect(texte(conteneur)).toContain(C.resultat.grandProjet);
    expect(texte(conteneur)).toContain(C.resultat.des);
    expect(texte(conteneur)).toContain(C.resultat.aPartirDe);
    expect(texte(conteneur)).not.toContain("250");
    expect(texte(conteneur)).not.toContain("750");
    expect(texte(conteneur)).toContain(C.resultat.abonnement.apres(12, false));
    expect(
      [...conteneur.querySelectorAll("a")].some((a) => a.getAttribute("href") === "/rdv?sujet=site"),
    ).toBe(true);
  });

  it("mouvement réduit : mêmes écrans, défilement et remontée sans animation", async () => {
    hasReducedMotionListener.current = true;
    prefersReducedMotion.current = true;
    demarrer([succes()]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur);
    await envoyer(conteneur);
    expect(texte(conteneur)).toContain(C.resultat.intro("Lucie"));
    expect(contexte.defilements.at(-1)).toMatchObject({ etape: "resultat", behavior: "auto" });
    await cliquer(bouton(conteneur, C.resultat.abonnement.engagement(24)));
    expect(texte(conteneur)).toContain(C.resultat.abonnement.mensualite(24));
    await cliquer(bouton(conteneur, C.resultat.recommencer));
    expect(contexte.hauts).toEqual([{ top: 0, behavior: "auto" }]);
  });

  it("erreur du serveur sur un champ de contact : le message s'affiche et le focus va au champ", async () => {
    const envois = demarrer([
      echec(400, { message: C.erreurs.champ.email, champ: "email" }),
      succes(),
    ]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur);
    await envoyer(conteneur);

    expect(envois).toHaveLength(1);
    expect(conteneur.querySelector('[role="alert"]').textContent).toBe(C.erreurs.champ.email);
    const champ = conteneur.querySelector('input[name="email"]');
    expect(champ.getAttribute("aria-invalid")).toBe("true");
    expect(champ.getAttribute("aria-describedby")).toBe(conteneur.querySelector('[role="alert"]').id);
    expect(document.activeElement).toBe(champ);
    // Le jeton à usage unique est redemandé, et les étapes répondues restent.
    expect(contexte.reinitialisations).toHaveLength(1);
    expect(texte(conteneur)).toContain(DESCRIPTION);
    expect(bouton(conteneur, C.contact.valider).disabled).toBe(false);

    // Corrigé, le visiteur renvoie et obtient son résultat.
    await envoyer(conteneur);
    expect(envois).toHaveLength(2);
    expect(texte(conteneur)).toContain(C.resultat.intro("Lucie"));
  });

  it("erreur sans champ de contact : le message du serveur, sans focus déplacé", async () => {
    demarrer([
      echec(429, { message: C.erreurs.debit }),
      echec(400, { message: C.erreurs.champ.description, champ: "description" }),
      echec(500, {}),
      { ok: false, status: 502, json: async () => Promise.reject(new Error("pas du json")) },
      { ok: true, status: 200, json: async () => null },
      { ok: true, status: 200, json: async () => ({ ok: true, estimation: "texte" }) },
    ]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur);
    const alerte = () => conteneur.querySelector('[role="alert"]');

    await envoyer(conteneur);
    expect(alerte().textContent).toBe(C.erreurs.debit);
    expect(conteneur.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(conteneur.querySelector('input[name="email"]').getAttribute("aria-describedby")).not.toBe(alerte().id);

    // Un champ qui n'est pas un champ de contact n'attire pas le focus.
    await envoyer(conteneur);
    expect(alerte().textContent).toBe(C.erreurs.champ.description);
    expect(conteneur.querySelector('[aria-invalid="true"]')).toBeNull();

    // Sans message, charge illisible, charge vide ou estimation absente : message générique.
    for (let i = 0; i < 4; i += 1) {
      await envoyer(conteneur);
      expect(alerte().textContent).toBe(C.erreurs.generique);
    }
    expect(texte(conteneur)).not.toContain(C.resultat.achat.titre);
    expect(contexte.reinitialisations).toHaveLength(6);
  });

  it("erreur réseau : message de connexion, formulaire de nouveau envoyable", async () => {
    demarrer([
      () => {
        throw new TypeError("fetch failed");
      },
    ]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur);
    await envoyer(conteneur);
    expect(conteneur.querySelector('[role="alert"]').textContent).toBe(C.erreurs.reseau);
    expect(contexte.reinitialisations).toHaveLength(1);
    expect(bouton(conteneur, C.contact.valider).disabled).toBe(false);
  });

  it("pendant l'envoi : bouton bloqué, annonce d'attente, et un second envoi est ignoré", async () => {
    let liberer;
    const envois = demarrer([
      () =>
        new Promise((resoudre) => {
          liberer = () => resoudre(succes());
        }),
    ]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur);
    await act(async () => {
      conteneur.querySelector('input[name="prenom"]').focus();
      await attendre(20);
    });
    await act(async () => {
      soumettreForm(conteneur.querySelector("form"));
      await attendre(30);
    });
    expect(envois).toHaveLength(1);
    const envoi = bouton(conteneur, C.contact.envoi);
    expect(envoi.disabled).toBe(true);
    expect(conteneur.querySelector('[role="status"]').textContent).toBe(C.contact.envoi);
    expect(conteneur.querySelectorAll(".animate-pulse")).toHaveLength(2);

    await act(async () => {
      soumettreForm(conteneur.querySelector("form"));
      await attendre(30);
    });
    expect(envois).toHaveLength(1);

    await act(async () => {
      liberer();
      await attendre(30);
    });
    expect(texte(conteneur)).toContain(C.resultat.intro("Lucie"));
    // Résultat affiché : un envoi tardif n'a plus de formulaire où partir.
    expect(conteneur.querySelector("form")).toBeNull();
  });

  it("transmet le champ piège tel quel, et une chaîne vide quand il a disparu", async () => {
    const envois = demarrer([succes(), succes()]);
    montage = await monter();
    const { conteneur } = montage;
    await jusquAuxCoordonnees(conteneur);
    const piege = conteneur.querySelector('input[name="referenceInterne"]');
    piege.value = "robot";
    await envoyer(conteneur);
    expect(envois[0].corps.referenceInterne).toBe("robot");

    await cliquer(bouton(conteneur, C.resultat.recommencer));
    await repondreAuxChoix(conteneur);
    await decrire(conteneur);
    conteneur.querySelector('input[name="referenceInterne"]').remove();
    await envoyer(conteneur);
    expect(envois[1].corps.referenceInterne).toBe("");
  });

  it("n'envoie rien tant que les quatre choix ne sont pas faits", async () => {
    const envois = demarrer();
    montage = await monter();
    const { conteneur } = montage;
    expect(conteneur.querySelector("form")).toBeNull();
    await choisirOption(conteneur, "type", 0);
    expect(conteneur.querySelector("form")).toBeNull();
    expect(envois).toHaveLength(0);
  });
});
