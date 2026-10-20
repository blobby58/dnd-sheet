import { useState, type FormEvent } from "react";
import { ABILITIES, ABILITY_NAMES, newId, type Ability, type Spell } from "../types";
import { formatModifier, spellAttackBonus, spellSaveDC } from "../rules";
import { NumberField, Panel } from "./fields";
import { RollButton } from "./DiceTray";
import { setField, type SheetProps } from "./sheetProps";

const LEVEL_NAMES = ["Cantrips", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

function Casting({ c, update }: SheetProps) {
  const dc = spellSaveDC(c);
  const attack = spellAttackBonus(c);
  return (
    <Panel title="Spellcasting" className="casting-panel">
      <div className="vitals">
        <span className="field vital">
          <label className="field-label" htmlFor="cast-ability">
            Ability
          </label>
          <select
            id="cast-ability"
            value={c.spellcastingAbility ?? ""}
            onChange={(e) =>
              setField(
                update,
                "spellcastingAbility",
                e.target.value === "" ? null : (e.target.value as Ability)
              )
            }
          >
            <option value="">None</option>
            {ABILITIES.map((a) => (
              <option key={a} value={a}>
                {ABILITY_NAMES[a]}
              </option>
            ))}
          </select>
        </span>
        <div className="vital">
          <span className="field-label">Save DC</span>
          <span className="big">{dc ?? "—"}</span>
        </div>
        <div className="vital">
          <span className="field-label">Spell attack</span>
          {attack === null ? (
            <span className="big">—</span>
          ) : (
            <RollButton modifier={attack} label="Spell attack" className="big">
              {formatModifier(attack)}
            </RollButton>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Slots({ c, update }: SheetProps) {
  function setSlot(index: number, patch: { max?: number; used?: number }) {
    update((prev) => ({
      ...prev,
      spellSlots: prev.spellSlots.map((slot, i) => {
        if (i !== index) return slot;
        const max = patch.max ?? slot.max;
        return { max, used: Math.min(max, patch.used ?? slot.used) };
      }),
    }));
  }

  return (
    <Panel title="Spell slots" className="slots-panel">
      <ul className="slots">
        {c.spellSlots.map((slot, i) => (
          <li key={i} className="slot">
            <span className="slot-level">{LEVEL_NAMES[i + 1]}</span>
            <div className="pips" role="group" aria-label={`${LEVEL_NAMES[i + 1]} level slots used`}>
              {Array.from({ length: slot.max }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  className={`pip round ${n < slot.used ? "on" : ""}`}
                  aria-label={`Slot ${n + 1}${n < slot.used ? ", used" : ""}`}
                  aria-pressed={n < slot.used}
                  onClick={() => setSlot(i, { used: slot.used === n + 1 ? n : n + 1 })}
                />
              ))}
              {slot.max === 0 && <span className="muted">none</span>}
            </div>
            <NumberField
              label={`${LEVEL_NAMES[i + 1]} level slots`}
              hideLabel
              className="slot-max"
              value={slot.max}
              min={0}
              max={9}
              onChange={(v) => setSlot(i, { max: v })}
            />
          </li>
        ))}
      </ul>
      <p className="hint">Set how many slots you have on the right; tap a circle to mark it used.</p>
    </Panel>
  );
}

function SpellList({ c, update }: SheetProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(0);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const spell: Spell = { id: newId(), name: name.trim(), level, prepared: false, notes: "" };
    update((prev) => ({ ...prev, spells: [...prev.spells, spell] }));
    setName("");
  }

  function change(id: string, patch: Partial<Spell>) {
    update((prev) => ({
      ...prev,
      spells: prev.spells.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  const byLevel = LEVEL_NAMES.map((label, lvl) => ({
    label,
    spells: c.spells
      .filter((s) => s.level === lvl)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.spells.length > 0);

  const prepared = c.spells.filter((s) => s.level > 0 && s.prepared).length;

  return (
    <Panel
      title="Spells"
      className="spells-panel"
      actions={<span className="muted">{prepared} prepared</span>}
    >
      <form className="add-row" onSubmit={add}>
        <label htmlFor="spell-name" className="sr-only">
          Spell name
        </label>
        <input
          id="spell-name"
          value={name}
          placeholder="Spell name, e.g. Fire Bolt"
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="spell-level" className="sr-only">
          Spell level
        </label>
        <select id="spell-level" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
          {LEVEL_NAMES.map((label, i) => (
            <option key={i} value={i}>
              {i === 0 ? "Cantrip" : `${label} level`}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!name.trim()}>
          Add spell
        </button>
      </form>

      {byLevel.length === 0 ? (
        <p className="empty">No spells yet. Add the spells you know or have prepared.</p>
      ) : (
        byLevel.map((group) => (
          <div key={group.label} className="spell-group">
            <h3>{group.label === "Cantrips" ? group.label : `${group.label} level`}</h3>
            <ul>
              {group.spells.map((spell) => (
                <li key={spell.id} className="spell">
                  {spell.level > 0 ? (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={spell.prepared}
                        onChange={(e) => change(spell.id, { prepared: e.target.checked })}
                      />
                      <span className="sr-only">Prepared</span>
                    </label>
                  ) : (
                    <span className="check-spacer" />
                  )}
                  <span className="spell-name">{spell.name}</span>
                  <input
                    className="spell-notes"
                    aria-label={`${spell.name} notes`}
                    value={spell.notes}
                    placeholder="Notes"
                    onChange={(e) => change(spell.id, { notes: e.target.value })}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove ${spell.name}`}
                    onClick={() =>
                      update((prev) => ({
                        ...prev,
                        spells: prev.spells.filter((s) => s.id !== spell.id),
                      }))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </Panel>
  );
}

export function SpellsTab(props: SheetProps) {
  return (
    <div className="spells-layout">
      <div className="stack">
        <Casting {...props} />
        <Slots {...props} />
      </div>
      <SpellList {...props} />
    </div>
  );
}
