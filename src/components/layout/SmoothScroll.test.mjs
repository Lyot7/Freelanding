import { describe, expect, test } from "bun:test";
import { LENIS_OPTIONS } from "./SmoothScroll";

describe("SmoothScroll", () => {
  test("keeps the source Lenis configuration exact", () => {
    expect(LENIS_OPTIONS).toEqual({
      smoothWheel: true,
      duration: 0.8,
      infinite: false,
      orientation: "vertical",
      gestureOrientation: "vertical",
      autoRaf: true,
      autoToggle: true,
      anchors: false,
      allowNestedScroll: false,
      syncTouch: false,
      stopInertiaOnNavigate: false,
    });
  });
});
