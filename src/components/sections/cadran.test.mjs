import { describe, expect, it } from "bun:test";

import { formatHeure, pointSurCadran } from "./cadran";

describe("le cadran du héros", () => {
  it("écrit l'heure avec deux chiffres aux minutes", () => {
    expect(formatHeure(660)).toBe("11 h 00");
    expect(formatHeure(132)).toBe("2 h 12");
    expect(formatHeure(131.6)).toBe("2 h 12");
  });

  it("place midi en haut et 3 h à droite", () => {
    expect(pointSurCadran(0, 100, 500)).toEqual({ x: 500, y: 400 });
    expect(pointSurCadran(180, 100, 500)).toEqual({ x: 600, y: 500 });
  });
});
