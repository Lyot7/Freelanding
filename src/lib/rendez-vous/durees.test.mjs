import { describe, expect, it } from "bun:test";
import { estDureePlausible, lireDurees, resoudreDuree } from "./durees.ts";

describe("lireDurees", () => {
  it("lit la réponse de GET /v2/event-types", () => {
    const charge = {
      status: "success",
      data: [{ lengthInMinutes: 45, lengthInMinutesOptions: [60, 30, 45] }],
    };
    expect(lireDurees(charge)).toEqual({ options: [30, 45, 60], defaut: 45 });
  });

  it("garde la durée par défaut quand le type n'en propose qu'une", () => {
    expect(lireDurees({ data: [{ lengthInMinutes: 30 }] })).toEqual({
      options: [30],
      defaut: 30,
    });
  });

  it("ajoute la durée par défaut absente des options et écarte l'absurde", () => {
    const charge = { data: { lengthInMinutes: 20, lengthInMinutesOptions: [15, "x", 0, 9999] } };
    expect(lireDurees(charge)).toEqual({ options: [15, 20], defaut: 20 });
  });

  it("relit sa propre forme, côté navigateur", () => {
    expect(lireDurees({ options: [15, 30], defaut: 30 })).toEqual({
      options: [15, 30],
      defaut: 30,
    });
  });

  it("rend undefined sur une charge inexploitable", () => {
    expect(lireDurees(null)).toBeUndefined();
    expect(lireDurees("<html>")).toBeUndefined();
    expect(lireDurees({ data: [] })).toBeUndefined();
    expect(lireDurees({ data: [{ lengthInMinutes: "30" }] })).toBeUndefined();
  });
});

describe("resoudreDuree", () => {
  const durees = { options: [15, 30, 45], defaut: 30 };

  it("accepte une option proposée, en nombre ou en chaîne", () => {
    expect(resoudreDuree(45, durees)).toBe(45);
    expect(resoudreDuree("15", durees)).toBe(15);
  });

  it("retombe sur le défaut pour une valeur absente ou non proposée", () => {
    expect(resoudreDuree(null, durees)).toBe(30);
    expect(resoudreDuree("", durees)).toBe(30);
    expect(resoudreDuree("90", durees)).toBe(30);
    expect(resoudreDuree("abc", durees)).toBe(30);
  });

  it("rend undefined quand les durées sont inconnues", () => {
    expect(resoudreDuree("30", undefined)).toBeUndefined();
  });
});

describe("estDureePlausible", () => {
  it("refuse ce qui n'est pas un entier de minutes raisonnable", () => {
    expect(estDureePlausible(30)).toBe(true);
    expect(estDureePlausible(2.5)).toBe(false);
    expect(estDureePlausible(0)).toBe(false);
    expect(estDureePlausible(1000)).toBe(false);
    expect(estDureePlausible("30")).toBe(false);
  });
});
