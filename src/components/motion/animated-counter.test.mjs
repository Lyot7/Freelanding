import { describe, expect, test } from "bun:test";
import {
  formatCounterValue,
  nextCounterValue,
  parseCounterValue,
} from "./animated-counter";

describe("AnimatedCounter value logic", () => {
  test.each([
    ["60+", { end: 60, suffix: "+", precision: 0, increment: 1 }],
    ["1.4s", { end: 1.4, suffix: "s", precision: 1, increment: 0.1 }],
    ["80%", { end: 80, suffix: "%", precision: 0, increment: 1 }],
    ["12", { end: 12, suffix: "", precision: 0, increment: 1 }],
  ])("parses %s into a Framer counter definition", (value, expected) => {
    expect(parseCounterValue(value)).toEqual(expected);
  });

  test("uses an explicit suffix without duplicating it", () => {
    expect(parseCounterValue("60+", "+")).toEqual({
      end: 60,
      suffix: "+",
      precision: 0,
      increment: 1,
    });
  });

  test("increments decimals without floating-point drift and clamps at the end", () => {
    expect(nextCounterValue(1.2, 1.4, 0.1, 1)).toBe(1.3);
    expect(nextCounterValue(1.3, 1.4, 0.1, 1)).toBe(1.4);
    expect(nextCounterValue(1.4, 1.4, 0.1, 1)).toBe(1.4);
  });

  test("formats integers and decimals like the source Counter", () => {
    expect(formatCounterValue(60, 0)).toBe("60");
    expect(formatCounterValue(1.4, 1)).toBe("1.4");
  });
});
