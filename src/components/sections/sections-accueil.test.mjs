import { afterEach, describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { installerDom, monter } from "@/components/motion/__tests__/dom.mjs";
import { homeContent } from "@/content/home";
import { formatHeure } from "./cadran";
import { ConfianceSection } from "./ConfianceSection";
import { HeroCadran } from "./HeroCadran";
import { PreuvesSection } from "./PreuvesSection";
import { RencontreSection } from "./RencontreSection";

const { preuves, confiance, rencontre, hero } = homeContent;
const { cadran } = hero;
const sansEntites = (html) => html.replaceAll("&#x27;", "’").replaceAll("&amp;", "&");

describe("sections de l'accueil en DOM", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  describe("PreuvesSection", () => {
    const html = sansEntites(renderToStaticMarkup(createElement(PreuvesSection, { preuves })));

    it("nomme chaque projet, avec un lien vers sa fiche", () => {
      for (const projet of preuves.projets) {
        expect(html).toContain(projet.titre);
        expect(html).toContain(`href="/realisations/${projet.slug}"`);
      }
      expect(html).toContain(`href="${preuves.lien.href}"`);
    });

    it("montre de vrais écrans, sans lancer la vidéo avant l'écran", () => {
      expect(html).toContain('preload="none"');
      for (const media of preuves.projets.flatMap((p) => p.medias)) {
        if (media.video) expect(html).toContain(media.video);
        else expect(html).toContain(encodeURIComponent(media.src));
      }
    });

    it("ne porte un chiffre que sur le résultat mesuré", () => {
      const avecChiffre = preuves.projets.filter((p) => p.chiffre);
      expect(avecChiffre).toHaveLength(1);
      expect(html).toContain(`<span class="sr-only">${avecChiffre[0].chiffre}</span>`);
    });

    it("se monte sans mouvement ni colonne décalée en mouvement réduit", async () => {
      contexte = installerDom({ mouvementReduit: true });
      montage = await monter(createElement(PreuvesSection, { preuves }));
      expect(montage.conteneur.querySelector("section").id).toBe("realisations");
    });
  });

  describe("ConfianceSection", () => {
    const html = sansEntites(renderToStaticMarkup(createElement(ConfianceSection, { confiance })));

    it("dit ce qui passe de chez moi à chez vous, ligne par ligne", () => {
      for (const ligne of confiance.otage.lignes) expect(html).toContain(ligne);
      expect(html.match(new RegExp(confiance.otage.avant, "g"))).toHaveLength(confiance.otage.lignes.length);
      expect(html).toContain(confiance.otage.conclusion);
    });

    it("rend chaque tuile et chaque preuve à vérifier", () => {
      for (const tuile of confiance.tuiles) {
        expect(html).toContain(tuile.titre);
        expect(html).toContain(`<span class="sr-only">${tuile.chiffre}</span>`);
      }
      for (const lien of confiance.verifier.liens) expect(html).toContain(`href="${lien.href}"`);
      expect(html).toContain(confiance.cta.label);
    });

    it("en mouvement réduit, seule reste la colonne « chez vous »", async () => {
      contexte = installerDom({ mouvementReduit: true });
      montage = await monter(createElement(ConfianceSection, { confiance }));
      const texte = montage.conteneur.textContent;
      expect(texte).toContain(confiance.otage.apres);
      expect(texte).not.toContain(confiance.otage.avant);
    });
  });

  describe("RencontreSection", () => {
    const html = sansEntites(renderToStaticMarkup(createElement(RencontreSection, { rencontre })));

    it("donne son titre, sa citation et ses paragraphes, sans témoignage inventé", () => {
      expect(html).toContain(rencontre.citation);
      for (const paragraphe of rencontre.paragraphes) expect(html).toContain(paragraphe);
      expect(html).toContain("<h2");
    });

    it("mène au rendez-vous et au parcours, jamais à la page du logiciel", () => {
      expect(html).toContain(`href="${rencontre.cta.href}"`);
      expect(html).toContain(`href="${rencontre.parcours.href}"`);
      expect(html).not.toContain("/services/logiciel-metier");
    });

    it("signe avec le vrai portrait, jamais l'image générée", () => {
      expect(rencontre.portrait.src).not.toContain("marque/portrait");
      expect(html).toContain(rencontre.signataire);
      expect(html).toContain("<svg");
    });
  });

  describe("HeroCadran", () => {
    it("part de la semaine entière, le mot « exemple » à l'écran", () => {
      const html = sansEntites(renderToStaticMarkup(createElement(HeroCadran, { cadran })));
      expect(html).toContain(formatHeure(cadran.depart));
      expect(html).toContain(cadran.taches[0]);
      expect(html).toContain(cadran.exemple.label);
      expect(html).toContain(`<span class="sr-only">${cadran.phrase}</span>`);
    });

    it("garde 60 graduations et un seul lien, vers le détail", () => {
      const html = renderToStaticMarkup(createElement(HeroCadran, { cadran }));
      expect(html.match(/<line /g)).toHaveLength(60);
      expect(html.match(/<a /g)).toHaveLength(1);
    });

    it("en mouvement réduit, arrive directement à l'heure de relecture", async () => {
      contexte = installerDom({ mouvementReduit: true });
      montage = await monter(createElement(HeroCadran, { cadran }));
      expect(montage.conteneur.textContent).toContain(formatHeure(cadran.arrivee));
      expect(montage.conteneur.querySelector(".hero-trotteuse")).not.toBeNull();
    });

    it("anime le recul puis l'arrête au démontage", async () => {
      contexte = installerDom();
      montage = await monter(createElement(HeroCadran, { cadran }));
      expect(montage.conteneur.querySelector(".hero-trotteuse")).toBeNull();
    });
  });
});
