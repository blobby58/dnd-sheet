// Turns raw Open5e v2 rows into the trimmed shapes the sheet stores in
// src/data/. Pure functions, so they can be tested without the network.
//
// Only the Wizards of the Coast SRD 5.1 document (srd-2014, CC BY 4.0) is
// allowed in; anything else is dropped even if the API returns it.

import {
  ABILITIES,
  ABILITY_NAMES,
  HIT_DIE_SIDES,
  type Ability,
  type HitDieSides,
  type SrdClass,
  type SrdFeat,
} from "../src/types.ts";

export const SRD_DOCUMENT_KEY = "srd-2014";

type Raw = Record<string, unknown>;

function isObject(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected ${field} to be a string`);
  return value.trim();
}

function isSrd(row: Raw): boolean {
  return isObject(row.document) && row.document.key === SRD_DOCUMENT_KEY;
}

function hitDie(value: unknown, className: string): HitDieSides {
  const sides = Number(String(value).replace(/^d/i, ""));
  const match = HIT_DIE_SIDES.find((s) => s === sides);
  if (match === undefined) throw new Error(`${className}: unexpected hit die ${String(value)}`);
  return match;
}

function ability(name: unknown, className: string): Ability {
  const match = ABILITIES.find((a) => ABILITY_NAMES[a] === name);
  if (match === undefined) throw new Error(`${className}: unknown saving throw ${String(name)}`);
  return match;
}

export function toSrdClass(row: Raw): SrdClass {
  const name = text(row.name, "class name");
  const saves = Array.isArray(row.saving_throws) ? row.saving_throws : [];
  return {
    key: text(row.key, "class key"),
    name,
    hitDie: hitDie(row.hit_dice, name),
    savingThrows: saves.map((s) => ability(isObject(s) ? s.name : s, name)),
  };
}

export function toSrdFeat(row: Raw): SrdFeat {
  const prerequisite = typeof row.prerequisite === "string" ? row.prerequisite.trim() : "";
  const benefits = Array.isArray(row.benefits) ? row.benefits : [];
  return {
    key: text(row.key, "feat key"),
    name: text(row.name, "feat name"),
    prerequisite: prerequisite || null,
    desc: typeof row.desc === "string" ? row.desc.trim() : "",
    benefits: benefits
      .map((b) => (isObject(b) && typeof b.desc === "string" ? b.desc.trim() : ""))
      .filter((b) => b !== ""),
  };
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

// Base classes only: subclasses (Champion, Thief...) come back in the same list.
export function transformClasses(rows: unknown[]): SrdClass[] {
  return rows
    .filter(isObject)
    .filter((row) => isSrd(row) && row.subclass_of == null)
    .map(toSrdClass)
    .sort(byName);
}

export function transformFeats(rows: unknown[]): SrdFeat[] {
  return rows.filter(isObject).filter(isSrd).map(toSrdFeat).sort(byName);
}
