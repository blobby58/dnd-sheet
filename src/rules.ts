// Pure functions for the game rules (D&D 5e SRD). No React here, so
// everything is easy to unit test. Functions that take a Character assume
// it has been normalised (see storage.ts), so scores and level are in range.

import {
  SKILL_ABILITY,
  type Ability,
  type Attack,
  type Character,
  type Item,
  type Skill,
  type Training,
} from "./types";

// Gets the ability modifier for a score: 10-11 -> +0, 12-13 -> +1, 9 -> -1.
export function abilityModifier(score: number): number {
  if (!Number.isInteger(score)) {
    throw new RangeError("Score must be a whole number");
  }
  if (score < 1 || score > 30) {
    throw new RangeError("Score must be an integer from 1 to 30");
  }
  return Math.floor((score - 10) / 2);
}

// Gets the proficiency bonus for a level: 1-4 -> +2 ... 17-20 -> +6.
export function proficiencyBonus(level: number): number {
  if (!Number.isInteger(level)) {
    throw new RangeError("Level must be a whole number");
  }
  if (level < 1 || level > 20) {
    throw new RangeError("Level must be an integer from 1 to 20");
  }
  return Math.ceil(level / 4 + 1);
}

// Formats a modifier the way the books do: +2, +0, -1.
export function formatModifier(mod: number): string {
  if (!Number.isInteger(mod)) {
    throw new RangeError("Modifier must be a whole number");
  }
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Clamps a number into [min, max], rounding to a whole number.
// Non-numbers (NaN, undefined...) become `fallback`.
export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback = min
): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function mod(character: Character, ability: Ability): number {
  return abilityModifier(character.abilityScores[ability]);
}

export function prof(character: Character): number {
  return proficiencyBonus(character.level);
}

export function savingThrowBonus(character: Character, ability: Ability): number {
  const proficient = character.savingThrowProficiencies.includes(ability);
  return mod(character, ability) + (proficient ? prof(character) : 0);
}

export function skillTraining(character: Character, skill: Skill): Training {
  return character.skillTraining[skill] ?? "none";
}

const TRAINING_MULTIPLIER: Record<Training, number> = {
  none: 0,
  proficient: 1,
  expertise: 2,
};

export function skillBonus(character: Character, skill: Skill): number {
  const multiplier = TRAINING_MULTIPLIER[skillTraining(character, skill)];
  return mod(character, SKILL_ABILITY[skill]) + multiplier * prof(character);
}

// Cycles none -> proficient -> expertise -> none, for the clickable dot.
export function nextTraining(training: Training): Training {
  if (training === "none") return "proficient";
  if (training === "proficient") return "expertise";
  return "none";
}

export function passivePerception(character: Character): number {
  return 10 + skillBonus(character, "perception");
}

export function initiative(character: Character): number {
  return mod(character, "dex") + character.initiativeBonus;
}

export function spellSaveDC(character: Character): number | null {
  const ability = character.spellcastingAbility;
  if (ability === null) return null;
  return 8 + prof(character) + mod(character, ability);
}

export function spellAttackBonus(character: Character): number | null {
  const ability = character.spellcastingAbility;
  if (ability === null) return null;
  return prof(character) + mod(character, ability);
}

export function attackBonus(character: Character, attack: Attack): number {
  return (
    mod(character, attack.ability) +
    (attack.proficient ? prof(character) : 0) +
    attack.magicBonus
  );
}

export function damageBonus(character: Character, attack: Attack): number {
  return mod(character, attack.ability) + attack.magicBonus;
}

// "1d8" + 3 -> "1d8+3", "1d8" + 0 -> "1d8", "2d6" - 1 -> "2d6-1"
export function damageFormula(character: Character, attack: Attack): string {
  const dice = attack.damageDice.trim() || "0";
  const bonus = damageBonus(character, attack);
  if (bonus === 0) return dice;
  return `${dice}${bonus > 0 ? "+" : ""}${bonus}`;
}

// Hit dice: you have one per level.
export function hitDiceRemaining(character: Character): number {
  return Math.max(0, character.level - character.hitDiceUsed);
}

// Damage is taken from temporary HP first, then current HP (never below 0).
export function applyDamage(character: Character, amount: number): Character {
  const dmg = Math.max(0, Math.floor(amount));
  const fromTemp = Math.min(character.tempHp, dmg);
  const rest = dmg - fromTemp;
  return {
    ...character,
    tempHp: character.tempHp - fromTemp,
    currentHp: Math.max(0, character.currentHp - rest),
  };
}

// Healing can't go above max HP. Regaining HP from 0 clears death saves.
export function applyHealing(character: Character, amount: number): Character {
  const heal = Math.max(0, Math.floor(amount));
  const currentHp = Math.min(character.maxHp, character.currentHp + heal);
  return {
    ...character,
    currentHp,
    deathSaves:
      currentHp > 0 ? { successes: 0, failures: 0 } : character.deathSaves,
  };
}

// Spends one hit die: heal by the roll + Con modifier (minimum 0).
export function spendHitDie(character: Character, roll: number): Character {
  if (hitDiceRemaining(character) === 0) return character;
  const healed = applyHealing(
    character,
    Math.max(0, roll + mod(character, "con"))
  );
  return { ...healed, hitDiceUsed: character.hitDiceUsed + 1 };
}

// Long rest: full HP, temp HP gone, all spell slots back, death saves reset,
// regain up to half your total hit dice (minimum 1), one less exhaustion.
export function longRest(character: Character): Character {
  const regained = Math.max(1, Math.floor(character.level / 2));
  return {
    ...character,
    currentHp: character.maxHp,
    tempHp: 0,
    hitDiceUsed: Math.max(0, character.hitDiceUsed - regained),
    deathSaves: { successes: 0, failures: 0 },
    spellSlots: character.spellSlots.map((slot) => ({ ...slot, used: 0 })),
    exhaustionLevel: Math.max(0, character.exhaustionLevel - 1),
  };
}

export function totalWeight(items: Item[]): number {
  const sum = items.reduce((acc, item) => acc + item.quantity * item.weight, 0);
  return Math.round(sum * 100) / 100;
}

export function carryingCapacity(character: Character): number {
  return character.abilityScores.str * 15;
}

// Total wealth expressed in gold pieces.
export function wealthInGold(currency: Character["currency"]): number {
  const gp =
    currency.cp / 100 +
    currency.sp / 10 +
    currency.ep / 2 +
    currency.gp +
    currency.pp * 10;
  return Math.round(gp * 100) / 100;
}

// XP needed to reach each level (index = level - 1).
const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

export function levelForExperience(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function experienceForNextLevel(level: number): number | null {
  return level >= 20 ? null : XP_THRESHOLDS[level];
}
