import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { homeContent } from "@/content/home";
import { StatsSection } from "./StatsSection";

/**
 * Les chiffres de l'accueil, comptés au défilement depuis le 2026-11-02. Le
 * HTML serveur porte la valeur finale : lisible sans script, annoncée entière
 * aux lecteurs d'écran, l'unité affichée à côté sans être relue.
 */
describe("StatsSection", () => {
  it("rend chaque chiffre à sa valeur finale, unité à part", () => {
    const html = renderToStaticMarkup(
      createElement(StatsSection, { numbers: homeContent.numbers }),
    );
    for (const stat of homeContent.numbers.stats.slice(0, 3)) {
      expect(html).toContain(`data-counter-value="${stat.value}"`);
      expect(html).toContain(`<span class="sr-only">${stat.value}</span>`);
    }
    const unites = homeContent.numbers.stats
      .slice(0, 3)
      .map((stat) => stat.suffix)
      .filter(Boolean);
    expect(unites.length).toBeGreaterThan(0);
    for (const unite of unites) {
      expect(html).toContain(`<span aria-hidden="true">${unite}</span>`);
    }
    // Au moins un chiffre sans unité : rien d'affiché à côté.
    expect(homeContent.numbers.stats.slice(0, 3).some((stat) => !stat.suffix)).toBe(true);
  });
});
