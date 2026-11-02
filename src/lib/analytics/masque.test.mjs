import { describe, expect, it } from "bun:test";
import { masquerChemin, masquerJetons, proprietesDePage } from "./masque.ts";
import { avantEnvoi } from "./posthog.ts";

/**
 * LE JETON DE GESTION NE PART JAMAIS CHEZ POSTHOG. Il suffit à annuler ou
 * déplacer un rendez-vous : aucun champ envoyé ne doit le contenir.
 */

const JETON = "A".repeat(43);
const CHEMIN = `/rdv/gerer/${JETON}`;
const URL_PAGE = `https://eliottbouquerel.fr${CHEMIN}?utm_source=mail`;

describe("masquage du jeton de gestion", () => {
  it("masque le segment dans un chemin et une URL, et rien d’autre", () => {
    expect(masquerChemin(CHEMIN)).toBe("/rdv/gerer/[jeton]");
    expect(masquerChemin(URL_PAGE)).toBe("https://eliottbouquerel.fr/rdv/gerer/[jeton]?utm_source=mail");
    expect(masquerChemin("/blog/un-article")).toBe("/blog/un-article");
  });

  it("calcule les propriétés de page sans le jeton, dernier segment compris", () => {
    const proprietes = proprietesDePage(CHEMIN, URL_PAGE);
    expect(JSON.stringify(proprietes)).not.toContain(JETON);
    expect(proprietes.base.page_path).toBe("/rdv/gerer/[jeton]");
    expect(proprietes.base.content_slug).toBe("[jeton]");
  });

  it("nettoie chaque champ d’un événement avant l’envoi, à toute profondeur", () => {
    const { base, url } = proprietesDePage(CHEMIN, URL_PAGE);
    const evenement = {
      event: "$pageview",
      properties: {
        ...base,
        $current_url: URL_PAGE,
        $pathname: CHEMIN,
        $referrer: URL_PAGE,
        $set_once: { $initial_current_url: URL_PAGE },
        liste: [CHEMIN, 3, null],
        url,
      },
    };
    const envoye = avantEnvoi(evenement);
    expect(envoye).not.toBeNull();
    expect(JSON.stringify(envoye)).not.toContain(JETON);
    expect(envoye.properties.$current_url).toBe("https://eliottbouquerel.fr/rdv/gerer/[jeton]?utm_source=mail");
    expect(envoye.properties.liste).toEqual(["/rdv/gerer/[jeton]", 3, null]);
  });

  it("masque aussi les clés (carte de chaleur) et les appels d’API de la page", () => {
    const evenement = {
      event: "$$heatmap",
      properties: { $heatmap_data: { [URL_PAGE]: [{ x: 1, y: 2 }] } },
    };
    const envoye = masquerJetons(evenement);
    expect(JSON.stringify(envoye)).not.toContain(JETON);
    expect(Object.keys(envoye.properties.$heatmap_data)).toEqual([
      "https://eliottbouquerel.fr/rdv/gerer/[jeton]?utm_source=mail",
    ]);
    const reseau = {
      event: "$snapshot",
      properties: {
        $snapshot_data: [
          { name: `https://eliottbouquerel.fr/api/rendez-vous/gestion/${JETON}/annuler` },
          { name: `https://x.fr/?retour=%2Frdv%2Fgerer%2F${JETON}` },
        ],
      },
    };
    const nettoye = masquerJetons(reseau);
    expect(JSON.stringify(nettoye)).not.toContain(JETON);
    expect(nettoye.properties.$snapshot_data[0].name).toBe(
      "https://eliottbouquerel.fr/api/rendez-vous/gestion/[jeton]/annuler",
    );
  });

  it("rend tel quel un événement sans lien de gestion", () => {
    const evenement = { event: "$pageview", properties: { $pathname: "/contact" } };
    expect(masquerJetons(evenement)).toBe(evenement);
  });

  it("laisse passer un événement que JSON ne sait pas écrire", () => {
    const circulaire = { event: "x" };
    circulaire.soi = circulaire;
    expect(masquerJetons(circulaire)).toBe(circulaire);
  });

  it("laisse passer un événement vide sans le toucher", () => {
    expect(masquerJetons(undefined)).toBeUndefined();
  });

  it("garde le filtre de consentement", () => {
    expect(avantEnvoi(null)).toBeNull();
    expect(avantEnvoi({ event: "$autocapture", properties: { $pathname: CHEMIN } })).toBeNull();
  });
});
