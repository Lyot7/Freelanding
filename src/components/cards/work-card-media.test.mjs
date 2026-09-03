import { describe, expect, it } from "bun:test";

import { workItems } from "../../content/work";
import { getWorkCardMedia } from "./work-card-media";

describe("getWorkCardMedia", () => {
  it("sert le plateau 3D et son affiche quand le projet en a un", () => {
    // Kpsull porte une démonstration filmée, incrustée dans le plateau par
    // `scripts/mockup-projets.mjs` : c'est le composite que la carte joue, et
    // son affiche vient du composite elle aussi. Servir la couverture à plat
    // en affiche ferait sauter la carte au premier tour de lecture.
    const kpsull = workItems.find((work) => work.slug === "kpsull");

    expect(kpsull).toBeDefined();
    expect(getWorkCardMedia(kpsull)).toEqual({
      kind: "video",
      src: "/work/kpsull/mockup.mp4",
      poster: kpsull.cardMockup.poster,
    });
  });

  it("sert une image quand le plateau n'a pas de vidéo à jouer", () => {
    // Würth n'a pas de captation : c'est la première étape du formulaire qui
    // est incrustée, en image fixe. La carte reste une image, sans fabriquer
    // un média absent.
    const wurth = workItems.find((work) => work.slug === "wurth-creation-de-compte");

    expect(wurth).toBeDefined();
    expect(getWorkCardMedia(wurth)).toEqual({
      kind: "image",
      image: wurth.cardMockup.poster,
    });
  });

  it("retombe sur la démonstration brute pour un projet sans plateau", () => {
    // Le plateau est facultatif : un projet ajouté avant que son composite
    // soit fabriqué doit continuer à rendre sa vidéo et sa couverture, sans
    // cadre vide ni 404 sur un fichier qui n'existe pas encore.
    const kpsull = workItems.find((work) => work.slug === "kpsull");
    const { cardMockup, ...sansPlateau } = kpsull;

    expect(cardMockup).toBeDefined();
    expect(getWorkCardMedia(sansPlateau)).toEqual({
      kind: "video",
      src: "/work/kpsull/demo.mp4",
      poster: kpsull.cover,
    });
  });
});
