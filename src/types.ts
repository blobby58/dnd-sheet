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

// The 18 skills. Same pattern as ABILITIES: one list is the single source
// of truth for both the values we loop over and the `Skill` type.
export const SKILLS = [
  "acrobatics",
  "animalHandling",
  "arcana",
  "athletics",
  "deception",
  "history",
  "insight",
  "intimidation",
  "investigation",
  "medicine",
  "nature",
  "perception",
  "performance",
  "persuasion",
  "religion",
  "sleightOfHand",
  "stealth",
  "survival",
] as const;
export type Skill = (typeof SKILLS)[number];

// Record<Skill, ...> forces an entry for every skill: delete one, or
// misspell a key, and TypeScript reports an error.
export const SKILL_ABILITY: Record<Skill, Ability> = {
  acrobatics: "dex",
  animalHandling: "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  sleightOfHand: "dex",
  stealth: "dex",
  survival: "wis",
};

export const SKILL_NAMES: Record<Skill, string> = {
  acrobatics: "Acrobatics",
  animalHandling: "Animal Handling",
  arcana: "Arcana",
  athletics: "Athletics",
  deception: "Deception",
  history: "History",
  insight: "Insight",
  intimidation: "Intimidation",
  investigation: "Investigation",
  medicine: "Medicine",
  nature: "Nature",
  perception: "Perception",
  performance: "Performance",
  persuasion: "Persuasion",
  religion: "Religion",
  sleightOfHand: "Sleight of Hand",
  stealth: "Stealth",
  survival: "Survival",
};

// Only store what the player chooses. Anything that can be calculated
// (modifiers, proficiency bonus, skill bonuses...) is derived in rules.ts,
// so it can never get out of sync.
export interface Character {
  name: string;
  className: string;
  level: number;
  abilityScores: Record<Ability, number>;
  maxHp: number;
  currentHp: number;
  savingThrowProficiencies: Ability[]; // e.g. ["str", "con"]
  skillProficiencies: Skill[]; // e.g. ["athletics", "perception"]
}

export const defaultCharacter: Character = {
  name: "New Adventurer",
  className: "Fighter",
  level: 1,
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  maxHp: 10,
  currentHp: 10,
  savingThrowProficiencies: [],
  skillProficiencies: [],
  savingThrowProficiencies: Ability[],
  skillProficiencies: Skill[];
};