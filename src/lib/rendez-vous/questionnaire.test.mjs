import { describe, expect, it } from "bun:test";
import { euros } from "../../content/offre.ts";
import { rendezVousContent } from "../../content/rendez-vous.ts";
import { siteConfig } from "../../content/site.ts";
import {
  BORNES_BUDGET,
  BUDGET_INCONNU,
  composerNotes,
  LEGENDE_OBJECTIF,
  LIBELLE_NOTE_TELEPHONE,
  libelleOption,
  LONGUEUR_LIGNE_MAX,
  OPTIONS_ECHEANCE,
  optionsObjectif,
  rattacherObjectif,
  rattacherTranche,
  rendezVousDuTypeProjet,
  reponsesLisibles,
  tranchesBudget,
} from "./questionnaire.ts";

/**
 * LA RÉSERVATION NE POSE PLUS DE QUESTIONNAIRE (2026-11-12). Ce module garde
 * ce que le formulaire de contact partage encore (tranches de budget, objectif,
 * échéance) et la mise en forme des notes et des réponses d'un rendez-vous :
 * téléphone (facultatif pour un client), ligne libre.
 *
 * LES TRANCHES NE CITENT AUCUN PRIX D'ELIOTT, décision du 2026-11-01.
 */

const [A, B, C] = BORNES_BUDGET;
const TELEPHONE = "06 12 34 56 78";

describe("tranchesBudget", () => {
  it("ne laisse deviner aucun prix d'Eliott : ni son ancien plancher, ni ses multiples", () => {
    for (const borne of BORNES_BUDGET) expect([6000, 12000, 24000]).not.toContain(borne);
    for (const t of tranchesBudget()) expect(t.libelle).not.toMatch(/\b6\s000/u);
  });

  it("ne pose jamais deux bornes voisines à moins de moitié d’écart", () => {
    for (let i = 0; i < BORNES_BUDGET.length - 1; i += 1) {
      expect(BORNES_BUDGET[i + 1] / BORNES_BUDGET[i]).toBeGreaterThanOrEqual(1.5);
    }
  });

  it("encadre les bornes : sous la première, entre chaque, au-dessus de la dernière, puis « je ne sais pas »", () => {
    expect(tranchesBudget().map((t) => t.id)).toEqual([
      `moins-${A}`,
      `${A}-${B}`,
      `${B}-${C}`,
      `plus-${C}`,
      BUDGET_INCONNU,
    ]);
  });

  it("écrit les libellés avec les montants formatés", () => {
    const { budget } = rendezVousContent.questionnaire;
    expect(tranchesBudget().map((t) => t.libelle)).toEqual([
      budget.moinsDe(euros(A)),
      budget.entre(euros(A), euros(B)),
      budget.entre(euros(B), euros(C)),
      budget.plusDe(euros(C)),
      budget.inconnu,
    ]);
  });

  it("donne des identifiants uniques", () => {
    const ids = tranchesBudget().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("rattacherTranche : les tranches retirées", () => {
  it("ramène chaque ancienne tranche à la tranche actuelle qui contient sa borne basse", () => {
    expect(rattacherTranche("moins-6000")).toBe(`moins-${A}`);
    expect(rattacherTranche("moins-3000")).toBe(`moins-${A}`);
    expect(rattacherTranche("moins-3500")).toBe(`moins-${A}`);
    expect(rattacherTranche("3000-6000")).toBe(`moins-${A}`);
    expect(rattacherTranche("6000-12000")).toBe(`${A}-${B}`);
    expect(rattacherTranche("7000-14000")).toBe(`${A}-${B}`);
    expect(rattacherTranche("12000-24000")).toBe(`${B}-${C}`);
    expect(rattacherTranche("plus-14000")).toBe(`${B}-${C}`);
    expect(rattacherTranche("plus-24000")).toBe(`${B}-${C}`);
    expect(rattacherTranche("plus-36000")).toBe(`plus-${C}`);
  });

  it("rend telle quelle une valeur qui n'est pas une ancienne tranche", () => {
    expect(rattacherTranche(BUDGET_INCONNU)).toBe(BUDGET_INCONNU);
    expect(rattacherTranche("toString")).toBe("toString");
  });
});

describe("objectifs et échéances du formulaire de contact", () => {
  it("rattacherObjectif range un objectif retiré sous « autre » et laisse les autres intacts", () => {
    expect(rattacherObjectif("google")).toBe("autre");
    expect(rattacherObjectif("equipe")).toBe("autre");
    expect(rattacherObjectif("tache")).toBe("tache");
  });

  it("propose au moins deux objectifs par sujet, aux identifiants uniques", () => {
    expect(LEGENDE_OBJECTIF).toBe(rendezVousContent.questionnaire.objectif.legende);
    for (const id of ["logiciel", "decouverte"]) {
      const ids = optionsObjectif(id).map((o) => o.id);
      expect(ids.length, id).toBeGreaterThan(2);
      expect(new Set(ids).size, id).toBe(ids.length);
    }
  });

  it("libelleOption rend le libellé d'une réponse, ou undefined hors liste", () => {
    expect(libelleOption(optionsObjectif("logiciel"), "tableur")).toBe("Sortir du tableur partagé");
    expect(libelleOption(OPTIONS_ECHEANCE, "trimestre")).toBe("Dans les trois mois");
    expect(libelleOption(OPTIONS_ECHEANCE, "demain")).toBeUndefined();
  });

  it("fixe la longueur maximale de la ligne libre", () => {
    expect(LONGUEUR_LIGNE_MAX).toBe(1_500);
  });
});

describe("rendezVousDuTypeProjet", () => {
  it("relie chaque type du formulaire de contact à un rendez-vous", () => {
    const options = siteConfig.footerForm.selectOptions;
    expect(options.map(rendezVousDuTypeProjet)).toEqual(
      options.map((o) => (o === "Un logiciel métier" ? "logiciel" : "decouverte")),
    );
    expect(rendezVousDuTypeProjet("Un logiciel métier")).toBe("logiciel");
    // Un onglet ouvert avant le 2026-10-31 envoie encore l'ancien libellé.
    expect(rendezVousDuTypeProjet("Une solution métier")).toBe("logiciel");
    expect(rendezVousDuTypeProjet("Je ne sais pas encore")).toBe("decouverte");
    expect(rendezVousDuTypeProjet("Un site internet")).toBe("decouverte");
    expect(rendezVousDuTypeProjet("toString")).toBe("decouverte");
  });
});

describe("composerNotes : ce qu'Eliott lit dans son agenda", () => {
  it("met le téléphone seul sur une ligne quand il n'y a rien d'autre", () => {
    expect(composerNotes({ type: "logiciel", telephone: TELEPHONE })).toBe(
      `${LIBELLE_NOTE_TELEPHONE} : ${TELEPHONE}`,
    );
    expect(LIBELLE_NOTE_TELEPHONE).toBe("Téléphone");
  });

  it("pose le message après une ligne vide, sans changer son contenu", () => {
    const texte = composerNotes({
      type: "site",
      telephone: TELEPHONE,
      message: "Refaire notre site vitrine.",
    });
    expect(texte.split("\n")).toEqual([
      `Téléphone : ${TELEPHONE}`,
      "",
      "Refaire notre site vitrine.",
    ]);
  });

  it("un client sans téléphone : seulement son mot, ou rien", () => {
    expect(composerNotes({ type: "proposition", message: "Relire le devis." })).toBe("Relire le devis.");
    expect(composerNotes({ type: "proposition" })).toBe("");
  });

  it("n'écrit aucune ligne de budget, d'objectif, d'échéance ni de cadrage", () => {
    const texte = composerNotes({
      type: "logiciel",
      telephone: TELEPHONE,
      message: "x",
      // Un ancien appelant peut encore passer ces clés : elles ne sortent plus.
      budget: "5000-10000",
      objectif: "tableur",
      echeance: "vite",
      entreprise: "Transports Martin",
    });
    expect(texte).not.toMatch(/budget|objectif|échéance|entreprise|forfait/iu);
    expect(texte.split("\n")).toHaveLength(3);
  });

  it("ne laisse aucune espace insécable dans le texte brut", () => {
    const texte = composerNotes({ type: "decouverte", telephone: "+33 6 12 34 56 78", message: "Bonjour : merci" });
    expect(texte).not.toMatch(/[  ]/u);
  });
});

describe("reponsesLisibles : ce que le cockpit reprend dans le mail", () => {
  it("rend un objet vide quand il n'y a ni projet ni message", () => {
    expect(reponsesLisibles({ type: "logiciel", telephone: TELEPHONE })).toEqual({});
  });

  it("range la ligne libre sous `coince`, ramenée sur une ligne", () => {
    expect(
      reponsesLisibles({
        type: "ia",
        telephone: TELEPHONE,
        message: "On ressaisit tout,\n\npuis   on corrige.",
      }),
    ).toEqual({ coince: "On ressaisit tout, puis on corrige." });
  });

  it("ne renvoie jamais le téléphone ni une réponse d'ancien questionnaire", () => {
    const lisibles = reponsesLisibles({
      type: "logiciel",
      telephone: TELEPHONE,
      message: "Un mot.",
      budget: "5000-10000",
      objectif: "tableur",
      entreprise: "Transports Martin",
    });
    expect(Object.keys(lisibles)).toEqual(["coince"]);
  });
});
