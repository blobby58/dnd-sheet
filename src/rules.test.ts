import { describe, it, expect } from "vitest";
import { abilityModifier, proficiencyBonus, formatModifier } from "./rules";

describe("abilityModifier", () => {
  it.each([
    // [score, expected modifier]
    [1, -5],
    [2, -4],
    [3, -4],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [12, 1],
    [13, 1],
    [14, 2],
    [15, 2],
    [18, 4],
    [20, 5],
    [29, 9],
    [30, 10],
  ])("score %i gives modifier %i", (score, expected) => {
    expect(abilityModifier(score)).toBe(expected);
  });

  it.each([0, -1, 31, 100])("throws RangeError for out-of-range score %d", (score) => {
    expect(() => abilityModifier(score)).toThrow(RangeError);
  });

  it.each([10.5, 0.5, NaN, Infinity])("throws RangeError for non-integer score %d", (score) => {
    expect(() => abilityModifier(score)).toThrow(RangeError);
  });
});

describe("proficiencyBonus", () => {
  it.each([
    // [level, expected bonus] - every level, so every boundary is covered
    [1, 2], [2, 2], [3, 2], [4, 2],
    [5, 3], [6, 3], [7, 3], [8, 3],
    [9, 4], [10, 4], [11, 4], [12, 4],
    [13, 5], [14, 5], [15, 5], [16, 5],
    [17, 6], [18, 6], [19, 6], [20, 6],
  ])("level %i gives bonus +%i", (level, expected) => {
    expect(proficiencyBonus(level)).toBe(expected);
  });

  it.each([0, -1, 21, 99])("throws RangeError for out-of-range level %d", (level) => {
    expect(() => proficiencyBonus(level)).toThrow(RangeError);
  });

  it.each([2.5, NaN, Infinity])("throws RangeError for non-integer level %d", (level) => {
    expect(() => proficiencyBonus(level)).toThrow(RangeError);
  });
});

describe("formatModifier", () => {
  it.each([
    [3, "+3"],
    [1, "+1"],
    [10, "+10"],
    [0, "+0"],
    [-1, "-1"],
    [-5, "-5"],
    [-10, "-10"],
  ])("formats %i as %s", (mod, expected) => {
    expect(formatModifier(mod)).toBe(expected);
  });

  it("returns a string, not a number", () => {
    expect(typeof formatModifier(2)).toBe("string");
  });
});