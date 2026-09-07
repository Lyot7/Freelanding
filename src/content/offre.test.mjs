import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  TJM,
  euros,
  fourchette,
  lignesComparees,
  packContient,
  packEntree,
  prestation,
  prestations,
  prixPack,
  plancherSuivi,
  suiviMensuel,
  tauxSuivi,
} from "./offre.ts";
import { horsCatalogue, services } from "./services.ts";
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
 * L'OFFRE NE DOIT ANNONCER QU'UN PRIX PAR PRESTATION, ET CE PRIX DOIT ÊTRE
 * CALCULÉ.
 *
 * CE QUI EST ARRIVÉ SANS CE TEST. L'accordéon des services annonçait « à partir
 * de 5 000 € » pour l'outil métier pendant que la grille comparative affichait
 * « 5 000 à 15 000 € » pour la même prestation, à deux écrans d'intervalle. Rien
 * ne le signalait : deux fichiers, deux chaînes de caractères, aucun lien entre
 * les deux.
 *
 * Depuis le 2026-08-27, plus aucun prix n'est écrit à la main : tout descend du
 * taux journalier et du nombre de jours de chaque pack. Ces tests vérifient que
 * la chaîne tient de bout en bout, du module jusqu'aux pages.
 */

describe("les prix descendent tous du taux journalier", () => {
  test("le taux est un nombre exploitable", () => {
    expect(TJM).toBeGreaterThan(0);
    expect(Number.isInteger(TJM)).toBe(true);
  });

  test("chaque prestation a trois packs, ordonnés du moins cher au plus cher", () => {
    expect(prestations.length).toBe(3);
    const ids = prestations.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const slugs = prestations.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const p of prestations) {
      expect(p.packs.length, `« ${p.nom} » doit avoir trois packs`).toBe(3);
      const jours = p.packs.map((k) => k.jours);
      expect(jours, `les packs de « ${p.nom} » doivent monter`).toEqual(
        [...jours].sort((a, b) => a - b),
      );
      const packIds = p.packs.map((k) => k.id);
      expect(new Set(packIds).size).toBe(packIds.length);
    }
  });

  test("le plancher tient et chaque marche se voit dans le livrable", () => {
    // PLANCHER À CINQ JOURS, ramené de dix le 2026-08-27 : à dix jours, l'entrée
    // de gamme du site vitrine tombait à 5 000 €, au-dessus de la médiane du
    // marché (3 500 €) et du budget médian d'une TPE (4 000 €).
    //
    // MARCHE EN PROPORTION, ET NON EN JOURS ABSOLUS. La règle disait « au moins
    // cinq jours de plus » ; avec un premier pack à cinq jours, elle imposait de
    // doubler. Ce qui compte n'a jamais été l'écart absolu : c'est qu'un pack se
    // VOIE dans le livrable, sinon c'est une remise déguisée. Un quart de jours
    // en plus vaut à tous les niveaux d'échelle.
    for (const p of prestations) {
      expect(
        p.packs[0].jours,
        `« ${p.nom} » démarre trop bas`,
      ).toBeGreaterThanOrEqual(5);
      for (let i = 1; i < p.packs.length; i += 1) {
        const avant = p.packs[i - 1].jours;
        const ratio = p.packs[i].jours / avant;
        expect(
          ratio,
          `« ${p.packs[i].nom} » n'ajoute que ${p.packs[i].jours - avant} jours à ${avant}`,
        ).toBeGreaterThanOrEqual(1.25);
      }
    }
  });

  test("le prix d'un pack vaut exactement le taux multiplié par ses jours", () => {
    for (const p of prestations) {
      for (const pack of p.packs) {
        expect(prixPack(pack)).toBe(euros(TJM * pack.jours));
      }
    }
  });

  test("chaque pack est décrit, et ne redit pas ce que le précédent contient", () => {
    for (const p of prestations) {
      for (const pack of p.packs) {
        expect(pack.promesse.length).toBeGreaterThan(15);
        expect(pack.pourQui.length).toBeGreaterThan(20);
        expect(
          pack.ajoute.length,
          `« ${pack.nom} » n'ajoute rien`,
        ).toBeGreaterThan(2);
      }
      // Le premier pack liste tout, les suivants ne listent que le delta : une
      // ligne identique d'un pack à l'autre est donc une erreur de rédaction.
      const vues = new Set();
      for (const pack of p.packs) {
        for (const ligne of pack.ajoute) {
          expect(
            vues.has(ligne),
            `ligne répétée dans « ${p.nom} » : ${ligne}`,
          ).toBe(false);
          vues.add(ligne);
        }
      }
    }
  });
});

describe("le site annonce le même prix que le module", () => {
  test("l'accordéon reprend la fourchette calculée, jamais une copie", () => {
    // L'EN-TÊTE ANNONÇAIT UN PLANCHER (« Dès 3 000 € ») jusqu'au 2026-09-02, et
    // ne disait donc rien du haut de gamme. Il porte maintenant la fourchette
    // entière : cinq lignes fermées donnent la carte de l'offre en une lecture.
    // Ce qui ne change pas : le montant reste CALCULÉ, jamais recopié.
    for (const p of prestations) {
      const presta = services.find((s) => s.title === p.nom);
      expect(presta, `prestation « ${p.nom} » absente de services.ts`).toBeDefined();
      expect(presta.price).toBe(fourchette(p.id));
      // La borne basse de la fourchette EST le prix du pack d'entrée : les deux
      // formulations doivent rester d'accord, quoi qu'il arrive au TJM.
      expect(presta.price).toContain(prixPack(packEntree(p.id)));
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
      // Le Diagnostic n'a pas de prix : il est compris dans la prestation qui
      // suit. Une entrée sans montant est légitime, une entrée avec un montant
      // mal formé ne l'est pas.
      if (s.price === undefined || s.price === "sur devis") continue;
      // FORME « de X à Y », celle que produit `fourchette()`. Le test acceptait
      // « Dès X » : le garder aurait laissé passer une entrée restée au
      // plancher pendant que les autres annoncent leur fourchette.
      expect(s.price, `« ${s.title} » doit annoncer sa fourchette`).toMatch(
        /^de .+ à .+$/u,
      );
      expect(s.price, `« ${s.title} » ne doit pas doubler le préfixe`).not.toMatch(
        /^(dès|à partir de|from)\b/i,
      );
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
      ).toContain(prixPack(packEntree(p.id)));
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
    // permis : l'échéancier 30 / 40 / 30 est une règle de facturation, pas un
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
        "Passer par `prixPack(packEntree(...))`, `plancherSuivi()` ou `suiviMensuel(...)`.",
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
    /* L'exemple chiffré doit rester juste : il est recalculé, pas relu. Le
       projet de référence est le pack d'entrée du logiciel, DÉRIVÉ et non
       écrit : la valeur 10 000 était codée ici, elle est devenue fausse le jour
       où le taux journalier est passé de 500 à 600. Un test qui fige un montant
       reproduit le défaut qu'il surveille. */
    const projetReference = TJM * packEntree("logiciel").jours;
    expect(
      suivi,
      "l'exemple chiffré du suivi ne correspond plus au taux",
    ).toContain(suiviMensuel(projetReference));
    // Le plancher mord sur tout le bas de grille : aucun projet ne doit
    // pouvoir sortir un suivi inférieur, ce qui arriverait si le pourcentage
    // était appliqué seul.
    for (const p of prestations) {
      for (const pack of p.packs) {
        expect(suiviMensuel(TJM * pack.jours)).not.toBe(euros(0));
      }
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
    const question = faqItems.find((item) =>
      /suivi peut-il augmenter/i.test(item.question),
    );
    const clause = question?.answer;
    expect(question, "la clause d'infrastructure a disparu de la FAQ").toBeDefined();
    expect(clause).toBeDefined();
    expect(clause, "la clause ne nomme pas son déclencheur").toMatch(
      /trafic|volume de données|hébergeur/i,
    );
    expect(clause, "la clause ne prévient pas avant la hausse").toMatch(
      /préviens avant|avant/i,
    );
    // LE SITE TUTOIE DEPUIS LE 2026-09-02 : le motif accepte les deux personnes.
    // Ce qui est vérifié n'est pas la formulation mais le fait que le client
    // garde le droit de dire non, quelle que soit la personne grammaticale.
    expect(clause, "la clause ne laisse pas le client refuser").toMatch(
      /tant que (?:vous n’avez|tu n’as) pas dit oui|(?:vous pouvez|tu peux) refuser/i,
    );
  });

  test("le taux journalier n'est écrit nulle part en clair", () => {
    // RÈGLE DU VAULT, et conclusion des deux audits du 2026-08-27 : le taux est
    // la règle de construction, jamais un argument de vente. Il est déjà
    // déductible par division dès qu'un prix et une durée se touchent, ce qui
    // est une raison de plus de ne pas l'écrire.
    //
    // LE MONTANT SEUL NE SUFFIT PAS À LE DÉTECTER : « 500 € » est un morceau de
    // « 2 500 € », et la première version de ce test échouait sur le prix
    // d'entrée du site vitrine. Deux vérifications séparées, donc : le montant
    // isolé (jamais précédé d'un chiffre ni d'une insécable), et le vocabulaire
    // qui présenterait un prix comme un tarif à la journée.
    const isole = new RegExp(
      `(?<![\\d\\u00A0])${TJM}\\u00A0\\u20AC`,
      "u",
    );
    const vocabulaire = /taux journalier|\bTJM\b|par jour|\/\s*jour|à la journée/iu;
    const textes = [
      ...services.flatMap((s) => [s.title, s.price ?? "", ...s.body]),
      ...faqItems.flatMap((f) => [f.question, f.answer]),
      ...prestations.flatMap((p) => [
        p.resume,
        p.horsPack,
        ...p.packs.flatMap((k) => [k.promesse, k.pourQui, ...k.ajoute]),
      ]),
    ];
    for (const texte of textes) {
      expect(
        isole.test(texte),
        `le taux journalier apparaît en clair : ${texte}`,
      ).toBe(false);
      expect(
        vocabulaire.test(texte),
        `un prix est présenté comme un tarif à la journée : ${texte}`,
      ).toBe(false);
    }
  });

  test("la fourchette publique encadre bien les trois packs", () => {
    for (const p of prestations) {
      const rendu = fourchette(p.id);
      expect(rendu).toContain(prixPack(p.packs[0]));
      expect(rendu).toContain(prixPack(p.packs[2]));
    }
  });

  test("prestation() refuse un identifiant inconnu au lieu de rendre indéfini", () => {
    expect(() => prestation("inexistant")).toThrow();
  });
});

/**
 * LA SECTION TARIFS DE LA PAGE D'ACCUEIL.
 *
 * ELLE NE PORTE AUCUNE DONNÉE À ELLE, et c'est la seule chose qui empêche la
 * classe d'erreur que raconte l'en-tête de `offre.ts` de revenir : deux sources
 * de vérité sur le contenu d'un périmètre, à deux écrans d'intervalle, sans
 * rien pour signaler leur divergence. Sa matrice est DÉRIVÉE de `ajoute`.
 */
describe("la section tarifs ne peut pas diverger de l'offre", () => {
  test("la matrice reprend exactement les livrables, sans en perdre ni en ajouter", () => {
    for (const p of prestations) {
      const attendu = p.packs.flatMap((pack) => [...pack.ajoute]);
      const rendu = lignesComparees(p.id).map((l) => l.libelle);
      expect(rendu, `la matrice de « ${p.nom} » ne dit pas la même chose que ses packs`).toEqual(
        attendu,
      );
    }
  });

  test("les périmètres sont cumulatifs : une ligne cochée le reste au-dessus", () => {
    // C'EST LE SENS MÊME DE `ajoute`, et la matrice serait mensongère sans lui :
    // le premier périmètre liste tout ce qu'il contient, les suivants ne listent
    // que leur delta. Un `===` au lieu d'un `>=` afficherait « La Conversion »
    // sans les sept livrables de « L'Essentiel », donc plus cher pour moins.
    for (const p of prestations) {
      for (const ligne of lignesComparees(p.id)) {
        for (let index = 0; index < p.packs.length; index += 1) {
          expect(
            packContient(ligne, index),
            `« ${ligne.libelle} » mal placée sur le périmètre ${index} de « ${p.nom} »`,
          ).toBe(index >= ligne.depuis);
        }
      }
      // Le périmètre le plus haut contient forcément TOUT.
      const dernier = p.packs.length - 1;
      for (const ligne of lignesComparees(p.id)) {
        expect(packContient(ligne, dernier)).toBe(true);
      }
    }
  });

  test("le lien « pourquoi un devis » mène à une page qui existe", () => {
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

  test("le taux journalier n'apparaît pas dans l'habillage de la section", () => {
    const isole = new RegExp(`(?<![\\d\\u00A0])${TJM}\\u00A0\\u20AC`, "u");
    const vocabulaire = /taux journalier|\bTJM\b|par jour|\/\s*jour|à la journée/iu;
    const textes = Object.values(methodeLabels).filter(
      (v) => typeof v === "string",
    );
    for (const texte of textes) {
      expect(isole.test(texte), `le taux apparaît en clair : ${texte}`).toBe(false);
      expect(
        vocabulaire.test(texte),
        `un prix est présenté comme un tarif à la journée : ${texte}`,
      ).toBe(false);
    }
  });
});

/**
 * CE QUI EST VENDU HORS CATALOGUE — et qui n'a pas de prix.
 *
 * LA RÈGLE D'ELIOTT : une promesse qui n'est pas dans son corpus n'a rien à
 * faire dans un périmètre chiffré. Ces trois sujets n'ont ni périmètre ni
 * montant ; le jour où l'un d'eux en gagne un, il rejoint `offre.ts` et il
 * n'entre pas ici par la petite porte.
 */
describe("le bloc « et aussi » ne chiffre rien", () => {
  test("aucun montant, aucune durée, aucun pourcentage", () => {
    const textes = [
      horsCatalogue.titre,
      horsCatalogue.intro,
      horsCatalogue.cta.label,
      ...horsCatalogue.items.flatMap((i) => [i.nom, i.corps]),
    ];
    for (const texte of textes) {
      expect(/\u20AC/u.test(texte), `un montant apparaît : ${texte}`).toBe(false);
      expect(
        /\bjours?\s+ouvrés?\b|\bsemaines?\b/iu.test(texte),
        `un délai apparaît : ${texte}`,
      ).toBe(false);
    }
  });

  test("son bouton mène à la prise de rendez-vous, sujet compris", () => {
    const url = new URL(horsCatalogue.cta.href, "https://exemple.fr");
    expect(url.pathname).toBe("/contact");
    expect(url.hash).toBe("#rendez-vous");
    expect(IDS_RENDEZ_VOUS).toContain(url.searchParams.get(PARAM_SUJET));
  });
});
