import { ABILITIES, ABILITY_SHORT, HIT_DIE_SIDES, newId, type Attack, type HitDieSides } from "../types";
import {
  attackBonus,
  damageFormula,
  formatModifier,
  hitDiceRemaining,
  longRest,
  spendHitDie,
} from "../rules";
import { criticalExpression, parseDice, rollDie } from "../dice";
import { NumberField, Panel, TextField } from "./fields";
import { RollButton } from "./DiceTray";
import { useDice } from "./diceContext";
import { setField, type SheetProps } from "./sheetProps";

function blankAttack(): Attack {
  return {
    id: newId(),
    name: "",
    ability: "str",
    proficient: true,
    magicBonus: 0,
    damageDice: "1d6",
    damageType: "",
    notes: "",
  };
}

function Attacks({ c, update }: SheetProps) {
  const { roll } = useDice();

  function change(id: string, patch: Partial<Attack>) {
    update((prev) => ({
      ...prev,
      attacks: prev.attacks.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }

  return (
    <Panel
      title="Attacks"
      className="attacks-panel"
      actions={
        <button
          type="button"
          onClick={() => update((prev) => ({ ...prev, attacks: [...prev.attacks, blankAttack()] }))}
        >
          Add attack
        </button>
      }
    >
      {c.attacks.length === 0 ? (
        <p className="empty">
          No attacks yet. Add your weapons and attack cantrips so you can roll them in one click.
        </p>
      ) : (
        <ul className="attack-list">
          {c.attacks.map((attack) => {
            const name = attack.name || "Unnamed attack";
            const formula = damageFormula(c, attack);
            const formulaValid = parseDice(formula) !== null;
            const crit = criticalExpression(formula);
            return (
              <li key={attack.id} className="attack">
                <div className="attack-summary">
                  <strong className="attack-name">{name}</strong>
                  <RollButton modifier={attackBonus(c, attack)} label={`${name} attack`}>
                    {formatModifier(attackBonus(c, attack))} to hit
                  </RollButton>
                  <button
                    type="button"
                    className="roll"
                    disabled={!formulaValid}
                    onClick={() => roll(formula, `${name} damage`)}
                  >
                    {formula} {attack.damageType}
                  </button>
                  {crit && (
                    <button
                      type="button"
                      className="roll subtle"
                      disabled={!formulaValid}
                      onClick={() => roll(crit, `${name} critical damage`)}
                    >
                      Crit
                    </button>
                  )}
                </div>
                <details>
                  <summary>Edit</summary>
                  <div className="attack-edit">
                    <TextField
                      label="Name"
                      value={attack.name}
                      onChange={(v) => change(attack.id, { name: v })}
                    />
                    <span className="field">
                      <label className="field-label" htmlFor={`ab-${attack.id}`}>
                        Ability
                      </label>
                      <select
                        id={`ab-${attack.id}`}
                        value={attack.ability}
                        onChange={(e) =>
                          change(attack.id, { ability: e.target.value as Attack["ability"] })
                        }
                      >
                        {ABILITIES.map((a) => (
                          <option key={a} value={a}>
                            {ABILITY_SHORT[a]}
                          </option>
                        ))}
                      </select>
                    </span>
                    <TextField
                      label="Damage dice"
                      value={attack.damageDice}
                      placeholder="1d8"
                      onChange={(v) => change(attack.id, { damageDice: v })}
                    />
                    <TextField
                      label="Damage type"
                      value={attack.damageType}
                      placeholder="slashing"
                      onChange={(v) => change(attack.id, { damageType: v })}
                    />
                    <NumberField
                      label="Magic bonus"
                      value={attack.magicBonus}
                      min={-10}
                      max={10}
                      onChange={(v) => change(attack.id, { magicBonus: v })}
                    />
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={attack.proficient}
                        onChange={(e) => change(attack.id, { proficient: e.target.checked })}
                      />
                      Proficient
                    </label>
                    <TextField
                      label="Notes"
                      className="wide"
                      value={attack.notes}
                      placeholder="Range, properties…"
                      onChange={(v) => change(attack.id, { notes: v })}
                    />
                    {!parseDice(attack.damageDice || "0") && (
                      <p className="error wide">
                        Damage dice must be dice notation, like 1d8 or 2d6.
                      </p>
                    )}
                    <button
                      type="button"
                      className="link danger"
                      onClick={() =>
                        update((prev) => ({
                          ...prev,
                          attacks: prev.attacks.filter((a) => a.id !== attack.id),
                        }))
                      }
                    >
                      Remove {name}
                    </button>
                  </div>
                </details>
                {attack.notes && <p className="attack-notes">{attack.notes}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function SaveBoxes({
  label,
  count,
  onChange,
  tone,
}: {
  label: string;
  count: number;
  onChange: (n: number) => void;
  tone: string;
}) {
  return (
    <div className="death-row">
      <span>{label}</span>
      <div className="pips" role="group" aria-label={`Death save ${label.toLowerCase()}`}>
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={`pip round ${tone} ${count >= n ? "on" : ""}`}
            aria-label={`${label} ${n}`}
            aria-pressed={count >= n}
            onClick={() => onChange(count === n ? n - 1 : n)}
          />
        ))}
      </div>
    </div>
  );
}

function DeathSaves({ c, update }: SheetProps) {
  const { check } = useDice();
  const { successes, failures } = c.deathSaves;
  const status =
    successes >= 3 ? "Stable" : failures >= 3 ? "Dead" : c.currentHp > 0 ? "Conscious" : "Dying";

  function set(patch: Partial<typeof c.deathSaves>) {
    update((prev) => ({ ...prev, deathSaves: { ...prev.deathSaves, ...patch } }));
  }

  return (
    <Panel title="Death saves" className="death-panel">
      {status !== "Conscious" && (
        <p className={`death-status ${status.toLowerCase()}`}>{status}</p>
      )}
      <SaveBoxes label="Successes" count={successes} tone="good" onChange={(n) => set({ successes: n })} />
      <SaveBoxes label="Failures" count={failures} tone="bad" onChange={(n) => set({ failures: n })} />
      <div className="row">
        <button type="button" onClick={() => check(0, "Death save")}>
          Roll death save
        </button>
        <button type="button" className="link" onClick={() => set({ successes: 0, failures: 0 })}>
          Reset
        </button>
      </div>
      <p className="hint">10 or higher is a success. A 1 counts as two failures; a 20 brings you back with 1 HP.</p>
    </Panel>
  );
}

function Recovery({ c, update }: SheetProps) {
  const { roll } = useDice();
  const remaining = hitDiceRemaining(c);

  function spend() {
    const value = rollDie(c.hitDieSides);
    // Show the raw die in the log, then heal by die + Con.
    roll(`${value}`, `Hit die (d${c.hitDieSides} rolled ${value})`);
    update((prev) => spendHitDie(prev, value));
  }

  return (
    <Panel title="Hit dice & rests" className="rest-panel">
      <div className="row">
        <span className="field">
          <label className="field-label" htmlFor="hit-die">
            Hit die
          </label>
          <select
            id="hit-die"
            value={c.hitDieSides}
            onChange={(e) =>
              setField(update, "hitDieSides", Number(e.target.value) as HitDieSides)
            }
          >
            {HIT_DIE_SIDES.map((s) => (
              <option key={s} value={s}>
                d{s}
              </option>
            ))}
          </select>
        </span>
        <span className="field">
          <span className="field-label">Remaining</span>
          <span className="big">
            {remaining} / {c.level}
          </span>
        </span>
      </div>
      <div className="row">
        <button type="button" disabled={remaining === 0 || c.currentHp >= c.maxHp} onClick={spend}>
          Spend a hit die
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Take a long rest? This restores HP, spell slots and hit dice.")) {
              update(longRest);
            }
          }}
        >
          Long rest
        </button>
      </div>
      <p className="hint">
        Short rest: spend hit dice to heal (roll + Con modifier). Long rest: full HP, all spell
        slots, half your hit dice back, and one less level of exhaustion.
      </p>
    </Panel>
  );
}

export function CombatTab(props: SheetProps) {
  return (
    <div className="combat">
      <Attacks {...props} />
      <div className="stack">
        <DeathSaves {...props} />
        <Recovery {...props} />
      </div>
    </div>
  );
}
