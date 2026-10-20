import { describe, it, expect } from "vitest";
import { toSrdClass, transformClasses, transformFeats } from "./srd-transform.ts";

const srd = { key: "srd-2014" };

const barbarian = {
  key: "srd_barbarian",
  name: "Barbarian",
  hit_dice: "D12",
  saving_throws: [{ name: "Constitution" }, { name: "Strength" }],
  subclass_of: null,
  document: srd,
  features: [{ name: "Rage", desc: "lots of text we don't keep" }],
};

describe("transformClasses", () => {
  it("keeps only the fields the sheet needs", () => {
    expect(transformClasses([barbarian])).toEqual([
      { key: "srd_barbarian", name: "Barbarian", hitDie: 12, savingThrows: ["con", "str"] },
    ]);
  });

  it("drops subclasses and anything outside SRD 5.1", () => {
    const champion = { ...barbarian, key: "srd_champion", subclass_of: { key: "srd_fighter" } };
    const thirdParty = { ...barbarian, key: "tob_x", document: { key: "tob" } };
    const noDocument = { ...barbarian, document: undefined };
    expect(transformClasses([champion, thirdParty, noDocument, "junk"])).toEqual([]);
  });

  it("sorts by name", () => {
    const bard = { ...barbarian, key: "srd_bard", name: "Bard", hit_dice: "D8" };
    expect(transformClasses([bard, barbarian]).map((c) => c.name)).toEqual(["Barbarian", "Bard"]);
  });

  it("refuses data it can't map", () => {
    expect(() => toSrdClass({ ...barbarian, hit_dice: "D7" })).toThrow(/hit die/);
    expect(() => toSrdClass({ ...barbarian, saving_throws: [{ name: "Luck" }] })).toThrow(/Luck/);
  });
});

describe("transformFeats", () => {
  const grappler = {
    key: "srd_grappler",
    name: "Grappler",
    desc: " You gain the following benefits: ",
    prerequisite: "Strength 13 or higher",
    benefits: [{ desc: "Advantage on attacks." }, { desc: "" }],
    document: srd,
  };

  it("keeps description, prerequisite and non-empty benefits", () => {
    expect(transformFeats([grappler])).toEqual([
      {
        key: "srd_grappler",
        name: "Grappler",
        prerequisite: "Strength 13 or higher",
        desc: "You gain the following benefits:",
        benefits: ["Advantage on attacks."],
      },
    ]);
  });

  it("treats an empty prerequisite as none and drops non-SRD feats", () => {
    const open = { ...grappler, prerequisite: "" };
    const other = { ...grappler, document: { key: "a5e" } };
    expect(transformFeats([open, other])).toEqual([expect.objectContaining({ prerequisite: null })]);
  });
});
