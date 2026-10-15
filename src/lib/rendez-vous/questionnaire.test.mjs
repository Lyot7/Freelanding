import { describe, expect, it } from "bun:test";
import { aPartirDe, euros, prestation } from "../../content/offre.ts";
import { rendezVousContent } from "../../content/rendez-vous.ts";
import {
  BUDGET_INCONNU,
  bornesBudget,
  composerNotes,
  optionsObjectif,
  prestationsDuRendezVous,
  retourBudget,
  tranchesBudget,
} from "./questionnaire.ts";

/**
 * LES TRANCHES SUIVENT LES PLANCHERS, elles ne les recopient pas. Ces tests
 * lisent les planchers dans `offre.ts` plutôt que de les écrire : un plancher
 * qui bouge doit déplacer les tranches, pas casser ce fichier. Ce qu'ils
 * figent, c'est la RÈGLE (quelle prestation est à portée de quelle tranche, ce
 * qui s'affiche au-delà), et l'absence de tout nom de forfait.
 */

const vitrine = prestation("vitrine");
const logiciel = prestation("logiciel");
const bornes = (p) => [1, 2, 4].map((m) => p.plancher * m);
const sansInsecable = (texte) => texte.replace(/[\u00a0\u202f]/gu, " ");

describe("prestationsDuRendezVous", () => {
  it("relie chaque sujet à sa prestation, et « decouverte » à toutes", () => {
    expect(prestationsDuRendezVous("site").map((p) => p.id)).toEqual(["vitrine"]);
    expect(prestationsDuRendezVous("logiciel").map((p) => p.id)).toEqual(["logiciel"]);
    expect(prestationsDuRendezVous("decouverte").map((p) => p.id)).toEqual([
      "vitrine",
      "logiciel",
    ]);
  });
});

describe("bornesBudget et tranchesBudget", () => {
  it("pose le plancher puis ses multiples pour un sujet à une seule prestation", () => {
    expect(bornesBudget("site")).toEqual(bornes(vitrine));
    expect(bornesBudget("logiciel")).toEqual(bornes(logiciel));
  });

  it("couvre les deux prestations pour « decouverte » sans multiplier les tranches", () => {
    // Plancher de chaque prestation, puis les multiples de la plus chère.
    expect(bornesBudget("decouverte")).toEqual([vitrine.plancher, ...bornes(logiciel)]);
  });

  it("encadre les planchers : sous le premier, entre chaque, au-dessus du dernier, puis « je ne sais pas »", () => {
    const [a, b, c] = bornes(vitrine);
    expect(tranchesBudget("site").map((t) => t.id)).toEqual([
      `moins-${a}`,
      `${a}-${b}`,
      `${b}-${c}`,
      `plus-${c}`,
      BUDGET_INCONNU,
    ]);
    expect(tranchesBudget("decouverte")).toHaveLength(bornesBudget("decouverte").length + 2);
  });

  it("écrit les libellés avec les montants formatés de l’offre", () => {
    const [a, b] = bornes(vitrine);
    const tranche = tranchesBudget("site")[1];
    expect(tranche.libelle).toBe(rendezVousContent.questionnaire.budget.entre(euros(a), euros(b)));
    expect(tranchesBudget("site").at(-1).libelle).toBe(
      rendezVousContent.questionnaire.budget.inconnu,
    );
  });

  it("donne des identifiants uniques à chaque sujet", () => {
    for (const id of ["site", "logiciel", "decouverte"]) {
      const ids = tranchesBudget(id).map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      const objectifs = optionsObjectif(id).map((o) => o.id);
      expect(new Set(objectifs).size).toBe(objectifs.length);
    }
  });
});

describe("retourBudget — ce que vous pouvez espérer", () => {
  const { retour: R } = rendezVousContent;

  it("dit franchement que rien ne tient sous le plancher", () => {
    const retour = retourBudget("site", tranchesBudget("site")[0].id);
    expect(retour.type).toBe("aucun");
    expect(retour.texte).toBe(R.aucun(euros(vitrine.plancher)));
  });

  it("au-dessus du plancher, donne la prestation, son prix de départ et la suite au devis", () => {
    const retour = retourBudget("site", tranchesBudget("site")[2].id);
    expect(retour.type).toBe("aPortee");
    expect(retour.lignes).toEqual([
      {
        prestation: vitrine.nom,
        prix: R.prixPlancher(euros(vitrine.plancher)),
        texte: R.aPortee,
      },
    ]);
  });

  it("sur la tranche ouverte vers le haut, dit que le budget laisse de la place", () => {
    const retour = retourBudget("logiciel", tranchesBudget("logiciel")[3].id);
    expect(retour.lignes[0].texte).toBe(R.large);
    expect(retour.lignes[0].prix).toBe(R.prixPlancher(euros(logiciel.plancher)));
  });

  it("sur « decouverte », donne une ligne par prestation à portée, nommée", () => {
    const tranche = `${logiciel.plancher}-${logiciel.plancher * 2}`;
    const retour = retourBudget("decouverte", tranche);
    expect(retour.lignes.map((l) => l.prestation)).toEqual([vitrine.nom, logiciel.nom]);
  });

  it("sur « decouverte », écarte la prestation hors de portée", () => {
    const tranche = `${vitrine.plancher}-${logiciel.plancher}`;
    const retour = retourBudget("decouverte", tranche);
    expect(retour.lignes.map((l) => l.prestation)).toEqual([vitrine.nom]);
  });

  it("« je ne sais pas » renvoie à l’appel, avec le prix de départ de chaque prestation", () => {
    const site = retourBudget("site", BUDGET_INCONNU);
    expect(site.type).toBe("inconnu");
    expect(site.reperes).toEqual([R.repere(vitrine.nom, aPartirDe(vitrine, " HT"))]);
    expect(retourBudget("decouverte", BUDGET_INCONNU).reperes).toHaveLength(2);
  });

  it("ne calcule rien pour une tranche qui n’appartient pas au sujet", () => {
    expect(retourBudget("site", `${logiciel.plancher * 2}-${logiciel.plancher * 4}`)).toBe(undefined);
  });

  it("aucun texte du retour ne nomme un forfait ni un palier", () => {
    const textes = [R.titre, R.aucun("X"), R.inconnu, R.repere("X", "Y"), R.prixPlancher("X"), R.aPortee, R.large];
    for (const texte of textes) {
      expect(/forfait|palier|prix ferme/iu.test(texte), texte).toBe(false);
    }
  });
});

describe("composerNotes — ce qu'Eliott lit dans son agenda", () => {
  const { notes } = rendezVousContent;

  it("pose une réponse par ligne, ce qui est à portée, puis le message", () => {
    const [a, b] = bornes(vitrine);
    const texte = composerNotes({
      type: "site",
      budget: `${a}-${b}`,
      objectif: "google",
      echeance: "trimestre",
      message: "Refonte du site.",
    });
    const lignes = texte.split("\n");
    expect(lignes).toEqual([
      sansInsecable(`${notes.budget} : ${tranchesBudget("site")[1].libelle}`),
      sansInsecable(`${notes.forfait} : ${vitrine.nom}`),
      sansInsecable(`${notes.objectif} : ${optionsObjectif("site")[0].libelle}`),
      sansInsecable(`${notes.echeance} : ${rendezVousContent.questionnaire.echeance.options[1].libelle}`),
      "",
      "Refonte du site.",
    ]);
  });

  it("n’écrit ni échéance ni ligne vide quand elles manquent", () => {
    const texte = composerNotes({ type: "logiciel", budget: BUDGET_INCONNU, objectif: "tableur" });
    expect(texte.split("\n")).toHaveLength(3);
    expect(texte).toContain(sansInsecable(`${notes.forfait} : ${notes.aCaler}`));
  });

  it("dit que rien ne tient sous le plancher", () => {
    const texte = composerNotes({
      type: "site",
      budget: tranchesBudget("site")[0].id,
      objectif: "autre",
    });
    expect(texte).toContain(sansInsecable(`${notes.forfait} : ${notes.aucunForfait}`));
  });

  it("ne laisse aucune espace insécable dans le texte brut", () => {
    const texte = composerNotes({
      type: "decouverte",
      budget: `plus-${logiciel.plancher * 4}`,
      objectif: "relier",
    });
    expect(texte).not.toMatch(/[\u00a0\u202f]/u);
  });
});
