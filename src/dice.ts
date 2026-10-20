// Dice notation parsing and rolling. `rng` is injectable so tests can use a
// predictable sequence instead of Math.random.

export type Rng = () => number; // returns a number in [0, 1)

export interface DiceTerm {
  count: number;
  sides: number;
  sign: 1 | -1;
}

export interface ParsedDice {
  terms: DiceTerm[];
  modifier: number;
}

export interface RollResult {
  label: string;
  expression: string;
  rolls: { sides: number; value: number; sign: 1 | -1 }[];
  modifier: number;
  total: number;
  // Set for d20 rolls, so the UI can show advantage/crits.
  d20?: { kept: number; dropped?: number; mode: RollMode };
  at: number;
}

export type RollMode = "normal" | "advantage" | "disadvantage";

const MAX_DICE = 100;
const MAX_SIDES = 1000;

// Parses notation like "d20", "2d6+3", "1d8 + 1d6 - 1", "5".
// Returns null if the text isn't valid dice notation.
export function parseDice(input: string): ParsedDice | null {
  const text = input.replace(/\s+/g, "").toLowerCase();
  if (text === "") return null;
  const tokens = text.match(/[+-]?[^+-]+/g);
  if (!tokens || tokens.join("") !== text) return null;

  const terms: DiceTerm[] = [];
  let modifier = 0;
  for (const token of tokens) {
    const sign: 1 | -1 = token.startsWith("-") ? -1 : 1;
    const body = token.replace(/^[+-]/, "");
    const dice = body.match(/^(\d*)d(\d+)$/);
    if (dice) {
      const count = dice[1] === "" ? 1 : Number(dice[1]);
      const sides = Number(dice[2]);
      if (count < 1 || count > MAX_DICE || sides < 2 || sides > MAX_SIDES) {
        return null;
      }
      terms.push({ count, sides, sign });
    } else if (/^\d+$/.test(body)) {
      modifier += sign * Number(body);
    } else {
      return null;
    }
  }
  return { terms, modifier };
}

export function rollDie(sides: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * sides) + 1;
}

export function rollExpression(
  expression: string,
  label = expression,
  rng: Rng = Math.random
): RollResult | null {
  const parsed = parseDice(expression);
  if (!parsed) return null;
  const rolls: RollResult["rolls"] = [];
  for (const term of parsed.terms) {
    for (let i = 0; i < term.count; i++) {
      rolls.push({ sides: term.sides, value: rollDie(term.sides, rng), sign: term.sign });
    }
  }
  const total =
    rolls.reduce((sum, r) => sum + r.sign * r.value, 0) + parsed.modifier;
  return {
    label,
    expression,
    rolls,
    modifier: parsed.modifier,
    total,
    at: Date.now(),
  };
}

// Rolls a d20 check with a modifier, optionally with advantage/disadvantage.
export function rollD20(
  modifier: number,
  label: string,
  mode: RollMode = "normal",
  rng: Rng = Math.random
): RollResult {
  const first = rollDie(20, rng);
  let kept = first;
  let dropped: number | undefined;
  if (mode !== "normal") {
    const second = rollDie(20, rng);
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    kept = mode === "advantage" ? high : low;
    dropped = mode === "advantage" ? low : high;
  }
  const sign = modifier >= 0 ? "+" : "-";
  return {
    label,
    expression: modifier === 0 ? "1d20" : `1d20${sign}${Math.abs(modifier)}`,
    rolls: [{ sides: 20, value: kept, sign: 1 }],
    modifier,
    total: kept + modifier,
    d20: { kept, dropped, mode },
    at: Date.now(),
  };
}

// Doubles the number of dice, for critical hits: "1d8+3" -> "2d8+3".
export function criticalExpression(expression: string): string | null {
  const parsed = parseDice(expression);
  if (!parsed) return null;
  const parts = parsed.terms.map(
    (t, i) => `${t.sign < 0 ? "-" : i === 0 ? "" : "+"}${t.count * 2}d${t.sides}`
  );
  if (parsed.modifier !== 0) {
    parts.push(`${parsed.modifier > 0 ? "+" : "-"}${Math.abs(parsed.modifier)}`);
  }
  return parts.join("") || "0";
}
