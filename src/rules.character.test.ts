import { describe, it, expect } from "vitest";
import { createCharacter, type Attack, type Character, type SrdClass } from "./types";
import {
  applyClassDefaults,
  applyDamage,
  applyHealing,
  attackBonus,
  carryingCapacity,
  clampInt,
  classDefaultChanges,
  damageFormula,
  experienceForNextLevel,
  hitDiceRemaining,
  initiative,
  levelForExperience,
  longRest,
  nextTraining,
  passivePerception,
  savingThrowBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
  spendHitDie,
  totalWeight,
  wealthInGold,
} from "./rules";

// Level 5 (proficiency +3): Str 16 (+3), Dex 14 (+2), Con 12 (+1),
// Int 8 (-1), Wis 13 (+1), Cha 10 (+0).
function hero(overrides: Partial<Character> = {}): Character {
  return createCharacter({
    level: 5,
    abilityScores: { str: 16, dex: 14, con: 12, int: 8, wis: 13, cha: 10 },
    maxHp: 40,
    currentHp: 40,
    ...overrides,
  });
}

const longsword: Attack = {
  id: "a",
  name: "Longsword",
  ability: "str",
  proficient: true,
  magicBonus: 0,
  damageDice: "1d8",
  damageType: "slashing",
  notes: "",
};

describe("clampInt", () => {
  it.each([
    [5, 0, 10, 5],
    [-3, 0, 10, 0],
    [42, 0, 10, 10],
    [4.6, 0, 10, 5],
    [NaN, 1, 10, 1],
    ["7", 0, 10, 7],
    [undefined, 2, 10, 2],
  ])("clampInt(%s, %i, %i) = %i", (value, min, max, expected) => {
    expect(clampInt(value, min, max)).toBe(expected);
  });
});

describe("savingThrowBonus", () => {
  it("is just the modifier when not proficient", () => {
    expect(savingThrowBonus(hero(), "dex")).toBe(2);
  });
  it("adds proficiency when proficient", () => {
    expect(savingThrowBonus(hero({ savingThrowProficiencies: ["dex"] }), "dex")).toBe(5);
  });
  it("can be negative", () => {
    expect(savingThrowBonus(hero(), "int")).toBe(-1);
  });
});

describe("skillBonus", () => {
  it("uses the skill's ability", () => {
    expect(skillBonus(hero(), "athletics")).toBe(3); // Str
    expect(skillBonus(hero(), "stealth")).toBe(2); // Dex
    expect(skillBonus(hero(), "arcana")).toBe(-1); // Int
  });
  it("adds proficiency", () => {
    expect(skillBonus(hero({ skillTraining: { stealth: "proficient" } }), "stealth")).toBe(5);
  });
  it("doubles proficiency for expertise", () => {
    expect(skillBonus(hero({ skillTraining: { stealth: "expertise" } }), "stealth")).toBe(8);
  });
});

describe("nextTraining", () => {
  it("cycles none -> proficient -> expertise -> none", () => {
    expect(nextTraining("none")).toBe("proficient");
    expect(nextTraining("proficient")).toBe("expertise");
    expect(nextTraining("expertise")).toBe("none");
  });
});

describe("derived stats", () => {
  it("passive perception is 10 + Perception", () => {
    expect(passivePerception(hero())).toBe(11);
    expect(passivePerception(hero({ skillTraining: { perception: "proficient" } }))).toBe(14);
  });
  it("initiative is Dex mod plus any bonus", () => {
    expect(initiative(hero())).toBe(2);
    expect(initiative(hero({ initiativeBonus: 5 }))).toBe(7);
  });
  it("spell DC and attack need a spellcasting ability", () => {
    expect(spellSaveDC(hero())).toBeNull();
    expect(spellAttackBonus(hero())).toBeNull();
    const cleric = hero({ spellcastingAbility: "wis" });
    expect(spellSaveDC(cleric)).toBe(12); // 8 + 3 + 1
    expect(spellAttackBonus(cleric)).toBe(4);
  });
  it("carrying capacity is Str x 15", () => {
    expect(carryingCapacity(hero())).toBe(240);
  });
});

describe("attacks", () => {
  it("adds ability, proficiency and magic to hit", () => {
    expect(attackBonus(hero(), longsword)).toBe(6);
    expect(attackBonus(hero(), { ...longsword, proficient: false })).toBe(3);
    expect(attackBonus(hero(), { ...longsword, magicBonus: 1 })).toBe(7);
  });
  it("builds a damage formula", () => {
    expect(damageFormula(hero(), longsword)).toBe("1d8+3");
    expect(damageFormula(hero(), { ...longsword, ability: "cha" })).toBe("1d8");
    expect(damageFormula(hero(), { ...longsword, ability: "int" })).toBe("1d8-1");
  });
});

describe("hit points", () => {
  it("takes damage from temp HP first", () => {
    const c = applyDamage(hero({ tempHp: 5 }), 8);
    expect(c.tempHp).toBe(0);
    expect(c.currentHp).toBe(37);
  });
  it("never drops below 0", () => {
    expect(applyDamage(hero(), 100).currentHp).toBe(0);
  });
  it("heals up to max HP", () => {
    expect(applyHealing(hero({ currentHp: 30 }), 5).currentHp).toBe(35);
    expect(applyHealing(hero({ currentHp: 30 }), 50).currentHp).toBe(40);
  });
  it("clears death saves when healed from 0", () => {
    const down = hero({ currentHp: 0, deathSaves: { successes: 1, failures: 2 } });
    expect(applyHealing(down, 3).deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});

describe("hit dice and rests", () => {
  it("spending a hit die heals roll + Con and uses one die", () => {
    const c = spendHitDie(hero({ currentHp: 20 }), 6);
    expect(c.currentHp).toBe(27);
    expect(c.hitDiceUsed).toBe(1);
    expect(hitDiceRemaining(c)).toBe(4);
  });
  it("can't spend hit dice when none are left", () => {
    const tired = hero({ currentHp: 20, hitDiceUsed: 5 });
    expect(spendHitDie(tired, 6)).toBe(tired);
  });
  it("long rest restores HP, slots and half the hit dice", () => {
    const tired = hero({
      currentHp: 3,
      tempHp: 4,
      hitDiceUsed: 5,
      exhaustionLevel: 2,
      spellSlots: Array.from({ length: 9 }, () => ({ max: 2, used: 2 })),
    });
    const rested = longRest(tired);
    expect(rested.currentHp).toBe(40);
    expect(rested.tempHp).toBe(0);
    expect(rested.hitDiceUsed).toBe(3); // regains floor(5/2) = 2
    expect(rested.exhaustionLevel).toBe(1);
    expect(rested.spellSlots.every((s) => s.used === 0)).toBe(true);
  });
  it("long rest regains at least one hit die at level 1", () => {
    expect(longRest(hero({ level: 1, hitDiceUsed: 1 })).hitDiceUsed).toBe(0);
  });
});

describe("inventory", () => {
  it("totals quantity x weight", () => {
    const item = { id: "", name: "", equipped: false, notes: "" };
    expect(
      totalWeight([
        { ...item, quantity: 10, weight: 0.5 },
        { ...item, quantity: 1, weight: 3 },
      ])
    ).toBe(8);
  });
  it("converts coins to gold", () => {
    expect(wealthInGold({ cp: 50, sp: 5, ep: 2, gp: 10, pp: 1 })).toBe(22);
  });
});

describe("experience", () => {
  it.each([
    [0, 1],
    [299, 1],
    [300, 2],
    [6500, 5],
    [355000, 20],
    [999999, 20],
  ])("%i XP is level %i", (xp, level) => {
    expect(levelForExperience(xp)).toBe(level);
  });
  it("knows the next threshold", () => {
    expect(experienceForNextLevel(1)).toBe(300);
    expect(experienceForNextLevel(20)).toBeNull();
  });
});

describe("class defaults", () => {
  const wizard: SrdClass = { key: "srd_wizard", name: "Wizard", hitDie: 6, savingThrows: ["int", "wis"] };

  it("reports what picking a class would change", () => {
    const c = createCharacter({ hitDieSides: 10, savingThrowProficiencies: ["str"] });
    expect(classDefaultChanges(c, wizard)).toEqual({ hitDie: true, savingThrows: true });
  });

  it("reports nothing when the sheet already matches, in any save order", () => {
    const c = createCharacter({ hitDieSides: 6, savingThrowProficiencies: ["wis", "int"] });
    expect(classDefaultChanges(c, wizard)).toBeNull();
  });

  it("notices an extra saving throw", () => {
    const c = createCharacter({ hitDieSides: 6, savingThrowProficiencies: ["int", "wis", "con"] });
    expect(classDefaultChanges(c, wizard)).toEqual({ hitDie: false, savingThrows: true });
  });

  it("applies hit die and saves, leaving everything else alone", () => {
    const c = createCharacter({ hitDieSides: 12, savingThrowProficiencies: ["str"], level: 5, hitDiceUsed: 2 });
    const next = applyClassDefaults(c, wizard);
    expect(next.hitDieSides).toBe(6);
    expect(next.savingThrowProficiencies).toEqual(["int", "wis"]);
    expect(next.hitDiceUsed).toBe(2);
    expect(next.level).toBe(5);
    expect(next.savingThrowProficiencies).not.toBe(wizard.savingThrows);
  });
});
