import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  euros,
  prestation,
  prestations,
  PRIX_AU_DEVIS,
  repereAgenceLogiciel,
  SUR_DEVIS,
} from "./offre.ts";
import { services } from "./services.ts";
import { lienDevis } from "./tarifs.ts";
import { contentRoutes as routesTarifs } from "./routes.ts";
import { faqItems } from "./faq.ts";
import { homeContent } from "./home.ts";
import { uiLabels } from "./ui.ts";
import { contentRoutes } from "./routes.ts";
import {
  IDS_RENDEZ_VOUS,
  PARAM_SUJET,
  RDV_PAR_PRESTATION,
  lienRendezVous,
} from "./rendez-vous.ts";

/** Toutes les offres publiées : depuis le 2026-10-31, le logiciel métier seul. */
const OFFRES = [...prestations];

/**
 * AUCUN PRIX D'ELIOTT SUR LE SITE, décision du 2026-11-01 : « les prix c'est
 * uniquement sur devis ». Ces tests figeaient un plancher « à partir de » écrit
 * à un seul endroit ; ils gardent maintenant son absence.
 *
 * Les paliers à prix ferme du 2026-09-23 sont supprimés depuis le 2026-10-05.
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

describe("l'offre ne porte aucun montant", () => {
  test("une seule prestation, le logiciel métier, au slug unique", () => {
    // Décision d'Eliott du 2026-10-30, appliquée le 2026-10-31 : une seule
    // offre. Le site vitrine, l'intégration IA et le CTO n'existent plus.
    expect(prestations.map((p) => p.id)).toEqual(["logiciel"]);
    expect(prestation("logiciel").nom).toBe("Logiciel métier");
    const slugs = prestations.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("aucune offre ne porte de plancher", () => {
    // Décision d'Eliott du 2026-11-01 : le prix se fixe au devis.
    for (const offre of OFFRES) expect("plancher" in offre, offre.nom).toBe(false);
  });

  test("les anciennes offres ne sont plus exportées", () => {
    // Un retour de l'intégration IA, du CTO ou du site vitrine passerait par
    // ce module : on le vérifie sur la source, commentaires retirés.
    const source = readFileSync(fileURLToPath(new URL("./offre.ts", import.meta.url)), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    for (const nom of ["integrationIA", "ctoReferentIA", "CTO_QUATRE_JOURS", "repereAgenceSite", "PERIODES", "prixPlancher", "prixAffiche", "aPartirDe", "plancherSuivi", "tauxSuivi", "TAUX_SUIVI", "PLANCHER_SUIVI", "suiviMensuel"]) {
      expect(source, `« ${nom} » est revenu dans offre.ts`).not.toContain(nom);
    }
    expect(() => prestation("vitrine")).toThrow();
  });

  test("le projet est payé une fois : aucune offre n'est mensuelle", () => {
    for (const offre of OFFRES) {
      expect(offre.periode, `« ${offre.nom} » est un projet, payé une fois`).toBeUndefined();
    }
  });

  test("les repères d'agence restent ordonnés, source comprise", () => {
    expect(repereAgenceLogiciel.premierOutilMin).toBeLessThan(repereAgenceLogiciel.premierOutilMax);
    expect(repereAgenceLogiciel.premierOutilMax).toBeLessThan(repereAgenceLogiciel.mediane);
    expect(repereAgenceLogiciel.source.nom).toBe("La Fabrique du Net");
  });

  test("plus aucun palier : ni forfaits, ni prix ferme par forfait, ni délai", () => {
    for (const offre of OFFRES) {
      for (const champ of ["packs", "delai", "prix", "surMesure"]) {
        expect(champ in offre, `« ${offre.nom} » porte encore « ${champ} »`).toBe(false);
      }
    }
  });

  test("la phrase du prix ne porte aucun chiffre", () => {
    expect(SUR_DEVIS).toBe("sur devis");
    expect(PRIX_AU_DEVIS).toMatch(/devis/u);
    expect(PRIX_AU_DEVIS).not.toMatch(/\d/u);
  });

  test("chaque offre dit ce qui est compris et ce qui fait monter le prix", () => {
    for (const offre of OFFRES) {
      expect(offre.inclus.length, `« ${offre.nom} » ne dit rien de ce qui est compris`).toBeGreaterThan(2);
      expect(offre.faitMonter.length, `« ${offre.nom} » ne dit pas ce qui fait varier le prix`).toBeGreaterThan(2);
      expect(offre.horsOffre.length).toBeGreaterThan(20);
      // Une ligne ne peut pas être à la fois comprise et facteur de hausse.
      const lignes = [...offre.inclus, ...offre.faitMonter];
      expect(new Set(lignes).size, `ligne répétée dans « ${offre.nom} »`).toBe(lignes.length);
    }
  });

  test("aucune durée n'est annoncée dans l'offre", () => {
    // La date vit au devis. Un délai chiffré à côté d'un prix redonnait le
    // taux journalier en une division, et il engageait sur une durée que
    // la complexité du projet décide.
    const textes = OFFRES.flatMap((p) => [
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
 * d'Eliott du 2026-10-15). Le site parle de devis : un TJM, même cité en repoussoir, ramène le lecteur à un prix au temps passé.
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
      ...OFFRES.flatMap((p) => [
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

  test("le repère d'agence reste sourcé dans le héros, sans se redire dans la FAQ", () => {
    const reponse = faqItems.find((f) => /Combien coûte un projet/u.test(f.question))?.answer;
    expect(reponse).not.toContain(euros(repereAgenceLogiciel.premierOutilMin));
    const { source } = homeContent.hero.comparison;
    expect(source.href).toBe(repereAgenceLogiciel.source.href);
    expect(source.label).toContain(repereAgenceLogiciel.source.nom);
    expect(source.label).toContain(repereAgenceLogiciel.source.releve);
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

describe("le site dit « sur devis » partout où il parle de prix", () => {
  test("l'accordéon annonce « sur devis », sans montant", () => {
    for (const p of OFFRES) {
      const presta = services.find((s) => s.title === p.nom);
      expect(presta, `prestation « ${p.nom} » absente de services.ts`).toBeDefined();
      expect(presta.price).toBe(SUR_DEVIS);
    }
  });

  test("chaque prestation a une page SEO déclarée au manifeste, et À propos n’y mène pas", () => {
    // Une page dédiée absente du manifeste ne serait annoncée à aucun moteur.
    // C'est exactement l'erreur qui avait laissé huit URL mortes et zéro article
    // réel dans le sitemap, découverte le 2026-08-27.
    const chemins = contentRoutes.map((r) => r.pathname);
    for (const p of prestations) {
      const attendu = `/services/${p.slug}`;
      expect(chemins, `${attendu} manque au manifeste`).toContain(attendu);
      expect(services.find((s) => s.title === p.nom).cta?.href).not.toBe(attendu);
    }
  });

  test("les pages des offres retirées sont sorties du manifeste", () => {
    const chemins = contentRoutes.map((r) => r.pathname);
    for (const retire of [
      "/services/site-vitrine",
      "/services/site-vitrine/prix",
      "/services/site-vitrine/artisans",
      "/services/cto-referent-ia",
      "/creation-site-internet-caen",
    ]) {
      expect(chemins, `${retire} est revenu au manifeste`).not.toContain(retire);
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
    // La prestation passe par la table, jamais par son propre identifiant.
    for (const p of prestations) {
      const presta = services.find((s) => s.title === p.nom);
      expect(presta.rdvHref).toBe(lienRendezVous(RDV_PAR_PRESTATION[p.id]));
    }
    expect(RDV_PAR_PRESTATION.logiciel).toBe("logiciel");
    // Deux sujets seulement : le logiciel, et la découverte pour tout le reste.
    expect([...IDS_RENDEZ_VOUS]).toEqual(["logiciel", "decouverte"]);
  });

  test("aucun préfixe de prix ne revient dans le libellé ni dans la donnée", () => {
    expect(uiLabels.services.priceLabel).not.toMatch(/(à partir de|dès|from)\s*$/i);
    for (const s of services) {
      // Sans montant depuis le 2026-11-01 : le libellé « Prix : » précède
      // « sur devis », et aucun préfixe de prix ne doit revenir.
      expect(s.price, `« ${s.title} » doit dire « sur devis »`).toBe(SUR_DEVIS);
      expect(s.price).not.toMatch(/\d|à partir de|dès/iu);
    }
  });

  test("la réponse prix de la FAQ dit que le prix se fixe au devis", () => {
    const reponse = faqItems.find((f) => /Combien coûte un projet/u.test(f.question))?.answer;
    expect(reponse).toContain(PRIX_AU_DEVIS);
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
        "Aucun prix d'Eliott ne se publie, et un repère de marché vient d'`offre.ts`.",
    ).toEqual([]);
  });

  test("le suivi se chiffre au devis, sans taux ni montant", () => {
    const suivi = faqItems
      .map((item) => item.answer)
      .find((a) => /(?:suivi|maintenance) mensuel/iu.test(a));
    expect(suivi, "la réponse sur le suivi a disparu de la FAQ").toBeDefined();
    expect(suivi).toMatch(/devis/u);
    expect(suivi).not.toMatch(/\d\s*(?:%|\u20AC)/u);
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
      /après la mise en service/i.test(item.question),
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
      ...OFFRES.flatMap((p) => [p.resume ?? "", p.horsOffre, ...p.inclus, ...p.faitMonter]),
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
describe("l'accordéon porte l'offre unique", () => {
  test("une seule ligne, numérotée 01", () => {
    // Décision d'Eliott du 2026-10-30 : une seule offre, le logiciel métier.
    expect(services.map((s) => s.title)).toEqual([prestation("logiciel").nom]);
    expect(services.map((s) => s.number)).toEqual(["01"]);
  });

  test("la ligne a deux paragraphes et une image", () => {
    for (const s of services) {
      expect(s.body.length, s.title).toBe(2);
      for (const paragraphe of s.body) expect(paragraphe.length, s.title).toBeGreaterThan(40);
      expect(s.image?.alt.length, s.title).toBeGreaterThan(10);
    }
    const images = services.map((s) => s.image?.src);
    expect(new Set(images).size).toBe(services.length);
  });

  test("chaque image citée existe sur le disque", () => {
    const racinePublic = fileURLToPath(new URL("../../public", import.meta.url));
    for (const s of services) {
      expect(() => readFileSync(join(racinePublic, s.image.src)), s.image.src).not.toThrow();
    }
  });

  test("le prix de l'accordéon se lit « sur devis », sans période", () => {
    expect(services[0].price).toBe(SUR_DEVIS);
  });
});

/**
 * LA GARDE DE LA DÉCISION DU 2026-11-01. Elle parcourt tout `src/content`, ts,
 * json et mdx, commentaires des ts retirés, et refuse phrase par phrase le retour
 * d'un prix d'Eliott : son ancien plancher et ses formes, le minimum et le taux
 * du suivi. Une phrase qui cite un repère d'agence reste permise : La Fabrique
 * du Net relève aussi une médiane de 6 000 € pour un site de PME.
 *
 * `legal.ts` en sort : les CGV ne se réécrivent pas ici.
 */
describe("aucun prix d'Eliott dans src/content", () => {
  const racine = fileURLToPath(new URL("./", import.meta.url));
  const fichiers = readdirSync(racine, { recursive: true })
    .map(String)
    .filter((f) => /\.(ts|json|mdx)$/u.test(f) && f !== "legal.ts");

  const PLANCHER = /(?<!\d)(?<!\d[\s\u00A0\u202F])6[\s\u00A0\u202F]?000(?:[\s\u00A0\u202F]?(?:€|euros))?(?!\d)/u;
  const SUIVI = /(?<![\d])125[\s\u00A0\u202F]?€|(?<![\d,])18[\s\u00A0\u202F]?%\s+du prix/u;
  const FORME = /(?:à partir de|dès|démarre à|commencent? à)[\s\u00A0\u202F]+\d[\d\s\u00A0\u202F]*(?:€|euros)|prix (?:plancher|de départ)/iu;
  const REPERE = /Fabrique du Net|\bagences?\b/iu;

  const phrasesDe = (f) => {
    const brut = readFileSync(join(racine, f), "utf8");
    const texte = f.endsWith(".ts")
      ? brut.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
      : brut;
    return texte.split(/(?<=[.!?])\s+|\n/u);
  };

  test("les fichiers de contenu sont bien lus, articles et métiers compris", () => {
    expect(fichiers.some((f) => f.endsWith(".mdx"))).toBe(true);
    expect(fichiers).toContain("metiers.json");
    expect(fichiers).toContain("offre.ts");
  });

  test("ni plancher, ni « à partir de », ni suivi chiffré", () => {
    const fautifs = [];
    for (const f of fichiers) {
      for (const phrase of phrasesDe(f)) {
        const chiffre = (PLANCHER.test(phrase) && !REPERE.test(phrase)) || SUIVI.test(phrase);
        if (chiffre || FORME.test(phrase)) fautifs.push(`${f} : ${phrase.trim().slice(0, 120)}`);
      }
    }
    expect(fautifs).toEqual([]);
  });

  test("les garde-fous attrapent bien les formes qu'ils visent", () => {
    expect(PLANCHER.test("Un logiciel coûte 6\u00A0000\u00A0€ HT.")).toBe(true);
    expect(PLANCHER.test("le budget va de 16 000 €")).toBe(false);
    expect(SUIVI.test("avec un minimum de 125\u00A0€ par mois")).toBe(true);
    expect(SUIVI.test("18\u202F% du prix du projet")).toBe(true);
    expect(FORME.test("dès 6\u00A0000\u00A0€ HT")).toBe(true);
    expect(FORME.test("à partir de 3 500 €")).toBe(true);
  });

  test("le texte rendu ne les porte pas non plus", () => {
    const rendu = JSON.stringify([faqItems, services, homeContent]);
    expect(rendu).not.toMatch(/\b6[\s\u00A0\u202F]000[\s\u00A0\u202F]€|125[\s\u00A0\u202F]€/u);
  });
});
