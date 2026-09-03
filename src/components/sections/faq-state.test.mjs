import { describe, expect, test } from "bun:test";
import { toggleFaqItem } from "./faq-state.ts";

describe("FAQ open state", () => {
  test("keeps previously opened answers when another one opens", () => {
    expect([...toggleFaqItem(new Set([0]), 1)]).toEqual([0, 1]);
  });

  test("closes only the selected answer", () => {
    expect([...toggleFaqItem(new Set([0, 1]), 0)]).toEqual([1]);
  });
});
