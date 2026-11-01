import { describe, expect, it } from "bun:test";
import { euros, prestation } from "../../content/offre.ts";
import { IDS_RENDEZ_VOUS, rendezVousContent } from "../../content/rendez-vous.ts";
import { siteConfig } from "../../content/site.ts";
import {
  rattacherObjectif,
  BORNES_BUDGET,
  BUDGET_INCONNU,
  composerNotes,
  LEGENDE_OBJECTIF,
  offresDuRendezVous,
  optionsObjectif,
  rattacherTranche,
  rendezVousDuTypeProjet,
  retourBudget,
  tranchesBudget,
} from "./questionnaire.ts";

/**
 * LES TRANCHES NE CITENT AUCUN PRIX D'ELIOTT, décision du 2026-11-01. Ces tests
 * figent la RÈGLE (quelle tranche donne quel retour, ce qui part dans les notes),
 * et l'absence de tout montant et de tout nom de forfait dans les textes.
 */

const logiciel = prestation("logiciel");
const [A, B, C] = BORNES_BUDGET;
const tranche = (rang) => tranchesBudget()[rang].id;
const sansInsecable = (texte) => texte.replace(/[\u00a0\u202f]/gu, " ");

describe("rattacherObjectif", () => {
  it("range un objectif retiré sous « autre » et laisse les autres intacts", () => {
    expect(rattacherObjectif("google")).toBe("autre");
    expect(rattacherObjectif("equipe")).toBe("autre");
    expect(rattacherObjectif("tache")).toBe("tache");
  });
});

describe("offresDuRendezVous", () => {
  it("relie « logiciel » à son offre, et « decouverte » à toutes les prestations", () => {
    expect(offresDuRendezVous("logiciel")).toEqual([logiciel]);
    expect(offresDuRendezVous("decouverte")).toEqual([logiciel]);
  });
});

describe("le questionnaire est le même pour chaque sujet", () => {
  it("pose toujours le budget, sans question d'outil ni légende propre à un sujet", () => {
    // Depuis le 2026-10-31, plus de sujet sans budget (le CTO) ni de question
    // « outil » (l'intégration IA) : ces deux offres n'existent plus.
    const { objectif } = rendezVousContent.questionnaire;
    expect(objectif).not.toHaveProperty("legendeParType");
    expect(LEGENDE_OBJECTIF).toBe(objectif.legende);
    expect(tranchesBudget().length).toBeGreaterThan(2);
    for (const id of IDS_RENDEZ_VOUS) {
      expect(optionsObjectif(id).length, id).toBeGreaterThan(2);
    }
  });
});

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

  it("donne des identifiants uniques à chaque sujet", () => {
    const ids = tranchesBudget().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of IDS_RENDEZ_VOUS) {
      const objectifs = optionsObjectif(id).map((o) => o.id);
      expect(new Set(objectifs).size).toBe(objectifs.length);
    }
  });
});

describe("retourBudget — ce que vous pouvez espérer", () => {
  const { retour: R } = rendezVousContent;

  it("sous le seuil interne, propose de cadrer ensemble, sans jamais nommer le seuil", () => {
    expect(retourBudget(tranche(0))).toEqual({ type: "serre", texte: R.serre });
  });

  it("au-dessus du seuil, renvoie à l’appel et au devis", () => {
    expect(retourBudget(tranche(1))).toEqual({ type: "aPortee", texte: R.aPortee });
    expect(retourBudget(tranche(2))).toEqual({ type: "aPortee", texte: R.aPortee });
  });

  it("sur la tranche ouverte vers le haut, dit que le budget laisse de la place", () => {
    expect(retourBudget(tranche(3))).toEqual({ type: "large", texte: R.large });
  });

  it("« je ne sais pas » renvoie à l’appel", () => {
    expect(retourBudget(BUDGET_INCONNU)).toEqual({ type: "inconnu", texte: R.inconnu });
  });

  it("ne calcule rien pour une tranche inconnue", () => {
    // Une tranche de l'ancien site vitrine, retirée le 2026-10-31.
    expect(retourBudget("moins-3000")).toBe(undefined);
    expect(retourBudget("3000-6000")).toBe(undefined);
  });

  it("aucun texte du retour ne porte un montant, un forfait ni un palier", () => {
    for (const texte of [R.titre, R.serre, R.inconnu, R.aPortee, R.large]) {
      expect(/forfait|palier|prix ferme|prix de départ|\d/iu.test(texte), texte).toBe(false);
    }
  });
});

describe("composerNotes — ce qu'Eliott lit dans son agenda", () => {
  const { notes } = rendezVousContent;

  it("pose une réponse par ligne, ce qui est à portée, puis le message", () => {
    const texte = composerNotes({
      type: "logiciel",
      budget: `${A}-${B}`,
      objectif: "tableur",
      echeance: "trimestre",
      message: "Sortir du tableur partagé.",
    });
    const lignes = texte.split("\n");
    expect(lignes).toEqual([
      sansInsecable(`${notes.budget} : ${tranchesBudget()[1].libelle}`),
      sansInsecable(`${notes.forfait} : ${logiciel.nom}`),
      sansInsecable(`${notes.objectif} : ${optionsObjectif("logiciel").find((o) => o.id === "tableur").libelle}`),
      sansInsecable(`${notes.echeance} : ${rendezVousContent.questionnaire.echeance.options[1].libelle}`),
      "",
      "Sortir du tableur partagé.",
    ]);
  });

  it("n’écrit ni échéance ni ligne vide quand elles manquent", () => {
    const texte = composerNotes({ type: "logiciel", budget: BUDGET_INCONNU, objectif: "tableur" });
    expect(texte.split("\n")).toHaveLength(3);
    expect(texte).toContain(sansInsecable(`${notes.forfait} : ${notes.aCaler}`));
  });

  it("signale à Eliott un budget sous le seuil interne", () => {
    const texte = composerNotes({
      type: "logiciel",
      budget: tranche(0),
      objectif: "autre",
    });
    expect(texte).toContain(sansInsecable(`${notes.forfait} : ${notes.aucunForfait}`));
  });

  it("propose d'installer l'IA, sans la ranger sous « Autre chose »", () => {
    for (const type of ["logiciel", "decouverte"]) {
      expect(optionsObjectif(type).map((o) => o.id)).toContain("ia");
    }
    expect(rattacherObjectif("ia")).toBe("ia");
    expect(composerNotes({ type: "logiciel", budget: BUDGET_INCONNU, objectif: "ia" })).toContain(
      "Installer l’IA dans nos outils",
    );
    expect(rendezVousContent.types.find((t) => t.id === "logiciel").description).toContain(
      "l’IA à installer dans vos outils",
    );
  });

  it("n'écrit plus de ligne d'outil, même pour une ancienne réponse", () => {
    const texte = composerNotes({
      type: "decouverte",
      budget: BUDGET_INCONNU,
      objectif: "relier",
      outil: "messagerie",
    });
    expect(texte.split("\n")).toEqual([
      sansInsecable(`${notes.budget} : ${rendezVousContent.questionnaire.budget.inconnu}`),
      sansInsecable(`${notes.forfait} : ${notes.aCaler}`),
      sansInsecable(`${notes.objectif} : ${optionsObjectif("decouverte").find((o) => o.id === "relier").libelle}`),
    ]);
    expect(notes).not.toHaveProperty("outil");
  });

  it("ne laisse aucune espace insécable dans le texte brut", () => {
    const texte = composerNotes({
      type: "decouverte",
      budget: `plus-${C}`,
      objectif: "relier",
    });
    expect(texte).not.toMatch(/[\u00a0\u202f]/u);
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
    // Les types retirés (site, intégration IA, CTO) retombent sur la découverte.
    expect(rendezVousDuTypeProjet("Un site internet")).toBe("decouverte");
    expect(rendezVousDuTypeProjet("toString")).toBe("decouverte");
  });
});

describe("rattacherTranche — les tranches retirées", () => {
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
