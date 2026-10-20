import { useState, type FormEvent } from "react";
import {
  ABILITIES,
  ABILITY_NAMES,
  ABILITY_SHORT,
  CONDITIONS,
  SKILLS,
  SKILL_ABILITY,
  SKILL_NAMES,
} from "../types";
import {
  abilityModifier,
  applyDamage,
  applyHealing,
  formatModifier,
  initiative,
  nextTraining,
  passivePerception,
  prof,
  savingThrowBonus,
  skillBonus,
  skillTraining,
} from "../rules";
import { NumberField, Panel, ProficiencyDot } from "./fields";
import { RollButton } from "./DiceTray";
import { setField, toggleIn, type SheetProps } from "./sheetProps";

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Abilities({ c, update }: SheetProps) {
  return (
    <Panel title="Abilities & saves" className="abilities-panel">
      <ul className="abilities">
        {ABILITIES.map((ability) => {
          const modifier = abilityModifier(c.abilityScores[ability]);
          const saveProficient = c.savingThrowProficiencies.includes(ability);
          return (
            <li key={ability} className="ability">
              <span className="ability-name">{ABILITY_NAMES[ability]}</span>
              <RollButton
                modifier={modifier}
                label={`${ABILITY_NAMES[ability]} check`}
                className="ability-mod"
              >
                {formatModifier(modifier)}
              </RollButton>
              <NumberField
                label={`${ABILITY_NAMES[ability]} score`}
                hideLabel
                className="ability-score"
                value={c.abilityScores[ability]}
                min={1}
                max={30}
                onChange={(score) =>
                  update((prev) => ({
                    ...prev,
                    abilityScores: { ...prev.abilityScores, [ability]: score },
                  }))
                }
              />
              <span className="save">
                <ProficiencyDot
                  state={saveProficient ? "proficient" : "none"}
                  label={`${ABILITY_NAMES[ability]} saving throw`}
                  onClick={() =>
                    update((prev) => ({
                      ...prev,
                      savingThrowProficiencies: toggleIn(
                        prev.savingThrowProficiencies,
                        ability
                      ),
                    }))
                  }
                />
                <span>Save</span>
                <RollButton
                  modifier={savingThrowBonus(c, ability)}
                  label={`${ABILITY_NAMES[ability]} save`}
                >
                  {formatModifier(savingThrowBonus(c, ability))}
                </RollButton>
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function Skills({ c, update }: SheetProps) {
  return (
    <Panel title="Skills" className="skills-panel">
      <ul className="skills">
        {SKILLS.map((skill) => {
          const training = skillTraining(c, skill);
          const bonus = skillBonus(c, skill);
          return (
            <li key={skill} className={`skill skill-${training}`}>
              <ProficiencyDot
                state={training}
                label={SKILL_NAMES[skill]}
                onClick={() =>
                  update((prev) => {
                    const next = nextTraining(skillTraining(prev, skill));
                    const skillTrainingMap = { ...prev.skillTraining };
                    if (next === "none") delete skillTrainingMap[skill];
                    else skillTrainingMap[skill] = next;
                    return { ...prev, skillTraining: skillTrainingMap };
                  })
                }
              />
              <span className="skill-name">{SKILL_NAMES[skill]}</span>
              <span className="skill-ability">{ABILITY_SHORT[SKILL_ABILITY[skill]]}</span>
              <RollButton modifier={bonus} label={SKILL_NAMES[skill]}>
                {formatModifier(bonus)}
              </RollButton>
            </li>
          );
        })}
      </ul>
      <p className="hint">Click a dot to cycle: not trained, proficient, expertise.</p>
    </Panel>
  );
}

function HitPoints({ c, update }: SheetProps) {
  const [amount, setAmount] = useState("");
  const value = Math.floor(Number(amount));
  const valid = amount.trim() !== "" && Number.isFinite(value) && value > 0;

  function apply(kind: "damage" | "heal" | "temp") {
    if (!valid) return;
    update((prev) => {
      if (kind === "damage") return applyDamage(prev, value);
      if (kind === "heal") return applyHealing(prev, value);
      return { ...prev, tempHp: Math.max(prev.tempHp, value) };
    });
    setAmount("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply("damage");
  }

  const ratio = c.maxHp > 0 ? c.currentHp / c.maxHp : 0;
  const tone = c.currentHp === 0 ? "down" : ratio <= 0.25 ? "low" : ratio <= 0.5 ? "mid" : "";

  return (
    <Panel title="Hit points" className="hp-panel">
      <div className={`hp-readout ${tone}`}>
        <span className="hp-current">{c.currentHp}</span>
        <span className="hp-max">of {c.maxHp}</span>
        {c.tempHp > 0 && <span className="hp-temp">+{c.tempHp} temp</span>}
      </div>
      <div
        className="hp-bar"
        role="meter"
        aria-label="Hit points"
        aria-valuemin={0}
        aria-valuemax={c.maxHp}
        aria-valuenow={c.currentHp}
      >
        <span style={{ width: `${Math.min(100, ratio * 100)}%` }} className={tone} />
      </div>
      <form className="hp-change" onSubmit={onSubmit}>
        <label htmlFor="hp-amount" className="sr-only">
          Amount
        </label>
        <input
          id="hp-amount"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" disabled={!valid} className="danger">
          Damage
        </button>
        <button type="button" disabled={!valid} onClick={() => apply("heal")}>
          Heal
        </button>
        <button type="button" disabled={!valid} onClick={() => apply("temp")}>
          Temp
        </button>
      </form>
      <div className="row">
        <NumberField
          label="Current"
          value={c.currentHp}
          min={0}
          max={c.maxHp}
          onChange={(v) => setField(update, "currentHp", v)}
        />
        <NumberField
          label="Max"
          value={c.maxHp}
          min={1}
          max={9999}
          onChange={(v) =>
            update((prev) => ({
              ...prev,
              maxHp: v,
              currentHp: Math.min(prev.currentHp, v),
            }))
          }
        />
        <NumberField
          label="Temp"
          value={c.tempHp}
          min={0}
          max={9999}
          onChange={(v) => setField(update, "tempHp", v)}
        />
      </div>
    </Panel>
  );
}

function Vitals({ c, update }: SheetProps) {
  return (
    <Panel title="Vitals" className="vitals-panel">
      <div className="vitals">
        <div className="vital">
          <NumberField
            label="Armour class"
            value={c.armorClass}
            min={0}
            max={99}
            onChange={(v) => setField(update, "armorClass", v)}
          />
        </div>
        <div className="vital">
          <span className="field-label">Initiative</span>
          <RollButton modifier={initiative(c)} label="Initiative" className="big">
            {formatModifier(initiative(c))}
          </RollButton>
        </div>
        <div className="vital">
          <NumberField
            label="Speed (ft)"
            value={c.speed}
            min={0}
            max={999}
            step={5}
            onChange={(v) => setField(update, "speed", v)}
          />
        </div>
        <div className="vital">
          <span className="field-label">Proficiency</span>
          <span className="big">{formatModifier(prof(c))}</span>
        </div>
        <div className="vital">
          <span className="field-label">Passive Perception</span>
          <span className="big">{passivePerception(c)}</span>
        </div>
        <div className="vital">
          <NumberField
            label="Initiative bonus"
            value={c.initiativeBonus}
            min={-20}
            max={20}
            onChange={(v) => setField(update, "initiativeBonus", v)}
          />
        </div>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={c.inspiration}
          onChange={(e) => setField(update, "inspiration", e.target.checked)}
        />
        Heroic inspiration
      </label>
    </Panel>
  );
}

function Conditions({ c, update }: SheetProps) {
  return (
    <Panel title="Conditions" className="conditions-panel">
      <div className="chips">
        {CONDITIONS.filter((cond) => cond !== "exhaustion").map((cond) => {
          const on = c.conditions.includes(cond);
          return (
            <button
              key={cond}
              type="button"
              className={`chip ${on ? "on" : ""}`}
              aria-pressed={on}
              onClick={() =>
                update((prev) => ({ ...prev, conditions: toggleIn(prev.conditions, cond) }))
              }
            >
              {capitalise(cond)}
            </button>
          );
        })}
      </div>
      <div className="exhaustion">
        <span className="field-label">Exhaustion</span>
        <div className="pips" role="group" aria-label="Exhaustion level">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              className={`pip ${c.exhaustionLevel >= n ? "on" : ""}`}
              aria-label={`Exhaustion level ${n}`}
              aria-pressed={c.exhaustionLevel >= n}
              onClick={() =>
                setField(update, "exhaustionLevel", c.exhaustionLevel === n ? n - 1 : n)
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// The left column: what you look up most, so it never moves.
export function MainStats(props: SheetProps) {
  return (
    <div className="stack">
      <Abilities {...props} />
      <Skills {...props} />
    </div>
  );
}

export function Status(props: SheetProps) {
  return (
    <div className="status">
      <HitPoints {...props} />
      <Vitals {...props} />
      <Conditions {...props} />
    </div>
  );
}
