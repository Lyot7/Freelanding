import { describe, expect, it } from "bun:test";
import { aPartirDe, euros, prestation } from "../../content/offre.ts";
import { IDS_RENDEZ_VOUS, rendezVousContent } from "../../content/rendez-vous.ts";
import { siteConfig } from "../../content/site.ts";
import {
  rattacherObjectif,
  BUDGET_INCONNU,
  bornesBudget,
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
 * LES TRANCHES SUIVENT LES PLANCHERS, elles ne les recopient pas. Ces tests
 * lisent les planchers dans `offre.ts` plutôt que de les écrire : un plancher
 * qui bouge doit déplacer les tranches, pas casser ce fichier. Ce qu'ils
 * figent, c'est la RÈGLE (quelle prestation est à portée de quelle tranche, ce
 * qui s'affiche au-delà), et l'absence de tout nom de forfait.
 */

const logiciel = prestation("logiciel");
const bornes = (p) => [1, 2, 4].map((m) => p.plancher * m);
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
    for (const id of IDS_RENDEZ_VOUS) {
      expect(tranchesBudget(id).length, id).toBeGreaterThan(2);
      expect(optionsObjectif(id).length, id).toBeGreaterThan(2);
    }
  });
});

describe("bornesBudget et tranchesBudget", () => {
  it("pose le plancher puis ses multiples, pour chaque sujet", () => {
    for (const id of IDS_RENDEZ_VOUS) {
      expect(bornesBudget(id), id).toEqual(bornes(logiciel));
    }
    expect(bornesBudget("logiciel")).toEqual([6000, 12000, 24000]);
  });

  it("ne pose jamais deux bornes voisines à moins de moitié d’écart", () => {
    for (const id of IDS_RENDEZ_VOUS) {
      const b = bornesBudget(id);
      for (let i = 0; i < b.length - 1; i += 1) {
        expect(b[i + 1] / b[i]).toBeGreaterThanOrEqual(1.5);
      }
    }
  });

  it("encadre le plancher : sous le premier, entre chaque, au-dessus du dernier, puis « je ne sais pas »", () => {
    const [a, b, c] = bornes(logiciel);
    for (const id of IDS_RENDEZ_VOUS) {
      expect(tranchesBudget(id).map((t) => t.id)).toEqual([
        `moins-${a}`,
        `${a}-${b}`,
        `${b}-${c}`,
        `plus-${c}`,
        BUDGET_INCONNU,
      ]);
    }
  });

  it("écrit les libellés avec les montants formatés de l’offre", () => {
    const { budget } = rendezVousContent.questionnaire;
    const [a, b, c] = bornes(logiciel);
    expect(tranchesBudget("decouverte").map((t) => t.libelle)).toEqual([
      budget.moinsDe(euros(a)),
      budget.entre(euros(a), euros(b)),
      budget.entre(euros(b), euros(c)),
      budget.plusDe(euros(c)),
      budget.inconnu,
    ]);
  });

  it("donne des identifiants uniques à chaque sujet", () => {
    for (const id of IDS_RENDEZ_VOUS) {
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
    for (const id of IDS_RENDEZ_VOUS) {
      const retour = retourBudget(id, tranchesBudget(id)[0].id);
      expect(retour.type).toBe("aucun");
      expect(retour.texte).toBe(R.aucun(euros(logiciel.plancher)));
    }
  });

  it("au-dessus du plancher, donne la prestation, son prix de départ et la suite au devis", () => {
    const retour = retourBudget("logiciel", tranchesBudget("logiciel")[2].id);
    expect(retour.type).toBe("aPortee");
    expect(retour.lignes).toEqual([
      {
        prestation: logiciel.nom,
        prix: R.prixPlancher(euros(logiciel.plancher)),
        texte: R.aPortee,
      },
    ]);
  });

  it("sur la tranche ouverte vers le haut, dit que le budget laisse de la place", () => {
    const retour = retourBudget("logiciel", tranchesBudget("logiciel")[3].id);
    expect(retour.lignes[0].texte).toBe(R.large);
    expect(retour.lignes[0].prix).toBe(R.prixPlancher(euros(logiciel.plancher)));
  });

  it("sur « decouverte », donne la même ligne que sur « logiciel »", () => {
    const tranche = `${logiciel.plancher}-${logiciel.plancher * 2}`;
    const retour = retourBudget("decouverte", tranche);
    expect(retour.lignes.map((l) => l.prestation)).toEqual([logiciel.nom]);
    expect(retour).toEqual(retourBudget("logiciel", tranche));
  });

  it("« je ne sais pas » renvoie à l’appel, avec le prix de départ du logiciel", () => {
    for (const id of IDS_RENDEZ_VOUS) {
      const inconnu = retourBudget(id, BUDGET_INCONNU);
      expect(inconnu.type).toBe("inconnu");
      expect(inconnu.reperes).toEqual([R.repere(logiciel.nom, aPartirDe(logiciel, " HT"))]);
    }
  });

  it("ne calcule rien pour une tranche qui n’appartient pas au sujet", () => {
    // Une tranche de l'ancien site vitrine, retirée le 2026-10-31.
    expect(retourBudget("logiciel", "moins-3000")).toBe(undefined);
    expect(retourBudget("decouverte", "3000-6000")).toBe(undefined);
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
    const [a, b] = bornes(logiciel);
    const texte = composerNotes({
      type: "logiciel",
      budget: `${a}-${b}`,
      objectif: "tableur",
      echeance: "trimestre",
      message: "Sortir du tableur partagé.",
    });
    const lignes = texte.split("\n");
    expect(lignes).toEqual([
      sansInsecable(`${notes.budget} : ${tranchesBudget("logiciel")[1].libelle}`),
      sansInsecable(`${notes.forfait} : ${logiciel.nom}`),
      sansInsecable(`${notes.objectif} : ${optionsObjectif("logiciel")[1].libelle}`),
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

  it("dit que rien ne tient sous le plancher", () => {
    const texte = composerNotes({
      type: "logiciel",
      budget: tranchesBudget("logiciel")[0].id,
      objectif: "autre",
    });
    expect(texte).toContain(sansInsecable(`${notes.forfait} : ${notes.aucunForfait}`));
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
      sansInsecable(`${notes.objectif} : ${optionsObjectif("decouverte")[1].libelle}`),
    ]);
    expect(notes).not.toHaveProperty("outil");
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

describe("rattacherTranche — tranches du logiciel à 6 000 €", () => {
  it("ramène chaque ancienne tranche à la tranche actuelle qui contient sa borne basse", () => {
    const [a, b, c] = bornes(logiciel);
    for (const id of IDS_RENDEZ_VOUS) {
      expect(rattacherTranche(id, "moins-6000")).toBe(`moins-${a}`);
      expect(rattacherTranche(id, "moins-3000")).toBe(`moins-${a}`);
      expect(rattacherTranche(id, "moins-3500")).toBe(`moins-${a}`);
      expect(rattacherTranche(id, "3000-6000")).toBe(`moins-${a}`);
      expect(rattacherTranche(id, "6000-12000")).toBe(`${a}-${b}`);
      expect(rattacherTranche(id, "7000-14000")).toBe(`${a}-${b}`);
      expect(rattacherTranche(id, "12000-24000")).toBe(`${b}-${c}`);
      expect(rattacherTranche(id, "plus-14000")).toBe(`${b}-${c}`);
      expect(rattacherTranche(id, "plus-24000")).toBe(`plus-${c}`);
    }
  });

  it("rend telle quelle une valeur qui n'est pas une ancienne tranche", () => {
    expect(rattacherTranche("logiciel", BUDGET_INCONNU)).toBe(BUDGET_INCONNU);
    expect(rattacherTranche("logiciel", "toString")).toBe("toString");
  });
});
