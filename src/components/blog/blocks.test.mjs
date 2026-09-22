import { describe, expect, it } from "bun:test";

import { Callout, Video } from "./blocks";

/**
 * Ces deux blocs sont composés directement (sans rendu DOM) : ce sont de
 * simples fonctions qui renvoient un arbre d'éléments React, ce que Bun peut
 * inspecter sans navigateur ni `@testing-library/react`.
 */
describe("Video", () => {
  it("porte un aria-label quand une légende existe, pour la rattacher à la vidéo", () => {
    const element = Video({ src: "/x.mp4", poster: "/x.jpg", caption: "Une capture d'écran" });
    const video = element.props.children[0];
    expect(video.props["aria-label"]).toBe("Une capture d'écran");
  });

  it("n'a pas d'aria-label sans légende", () => {
    const element = Video({ src: "/x.mp4", poster: "/x.jpg" });
    const video = element.props.children[0];
    expect(video.props["aria-label"]).toBeUndefined();
  });
});

describe("Callout", () => {
  it("rend un <div>, pas un <aside> (repère ARIA porté par le sommaire, pas ce bloc)", () => {
    const element = Callout({ title: "Attention", children: "corps" });
    expect(element.type).toBe("div");
  });
});
