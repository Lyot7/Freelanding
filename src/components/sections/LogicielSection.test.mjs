import { afterEach, describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteFeatures } from "@/content/features";
import { homeContent } from "@/content/home";
import { methodePromise } from "@/content/testimonials";
// Types seuls (`LogicielDemoContent`, `EtapeDemo`) : chargé pour que la mesure
// de couverture voie le module, qui n'a aucune instruction exécutable.
import "@/lib/content/types";
import { LogicielSection } from "./LogicielSection";

/**
 * La section noire du logiciel métier (2026-10-16), rendue côté serveur : le
 * titre et ce que l'outil change à gauche, la démonstration à droite, et la
 * citation signée reprise de l'ancienne section méthode en pied.
 */
const logiciel = homeContent.logiciel;
const rendre = (props) => renderToStaticMarkup(createElement(LogicielSection, props));
const BANDE = /class="absolute bottom-0 right-0[^"]*bg-muted/;

describe("LogicielSection", () => {
  const auteur = methodePromise.author;
  const signature = siteFeatures.signature;

  afterEach(() => {
    methodePromise.author = auteur;
    siteFeatures.signature = signature;
  });

  it("rend le titre, le paragraphe, l'appel et la démonstration", () => {
    const html = rendre({ logiciel });
    expect(html).toContain('id="logiciel"');
    expect(html).toContain(logiciel.eyebrow);
    for (const ligne of logiciel.titleLines) expect(html).toContain(ligne);
    expect(html).toContain(`href="${logiciel.cta.href}"`);
    expect(html).toContain(logiciel.cta.label);
    // Le fragment mis en avant est rendu dans sa propre classe de couleur.
    expect(html).toMatch(/class="text-foreground"[^>]*>il vous reste à relire et à envoyer\./);
    expect(html).toContain('role="tablist"');
    expect(html).toContain(logiciel.demo.titre);
  });

  it("signe la citation de la méthode en pied de section", () => {
    const html = rendre({ logiciel });
    expect(html).toContain(auteur.name);
    expect(html).toContain(auteur.role);
    expect(html).toContain("Ce que je vends commence là où il ne suffit plus.");
  });

  it("ne pose la bande claire du bas qu'avec bottomAccent", () => {
    expect(rendre({ logiciel, bottomAccent: "muted" })).toMatch(BANDE);
    expect(rendre({ logiciel })).not.toMatch(BANDE);
  });

  it("rend le paragraphe sans fragment mis en avant quand il n'y en a pas", () => {
    const html = rendre({ logiciel: { ...logiciel, statementEmphasis: undefined } });
    expect(html).toContain("il vous reste à relire et à envoyer.");
    expect(html).not.toMatch(/class="text-foreground"[^>]*>il vous reste/);
  });

  it("tient sans portrait, sans rôle ni signature", () => {
    const html = rendre({ logiciel });
    expect(html).toContain(`role="img" aria-label="${auteur.avatar.alt}"`);
    expect(html).toContain("<svg");

    methodePromise.author = { name: auteur.name, avatar: { src: "/eliott.jpg", alt: "Eliott" } };
    siteFeatures.signature = false;
    const sansRole = rendre({ logiciel });
    expect(sansRole).toContain('role="img" aria-label="Eliott"');
    expect(sansRole).not.toContain(auteur.role);
    expect(sansRole).not.toContain("<svg");

    methodePromise.author = undefined;
    const sansAuteur = rendre({ logiciel });
    expect(sansAuteur).not.toContain(auteur.name);
    expect(sansAuteur).not.toContain('role="img"');
    expect(sansAuteur).toContain("Ce que je vends commence là où il ne suffit plus.");
  });
});
