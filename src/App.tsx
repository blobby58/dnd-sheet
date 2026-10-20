import { useState } from "react";
import { useCharacters } from "./useCharacters";
import {
  applyClassDefaults,
  classDefaultChanges,
  experienceForNextLevel,
  levelForExperience,
} from "./rules";
import { ABILITY_NAMES, type SrdClass } from "./types";
import { CharacterBar } from "./components/CharacterBar";
import { DiceProvider } from "./components/DiceTray";
import { NumberField, TextField } from "./components/fields";
import { ClassField } from "./components/ClassField";
import { Feats } from "./components/Feats";
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
  // The SRD class just picked; we offer its defaults rather than overwrite.
  const [picked, setPicked] = useState<SrdClass | null>(null);
  const changes = picked && classDefaultChanges(c, picked);
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
        <ClassField
          value={c.className}
          onChange={(v) => {
            setField(update, "className", v);
            setPicked(null);
          }}
          onPickSrd={setPicked}
        />
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
      {picked && changes && (
        <p className="class-offer">
          Use {picked.name} defaults:{" "}
          {[
            changes.hitDie && `d${picked.hitDie} hit die`,
            changes.savingThrows &&
              `${picked.savingThrows.map((a) => ABILITY_NAMES[a]).join(" & ")} saves`,
          ]
            .filter(Boolean)
            .join(", ")}
          ?{" "}
          <button
            type="button"
            onClick={() => {
              update((prev) => applyClassDefaults(prev, picked));
              setPicked(null);
            }}
          >
            Apply
          </button>{" "}
          <button type="button" className="link" onClick={() => setPicked(null)}>
            Keep mine
          </button>
        </p>
      )}
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
        <Identity key={active.id} {...props} />
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
            <Feats {...props} />
            <NotesTab {...props} />
          </div>
        </div>
        <footer className="footer">
          <p>Saved automatically in this browser.</p>
          <p>
            This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”)
            by Wizards of the Coast LLC and available at{" "}
            <a href="https://dnd.wizards.com/resources/systems-reference-document">
              https://dnd.wizards.com/resources/systems-reference-document
            </a>
            . The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International
            License available at{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/legalcode">
              https://creativecommons.org/licenses/by/4.0/legalcode
            </a>
            . Class and feat data via the <a href="https://open5e.com">Open5e</a> API.
          </p>
        </footer>
      </main>
    </DiceProvider>
  );
}
