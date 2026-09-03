import { describe, expect, it } from "bun:test";

import { preferredSourceUrl } from "./preferred-source";

describe("preferredSourceUrl", () => {
  it("construit l'adresse Google depuis le domaine nu", () => {
    expect(preferredSourceUrl("https://eliottbouquerel.fr")).toBe(
      "https://www.google.com/preferences/source?q=eliottbouquerel.fr",
    );
  });

  it("retire le www, que Google n'attend pas dans le paramètre", () => {
    expect(preferredSourceUrl("https://www.eliottbouquerel.fr/contact")).toBe(
      "https://www.google.com/preferences/source?q=eliottbouquerel.fr",
    );
  });

  it("accepte un sous-domaine, éligible chez Google", () => {
    expect(preferredSourceUrl("https://lab.eliottbouquerel.fr/")).toBe(
      "https://www.google.com/preferences/source?q=lab.eliottbouquerel.fr",
    );
  });

  it("ne rend rien en local : un bouton vers localhost serait un lien mort", () => {
    expect(preferredSourceUrl("http://localhost:3000")).toBeNull();
    expect(preferredSourceUrl("http://macbook.local")).toBeNull();
  });

  it("ne rend rien sur une adresse invalide plutôt que de publier un lien cassé", () => {
    expect(preferredSourceUrl("pas une url")).toBeNull();
  });
});
