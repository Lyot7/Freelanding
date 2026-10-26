import { afterEach, describe, expect, it } from "bun:test";

import { filtreSansConsentement } from "./posthog";

/* Sans consentement, seuls la vue de page et la trace du choix partent : c'est
   le périmètre annoncé dans la politique de confidentialité. */
describe("filtreSansConsentement, sans consentement", () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it("laisse partir la vue de page et la trace du choix", () => {
    expect(filtreSansConsentement({ event: "$pageview" })).toEqual({
      event: "$pageview",
    });
    expect(filtreSansConsentement({ event: "consent_updated" })).toEqual({
      event: "consent_updated",
    });
  });

  it("jette la lecture, les clics et le rejeu", () => {
    for (const event of [
      "$pageleave",
      "$autocapture",
      "$$heatmap",
      "$snapshot",
      "$web_vitals",
      "section_viewed",
      "scroll_depth_reached",
    ]) {
      expect(filtreSansConsentement({ event })).toBeNull();
    }
  });

  it("ne laisse rien partir quand le navigateur signale « Ne pas suivre »", () => {
    globalThis.window = { navigator: { doNotTrack: "1" } };
    expect(filtreSansConsentement({ event: "$pageview" })).toBeNull();
  });

  it("ne laisse rien partir avec Global Privacy Control", () => {
    globalThis.window = { navigator: { globalPrivacyControl: true } };
    expect(filtreSansConsentement({ event: "$pageview" })).toBeNull();
  });

  it("laisse passer un envoi déjà annulé", () => {
    expect(filtreSansConsentement(null)).toBeNull();
  });
});
