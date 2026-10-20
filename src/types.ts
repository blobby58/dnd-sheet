// Data definitions for a D&D 5e character.
//
// Only store what the player chooses. Anything that can be calculated
// (modifiers, proficiency bonus, skill bonuses, spell DC...) is derived
// in rules.ts, so it can never get out of sync.

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

export const ABILITY_SHORT: Record<Ability, string> = {
  str: "Str",
  dex: "Dex",
  con: "Con",
  int: "Int",
  wis: "Wis",
  cha: "Cha",
};

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

export const CONDITIONS = [
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const HIT_DIE_SIDES = [6, 8, 10, 12] as const;
export type HitDieSides = (typeof HIT_DIE_SIDES)[number];

export const CURRENCIES = ["cp", "sp", "ep", "gp", "pp"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_NAMES: Record<Currency, string> = {
  cp: "Copper",
  sp: "Silver",
  ep: "Electrum",
  gp: "Gold",
  pp: "Platinum",
};

// How a skill is trained: not at all, proficient, or expertise (double bonus).
export type Training = "none" | "proficient" | "expertise";

export interface Attack {
  id: string;
  name: string;
  ability: Ability; // usually str for melee, dex for ranged/finesse
  proficient: boolean;
  magicBonus: number; // e.g. +1 weapon; added to attack and damage
  damageDice: string; // e.g. "1d8"
  damageType: string; // e.g. "slashing"
  notes: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = cantrip, 1-9
  prepared: boolean;
  notes: string;
}

export interface SpellSlot {
  max: number;
  used: number;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  weight: number; // pounds, per item
  equipped: boolean;
  notes: string;
}

export interface Character {
  id: string;
  name: string;
  className: string;
  species: string;
  background: string;
  alignment: string;
  level: number;
  experience: number;

  abilityScores: Record<Ability, number>;
  savingThrowProficiencies: Ability[];
  skillTraining: Partial<Record<Skill, Training>>;

  armorClass: number;
  speed: number;
  initiativeBonus: number; // extra on top of Dex (e.g. Alert feat)
  inspiration: boolean;

  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDieSides: HitDieSides;
  hitDiceUsed: number;
  deathSaves: { successes: number; failures: number };
  conditions: Condition[];
  exhaustionLevel: number; // 0-6

  attacks: Attack[];

  spellcastingAbility: Ability | null;
  spellSlots: SpellSlot[]; // index 0 = 1st-level slots ... index 8 = 9th
  spells: Spell[];

  inventory: Item[];
  currency: Record<Currency, number>;

  otherProficiencies: string; // armour, weapons, tools, languages
  features: string; // class & species features, feats
  notes: string;

  updatedAt: number;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function emptySpellSlots(): SpellSlot[] {
  return Array.from({ length: 9 }, () => ({ max: 0, used: 0 }));
}

export function createCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: newId(),
    name: "Nameless??",
    className: "Classless??",
    species: "Raceless??",
    background: "Homeless??",
    alignment: "Confused??",
    level: 1,
    experience: 0,
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrowProficiencies: [],
    skillTraining: {},
    armorClass: 10,
    speed: 30,
    initiativeBonus: 0,
    inspiration: false,
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    hitDieSides: 10,
    hitDiceUsed: 0,
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    exhaustionLevel: 0,
    attacks: [],
    spellcastingAbility: null,
    spellSlots: emptySpellSlots(),
    spells: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    otherProficiencies: "",
    features: "",
    notes: "",
    updatedAt: Date.now(),
    ...overrides,
  };
}
