import { useRef, useState, type ChangeEvent } from "react";
import { exportCharacter, importCharacter } from "../storage";
import type { Character } from "../types";

interface Props {
  characters: Character[];
  active: Character;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onDelete: (id: string) => void;
  onImport: (character: Character) => void;
}

function fileName(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "character"}.json`;
}

export function CharacterBar({
  characters,
  active,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
  onImport,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  function download() {
    const blob = new Blob([exportCharacter(active)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(active.name);
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${active.name}.`);
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow importing the same file twice
    if (!file) return;
    if (file.size > 2_000_000) {
      setMessage("That file is too large to be a character sheet.");
      return;
    }
    const character = importCharacter(await file.text());
    if (!character) {
      setMessage("That file isn't a character exported from this sheet.");
      return;
    }
    onImport(character);
    setMessage(`Imported ${character.name}.`);
  }

  function remove() {
    if (window.confirm(`Delete ${active.name}? This can't be undone. Export it first if you want a backup.`)) {
      onDelete(active.id);
      setMessage(`Deleted ${active.name}.`);
    }
  }

  const sorted = [...characters].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <nav className="character-bar" aria-label="Characters">
      <span className="brand">Character sheet</span>
      <label htmlFor="character-select" className="sr-only">
        Open character
      </label>
      <select
        id="character-select"
        value={active.id}
        onChange={(e) => onSelect(e.target.value)}
      >
        {sorted.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name || "Unnamed"} · {c.className} {c.level}
          </option>
        ))}
      </select>
      <div className="bar-actions">
        <button type="button" onClick={onNew}>
          New
        </button>
        <button type="button" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" onClick={download}>
          Export
        </button>
        <button type="button" onClick={() => fileInput.current?.click()}>
          Import
        </button>
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="danger" onClick={remove}>
          Delete
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={upload}
      />
      <p className="bar-message" role="status">
        {message}
      </p>
    </nav>
  );
}
