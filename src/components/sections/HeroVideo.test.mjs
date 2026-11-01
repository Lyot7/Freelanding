import { afterEach, describe, expect, it } from "bun:test";
import { act, createElement } from "react";

import { installerDom, monter, patienter } from "@/components/motion/__tests__/dom.mjs";
import { HeroVideo } from "./HeroVideo";

const props = { src: "/videos/boucle.mp4", poster: "/videos/affiche.webp" };

/** Le navigateur que jsdom n'a pas : toile, lecture vidéo, images qui se chargent. */
function completerDom(contexte, { imageEnPanne = false } = {}) {
  const { window: fenetre } = contexte.dom;
  const traces = { dessins: 0, lectures: 0, pauses: 0, lissage: [] };
  fenetre.HTMLCanvasElement.prototype.getContext = () => ({
    drawImage() {
      traces.dessins += 1;
      traces.lissage.push(this.imageSmoothingEnabled);
    },
  });
  fenetre.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,AA";
  fenetre.HTMLMediaElement.prototype.play = async () => {
    traces.lectures += 1;
  };
  fenetre.HTMLMediaElement.prototype.pause = () => {
    traces.pauses += 1;
  };
  fenetre.requestAnimationFrame = () => 1;
  fenetre.Image = class {
    naturalWidth = 100;
    naturalHeight = 100;
    width = 100;
    height = 100;
    set src(_valeur) {
      setTimeout(() => (imageEnPanne ? this.onerror?.() : this.onload?.()), 0);
    }
  };
  return traces;
}

/** Une vraie mise en page : jsdom donne zéro à toutes ces mesures. */
function poserTailles(contexte) {
  const { window: fenetre } = contexte.dom;
  const fixer = (cible, proprietes) => {
    for (const [nom, value] of Object.entries(proprietes)) {
      Object.defineProperty(cible, nom, { value, configurable: true });
    }
  };
  fixer(fenetre.HTMLElement.prototype, {
    clientWidth: 390,
    clientHeight: 710,
    getBoundingClientRect: () => ({ width: 390, height: 710 }),
  });
  fixer(fenetre.HTMLVideoElement.prototype, { videoWidth: 1080, videoHeight: 1920 });
  fixer(fenetre, { devicePixelRatio: 3 });
}

describe("HeroVideo", () => {
  let contexte;
  let montage;

  afterEach(async () => {
    await montage?.demonter();
    contexte?.restaurer();
    montage = undefined;
    contexte = undefined;
  });

  it("sur téléphone, peint la boucle dans une toile et l'arrête hors de l'écran", async () => {
    contexte = installerDom({ largeur: 390 });
    const traces = completerDom(contexte);
    montage = await monter(createElement(HeroVideo, props));
    await patienter(40);

    const video = montage.conteneur.querySelector("video");
    expect(video.className).toContain("h-px");
    expect(montage.conteneur.querySelectorAll("canvas")).toHaveLength(2);

    const toile = [...montage.conteneur.querySelectorAll("canvas")].at(-1);
    await contexte.entrer(toile);
    expect(traces.lectures).toBe(1);
    await contexte.entrer(toile, false);
    expect(traces.pauses).toBe(1);

    await act(async () => {
      video.dispatchEvent(new window.Event("playing"));
    });
    await patienter(5);
    expect(toile.className).toContain("opacity-100");
  });

  it("sur téléphone, garde le fond si l'affiche ne se charge pas", async () => {
    contexte = installerDom({ largeur: 390 });
    completerDom(contexte, { imageEnPanne: true });
    montage = await monter(createElement(HeroVideo, { ...props, poster: "/videos/absente.webp" }));
    await patienter(40);
    expect(montage.conteneur.querySelector("video")).not.toBeNull();
  });

  it("attend la fin du chargement de la page pour monter la vidéo", async () => {
    contexte = installerDom();
    completerDom(contexte);
    Object.defineProperty(document, "readyState", { value: "loading", configurable: true });
    montage = await monter(createElement(HeroVideo, props));
    expect(montage.conteneur.querySelector("video")).toBeNull();

    await act(async () => {
      window.dispatchEvent(new window.Event("load"));
    });
    expect(montage.conteneur.querySelector("video")).not.toBeNull();
  });

  it("sur grand écran, ne montre la boucle qu'une fois qu'elle joue", async () => {
    contexte = installerDom();
    completerDom(contexte);
    montage = await monter(createElement(HeroVideo, props));
    await patienter(20);
    const video = montage.conteneur.querySelector("video");
    expect(video.className).toContain("opacity-0");

    await act(async () => {
      video.dispatchEvent(new window.Event("playing"));
    });
    expect(video.className).toContain("opacity-100");
  });

  it("sur téléphone, sans affiche, garde la vidéo seule et aucune toile", async () => {
    contexte = installerDom({ largeur: 390 });
    completerDom(contexte);
    montage = await monter(createElement(HeroVideo, { src: props.src }));
    await patienter(20);
    expect(montage.conteneur.querySelector("video")).not.toBeNull();
    expect(montage.conteneur.querySelectorAll("canvas")).toHaveLength(0);
  });

  it("peint la toile à la cadence de la vidéo quand le navigateur la donne", async () => {
    contexte = installerDom({ largeur: 390 });
    const traces = completerDom(contexte);
    poserTailles(contexte);
    const images = [];
    contexte.dom.window.HTMLVideoElement.prototype.requestVideoFrameCallback = (rappel) => {
      images.push(rappel);
    };
    montage = await monter(createElement(HeroVideo, { ...props, poster: "/videos/cadence.webp" }));
    await patienter(40);

    const toile = [...montage.conteneur.querySelectorAll("canvas")].at(-1);
    // Densité de l'écran plafonnée à 2 : au-delà, le décodage coûte sans se voir.
    expect(toile.width).toBe(780);
    expect(toile.height).toBe(1420);
    const dessins = traces.dessins;
    expect(images.length).toBeGreaterThan(0);

    const largeur = Object.getOwnPropertyDescriptor(contexte.dom.window.HTMLCanvasElement.prototype, "width");
    let retailles = 0;
    Object.defineProperty(toile, "width", {
      get: () => largeur.get.call(toile),
      set: (valeur) => {
        retailles += 1;
        largeur.set.call(toile, valeur);
      },
    });
    images.at(-1)();
    expect(traces.dessins).toBe(dessins + 1);
    expect(retailles).toBe(0);
  });

  it("retombe sur l'animation du navigateur, et s'arrête au démontage", async () => {
    contexte = installerDom({ largeur: 390 });
    const traces = completerDom(contexte);
    poserTailles(contexte);
    const images = [];
    contexte.dom.window.requestAnimationFrame = (rappel) => images.push(rappel);
    montage = await monter(createElement(HeroVideo, { ...props, poster: "/videos/animation.webp" }));
    await patienter(40);
    expect(images.length).toBeGreaterThan(0);

    await montage.demonter();
    montage = undefined;
    const apres = traces.dessins;
    images.at(-1)();
    expect(traces.dessins).toBe(apres);
  });

  it("une lecture refusée par le navigateur ne lève aucune erreur", async () => {
    contexte = installerDom({ largeur: 390 });
    completerDom(contexte);
    let tentatives = 0;
    contexte.dom.window.HTMLMediaElement.prototype.play = async () => {
      tentatives += 1;
      throw new Error("lecture automatique refusée");
    };
    montage = await monter(createElement(HeroVideo, props));
    await patienter(40);
    const toile = [...montage.conteneur.querySelectorAll("canvas")].at(-1);
    await contexte.entrer(toile);
    await patienter(5);
    expect(tentatives).toBe(1);
  });

  it("dépixelise l'affiche sans lissage, puis la peint lissée et laisse place à la boucle", async () => {
    contexte = installerDom({ largeur: 390 });
    const traces = completerDom(contexte);
    poserTailles(contexte);
    montage = await monter(createElement(HeroVideo, { ...props, poster: "/videos/pixels.webp" }));
    await patienter(40);
    const [calque, toile] = montage.conteneur.querySelectorAll("canvas");
    const video = montage.conteneur.querySelector("video");
    await contexte.entrer(calque);
    await act(async () => {
      video.dispatchEvent(new window.Event("playing"));
    });
    await patienter(40);
    expect(traces.lissage).toContain(false);
    expect(toile.className).toContain("opacity-0");

    // Par tranches : sous `act`, un état ne s'applique qu'à la sortie de l'attente.
    for (let tranche = 0; tranche < 9; tranche += 1) await patienter(100);
    expect(traces.lissage.filter((lissage) => lissage !== undefined).at(-1)).toBe(true);
    expect(toile.className).toContain("opacity-100");
  });

  it("ignore une image arrivée après le démontage", async () => {
    contexte = installerDom({ largeur: 390 });
    const traces = completerDom(contexte);
    poserTailles(contexte);
    const arrivees = [];
    contexte.dom.window.Image = class {
      naturalWidth = 100;
      naturalHeight = 100;
      set src(_valeur) {
        arrivees.push(this);
      }
    };
    montage = await monter(createElement(HeroVideo, { ...props, poster: "/videos/tardive.webp" }));
    await patienter(40);
    await act(async () => {
      arrivees[0].onload();
    });
    await patienter(5);
    expect(arrivees).toHaveLength(2);

    await montage.demonter();
    montage = undefined;
    const apres = traces.dessins;
    arrivees[1].onload();
    expect(traces.dessins).toBe(apres);
  });

  it("profil léger : ni vidéo ni effet, sur aucun écran", async () => {
    contexte = installerDom();
    completerDom(contexte);
    document.documentElement.dataset.profil = "leger";
    montage = await monter(createElement(HeroVideo, props));
    await patienter(20);
    expect(montage.conteneur.querySelector("video")).toBeNull();
  });
});
