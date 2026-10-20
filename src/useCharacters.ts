import { useCallback, useEffect, useState } from "react";
import { createCharacter, newId, type Character } from "./types";
import { loadState, saveState, type AppState, type KeyValueStore } from "./storage";

function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null; // storage blocked (e.g. some private-browsing modes)
  }
}

function initialState(): AppState {
  const store = browserStore();
  try {
    if (store) return loadState(store);
  } catch {
    // fall through to a fresh state
  }
  const character = createCharacter();
  return { characters: [character], activeId: character.id };
}

// All characters, which one is open, and the actions that change them.
// State is saved to localStorage after every change.
export function useCharacters() {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const store = browserStore();
    try {
      if (store) saveState(store, state);
    } catch {
      // storage full or blocked; the app still works for this session
    }
  }, [state]);

  const active =
    state.characters.find((c) => c.id === state.activeId) ?? state.characters[0];

  // Updates the open character. `change` receives the latest version, so
  // several quick updates in a row never overwrite each other.
  const updateActive = useCallback((change: (c: Character) => Character) => {
    setState((prev) => ({
      ...prev,
      characters: prev.characters.map((c) =>
        c.id === prev.activeId ? { ...change(c), updatedAt: Date.now() } : c
      ),
    }));
  }, []);

  const select = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeId: id }));
  }, []);

  const add = useCallback((character: Character = createCharacter()) => {
    setState((prev) => ({
      characters: [...prev.characters, character],
      activeId: character.id,
    }));
  }, []);

  const duplicate = useCallback(() => {
    setState((prev) => {
      const source = prev.characters.find((c) => c.id === prev.activeId);
      if (!source) return prev;
      const copy: Character = {
        ...structuredClone(source),
        id: newId(),
        name: `${source.name} (copy)`,
        updatedAt: Date.now(),
      };
      return { characters: [...prev.characters, copy], activeId: copy.id };
    });
  }, []);

  const remove = useCallback((id: string) => {
    setState((prev) => {
      const characters = prev.characters.filter((c) => c.id !== id);
      if (characters.length === 0) characters.push(createCharacter());
      const activeId =
        prev.activeId === id ? characters[0].id : prev.activeId;
      return { characters, activeId };
    });
  }, []);

  return {
    characters: state.characters,
    active,
    updateActive,
    select,
    add,
    duplicate,
    remove,
  };
}
