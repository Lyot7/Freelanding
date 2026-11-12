import { describe, expect, it } from "bun:test";
import {
  CLES_COCKPIT,
  estIdRendezVous,
  estTypeClient,
  resoudreAcces,
  resoudreSujet,
  resoudreConfiguration,
  typesClient,
  typesVisibles,
  URL_COCKPIT_PAR_DEFAUT,
} from "./config.ts";
import { IDS_CLIENT, IDS_RENDEZ_VOUS, rendezVousContent } from "@/content/rendez-vous";

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
      site: "site",
      ia: "ia",
      decouverte: "decouverte",
      "point-rapide": "point-rapide",
      proposition: "proposition",
      demonstration: "demonstration",
      "point-d-etape": "point-d-etape",
    });
  });

  it("donne une clé cockpit à chaque type du contenu, identique à son identifiant", () => {
    for (const id of IDS_RENDEZ_VOUS) expect(CLES_COCKPIT[id]).toBe(id);
    expect(Object.keys(CLES_COCKPIT).sort()).toEqual([...IDS_RENDEZ_VOUS].sort());
  });
});

describe("rendez-vous de clients", () => {
  const types = rendezVousContent.types;
  it("estTypeClient reconnaît exactement les quatre sujets de clients", () => {
    for (const id of IDS_RENDEZ_VOUS) expect(estTypeClient(id), id).toBe(IDS_CLIENT.includes(id));
    expect(estTypeClient(undefined)).toBe(false);
  });

  it("typesClient garde les quatre, dans l'ordre du contenu", () => {
    expect(typesClient(types).map((type) => type.id)).toEqual([
      "point-rapide",
      "demonstration",
      "proposition",
      "point-d-etape",
    ]);
  });
});

describe("estIdRendezVous", () => {
  it("accepte les huit identifiants et refuse tout le reste, anciens sujets compris", () => {
    for (const id of IDS_RENDEZ_VOUS) {
      expect(estIdRendezVous(id), id).toBe(true);
    }
    // Retirés ou renommés : ils ne sont plus des types, `resoudreSujet` les traduit.
    for (const ancien of ["cto", "outil", "autre"]) {
      expect(estIdRendezVous(ancien), ancien).toBe(false);
    }
    expect(estIdRendezVous(undefined)).toBe(false);
    expect(estIdRendezVous(12)).toBe(false);
    // `toString` traîne sur le prototype de tout objet : un `includes` naïf sur
    // un objet, plutôt que sur le tableau, l'accepterait.
    expect(estIdRendezVous("toString")).toBe(false);
  });
});

describe("resoudreSujet", () => {
  it("rend un sujet connu tel quel, site et ia compris", () => {
    for (const id of IDS_RENDEZ_VOUS) expect(resoudreSujet(id)).toBe(id);
    expect(resoudreSujet("site")).toBe("site");
    expect(resoudreSujet("ia")).toBe("ia");
  });

  it("redirige l’ancien sujet « outil » vers « logiciel »", () => {
    // Des liens `?sujet=outil` ont été publiés avant la fusion du 2026-09-23.
    expect(resoudreSujet("outil")).toBe("logiciel");
  });

  it("traduit « cto » et « autre » vers « decouverte »", () => {
    // « cto » n'est plus proposé depuis le 2026-10-31 ; « autre » est le nom du bouton « Autre ».
    expect(resoudreSujet("cto")).toBe("decouverte");
    expect(resoudreSujet("autre")).toBe("decouverte");
  });

  it("ignore tout le reste, prototype compris", () => {
    expect(resoudreSujet("nimporte-quoi")).toBeUndefined();
    expect(resoudreSujet(null)).toBeUndefined();
    expect(resoudreSujet(undefined)).toBeUndefined();
    expect(resoudreSujet(42)).toBeUndefined();
    expect(resoudreSujet("toString")).toBeUndefined();
    expect(resoudreSujet("constructor")).toBeUndefined();
  });
});

describe("typesVisibles : démonstration et point d'étape, réservés aux clients", () => {
  const types = rendezVousContent.types;
  const ids = (liste) => liste.map((type) => type.id);
  const PUBLICS = ["logiciel", "site", "ia", "decouverte"];

  it("marque les rendez-vous de clients comme privés, et eux seuls", () => {
    expect(ids(types.filter((type) => type.prive)).sort()).toEqual([...IDS_CLIENT].sort());
  });

  it("ne liste ni l'un ni l'autre par défaut", () => {
    expect(ids(typesVisibles(types))).toEqual(PUBLICS);
  });

  it("reste caché quand un sujet public est demandé", () => {
    expect(ids(typesVisibles(types, "ia"))).toEqual(PUBLICS);
  });

  it("s'ouvre seul quand `?sujet=demonstration` le demande", () => {
    expect(ids(typesVisibles(types, "demonstration"))).toEqual(["demonstration"]);
  });

  it("s'ouvre seul quand `?sujet=point-d-etape` le demande", () => {
    expect(ids(typesVisibles(types, "point-d-etape"))).toEqual(["point-d-etape"]);
  });

  it("ne s'ouvre pas quand le cockpit ne le propose pas", () => {
    const publics = types.filter((type) => !type.prive);
    expect(ids(typesVisibles(publics, "point-d-etape"))).toEqual(ids(publics));
    expect(ids(typesVisibles(publics, "demonstration"))).toEqual(ids(publics));
  });

  it("se résout depuis l'URL comme les autres sujets", () => {
    expect(resoudreSujet("point-d-etape")).toBe("point-d-etape");
    expect(resoudreSujet("demonstration")).toBe("demonstration");
  });
});
