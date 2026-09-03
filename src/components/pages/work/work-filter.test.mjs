import { describe, expect, it } from "bun:test";

import { ALL_WORKS, filterWorks } from "./work-filter";

const works = [
  {
    slug: "box-mode",
    title: "Box mode",
    categories: ["Branding", "Development"],
    cover: { src: "/box.jpg", alt: "Box mode" },
  },
  {
    slug: "nomad-stays",
    title: "Nomad Stays",
    categories: ["Web design", "Development"],
    cover: { src: "/nomad.jpg", alt: "Nomad Stays" },
  },
  {
    slug: "johny-nashville",
    title: "Johny Nashville",
    categories: ["SEO", "Branding"],
    cover: { src: "/johny.jpg", alt: "Johny Nashville" },
  },
];

describe("filterWorks", () => {
  it("keeps the original ordering when no filter is active", () => {
    expect(filterWorks(works, ALL_WORKS, "")).toEqual(works);
  });

  it("matches categories without depending on case", () => {
    expect(filterWorks(works, "WEB DESIGN", "")).toEqual([works[1]]);
  });

  // Le filtre « tout afficher » ne doit JAMAIS dépendre de son libellé : le
  // premier onglet est traduisible (« All » → « Tous ») sans casser la page.
  it("never treats a display label as the show-all filter", () => {
    expect(filterWorks(works, "All", "")).toEqual([]);
    expect(filterWorks(works, "Tous", "")).toEqual([]);
  });

  it("searches titles and categories with normalized whitespace", () => {
    expect(filterWorks(works, ALL_WORKS, "  nomad   ")).toEqual([works[1]]);
    expect(filterWorks(works, ALL_WORKS, "develop")).toEqual([
      works[0],
      works[1],
    ]);
  });

  it("combines category and text filtering", () => {
    expect(filterWorks(works, "Branding", "johny")).toEqual([works[2]]);
    expect(filterWorks(works, "SEO", "box")).toEqual([]);
  });
});
