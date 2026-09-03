import { describe, expect, it } from "bun:test";

import {
  createWorkDetailContent,
  resolveNextWork,
} from "./work-detail-content";

const works = [
  {
    slug: "one",
    title: "One",
    categories: ["Branding"],
    cover: { src: "/one.jpg", alt: "One" },
  },
  {
    slug: "two",
    title: "Two",
    categories: ["Development"],
    cover: { src: "/two.jpg", alt: "Two" },
  },
  {
    slug: "three",
    title: "Three",
    categories: ["SEO"],
    cover: { src: "/three.jpg", alt: "Three" },
  },
];

describe("resolveNextWork", () => {
  it("honors an explicit next project", () => {
    expect(resolveNextWork({ ...works[0], nextProject: "three" }, works)).toBe(
      works[2],
    );
  });

  it("falls back to the following project and loops at the end", () => {
    expect(resolveNextWork(works[0], works)).toBe(works[1]);
    expect(resolveNextWork(works[2], works)).toBe(works[0]);
  });
});

describe("createWorkDetailContent", () => {
  it("maps repository detail fields", () => {
    const detail = createWorkDetailContent({
      ...works[0],
      overview: "Overview",
      problem: ["Problem", "Context"],
      outcome: ["Outcome"],
      approach: ["Approach", "Evidence"],
      body: ["Problem", "Context", "Outcome", "Approach", "Evidence"],
      results: [{ value: "+20%", label: "Conversion" }],
      testimonial: {
        quote: "Quote",
        author: { name: "Person" },
      },
      gallery: [
        { src: "/gallery-one.jpg", alt: "Gallery one" },
        { src: "/gallery-two.jpg", alt: "Gallery two" },
        { src: "/gallery-three.jpg", alt: "Gallery three" },
        { src: "/gallery-four.jpg", alt: "Gallery four" },
      ],
      projectVideoUrl: "https://www.youtube.com/watch?v=example",
      liveUrl: "https://example.com",
      nextProject: "two",
    });

    expect(detail.problemTitle).toBe("Problem");
    expect(detail.approachBody).toBe("Evidence");
    expect(detail.metrics).toEqual([{ value: "+20%", label: "Conversion" }]);
    expect(detail.gallery).toEqual([
      { src: "/gallery-one.jpg", alt: "Gallery one" },
      { src: "/gallery-two.jpg", alt: "Gallery two" },
      { src: "/gallery-three.jpg", alt: "Gallery three" },
      { src: "/gallery-four.jpg", alt: "Gallery four" },
    ]);
    expect(detail.projectVideoUrl).toBe(
      "https://www.youtube.com/watch?v=example",
    );
  });
});
