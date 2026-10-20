import { describe, it, expect } from "vitest";
import { criticalExpression, parseDice, rollD20, rollExpression } from "./dice";

// Returns values that roll the given die faces in order (for a d20 etc.).
function fixed(sides: number, ...faces: number[]) {
  let i = 0;
  return () => (faces[i++ % faces.length] - 1) / sides;
}

describe("parseDice", () => {
  it.each([
    ["d20", [{ count: 1, sides: 20, sign: 1 }], 0],
    ["2d6+3", [{ count: 2, sides: 6, sign: 1 }], 3],
    ["1d8 + 1d6 - 1", [{ count: 1, sides: 8, sign: 1 }, { count: 1, sides: 6, sign: 1 }], -1],
    ["5", [], 5],
    ["2D4", [{ count: 2, sides: 4, sign: 1 }], 0],
  ])("parses %s", (text, terms, modifier) => {
    expect(parseDice(text)).toEqual({ terms, modifier });
  });

  it.each(["", "abc", "2d", "d1", "1000d6", "2d6++3", "1.5d6", "d20x"])(
    "rejects %s",
    (text) => {
      expect(parseDice(text)).toBeNull();
    }
  );
});

describe("rollExpression", () => {
  it("adds dice and modifier", () => {
    const result = rollExpression("2d6+3", "Damage", fixed(6, 4, 5));
    expect(result?.total).toBe(12);
    expect(result?.rolls.map((r) => r.value)).toEqual([4, 5]);
  });
  it("subtracts negative dice", () => {
    // max roll on every die: 8 - 4
    expect(rollExpression("1d8-1d4", "x", () => 0.999)?.total).toBe(4);
  });
  it("returns null for invalid notation", () => {
    expect(rollExpression("banana")).toBeNull();
  });
  it("always rolls within range with real randomness", () => {
    for (let i = 0; i < 200; i++) {
      const total = rollExpression("1d6")!.total;
      expect(total).toBeGreaterThanOrEqual(1);
      expect(total).toBeLessThanOrEqual(6);
    }
  });
});

describe("rollD20", () => {
  it("adds the modifier", () => {
    const r = rollD20(5, "Stealth", "normal", fixed(20, 12));
    expect(r.total).toBe(17);
    expect(r.expression).toBe("1d20+5");
  });
  it("keeps the higher die with advantage", () => {
    const r = rollD20(0, "x", "advantage", fixed(20, 3, 18));
    expect(r.d20).toEqual({ kept: 18, dropped: 3, mode: "advantage" });
  });
  it("keeps the lower die with disadvantage", () => {
    const r = rollD20(-1, "x", "disadvantage", fixed(20, 3, 18));
    expect(r.total).toBe(2);
    expect(r.expression).toBe("1d20-1");
  });
});

describe("criticalExpression", () => {
  it.each([
    ["1d8+3", "2d8+3"],
    ["2d6", "4d6"],
    ["1d8+1d6-1", "2d8+2d6-1"],
  ])("%s crits as %s", (input, expected) => {
    expect(criticalExpression(input)).toBe(expected);
  });
});
