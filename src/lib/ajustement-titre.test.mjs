import { describe, expect, test } from "bun:test";
import {
  facteurDeChasse,
  tailleAjustee,
  largeurRendue,
  jeuEntreLignes,
} from "./ajustement-titre.ts";
import { homeContent } from "../content/home.ts";

/**
 * Le titre de l'accueil ne peut plus déborder de son cadre.
 *
 * POURQUOI CE TEST EXISTE. Le défaut qu'il garde a été servi en production
 * pendant des semaines et RIEN ne le signalait : le DOM contenait bien le
 * titre, les types étaient verts, l'audit des accents regardait les bords
 * horizontaux du mauvais côté. Seule une mesure au navigateur, à la bonne
 * largeur de fenêtre, le voyait — « logiciels. » occupait 327,9 px des 341
 * disponibles au point d'arrêt tablette, et le mot suivant, plus long d'un
 * caractère, se serait replié dans un masque haut d'une seule ligne, donc
 * invisible.
 *
 * Le calcul de taille vit maintenant dans le CSS, ce qui le rend correct par
 * construction — mais seulement tant que les valeurs qui l'alimentent restent
 * justes. Ce test rejoue le calcul du navigateur sur les trois largeurs de
 * cadre RELEVÉES sur le rendu et échoue à la première ligne qui dépasse.
 *
 * LARGEURS DE CADRE, mesurées le 2026-09-01 sur `/` (`clientWidth` du
 * conteneur `.accent-clip-titre`, celui qui porte le `max-w-[570px]`) :
 *   390 px de fenêtre → 350 px de cadre
 *   810 px            → 341 px   ← le plus étroit des trois, et de loin
 *   1440 et 1920 px   → 570 px
 * Le point d'arrêt tablette est plus étroit que le mobile : c'est là que le
 * cadre passe en demi-colonne alors que le corps du texte, lui, grandit.
 */
const CADRES = [
  { fenetre: 390, cadre: 350, plafond: 52 },
  { fenetre: 810, cadre: 341, plafond: 68 },
  { fenetre: 1440, cadre: 570, plafond: 92 },
  { fenetre: 1920, cadre: 570, plafond: 92 },
];

const lignesDuTitre = homeContent.about.titleLines ?? [
  homeContent.about.title,
];

describe("facteurDeChasse", () => {
  /**
   * Étalonnage contre le RENDU RÉEL, pas contre lui-même. « SITES, » mesuré au
   * navigateur : 246,9 px à 92 px de corps. Le modèle majore, crénage non
   * compté, donc il doit tomber juste au-dessus et jamais en dessous.
   */
  test("majore la largeur réelle mesurée au navigateur", () => {
    const predit = largeurRendue("Sites,", 92);
    expect(predit).toBeGreaterThanOrEqual(246.9);
    expect(predit).toBeLessThan(246.9 * 1.04);
  });

  test("majore aussi une ligne entière avec espaces et accents", () => {
    // « SANS ÉQUIPE TECHNIQUE, » mesurée au canvas, crénage compris : 12,715 em.
    // Interlettrage : 22 caractères × 0,05 em.
    const reel = (12.715 - 22 * 0.05) * 100;
    const predit = largeurRendue("sans équipe technique,", 100);
    expect(predit).toBeGreaterThanOrEqual(reel);
    expect(predit).toBeLessThan(reel * 1.04);
  });

  test("un glyphe inconnu élargit le facteur au lieu de le rétrécir", () => {
    // Un caractère hors table doit coûter au moins autant que le plus large
    // connu : sinon la ligne serait rendue trop grande et déborderait.
    expect(facteurDeChasse("字")).toBeGreaterThanOrEqual(
      facteurDeChasse("W"),
    );
  });

  test("une ligne vide ne produit pas une division par zéro", () => {
    expect(facteurDeChasse("")).toBeGreaterThan(0);
  });
});

describe("titre de l'accueil", () => {
  test("le découpage recompose le titre mot pour mot", () => {
    expect(lignesDuTitre.join(" ")).toBe(homeContent.about.title);
  });

  for (const { fenetre, cadre, plafond } of CADRES) {
    test(`aucune ligne ne déborde du cadre à ${fenetre} px`, () => {
      for (const ligne of lignesDuTitre) {
        const taille = tailleAjustee(ligne, cadre, plafond);
        expect(largeurRendue(ligne, taille)).toBeLessThanOrEqual(cadre + 0.01);
      }
    });

    test(`aucune ligne ne tombe sous 24 px de corps à ${fenetre} px`, () => {
      // PLANCHER DE LISIBILITÉ. Rien dans le CSS n'empêche une ligne trop longue
      // de rétrécir jusqu'à l'illisible : l'ajustement à la largeur ne peut pas
      // déborder, il peut miniaturiser. C'est le seul défaut que la voie CSS
      // laisse ouvert, et il se garde ici plutôt qu'avec un `max()` dans le
      // `font-size`, qui rétablirait le débordement.
      for (const ligne of lignesDuTitre) {
        expect(tailleAjustee(ligne, cadre, plafond)).toBeGreaterThanOrEqual(24);
      }
    });
  }

  test("aucune ligne ne tombe dans l'encre de la suivante", () => {
    // LE DÉFAUT QUE L'AJUSTEMENT A CRÉÉ, et que ce test garde. Lignes raguées,
    // la virgule d'une ligne tombait dans le vide laissé par la ligne du
    // dessous. Lignes remplies, il n'y a plus de vide : au premier rendu, à
    // `leading-[0.82em]`, la virgule de « SITES, » descendait 5,1 px dans les
    // capitales de « LOGICIELS », qui se lisait « LOGICIEĽS ».
    for (const { fenetre, cadre, plafond } of CADRES) {
      const tailles = lignesDuTitre.map((l) => tailleAjustee(l, cadre, plafond));
      for (let i = 0; i < lignesDuTitre.length - 1; i += 1) {
        const jeu = jeuEntreLignes(
          lignesDuTitre[i],
          tailles[i],
          lignesDuTitre[i + 1],
          tailles[i + 1],
        );
        // Le message porte la fenêtre et la paire : sans lui, un échec ne dit
        // pas laquelle des cinq jonctions a cédé, ni à quelle largeur.
        expect(jeu, `${fenetre} px, lignes ${i + 1}/${i + 2}`).toBeGreaterThan(0);
      }
    }
  });

  test("l'interligne du template anglais ne suffisait pas", () => {
    // Contrôle du contrôle : à 0,82em, la valeur d'origine, le test ci-dessus
    // doit échouer. Sans cette assertion, un `jeuEntreLignes` toujours positif
    // passerait pour un garde-fou.
    const tailles = lignesDuTitre.map((l) => tailleAjustee(l, 570, 92));
    const jeux = lignesDuTitre
      .slice(0, -1)
      .map((l, i) =>
        jeuEntreLignes(l, tailles[i], lignesDuTitre[i + 1], tailles[i + 1], 0.82),
      );
    expect(Math.min(...jeux)).toBeLessThan(0);
  });

  test("le titre reste le plus gros caractère de sa section", () => {
    // Le compteur voisin est rendu à 44 / 52 / 78 px. Si la plus grande ligne du
    // h1 passait sous cette valeur, la hiérarchie de la section s'inverserait.
    const compteurs = { 350: 44, 341: 52, 570: 78 };
    for (const { cadre, plafond } of CADRES) {
      const plusGrande = Math.max(
        ...lignesDuTitre.map((l) => tailleAjustee(l, cadre, plafond)),
      );
      expect(plusGrande).toBeGreaterThanOrEqual(compteurs[cadre] * 0.85);
    }
  });
});
