import { describe, expect, it } from "bun:test";
import { euros, prestation } from "../../content/offre.ts";
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
 * LES TRANCHES SUIVENT LA GRILLE, elles ne la recopient pas. Ces tests lisent
 * les prix dans `offre.ts` plutôt que de les écrire : une grille qui bouge doit
 * déplacer les tranches, pas casser ce fichier. Ce qu'ils figent, c'est la
 * RÈGLE (quel forfait à quelle tranche, ce qui s'affiche au-delà).
 */

const vitrine = prestation("vitrine");
const logiciel = prestation("logiciel");
const prix = (p) => p.packs.map((pack) => pack.prix);
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
  it("pose une borne par forfait pour un sujet à une seule prestation", () => {
    expect(bornesBudget("site")).toEqual(prix(vitrine));
    expect(bornesBudget("logiciel")).toEqual(prix(logiciel));
  });

  it("couvre les deux prestations pour « decouverte » sans multiplier les tranches", () => {
    // Entrée de chaque prestation, puis les paliers de la plus chère.
    expect(bornesBudget("decouverte")).toEqual([vitrine.packs[0].prix, ...prix(logiciel)]);
  });

  it("encadre la grille : sous le premier, entre chaque, au-dessus du dernier, puis « je ne sais pas »", () => {
    const [a, b, c] = prix(vitrine);
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
    const [a, b] = prix(vitrine);
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

describe("retourBudget — ce que tu peux espérer", () => {
  it("dit franchement qu’aucun forfait ne tient sous le premier", () => {
    const retour = retourBudget("site", tranchesBudget("site")[0].id);
    expect(retour.type).toBe("aucun");
    expect(retour.texte).toBe(rendezVousContent.retour.aucun(euros(vitrine.packs[0].prix)));
  });

  it("donne le forfait qui ouvre la tranche, avec son prix et sa promesse", () => {
    const retour = retourBudget("site", tranchesBudget("site")[2].id);
    expect(retour.type).toBe("forfaits");
    expect(retour.lignes).toEqual([
      {
        forfait: vitrine.packs[1].nom,
        prix: rendezVousContent.retour.prixFerme(euros(vitrine.packs[1].prix)),
        promesse: vitrine.packs[1].promesse,
      },
    ]);
  });

  it("au-dessus du dernier forfait du site, renvoie au sur mesure", () => {
    const retour = retourBudget("site", tranchesBudget("site")[3].id);
    expect(retour.lignes[0].forfait).toBe(vitrine.packs[2].nom);
    expect(retour.lignes[0].complement).toBe(rendezVousContent.retour.horsForfait);
  });

  it("au-dessus du dernier forfait ferme du logiciel, annonce le palier sur mesure", () => {
    const retour = retourBudget("logiciel", tranchesBudget("logiciel")[2].id);
    expect(retour.lignes[0].forfait).toBe(logiciel.packs[1].nom);
    expect(retour.lignes[0].complement).toBe(
      rendezVousContent.retour.surMesureSuivant(
        logiciel.packs[2].nom,
        euros(logiciel.packs[2].prix),
      ),
    );
  });

  it("sur la tranche haute du logiciel, présente le sur mesure comme un plancher", () => {
    const retour = retourBudget("logiciel", tranchesBudget("logiciel")[3].id);
    const [ligne] = retour.lignes;
    expect(ligne.forfait).toBe(logiciel.packs[2].nom);
    expect(ligne.prix).toBe(rendezVousContent.retour.prixPlancher(euros(logiciel.packs[2].prix)));
    expect(ligne.complement).toBe(rendezVousContent.retour.surMesure);
  });

  it("n’ajoute rien sous un forfait qui n’est pas le haut de la grille ferme", () => {
    const retour = retourBudget("logiciel", tranchesBudget("logiciel")[1].id);
    expect(retour.lignes[0].forfait).toBe(logiciel.packs[0].nom);
    expect(retour.lignes[0].complement).toBeUndefined();
  });

  it("sur « decouverte », donne une ligne par prestation à portée, nommée", () => {
    const tranche = `${logiciel.packs[0].prix}-${logiciel.packs[1].prix}`;
    const retour = retourBudget("decouverte", tranche);
    expect(retour.lignes.map((l) => [l.prestation, l.forfait])).toEqual([
      [vitrine.nom, vitrine.packs[2].nom],
      [logiciel.nom, logiciel.packs[0].nom],
    ]);
    // Pas d'« au-delà » par ligne : le forfait à portée est l'essentiel.
    expect(retour.lignes.every((l) => l.complement === undefined)).toBe(true);
  });

  it("sur « decouverte », écarte la prestation hors de portée", () => {
    const tranche = `${vitrine.packs[0].prix}-${logiciel.packs[0].prix}`;
    const retour = retourBudget("decouverte", tranche);
    expect(retour.lignes.map((l) => l.prestation)).toEqual([vitrine.nom]);
  });

  it("« je ne sais pas » renvoie à l’appel, avec la fourchette de chaque prestation", () => {
    const site = retourBudget("site", BUDGET_INCONNU);
    expect(site.type).toBe("inconnu");
    expect(site.reperes).toHaveLength(1);
    expect(retourBudget("decouverte", BUDGET_INCONNU).reperes).toHaveLength(2);
  });

  it("ne calcule rien pour une tranche qui n’appartient pas au sujet", () => {
    expect(retourBudget("site", `${logiciel.packs[0].prix}-${logiciel.packs[1].prix}`)).toBe(
      undefined,
    );
  });
});

describe("composerNotes — ce qu'Eliott lit dans son agenda", () => {
  const { notes } = rendezVousContent;

  it("pose une réponse par ligne, le forfait déjà calculé, puis le message", () => {
    const [a, b] = [vitrine.packs[1].prix, vitrine.packs[2].prix];
    const texte = composerNotes({
      type: "site",
      budget: `${a}-${b}`,
      objectif: "google",
      echeance: "trimestre",
      message: "Refonte du site.",
    });
    const lignes = texte.split("\n");
    expect(lignes).toEqual([
      sansInsecable(`${notes.budget} : ${tranchesBudget("site")[2].libelle}`),
      sansInsecable(`${notes.forfait} : ${vitrine.packs[1].nom}, ${euros(a)} HT`),
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

  it("dit qu’aucun forfait ne tient sous le premier", () => {
    const texte = composerNotes({
      type: "site",
      budget: tranchesBudget("site")[0].id,
      objectif: "autre",
    });
    expect(texte).toContain(sansInsecable(`${notes.forfait} : ${notes.aucunForfait}`));
  });

  it("ne laisse aucune espace insécable dans le texte brut", () => {
    const texte = composerNotes({ type: "decouverte", budget: `plus-${logiciel.packs[2].prix}`, objectif: "relier" });
    expect(texte).not.toMatch(/[\u00a0\u202f]/u);
  });
});
