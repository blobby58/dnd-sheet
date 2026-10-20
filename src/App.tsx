import { useState } from "react";
import { useCharacters } from "./useCharacters";
import { experienceForNextLevel, levelForExperience } from "./rules";
import { CharacterBar } from "./components/CharacterBar";
import { DiceProvider } from "./components/DiceTray";
import { NumberField, TextField } from "./components/fields";
import { OverviewTab } from "./components/OverviewTab";
import { CombatTab } from "./components/CombatTab";
import { SpellsTab } from "./components/SpellsTab";
import { InventoryTab } from "./components/InventoryTab";
import { NotesTab } from "./components/NotesTab";
import { setField, type SheetProps } from "./components/sheetProps";
import "./App.css";

const TABS = [
  { id: "overview", label: "Overview", Component: OverviewTab },
  { id: "combat", label: "Combat", Component: CombatTab },
  { id: "spells", label: "Spells", Component: SpellsTab },
  { id: "inventory", label: "Inventory", Component: InventoryTab },
  { id: "notes", label: "Notes", Component: NotesTab },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Identity({ c, update }: SheetProps) {
  const xpLevel = levelForExperience(c.experience);
  const next = experienceForNextLevel(c.level);
  return (
    <header className="identity">
      <label htmlFor="char-name" className="sr-only">
        Character name
      </label>
      <input
        id="char-name"
        className="char-name"
        value={c.name}
        placeholder="Character name"
        onChange={(e) => setField(update, "name", e.target.value)}
      />
      <div className="identity-fields">
        <TextField label="Class" value={c.className} onChange={(v) => setField(update, "className", v)} />
        <NumberField
          label="Level"
          className="narrow"
          value={c.level}
          min={1}
          max={20}
          onChange={(v) =>
            update((prev) => ({ ...prev, level: v, hitDiceUsed: Math.min(prev.hitDiceUsed, v) }))
          }
        />
        <TextField label="Species" value={c.species} onChange={(v) => setField(update, "species", v)} />
        <TextField label="Background" value={c.background} onChange={(v) => setField(update, "background", v)} />
        <TextField label="Alignment" value={c.alignment} onChange={(v) => setField(update, "alignment", v)} />
        <NumberField
          label={next === null ? "Experience" : `Experience (next: ${next.toLocaleString()})`}
          value={c.experience}
          min={0}
          max={10_000_000}
          onChange={(v) => setField(update, "experience", v)}
        />
      </div>
      {xpLevel > c.level && (
        <p className="level-up">
          You have enough experience for level {xpLevel}.{" "}
          <button type="button" className="link" onClick={() => setField(update, "level", xpLevel)}>
            Level up to {xpLevel}
          </button>
        </p>
      )}
    </header>
  );
}

export default function App() {
  const { characters, active, updateActive, select, add, duplicate, remove } = useCharacters();
  const [tab, setTab] = useState<TabId>("overview");
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];
  const props: SheetProps = { c: active, update: updateActive };

  return (
    <DiceProvider>
      <CharacterBar
        characters={characters}
        active={active}
        onSelect={select}
        onNew={() => add()}
        onDuplicate={duplicate}
        onDelete={remove}
        onImport={add}
      />
      <main className="sheet">
        <Identity {...props} />
        <div className="tabs" role="tablist" aria-label="Sheet sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls="tab-panel"
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${current.id}`}>
          {/* key resets per-tab form state when switching characters */}
          <current.Component key={active.id} {...props} />
        </div>
        <footer className="footer">
          Saved automatically in this browser. Rules content from the D&amp;D 5e System Reference
          Document, licensed under CC-BY-4.0.
        </footer>
      </main>
    </DiceProvider>
  );
}
