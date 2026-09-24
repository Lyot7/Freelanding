import { describe, expect, it } from "bun:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SITE_URL } from "@/lib/site-url";
import { RichText } from "./RichText";

/**
 * Liaison des adresses en clair. Sans `liens`, seuls les e-mails deviennent
 * des liens (pages légales, inchangées). Avec `liens` (vue Agent), les
 * adresses web aussi : celles du site en chemin relatif dans le même onglet,
 * les autres en nouvel onglet, la ponctuation finale hors du lien.
 */
function rendre(blocks, props = {}) {
  const html = renderToStaticMarkup(createElement(RichText, { blocks, ...props }));
  return new JSDOM(html).window.document;
}

const paragraphe = (text) => ({ type: "paragraph", text });

describe("RichText : liens", () => {
  it("sans `liens`, ne lie que les e-mails et laisse les adresses web en texte", () => {
    const doc = rendre([paragraphe("Écris à contact@exemple.fr ou va sur https://exemple.fr.")]);
    const liens = [...doc.querySelectorAll("a")];
    expect(liens.map((a) => a.getAttribute("href"))).toEqual(["mailto:contact@exemple.fr"]);
    expect(doc.body.textContent).toContain("https://exemple.fr.");
  });

  it("avec `liens`, ouvre une adresse externe dans un nouvel onglet, sans la ponctuation", () => {
    const doc = rendre([paragraphe("Profil : https://github.com/Lyot7.")], { liens: true });
    const lien = doc.querySelector("a");
    expect(lien.getAttribute("href")).toBe("https://github.com/Lyot7");
    expect(lien.textContent).toBe("https://github.com/Lyot7");
    expect(lien.getAttribute("target")).toBe("_blank");
    expect(lien.getAttribute("rel")).toBe("noopener noreferrer");
    expect(doc.querySelector("p").textContent).toBe("Profil : https://github.com/Lyot7.");
  });

  it("avec `liens`, rend une adresse du site en chemin relatif, dans le même onglet", () => {
    const doc = rendre([paragraphe(`Réserver : ${SITE_URL}/contact?sujet=site#rendez-vous`)], { liens: true });
    const lien = doc.querySelector("a");
    expect(lien.getAttribute("href")).toBe("/contact?sujet=site#rendez-vous");
    expect(lien.hasAttribute("target")).toBe(false);
    expect(lien.textContent).toBe(`${SITE_URL}/contact?sujet=site#rendez-vous`);
  });

  it("avec `liens`, lie aussi les e-mails avant et après une adresse web", () => {
    const doc = rendre(
      [{ type: "list", style: "unordered", items: ["a@exemple.fr puis https://exemple.org et b@exemple.fr"] }],
      { liens: true },
    );
    const hrefs = [...doc.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["mailto:a@exemple.fr", "https://exemple.org", "mailto:b@exemple.fr"]);
    expect(doc.querySelector("li").textContent).toBe("a@exemple.fr puis https://exemple.org et b@exemple.fr");
  });

  it("avec `liens`, lie deux adresses qui ouvrent le texte et se suivent", () => {
    const doc = rendre([paragraphe("https://exemple.org https://exemple.net")], { liens: true });
    const hrefs = [...doc.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://exemple.org", "https://exemple.net"]);
    expect(doc.querySelector("p").textContent).toBe("https://exemple.org https://exemple.net");
  });

  it("avec `liens`, garde en lien externe une adresse que `URL` refuse", () => {
    const doc = rendre([paragraphe("Voir http://[ et rien d'autre")], { liens: true });
    const lien = doc.querySelector("a");
    expect(lien.getAttribute("href")).toBe("http://[");
    expect(lien.getAttribute("target")).toBe("_blank");
  });

  it("avec `liens`, laisse intact un texte sans adresse", () => {
    const doc = rendre([paragraphe("Rien à lier ici.")], { liens: true });
    expect(doc.querySelectorAll("a")).toHaveLength(0);
    expect(doc.querySelector("p").textContent).toBe("Rien à lier ici.");
  });

  it("souligne les liens et fonce le soulignement au survol, sans changer la couleur du texte", () => {
    const doc = rendre([paragraphe("contact@exemple.fr")]);
    const classes = doc.querySelector("a").getAttribute("class");
    expect(classes).toContain("underline");
    expect(classes).toContain("hover:decoration-background");
    expect(classes).not.toContain("hover:text-accent");
  });
});
