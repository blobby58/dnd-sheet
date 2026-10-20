import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { rollD20, rollExpression, type RollMode, type RollResult } from "../dice";
import { DiceContext, useDice, type DiceApi } from "./diceContext";

const QUICK_DICE = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
const HISTORY_LIMIT = 30;

function describeRolls(result: RollResult): string {
  if (result.d20) {
    const { kept, dropped } = result.d20;
    const dice = dropped === undefined ? `${kept}` : `${kept} (dropped ${dropped})`;
    return result.modifier === 0
      ? dice
      : `${dice} ${result.modifier > 0 ? "+" : "−"} ${Math.abs(result.modifier)}`;
  }
  const parts = result.rolls.map((r, i) =>
    i === 0 ? (r.sign < 0 ? `−${r.value}` : `${r.value}`) : `${r.sign < 0 ? "−" : "+"} ${r.value}`
  );
  if (result.modifier !== 0) {
    parts.push(`${result.modifier > 0 ? "+" : "−"} ${Math.abs(result.modifier)}`);
  }
  return parts.join(" ") || "0";
}

function rollTone(result: RollResult): "crit" | "fumble" | "" {
  if (!result.d20) return "";
  if (result.d20.kept === 20) return "crit";
  if (result.d20.kept === 1) return "fumble";
  return "";
}

export function DiceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<RollMode>("normal");
  const [history, setHistory] = useState<RollResult[]>([]);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");

  const push = useCallback((result: RollResult) => {
    setHistory((prev) => [result, ...prev].slice(0, HISTORY_LIMIT));
  }, []);

  const api: DiceApi = useMemo(
    () => ({
      mode,
      check: (modifier, label) => {
        push(rollD20(modifier, label, mode));
        // Advantage/disadvantage only applies to the next check.
        setMode("normal");
      },
      roll: (expression, label) => {
        const result = rollExpression(expression, label);
        if (result) push(result);
      },
    }),
    [mode, push]
  );

  function rollCustom(e: FormEvent) {
    e.preventDefault();
    const result = rollExpression(custom, custom.trim());
    if (!result) {
      setError("Use dice notation, like 2d6+3 or d20-1.");
      return;
    }
    setError("");
    push(result);
  }

  const latest = history[0];

  return (
    <DiceContext.Provider value={api}>
      {children}
      <aside className={`tray ${open ? "tray-open" : ""}`} aria-label="Dice roller">
        <div className="tray-bar">
          <div className="latest" aria-live="polite">
            {latest ? (
              <>
                <span className={`latest-total ${rollTone(latest)}`} key={latest.at}>
                  {latest.total}
                </span>
                <span className="latest-detail">
                  <strong>{latest.label}</strong>
                  <span>
                    {latest.expression} · {describeRolls(latest)}
                    {rollTone(latest) === "crit" && " · natural 20"}
                    {rollTone(latest) === "fumble" && " · natural 1"}
                  </span>
                </span>
              </>
            ) : (
              <span className="latest-empty">
                Click any bonus on the sheet to roll it.
              </span>
            )}
          </div>
          <div className="mode" role="group" aria-label="Next d20 roll">
            {(["disadvantage", "normal", "advantage"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                className={mode === m ? "active" : ""}
                onClick={() => setMode(m)}
              >
                {m === "normal" ? "Normal" : m === "advantage" ? "Adv" : "Dis"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tray-toggle"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide dice" : "Dice"}
          </button>
        </div>

        {open && (
          <div className="tray-body">
            <div className="quick">
              {QUICK_DICE.map((d) => (
                <button key={d} type="button" onClick={() => api.roll(`1${d}`, d)}>
                  {d}
                </button>
              ))}
            </div>
            <form className="custom" onSubmit={rollCustom}>
              <label htmlFor="custom-roll" className="sr-only">
                Dice to roll
              </label>
              <input
                id="custom-roll"
                value={custom}
                placeholder="e.g. 4d6+2"
                onChange={(e) => setCustom(e.target.value)}
              />
              <button type="submit">Roll</button>
            </form>
            {error && <p className="error">{error}</p>}
            <ol className="history">
              {history.slice(1).map((r) => (
                <li key={r.at + r.label + r.total}>
                  <span className={`history-total ${rollTone(r)}`}>{r.total}</span>
                  <span className="history-label">{r.label}</span>
                  <span className="history-detail">{describeRolls(r)}</span>
                </li>
              ))}
            </ol>
            {history.length > 1 && (
              <button type="button" className="link" onClick={() => setHistory([])}>
                Clear history
              </button>
            )}
          </div>
        )}
      </aside>
    </DiceContext.Provider>
  );
}

// A bonus you can click to roll (e.g. a skill or saving throw).
export function RollButton({
  modifier,
  label,
  className,
  children,
}: {
  modifier: number;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const { check } = useDice();
  return (
    <button
      type="button"
      className={`roll ${className ?? ""}`}
      onClick={() => check(modifier, label)}
      title={`Roll ${label}`}
    >
      {children}
    </button>
  );
}
