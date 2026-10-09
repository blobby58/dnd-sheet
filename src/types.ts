// The six ability scores. `as const` makes this a readonly tuple of literal
// types, so we can derive the `Ability` type from it below.
export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type Ability = (typeof ABILITIES)[number];

export const ABILITY_NAMES: Record<Ability, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

// Only store what the player chooses. Anything that can be calculated
// (modifiers, proficiency bonus, initiative...) is derived in rules.ts,
// so it can never get out of sync.
export interface Character {
  name: string;
  className: string;
  level: number;
  abilityScores: Record<Ability, number>;
  maxHp: number;
  currentHp: number;
}

export const defaultCharacter: Character = {
  name: "New Adventurer",
  className: "Fighter",
  level: 1,
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  maxHp: 10,
  currentHp: 10,
};