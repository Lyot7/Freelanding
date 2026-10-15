import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  aPartirDe,
  euros,
  integrationIA,
  prestation,
  prestations,
  prixPlancher,
  plancherSuivi,
  repereAgenceSite,
  suiviMensuel,
  tauxSuivi,
} from "./offre.ts";
import { services } from "./services.ts";
import { lienDevis, methodeLabels } from "./tarifs.ts";
import { contentRoutes as routesTarifs } from "./routes.ts";
import { faqItems } from "./faq.ts";
import { uiLabels } from "./ui.ts";
import { contentRoutes } from "./routes.ts";
import {
  IDS_RENDEZ_VOUS,
  PARAM_SUJET,
  RDV_PAR_PRESTATION,
  lienRendezVous,
} from "./rendez-vous.ts";

/**
 * L'OFFRE N'ANNONCE QU'UN PRIX PAR PRESTATION, SON PLANCHER, ET CE PRIX NE
 * S'ÉCRIT QU'À UN ENDROIT.
 *
 * CE QUI EST ARRIVÉ SANS CE TEST. L'accordéon des services annonçait « à partir
 * de 5 000 € » pour l'outil métier pendant que la grille comparative affichait
 * « 5 000 à 15 000 € » pour la même prestation, à deux écrans d'intervalle. Rien
 * ne le signalait : deux fichiers, deux chaînes de caractères, aucun lien.
 *
 * Depuis le 2026-10-05, décision d'Eliott : un plancher « à partir de » par
 * offre, tout le reste sur devis. Les paliers à prix ferme du 2026-09-23 sont
 * supprimés.
 */

/** Les noms des neuf paliers supprimés le 2026-10-05. */
const PALIERS_SUPPRIMES = [
  "La Landing",
  "Le Site Signature",
  "Site Signature",
  "L’Outil",
  "L'Outil",
  "Le Logiciel",
  "La Plateforme",
  "L’Assistant",
  "L’Intégration",
  "L’Automatisation",
];

describe("un plancher par offre, écrit une seule fois", () => {
  test("deux prestations à page dédiée, slugs uniques", () => {
    expect(prestations.map((p) => p.id)).toEqual(["vitrine", "logiciel"]);
    const slugs = prestations.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("les planchers arrêtés par Eliott le 2026-10-05", () => {
    // Montants de décision, pas de calcul : les figer ici fait échouer toute
    // modification involontaire, et oblige une modification voulue à passer
    // par ce test.
    expect(prestation("vitrine").plancher).toBe(3000);
    expect(prestation("logiciel").plancher).toBe(6000);
    expect(integrationIA.plancher).toBe(2500);
  });

  test("plus aucun palier : ni forfaits, ni prix ferme par forfait, ni délai", () => {
    for (const offre of [...prestations, integrationIA]) {
      expect(Number.isInteger(offre.plancher) && offre.plancher > 0).toBe(true);
      for (const champ of ["packs", "delai", "prix", "surMesure"]) {
        expect(champ in offre, `« ${offre.nom} » porte encore « ${champ} »`).toBe(false);
      }
    }
  });

  test("le prix affiché est le plancher, formaté, précédé de « à partir de »", () => {
    for (const offre of [...prestations, integrationIA]) {
      expect(prixPlancher(offre)).toBe(euros(offre.plancher));
      expect(aPartirDe(offre)).toBe(`à partir de ${euros(offre.plancher)}`);
    }
    // La taxe se place derrière le montant.
    expect(aPartirDe(prestation("logiciel"), " HT")).toMatch(/\u20AC HT$/u);
  });

  test("chaque offre dit ce qui est compris et ce qui fait monter le prix", () => {
    for (const offre of [...prestations, integrationIA]) {
      expect(offre.inclus.length, `« ${offre.nom} » ne dit rien de ce qui est compris`).toBeGreaterThan(2);
      expect(offre.faitMonter.length, `« ${offre.nom} » ne dit pas ce qui fait varier le prix`).toBeGreaterThan(2);
      expect(offre.horsOffre.length).toBeGreaterThan(20);
      // Une ligne ne peut pas être à la fois comprise et facteur de hausse.
      const lignes = [...offre.inclus, ...offre.faitMonter];
      expect(new Set(lignes).size, `ligne répétée dans « ${offre.nom} »`).toBe(lignes.length);
    }
  });

  test("les textes du site vitrine sont écrits par Eliott, et compris", () => {
    // Décision d'Eliott du 2026-10-05 : « je prépare des textes préfaits pour
    // qu'ils soient optimisés SEO […] Donc c'est dans mon prix. » Le site
    // disait « Tes textes mis en page » : le visiteur comprenait qu'il devait
    // les écrire.
    const vitrine = prestation("vitrine");
    expect(vitrine.inclus.some((l) => /textes écrits par moi/iu.test(l))).toBe(true);
    const tout = [vitrine.resume, vitrine.horsOffre, ...vitrine.inclus, ...vitrine.faitMonter];
    for (const texte of tout) {
      expect(/textes mis en page|textes que (?:tu fournis|vous fournissez)/iu.test(texte), texte).toBe(false);
    }
  });

  test("aucune durée n'est annoncée dans l'offre", () => {
    // La date vit au devis. Un délai chiffré à côté d'un prix redonnait le
    // taux journalier en une division, et il engageait sur une durée que
    // la complexité du projet décide.
    const textes = [...prestations, integrationIA].flatMap((p) => [
      p.resume ?? "",
      p.horsOffre,
      ...p.inclus,
      ...p.faitMonter,
    ]);
    for (const texte of textes) {
      expect(/\d\s*(?:jours?|semaines?|mois)\b|jours? ouvrés?/iu.test(texte), texte).toBe(false);
    }
  });
});

/**
 * LES PALIERS SUPPRIMÉS NE REVIENNENT PAS, ni dans le code, ni dans les textes.
 * Le test lit `src/` entier, commentaires retirés : un nom de palier resté dans
 * une chaîne (une FAQ, un article, un libellé) promettrait au visiteur un
 * forfait qui n'existe plus.
 */
/**
 * PLUS AUCUN TAUX JOURNALIER SUR LE SITE, même pour le critiquer (décision
 * d'Eliott du 2026-10-15). Le site parle de prix « à partir de » et de devis :
 * un TJM, même cité en repoussoir, ramène le lecteur à un prix au temps passé.
 * Le test lit les sources de `src/content`, commentaires retirés.
 */
describe("aucun taux journalier dans src/content", () => {
  const racine = fileURLToPath(new URL("./", import.meta.url));
  const fichiers = readdirSync(racine, { recursive: true })
    .map(String)
    .filter((f) => /\.(ts|tsx|mdx|md)$/u.test(f));

  test("les fichiers de contenu sont bien lus", () => {
    expect(fichiers.length).toBeGreaterThan(20);
  });

  test("ni « TJM », ni « taux journalier », ni « tarif journalier », hors commentaires", () => {
    const motif = /\bTJM\b|taux journaliers?|tarifs? journaliers?/iu;
    const fautifs = [];
    for (const f of fichiers) {
      const source = readFileSync(join(racine, f), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
      const trouve = source.match(motif);
      if (trouve) fautifs.push(`${f} : ${trouve[0]}`);
    }
    expect(fautifs).toEqual([]);
  });
});

/**
 * LE VISITEUR EST VOUVOYÉ (décision d'Eliott du 2026-10-15) dans l'offre et la
 * FAQ, qui se rendent sur toutes les pages de prestation.
 */
describe("l'offre et la FAQ vouvoient", () => {
  test("aucun tutoiement dans l'offre ni dans la FAQ", () => {
    const tutoiement = /(?<![\p{L}’'])(?:tu|toi|ton|ta|tes|te)(?!\p{L})|(?<!\p{L})t’/iu;
    const textes = [
      ...[...prestations, integrationIA].flatMap((p) => [
        p.resume ?? "",
        p.horsOffre,
        ...p.inclus,
        ...p.faitMonter,
      ]),
      ...faqItems.flatMap((f) => [f.question, f.answer]),
    ];
    for (const texte of textes) {
      expect(tutoiement.test(texte), `tutoiement : ${texte}`).toBe(false);
    }
  });

  test("la réponse prix de la FAQ cite le repère d'agence, sa source et sa date", () => {
    const reponse = faqItems.find((f) => /Combien coûte un projet/u.test(f.question))?.answer;
    expect(reponse).toContain(euros(repereAgenceSite.mediane));
    expect(reponse).toContain(repereAgenceSite.source.nom);
    expect(reponse).toContain(repereAgenceSite.source.releve);
    // « Deux fois moins » n'est écrit que parce que le rapport est exact.
    expect(reponse).toMatch(/deux fois moins/u);
    expect(repereAgenceSite.mediane / prestation("vitrine").plancher).toBeCloseTo(2, 1);
  });
});

describe("aucun nom de palier ne reste dans src/", () => {
  const racine = fileURLToPath(new URL("../", import.meta.url));
  const fichiers = readdirSync(racine, { recursive: true })
    .map(String)
    .filter((f) => /\.(ts|tsx|mdx)$/u.test(f));

  test("les fichiers sources sont bien lus", () => {
    expect(fichiers.length).toBeGreaterThan(50);
  });

  test("aucun des neuf noms de palier, hors commentaires", () => {
    const fautifs = [];
    for (const f of fichiers) {
      const source = readFileSync(join(racine, f), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
      for (const nom of PALIERS_SUPPRIMES) {
        if (source.includes(nom)) fautifs.push(`${f} : ${nom}`);
      }
    }
    expect(fautifs).toEqual([]);
  });
});

describe("le site annonce le même prix que le module", () => {
  test("l'accordéon reprend le plancher calculé, jamais une copie", () => {
    // L'EN-TÊTE A PORTÉ UNE FOURCHETTE du 2026-09-02 au 2026-10-05. Il revient
    // au plancher avec la suppression des paliers. Ce qui ne change pas : le
    // montant reste CALCULÉ, jamais recopié.
    for (const p of prestations) {
      const presta = services.find((s) => s.title === p.nom);
      expect(presta, `prestation « ${p.nom} » absente de services.ts`).toBeDefined();
      expect(presta.price).toBe(aPartirDe(p));
      expect(presta.price).toContain(prixPlancher(p));
    }
  });

  test("chaque prestation a une page dédiée, déclarée au manifeste", () => {
    // Une page dédiée absente du manifeste ne serait annoncée à aucun moteur.
    // C'est exactement l'erreur qui avait laissé huit URL mortes et zéro article
    // réel dans le sitemap, découverte le 2026-08-27.
    const chemins = contentRoutes.map((r) => r.pathname);
    for (const p of prestations) {
      const attendu = `/services/${p.slug}`;
      expect(chemins, `${attendu} manque au manifeste`).toContain(attendu);
      const presta = services.find((s) => s.title === p.nom);
      expect(presta.cta?.href).toBe(attendu);
    }
  });

  test("chaque ligne mène à la prise de rendez-vous, sujet présélectionné", () => {
    /*
     * CE QUI EST ARRIVÉ SANS CE TEST. La prise de rendez-vous existait,
     * fonctionnait et affichait les vrais créneaux Cal.com, et AUCUN lien du
     * site n'y menait : zéro occurrence de `#rendez-vous` dans tout `src/`, en
     * dehors de la déclaration de l'ancre elle-même. Le seul chemin était
     * d'ouvrir `/contact` et de descendre 2 300 px en traversant un formulaire
     * de contact complet, qui est son concurrent direct.
     *
     * LE PIÈGE QU'IL GARDE : la correspondance n'est PAS l'identité. La
     * prestation « vitrine » se réserve sous le sujet « site », et une adresse
     * composée avec le mauvais identifiant ne casse rien de visible — le sujet
     * inconnu est ignoré en silence et le visiteur retombe sur un sélecteur
     * vide, exactement comme s'il n'avait cliqué sur rien.
     */
    for (const s of services) {
      expect(s.rdvHref, `« ${s.title} » n'a pas de point d'arrivée`).toBeDefined();
      const url = new URL(s.rdvHref, "https://exemple.fr");
      expect(url.pathname).toBe("/contact");
      expect(url.hash).toBe("#rendez-vous");
      const sujet = url.searchParams.get(PARAM_SUJET);
      expect(IDS_RENDEZ_VOUS, `sujet inconnu sur « ${s.title} » : ${sujet}`).toContain(
        sujet,
      );
    }
    // Les trois prestations chiffrées passent par la table, jamais par leur
    // propre identifiant : « vitrine » n'est pas un sujet de rendez-vous.
    for (const p of prestations) {
      const presta = services.find((s) => s.title === p.nom);
      expect(presta.rdvHref).toBe(lienRendezVous(RDV_PAR_PRESTATION[p.id]));
    }
    expect(RDV_PAR_PRESTATION.vitrine).toBe("site");
  });

  test("le préfixe du prix n'est écrit qu'à un seul endroit", () => {
    // CE QUI EST ARRIVÉ. Le libellé de l'accordéon portait « Prix : à partir
    // de » en dur ET la donnée portait son propre préfixe, que le composant
    // retirait au rendu. Deux préfixes pour un montant : changer l'un des deux
    // donnait « Prix : à partir de dès 3 000 € », ou « Prix : à partir de sur
    // devis » sur la prestation qui n'a pas de montant. Les deux ont été servis.
    expect(uiLabels.services.priceLabel).not.toMatch(/(à partir de|dès|from)\s*$/i);
    for (const s of services) {
      // Toute ligne de l'accordéon est une prestation chiffrée depuis le
      // 2026-09-24 : une entrée sans montant n'a plus de raison d'exister.
      expect(s.price, `« ${s.title} » n'annonce aucun prix`).toBeDefined();
      // FORME « à partir de X », celle que produit `aPartirDe()`, et une
      // seule fois : `priceParts()` découpe ce préfixe vers le libellé gris.
      expect(s.price, `« ${s.title} » doit annoncer son plancher`).toMatch(
        /^à partir de \d/u,
      );
      expect(s.price, `« ${s.title} » ne doit pas doubler le préfixe`).not.toMatch(
        /à partir de .*(à partir de|dès)/iu,
      );
      // Plus de fourchette : une borne haute publiée se lit comme un prix.
      expect(s.price).not.toMatch(/^de .+ à .+$/u);
    }
  });

  test("la FAQ cite les mêmes montants que le module", () => {
    // La réponse « combien coûte un projet » est le seul endroit où les prix
    // sont écrits en toutes lettres dans une phrase. Elle dérive donc, sans
    // rien pour l'en empêcher, sauf ceci.
    const reponsePrix = faqItems
      .map((item) => item.answer)
      .find((a) => /combien|coûte|démarre/i.test(a) && /\d\s?\d{3}/.test(a));
    expect(reponsePrix).toBeDefined();
    for (const p of prestations) {
      expect(
        reponsePrix,
        `le montant d'entrée de « ${p.nom} » manque dans la réponse prix de la FAQ`,
      ).toContain(prixPlancher(p));
    }
  });

  test("aucun montant en euros n'est écrit à la main dans la FAQ", () => {
    // CE TEST LIT LE FICHIER SOURCE, pas le texte rendu, et c'est tout son
    // intérêt. Le test au-dessus compare les montants RENDUS à ceux du module :
    // il attrape une divergence, mais seulement après coup, et seulement pour
    // les prestations qu'il connaît. Un montant écrit en dur qui se trouve être
    // juste le jour où on l'écrit passe entre les mailles, et ne se déclare que
    // le jour où le curseur bouge — c'est-à-dire au pire moment, en production.
    //
    // C'EST ARRIVÉ, et l'en-tête de `offre.ts` le raconte : les prix vivaient à
    // la fois dans `services.ts` et dans `pricing.ts`, et ils ont divergé sans
    // que rien ne le signale. La réponse « combien ça coûte » de la FAQ portait
    // encore trois montants à la main au 2026-09-01, plus les quatre chiffres
    // du suivi : le dernier endroit du site où un prix existait en double.
    //
    // Le motif ne vise QUE les montants en euros. Les pourcentages restent
    // permis : l'échéancier 40 / 30 / 30 est une règle de facturation, pas un
    // prix, et il ne dérive de rien.
    const source = readFileSync(
      fileURLToPath(new URL("./faq.ts", import.meta.url)),
      "utf8",
    );
    const montantEnDur = /\d[\d\u00A0\u202F ]*\u20AC/gu;
    const trouves = source.match(montantEnDur) ?? [];
    expect(
      trouves,
      `un montant en euros est écrit à la main dans faq.ts : ${trouves.join(", ")}. ` +
        "Passer par `prixPlancher(...)`, `plancherSuivi()` ou `suiviMensuel(...)`.",
    ).toEqual([]);
  });

  test("le suivi mensuel est annoncé comme une règle, pas comme un montant figé", () => {
    // CE QUI ÉTAIT ÉCRIT : « un suivi mensuel à partir de 50 € », hérité d'un
    // positionnement abandonné. Sur un logiciel à 10 000 €, c'était 0,6 % par an
    // contre 15 à 20 % relevés sur le marché français. Un prix de suivi écrit en
    // euros se fige ; exprimé en part du projet, il suit la grille tout seul.
    const suivi = faqItems
      .map((item) => item.answer)
      .find((a) => /suivi mensuel/i.test(a));
    expect(suivi, "la réponse sur le suivi a disparu de la FAQ").toBeDefined();
    expect(suivi, "le taux de suivi de la FAQ a divergé du module").toContain(
      tauxSuivi(),
    );
    expect(suivi, "le plancher du suivi a divergé du module").toContain(
      plancherSuivi(),
    );
    /* L'EXEMPLE CHIFFRÉ EST PARTI LE 2026-10-05 avec le prix ferme du palier
       qui lui servait de projet de référence. Ce qui reste gardé : aucun
       autre montant que le plancher du suivi n'apparaît dans la réponse, sans
       quoi un montant de projet reviendrait par la petite porte. */
    const montants = suivi.match(/\d[\d\u00A0\u202F ]*\u20AC/gu) ?? [];
    expect(montants.map((m) => m.replace(/[\s]/gu, " "))).toEqual([
      plancherSuivi().replace(/[\s]/gu, " "),
    ]);
    // Le plancher mord sur le bas de l'offre : aucun projet ne doit pouvoir
    // sortir un suivi inférieur, ce qui arriverait si le pourcentage était
    // appliqué seul.
    for (const offre of [...prestations, integrationIA]) {
      expect(suiviMensuel(offre.plancher)).toBe(plancherSuivi());
    }
    expect(suiviMensuel(1)).toBe(plancherSuivi());
  });

  test("la hausse possible du suivi est annoncée, et elle est bornée", () => {
    // Un forfait de suivi engage un prix sur une charge qui peut bouger. Sans
    // clause, la hausse arrive après coup, ce qui est le pire des cas. La clause
    // doit nommer son déclencheur ET dire que le client peut refuser, sinon elle
    // se lit comme « je peux augmenter quand je veux ».
    // LA RÉPONSE EST TROUVÉE PAR SA QUESTION, et non par un mot de son corps.
    // Le repérage précédent cherchait « infrastructure de votre projet » DANS
    // la réponse : reformuler la réponse en français courant, ce qui est le
    // but, faisait alors disparaître la clause aux yeux du test au lieu de la
    // faire échouer sur le fond. La question, elle, est l'identité de l'entrée.
    //
    // FUSIONNÉE LE 2026-09-24 dans « Que se passe-t-il après la mise en
    // ligne ? » : la FAQ passe à cinq entrées, la clause garde ses trois
    // engagements.
    const question = faqItems.find((item) =>
      /après la mise en ligne/i.test(item.question),
    );
    const clause = question?.answer;
    expect(question, "la clause de hausse du suivi a disparu de la FAQ").toBeDefined();
    expect(clause).toBeDefined();
    expect(clause, "la clause ne nomme pas son déclencheur").toMatch(
      /trafic|volume de données|hébergeur/i,
    );
    expect(clause, "la clause ne prévient pas avant la hausse").toMatch(
      /préviens avant|avant/i,
    );
    // VOUVOIEMENT depuis le 2026-10-15, décision d'Eliott. Ce qui est vérifié
    // n'est pas la formulation mais le fait que le client garde le droit de
    // dire non.
    expect(clause, "la clause ne laisse pas le client refuser").toMatch(
      /tant que vous n’avez pas dit oui|vous pouvez refuser/i,
    );
  });

  test("la FAQ répond à la question du délai sans publier de durée", () => {
    // La durée a quitté les forfaits le 2026-09-23 : le site ne publie
    // aucun délai chiffré. La FAQ dit où la date est écrite.
    const delai = faqItems.find((item) => /combien de temps/i.test(item.question));
    expect(delai, "la question du délai a disparu de la FAQ").toBeDefined();
    expect(delai.answer, "la réponse ne dit pas où la date est écrite").toMatch(/devis/i);
    expect(
      /\d\s*(?:jours?|semaines?|mois)\b|\b(?:jours?|semaines?|mois)\s+ouvrés?\b/iu.test(
        delai.answer,
      ),
      `une durée chiffrée apparaît : ${delai.answer}`,
    ).toBe(false);
  });

  test("aucun prix n'est présenté comme un tarif à la journée", () => {
    // Le taux journalier n'existe plus dans le code du site depuis le passage
    // au prix ferme. Reste à garder le vocabulaire qui le réintroduirait.
    const vocabulaire = /taux journalier|\bTJM\b|par jour|\/\s*jour|à la journée/iu;
    const textes = [
      ...services.flatMap((s) => [s.title, s.price ?? "", ...s.body]),
      ...faqItems.flatMap((f) => [f.question, f.answer]),
      ...prestations.flatMap((p) => [p.resume, p.horsOffre, ...p.inclus, ...p.faitMonter]),
      ...Object.values(methodeLabels).filter((v) => typeof v === "string"),
    ];
    for (const texte of textes) {
      expect(
        vocabulaire.test(texte),
        `un prix est présenté comme un tarif à la journée : ${texte}`,
      ).toBe(false);
    }
  });

  test("aucune fourchette ni « et plus » ne reste dans l'offre publiée", () => {
    // La fourchette « de X à Y et plus » a quitté le site le 2026-10-05. Une
    // borne haute publiée devenait le prix attendu par le visiteur.
    for (const p of prestations) {
      const presta = services.find((s) => s.title === p.nom);
      expect(presta.price).not.toMatch(/ et plus$/u);
      for (const ligne of presta.body) expect(ligne).not.toMatch(/\bforfaits?\b/iu);
    }
  });

  test("prestation() refuse un identifiant inconnu au lieu de rendre indéfini", () => {
    expect(() => prestation("inexistant")).toThrow();
  });
});

/**
 * L'HABILLAGE DES TARIFS : ses liens et ses libellés ne portent aucun montant.
 * Tout prix vient de `offre.ts`, sans quoi deux sources de vérité divergent à
 * deux écrans d'intervalle.
 */
describe("la section tarifs ne peut pas diverger de l'offre", () => {
  test("le lien « sur mesure, sur devis » mène à une page qui existe", () => {
    const chemins = routesTarifs.map((r) => r.pathname);
    for (const p of prestations) {
      const lien = lienDevis(p.slug);
      expect(lien).toBe(`/services/${p.slug}#devis`);
      expect(chemins, `${lien} ne mène nulle part`).toContain(`/services/${p.slug}`);
    }
  });

  test("aucun montant en euros n'est écrit à la main dans tarifs.ts", () => {
    // MÊME GARDE QUE POUR LA FAQ, et pour la même raison : un montant juste le
    // jour où on l'écrit ne se déclare faux que le jour où le curseur bouge,
    // c'est-à-dire en production. La section affiche neuf prix ; aucun n'est une
    // chaîne de ce fichier.
    const source = readFileSync(
      fileURLToPath(new URL("./tarifs.ts", import.meta.url)),
      "utf8",
    );
    const montants = source.match(/\d[\d\u00A0\u202F ]*\u20AC/gu) ?? [];
    expect(
      montants,
      `un montant en euros est écrit à la main dans tarifs.ts : ${montants.join(", ")}`,
    ).toEqual([]);
  });
});

/**
 * L'ACCORDÉON NE PORTE QUE LES PRESTATIONS CHIFFRÉES, depuis le 2026-09-24.
 *
 * Le Diagnostic, l'Audit de code et le bloc « Et aussi » en sont sortis : sans
 * prix ni page, au milieu des prestations chiffrées, ils brouillaient ce
 * qu'Eliott vend. Une ligne qui n'est pas dans `offre.ts` n'y rentre pas par la
 * petite porte.
 */
describe("l'accordéon ne porte que les deux prestations", () => {
  test("une ligne par prestation de l'offre, numérotées dans l'ordre", () => {
    expect(services.map((s) => s.title)).toEqual(prestations.map((p) => p.nom));
    expect(services.map((s) => s.number)).toEqual(
      prestations.map((_, i) => String(i + 1).padStart(2, "0")),
    );
  });
});
