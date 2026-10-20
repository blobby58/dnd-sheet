// Loading, saving and cleaning up character data.
//
// Everything read from localStorage or an imported file is untrusted: it
// might come from an older version of the app, be hand-edited, or be
// corrupt. normalizeCharacter turns *anything* into a valid Character,
// filling in defaults for missing fields and clamping numbers into range.

import { clampInt } from "./rules";
import {
  ABILITIES,
  CONDITIONS,
  CURRENCIES,
  HIT_DIE_SIDES,
  SKILLS,
  createCharacter,
  newId,
  type Ability,
  type Attack,
  type Character,
  type CharacterFeat,
  type Condition,
  type HitDieSides,
  type Item,
  type Skill,
  type Spell,
  type SpellSlot,
  type Training,
} from "./types";

export const STORAGE_KEY = "dnd-sheet:v2";
export const LEGACY_KEY = "character"; // Milestone 1 single-character save

export interface AppState {
  characters: Character[];
  activeId: string;
}

// Minimal interface so tests can pass a fake instead of window.localStorage.
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type Raw = Record<string, unknown>;

function isObject(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = "", maxLength = 20000): string {
  return typeof value === "string" ? value.slice(0, maxLength) : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function arrayOf<T>(value: unknown, map: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map).filter((item): item is T => item !== null);
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | null {
  return list.includes(value as T) ? (value as T) : null;
}

function uniqueOf<T extends string>(list: readonly T[], value: unknown): T[] {
  return [...new Set(arrayOf(value, (v) => oneOf(list, v)))];
}

function normalizeAttack(value: unknown): Attack | null {
  if (!isObject(value)) return null;
  return {
    id: str(value.id) || newId(),
    name: str(value.name, "", 200),
    ability: oneOf(ABILITIES, value.ability) ?? "str",
    proficient: bool(value.proficient, true),
    magicBonus: clampInt(value.magicBonus, -10, 10, 0),
    damageDice: str(value.damageDice, "1d6", 50),
    damageType: str(value.damageType, "", 50),
    notes: str(value.notes, "", 2000),
  };
}

function normalizeSpell(value: unknown): Spell | null {
  if (!isObject(value)) return null;
  return {
    id: str(value.id) || newId(),
    name: str(value.name, "", 200),
    level: clampInt(value.level, 0, 9, 0),
    prepared: bool(value.prepared),
    notes: str(value.notes, "", 2000),
  };
}

function normalizeFeat(value: unknown): CharacterFeat | null {
  if (!isObject(value)) return null;
  return {
    id: str(value.id) || newId(),
    name: str(value.name, "", 200),
    srdKey: typeof value.srdKey === "string" && value.srdKey !== "" ? value.srdKey.slice(0, 200) : null,
    notes: str(value.notes, "", 5000),
  };
}

function normalizeItem(value: unknown): Item | null {
  if (!isObject(value)) return null;
  return {
    id: str(value.id) || newId(),
    name: str(value.name, "", 200),
    quantity: clampInt(value.quantity, 0, 99999, 1),
    weight: Math.round(num(value.weight, 0, 10000, 0) * 100) / 100,
    equipped: bool(value.equipped),
    notes: str(value.notes, "", 2000),
  };
}

function normalizeSlots(value: unknown): SpellSlot[] {
  const raw = Array.isArray(value) ? value : [];
  return Array.from({ length: 9 }, (_, i) => {
    const slot: unknown = raw[i];
    const max = isObject(slot) ? clampInt(slot.max, 0, 9, 0) : 0;
    const used = isObject(slot) ? clampInt(slot.used, 0, max, 0) : 0;
    return { max, used };
  });
}

function normalizeTraining(raw: Raw): Partial<Record<Skill, Training>> {
  const result: Partial<Record<Skill, Training>> = {};
  if (isObject(raw.skillTraining)) {
    for (const skill of SKILLS) {
      const t = oneOf(["proficient", "expertise"] as const, raw.skillTraining[skill]);
      if (t) result[skill] = t;
    }
  }
  // Older saves stored a plain list of proficient skills.
  for (const skill of uniqueOf(SKILLS, raw.skillProficiencies)) {
    result[skill] ??= "proficient";
  }
  return result;
}

export function normalizeCharacter(value: unknown): Character {
  const raw: Raw = isObject(value) ? value : {};
  const base = createCharacter();

  const scores = isObject(raw.abilityScores) ? raw.abilityScores : {};
  const abilityScores = Object.fromEntries(
    ABILITIES.map((a) => [a, clampInt(scores[a], 1, 30, 10)])
  ) as Record<Ability, number>;

  const level = clampInt(raw.level, 1, 20, 1);
  const maxHp = clampInt(raw.maxHp, 1, 9999, base.maxHp);
  const hitDieSides: HitDieSides =
    HIT_DIE_SIDES.find((s) => s === raw.hitDieSides) ?? base.hitDieSides;
  const deathSaves = isObject(raw.deathSaves) ? raw.deathSaves : {};
  const currency = isObject(raw.currency) ? raw.currency : {};
  const conditions: Condition[] = uniqueOf(CONDITIONS, raw.conditions);

  return {
    id: str(raw.id) || base.id,
    name: str(raw.name, base.name, 200),
    className: str(raw.className, base.className, 200),
    species: str(raw.species, "", 200),
    background: str(raw.background, "", 200),
    alignment: str(raw.alignment, "", 100),
    level,
    experience: clampInt(raw.experience, 0, 10_000_000, 0),
    abilityScores,
    savingThrowProficiencies: uniqueOf(ABILITIES, raw.savingThrowProficiencies),
    skillTraining: normalizeTraining(raw),
    armorClass: clampInt(raw.armorClass, 0, 99, base.armorClass),
    speed: clampInt(raw.speed, 0, 999, base.speed),
    initiativeBonus: clampInt(raw.initiativeBonus, -20, 20, 0),
    inspiration: bool(raw.inspiration),
    maxHp,
    currentHp: clampInt(raw.currentHp, 0, maxHp, maxHp),
    tempHp: clampInt(raw.tempHp, 0, 9999, 0),
    hitDieSides,
    hitDiceUsed: clampInt(raw.hitDiceUsed, 0, level, 0),
    deathSaves: {
      successes: clampInt(deathSaves.successes, 0, 3, 0),
      failures: clampInt(deathSaves.failures, 0, 3, 0),
    },
    conditions,
    exhaustionLevel: clampInt(raw.exhaustionLevel, 0, 6, 0),
    attacks: arrayOf(raw.attacks, normalizeAttack),
    spellcastingAbility: oneOf(ABILITIES, raw.spellcastingAbility),
    spellSlots: normalizeSlots(raw.spellSlots),
    spells: arrayOf(raw.spells, normalizeSpell),
    inventory: arrayOf(raw.inventory, normalizeItem),
    currency: Object.fromEntries(
      CURRENCIES.map((c) => [c, clampInt(currency[c], 0, 1e9, 0)])
    ) as Character["currency"],
    feats: arrayOf(raw.feats, normalizeFeat),
    otherProficiencies: str(raw.otherProficiencies),
    features: str(raw.features),
    notes: str(raw.notes),
    updatedAt: clampInt(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
  };
}

// Makes sure every character has a unique id and there's always at least one.
export function normalizeState(value: unknown): AppState {
  const raw: Raw = isObject(value) ? value : {};
  const seen = new Set<string>();
  const characters = arrayOf(raw.characters, (c) => {
    const character = normalizeCharacter(c);
    if (seen.has(character.id)) character.id = newId();
    seen.add(character.id);
    return character;
  });
  if (characters.length === 0) characters.push(createCharacter());
  const activeId = characters.some((c) => c.id === raw.activeId)
    ? (raw.activeId as string)
    : characters[0].id;
  return { characters, activeId };
}

function parseJson(text: string | null): unknown {
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// Loads saved state. Falls back to the Milestone 1 single-character save,
// so nobody loses the character they made before this version.
export function loadState(store: KeyValueStore): AppState {
  const current = parseJson(store.getItem(STORAGE_KEY));
  if (current !== undefined) return normalizeState(current);

  const legacy = parseJson(store.getItem(LEGACY_KEY));
  if (isObject(legacy)) {
    const character = normalizeCharacter(legacy);
    return { characters: [character], activeId: character.id };
  }
  return normalizeState(undefined);
}

export function saveState(store: KeyValueStore, state: AppState): void {
  store.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Import / export -------------------------------------------------------

export const EXPORT_FORMAT = "dnd-sheet-character";

export function exportCharacter(character: Character): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: 2, character }, null, 2);
}

// Accepts our export format, or a bare character object. Always returns a
// character with a fresh id so importing never overwrites an existing one.
export function importCharacter(text: string): Character | null {
  const parsed = parseJson(text);
  if (!isObject(parsed)) return null;
  const raw = parsed.format === EXPORT_FORMAT ? parsed.character : parsed;
  if (!isObject(raw) || typeof raw.name !== "string") return null;
  return { ...normalizeCharacter(raw), id: newId(), updatedAt: Date.now() };
}
