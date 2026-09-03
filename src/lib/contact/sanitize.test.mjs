import { describe, expect, it } from "bun:test";
import { echapperHtml, echapperHtmlMultiligne, nettoyerEnTete } from "./sanitize.ts";
import { composerAccuseReception, composerNotification } from "./emails.ts";

/**
 * Le corps HTML des e-mails contient des données écrites par un inconnu. Une
 * régression ici est invisible jusqu'au jour où la boîte d'Eliott rend un lien
 * d'hameçonnage fabriqué par un visiteur — d'où ces tests sur les gabarits
 * eux-mêmes, et pas seulement sur la fonction d'échappement.
 */

const CHARGE = '<img src=x onerror="alert(1)">';

describe("echapperHtml", () => {
  it("neutralise les cinq caractères qui changent le sens du HTML", () => {
    expect(echapperHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  it("échappe l'esperluette EN PREMIER, sans double échappement", () => {
    expect(echapperHtml("a & b < c")).toBe("a &amp; b &lt; c");
    expect(echapperHtml("&lt;")).toBe("&amp;lt;");
  });

  it("laisse le texte ordinaire intact, accents compris", () => {
    expect(echapperHtml("Réponse sous 24 h — çà et là")).toBe(
      "Réponse sous 24 h — çà et là",
    );
  });
});

describe("echapperHtmlMultiligne", () => {
  it("échappe AVANT de convertir les sauts de ligne", () => {
    expect(echapperHtmlMultiligne("a\n<b>")).toBe("a<br />&lt;b&gt;");
  });

  it("n'introduit aucune balise depuis la donnée", () => {
    const rendu = echapperHtmlMultiligne(`${CHARGE}\n<script>x</script>`);
    expect(rendu).not.toContain("<img");
    expect(rendu).not.toContain("<script");
    expect(rendu).not.toContain("onerror=\"");
  });
});

describe("nettoyerEnTete", () => {
  it("aplatit les retours chariot d'une tentative d'injection d'en-tête", () => {
    expect(nettoyerEnTete("Jean\r\nBcc: victime@example.com")).toBe(
      "Jean Bcc: victime@example.com",
    );
  });

  it("borne la longueur", () => {
    const long = nettoyerEnTete("a".repeat(400), 40);
    expect(long.length).toBe(40);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("gabarits d'e-mail", () => {
  const soumissionHostile = {
    intention: "projet",
    nom: `Jean <script>alert("x")</script>`,
    email: "jean@example.com",
    typeProjet: "Un site & de la visibilité",
    message: `${CHARGE}\n<a href="https://phishing.example">Cliquez ici</a>`,
  };

  it("la notification n'insère aucune balise venue de la donnée", () => {
    const { html, sujet } = composerNotification(soumissionHostile);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('<a href="https://phishing.example"');
    expect(html).toContain("&lt;script&gt;");
    expect(sujet).not.toContain("\n");
  });

  it("l'accusé de réception n'insère aucune balise venue de la donnée", () => {
    const { html } = composerAccuseReception(
      soumissionHostile,
      "contact@eliottbouquerel.fr",
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('onerror="');
  });

  it("l'accusé reprend la promesse de délai affichée par le site", () => {
    const { html, texte } = composerAccuseReception(
      { intention: "projet", nom: "Jean", email: "jean@example.com", typeProjet: "Un site" },
      "contact@eliottbouquerel.fr",
    );
    // MIS À JOUR le 2026-08-31 avec la promesse : « souvent sous deux heures »
    // a été retiré partout, l'engagement tenu est 24 heures ouvrées.
    const promesse = "sous 24 heures ouvrées";
    expect(html).toContain(promesse);
    expect(texte).toContain(promesse);
  });

  it("la version texte existe et n'est jamais vide", () => {
    const notification = composerNotification(soumissionHostile);
    expect(notification.texte.length).toBeGreaterThan(0);
    expect(notification.texte).toContain("jean@example.com");
  });

  it("le sujet distingue une inscription d'une demande de projet", () => {
    const inscription = composerNotification({
      intention: "newsletter",
      email: "lecteur@example.org",
    });
    expect(inscription.sujet).toContain("Inscription");
    expect(composerNotification(soumissionHostile).sujet).toContain("Nouvelle demande");
  });
});
