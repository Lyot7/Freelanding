import { afterEach, describe, expect, it } from "bun:test";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { installerDom, monter, patienter } from "@/components/motion/__tests__/dom.mjs";
import { siteConfig } from "@/content/site";
import { FooterContact } from "./FooterContact";

const { modes } = siteConfig.footerForm;
const message = createElement("p", null, "panneau message");
const rendezVous = createElement("p", null, "panneau rendez-vous");

const reponseCreneaux = {
  fenetre: { debut: "2026-11-01", fin: "2026-11-30", mois: "2026-11", libelle: "novembre 2026", premiere: true, derniere: false },
  jours: [
    {
      jour: "2026-11-03",
      libelle: "mardi 3 novembre",
      libelleCourt: "mar. 3",
      creneaux: [{ debut: "2026-11-03T09:00:00.000Z", heure: "10:00", resume: "mardi 3 novembre à 10:00" }],
    },
  ],
};

describe("FooterContact", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  const monterBloc = async (fetch, props = {}) => {
    contexte = installerDom();
    globalThis.fetch = fetch;
    montage = await monter(createElement(FooterContact, { modes, message, rendezVous, ...props }));
    return montage.conteneur;
  };

  it("sans rendez-vous configuré, ne garde que le message, sans onglets", () => {
    const html = renderToStaticMarkup(createElement(FooterContact, { modes, message }));
    expect(html).toContain("panneau message");
    expect(html).not.toContain('role="tablist"');
  });

  it("dit ce que chaque porte donne, et la promesse de l'appel sous les onglets", () => {
    const html = renderToStaticMarkup(createElement(FooterContact, { modes, message, rendezVous }));
    expect(html).toContain(modes.message.titre);
    expect(html).toContain(modes.message.detail);
    expect(html).toContain(modes.rendezVous.titre);
    expect(html).toContain("min-h-[64px]");
    expect(html.replaceAll("&#x27;", "’")).toContain(modes.rendezVous.promesse);
    expect(html).not.toContain(modes.rendezVous.prochain);
  });

  it("lit le prochain créneau réel quand le bloc approche de l'écran", async () => {
    const appels = [];
    const conteneur = await monterBloc(async (url) => {
      appels.push(url);
      return { ok: true, json: async () => reponseCreneaux };
    });
    expect(appels).toHaveLength(0);

    await contexte.entrer(conteneur.querySelector('[data-section="rendez-vous"]'));
    await patienter(5);
    expect(appels).toEqual(["/api/rendez-vous/creneaux?type=logiciel"]);
    expect(conteneur.textContent).toContain(`${modes.rendezVous.prochain} mardi 3 novembre à 10:00`);
  });

  it("n'écrit aucune ligne si l'agenda ne répond pas, ou répond une erreur", async () => {
    for (const reponse of [
      async () => ({ ok: false }),
      async () => {
        throw new Error("réseau");
      },
    ]) {
      const conteneur = await monterBloc(reponse);
      await contexte.entrer(conteneur.querySelector('[data-section="rendez-vous"]'));
      await patienter(5);
      expect(conteneur.textContent).not.toContain(modes.rendezVous.prochain);
      await montage.demonter();
      contexte.restaurer();
      montage = undefined;
    }
  });

  it("change d'onglet au clic et aux flèches, sans démonter les panneaux", async () => {
    const conteneur = await monterBloc(async () => ({ ok: false }));
    const [ecrire, appeler] = conteneur.querySelectorAll('[role="tab"]');
    expect(ecrire.getAttribute("aria-selected")).toBe("true");

    await act(async () => {
      appeler.click();
    });
    expect(appeler.getAttribute("aria-selected")).toBe("true");
    expect(conteneur.textContent).toContain("panneau message");

    await act(async () => {
      appeler.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    expect(ecrire.getAttribute("aria-selected")).toBe("true");

    await act(async () => {
      ecrire.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(ecrire.getAttribute("aria-selected")).toBe("true");
  });

  it("un lien vers #rendez-vous ouvre l'onglet de l'appel", async () => {
    const conteneur = await monterBloc(async () => ({ ok: false }));
    const lien = document.createElement("a");
    lien.href = "#rendez-vous";
    document.body.appendChild(lien);
    await act(async () => {
      lien.click();
      await new Promise((resoudre) => setTimeout(resoudre, 5));
    });
    expect(conteneur.querySelectorAll('[role="tab"]')[1].getAttribute("aria-selected")).toBe("true");
  });

  it("suit aussi un changement d'ancre, et seulement vers le rendez-vous", async () => {
    const conteneur = await monterBloc(async () => ({ ok: false }));
    const [ecrire, appeler] = conteneur.querySelectorAll('[role="tab"]');

    await act(async () => {
      window.dispatchEvent(new window.Event("hashchange"));
    });
    expect(ecrire.getAttribute("aria-selected")).toBe("true");

    await act(async () => {
      window.location.hash = "#rendez-vous";
      window.dispatchEvent(new window.Event("hashchange"));
    });
    expect(appeler.getAttribute("aria-selected")).toBe("true");

    await act(async () => {
      appeler.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(ecrire.getAttribute("aria-selected")).toBe("true");
  });

  it("ouvre l'appel d'emblée quand l'adresse porte un sujet", async () => {
    const conteneur = await monterBloc(async () => ({ ok: false }), { ongletInitial: "rendezVous" });
    expect(conteneur.querySelectorAll('[role="tab"]')[1].getAttribute("aria-selected")).toBe("true");
  });
});
