import { describe, expect, it } from "bun:test";
import {
  ajouterJours,
  ecartEnJours,
  ajouterMois,
  dernierJourDuMois,
  estDernierMois,
  estJourValide,
  estPremierMois,
  fenetreMois,
  formaterMois,
  grilleMois,
  JOURS_SEMAINE,
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

describe("ajouterMois et dernierJourDuMois", () => {
  it("traverse les années et les mois courts", () => {
    expect(ajouterMois("2026-12", 1)).toBe("2027-01");
    expect(ajouterMois("2026-01", -1)).toBe("2025-12");
    expect(dernierJourDuMois("2026-02")).toBe("2026-02-28");
    expect(dernierJourDuMois("2028-02")).toBe("2028-02-29");
    expect(dernierJourDuMois("2026-10")).toBe("2026-10-31");
  });
});

describe("fenetreMois", () => {
  it("couvre le mois demandé, du premier au dernier jour", () => {
    expect(fenetreMois("2026-10", MAINTENANT)).toEqual({
      mois: "2026-10",
      debut: "2026-10-01",
      fin: "2026-10-31",
    });
  });

  it("commence aujourd’hui pour le mois courant", () => {
    const fenetre = fenetreMois("2026-09", new Date("2026-09-15T08:00:00Z"));
    expect(fenetre.debut).toBe("2026-09-15");
    expect(fenetre.fin).toBe("2026-09-30");
  });

  it("ramène un mois passé au mois courant", () => {
    expect(fenetreMois("2020-01", MAINTENANT).mois).toBe("2026-09");
  });

  it("ramène un mois trop lointain au mois de l’horizon, coupé à l’horizon", () => {
    const dernier = ajouterJours("2026-09-01", HORIZON_JOURS);
    const fenetre = fenetreMois("2099-01", MAINTENANT);
    expect(fenetre.mois).toBe(dernier.slice(0, 7));
    expect(fenetre.fin).toBe(dernier);
  });

  it("ignore une valeur qui n’est pas un mois", () => {
    expect(fenetreMois("", MAINTENANT).mois).toBe("2026-09");
    expect(fenetreMois("2026-13", MAINTENANT).mois).toBe("2026-09");
    expect(fenetreMois("../../etc", MAINTENANT).mois).toBe("2026-09");
  });
});

describe("bornes de navigation", () => {
  it("interdit de reculer avant le mois courant", () => {
    expect(estPremierMois("2026-09", MAINTENANT)).toBe(true);
    expect(estPremierMois("2026-10", MAINTENANT)).toBe(false);
  });

  it("interdit d’avancer au-delà de l’horizon", () => {
    expect(estDernierMois("2026-09", MAINTENANT)).toBe(false);
    const dernier = ajouterJours("2026-09-01", HORIZON_JOURS);
    expect(estDernierMois(dernier.slice(0, 7), MAINTENANT)).toBe(true);
  });
});

describe("grilleMois", () => {
  it("aligne le premier du mois sur sa colonne, lundi en tête", () => {
    // 1er octobre 2026 : un jeudi, donc trois cases vides avant.
    const cases = grilleMois("2026-10");
    expect(cases.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(cases.at(-1)).toBe("2026-10-31");
    expect(cases.length).toBe(3 + 31);
  });

  it("ne laisse aucune case vide quand le mois commence un lundi", () => {
    expect(grilleMois("2026-06")[0]).toBe("2026-06-01");
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

  it("écrit le mois et les en-têtes de colonnes en français", () => {
    expect(formaterMois("2026-10")).toBe("octobre 2026");
    expect(JOURS_SEMAINE[0]).toBe("lun.");
    expect(JOURS_SEMAINE[6]).toBe("dim.");
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
      fin: "2026-09-30",
      mois: "2026-09",
      libelle: "septembre 2026",
      premiere: true,
      derniere: false,
    },
    durees: { options: [15, 30, 45], defaut: 30 },
    duree: 30,
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
    expect(lue?.fenetre.mois).toBe("2026-09");
    expect(lue?.durees).toEqual({ options: [15, 30, 45], defaut: 30 });
    expect(lue?.duree).toBe(30);
    expect(lue?.jours[0].creneaux[0].heure).toBe("17:00");
  });

  it("tolère des durées absentes : le sélecteur disparaît, rien ne casse", () => {
    const lue = lireReponseCreneaux({ ...reponse, durees: null, duree: null });
    expect(lue?.durees).toBeNull();
    expect(lue?.duree).toBeNull();
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
