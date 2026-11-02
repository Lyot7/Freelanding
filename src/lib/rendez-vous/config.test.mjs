import { describe, expect, it } from "bun:test";
import {
  CLES_COCKPIT,
  estIdRendezVous,
  resoudreAcces,
  resoudreSujet,
  resoudreConfiguration,
  typesVisibles,
  URL_COCKPIT_PAR_DEFAUT,
} from "./config.ts";
import { IDS_RENDEZ_VOUS, rendezVousContent } from "@/content/rendez-vous";

/**
 * LE CAS QUI COMPTE LE PLUS ICI EST L'ABSENCE. Le dépôt ne contient pas le
 * jeton du cockpit : l'état par défaut est « aucune variable », et cet état
 * doit produire une configuration vide, jamais une exception. C'est lui qui
 * masque proprement la section.
 */

describe("resoudreAcces", () => {
  it("rend undefined sans RDV_TOKEN, même avec une adresse", () => {
    expect(resoudreAcces({})).toBeUndefined();
    expect(resoudreAcces({ RDV_TOKEN: "   ", COCKPIT_URL: "https://x.fr" })).toBeUndefined();
  });

  it("prend l’adresse du cockpit par défaut", () => {
    expect(resoudreAcces({ RDV_TOKEN: " jeton " })).toEqual({
      url: URL_COCKPIT_PAR_DEFAUT,
      jeton: "jeton",
    });
  });

  it("ramène COCKPIT_URL à son origine", () => {
    expect(resoudreAcces({ RDV_TOKEN: "j", COCKPIT_URL: "https://cockpit.test/" })?.url).toBe(
      "https://cockpit.test",
    );
  });

  it("refuse le jeton en clair, sauf vers la machine locale", () => {
    expect(resoudreAcces({ RDV_TOKEN: "j", COCKPIT_URL: "http://cockpit.fr" })).toBeUndefined();
    expect(resoudreAcces({ RDV_TOKEN: "j", COCKPIT_URL: "http://localhost:3001" })?.url).toBe(
      "http://localhost:3001",
    );
    expect(resoudreAcces({ RDV_TOKEN: "j", COCKPIT_URL: "pas une adresse" })).toBeUndefined();
  });
});

describe("resoudreConfiguration", () => {
  it("rend une configuration VIDE quand rien n’est posé", () => {
    expect(resoudreConfiguration({})).toEqual({ cibles: {}, typesDisponibles: [] });
  });

  it("ouvre tous les types du contenu, dans son ordre, avec le jeton", () => {
    const config = resoudreConfiguration({ RDV_TOKEN: "j" });
    expect(config.typesDisponibles).toEqual([...IDS_RENDEZ_VOUS]);
    expect(config.cibles).toEqual({
      logiciel: "logiciel",
      decouverte: "decouverte",
      demonstration: "demonstration",
      "point-d-etape": "point-d-etape",
    });
  });

  it("donne une clé cockpit à chaque type du contenu", () => {
    for (const id of IDS_RENDEZ_VOUS) expect(typeof CLES_COCKPIT[id]).toBe("string");
  });
});

describe("estIdRendezVous", () => {
  it("accepte les deux identifiants et refuse tout le reste, anciens sujets compris", () => {
    expect(estIdRendezVous("logiciel")).toBe(true);
    expect(estIdRendezVous("decouverte")).toBe(true);
    // Retirés le 2026-10-31 : ils ne sont plus des types, `resoudreSujet` les traduit.
    for (const ancien of ["site", "ia", "cto", "outil"]) {
      expect(estIdRendezVous(ancien), ancien).toBe(false);
    }
    expect(estIdRendezVous("autre")).toBe(false);
    expect(estIdRendezVous(undefined)).toBe(false);
    expect(estIdRendezVous(12)).toBe(false);
    // `toString` traîne sur le prototype de tout objet : un `includes` naïf sur
    // un objet, plutôt que sur le tableau, l'accepterait.
    expect(estIdRendezVous("toString")).toBe(false);
  });
});

describe("resoudreSujet", () => {
  it("rend un sujet connu tel quel", () => {
    expect(resoudreSujet("logiciel")).toBe("logiciel");
    expect(resoudreSujet("decouverte")).toBe("decouverte");
  });

  it("redirige l’ancien sujet « outil » vers « logiciel »", () => {
    // Des liens `?sujet=outil` ont été publiés avant la fusion du 2026-09-23.
    expect(resoudreSujet("outil")).toBe("logiciel");
  });

  it("traduit les sujets retirés le 2026-10-31 : ia vers logiciel, site et cto vers découverte", () => {
    // Des liens `?sujet=ia`, `?sujet=site` et `?sujet=cto` sont publiés (mails,
    // pages indexées) : le visiteur arrive sur le sujet le plus proche.
    expect(resoudreSujet("ia")).toBe("logiciel");
    expect(resoudreSujet("site")).toBe("decouverte");
    expect(resoudreSujet("cto")).toBe("decouverte");
  });

  it("ignore tout le reste, prototype compris", () => {
    expect(resoudreSujet("autre")).toBeUndefined();
    expect(resoudreSujet(null)).toBeUndefined();
    expect(resoudreSujet(undefined)).toBeUndefined();
    expect(resoudreSujet("toString")).toBeUndefined();
    expect(resoudreSujet("constructor")).toBeUndefined();
  });
});

describe("typesVisibles — le point d'étape, réservé aux clients", () => {
  const types = rendezVousContent.types;
  const ids = (liste) => liste.map((type) => type.id);

  it("n'apparaît dans aucun choix par défaut", () => {
    expect(ids(typesVisibles(types))).toEqual(["logiciel", "decouverte", "demonstration"]);
  });

  it("reste caché quand un autre sujet est demandé", () => {
    expect(ids(typesVisibles(types, "demonstration"))).toEqual([
      "logiciel",
      "decouverte",
      "demonstration",
    ]);
  });

  it("s'ouvre seul quand `?sujet=point-d-etape` le demande", () => {
    expect(ids(typesVisibles(types, "point-d-etape"))).toEqual(["point-d-etape"]);
  });

  it("ne s'ouvre pas quand le cockpit ne le propose pas", () => {
    const publics = types.filter((type) => !type.prive);
    expect(ids(typesVisibles(publics, "point-d-etape"))).toEqual(ids(publics));
  });

  it("se résout depuis l'URL comme les autres sujets", () => {
    expect(resoudreSujet("point-d-etape")).toBe("point-d-etape");
    expect(resoudreSujet("demonstration")).toBe("demonstration");
  });
});
