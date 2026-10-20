import { describe, it, expect } from "vitest";
import { SRD_CLASSES, SRD_FEATS, findSrdClass, findSrdFeat } from "./srd";
import { ABILITIES, HIT_DIE_SIDES } from "./types";

describe("bundled SRD data", () => {
  it("has the 12 SRD base classes and no subclasses", () => {
    expect(SRD_CLASSES.map((c) => c.name)).toEqual([
      "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
      "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard",
    ]);
  });

  it("gives every class a valid hit die and two saving throws", () => {
    for (const c of SRD_CLASSES) {
      expect(HIT_DIE_SIDES).toContain(c.hitDie);
      expect(c.savingThrows).toHaveLength(2);
      for (const a of c.savingThrows) expect(ABILITIES).toContain(a);
    }
  });

  it("matches the SRD for a known class", () => {
    expect(findSrdClass("Barbarian")).toMatchObject({ hitDie: 12, savingThrows: ["con", "str"] });
  });

  it("finds classes by name, ignoring case and spaces", () => {
    expect(findSrdClass("  wIzArD ")?.hitDie).toBe(6);
    expect(findSrdClass("Blood Hunter")).toBeUndefined();
  });

  it("includes Grappler, the SRD 5.1 feat", () => {
    const grappler = findSrdFeat("srd_grappler");
    expect(grappler?.prerequisite).toBe("Strength 13 or higher");
    expect(grappler?.benefits.length).toBeGreaterThan(0);
    expect(SRD_FEATS.every((f) => f.name && f.key)).toBe(true);
    expect(findSrdFeat(null)).toBeUndefined();
  });
});
