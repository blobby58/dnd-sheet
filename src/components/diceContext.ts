import { createContext, useContext } from "react";
import type { RollMode } from "../dice";

export interface DiceApi {
  // Roll a d20 check with this modifier, using the tray's current mode.
  check: (modifier: number, label: string) => void;
  // Roll any dice expression, e.g. "2d6+3".
  roll: (expression: string, label: string) => void;
  mode: RollMode;
}

export const DiceContext = createContext<DiceApi | null>(null);

export function useDice(): DiceApi {
  const api = useContext(DiceContext);
  if (!api) throw new Error("useDice must be used inside <DiceProvider>");
  return api;
}
