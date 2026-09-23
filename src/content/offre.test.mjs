import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  euros,
  fourchette,
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
 * L'OFFRE NE DOIT ANNONCER QU'UN PRIX PAR FORFAIT, ET CE PRIX NE S'ÉCRIT QU'À
 * UN ENDROIT.
 *
 * CE QUI EST ARRIVÉ SANS CE TEST. L'accordéon des services annonçait « à partir
 * de 5 000 € » pour l'outil métier pendant que la grille comparative affichait
 * « 5 000 à 15 000 € » pour la même prestation, à deux écrans d'intervalle. Rien
 * ne le signalait : deux fichiers, deux chaînes de caractères, aucun lien.
 *
 * Depuis le 2026-09-23, les forfaits sont à PRIX FERME : chaque montant s'écrit
 * une fois dans `offre.ts`, et tout le reste du site le lit de là.
 */

describe("les forfaits sont à prix ferme, écrits une seule fois", () => {
  test("chaque prestation a trois forfaits, ordonnés du moins cher au plus cher", () => {
    expect(prestations.map((p) => p.id)).toEqual(["vitrine", "logiciel"]);
    const slugs = prestations.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const p of prestations) {
      expect(p.packs.length, `« ${p.nom} » doit avoir trois forfaits`).toBe(3);
      const prix = p.packs.map((k) => k.prix);
      for (const montant of prix) {
        expect(Number.isInteger(montant) && montant > 0).toBe(true);
      }
      expect(prix, `les forfaits de « ${p.nom} » doivent monter`).toEqual(
        [...prix].sort((a, b) => a - b),
      );
      expect(new Set(prix).size, `deux forfaits de « ${p.nom} » au même prix`).toBe(
        prix.length,
      );
      const packIds = p.packs.map((k) => k.id);
      expect(new Set(packIds).size).toBe(packIds.length);
    }
  });

  test("la grille arrêtée par Eliott le 2026-09-23", () => {
    // Montants de décision, pas de calcul : les figer ici fait échouer toute
    // modification involontaire, et oblige une modification voulue à passer
    // par ce test.
    expect(prestation("vitrine").packs.map((k) => k.prix)).toEqual([3000, 4800, 7200]);
    expect(prestation("logiciel").packs.map((k) => k.prix)).toEqual([6000, 18000, 36000]);
  });

  test("seul le dernier palier peut être sur mesure", () => {
    for (const p of prestations) {
      p.packs.slice(0, -1).forEach((pack) => {
        expect(pack.surMesure, `« ${pack.nom} » ne peut pas être sur mesure`).toBeUndefined();
      });
    }
    expect(prestation("logiciel").packs[2].surMesure).toBe(true);
    expect(prestation("vitrine").packs[2].surMesure).toBeUndefined();
  });

  test("le prix affiché est le montant du forfait, formaté", () => {
    for (const p of prestations) {
      for (const pack of p.packs) {
        expect(prixPack(pack)).toBe(euros(pack.prix));
      }
    }
  });

  test("chaque forfait est décrit, et ne redit pas ce que le précédent contient", () => {
    for (const p of prestations) {
      for (const pack of p.packs) {
        expect(pack.promesse.length).toBeGreaterThan(15);
        expect(pack.pourQui.length).toBeGreaterThan(20);
        expect(
          pack.ajoute.length,
          `« ${pack.nom} » n'ajoute rien`,
        ).toBeGreaterThan(2);
      }
      // Le premier forfait liste tout, les suivants ne listent que le delta :
      // une ligne identique d'un forfait à l'autre est une erreur de rédaction.
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

  test("aucune durée n'est annoncée à côté d'un prix", () => {
    // Un prix ferme accolé à « environ 5 jours ouvrés » redonnait le taux
    // journalier en une division. La date vit au devis.
    const textes = prestations.flatMap((p) => [
      p.resume,
      p.horsPack,
      ...p.packs.flatMap((k) => [k.promesse, k.pourQui, ...k.ajoute]),
    ]);
    for (const texte of textes) {
      expect(/jours? ouvrés?|semaines?\b/iu.test(texte), texte).toBe(false);
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
       projet de référence est Le Logiciel, palier du milieu de La Solution
       métier, lu dans le module. */
    const projetReference = prestation("logiciel").packs[1].prix;
    expect(
      suivi,
      "l'exemple chiffré du suivi ne correspond plus au taux",
    ).toContain(suiviMensuel(projetReference));
    // Le plancher mord sur tout le bas de grille : aucun projet ne doit
    // pouvoir sortir un suivi inférieur, ce qui arriverait si le pourcentage
    // était appliqué seul.
    for (const p of prestations) {
      for (const pack of p.packs) {
        expect(suiviMensuel(pack.prix)).not.toBe(euros(0));
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

  test("aucun prix n'est présenté comme un tarif à la journée", () => {
    // Le taux journalier n'existe plus dans le code du site depuis le passage
    // au prix ferme. Reste à garder le vocabulaire qui le réintroduirait.
    const vocabulaire = /taux journalier|\bTJM\b|par jour|\/\s*jour|à la journée/iu;
    const textes = [
      ...services.flatMap((s) => [s.title, s.price ?? "", ...s.body]),
      ...faqItems.flatMap((f) => [f.question, f.answer]),
      ...prestations.flatMap((p) => [
        p.resume,
        p.horsPack,
        ...p.packs.flatMap((k) => [k.promesse, k.pourQui, ...k.ajoute]),
      ]),
      ...Object.values(methodeLabels).filter((v) => typeof v === "string"),
    ];
    for (const texte of textes) {
      expect(
        vocabulaire.test(texte),
        `un prix est présenté comme un tarif à la journée : ${texte}`,
      ).toBe(false);
    }
  });

  test("la fourchette publique encadre bien les trois forfaits", () => {
    for (const p of prestations) {
      const rendu = fourchette(p.id);
      expect(rendu).toContain(prixPack(p.packs[0]));
      expect(rendu).toContain(prixPack(p.packs[2]));
      // Un haut de grille sur mesure n'a pas de plafond : la fourchette le dit.
      expect(rendu.endsWith(" et plus")).toBe(p.packs[2].surMesure === true);
    }
    // La taxe se place derrière le montant, jamais après « et plus ».
    expect(fourchette("logiciel", " HT")).toMatch(/\u20AC HT et plus$/u);
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
