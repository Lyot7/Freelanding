import { afterEach, describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { MESSAGE_RESEAU } from "@/components/rendez-vous/messages";
import { rendezVousContent } from "@/content/rendez-vous";
import { GestionRendezVous } from "./GestionRendezVous";

/**
 * LA PAGE DE GESTION, PARCOURUE COMME LE PROSPECT QUI A CLIQUÉ LE LIEN DE
 * L'E-MAIL : annuler (motif facultatif) ou déplacer sur un nouveau créneau.
 *
 * Rien ne sort du processus : `fetch` est un serveur factice qui rend, dans
 * l'ordre, les réponses préparées par chaque test, et peut les garder en
 * suspens pour observer l'état « en cours ». Le routeur est factice aussi :
 * on relève l'adresse qu'il reçoit après un déplacement.
 */

const C = rendezVousContent;
const G = C.gestion;
const JETON = "a".repeat(43);
const NOUVEAU = "b".repeat(43);
const BASE = `/api/rendez-vous/gestion/${JETON}`;

const CRENEAUX = {
  fenetre: {
    debut: "2026-11-02",
    fin: "2026-11-30",
    mois: "2026-11",
    libelle: "novembre 2026",
    premiere: true,
    derniere: false,
  },
  durees: null,
  duree: 45,
  jours: [
    {
      jour: "2026-11-03",
      libelle: "mardi 3 novembre",
      libelleCourt: "mar. 3",
      creneaux: [{ debut: "2026-11-03T14:00:00.000Z", heure: "15:00", resume: "mardi 3 novembre à 15:00" }],
    },
    {
      jour: "2026-11-05",
      libelle: "jeudi 5 novembre",
      libelleCourt: "jeu. 5",
      creneaux: [{ debut: "2026-11-05T08:30:00.000Z", heure: "09:30", resume: "jeudi 5 novembre à 09:30" }],
    },
  ],
};

const DECEMBRE = {
  ...CRENEAUX,
  fenetre: { ...CRENEAUX.fenetre, debut: "2026-12-01", fin: "2026-12-31", mois: "2026-12", libelle: "décembre 2026", premiere: false },
  jours: [],
};

const attendre = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));

function installerDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: `http://localhost/rdv/gerer/${JETON}`,
    pretendToBeVisual: true,
  });
  const precedent = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    fetch: globalThis.fetch,
    self: globalThis.self,
  };
  globalThis.window = dom.window;
  globalThis.self = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return {
    restaurer() {
      globalThis.window = precedent.window;
      globalThis.document = precedent.document;
      globalThis.fetch = precedent.fetch;
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
 * Serveur factice. Chaque réponse préparée est `{ status, corps }` (corps
 * absent = corps illisible), une `Error` (panne réseau) ou `"suspendu"` : la
 * requête attend alors `liberer()` ou l'annulation de son signal.
 */
function simulerServeur() {
  const lectures = [];
  const ecritures = [];
  const fileLectures = [];
  const fileEcritures = [];
  let enAttente;

  function repondre(prevue, signal) {
    if (prevue instanceof Error) return Promise.reject(prevue);
    if (prevue === "suspendu") {
      return new Promise((resoudre, rejeter) => {
        enAttente = (suite) => resoudre(repondreTout(suite));
        signal?.addEventListener("abort", () => rejeter(new window.DOMException("abandon", "AbortError")));
      });
    }
    return Promise.resolve(repondreTout(prevue));
  }

  function repondreTout({ status, corps }) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (corps === undefined) throw new SyntaxError("Unexpected token <");
        return corps;
      },
    };
  }

  globalThis.fetch = (url, options = {}) => {
    const adresse = String(url);
    if ((options.method ?? "GET") === "GET") {
      lectures.push(adresse);
      return repondre(fileLectures.shift() ?? { status: 200, corps: CRENEAUX }, options.signal);
    }
    ecritures.push({ url: adresse, corps: JSON.parse(options.body) });
    return repondre(fileEcritures.shift() ?? { status: 200, corps: { ok: true } }, options.signal);
  };

  return {
    lectures,
    ecritures,
    lire: (...reponses) => fileLectures.push(...reponses),
    ecrire: (...reponses) => fileEcritures.push(...reponses),
    async liberer(reponse) {
      await act(async () => {
        enAttente(reponse);
        await attendre(10);
      });
    },
  };
}

function routeurFactice() {
  const remplacements = [];
  const rien = () => {};
  return {
    remplacements,
    routeur: {
      replace: (adresse) => remplacements.push(adresse),
      push: rien,
      prefetch: rien,
      back: rien,
      forward: rien,
      refresh: rien,
    },
  };
}

const texte = (conteneur) => conteneur.textContent ?? "";

function bouton(conteneur, libelle) {
  const trouve = [...conteneur.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "").trim() === libelle || b.outerHTML.includes(`"${libelle}"`),
  );
  if (!trouve) throw new Error(`bouton introuvable : ${libelle}`);
  return trouve;
}

const boutonExiste = (conteneur, libelle) =>
  [...conteneur.querySelectorAll("button")].some((b) => (b.textContent ?? "").trim() === libelle);

async function cliquer(element) {
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await attendre(10);
  });
}

/** Le gestionnaire React d'un élément, pour l'appeler même désactivé. */
function proprietesReact(element) {
  const cle = Object.keys(element).find((nom) => nom.startsWith("__reactProps$"));
  return element[cle];
}

/**
 * Écrit dans le champ contrôlé par React. `react-dom` est chargé AVANT que le
 * DOM de test existe : il ne se branche pas sur l'événement `input` (son test
 * de prise en charge a lieu à l'import), d'où l'appel direct de `onChange`
 * avec le champ déjà rempli, ce qu'en ferait le navigateur.
 */
async function saisirMotif(conteneur, valeur) {
  const champ = conteneur.querySelector('textarea[name="motif"]');
  await act(async () => {
    champ.value = valeur;
    proprietesReact(champ).onChange({ target: champ });
    await attendre(5);
  });
}

const gestionnaireClic = (element) => proprietesReact(element).onClick;

const messageEtat = (conteneur) => conteneur.querySelector('p[role="status"][aria-live="polite"]');

describe("GestionRendezVous", () => {
  let contexte;
  let racine;

  afterEach(async () => {
    if (racine) await act(async () => racine.unmount());
    racine = undefined;
    contexte?.restaurer();
    contexte = undefined;
  });

  async function monter() {
    contexte = installerDom();
    const serveur = simulerServeur();
    const { routeur, remplacements } = routeurFactice();
    const conteneur = document.createElement("div");
    document.body.appendChild(conteneur);
    racine = createRoot(conteneur);
    await act(async () => {
      racine.render(
        createElement(AppRouterContext.Provider, { value: routeur }, createElement(GestionRendezVous, { jeton: JETON })),
      );
      await attendre(10);
    });
    return { conteneur, serveur, remplacements };
  }

  /** Ouvre « Déplacer », attend les créneaux et retient le premier. */
  async function choisirUnCreneau(conteneur) {
    await cliquer(bouton(conteneur, G.actions.deplacer));
    await cliquer(bouton(conteneur, "15:00"));
    expect(texte(conteneur)).toContain("mardi 3 novembre à 15:00");
  }

  it("propose déplacer ou annuler, sans rien demander au serveur", async () => {
    const { conteneur, serveur } = await monter();
    expect(boutonExiste(conteneur, G.actions.deplacer)).toBe(true);
    expect(boutonExiste(conteneur, G.actions.annuler)).toBe(true);
    expect(boutonExiste(conteneur, G.actions.retour)).toBe(false);
    expect(serveur.lectures).toHaveLength(0);
  });

  it("annule avec le motif nettoyé, puis affiche le succès avec le focus", async () => {
    const { conteneur, serveur } = await monter();
    await cliquer(bouton(conteneur, G.actions.annuler));
    const champ = conteneur.querySelector('textarea[name="motif"]');
    expect(conteneur.querySelector(`label[for="${champ.id}"]`).textContent).toBe(G.motif.libelle);
    expect(champ.getAttribute("aria-describedby")).toBe(`${champ.id}-aide`);

    await saisirMotif(conteneur, "  Empêchement  ");
    serveur.ecrire("suspendu");
    await cliquer(bouton(conteneur, G.actions.confirmerAnnulation));
    // Pendant l'envoi : le bouton tourne, il est désactivé, et un second appel
    // de son gestionnaire ne repart pas au serveur.
    const enCours = conteneur.querySelector(`[role="status"][aria-label="${G.actions.confirmerAnnulation}"]`);
    expect(enCours).not.toBeNull();
    const confirmer = enCours.closest("button");
    expect(confirmer.disabled).toBe(true);
    await act(async () => {
      await gestionnaireClic(confirmer)();
    });
    expect(serveur.ecritures).toHaveLength(1);

    await serveur.liberer({ status: 200, corps: { ok: true } });
    expect(serveur.ecritures[0]).toEqual({ url: `${BASE}/annuler`, corps: { motif: "Empêchement" } });
    expect(texte(conteneur)).toContain(G.succes.annule.titre);
    expect(texte(conteneur)).toContain(G.succes.annule.texte);
    expect(document.activeElement.textContent).toBe(G.succes.annule.titre);
    expect(boutonExiste(conteneur, G.actions.annuler)).toBe(false);
  });

  it("dit pourquoi l’annulation échoue, puis revient au choix", async () => {
    const { conteneur, serveur } = await monter();
    await cliquer(bouton(conteneur, G.actions.annuler));
    const confirmer = () => cliquer(bouton(conteneur, G.actions.confirmerAnnulation));

    // Refus avec message : le message du serveur, et l'annulation reste ouverte.
    serveur.ecrire({ status: 409, corps: { message: "Ce rendez-vous est déjà annulé ou déplacé. Rechargez la page." } });
    await confirmer();
    expect(serveur.ecritures[0].corps).toEqual({});
    expect(messageEtat(conteneur).textContent).toBe("Ce rendez-vous est déjà annulé ou déplacé. Rechargez la page.");
    expect(messageEtat(conteneur).dataset.etat).toBe("erreur");
    expect(conteneur.querySelector('textarea[name="motif"]')).not.toBeNull();
    // Un 409 en annulation ne recharge aucun créneau.
    expect(serveur.lectures).toHaveLength(0);

    // Refus sans message lisible, puis corps illisible : le texte de repli.
    serveur.ecrire({ status: 502, corps: { message: 42 } }, { status: 502 });
    await confirmer();
    expect(messageEtat(conteneur).textContent).toBe(G.etats.indisponible.texte);
    await confirmer();
    expect(messageEtat(conteneur).textContent).toBe(G.etats.indisponible.texte);

    // Panne réseau.
    serveur.ecrire(new TypeError("fetch failed"));
    await confirmer();
    expect(messageEtat(conteneur).textContent).toBe(MESSAGE_RESEAU);

    await cliquer(bouton(conteneur, G.actions.retour));
    expect(boutonExiste(conteneur, G.actions.deplacer)).toBe(true);
    expect(conteneur.querySelector('textarea[name="motif"]')).toBeNull();
    expect(messageEtat(conteneur).textContent).toBe("");
  });

  it("déplace sur le créneau choisi et remplace l’adresse par le nouveau lien", async () => {
    const { conteneur, serveur, remplacements } = await monter();
    serveur.lire("suspendu");
    await cliquer(bouton(conteneur, G.actions.deplacer));
    // Premier chargement : l'attente s'annonce, sans calendrier.
    expect(conteneur.querySelector(`[role="status"][aria-label="${C.creneaux.chargement}"]`)).not.toBeNull();
    expect(serveur.lectures).toEqual([`${BASE}/creneaux?`]);
    await serveur.liberer({ status: 200, corps: CRENEAUX });
    expect(texte(conteneur)).toContain(G.choisirCreneau);
    expect(texte(conteneur)).toContain(C.noteFuseau);

    // Le jour choisi dans le calendrier donne ses heures.
    await cliquer(bouton(conteneur, "jeudi 5 novembre"));
    expect(boutonExiste(conteneur, "09:30")).toBe(true);
    expect(boutonExiste(conteneur, "15:00")).toBe(false);
    await cliquer(bouton(conteneur, "09:30"));
    expect(texte(conteneur)).toContain("jeudi 5 novembre à 09:30");

    serveur.ecrire("suspendu");
    await cliquer(bouton(conteneur, G.actions.confirmerDeplacement));
    expect(conteneur.querySelector(`[role="status"][aria-label="${G.actions.confirmerDeplacement}"]`)).not.toBeNull();
    await serveur.liberer({ status: 200, corps: { ok: true, jeton: NOUVEAU } });

    expect(serveur.ecritures).toEqual([{ url: `${BASE}/deplacer`, corps: { debut: "2026-11-05T08:30:00.000Z" } }]);
    expect(texte(conteneur)).toContain(G.succes.deplace.titre);
    expect(texte(conteneur)).toContain("jeudi 5 novembre à 09:30");
    expect(document.activeElement.textContent).toBe(G.succes.deplace.titre);
    expect(remplacements).toEqual([`/rdv/gerer/${NOUVEAU}`]);
  });

  it("garde l’adresse quand la réponse ne porte pas de jeton valable", async () => {
    for (const reponse of [{ status: 200, corps: { ok: true, jeton: "court" } }, { status: 200 }]) {
      const { conteneur, serveur, remplacements } = await monter();
      await choisirUnCreneau(conteneur);
      serveur.ecrire(reponse);
      await cliquer(bouton(conteneur, G.actions.confirmerDeplacement));
      expect(texte(conteneur)).toContain(G.succes.deplace.titre);
      expect(remplacements).toEqual([]);
      await act(async () => racine.unmount());
      racine = undefined;
      contexte.restaurer();
      contexte = undefined;
    }
  });

  it("retire le créneau pris entre-temps et recharge la liste", async () => {
    const { conteneur, serveur } = await monter();
    await choisirUnCreneau(conteneur);
    expect(serveur.lectures).toHaveLength(1);
    serveur.ecrire({
      status: 409,
      corps: { message: "Ce créneau vient d’être pris. Choisissez-en un autre dans la liste.", champ: "creneau" },
    });
    await cliquer(bouton(conteneur, G.actions.confirmerDeplacement));
    expect(messageEtat(conteneur).textContent).toBe("Ce créneau vient d’être pris. Choisissez-en un autre dans la liste.");
    expect(boutonExiste(conteneur, G.actions.confirmerDeplacement)).toBe(false);
    expect(serveur.lectures).toHaveLength(2);
  });

  it("annonce des créneaux injoignables et laisse réessayer", async () => {
    const { conteneur, serveur } = await monter();
    serveur.lire({ status: 503, corps: { message: "x" } }, { status: 200, corps: { jours: "illisible" } });
    await cliquer(bouton(conteneur, G.actions.deplacer));
    expect(texte(conteneur)).toContain(C.creneaux.erreur);
    await cliquer(bouton(conteneur, C.actions.reessayer));
    // Réponse au mauvais format : même message, rien d'inventé.
    expect(texte(conteneur)).toContain(C.creneaux.erreur);
    await cliquer(bouton(conteneur, C.actions.reessayer));
    expect(texte(conteneur)).not.toContain(C.creneaux.erreur);
    expect(boutonExiste(conteneur, "15:00")).toBe(true);
    expect(serveur.lectures).toHaveLength(3);
  });

  it("passe au mois suivant, grise l’ancien pendant le chargement, dit qu’il est vide", async () => {
    const { conteneur, serveur } = await monter();
    await cliquer(bouton(conteneur, G.actions.deplacer));
    serveur.lire("suspendu");
    await cliquer(bouton(conteneur, C.actions.moisSuivant));
    expect(serveur.lectures[1]).toBe(`${BASE}/creneaux?mois=2026-12`);
    const heures = bouton(conteneur, "15:00").closest("div[class*='transition-opacity']");
    expect(heures.className).toContain("opacity-40");
    await serveur.liberer({ status: 200, corps: DECEMBRE });
    expect(texte(conteneur)).toContain(C.creneaux.vide);
    expect(boutonExiste(conteneur, "15:00")).toBe(false);
  });

  it("abandonne sans bruit la lecture des créneaux quand on revient au choix", async () => {
    const { conteneur, serveur } = await monter();
    serveur.lire("suspendu");
    await cliquer(bouton(conteneur, G.actions.deplacer));
    await cliquer(bouton(conteneur, G.actions.retour));
    await act(async () => attendre(10));
    expect(boutonExiste(conteneur, G.actions.deplacer)).toBe(true);
    expect(texte(conteneur)).not.toContain(C.creneaux.erreur);
    expect(messageEtat(conteneur).textContent).toBe("");
  });
});
