import { describe, expect, it } from "bun:test";
import {
  adresseAppelante,
  creerLimiteur,
  LIMITE_CONTACT,
} from "./rate-limit.ts";

/**
 * L'horloge est INJECTÉE dans `verifier` : sans ça, tester une fenêtre de
 * quinze minutes voudrait dire attendre quinze minutes, donc ne jamais tester.
 */

const T0 = 1_700_000_000_000;

describe("creerLimiteur", () => {
  it("laisse passer jusqu'au plafond puis refuse", () => {
    const limiteur = creerLimiteur({ fenetreMs: 60_000, maxParFenetre: 3, maxCles: 10 });
    expect(limiteur.verifier("ip-a", T0)).toEqual({ autorise: true, restant: 2 });
    expect(limiteur.verifier("ip-a", T0 + 1)).toEqual({ autorise: true, restant: 1 });
    expect(limiteur.verifier("ip-a", T0 + 2)).toEqual({ autorise: true, restant: 0 });

    const refus = limiteur.verifier("ip-a", T0 + 3);
    expect(refus.autorise).toBe(false);
    expect(refus.reessayerDansS).toBeGreaterThan(0);
  });

  it("compte séparément chaque appelant", () => {
    const limiteur = creerLimiteur({ fenetreMs: 60_000, maxParFenetre: 1, maxCles: 10 });
    expect(limiteur.verifier("ip-a", T0).autorise).toBe(true);
    expect(limiteur.verifier("ip-b", T0).autorise).toBe(true);
    expect(limiteur.verifier("ip-a", T0).autorise).toBe(false);
    expect(limiteur.verifier("ip-b", T0).autorise).toBe(false);
  });

  it("rouvre l'accès dès que la fenêtre a glissé", () => {
    const limiteur = creerLimiteur({ fenetreMs: 60_000, maxParFenetre: 2, maxCles: 10 });
    limiteur.verifier("ip-a", T0);
    limiteur.verifier("ip-a", T0 + 1_000);
    expect(limiteur.verifier("ip-a", T0 + 2_000).autorise).toBe(false);
    // La toute première requête sort de la fenêtre : une place se libère.
    expect(limiteur.verifier("ip-a", T0 + 60_001).autorise).toBe(true);
  });

  it("annonce un délai d'attente cohérent avec la fenêtre", () => {
    const limiteur = creerLimiteur({ fenetreMs: 60_000, maxParFenetre: 1, maxCles: 10 });
    limiteur.verifier("ip-a", T0);
    const refus = limiteur.verifier("ip-a", T0 + 20_000);
    expect(refus.reessayerDansS).toBe(40);
  });

  it("ne refuse pas indéfiniment : les refus ne rallongent pas la fenêtre", () => {
    // Piège classique de la fenêtre glissante : compter aussi les requêtes
    // refusées repousse la réouverture à chaque tentative, et un robot qui
    // martèle bloquerait un humain pour toujours.
    const limiteur = creerLimiteur({ fenetreMs: 10_000, maxParFenetre: 1, maxCles: 10 });
    limiteur.verifier("ip-a", T0);
    for (let i = 1; i <= 20; i += 1) limiteur.verifier("ip-a", T0 + i * 100);
    expect(limiteur.verifier("ip-a", T0 + 10_001).autorise).toBe(true);
  });

  it("borne le nombre de clefs suivies", () => {
    const limiteur = creerLimiteur({ fenetreMs: 60_000, maxParFenetre: 5, maxCles: 3 });
    for (let i = 0; i < 50; i += 1) limiteur.verifier(`ip-${i}`, T0 + i);
    expect(limiteur.taille()).toBeLessThanOrEqual(3);
  });

  it("purge les clefs devenues inactives", () => {
    const limiteur = creerLimiteur({ fenetreMs: 1_000, maxParFenetre: 5, maxCles: 2 });
    limiteur.verifier("ip-a", T0);
    limiteur.verifier("ip-b", T0);
    limiteur.verifier("ip-c", T0 + 5_000);
    expect(limiteur.taille()).toBeLessThanOrEqual(2);
    // « ip-a » a été oubliée : elle repart avec un quota plein.
    expect(limiteur.verifier("ip-a", T0 + 5_001)).toEqual({
      autorise: true,
      restant: 4,
    });
  });

  it("garde un réglage de production plausible", () => {
    expect(LIMITE_CONTACT.maxParFenetre).toBeGreaterThanOrEqual(3);
    expect(LIMITE_CONTACT.fenetreMs).toBeGreaterThanOrEqual(60_000);
  });
});

describe("adresseAppelante", () => {
  it("retient le PREMIER élément de x-forwarded-for, pas le dernier", () => {
    const entetes = new Headers({
      "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178",
    });
    expect(adresseAppelante(entetes)).toBe("203.0.113.7");
  });

  it("retombe sur x-real-ip", () => {
    expect(adresseAppelante(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe(
      "198.51.100.4",
    );
  });

  it("renvoie une clef de repli quand aucun en-tête ne porte l'adresse", () => {
    expect(adresseAppelante(new Headers())).toBe("sans-adresse");
  });

  it("ignore un x-forwarded-for vide", () => {
    expect(adresseAppelante(new Headers({ "x-forwarded-for": " , " }))).toBe(
      "sans-adresse",
    );
  });
});
