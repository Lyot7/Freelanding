import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteConfig } from "@/content/site";
import { FooterContact } from "./FooterContact";

const message = createElement("p", null, "formulaire");
const rendezVous = createElement("p", null, "rendez-vous");

describe("FooterContact", () => {
  it("pose les deux onglets dans la carte en relief, l'interrupteur dans son creux", () => {
    const html = renderToStaticMarkup(
      createElement(FooterContact, { modes: siteConfig.footerForm.modes, message, rendezVous }),
    );
    expect(html).toMatch(/^<div data-section="rendez-vous" class="neo neo-carte /);
    expect(html).toContain('class="neo-mode ');
    expect(html).toContain('class="neo-mode-pastille ');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html).toContain(siteConfig.footerForm.modes.rendezVous);
    expect(html).toContain("rendez-vous</p>");
  });

  it("garde la carte quand seul le message existe", () => {
    const html = renderToStaticMarkup(createElement(FooterContact, { message }));
    expect(html).toBe('<div class="neo neo-carte w-full"><p>formulaire</p></div>');
  });
});
