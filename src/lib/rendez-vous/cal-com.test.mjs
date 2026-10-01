import { afterEach, describe, expect, it } from "bun:test";
import { obtenirDurees } from "./cal-com.ts";

/**
 * `obtenirDurees` décide si le sélecteur de durée existe. Un défaut ici ne
 * casse rien de visible : le sélecteur disparaît et chaque rendez-vous part à
 * la durée par défaut, sans que personne ne le remarque.
 */

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

const LISTE = {
  status: "success",
  data: [
    { id: 11, slug: "site", lengthInMinutes: 30, lengthInMinutesOptions: [15, 30, 45] },
    { id: 22, slug: "logiciel", lengthInMinutes: 45, lengthInMinutesOptions: [30, 45, 60] },
  ],
};

function simuler(reponse, statut = 200) {
  const appels = [];
  globalThis.fetch = async (url) => {
    appels.push(String(url));
    return new Response(JSON.stringify(reponse), { status: statut });
  };
  return appels;
}

describe("obtenirDurees", () => {
  it("retrouve un type par identifiant dans la liste de l’utilisateur", async () => {
    const appels = simuler(LISTE);
    const durees = await obtenirDurees({ par: "id", eventTypeId: 22, username: "u-id" }, 0);
    expect(durees).toEqual({ options: [30, 45, 60], defaut: 45 });
    expect(appels[0]).toContain("username=u-id");
    expect(appels[0]).not.toContain("eventSlug");
  });

  it("interroge par slug quand la cible en porte un", async () => {
    const appels = simuler({ data: [LISTE.data[0]] });
    const durees = await obtenirDurees(
      { par: "slug", eventTypeSlug: "site", username: "u-slug" },
      0,
    );
    expect(durees).toEqual({ options: [15, 30, 45], defaut: 30 });
    expect(appels[0]).toContain("eventSlug=site");
  });

  it("rend undefined sans nom d’utilisateur, sans appeler Cal.com", async () => {
    const appels = simuler(LISTE);
    expect(await obtenirDurees({ par: "id", eventTypeId: 22 }, 0)).toBeUndefined();
    expect(appels).toHaveLength(0);
  });

  it("rend undefined pour un identifiant absent de la liste", async () => {
    simuler(LISTE);
    expect(
      await obtenirDurees({ par: "id", eventTypeId: 99, username: "u-absent" }, 0),
    ).toBeUndefined();
  });

  it("garde le résultat cinq minutes, mais pas un échec", async () => {
    const cible = { par: "id", eventTypeId: 11, username: "u-cache" };
    let appels = simuler({}, 500);
    expect(await obtenirDurees(cible, 0)).toBeUndefined();
    appels = simuler(LISTE);
    expect(await obtenirDurees(cible, 1_000)).toEqual({ options: [15, 30, 45], defaut: 30 });
    expect(appels).toHaveLength(1);
    await obtenirDurees(cible, 2_000);
    expect(appels).toHaveLength(1);
    await obtenirDurees(cible, 1_000 + 5 * 60 * 1000 + 1);
    expect(appels).toHaveLength(2);
  });
});
