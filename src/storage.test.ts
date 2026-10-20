import { describe, it, expect } from "vitest";
import {
  LEGACY_KEY,
  STORAGE_KEY,
  exportCharacter,
  importCharacter,
  loadState,
  normalizeCharacter,
  normalizeState,
  saveState,
  type KeyValueStore,
} from "./storage";
import { createCharacter } from "./types";

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("normalizeCharacter", () => {
  it("turns garbage into a valid default character", () => {
    for (const junk of [undefined, null, 42, "hi", [], {}]) {
      const c = normalizeCharacter(junk);
      expect(c.level).toBe(1);
      expect(c.abilityScores.str).toBe(10);
      expect(c.spellSlots).toHaveLength(9);
    }
  });

  it("upgrades a Milestone 1 save without losing anything", () => {
    const old = {
      name: "Thorin",
      className: "Barbarian",
      level: 4,
      abilityScores: { str: 18, dex: 12, con: 16, int: 8, wis: 10, cha: 9 },
      maxHp: 45,
      currentHp: 30,
    };
    const c = normalizeCharacter(old);
    expect(c.name).toBe("Thorin");
    expect(c.level).toBe(4);
    expect(c.abilityScores.str).toBe(18);
    expect(c.currentHp).toBe(30);
    expect(c.skillTraining).toEqual({});
    expect(c.attacks).toEqual([]);
  });

  it("converts the old skill list into training", () => {
    const c = normalizeCharacter({ skillProficiencies: ["stealth", "nonsense", "stealth"] });
    expect(c.skillTraining).toEqual({ stealth: "proficient" });
  });

  it("clamps numbers into range", () => {
    const c = normalizeCharacter({
      level: 99,
      abilityScores: { str: 0, dex: 50, con: "12", int: null },
      maxHp: 20,
      currentHp: 999,
      hitDiceUsed: 50,
      deathSaves: { successes: 9, failures: -2 },
    });
    expect(c.level).toBe(20);
    expect(c.abilityScores).toMatchObject({ str: 1, dex: 30, con: 12, int: 10 });
    expect(c.currentHp).toBe(20);
    expect(c.hitDiceUsed).toBe(20);
    expect(c.deathSaves).toEqual({ successes: 3, failures: 0 });
  });

  it("drops invalid list entries", () => {
    const c = normalizeCharacter({
      savingThrowProficiencies: ["str", "luck", "str"],
      conditions: ["prone", "sleepy"],
      attacks: [{ name: "Axe", damageDice: "1d12" }, "not an attack"],
    });
    expect(c.savingThrowProficiencies).toEqual(["str"]);
    expect(c.conditions).toEqual(["prone"]);
    expect(c.attacks).toHaveLength(1);
    expect(c.attacks[0].name).toBe("Axe");
  });
});

describe("feats", () => {
  it("loads a save from before feats existed, keeping a homebrew class", () => {
    const c = normalizeCharacter({ name: "Vex", className: "Blood Hunter", level: 3 });
    expect(c.className).toBe("Blood Hunter");
    expect(c.feats).toEqual([]);
  });

  it("keeps SRD and custom feats and drops junk", () => {
    const c = normalizeCharacter({
      feats: [
        { id: "a", name: "Grappler", srdKey: "srd_grappler", notes: "" },
        { name: "Lucky", srdKey: null, notes: "Reroll 3 times a day" },
        { name: "Odd", srdKey: 42 },
        "not a feat",
        null,
      ],
    });
    expect(c.feats).toHaveLength(3);
    expect(c.feats[0]).toEqual({ id: "a", name: "Grappler", srdKey: "srd_grappler", notes: "" });
    expect(c.feats[1]).toMatchObject({ name: "Lucky", srdKey: null, notes: "Reroll 3 times a day" });
    expect(c.feats[1].id).not.toBe("");
    expect(c.feats[2]).toMatchObject({ name: "Odd", srdKey: null, notes: "" });
  });
});

describe("normalizeState", () => {
  it("always has at least one character", () => {
    expect(normalizeState({ characters: [] }).characters).toHaveLength(1);
  });
  it("fixes duplicate ids and a missing active id", () => {
    const state = normalizeState({
      characters: [{ id: "x" }, { id: "x" }],
      activeId: "gone",
    });
    expect(new Set(state.characters.map((c) => c.id)).size).toBe(2);
    expect(state.activeId).toBe(state.characters[0].id);
  });
});

describe("loadState / saveState", () => {
  it("round-trips", () => {
    const store = memoryStore();
    const character = createCharacter({ name: "Mira" });
    saveState(store, { characters: [character], activeId: character.id });
    const loaded = loadState(store);
    expect(loaded.characters[0].name).toBe("Mira");
    expect(loaded.activeId).toBe(character.id);
  });

  it("migrates the old single-character key", () => {
    const store = memoryStore({ [LEGACY_KEY]: JSON.stringify({ name: "Old Timer" }) });
    expect(loadState(store).characters[0].name).toBe("Old Timer");
  });

  it("prefers the new key over the old one", () => {
    const store = memoryStore({
      [LEGACY_KEY]: JSON.stringify({ name: "Old" }),
      [STORAGE_KEY]: JSON.stringify({ characters: [{ name: "New" }] }),
    });
    expect(loadState(store).characters[0].name).toBe("New");
  });

  it("survives corrupt JSON", () => {
    const store = memoryStore({ [STORAGE_KEY]: "{not json" });
    expect(loadState(store).characters).toHaveLength(1);
  });
});

describe("import / export", () => {
  it("round-trips with a fresh id", () => {
    const original = createCharacter({ name: "Vex", level: 7 });
    const imported = importCharacter(exportCharacter(original));
    expect(imported?.name).toBe("Vex");
    expect(imported?.level).toBe(7);
    expect(imported?.id).not.toBe(original.id);
  });
  it("accepts a bare character object", () => {
    expect(importCharacter(JSON.stringify({ name: "Bare" }))?.name).toBe("Bare");
  });
  it.each(["not json", "[]", "{}", '{"format":"dnd-sheet-character"}'])(
    "rejects %s",
    (text) => {
      expect(importCharacter(text)).toBeNull();
    }
  );
});
