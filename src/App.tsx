import { useCharacters } from "./useCharacters";
import { experienceForNextLevel, levelForExperience } from "./rules";
import { CharacterBar } from "./components/CharacterBar";
import { DiceProvider } from "./components/DiceTray";
import { NumberField, TextField } from "./components/fields";
import { MainStats, Status } from "./components/OverviewTab";
import { CombatTab } from "./components/CombatTab";
import { SpellsTab } from "./components/SpellsTab";
import { InventoryTab } from "./components/InventoryTab";
import { NotesTab } from "./components/NotesTab";
import { setField, type SheetProps } from "./components/sheetProps";
import "./App.css";

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
        {/* key resets per-section form state when switching characters */}
        <div className="sheet-body" key={active.id}>
          <aside className="main-stats">
            <MainStats {...props} />
          </aside>
          <div className="sheet-flow">
            <Status {...props} />
            <CombatTab {...props} />
            <SpellsTab {...props} />
            <InventoryTab {...props} />
            <NotesTab {...props} />
          </div>
        </div>
        <footer className="footer">
          Saved automatically in this browser. Rules content from the D&amp;D 5e System Reference
          Document, licensed under CC-BY-4.0.
        </footer>
      </main>
    </DiceProvider>
  );
}
