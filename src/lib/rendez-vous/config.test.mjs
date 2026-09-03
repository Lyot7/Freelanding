import { describe, expect, it } from "bun:test";
import {
  estIdRendezVous,
  resoudreCible,
  resoudreConfiguration,
  VARIABLES_EVENEMENT,
} from "./config.ts";

/**
 * LE CAS QUI COMPTE LE PLUS ICI EST L'ABSENCE. Le dépôt ne contient pas le
 * compte Cal.com d'Eliott : l'état par défaut est « aucune variable », et cet
 * état doit produire une configuration vide, jamais une exception ni une
 * configuration à moitié résolue. C'est lui qui masque proprement la section.
 */

describe("resoudreCible", () => {
  it("lit un identifiant numérique sans exiger de nom d’utilisateur", () => {
    expect(resoudreCible("site", { CAL_COM_EVENT_SITE: "1234567" })).toEqual({
      par: "id",
      eventTypeId: 1234567,
    });
  });

  it("lit un slug, mais seulement accompagné du nom d’utilisateur", () => {
    const env = { CAL_COM_EVENT_SITE: "site-20min" };
    expect(resoudreCible("site", env)).toBeUndefined();
    expect(
      resoudreCible("site", { ...env, CAL_COM_USERNAME: "eliott" }),
    ).toEqual({ par: "slug", eventTypeSlug: "site-20min", username: "eliott" });
  });

  it("rogne les espaces autour des valeurs collées à la main", () => {
    expect(
      resoudreCible("outil", {
        CAL_COM_EVENT_OUTIL: "  outil-20min  ",
        CAL_COM_USERNAME: "  eliott  ",
      }),
    ).toEqual({ par: "slug", eventTypeSlug: "outil-20min", username: "eliott" });
  });

  it("refuse une variable vide, une variable absente et un zéro", () => {
    expect(resoudreCible("site", {})).toBeUndefined();
    expect(resoudreCible("site", { CAL_COM_EVENT_SITE: "" })).toBeUndefined();
    expect(resoudreCible("site", { CAL_COM_EVENT_SITE: "   " })).toBeUndefined();
    expect(resoudreCible("site", { CAL_COM_EVENT_SITE: "0" })).toBeUndefined();
  });

  it("traite une valeur non entièrement numérique comme un slug", () => {
    // `12abc` n'est PAS un identifiant tronqué : le confondre avec 12 ferait
    // réserver dans l'agenda de quelqu'un d'autre.
    expect(
      resoudreCible("site", {
        CAL_COM_EVENT_SITE: "12abc",
        CAL_COM_USERNAME: "eliott",
      }),
    ).toEqual({ par: "slug", eventTypeSlug: "12abc", username: "eliott" });
  });
});

describe("resoudreConfiguration", () => {
  it("rend une configuration VIDE quand rien n’est posé", () => {
    const config = resoudreConfiguration({});
    expect(config.typesDisponibles).toEqual([]);
    expect(config.cibles).toEqual({});
  });

  it("n’expose que les types réellement configurés", () => {
    const config = resoudreConfiguration({
      CAL_COM_USERNAME: "eliott",
      CAL_COM_EVENT_SITE: "site-20min",
      CAL_COM_EVENT_DECOUVERTE: "9876543",
    });
    expect(config.typesDisponibles).toEqual(["site", "decouverte"]);
    expect(config.cibles.outil).toBeUndefined();
    expect(config.cibles.decouverte).toEqual({ par: "id", eventTypeId: 9876543 });
  });

  it("garde l’ordre du contenu, pas celui des variables", () => {
    const config = resoudreConfiguration({
      CAL_COM_EVENT_DECOUVERTE: "4",
      CAL_COM_EVENT_SITE: "1",
      CAL_COM_EVENT_LOGICIEL: "3",
      CAL_COM_EVENT_OUTIL: "2",
    });
    expect(config.typesDisponibles).toEqual([
      "site",
      "outil",
      "logiciel",
      "decouverte",
    ]);
  });

  it("couvre les quatre types du contenu, sans variable orpheline", () => {
    expect(Object.keys(VARIABLES_EVENEMENT).sort()).toEqual([
      "decouverte",
      "logiciel",
      "outil",
      "site",
    ]);
  });
});

describe("estIdRendezVous", () => {
  it("accepte les quatre identifiants et refuse tout le reste", () => {
    expect(estIdRendezVous("site")).toBe(true);
    expect(estIdRendezVous("decouverte")).toBe(true);
    expect(estIdRendezVous("autre")).toBe(false);
    expect(estIdRendezVous(undefined)).toBe(false);
    expect(estIdRendezVous(12)).toBe(false);
    // `toString` traîne sur le prototype de tout objet : un `includes` naïf sur
    // un objet, plutôt que sur le tableau, l'accepterait.
    expect(estIdRendezVous("toString")).toBe(false);
  });
});
