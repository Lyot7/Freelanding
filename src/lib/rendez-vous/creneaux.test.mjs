import { describe, expect, it } from "bun:test";
import {
  ajouterJours,
  ecartEnJours,
  estDerniereSemaine,
  estJourValide,
  estPremiereSemaine,
  fenetreSemaine,
  formaterFenetre,
  formaterHeure,
  formaterJour,
  formaterJourCourt,
  HORIZON_JOURS,
  jourParis,
  lireCreneaux,
  lireReponseCreneaux,
} from "./creneaux.ts";

/**
 * DEUX FAMILLES DE DÉFAUTS SONT VISÉES ICI, et aucune ne se voit à l'écran :
 *
 *   1. le décalage d'un jour. Un instant du soir en heure d'été appartient déjà
 *      au lendemain UTC : tout ce qui passe par `toISOString().slice(0, 10)`
 *      affiche alors la mauvaise date, une fois sur douze, le soir seulement ;
 *   2. la charge utile inattendue. L'API v2 a servi deux formes de créneaux
 *      selon la version d'en-tête, et un mandataire peut renvoyer du HTML en
 *      200. Une entrée illisible ne doit jamais effacer les vingt qui
 *      l'entourent, ni faire tomber le rendu.
 */

/** 1er septembre 2026, 13 h UTC, soit 15 h à Paris. */
const MAINTENANT = new Date("2026-09-01T13:00:00Z");

describe("jourParis", () => {
  it("rend le jour PARISIEN et non le jour UTC", () => {
    // 22 h 30 UTC le 1er = 00 h 30 le 2 à Paris, en heure d'été.
    expect(jourParis(new Date("2026-09-01T22:30:00Z"))).toBe("2026-09-02");
    expect(jourParis(new Date("2026-09-01T13:00:00Z"))).toBe("2026-09-01");
    // En heure d'hiver le décalage n'est que d'une heure : 23 h 30 UTC le 1er
    // décembre est encore le 1er à Paris, 23 h 30.
    expect(jourParis(new Date("2026-12-01T22:30:00Z"))).toBe("2026-12-01");
  });
});

describe("estJourValide", () => {
  it("refuse ce qui ressemble à une date sans en être une", () => {
    expect(estJourValide("2026-09-01")).toBe(true);
    expect(estJourValide("2026-02-31")).toBe(false);
    expect(estJourValide("2026-13-01")).toBe(false);
    expect(estJourValide("2026-9-1")).toBe(false);
    expect(estJourValide("")).toBe(false);
    expect(estJourValide(undefined)).toBe(false);
    expect(estJourValide(20260901)).toBe(false);
  });
});

describe("ajouterJours et ecartEnJours", () => {
  it("traverse un changement d’heure sans perdre ni répéter un jour", () => {
    // Passage à l'heure d'hiver : nuit du 24 au 25 octobre 2026.
    expect(ajouterJours("2026-10-24", 1)).toBe("2026-10-25");
    expect(ajouterJours("2026-10-25", 1)).toBe("2026-10-26");
    expect(ecartEnJours("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("compte à rebours", () => {
    expect(ajouterJours("2026-09-01", -1)).toBe("2026-08-31");
    expect(ecartEnJours("2026-09-08", "2026-09-01")).toBe(-7);
  });
});

describe("fenetreSemaine", () => {
  it("rend sept jours, bornes comprises", () => {
    const fenetre = fenetreSemaine("2026-09-07", MAINTENANT);
    expect(fenetre).toEqual({ debut: "2026-09-07", fin: "2026-09-13" });
  });

  it("ramène une demande passée à aujourd’hui", () => {
    expect(fenetreSemaine("2020-01-01", MAINTENANT).debut).toBe("2026-09-01");
  });

  it("ramène une demande au-delà de l’horizon", () => {
    const fenetre = fenetreSemaine("2099-01-01", MAINTENANT);
    expect(fenetre.debut).toBe(ajouterJours("2026-09-01", HORIZON_JOURS));
  });

  it("ignore une valeur qui n’est pas une date", () => {
    expect(fenetreSemaine("", MAINTENANT).debut).toBe("2026-09-01");
    expect(fenetreSemaine("hier", MAINTENANT).debut).toBe("2026-09-01");
    expect(fenetreSemaine("../../etc", MAINTENANT).debut).toBe("2026-09-01");
  });
});

describe("bornes de navigation", () => {
  it("interdit de reculer avant aujourd’hui", () => {
    expect(estPremiereSemaine("2026-09-01", MAINTENANT)).toBe(true);
    expect(estPremiereSemaine("2026-09-08", MAINTENANT)).toBe(false);
  });

  it("interdit d’avancer au-delà de l’horizon", () => {
    expect(estDerniereSemaine("2026-09-01", MAINTENANT)).toBe(false);
    const dernier = ajouterJours("2026-09-01", HORIZON_JOURS);
    expect(estDerniereSemaine(dernier, MAINTENANT)).toBe(true);
  });
});

describe("formatage", () => {
  it("affiche l’heure de PARIS, quel que soit le fuseau du serveur", () => {
    expect(formaterHeure("2026-09-01T13:00:00.000Z")).toBe("15:00");
    expect(formaterHeure("2026-09-01T15:00:00.000+02:00")).toBe("15:00");
    // Heure d'hiver : décalage d'une heure seulement.
    expect(formaterHeure("2026-12-01T13:00:00.000Z")).toBe("14:00");
  });

  it("écrit le jour en français, PREMIER du mois compris", () => {
    // `Intl` rend « mardi 1 septembre ». Le français écrit « 1er ».
    expect(formaterJour("2026-09-01")).toBe("mardi 1er septembre");
    expect(formaterJour("2026-09-02")).toBe("mercredi 2 septembre");
    expect(formaterJourCourt("2026-09-01")).toBe("mar. 1er");
    expect(formaterJourCourt("2026-09-02")).toBe("mer. 2");
  });

  it("écrit la fenêtre en deux dates courtes", () => {
    expect(formaterFenetre({ debut: "2026-08-31", fin: "2026-09-06" })).toBe(
      "31 août au 6 sept.",
    );
    expect(formaterFenetre({ debut: "2026-09-01", fin: "2026-09-07" })).toBe(
      "1er sept. au 7 sept.",
    );
  });
});

describe("lireCreneaux", () => {
  const charge = {
    data: {
      "2026-09-02": [
        { start: "2026-09-02T16:00:00.000+02:00" },
        { start: "2026-09-02T15:00:00.000+02:00" },
      ],
      "2026-09-01": [{ start: "2026-09-01T17:00:00.000+02:00" }],
    },
  };

  it("groupe par jour, trie les jours ET les heures", () => {
    const jours = lireCreneaux(charge, MAINTENANT);
    expect(jours.map((j) => j.jour)).toEqual(["2026-09-01", "2026-09-02"]);
    expect(jours[0].libelleCourt).toBe("mar. 1er");
    expect(jours[1].creneaux.map((c) => c.heure)).toEqual(["15:00", "16:00"]);
  });

  it("compose un résumé qui porte le jour ET l’heure", () => {
    const jours = lireCreneaux(charge, MAINTENANT);
    expect(jours[0].creneaux[0].resume).toBe("mardi 1er septembre à 17:00");
  });

  it("accepte aussi la forme « tableau de chaînes »", () => {
    const jours = lireCreneaux(
      { data: { "2026-09-01": ["2026-09-01T17:00:00.000+02:00"] } },
      MAINTENANT,
    );
    expect(jours[0].creneaux[0].heure).toBe("17:00");
  });

  it("écarte les créneaux déjà passés, sans toucher aux autres", () => {
    const jours = lireCreneaux(
      {
        data: {
          "2026-09-01": [
            { start: "2026-09-01T09:00:00.000+02:00" },
            { start: "2026-09-01T17:00:00.000+02:00" },
          ],
        },
      },
      MAINTENANT,
    );
    expect(jours[0].creneaux.map((c) => c.heure)).toEqual(["17:00"]);
  });

  it("écarte une entrée illisible sans perdre ses voisines", () => {
    const jours = lireCreneaux(
      {
        data: {
          "2026-09-01": [
            null,
            42,
            { start: 12 },
            { start: "pas une date" },
            { start: "2026-09-01T17:00:00.000+02:00" },
          ],
        },
      },
      MAINTENANT,
    );
    expect(jours[0].creneaux).toHaveLength(1);
  });

  it("ne rend pas un jour vidé de tous ses créneaux", () => {
    const jours = lireCreneaux(
      { data: { "2026-09-01": [{ start: "2026-09-01T09:00:00.000+02:00" }] } },
      MAINTENANT,
    );
    expect(jours).toEqual([]);
  });

  it("rend un tableau vide sur n’importe quelle charge inattendue", () => {
    expect(lireCreneaux(undefined, MAINTENANT)).toEqual([]);
    expect(lireCreneaux(null, MAINTENANT)).toEqual([]);
    expect(lireCreneaux("<html>", MAINTENANT)).toEqual([]);
    expect(lireCreneaux({ data: [] }, MAINTENANT)).toEqual([]);
    expect(lireCreneaux({ data: { "pas-un-jour": [] } }, MAINTENANT)).toEqual([]);
  });
});

describe("lireReponseCreneaux", () => {
  const reponse = {
    fenetre: {
      debut: "2026-09-01",
      fin: "2026-09-07",
      libelle: "1 sept. au 7 sept.",
      premiere: true,
      derniere: false,
    },
    jours: [
      {
        jour: "2026-09-01",
        libelle: "mardi 1er septembre",
        libelleCourt: "mar. 1er",
        creneaux: [
          {
            debut: "2026-09-01T17:00:00.000+02:00",
            heure: "17:00",
            resume: "mardi 1er septembre à 17:00",
          },
        ],
      },
    ],
  };

  it("relit une réponse complète", () => {
    const lue = lireReponseCreneaux(reponse);
    expect(lue?.fenetre.premiere).toBe(true);
    expect(lue?.jours[0].creneaux[0].heure).toBe("17:00");
  });

  it("refuse une réponse amputée plutôt que de rendre du vide trompeur", () => {
    expect(lireReponseCreneaux(undefined)).toBeUndefined();
    expect(lireReponseCreneaux({ jours: [] })).toBeUndefined();
    expect(lireReponseCreneaux({ fenetre: reponse.fenetre })).toBeUndefined();
    expect(
      lireReponseCreneaux({
        fenetre: { ...reponse.fenetre, premiere: "oui" },
        jours: [],
      }),
    ).toBeUndefined();
  });

  it("écarte un jour dont les créneaux sont tous illisibles", () => {
    const lue = lireReponseCreneaux({
      fenetre: reponse.fenetre,
      jours: [
        {
          jour: "2026-09-01",
          libelle: "mardi 1er septembre",
          libelleCourt: "mar. 1er",
          creneaux: [{}],
        },
      ],
    });
    expect(lue?.jours).toEqual([]);
  });
});
