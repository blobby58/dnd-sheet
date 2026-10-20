import type { Character } from "../types";

// Every tab receives the open character and a way to change it.
export interface SheetProps {
  c: Character;
  update: (change: (c: Character) => Character) => void;
}

// Shallow helper: set one top-level field.
export function setField<K extends keyof Character>(
  update: SheetProps["update"],
  key: K,
  value: Character[K]
) {
  update((c) => ({ ...c, [key]: value }));
}

// Adds the item if missing, removes it if present. Always returns a new array.
export function toggleIn<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
